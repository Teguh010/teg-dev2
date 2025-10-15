import { AppDispatch, RootState } from '@/redux/store';

import { objectGroupListId, objectList, objectLastPositionWithMoreParam, objectGroupList } from '@/models/object';
import { datatypeList } from '@/models/datatype';
import { mergeObjectListObjectLastPositionDatatypeList as mergeObjectList } from '@/lib/utils';
import {
  setDataObjectList,
  setLoadingVehicles,
  setLoadingGroup,
  setDataObjectListGroup,
  setDataObjectListGroupIds,
  setFilteredVehicle,
  setFilteredByGroup,
  setCachedObjectList,
  setCachedDatatypeList,
  setMaxLastMessageId,
  setTachoData
} from './maps-slice';
import { convertTimestampsToLocal } from '@/lib/utils';
import { tachoLiveDrivingStateStats } from "@/models/tachograph";


export const fetchData = (userToken: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState();
  
  // Use Redux state instead of global variables
  const existingVehicles = state.maps.dataObjectList;
  let cachedObjectList = state.maps.cachedObjectList;
  let cachedDatatypeList = state.maps.cachedDatatypeList;
  let maxLastMessageId = state.maps.maxLastMessageId;

  if (!cachedObjectList || !cachedDatatypeList) {
    try {
      dispatch(setLoadingVehicles(true));
      cachedObjectList = await objectList(userToken);
      cachedDatatypeList = await datatypeList(userToken);
      dispatch(setCachedObjectList(cachedObjectList));
      dispatch(setCachedDatatypeList(cachedDatatypeList));
    } catch (error) {
      console.error('Error fetching objectList or datatypeList:', error);
    } finally {
      dispatch(setLoadingVehicles(false));
    }
  }

  try {
    const params = {
      last_msg_id: maxLastMessageId
    };

    const dataObjectLastPositionResponse = await objectLastPositionWithMoreParam(userToken, params);
    const dataObjectLastPosition = Array.isArray(dataObjectLastPositionResponse)
      ? convertTimestampsToLocal(dataObjectLastPositionResponse)
      : [];

    const biggestMessageId = dataObjectLastPosition.reduce((maxId, obj) => {
      return obj.messageid > maxId ? obj.messageid : maxId;
    }, 0);

    if (biggestMessageId > maxLastMessageId) {
      maxLastMessageId = biggestMessageId;
      dispatch(setMaxLastMessageId(maxLastMessageId));
    }

    const newMergedData = mergeObjectList(cachedObjectList || [], dataObjectLastPosition, cachedDatatypeList || []);

    // Update vehicles
    const updatedVehicles = existingVehicles.map(existingVehicle => {
      const newVehicleData = newMergedData.find(newVehicle => newVehicle.id === existingVehicle.id);
      return newVehicleData ? { ...existingVehicle, ...newVehicleData } : existingVehicle;
    });

    const newVehicles = newMergedData.filter(newVehicle =>
      !existingVehicles.some(existingVehicle => existingVehicle.id === newVehicle.id)
    );

    const finalVehicles = [...updatedVehicles, ...newVehicles];

    // Dispatch updated vehicle list
    dispatch(setDataObjectList(finalVehicles));

    // Reapply filters if necessary
    const { searchQuery, dataObjectListGroupIds } = state.maps;

    if (searchQuery) {
      dispatch(filterBySearch());
    } else if (dataObjectListGroupIds.length > 0) {
      dispatch(filterByGroup());
    } else {
      dispatch(setFilteredVehicle(finalVehicles));
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};




export const fetchGroupListData = (userToken: string) => async (dispatch: AppDispatch) => {
  dispatch(setLoadingGroup(true));
  try {
    const dataObjectListResponse = await objectGroupList(userToken);
    const dataObjectList = Array.isArray(dataObjectListResponse) ? dataObjectListResponse : [];
    dispatch(setDataObjectListGroup(dataObjectList));
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    dispatch(setLoadingGroup(false));
  }
};

export const fetchGroupListDataById =
  (userToken: string, id: any) => async (dispatch: AppDispatch) => {
    dispatch(setLoadingGroup(true));
    try {
      const response = await objectGroupListId(userToken, id);
      const data = Array.isArray(response) ? response : [];
      dispatch(setDataObjectListGroupIds(data));
    } catch (error) {
      console.error('Error fetching group list by ID:', error);
    } finally {
      dispatch(setLoadingGroup(false));
    }
  };

// Filter by group
export const filterByGroup = () => (dispatch: AppDispatch, getState: () => RootState) => {
  const { dataObjectList, dataObjectListGroupIds } = getState().maps;

  if (dataObjectListGroupIds.length === 0) {
    dispatch(setFilteredVehicle([...dataObjectList]));
    return;
  }

  const filteredByGroup = dataObjectList.filter((vehicle: any) =>
    dataObjectListGroupIds.some((group: any) => group.id === vehicle.objectid)
  );

  dispatch(setFilteredVehicle(filteredByGroup));
  dispatch(setFilteredByGroup(filteredByGroup));
};


export const filterBySearch = () => (dispatch: AppDispatch, getState: () => RootState) => {
  const { dataObjectList, dataObjectListGroupIds, filteredByGroup, searchQuery } = getState().maps;

  if (!searchQuery) {
    if (dataObjectListGroupIds.length > 0) {
      dispatch(setFilteredVehicle(filteredByGroup));
    } else {
      dispatch(setFilteredVehicle([...dataObjectList]));
    }
    return;
  }

  const dataToFilter = dataObjectListGroupIds.length > 0 ? filteredByGroup : dataObjectList;
  const filteredVehicles = dataToFilter.filter((vehicle: any) =>
    vehicle.object_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.driver_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  dispatch(setFilteredVehicle(filteredVehicles));
};

