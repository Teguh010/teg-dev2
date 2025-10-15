import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import CustomDataList1 from './custom-data-list1';
import CustomDataList2 from './custom-data-list2';

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

interface SidebarDataPanelProps {
  data?: Record<string, unknown>
  vehicleStatus: boolean
  tachoData?: TachographData[]
  isOpen: boolean
  onClose: () => void
  onCollapsedChange?: (collapsed: boolean) => void
}

const SidebarDataPanel: React.FC<SidebarDataPanelProps> = ({ 
  data, 
  vehicleStatus, 
  tachoData, 
  isOpen, 
  onClose,
  onCollapsedChange
}) => {
  // State untuk toggle show/hide sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);

  
  // Handle collapse toggle
  const handleCollapseToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onCollapsedChange) {
      onCollapsedChange(newCollapsedState);
    }
  };
  
  // Check if there's sensor data in msg_data object
  const msgData = data?.msg_data || {};
  const hasCustomDataList2Data = 
    msgData['300003'] || // Odometer
    msgData['300001'] || // Fuel level
    msgData['300098'] || // AdBlue
    msgData['100013'] || // Battery
    msgData['300007'] || // Engine hours
    data?.driver_name;    // Driver name

  if (!isOpen || !data) return null;

  return (
    <div 
      className="fixed top-0 h-full bg-white shadow-lg z-30 border-r border-gray-300 transition-all duration-150" 
      style={{ 
        left: '320px',
        width: isCollapsed ? '48px' : '320px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 pt-4 pb-2 mt-10 bg-gray-50">
        {!isCollapsed && <h3 className="text-md font-semibold text-gray-800">{(data?.object_name as string) || 'Vehicle Details'}</h3>}
        <div className="flex items-center gap-2">
          {/* Toggle Button */}
          <button 
            onClick={handleCollapseToggle}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            title={isCollapsed ? "Show Details" : "Hide Details"}
          >
            <Icon 
              icon={isCollapsed ? "tabler:chevron-right" : "tabler:chevron-left"} 
              className="text-xl text-gray-600" 
            />
          </button>
          {/* Close Button */}
          {!isCollapsed && (
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              title="Close"
            >
              <Icon icon="tabler:x" className="text-xl text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Content - Mobile-like stacked layout */}
      {!isCollapsed && (
        <div className="h-[calc(100vh-120px)] overflow-y-auto">
          <div className="space-y-0 px-3">
            {/* CustomDataList1 - Always visible */}
            <div className="w-full">
              <CustomDataList1 
                data={data} 
                vehicleStatus={vehicleStatus} 
                hasCustomDataList2Data={hasCustomDataList2Data} 
              />
            </div>
            
            {/* CustomDataList2 - Permanently visible */}
            {hasCustomDataList2Data && (
              <div className="w-full">
                <CustomDataList2 
                  data={data} 
                  objectId={data?.id as string | number} 
                  tachoData={tachoData} 
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarDataPanel;
