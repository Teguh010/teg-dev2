import React from 'react';
import LocationAutocomplete from '@/components/LocationAutocomplete';

interface LocationInputsProps {
  startInputValue: string;
  endInputValue: string;
  setStartInputValue: (val: string) => void;
  setEndInputValue: (val: string) => void;
  onStartLocationSelect: (lat: number, lon: number, address: string) => void;
  onEndLocationSelect: (lat: number, lon: number, address: string) => void;
}

const LocationInputs: React.FC<LocationInputsProps> = ({
  startInputValue,
  endInputValue,
  setStartInputValue,
  setEndInputValue,
  onStartLocationSelect,
  onEndLocationSelect,
}) => {
  return (
    <div className='geolocation-input-container p-2'>
      <div className='mb-1 pb-1'>
        <span className='text-md font-semibold'>Select Locations</span>
      </div>
      
      <div className="space-y-3">
        <LocationAutocomplete
          label="Start Location"
          placeholder="Enter start location or paste coordinates (e.g., -6.2297465,106.829518)"
          value={startInputValue}
          onChange={setStartInputValue}
          onSelectLocation={onStartLocationSelect}
          icon="mdi:map-marker-radius"
        />
        
        <LocationAutocomplete
          label="End Location"
          placeholder="Enter end location or paste coordinates (e.g., -6.2297465,106.829518)"
          value={endInputValue}
          onChange={setEndInputValue}
          onSelectLocation={onEndLocationSelect}
          icon="mdi:map-marker-check"
        />
      </div>
    </div>
  );
};

export default LocationInputs;
