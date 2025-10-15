import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MainMapState {
  dataObjectTripStop: any[]
  vehiclesToMap: any[]
  dataObjectList: any[]
  filteredByGroup: any[]

  dataObjectListGroup: any | null
  dataObjectListGroupIds: any[]
  vehicle: any | null
  objectGroupId: any | null
  startDate: any | null
  endDate: any | null
  isGenerate: boolean | null
  isRefresh: boolean
  isSelect: any | null
  filteredVehicle: any[]
  searchQuery: string
  isPageLoading: boolean
  isLoadingVehicles: boolean
  isLoadingGroup: boolean
  cachedObjectList: any[] | null
  cachedDatatypeList: any[] | null
  maxLastMessageId: number
  activeVehicleId: any,
  tachoData: any[];
  vehiclesWithTacho: string[];

}

const initialState: MainMapState = {
  dataObjectTripStop: [],
  dataObjectList: [],
  dataObjectListGroup: null,
  dataObjectListGroupIds: [],
  vehicle: null,
  objectGroupId: null,
  startDate: null,
  endDate: null,
  isGenerate: null,
  isRefresh: true,
  isSelect: null,
  filteredVehicle: [],
  searchQuery: '',
  isPageLoading: true,
  filteredByGroup: [],
  vehiclesToMap: [],
  isLoadingVehicles: false,
  isLoadingGroup: false,

  cachedObjectList: null,
  cachedDatatypeList: null,
  maxLastMessageId: 0,
    activeVehicleId: null,
  tachoData: [],
  vehiclesWithTacho: [],

};

const mapsSlice = createSlice({
  name: 'maps',
  initialState,
  reducers: {
     setActiveVehicle: (state, action) => {
      state.activeVehicleId = action.payload;
    },
    setVehicle: (state, action: PayloadAction<any>) => {
      state.vehicle = action.payload;
    },
    setDataObjectListGroupIds: (state, action: PayloadAction<any[]>) => {
      state.dataObjectListGroupIds = action.payload;
    },
    setFilteredVehicle: (state, action: PayloadAction<any[]>) => {
      state.filteredVehicle = action.payload;
      state.vehiclesToMap = action.payload.length > 0 ? action.payload : state.dataObjectList;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFilteredByGroup: (state, action: PayloadAction<any[]>) => {
      state.filteredByGroup = action.payload;
    },
    setObjectGroupId: (state, action: PayloadAction<any>) => {
      state.dataObjectListGroupIds = action.payload ? [action.payload] : [];
    },
    setVehiclesToMap: (state, action: PayloadAction<any[]>) => {
      state.vehiclesToMap = action.payload;
    },
    setIsPageLoading: (state, action: PayloadAction<boolean>) => {
      state.isPageLoading = action.payload;
    },
    setLoadingVehicles: (state, action: PayloadAction<boolean>) => {
      state.isLoadingVehicles = action.payload;
    },
    setLoadingGroup: (state, action: PayloadAction<boolean>) => {
      state.isLoadingGroup = action.payload;
    },
    setDataObjectList: (state, action: PayloadAction<any[]>) => {
      state.dataObjectList = action.payload;
    },
      setDataLastPosition: (state, action: PayloadAction<any[]>) => {
      state.dataObjectList = action.payload;
    },
    setDataObjectListGroup: (state, action: PayloadAction<any[]>) => {
      state.dataObjectListGroup = action.payload;
    },
     setCachedObjectList: (state, action: PayloadAction<any[]>) => {
      state.cachedObjectList = action.payload;
    },
    setCachedDatatypeList: (state, action: PayloadAction<any[]>) => {
      state.cachedDatatypeList = action.payload;
    },
    setMaxLastMessageId: (state, action: PayloadAction<number>) => {
      state.maxLastMessageId = action.payload;
    },
    setTachoData: (state, action: PayloadAction<any[]>) => {
      state.tachoData = action.payload;
      state.vehiclesWithTacho = action.payload.map(item => item.id);
    },
  },
});

export const {
  setVehicle,
  setDataObjectListGroupIds,
  setFilteredVehicle,
  setSearchQuery,
  setFilteredByGroup,
  setObjectGroupId,
  setVehiclesToMap,
  setIsPageLoading,
  setLoadingVehicles,
  setLoadingGroup,
  setDataObjectList,
  setDataObjectListGroup,
   setCachedObjectList,
  setCachedDatatypeList,
  setMaxLastMessageId,
  setActiveVehicle,
  setTachoData
} = mapsSlice.actions;

export default mapsSlice.reducer;
