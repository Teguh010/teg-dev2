import { ChevronDown } from 'lucide-react';
import { countryInfoMap } from '@/lib/countryInfoMap';

import React, { useState, useEffect } from 'react';
import CustomSelect from './input-form/custom-seleect';
import CustomInput from '@/components/organisms/ReusableInput';
import {
  transportOptions,
  emissionTypeOptions,
  co2ClassOptions,
  fuelTypeOptions,
  trailerTypeOptions,
  trailersCountOptions,
  commercialOptions,
} from '../data/options';
import { SettingsFormProps } from '@/types/map_route';
import ReusableDialog from '@/components/organisms/ReusableDialog';

import { currencyOptions } from '../data/currencyOptions';
import SearchableSelect from '@/components/ui/searchable-select';
import { saveTollCostSettings, TollCostSettings } from '../utils/tollCostSettings';
import { convertCurrency } from '../utils/currencyService';

interface TollFare {
  id?: string;
  name: string;
  price: number;
  currency: string;
  pass?: {
    validityPeriod?: {
      period: string;
      count?: number;
    };
  };
  reason?: string;
  paymentMethods?: string[];
}
interface TollGroup {
  tollSystem: string;
  fares: TollFare[];
  countryCode?: string;
}

function getFareLabel(fare: TollFare): string {
  if (fare.pass && fare.pass.validityPeriod) {
    const { period, count } = fare.pass.validityPeriod;
    if (period === 'days') {
      if (count === 1) return 'Daily';
      if (count === 7) return 'Weekly';
      if (count === 30) return 'Monthly';
      if (count === 365) return 'Yearly';
      return `${count} days`;
    }
    if (period === 'months') {
      if (count === 1) return 'Monthly';
      return `${count} months`;
    }
    if (period === 'extendedAnnual') return 'Yearly (extended)';
    return period;
  }
  return '';
}

// Define route colors: blue gradient from dark to light
const routeColors = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];

// Restriction colors for better user understanding
const restrictionColors = {
  vehicleRestriction: '#dc2626',    // Red for vehicle restriction
  noThroughRestriction: '#fbbf24',  // Yellow for no-through restriction
};

