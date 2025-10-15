import { AppDispatch, RootState } from '@/redux/store';
import { createAsyncThunk } from '@reduxjs/toolkit';

import { objectList, objectTripStopMoreSetting, objectTrajectoryNormalized } from '@/models/object';
import { fetchHereAddress } from '@/lib/utils';
import { addressCacheAdd, fetchHereAddressesBatch } from '@/models/address_cache';

import {
  cleanObjectsColumns
} from '@/lib/utils';
import { filterData, filterTotals, filterTrajectoryData } from '@/lib/map-filters'; // Import dari file historyFilters

import {
  setDataObjectList,
  setIsPageLoading,
  setGenerate,
  setDataObjectTripStop,
  setDataObjectTripStopTotals,
  setRefresh,
  setDataObjectTrajectory,
} from './history-slice';

export const handleSelectHistoryDataStore = createAsyncThunk(
  'history/handleSelectHistoryDataStore',
  async (
    {
      data,
      label,
      stopIndex,
      allowZoom,
    }: { data: any; label: string; stopIndex: any; allowZoom: any },
    { rejectWithValue }
  ) => {
    try {
      let addressData: { here_address?: string; here_next_address?: string } = {};

      if (label !== 'Stop') {
        const here_next_address = await fetchHereAddress(data.next_lat, data.next_lon);
        const here_address = await fetchHereAddress(data.lat, data.lon);
        addressData = { here_address, here_next_address };
      } else {
        const here_address = await fetchHereAddress(data.lat, data.lon);
        addressData = { here_address };
      }

      return { data, addressData, label, stopIndex, allowZoom };
    } catch (error) {
      return rejectWithValue('Failed to fetch address');
    }
  }
);

export const fetchDataObjectList = (userToken: string) => async (dispatch: AppDispatch) => {
  dispatch(setIsPageLoading(true));
  try {
    const dataObjectListResponse = await objectList(userToken);

    const dataObjectList = Array.isArray(dataObjectListResponse) ? dataObjectListResponse : [];
    dispatch(setDataObjectList(dataObjectList));
  } catch (error) {
    console.error('Error fetching object list:', error);
  } finally {
    dispatch(setIsPageLoading(false));
  }
};

export const fetchDataObjectTripStop =
  (userToken: string, vehicle: any, startDate: string, endDate: string) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!userToken || !vehicle || !startDate || !endDate) return;

    const state = getState().history;
    const {
      unitDistance,
      unitVolume,
      dateFormat,
      timeFormat,
      minMoving,
      minStationary,
      showStationaryIgnition,
    } = state;

    dispatch(setGenerate(true));

    try {
      const dataObjectTripStop = await objectTripStopMoreSetting(
        userToken,
        vehicle.id,
        startDate,
        endDate,
        minMoving,
        minStationary,
        showStationaryIgnition
      );

      if (dataObjectTripStop.data) {
        const dataObjectTripStopClean = cleanObjectsColumns(dataObjectTripStop.data);
        const filteredData = filterData(
          dataObjectTripStopClean,
          dateFormat,
          timeFormat,
          unitDistance,
          unitVolume,
          (key) => key
        );

        // Filter stops with null addresses
        const stopsWithNoAddress = dataObjectTripStop.data.filter((stop) => !stop.address);

        if (stopsWithNoAddress.length > 0) {
          try {
            // Prepare the coordinates for batch geocoding
            const coordinates = stopsWithNoAddress.map((stop) => ({
              lat: stop.lat,
              lon: stop.lon,
            }));

            // Fetch addresses in batch
            const fetchedAddresses = await fetchHereAddressesBatch(coordinates);

            // Combine fetched addresses with stop data
            const updatedStopsWithAddresses = stopsWithNoAddress.map((stop) => {
              const fetchedAddress = fetchedAddresses.find(
                (addr) => addr.lat === stop.lat && addr.lon === stop.lon
              );
              return {
                ...stop,
                address: fetchedAddress ? fetchedAddress.address : 'Address not found',
              };
            });

            // Cache the addresses in batch using addressCacheAdd
            const addressesToCache = updatedStopsWithAddresses.map((stop) => ({
              lat: stop.lat,
              lng: stop.lon,
              a: stop.address,
            }));

            await addressCacheAdd(userToken, addressesToCache); // Cache addresses

            // Dispatch updated stops data with addresses
            dispatch(setDataObjectTripStop(updatedStopsWithAddresses));
          } catch (addressError) {
            console.error('Error fetching addresses:', addressError);
            dispatch(setDataObjectTripStop(dataObjectTripStop.data));
          }
        } else {
          dispatch(setDataObjectTripStop(dataObjectTripStop.data));
        }
      }

      if (dataObjectTripStop.totals) {
        const filteredTotals = filterTotals(
          dataObjectTripStop.totals,
          unitDistance,
          unitVolume,
          (key) => key
        );
        dispatch(setDataObjectTripStopTotals(filteredTotals));
      }
    } catch (error) {
      console.error('Error fetching trip stop data:', error);
    } finally {
      dispatch(setGenerate(false));
      dispatch(setRefresh(false));
    }
  };

export const fetchDataObjectTrajectory =
  (userToken: string, vehicle: any, startDate: string, endDate: string) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!userToken || !vehicle || !startDate || !endDate) return;

    const state = getState().history;
    const { unitDistance, dateFormat, timeFormat } = state;

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
    } finally {
      dispatch(setRefresh(false));
    }
  };
