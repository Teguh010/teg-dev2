import { settingDelete } from '@/models/setting';

// Emergency cleanup function to remove corrupted toll_cost_settings
export const emergencyCleanupCorruptedSettings = async (token: string | null): Promise<void> => {
  try {
    console.log('Starting emergency cleanup of corrupted toll_cost_settings...');
    
    // Delete the corrupted toll_cost_settings key
    try {
      await settingDelete(token, 'toll_cost_settings');
      console.log('✅ Successfully deleted corrupted toll_cost_settings key');
    } catch (error) {
      console.error('❌ Could not delete toll_cost_settings key:', error);
    }
    
    // Also clean up any other toll_cost related keys that might be corrupted
    const tollCostKeys = [
      'toll_cost_all',
      'toll_cost_transportMode',
      'toll_cost_currency',
      'toll_cost_truckHeight',
      'toll_cost_truckGrossWeight',
      'toll_cost_truckWeightPerAxle',
      'toll_cost_smallTruckHeight',
      'toll_cost_smallTruckGrossWeight',
      'toll_cost_smallTruckWeightPerAxle',
      'toll_cost_length',
      'toll_cost_emissionType',
      'toll_cost_co2Class',
      'toll_cost_trailerType',
      'toll_cost_trailersCount',
      'toll_cost_trailerNumberAxles',
      'toll_cost_hybrid',
      'toll_cost_trailerHeight',
      'toll_cost_trailerWeight',
      'toll_cost_vehicleWeight',
      'toll_cost_passengersCount',
      'toll_cost_tiresCount',
      'toll_cost_commercial',
      'toll_cost_shippedHazardousGoods',
      'toll_cost_heightAbove1stAxle',
      'toll_cost_fuelType'
    ];
    
    for (const key of tollCostKeys) {
      try {
        await settingDelete(token, key);
        console.log(`✅ Deleted key: ${key}`);
      } catch (error) {
        console.log(`⚠️ Could not delete key ${key}:`, error);
      }
    }
    
    console.log('🎉 Emergency cleanup completed! All toll_cost settings have been removed.');
    console.log('💡 You can now refresh the page and the JSON parsing error should be resolved.');
    
  } catch (error) {
    console.error('❌ Error during emergency cleanup:', error);
  }
};

// Function to check if toll_cost_settings exists and is corrupted
export const checkCorruptedSettings = async (token: string | null): Promise<boolean> => {
  try {
    const { settingGet } = await import('@/models/setting');
    const settingsJson = await settingGet(token, 'toll_cost_settings');
    
    if (settingsJson && settingsJson !== 'null' && settingsJson !== 'undefined') {
      try {
        JSON.parse(settingsJson);
        console.log('✅ toll_cost_settings is valid JSON');
        return false; // Not corrupted
      } catch (parseError) {
        console.error('❌ toll_cost_settings contains corrupted JSON:', parseError);
        return true; // Corrupted
      }
    }
    
    console.log('ℹ️ toll_cost_settings does not exist');
    return false; // Not corrupted (doesn't exist)
  } catch (error) {
    console.error('❌ Error checking settings:', error);
    return false;
  }
};
