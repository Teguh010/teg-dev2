import React from 'react';

interface TruckSettingsFormProps {
  transportMode: string
  setTransportMode: (mode: string) => void
  truckHeight: number
  setTruckHeight: (height: number) => void
  truckGrossWeight: number
  setTruckGrossWeight: (weight: number) => void
  truckWeightPerAxle: number
  setTruckWeightPerAxle: (weight: number) => void
  smallTruckHeight: number
  setSmallTruckHeight: (height: number) => void
  smallTruckGrossWeight: number
  setSmallTruckGrossWeight: (weight: number) => void
  smallTruckWeightPerAxle: number
  setSmallTruckWeightPerAxle: (weight: number) => void
  fetchRouteFromHereAPI: () => void
  startLocation: { lat: number; lon: number } | null
  endLocation: { lat: number; lon: number } | null
  emissionType: any
  setEmissionType: any
  co2Class: any
  setCo2Class: any
}

const TruckSettingsForm: React.FC<TruckSettingsFormProps> = ({
  transportMode,
  setTransportMode,
  truckHeight,
  setTruckHeight,
  truckGrossWeight,
  setTruckGrossWeight,
  truckWeightPerAxle,
  setTruckWeightPerAxle,
  smallTruckHeight,
  setSmallTruckHeight,
  smallTruckGrossWeight,
  setSmallTruckGrossWeight,
  smallTruckWeightPerAxle,
  setSmallTruckWeightPerAxle,
  fetchRouteFromHereAPI,
  startLocation,
  endLocation,
  emissionType,
  setEmissionType,
  co2Class,
  setCo2Class,
}) => {
  return (
    <div className='px-2'>
      <p className='font-bold py-2'>Settings:</p>
      <select
        value={transportMode}
        onChange={(e) => setTransportMode(e.target.value)}
        className='mb-4 p-2 border rounded-md w-[100%]'
      >
        <option value='car'>Car</option>
        <option value='truck'>Truck</option>
        <option value='small_truck'>Small Truck</option>
      </select>

      <select
        value={emissionType}
        onChange={(e) => setEmissionType(e.target.value)}
        className='mb-4 p-2 border rounded-md w-[100%]'
      >
        <option value='euro1'>Euro I</option>
        <option value='euro2'>Euro II</option>
        <option value='euro3'>Euro III</option>
        <option value='euro4'>Euro IV</option>
        <option value='euro5'>Euro V</option>
        <option value='euro6'>Euro VI</option>
      </select>

      <select
        value={co2Class}
        onChange={(e) => setCo2Class(e.target.value)}
        className='mb-4 p-2 border rounded-md w-[100%]'
      >
        <option value='1'>CO2 Class 1</option>
        <option value='2'>CO2 Class 2</option>
        <option value='3'>CO2 Class 3</option>
        <option value='4'>CO2 Class 4</option>
        <option value='5'>CO2 Class 5</option>
      </select>

      {(transportMode === 'truck' || transportMode === 'small_truck') && (
        <div>
          <p className='font-bold py-2'>
            {transportMode === 'truck' ? 'Truck' : 'Small Truck'} Settings:
          </p>

          <div className='mb-2'>
            <label>Height (cm):</label>
            <input
              type='number'
              value={transportMode === 'truck' ? truckHeight : smallTruckHeight}
              onChange={(e) =>
                transportMode === 'truck'
                  ? setTruckHeight(Number(e.target.value))
                  : setSmallTruckHeight(Number(e.target.value))
              }
              className='w-full p-2 mb-2 border rounded-md'
            />
          </div>

          <div className='mb-2'>
            <label>Total Weight (kg):</label>
            <input
              type='number'
              value={transportMode === 'truck' ? truckGrossWeight : smallTruckGrossWeight}
              onChange={(e) =>
                transportMode === 'truck'
                  ? setTruckGrossWeight(Number(e.target.value))
                  : setSmallTruckGrossWeight(Number(e.target.value))
              }
              className='w-full p-2 mb-2 border rounded-md'
            />
          </div>

          <div className='mb-2'>
            <label>Weight per Wheel Axle (kg):</label>
            <input
              type='number'
              value={transportMode === 'truck' ? truckWeightPerAxle : smallTruckWeightPerAxle}
              onChange={(e) =>
                transportMode === 'truck'
                  ? setTruckWeightPerAxle(Number(e.target.value))
                  : setSmallTruckWeightPerAxle(Number(e.target.value))
              }
              className='w-full p-2 mb-2 border rounded-md'
            />
          </div>

          <button
            onClick={fetchRouteFromHereAPI}
            className={`bg-blue-500 text-white px-4 py-2 rounded-md ${
              !startLocation || !endLocation ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!startLocation || !endLocation}
          >
            Submit V.11
          </button>
        </div>
      )}
    </div>
  );
};

export default TruckSettingsForm;
