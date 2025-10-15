import { RootState } from '@/redux/store';

export const selectVehicles = (state: RootState) => state.maps.dataObjectList;