const SettingsForm: React.FC<SettingsFormProps & { 
  currency: string; 
  setCurrency: (v: string) => void; 
  tollData: { tollGroups: TollGroup[] } | null;
  token: string | null;
  defaultConverterCurrency: string;
  onSettingsSave?: () => void;
  // onDeleteSettings?: () => void;
}> = ({
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
  emissionType,
  setEmissionType,
  co2Class,
  setCo2Class,
  trailerType,
  setTrailerType,
  trailersCount,
  setTrailersCount,
  trailerNumberAxles,
  setTrailerNumberAxles,
  hybrid,
  setHybrid,
  trailerHeight,
  setTrailerHeight,
  vehicleWeight,
  setVehicleWeight,
  passengersCount,
  setPassengersCount,
  tiresCount,
  setTiresCount,
  commercial,
  setCommercial,
  shippedHazardousGoods,
  setShippedHazardousGoods,
  heightAbove1stAxle,
  setHeightAbove1stAxle,
  length,
  setLength,
  fuelType,
  setFuelType,
  trailerWeight,
  setTrailerWeight,
  routeData,
  totalTollPrices,
  tollData,
  onSettingsSubmit,
  currency,
  setCurrency,
  token,
  onSettingsSave,
  // onDeleteSettings,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showOtherTollOptions, setShowOtherTollOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [referenceCurrency, setReferenceCurrency] = useState<string>('');

  // Get reference currency from totalTollPrices
  useEffect(() => {
    if (totalTollPrices && Object.keys(totalTollPrices).length > 0) {
      const refCurrency = Object.keys(totalTollPrices)[0]; // Use first currency as reference
      setReferenceCurrency(refCurrency);
    }
  }, [totalTollPrices]);

  // Function to convert currency amount
  const convertCurrencyAmount = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    try {
      return await convertCurrency(amount, fromCurrency, toCurrency);
    } catch (error) {
      console.error('Currency conversion error:', error);
      return amount; // Return original amount as fallback
    }
  };


  // Function to save settings to API
  const handleSaveSettings = async () => {
    if (!token) {
      console.warn('No token available for saving settings');
      return;
    }

    setIsSaving(true);
    try {
      const settings: TollCostSettings = {
        transportMode,
        currency,
        truckHeight,
        truckGrossWeight,
        truckWeightPerAxle,
        smallTruckHeight,
        smallTruckGrossWeight,
        smallTruckWeightPerAxle,
        length,
        emissionType,
        co2Class,
        trailerType,
        trailersCount,
        trailerNumberAxles,
        hybrid,
        trailerHeight,
        trailerWeight,
        vehicleWeight,
        passengersCount,
        tiresCount,
        commercial,
        shippedHazardousGoods,
        heightAbove1stAxle,
        fuelType,
      };

      await saveTollCostSettings(token, settings);      
      // Call the callback if provided
      if (onSettingsSave) {
        onSettingsSave();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Show all toll groups as "other options" since we can't easily determine which specific tolls are used in the main route
  // The main route total is calculated from summary.tolls.total, not from individual toll selections
  const otherTollGroups = tollData?.tollGroups || [];

  // Helper to format duration in day hour minutes
  function formatDuration(totalMinutes: number): string {
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = Math.round(totalMinutes % 60);
    const result = [];
    if (days > 0) result.push(`${days}d`);
    if (hours > 0) result.push(`${hours}hours`);
    if (minutes > 0 || result.length === 0) result.push(`${minutes}minutes`);
    return result.join(' ');
  }

  // Helper to format numbers with thousand separators
  function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  }

  // Component for displaying country total with currency conversion
  const CountryTotalDisplay: React.FC<{
    total: number;
    countryCurrency: string;
    referenceCurrency: string;
    countryName: string;
  }> = ({ total, countryCurrency, referenceCurrency }) => {
    const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
    const [isConverting, setIsConverting] = useState(false);

    useEffect(() => {
      const performConversion = async () => {
        if (countryCurrency !== referenceCurrency) {
          setIsConverting(true);
          try {
            const converted = await convertCurrencyAmount(total, countryCurrency, referenceCurrency);
            setConvertedAmount(converted);
          } catch (error) {
            console.error('Conversion error:', error);
            setConvertedAmount(null);
          } finally {
            setIsConverting(false);
          }
        } else {
          setConvertedAmount(null);
        }
      };

      performConversion();
    }, [total, countryCurrency, referenceCurrency]);

    return (
      <div className='font-semibold text-green-700 mb-2'>
        Total : {formatNumber(total)} {countryCurrency}
        {countryCurrency !== referenceCurrency && (
          <>
            {isConverting ? (
              <span className='ml-2 text-xs text-gray-500'>(Converting...)</span>
            ) : convertedAmount !== null ? (
              <span className='ml-2 text-xs text-gray-500'>({formatNumber(convertedAmount)} {referenceCurrency})</span>
            ) : null}
          </>
        )}
      </div>
    );
  };

  return (
    <div className='px-2 overflow-y-auto' style={{ height: 'calc(100vh - 280px)' }}>
      <p className='font-bold pt-2'>Settings:</p>
      
      <ReusableDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        triggerLabel='Advanced Settings'
        dialogTitle='Advanced Settings'
        footerButtons={[
          {
            label: isSaving ? 'Saving...' : 'Submit',
            variant: 'solid',
            action: async () => {
              await handleSaveSettings();
              onSettingsSubmit();
              setIsDialogOpen(false);
            },
            type: 'submit',
          },
          // {
          //   label: 'Delete Settings',
          //   variant: 'outline',
          //   action: async () => {
          //     if (onDeleteSettings) {
          //       await onDeleteSettings();
          //       setIsDialogOpen(false);
          //     }
          //   },
          //   type: 'button',
          // },
        ]}
      >
        <div className='grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4'>
          {/* Currency and Transport Mode */}
          <div className='setting-input mb-2'>
            <SearchableSelect
              value={currency}
              onChange={setCurrency}
              options={currencyOptions}
              placeholder='Choose Currency'
              label='Currency'
            />
          </div>
          <div className='setting-input'>
            <CustomSelect
              value={transportMode}
              onChange={setTransportMode}
              options={transportOptions}
              placeholder='Choose Transport Mode'
              label={'Transport Mode'}
            />
          </div>
          
          {/* Vehicle parameters - always show but disable for car mode */}
          <div className='mb-2'>
            <label>Height (cm):</label>
            <input
              type='number'
              value={transportMode === 'truck' ? truckHeight : smallTruckHeight}
              onChange={(e) =>
                transportMode === 'truck'
                  ? setTruckHeight(e.target.value)
                  : setSmallTruckHeight(e.target.value)
              }
              disabled={transportMode === 'car'}
              className={`w-full p-2 mb-2 border rounded-md ${transportMode === 'car' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>

          <div className='mb-2'>
            <label>Total Weight (kg):</label>
            <input
              type='number'
              value={transportMode === 'truck' ? truckGrossWeight : smallTruckGrossWeight}
              onChange={(e) =>
                transportMode === 'truck'
                  ? setTruckGrossWeight(e.target.value)
                  : setSmallTruckGrossWeight(e.target.value)
              }
              disabled={transportMode === 'car'}
              className={`w-full p-2 mb-2 border rounded-md ${transportMode === 'car' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>

          <div className='mb-2'>
            <label>Weight per Axle (kg):</label>
            <input
              type='number'
              value={transportMode === 'truck' ? truckWeightPerAxle : smallTruckWeightPerAxle}
              onChange={(e) =>
                transportMode === 'truck'
                  ? setTruckWeightPerAxle(e.target.value)
                  : setSmallTruckWeightPerAxle(e.target.value)
              }
              disabled={transportMode === 'car'}
              className={`w-full p-2 mb-2 border rounded-md ${transportMode === 'car' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>

          <CustomInput
            name='length'
            value={length}
            onChange={(name, value) => setLength(value)}
            type='number'
            label='Vehicle Length (cm)'
            disabled={transportMode === 'car'}
          />

          {/* CO2 and Emission settings - always show but disable for car mode */}
          <CustomSelect
            value={co2Class}
            onChange={setCo2Class}
            options={co2ClassOptions}
            placeholder='Choose CO2 Class'
            label={'Co2 Class'}
            disabled={transportMode === 'car'}
          />

          <CustomSelect
            value={emissionType}
            onChange={setEmissionType}
            options={emissionTypeOptions}
            placeholder='Choose Emission Type'
            label={'Emission Type'}
            disabled={transportMode === 'car'}
          />

          {/* Vehicle and trailer parameters - always show but disable for car mode */}
          <CustomInput
            name='vehicleWeight'
            value={vehicleWeight}
            onChange={setVehicleWeight}
            type='number'
            label='Vehicle Weight (kg)'
            placeholder='Vehicle Weight (kg)'
            min={0}
            disabled={transportMode === 'car'}
          />

          <div>
            <CustomSelect
              value={trailerType}
              onChange={setTrailerType}
              options={trailerTypeOptions}
              placeholder='Choose Trailer Type'
              label={'Trailer Type'}
              disabled={transportMode === 'car'}
            />
          </div>

          <div>
            <CustomSelect
              value={trailersCount}
              onChange={setTrailersCount}
              options={trailersCountOptions}
              placeholder='Choose Trailers Count'
              label={'Trailers Count'}
              disabled={transportMode === 'car'}
            />
          </div>

          <CustomInput
            name='trailerNumberAxles'
            value={trailerNumberAxles}
            onChange={setTrailerNumberAxles}
            type='number'
            label='Trailer Number of Axles'
            min={0}
            disabled={transportMode === 'car'}
          />

          <div>
            <CustomSelect
              value={hybrid}
              onChange={setHybrid}
              options={[
                { value: '0', label: 'No' },
                { value: '1', label: 'Yes' },
              ]}
              placeholder='Is Hybrid?'
              label={'Hybrid'}
              disabled={transportMode === 'car'}
            />
          </div>

          <CustomInput
            name='trailerHeight'
            value={trailerHeight}
            onChange={setTrailerHeight}
            type='number'
            label='Trailer Height (cm)'
            min={0}
            disabled={transportMode === 'car'}
          />

          <CustomInput
            name='passengersCount'
            value={passengersCount}
            onChange={setPassengersCount}
            type='number'
            label='Passengers Count'
            min={0}
            disabled={transportMode === 'car'}
          />

          <CustomInput
            name='tiresCount'
            value={tiresCount}
            onChange={setTiresCount}
            type='number'
            label='Tires Count'
            min={0}
            disabled={transportMode === 'car'}
          />

          <div>
            <CustomSelect
              value={commercial}
              onChange={setCommercial}
              options={commercialOptions}
              placeholder='Is Commercial Use?'
              label={'Commercial Use'}
              disabled={transportMode === 'car'}
            />
          </div>

          <CustomInput
            name='shippedHazardousGoods'
            value={shippedHazardousGoods}
            onChange={setShippedHazardousGoods}
            type='text'
            label='Shipped Hazardous Goods'
            min={0}
            disabled={transportMode === 'car'}
          />

          <CustomInput
            name='heightAbove1stAxle'
            value={heightAbove1stAxle}
            onChange={setHeightAbove1stAxle}
            type='number'
            label='Height Above 1st Axle (cm)'
            min={0}
            disabled={transportMode === 'car'}
          />

          <div>
            <CustomSelect
              value={fuelType}
              onChange={setFuelType}
              options={fuelTypeOptions}
              placeholder='Choose Fuel Type'
              label={'Fuel Type'}
              disabled={transportMode === 'car'}
            />
          </div>

          <CustomInput
            name='trailerWeight'
            value={trailerWeight}
            onChange={setTrailerWeight}
            type='number'
            label='Trailer Weight (kg)'
            min={0}
            disabled={transportMode === 'car'}
          />
        </div>
      </ReusableDialog>
      <span className=' text-gray-500' style={{fontSize: '9px'}}>V.23.07.25</span>
       {/* Total Toll Prices Display */}
      <div>
        {totalTollPrices && Object.keys(totalTollPrices).length > 0 && (
          <div className='mt-4 p-3 bg-green-50 rounded-md'>
            <h4 className='font-bold mb-2'>Total Toll Cost</h4>
            {Object.keys(totalTollPrices).map((currency) => (
              <div key={currency}>
                <div className='text-2xl font-bold mb-1'>
                  {formatNumber(totalTollPrices[currency])} {currency}
                </div>
                
              </div>
            ))}
            <div className='text-xs text-gray-600 mt-2'>
              This is the total toll cost you have to pay for this route.
            </div>
            
          </div>
        )}
      </div>

      {/* Other Toll Fare Options - Collapsible as a whole */}
      {otherTollGroups.length > 0 && (
        <div className='mt-4 p-3 bg-gray-50 rounded-md'>
          <button
            className='flex items-center gap-2 font-bold text-base mb-2 focus:outline-none hover:text-blue-700 transition-colors'
            onClick={() => setShowOtherTollOptions((v) => !v)}
            type='button'
          >
            <span>Other Toll Fare Options</span>
            <span className={`transition-transform duration-200 ${showOtherTollOptions ? 'rotate-180' : ''}`}>
              <ChevronDown size={20} />
            </span>
          </button>
          {showOtherTollOptions && (
            <div>
              {/* Group fares by countryCode and currency */}
              {(() => {
                // Grouping logic
                const countryGroups: { [key: string]: { countryCode: string; countryName: string; flag: string; fares: TollFare[]; currency: string }[] } = {};
                otherTollGroups.forEach(group => {
                  const info = group.countryCode ? countryInfoMap[group.countryCode] : null;
                  const countryKey = group.countryCode || 'Unknown';
                  
                  // Group fares by currency first
                  const faresByCurrency: { [currency: string]: TollFare[] } = {};
                  group.fares.forEach(fare => {
                    if (!faresByCurrency[fare.currency]) {
                      faresByCurrency[fare.currency] = [];
                    }
                    faresByCurrency[fare.currency].push(fare);
                  });
                  
                  // For each currency, select the most appropriate fare (preferably Daily)
                  Object.entries(faresByCurrency).forEach(([currency, fares]) => {
                    // Find Daily fare first, then fallback to the first fare
                    let selectedFare = fares.find(f => getFareLabel(f) === 'Daily');
                    if (!selectedFare) {
                      selectedFare = fares[0]; // Fallback to first fare
                    }
                    
                    // Find if already exists in countryGroups[countryKey] with same currency
                    const arr = countryGroups[countryKey] || [];
                    let found = arr.find(g => g.currency === currency);
                    if (!found) {
                      found = {
                        countryCode: group.countryCode || 'Unknown',
                        countryName: info ? info.name : group.countryCode || 'Unknown',
                        flag: info ? info.flag : '',
                        fares: [],
                        currency: currency
                      };
                      arr.push(found);
                    }
                    found.fares.push(selectedFare);
                    countryGroups[countryKey] = arr;
                  });
                });
                // Render per country group
                return Object.values(countryGroups).map((countryArr, idx) => (
                  <div key={idx} className='mb-6'>
                    {countryArr.map((country, i) => {
                      // Sum fares for this country/currency
                      const total = country.fares.reduce((sum, f) => sum + f.price, 0);
                      return (
                        <div key={country.countryCode + country.currency + i}>
                          <div className='font-bold text-base mb-1 flex items-center'>
                            {country.flag && <span className='mr-2'>{country.flag}</span>}
                            {country.countryName}
                            <span className='ml-2 text-xs text-gray-500'>({country.currency})</span>
                          </div>
                          <CountryTotalDisplay
                            total={total}
                            countryCurrency={country.currency}
                            referenceCurrency={referenceCurrency}
                            countryName={country.countryName}
                          />
                          <ul className='ml-4 mt-1'>
                            {country.fares.map((fare, j) => (
                                  <li key={fare.id || j} className='py-0.5 flex items-center'>
                                    <span>{formatNumber(fare.price)} {fare.currency}</span>
                                    {getFareLabel(fare) && (
                                      <span className='ml-2 text-xs text-gray-500'>({getFareLabel(fare)})</span>
                                    )}
                                  </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      )}
      
      {/* Route information display with color coding */}
      {routeData.length > 0 && (
        <div className='mt-4 p-3 bg-gray-50 rounded-md'>
          <h4 className='font-bold mb-2'>Route Information:</h4>
          {routeData.map((rd, idx) => (
            <div key={idx} className='mb-2'>
              <strong style={{ color: routeColors[idx % routeColors.length] }}>
                {idx === 0 ? 'Main Route' : `Alternative Route ${idx}`}
              </strong>
              <div>
                <strong>Distance:</strong> {rd.distance} km
              </div>
              <div>
                <strong>Duration:</strong> {formatDuration(Number(rd.duration))}
              </div>
            </div>
          ))}
           {/* Color legend for clarity */}
          <div className='mb-3'>
            <h5 className='font-semibold text-sm mb-2'>Route Colors:</h5>
            <div className='flex gap-4 mb-2'>
              {routeData.map((_, idx) => (
                <div key={idx} className='flex items-center gap-1'>
                  <span style={{ background: routeColors[idx % routeColors.length], width: 16, height: 4, display: 'inline-block', borderRadius: 2 }} />
                  <span style={{ color: routeColors[idx % routeColors.length], fontSize: 12 }}>
                    {idx === 0 ? 'Main' : `Alt ${idx}`}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Restriction color legend */}
            <h5 className='font-semibold text-sm mb-2'>Restriction Indicators:</h5>
            <div className='flex gap-2'>
              <div className='flex items-center gap-1'>
                <span style={{ background: restrictionColors.vehicleRestriction, width: 16, height: 4, display: 'inline-block', borderRadius: 2 }} />
                <span style={{ color: restrictionColors.vehicleRestriction, fontSize: 12 }}>Vehicle Restriction</span>
              </div>
              <div className='flex items-center gap-1'>
                <span style={{ background: restrictionColors.noThroughRestriction, width: 16, height: 4, display: 'inline-block', borderRadius: 2 }} />
                <span style={{ color: restrictionColors.noThroughRestriction, fontSize: 12 }}>No-Through Restriction</span>
              </div>
            </div>
          </div>
        </div>
      )}
    
    </div>
  );
};

export default SettingsForm;