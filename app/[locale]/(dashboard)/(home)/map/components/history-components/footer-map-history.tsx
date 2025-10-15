import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import CustomAvatar from '@/components/ui/avatar';
import CustomDataList1 from './custom-data-list1';
import CustomDataList2 from './custom-data-list2';
import CustomDataList3 from './custom-data-list3';
import './footer-map.css';

interface FooterMapProps {
  data?: any
  tripStopData?: any
  indexLabel?: any
  dataObjectTrajectory?: any
  activeTab?: any
  onClick?: () => void
  onPointClick?: (data: any) => void
  here_address?: string
  hereAddressData?: any
  dataObjectFuelLevel?: any
}

const FooterMapHistory: React.FC<FooterMapProps> = ({
  data = {},
  tripStopData = [],
  indexLabel = '',
  dataObjectTrajectory = [],
  activeTab,
  onClick,
  onPointClick,
  here_address,
  hereAddressData,
  dataObjectFuelLevel
}) => {
  const [showColumns, setShowColumns] = useState(false);
  const speeds = dataObjectTrajectory.map((item) => {
    return item.spd;
  });
  return (
    <div className='footer-histroy'>
      <div className='grid grid-cols-8 pb-2'>
        <div className='first-column-history border-gray-300'>
          <CustomDataList1 data={tripStopData} indexLabel={indexLabel} here_address={here_address} hereAddressData={hereAddressData}/>
        </div>
        <div
          className={`second-column-history border-l border-gray-300 ${showColumns ? 'show' : ''}`}
        >
          <CustomDataList2
            data={data}
            dataObjectTrajectory={dataObjectTrajectory}
            onPointClick={onPointClick}
            activeTab={activeTab}
            dataObjectFuelLevel={dataObjectFuelLevel}
          />
        </div>
        {/* <div
          className={`third-column-history ${showColumns ? 'show' : 'border-l border-gray-300 '}`}
        >
          <CustomDataList3 data={data} />
        </div> */}
      </div>
      <div className='flex justify-center'>
        <button
          className='button-show-toggle-history bg-primary text-white p-2 rounded-full absolute bottom-2 right-2'
          onClick={() => setShowColumns(!showColumns)}
        >
          <Icon
            icon={`${showColumns ? 'tabler:chevron-up' : 'tabler:chevron-down'}`}
            className='text-lg'
          />
        </button>
      </div>
    </div>
  );
};

export default FooterMapHistory;
