import { AppDispatch, RootState } from '@/redux/store';
import { format } from "date-fns";

import { objectTrajectoryNormalized, objectFuelLevel, objectList } from '@/models/object';
import {
  cleanObjectsColumns
} from '@/lib/utils';
import { filterTrajectoryData } from '@/lib/map-filters';

import {
  setRefresh,
  setDataObjectTrajectory,
  setDataObjectFuelLevel,
  setGenerate,
  setDataObjectList,
  setIsFuelData,
} from './fuel-slice';


export const fetchDataObjectTrajectory =
  (userToken: string, vehicle: any, startDate: string, endDate: string) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!userToken || !vehicle || !startDate || !endDate) return;

    const state = getState().history;
    const { unitDistance, dateFormat, timeFormat } = state;
    dispatch(setGenerate(true));

    try {
      const dataObjectTrajectory = await objectTrajectoryNormalized(userToken, vehicle, startDate, endDate);
      
      if (dataObjectTrajectory) {
        const dataObjectTrajectoryClean = cleanObjectsColumns(dataObjectTrajectory);
        const filteredData = filterTrajectoryData(
          dataObjectTrajectoryClean,
          dateFormat,
          timeFormat,
          unitDistance,
          (key) => key
        );
        dispatch(setDataObjectTrajectory(filteredData));
      }
    } catch (error) {
      console.error('Error fetching trajectory data:', error);
      dispatch(setDataObjectTrajectory([]));
    } finally {
       dispatch(setGenerate(false));
    }
  };

export const fetchDataObjectFuelLevel =
  (userToken: string, vehicle: any, startDate: string, endDate: string) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!userToken || !vehicle || !startDate || !endDate) return;

      const params = {
        "object_id": vehicle.id,
        "time_from": format(startDate, "yyyy-MM-dd HH:mm:ss"),
        "time_to": format(endDate, "yyyy-MM-dd HH:mm:ss"),
    };

    try {
      const dataObjectFuelLevel = await objectFuelLevel(userToken, params);
      if (dataObjectFuelLevel && dataObjectFuelLevel.length > 0) {
        dispatch(setDataObjectFuelLevel(dataObjectFuelLevel));
        dispatch(setIsFuelData(true));
      } else {
        dispatch(setDataObjectFuelLevel([]));
        dispatch(setIsFuelData(false));
      }
    } catch (error) {
      console.error('Error fetching fuel level data:', error);
      dispatch(setDataObjectFuelLevel([]));
      dispatch(setIsFuelData(false));
    } finally {
      dispatch(setRefresh(false));
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
