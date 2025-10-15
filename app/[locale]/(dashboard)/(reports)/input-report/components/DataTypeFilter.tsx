"use client";
import React from 'react';
import MultiSelect from './MultiSelect';

interface CurrentDatatypeResultItem {
  id: number;
  name: string;
}

interface DataTypeFilterProps {
  datatypeList: CurrentDatatypeResultItem[];
  selectedDataTypes: number[];
  onDataTypesChange: (dataTypes: number[]) => void;
  disabled?: boolean;
  vehicle?: string | null;
}

export function DataTypeFilter({
  datatypeList,
  selectedDataTypes,
  onDataTypesChange,
  disabled = false,
  vehicle
}: DataTypeFilterProps) {
  // Hide the component if no vehicle is selected
  if (!vehicle) {
    return null;
  }

  // Use all datatypes from the API without filtering
  const options = datatypeList.map((dataType) => ({
    value: dataType.id,
    label: dataType.name
  }));

  return (
    <div className="flex flex-col gap-2">
      <MultiSelect
        value={selectedDataTypes}
        onChange={onDataTypesChange}
        options={options}
        placeholder={disabled ? 'Loading...' : 'Select data types'}
        disabled={disabled}
      />
    </div>
  );
} 