// src/features/history/history-selectors.ts

import { RootState } from '@/redux/store';

export const selectDataObjectTripStop = (state: RootState) => state.history.dataObjectTripStop;
export const selectDataObjectTripStopTotals = (state: RootState) => state.history.dataObjectTripStopTotals;
export const selectDataObjectTrajectory = (state: RootState) => state.history.dataObjectTrajectory;
export const selectDataObjectList = (state: RootState) => state.history.dataObjectList;
export const selectVehicle = (state: RootState) => state.history.historyVehicle;
export const selectStartDate = (state: RootState) => state.history.startDate;
export const selectEndDate = (state: RootState) => state.history.endDate;
export const selectIsGenerate = (state: RootState) => state.history.isGenerate;
export const selectIsRefresh = (state: RootState) => state.history.isRefresh;
export const selectIsPageLoading = (state: RootState) => state.history.isPageLoading;
export const selectUnitDistance = (state: RootState) => state.history.unitDistance;
export const selectUnitVolume = (state: RootState) => state.history.unitVolume;
export const selectDateFormat = (state: RootState) => state.history.dateFormat;
export const selectTimeFormat = (state: RootState) => state.history.timeFormat;
export const selectSettings = (state: RootState) => state.history.settings;
