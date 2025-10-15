import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import CustomDataList1 from './custom-data-list1';
import CustomDataList2 from './custom-data-list2';
import './footer-map.css';

interface TachographStats {
  ignition: string;
  driver_state: number;
  gpstime: string;
  remaining_current_drive_time: number;
  remaining_drive_time_current_shift: number;
  remaining_drive_time_current_week: number;
  total_drive_time: number;
  remaining_10h_times: number;
  next_break_rest_duration: number;
  time_left_until_daily_rest: number;
  reduced_daily_rests_remaining: number;
  end_of_last_daily_rest: number;
}

interface TachographData {
  id?: number;
  name?: string;
  stats: TachographStats[][];
}

interface FooterMapProps {
  data?: Record<string, unknown>
  vehicleStatus: boolean
  tachoData?: TachographData[]
}

const FooterMap: React.FC<FooterMapProps> = ({ data, vehicleStatus, tachoData }) => {
  const [showColumns, setShowColumns] = useState(false);
  const hasCustomDataList2Data = !!(
    data?.virtual_odometer_continuous || 
    data?.['(can)_engine_hours_(total)'] || 
    data?.['(can)_fuel_tank_level'] || 
    data?.['(can)_rpm']
  );

  return (
    <div className="w-full">
      {/* Mobile Layout - Stack vertically */}
      <div className="block lg:hidden">
        <div className="space-y-3 p-3">
          <div className="w-full">
            <CustomDataList1 data={data} vehicleStatus={vehicleStatus} hasCustomDataList2Data={hasCustomDataList2Data} />
          </div>
          
          {hasCustomDataList2Data && (
            <div className={`w-full transition-all duration-300 ${showColumns ? 'block' : 'hidden'}`}>
              <CustomDataList2 
                data={data} 
                objectId={data?.id as string | number} 
                tachoData={tachoData} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout - Side by side */}
      <div className="hidden lg:block">
        <div className={`grid ${hasCustomDataList2Data ? 'grid-cols-7' : 'grid-cols-1'} pb-2`}>
          <div className={`first-column ${hasCustomDataList2Data ? 'col-span-3' : 'col-span-7'}`}>
            <CustomDataList1 data={data} vehicleStatus={vehicleStatus} hasCustomDataList2Data={hasCustomDataList2Data} />
          </div>

          {hasCustomDataList2Data && (
            <div className={`second-column border-l border-gray-300 ${showColumns ? 'show' : ''} col-span-4`}>
              <CustomDataList2 
                data={data} 
                objectId={data?.id as string | number} 
                tachoData={tachoData} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button - Mobile only */}
      {hasCustomDataList2Data && (
        <div className='flex justify-center p-2 lg:hidden'>
          <button 
            className='bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors duration-200' 
            onClick={() => setShowColumns(!showColumns)}
          >
            <Icon 
              icon={`${showColumns ? 'tabler:chevron-up' : 'tabler:chevron-down'}`} 
              className='text-lg' 
            />
          </button>
        </div>
      )}
    </div>
  );
};

export default FooterMap;
