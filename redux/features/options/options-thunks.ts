import { AppDispatch, RootState } from '@/redux/store';

import { objectWorkers, createWorker } from '@/models/workers';
import { objectList } from '@/models/object';
import { datatypeList } from '@/models/datatype';
import { mergeObjectListObjectLastPositionDatatypeList as mergeObjectList } from '@/lib/utils';
import {setDataWorkerList, setIsPageLoading, setTachoLiveData, setDataObjectList } from './options-slice';
import { convertTimestampsToLocal } from '@/lib/utils';
import { tachoLiveDrivingStateStatsAllObjects, tachoGetVehicleList } from '@/models/tachograph';


export const fetchDataWorkerList = (userToken: string) => async (dispatch: AppDispatch) => {
  dispatch(setIsPageLoading(true));
   const params = {
    };
  try {
    const dataWorkerListResponse = await objectWorkers(userToken, params);

    const dataWorkerList = Array.isArray(dataWorkerListResponse) ? dataWorkerListResponse : [];
    dispatch(setDataWorkerList(dataWorkerList));
  } catch (error) {
    console.error('Error fetching object list:', error);
  } finally {
    dispatch(setIsPageLoading(false));
  }
};

export const createWorkerThunk = (userToken: string, formData: {
  name: string;
  surname: string;
  phone: string;
  email: string;
}) => async (dispatch: AppDispatch) => {
  dispatch(setIsPageLoading(true));

  const payload = {
    name: formData.name,
    surname: formData.surname,
    phone: formData.phone,
    email: formData.email
  };

  try {
    const response = await createWorker(userToken, payload);
    return response;
  } catch (error) {
    console.error('Error creating worker:', error);
    throw error;
  } finally {
    dispatch(setIsPageLoading(false));
  }
};

export const fetchTachoLiveData = (userToken: string) => async (dispatch: AppDispatch) => {
  try {
    const tachoLiveData = await tachoLiveDrivingStateStatsAllObjects(userToken);
    if (!tachoLiveData) {
      throw new Error('No tacho data received');
    }
    dispatch(setTachoLiveData(tachoLiveData));
  } catch (error) {
    console.error('Error fetching tacho live data:', error);
    dispatch(setTachoLiveData(null));
  }
};


export const fetchDataObjectList = (userToken: string) => async (dispatch: AppDispatch) => {
  try {
    const dataObjectListResponse = await objectList(userToken);

    const dataObjectList = Array.isArray(dataObjectListResponse) ? dataObjectListResponse : [];
    dispatch(setDataObjectList(dataObjectList));
  } catch (error) {
    console.error('Error fetching object list:', error);
  }
};

