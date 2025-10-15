import { RootState } from '@/redux/store';

export const selectVehicles = (state: RootState) => state.maps.dataObjectList;
export const selectFilteredVehicles = (state: RootState) => state.maps.filteredVehicle;
export const selectIsLoadingVehicles = (state: RootState) => state.maps.isLoadingVehicles;
export const selectIsPageLoading = (state: RootState) => state.maps.isPageLoading;
