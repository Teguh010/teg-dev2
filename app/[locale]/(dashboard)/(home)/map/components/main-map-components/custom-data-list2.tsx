import React from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { firstUpperLetter } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';
import driverIcon from '@/public/images/all-img/driver.png';
import SensorsDataList from './sensors-data-list';
import TachographDataList from './tachograph-data-list';
import DriverActivityChartHybrid from './driver-activity-chart-hybrid';

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

interface CustomDataListProps {
  data?: Record<string, unknown>
  objectId?: string | number
  tachoData?: TachographData[]
}

const CustomDataList: React.FC<CustomDataListProps> = ({ data, objectId, tachoData }) => {
  const { t } = useTranslation();
  const { models } = useUser();
  const token = models.user?.token || null;

  
  // Log specific sensor data from msg_data
  const msgData = (data?.msg_data as Record<string, string>) || {};
  const cardNumber = msgData['800005'];

  return (
    <div className="w-full space-y-2">
      {/* Sensors Section */}
      <div>
        <div className="flex items-center gap-2 mb-1 pb-1 border-b border-gray-200">
          <Icon icon='oui:security-signal' className='text-lg text-blue-400' />
          <h4 className='text-gray-600 font-medium text-sm'>
            {firstUpperLetter(t('map_page.sensors'))}
          </h4>
        </div>
        <div className="overflow-auto lg:h-auto lg:overflow-visible pt-2">
          <SensorsDataList data={data} />
        </div>
      </div>

      {/* Driver Section */}
      <div>
        <div className="pl-0 flex items-center gap-2 pb-2 border-b border-gray-200">
          <Image 
            src={driverIcon} 
            alt="Driver" 
            width={16} 
            height={16}
            className="text-blue-400"
          />
          <h4 className='text-gray-600 font-medium text-sm'>
            {data?.driver_name ? (data.driver_name as string) : "--"}
          </h4>
        </div>
      </div>

      {/* Tachograph Section */}
      {tachoData?.[0]?.id && (
        <div >
          <div className="flex items-center gap-2 mb-1 pb-1 border-b border-gray-200">
            <Icon icon='f7:graph-circle' className='text-lg text-blue-400' />
            <h4 className='text-gray-600 font-medium text-sm'>
              {firstUpperLetter(t('general.tachograph'))}
            </h4>
          </div>
          <div className="h-[40vh] overflow-auto lg:h-auto lg:overflow-visible">
            <TachographDataList objectId={objectId} tachoData={tachoData} />
          </div>
        </div>
      )}

         {/* Driver Activity Last 24 Hours Section */}
      {cardNumber && (
        <div>
          <div className="flex items-center gap-2 mb-1 pb-1 border-b border-gray-200">
            <Icon icon='mdi:chart-timeline-variant' className='text-lg text-blue-400' />
            <h4 className='text-gray-600 font-medium text-sm'>
              Driver Activity Last 24 Hours
            </h4>
          </div>
          <div className="overflow-auto lg:h-auto lg:overflow-visible">
            <DriverActivityChartHybrid cardNumber={cardNumber} token={token} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDataList;