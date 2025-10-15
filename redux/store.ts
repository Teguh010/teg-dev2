import { configureStore } from '@reduxjs/toolkit';
import mapsReducer from './features/main-map';  
import historyReducer from './features/history-map';
import fuelReducer from './features/fuel-report';
import optionsReducer from './features/options';

import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';




export const store = configureStore({
  reducer: {
    maps: mapsReducer,
    history: historyReducer,
    fuel: fuelReducer,
    options: optionsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,  // Nonaktifkan pengecekan serializability untuk sementara
    })
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = ThunkDispatch<RootState, any, AnyAction>;

export default store;
