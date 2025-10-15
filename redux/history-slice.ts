// historySlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { objectList, objectTripStop, objectTrajectoryNormalized } from '@/models/object';
import { cleanObjectsColumns } from '@/lib/utils';
import { filterData, filterTotals, filterTrajectoryData } from '@/lib/map-filters'; // Import dari file historyFilters

import { format } from 'date-fns';

interface Setting {
  title: string;
  value: string | number | boolean;
}

// Initial state untuk history
interface HistoryState {
  dataObjectTripStop: any[];
  dataObjectTripStopTotals: any;
  dataObjectTrajectory: any[];
  dataObjectList: any[];
  vehicle: any | null;
  startDate: string | null;
  endDate: string | null;
  isGenerate: boolean;
  isRefresh: boolean;
  isPageLoading: boolean;
  unitDistance: string;
  unitVolume: string;
  dateFormat: string;
  timeFormat: string;
  settings: Setting[];
}

const initialState: HistoryState = {
  dataObjectTripStop: [],
  dataObjectTripStopTotals: {},
  dataObjectTrajectory: [],
  dataObjectList: [],
  vehicle: null,
  startDate: null,
  endDate: null,
  isGenerate: false,
  isRefresh: true,
  isPageLoading: true,
  unitDistance: 'km',  // default value
  unitVolume: 'lt',    // default value
  dateFormat: 'yyyy-MM-dd', // default value
  timeFormat: 'HH:mm:ss',   // default value
  settings: [],
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    setVehicle: (state, action: PayloadAction<any>) => {
      state.vehicle = action.payload;
    },
    setStartDate: (state, action: PayloadAction<string | null>) => {
      state.startDate = action.payload;
    },
    setEndDate: (state, action: PayloadAction<string | null>) => {
      state.endDate = action.payload;
    },
    setGenerate: (state, action: PayloadAction<boolean>) => {
      state.isGenerate = action.payload;
    },
    setRefresh: (state, action: PayloadAction<boolean>) => {
      state.isRefresh = action.payload;
    },
    setIsPageLoading: (state, action: PayloadAction<boolean>) => {
      state.isPageLoading = action.payload;
    },
    setDataObjectTripStop: (state, action: PayloadAction<any[]>) => {
      state.dataObjectTripStop = action.payload;
    },
    setDataObjectTripStopTotals: (state, action: PayloadAction<any>) => {
      state.dataObjectTripStopTotals = action.payload;
    },
    setDataObjectTrajectory: (state, action: PayloadAction<any[]>) => {
      state.dataObjectTrajectory = action.payload;
    },
    setDataObjectList: (state, action: PayloadAction<any[]>) => {
      state.dataObjectList = action.payload;
    },
    setSettings: (state, action: PayloadAction<any[]>) => {
      action.payload.forEach((setting) => {
        if (setting.title === 'time_format') {
          state.timeFormat = setting.value;
        }
        if (setting.title === 'unit_distance') {
          state.unitDistance = setting.value;
        }
        if (setting.title === 'unit_volume') {
          state.unitVolume = setting.value;
        }
        if (setting.title === 'date_format') {
          state.dateFormat = setting.value;
        }
      });
    },
  },
});

// Thunk untuk mengambil data object list
export const fetchDataObjectList = (userToken: string) => async (dispatch: any) => {
  dispatch(historySlice.actions.setIsPageLoading(true));
  try {
    const dataObjectListResponse = await objectList(userToken);

    const dataObjectList = Array.isArray(dataObjectListResponse) ? dataObjectListResponse : [];
    dispatch(historySlice.actions.setDataObjectList(dataObjectList));
  } catch (error) {
    console.error('Error fetching object list:', error);
  } finally {
    dispatch(historySlice.actions.setIsPageLoading(false));
  }
};

