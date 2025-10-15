import React from 'react'
import { Icon } from '@iconify/react'
import { firstUpperLetter } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface CustomDataListProps {
  data?: any
  onClick?: () => void
}

const CustomDataList: React.FC<CustomDataListProps> = ({ data, onClick }) => {
  const { t } = useTranslation()

  return (
    <div>
       <div className='flex items-center gap-2 w-full pt-2 px-2 justify-between'>
          <div className='label-item flex items-center gap-0 w-full'>
            <span className='mr-1.5 mt-0.5 text-primary'>
              <Icon icon='icon-park-outline:setting-web' className='text-2xl text-blue-400' />
            </span>
            <span className='text-gray-600 font-semibold text-md'>
              {firstUpperLetter(t('map_page.others'))}
            </span>
          </div>
        </div>
      <div className='border-b border-gray-300 my-2 px-0'></div>
      <div className='grid grid-cols gap-4 px-4'>
        <ul className='w-full'>
          <li className='flex  text-body-color dark:text-dark-6 text-sm'>
            <div className='flex items-center gap-2 w-full'>
              <div className='label-item flex items-center gap-0 w-full'>
                <span className='mr-1.5 mt-0.5 text-primary'>
                  <Icon icon='fa-regular:dot-circle' className='text-sm' />
                </span>
                <span className='text-gray-600'>
                  {firstUpperLetter(t('map_page.distance_driven'))}
                </span>
              </div>
              <div className='value-item w-full'>
                <span className='text-gray-600'>{data['(can)_distance_driven']}</span>
              </div>
            </div>
          </li>
          <div className='border-b border-gray-300 my-2 px-2'></div>
          <li className='flex  text-body-color dark:text-dark-6 text-sm'>
            <div className='flex items-center gap-2 w-full'>
              <div className='label-item flex items-center gap-0 w-full'>
                <span className='mr-1.5 mt-0.5 text-primary'>
                  <Icon icon='fa-regular:dot-circle' className='text-sm' />
                </span>
                <span className='text-gray-600'>
                  {firstUpperLetter(t('map_page.alarm'))}
                </span>
              </div>
              <div className='value-item w-full'>
                <span className='text-gray-600'>{data.has_alarms ? 'On' : 'Off'}</span>
              </div>
            </div>
          </li>
          <div className='border-b border-gray-300 my-2 px-2'></div>
          <li className='flex  text-body-color dark:text-dark-6 text-sm'>
            <div className='flex items-center gap-2 w-full'>
              <div className='label-item flex items-center gap-0 w-full'>
                <span className='mr-1.5 mt-0.5 text-primary'>
                  <Icon icon='fa-regular:dot-circle' className='text-sm' />
                </span>
                <span className='text-gray-600'>
                  {firstUpperLetter(t('map_page.alert'))}
                </span>
              </div>
              <div className='value-item w-full'>
                <span className='text-gray-600'>{data.has_alerts ? 'On' : 'Off'}</span>
              </div>
            </div>
          </li>
          <div className='border-b border-gray-300 my-2 px-2'></div>
          <li className='flex  text-body-color dark:text-dark-6 text-sm'>
            <div className='flex items-center gap-2 w-full'>
              <div className='label-item flex items-center gap-0 w-full'>
                <span className='mr-1.5 mt-0.5 text-primary'>
                  <Icon icon='fa-regular:dot-circle' className='text-sm' />
                </span>
                <span className='text-gray-600'>
                  {firstUpperLetter(t('map_page.trip_state'))}
                </span>
              </div>
              <div className='value-item w-full'>
                <span className='text-gray-600'>{data.trip_state}</span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CustomDataList;
