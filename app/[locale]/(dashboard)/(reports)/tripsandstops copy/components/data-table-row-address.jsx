"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';

const DataTableRowActions = ({ row, name }) => {
  const { t } = useTranslation();

  const handleClick = () => {
    // Akan dihandle oleh parent component untuk fokus ke map
    if (name === t('trips_and_stops.from')) {
      return {
        lat: row.original[t('trips_and_stops.lat')],
        lon: row.original[t('trips_and_stops.lon')]
      }
    }
    if (name === t('trips_and_stops.to')) {
      return {
        lat: row.original[t('trips_and_stops.next_lat')],
        lon: row.original[t('trips_and_stops.next_lon')]
      }
    }
    if (name === t('trips_and_stops.address')) {
      return {
        lat: row.original[t('trips_and_stops.lat')],
        lon: row.original[t('trips_and_stops.lon')]
      }
    }
  }

  return (
    <>
      {name === t('trips_and_stops.from') || name === t('trips_and_stops.to') || name === t('trips_and_stops.address') ? (
        <Button 
          variant="ghost" 
          className="capitalize p-1 h-5"
          onClick={handleClick}
        >
          {name === t('trips_and_stops.from') && row.original[t('trips_and_stops.from')]}
          {name === t('trips_and_stops.to') && row.original[t('trips_and_stops.to')]}
          {name === t('trips_and_stops.address') && row.original[t('trips_and_stops.address')]}
        </Button>
      ) : null}
    </>
  );
};

export default React.memo(DataTableRowActions);
