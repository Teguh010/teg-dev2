import { settingGet, settingSet, settingDelete } from '@/models/setting';

// Define the structure of toll cost settings
export interface TollCostSettings {
  // Transport mode
  transportMode: string;
  
  // Currency
  currency: string;
  
  // Truck parameters
  truckHeight: string;
  truckGrossWeight: string;
  truckWeightPerAxle: string;
  
  // Small truck parameters
  smallTruckHeight: string;
  smallTruckGrossWeight: string;
  smallTruckWeightPerAxle: string;
  
  // Common parameters
  length: string;
  emissionType: string;
  co2Class: string;
  
  // Trailer parameters
  trailerType: string;
  trailersCount: string;
  trailerNumberAxles: string;
  hybrid: string;
  trailerHeight: string;
  trailerWeight: string;
  
  // Vehicle parameters
  vehicleWeight: string;
  passengersCount: string;
  tiresCount: string;
  commercial: string;
  shippedHazardousGoods: string;
  heightAbove1stAxle: string;
  fuelType: string;
}

// Default values for toll cost settings
export const DEFAULT_TOLL_COST_SETTINGS: TollCostSettings = {
  transportMode: 'truck',
  currency: 'EUR',
  truckHeight: '400',
  truckGrossWeight: '11000',
  truckWeightPerAxle: '10000',
  smallTruckHeight: '250',
  smallTruckGrossWeight: '7500',
  smallTruckWeightPerAxle: '3000',
  length: '1800',
  emissionType: 'euro6',
  co2Class: '3',
  trailerType: '',
  trailersCount: '',
  trailerNumberAxles: '',
  hybrid: '',
  trailerHeight: '',
  trailerWeight: '',
  vehicleWeight: '',
  passengersCount: '',
  tiresCount: '',
  commercial: '',
  shippedHazardousGoods: '',
  heightAbove1stAxle: '',
  fuelType: '',
};

// Single key for all toll cost settings
const TOLL_COST_SETTINGS_KEY = 'toll_cost_settings';

// Load toll cost settings from API (1 API call)
export const loadTollCostSettings = async (token: string | null): Promise<TollCostSettings> => {
  try {
    
    const settingsResponse = await settingGet(token, TOLL_COST_SETTINGS_KEY);
    
    if (settingsResponse && settingsResponse !== 'null' && settingsResponse !== 'undefined') {
      try {
        let settingsJson: string;
        
        // Handle different response formats
        if (typeof settingsResponse === 'string') {
          // If it's already a string, try to parse it
          try {
            const parsed = JSON.parse(settingsResponse);
            // If it has 'vle' property, extract the value
            if (parsed && typeof parsed === 'object' && 'vle' in parsed) {
              settingsJson = parsed.vle;
            } else {
              settingsJson = settingsResponse;
            }
          } catch {
            // If parsing fails, use the string directly
            settingsJson = settingsResponse;
          }
        } else if (settingsResponse && typeof settingsResponse === 'object' && 'vle' in settingsResponse) {
          // If it's an object with 'vle' property
          settingsJson = settingsResponse.vle;
        } else {
          settingsJson = String(settingsResponse);
        }
        
        // Try to decode Base64 first, if it fails, try direct JSON parsing
        let parsedSettings;
        try {
          // Try Base64 decoding first
          const decodedJson = atob(settingsJson);
          parsedSettings = JSON.parse(decodedJson);
        } catch (base64Error) {
          // If Base64 decoding fails, try direct JSON parsing
          try {
            parsedSettings = JSON.parse(settingsJson);
          } catch (jsonError) {
            console.error('❌ Both Base64 and JSON parsing failed:', { base64Error, jsonError });
            throw new Error('Failed to parse settings data');
          }
        }
        
        // Merge with defaults to ensure all properties exist
        const mergedSettings = { ...DEFAULT_TOLL_COST_SETTINGS, ...parsedSettings };
        
        return mergedSettings;
      } catch (parseError) {
        console.error('❌ Failed to parse settings JSON, using defaults:', parseError);
        console.error('Raw response:', settingsResponse);
        return DEFAULT_TOLL_COST_SETTINGS;
      }
    }
    
    return DEFAULT_TOLL_COST_SETTINGS;
  } catch (error) {
    console.error('❌ Error loading toll cost settings:', error);
    return DEFAULT_TOLL_COST_SETTINGS;
  }
};

// Save toll cost settings to API (1 API call)
export const saveTollCostSettings = async (token: string | null, settings: TollCostSettings): Promise<void> => {
  try {    
    // Ensure all values are strings
    const cleanSettings: TollCostSettings = { ...settings };
    Object.keys(cleanSettings).forEach(key => {
      const value = cleanSettings[key as keyof TollCostSettings];
      cleanSettings[key as keyof TollCostSettings] = String(value || '');
    });
    
    // Convert to JSON string and then to Base64 to avoid nested JSON issues
    const settingsJson = JSON.stringify(cleanSettings);
    const base64Encoded = btoa(settingsJson); // Base64 encode
    
    await settingSet(token, TOLL_COST_SETTINGS_KEY, base64Encoded);
    
  } catch (error) {
    console.error('❌ Error saving toll cost settings:', error);
    throw error;
  }
};

// Delete all toll cost settings (1 API call)
export const deleteTollCostSettings = async (token: string | null): Promise<void> => {
  try {    
    await settingDelete(token, TOLL_COST_SETTINGS_KEY);
    
  } catch (error) {
    console.error('❌ Error deleting toll cost settings:', error);
    throw error;
  }
};
