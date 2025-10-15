import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { format } from 'date-fns';
import { handleSelectHistoryDataStore } from './history-thunks'; // Impor thunk di sini

interface Setting {
  title: string
  value: string | number | boolean
}

// Initial state untuk history
interface HistoryState {
  dataObjectTripStop: any[]
  dataObjectTripStopTotals: any
  dataObjectTrajectory: any[]
  dataObjectList: any[]
  historyVehicle: any | null
  chartData: any | null
  startDate: string | null
  minMoving: number | null
  minStationary: number | null
  showStationaryIgnition: boolean
  endDate: string | null
  isGenerate: boolean
  isRefresh: boolean
  isPageLoading: boolean
  unitDistance: string
  unitVolume: string
  dateFormat: string
  timeFormat: string
  settings: Setting[]

  isLoading: boolean
  error: string | null

  selectedHistoryData: any
  addressData: any
  stopIndex: any
  allowZoom: boolean
  allowZooming: boolean
  label: string
}

const initialState: HistoryState = {
  dataObjectTripStop: [],
  dataObjectTripStopTotals: {},
  dataObjectTrajectory: [],
  dataObjectList: [],
  historyVehicle: null,
  chartData: {},
  startDate: null,
  endDate: null,
  minMoving: 1, // default value
  minStationary: 1, // default value
  showStationaryIgnition: true, // default value  endDate: null,
  isGenerate: false,
  isRefresh: true,
  isPageLoading: true,
  unitDistance: 'km', // default value
  unitVolume: 'lt', // default value
  dateFormat: 'yyyy-MM-dd', // default value
  timeFormat: 'HH:mm:ss', // default value
  settings: [],

  selectedHistoryData: null,
  addressData: null,
  isLoading: false,
  error: null,
  stopIndex: null,
  allowZoom: false,
  allowZooming: false,
  label: ''
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    setHistoryVehicle: (state, action: PayloadAction<any>) => {
      state.historyVehicle = action.payload;
    },
      setChartData: (state, action: PayloadAction<any>) => {
      state.chartData = action.payload;
    },
    setStartDate: (state, action: PayloadAction<string | null>) => {
      state.startDate = action.payload;
    },
    setMinMoving(state, action) {
      state.minMoving = action.payload;
    },
    setMinStationary(state, action) {
      state.minStationary = action.payload;
    },
    setShowStationaryIgnition(state, action) {
      state.showStationaryIgnition = action.payload;
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

    setSelectedHistoryData: (state, action: PayloadAction<any>) => {
      state.selectedHistoryData = action.payload;
    },
    setAllowZooming: (state, action: PayloadAction<boolean>) => {
      state.allowZooming = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(handleSelectHistoryDataStore.fulfilled, (state, action) => {
      state.selectedHistoryData = action.payload.data;
      state.addressData = action.payload.addressData;
      state.stopIndex = action.payload.stopIndex;
      state.allowZoom = action.payload.allowZoom;
      state.label = action.payload.label;
    });
  },
});

export const {
  setHistoryVehicle,
  setChartData,
  setStartDate,
  setEndDate,
  setGenerate,
  setRefresh,
  setIsPageLoading,
  setDataObjectTripStop,
  setDataObjectTripStopTotals,
  setDataObjectTrajectory,
  setDataObjectList,
  setSettings,
  setMinMoving,
  setMinStationary,
  setShowStationaryIgnition,
  setAllowZooming,
} = historySlice.actions;

export default historySlice.reducer;