// Thunk untuk mengambil data trip stop
export const fetchDataObjectTripStop = (userToken: string, vehicle: any, startDate: string, endDate: string) => async (dispatch: any, getState: any) => {
  if (!userToken || !vehicle || !startDate || !endDate) return;

  const state = getState().history;
  const { unitDistance, unitVolume, dateFormat, timeFormat } = state;

  dispatch(historySlice.actions.setGenerate(true));
  try {
    const params = {
      "object_id": vehicle.id,
      "time_from": format(startDate, "yyyy-MM-dd HH:mm:ss"),
      "time_to": format(endDate, "yyyy-MM-dd HH:mm:ss"),
  };
    const dataObjectTripStop = await objectTripStop(userToken, params);

    if (dataObjectTripStop.data) {
      const dataObjectTripStopClean = cleanObjectsColumns(dataObjectTripStop.data);
      const filteredData = filterData(dataObjectTripStopClean, dateFormat, timeFormat, unitDistance, unitVolume, (key) => key);
      dispatch(historySlice.actions.setDataObjectTripStop(filteredData));
    }

    if (dataObjectTripStop.totals) {
      // Pastikan semua property bertipe number jika dibutuhkan oleh MapData
      const totals = {
        ...dataObjectTripStop.totals,
        distance: typeof dataObjectTripStop.totals.distance === "string"
          ? Number(dataObjectTripStop.totals.distance)
          : dataObjectTripStop.totals.distance,
        fuel_used: typeof dataObjectTripStop.totals.fuel_used === "string"
          ? Number(dataObjectTripStop.totals.fuel_used)
          : dataObjectTripStop.totals.fuel_used ?? 0,
        fuel_norm: typeof dataObjectTripStop.totals.fuel_norm === "string"
          ? Number(dataObjectTripStop.totals.fuel_norm)
          : dataObjectTripStop.totals.fuel_norm ?? 0,
        fuel_km: typeof dataObjectTripStop.totals.fuel_km === "string"
          ? Number(dataObjectTripStop.totals.fuel_km)
          : dataObjectTripStop.totals.fuel_km ?? 0,
        avg_speed: typeof dataObjectTripStop.totals.avg_speed === "string"
          ? Number(dataObjectTripStop.totals.avg_speed)
          : dataObjectTripStop.totals.avg_speed ?? 0,
      };
      const filteredTotals = filterTotals(totals, unitDistance, unitVolume, (key) => key);
      dispatch(historySlice.actions.setDataObjectTripStopTotals(filteredTotals));
    }
  } catch (error) {
    console.error('Error fetching trip stop data:', error);
  } finally {
    dispatch(historySlice.actions.setGenerate(false));
    dispatch(historySlice.actions.setRefresh(false));
  }
};

// Thunk untuk mengambil data trajectory
export const fetchDataObjectTrajectory = (userToken: string, vehicle: any, startDate: string, endDate: string) => async (dispatch: any, getState: any) => {
  if (!userToken || !vehicle || !startDate || !endDate) return;

  const state = getState().history;
  const { unitDistance, dateFormat, timeFormat } = state;

  try {
    const dataObjectTrajectory = await objectTrajectoryNormalized(userToken, vehicle, startDate, endDate);
    if (dataObjectTrajectory) {
      const dataObjectTrajectoryClean = cleanObjectsColumns(dataObjectTrajectory);
      const filteredData = filterTrajectoryData(dataObjectTrajectoryClean, dateFormat, timeFormat, unitDistance, (key) => key);
      dispatch(historySlice.actions.setDataObjectTrajectory(filteredData));
    }
  } catch (error) {
    console.error('Error fetching trajectory data:', error);
  } finally {
    dispatch(historySlice.actions.setRefresh(false));
  }
};

export const { setVehicle, setStartDate, setEndDate, setGenerate, setRefresh, setIsPageLoading, setDataObjectTripStop, setDataObjectTripStopTotals, setDataObjectTrajectory, setDataObjectList, setSettings } = historySlice.actions;

export default historySlice.reducer;
