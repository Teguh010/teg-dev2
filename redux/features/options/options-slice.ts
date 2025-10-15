import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { tachoLiveDrivingStateStatsResult } from '@/types/tachograph';
import i18n from 'i18next'; // Import i18n instance

interface MainMapState {
  vehicle: any | null
  isPageLoading: boolean
  dataWorkerList: any[]
  tachoLiveData: tachoLiveDrivingStateStatsResult | null
  ignoreList: any[]
  formData: {
    name: string
    surname: string
    phone: string
    email: string
  }
  selectedVehicle: any | null
  dataObjectList: any[]
  isGenerate: boolean;
}

const initialState: MainMapState = {
  vehicle: null,
  isPageLoading: true,
  dataWorkerList: [],
  tachoLiveData: null,
  ignoreList: [
    { title: 'id' }
  ],
  formData: {
    name: '',
    surname: '',
    phone: '',
    email: ''
  },
  selectedVehicle: null,
  dataObjectList: [],
  isGenerate: false,
};

const mapsSlice = createSlice({
  name: 'maps',
  initialState,
  reducers: {
    setVehicle: (state, action: PayloadAction<any>) => {
      state.vehicle = action.payload;
    },
    setIsPageLoading: (state, action: PayloadAction<boolean>) => {
      state.isPageLoading = action.payload;
    },
    setDataWorkerList: (state, action: PayloadAction<any[]>) => {
      state.dataWorkerList = action.payload;
    },
    setFormData: (state, action: PayloadAction<{ name: string, value: string }>) => {
      state.formData[action.payload.name] = action.payload.value;
    },
    setTachoLiveData: (state, action: PayloadAction<tachoLiveDrivingStateStatsResult>) => {
      state.tachoLiveData = action.payload;
    },
    setSelectedVehicle: (state, action: PayloadAction<any>) => {
      state.selectedVehicle = action.payload;
    },
    setDataObjectList: (state, action: PayloadAction<any[]>) => {
      state.dataObjectList = action.payload;
    },
    setIsGenerate: (state, action: PayloadAction<boolean>) => {
      state.isGenerate = action.payload;
    },
  },
});

export const { setVehicle, setDataWorkerList, setIsPageLoading, setFormData, setTachoLiveData, setSelectedVehicle, setDataObjectList, setIsGenerate } = mapsSlice.actions;

export default mapsSlice.reducer;