// src/features/history/history-selectors.ts

import { RootState } from '@/redux/store';

export const selectDataObjectTrajectory = (state: RootState) => state.history.dataObjectTrajectory;
export const selectVehicle = (state: RootState) => state.history.historyVehicle;
export const selectStartDate = (state: RootState) => state.history.startDate;
export const selectEndDate = (state: RootState) => state.history.endDate;
export const selectIsGenerate = (state: RootState) => state.history.isGenerate;
export const selectIsRefresh = (state: RootState) => state.history.isRefresh;
export const selectIsPageLoading = (state: RootState) => state.history.isPageLoading;
export const selectDateFormat = (state: RootState) => state.history.dateFormat;
export const selectTimeFormat = (state: RootState) => state.history.timeFormat;