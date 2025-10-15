'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import VehiclePicker from './vehicle-picker';
import DatePickerWithRange from './date-picker-with-range';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store'; // Import RootState untuk tipe state
import { AppDispatch } from '@/redux/store';

import {
  setStartDate as setStartDateAction,
  setEndDate as setEndDateAction,
  setVehicle
} from '@/redux/features/fuel-report/fuel-slice';

const TopComponents = ({ vehicleHistoryMap, isGenerate, handleGenerateClick }) => {
  const { t } = useTranslation();

  const dispatch = useDispatch<AppDispatch>();

  const { startDate, endDate, vehicle, dataObjectList, settings } = useSelector(
    (state: RootState) => state.fuel
  );

  useEffect(() => {
    if (!vehicle || !startDate || !endDate) {
      isGenerate = false;
    }
  }, [startDate, endDate, vehicleHistoryMap, vehicle]);

  const handleSetStartDate = (date) => {
    dispatch(setStartDateAction(date));
  };

  const handleSetEndDate = (date) => {
    dispatch(setEndDateAction(date));
  };

  return (
    <div className='flex gap-4'>
      <VehiclePicker
        vehicles={dataObjectList}
        setVehicleObject={(vehicle) => dispatch(setVehicle(vehicle))}
        selectedVehicle={vehicle}
      />
      <DatePickerWithRange
        setStartDate={handleSetStartDate}
        setEndDate={handleSetEndDate}
        startDate={startDate}
        endDate={endDate}
        settings={settings}
      />
      <Button
        variant='outline'
        color='success'
        size='sm'
        className='h-8'
        disabled={!vehicle || !startDate || !endDate}
        onClick={handleGenerateClick}
      >
        <span className='capitalize'>{isGenerate ? 'Generating' : 'Generate'}</span>
      </Button>
    </div>
  );
};

export default TopComponents;
