import React, { useState } from 'react';
import dynamic from 'next/dynamic';

import { useTranslation } from 'react-i18next';
import TotalContent from './total-content';
import { Icon } from '@iconify/react';
import { firstUpperLetter } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

const TotalSpeedApex = dynamic(() => import('./total-speed-apex'), { ssr: false });
const FuelLevelChart = dynamic(() => import('./fuel-level-chart'), { ssr: false });

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
interface CustomDataListProps {
  data?: any
  dataObjectTrajectory?: any
  activeTab?: any
  onClick?: () => void
  onPointClick?: (data: any) => void
  dataObjectFuelLevel?: any
}

const CustomDataList: React.FC<CustomDataListProps> = ({
  data,
  dataObjectTrajectory,
  activeTab,
  onClick,
  onPointClick,
  dataObjectFuelLevel
}) => {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('tab1');
  const { isFuelData } = useSelector((state: RootState) => state.fuel);


  return (
    <div>
      <Tabs defaultValue='tab1' onValueChange={(value) => setSelectedTab(value)}>
        <TabsList>
          <TabsTrigger value='tab1'>
            <div>
              <div className='label-item flex items-center gap-0 w-full'>
                <span className='mr-1.5 mt-0.5 text-primary'>
                  <Icon icon='oui:security-signal' className='text-2xl text-blue-400' />
                </span>
                <span className='text-gray-600 font-semibold text-md'>
                  {firstUpperLetter(t('map_page.totals'))}
                </span>
              </div>
            </div>
          </TabsTrigger>
          <TabsTrigger value='tab2'>
            <div>
              <div className='label-item flex items-center gap-0 w-full'>
                <span className='mr-1.5 mt-0.5 text-primary'>
                  <Icon icon='f7:graph-circle' className='text-2xl text-blue-400' />
                </span>
                <span className='text-gray-600 font-semibold text-md'>
                  {firstUpperLetter(t('map_page.speed'))}
                </span>
              </div>
            </div>
          </TabsTrigger>
          {isFuelData && (
            <TabsTrigger value='tab3'>
              <div>
                <div className='label-item flex items-center gap-0 w-full'>
                <span className='mr-1.5 mt-0.5 text-primary'>
                  <Icon icon='f7:graph-circle' className='text-2xl text-blue-400' />
                </span>
                <span className='text-gray-600 font-semibold text-md'>
                  {firstUpperLetter(t('map_page.fuel'))}
                </span>
              </div>
              </div>
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value='tab1'>
          <TotalContent data={data} />
        </TabsContent>
        <TabsContent value='tab2'>
          <TotalSpeedApex
                dataObjectTrajectory={dataObjectTrajectory}
                onPointClick={onPointClick}
              />
        </TabsContent>
        {isFuelData && (
          <TabsContent value='tab3'>
            <FuelLevelChart
                dataObjectFuelLevel={dataObjectFuelLevel}
                onPointClick={onPointClick}
                />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default CustomDataList;
