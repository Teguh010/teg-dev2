import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { format } from 'date-fns';

interface Setting {
  title: string
  value: string | number | boolean
}

// Initial state untuk history
interface HistoryState {
  dataObjectTrajectory: any[]
  historyVehicle: any | null
  startDate: string | null
  endDate: string | null
  isRefresh: boolean
  dateFormat: string
  timeFormat: string
  dataObjectFuelLevel: any[]
  isGenerate: boolean
  dataObjectList: any[]
  vehicle: any | null
  unitDistance: string
  unitVolume: string
  settings: Setting[]
  isFuelData: boolean
}

const initialState: HistoryState = {
  dataObjectTrajectory: [],
  historyVehicle: null,
  startDate: null,
  endDate: null,
  isRefresh: true,
  dateFormat: 'yyyy-MM-dd',
  timeFormat: 'HH:mm:ss',
  dataObjectFuelLevel: [],
  isGenerate: false,
  dataObjectList: [],
  vehicle: null,
  unitDistance: 'km',
  unitVolume: 'lt',
  settings: [],
  isFuelData: false,
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    setHistoryVehicle: (state, action: PayloadAction<any>) => {
      state.historyVehicle = action.payload;
    },
    setStartDate: (state, action: PayloadAction<string | null>) => {
      state.startDate = action.payload;
    },
    setEndDate: (state, action: PayloadAction<string | null>) => {
      state.endDate = action.payload;
    },
    setRefresh: (state, action: PayloadAction<boolean>) => {
      state.isRefresh = action.payload;
    },
    setDataObjectTrajectory: (state, action: PayloadAction<any[]>) => {
      state.dataObjectTrajectory = action.payload;
    },
    setDataObjectFuelLevel: (state, action: PayloadAction<any[]>) => {
      state.dataObjectFuelLevel = action.payload;
    },
    setGenerate: (state, action: PayloadAction<boolean>) => {
      state.isGenerate = action.payload;
    },
    setDataObjectList: (state, action: PayloadAction<any[]>) => {
      state.dataObjectList = action.payload;
    },
    setVehicle: (state, action: PayloadAction<any>) => {
      state.vehicle = action.payload;
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
    setIsFuelData: (state, action: PayloadAction<boolean>) => {
      state.isFuelData = action.payload;
    },
  },
});

export const {
  setHistoryVehicle,
  setStartDate,
  setEndDate,
  setRefresh,
  setDataObjectTrajectory,
  setDataObjectFuelLevel,
  setGenerate,
  setDataObjectList,
  setVehicle,
  setSettings,
  setIsFuelData
} = historySlice.actions;

export default historySlice.reducer;
