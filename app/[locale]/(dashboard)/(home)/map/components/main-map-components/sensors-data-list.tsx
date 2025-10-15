import React from 'react';
import { Icon } from '@iconify/react';

interface SensorsDataListProps {
  data?: Record<string, unknown>;
}

const SensorsDataList: React.FC<SensorsDataListProps> = ({ data }) => {
  // Get data from msg_data object
  const msgData = (data?.msg_data as Record<string, string>) || {};
  const driverName = data?.driver_name as string | undefined;

  return (
    <div className='flex flex-wrap gap-1 px-0'>
      {/* Odometer - 300003 */}
      {msgData['300003'] && (
        <SensorChip 
          icon='mdi:gauge'
          iconColor='text-blue-500'
          value={msgData['300003']} 
        />
      )}
      
      {/* Fuel Level - 300001 */}
      {msgData['300001'] && (
        <SensorChip 
          icon='mdi:gas-station'
          iconColor='text-orange-500'
          value={msgData['300001']} 
        />
      )}
      
      {/* AdBlue - 300098 */}
      {msgData['300098'] && (
        <SensorChip 
          icon='adblue'
          iconColor='text-blue-600'
          value={`${msgData['300098']}L`} 
        />
      )}
      
      {/* Battery - 100013 */}
      {msgData['100013'] && (
        <SensorChip 
          icon='mdi:battery-charging'
          iconColor='text-green-400'
          value={msgData['100013']} 
        />
      )}
      
      {/* Engine Hours - 300007 */}
      {msgData['300007'] && (
        <SensorChip 
          icon='engine-hour'
          iconColor='text-gray-600'
          value={msgData['300007']} 
        />
      )}
    
    </div>
  );
};

const SensorChip = ({ 
  icon, 
  iconColor = 'text-gray-600',
  value 
}: { 
  icon: string;
  iconColor?: string;
  value: string | number;
}) => {
  // Handle custom PNG icons
  const isCustomIcon = icon === 'adblue' || icon === 'engine-hour';
  
  return (
    <div className='flex items-center gap-1 bg-gray-50 border border-gray-200 rounded px-1 py-0.5'>
      {isCustomIcon ? (
        <img 
          src={`/images/home/${icon}.png`} 
          alt={icon}
          className='w-4 h-4 object-contain'
        />
      ) : (
        <Icon icon={icon} className={`text-base ${iconColor}`} />
      )}
      <span className='text-gray-700 text-xs font-medium'>{value}</span>
    </div>
  );
};

export default SensorsDataList; 