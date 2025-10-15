import React, { useRef } from 'react';

interface GeolocationInputProps {
  startSuggestions: any[]
  endSuggestions: any[]
  fetchLocationSuggestions: (query: string, setSuggestions: (data: any[]) => void) => void
  handleSelectLocation: (item: any, isStart: boolean) => void
  setStartSuggestions: (data: any[]) => void
  setEndSuggestions: (data: any[]) => void
 startInputRef: React.RefObject<HTMLInputElement> // Tambahkan ref sebagai props
 endInputRef: React.RefObject<HTMLInputElement> // Tambahkan ref sebagai props
}

const GeolocationInput: React.FC<GeolocationInputProps> = ({
  startSuggestions,
  endSuggestions,
  fetchLocationSuggestions,
  handleSelectLocation,
  setStartSuggestions,
  setEndSuggestions,
  startInputRef, // Terima ref
  endInputRef, // Terima ref
}) => {

  return (
    <div className='geolocation-input-container p-2'>
      <div className='mb-1 pb-1'>
        <span className='text-md font-semibold'>Select Locations</span>
      </div>
      <input
        type='text'
        placeholder='Enter start location'
        className='w-full p-2 mb-2 border rounded-md'
        onChange={(e) => fetchLocationSuggestions(e.target.value, setStartSuggestions)}
        ref={startInputRef}
      />
      {startSuggestions.length > 0 && (
        <ul className='border'>
          {startSuggestions.map((item, index) => (
            <li
              key={index}
              onClick={() => handleSelectLocation(item, true)}
              className='cursor-pointer p-2 hover:bg-gray-200'
            >
              {item.address.label}
            </li>
          ))}
        </ul>
      )}

      <input
        type='text'
        placeholder='Enter end location'
        className='w-full p-2 mb-2 border rounded-md'
        onChange={(e) => fetchLocationSuggestions(e.target.value, setEndSuggestions)}
        ref={endInputRef}
      />
      {endSuggestions.length > 0 && (
        <ul className='border'>
          {endSuggestions.map((item, index) => (
            <li
              key={index}
              onClick={() => handleSelectLocation(item, false)}
              className='cursor-pointer p-2 hover:bg-gray-200'
            >
              {item.address.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GeolocationInput;
