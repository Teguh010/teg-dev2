import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { objectGroupListId, objectList, objectLastPosition, objectGroupList  } from '@/models/object';  // Pastikan impor ini benar
import { datatypeList } from '@/models/datatype';
import {
  mergeObjectListObjectLastPositionDatatypeList as mergeObjectList
} from '@/lib/utils';


interface MainMapState {
  dataObjectTripStop: any[];
  vehiclesToMap: any[];
  dataObjectList: any[];
  filteredByGroup: any[];

  dataObjectListGroup: any | null;
  dataObjectListGroupIds: any[];
  vehicle: any | null;
  objectGroupId: any | null;
  startDate: any | null;
  endDate: any | null;
  isGenerate: boolean | null;
  isRefresh: boolean;
  isSelect: any | null;
  filteredVehicle: any[];
  searchQuery: string;
  isPageLoading: boolean;
  isLoadingVehicles: boolean
  isLoadingGroup: boolean
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
  isLoadingGroup: false
};

const mapsSlice = createSlice({
  name: 'maps',
  initialState,
  reducers: {
      setVehicle: (state, action: PayloadAction<any>) => {
      state.vehicle = action.payload;
    },
    setStartDate: (state, action: PayloadAction<any>) => {
      state.startDate = action.payload;
    },
    setEndDate: (state, action: PayloadAction<any>) => {
      state.endDate = action.payload;
    },
    setGenerate: (state, action: PayloadAction<boolean>) => {
      state.isGenerate = action.payload;
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

    setDataObjectListGroup: (state, action: PayloadAction<any[]>) => {
      state.dataObjectListGroup = action.payload;  
    },
  },
});

export const fetchData = (userToken: string) => async (dispatch: any) => {
  dispatch(mapsSlice.actions.setLoadingVehicles(true));  
  try {
    const dataObjectListResponse = await objectList(userToken);
    const dataObjectLastPositionResponse = await objectLastPosition(userToken);
        const dataObjectLastPosition = Array.isArray(dataObjectLastPositionResponse)
      ? dataObjectLastPositionResponse
      : [];

    const dataObjectList = Array.isArray(dataObjectListResponse) ? dataObjectListResponse : [];
    const dataDatatypeList = await datatypeList(userToken);

    const mergedData = mergeObjectList(dataObjectList, dataObjectLastPosition, dataDatatypeList);

    dispatch(mapsSlice.actions.setDataObjectList(mergedData));
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    dispatch(mapsSlice.actions.setLoadingVehicles(false));  
  }
};

export const fetchGroupListData = (userToken: string) => async (dispatch: any) => {
  dispatch(mapsSlice.actions.setLoadingGroup(true));
  try {
     const dataObjectListResponse = await objectGroupList(userToken);
      const dataObjectList = Array.isArray(dataObjectListResponse) ? dataObjectListResponse : [];
    dispatch(mapsSlice.actions.setDataObjectListGroup(dataObjectList));
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    dispatch(mapsSlice.actions.setLoadingGroup(false));
  }
};


export const fetchGroupListDataById = (userToken: string, id: any) => async (dispatch: any) => {
  dispatch(mapsSlice.actions.setLoadingGroup(true));
  try {
    const response = await objectGroupListId(userToken, id);
    const data = Array.isArray(response) ? response : [];
    dispatch(mapsSlice.actions.setDataObjectListGroupIds(data));
  } catch (error) {
    console.error('Error fetching group list by ID:', error);
  } finally {
    dispatch(mapsSlice.actions.setLoadingGroup(false));
  }
};

export const filterByGroup = () => (dispatch: any, getState: any) => {
  const { dataObjectList, dataObjectListGroupIds } = getState().maps;

  if (dataObjectListGroupIds.length === 0) {
    dispatch(mapsSlice.actions.setFilteredVehicle([...dataObjectList]));
    return;
  }

  const filteredByGroup = dataObjectList.filter((vehicle: any) =>
    dataObjectListGroupIds.some((group: any) => group.id === vehicle.objectid)
  );

  dispatch(mapsSlice.actions.setFilteredVehicle(filteredByGroup));
  dispatch(mapsSlice.actions.setFilteredByGroup(filteredByGroup));
};

export const filterBySearch = () => (dispatch: any, getState: any) => {
  const { dataObjectList, dataObjectListGroupIds, filteredByGroup, searchQuery } = getState().maps;

  if (!searchQuery) {
    if (dataObjectListGroupIds.length > 0) {
      dispatch(mapsSlice.actions.setFilteredVehicle(filteredByGroup));
    } else {
      dispatch(mapsSlice.actions.setFilteredVehicle([...dataObjectList]));
    }
    return;
  }

  const dataToFilter = dataObjectListGroupIds.length > 0 ? filteredByGroup : dataObjectList;
  const filteredVehicles = dataToFilter.filter((vehicle: any) =>
    vehicle.object_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  dispatch(mapsSlice.actions.setFilteredVehicle(filteredVehicles));
};

export const {
  setVehicle,
  setDataObjectListGroupIds,
  setFilteredVehicle,
  setSearchQuery,
  setFilteredByGroup,
  setObjectGroupId,
  setVehiclesToMap,
  setIsPageLoading,
} = mapsSlice.actions;

export default mapsSlice.reducer;

