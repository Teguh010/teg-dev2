import React from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { firstUpperLetter, openStreetView } from '@/lib/utils';

interface CustomDataListProps {
  data?: any
  indexLabel: any
  onClick?: () => void
  here_address: string
  hereAddressData: any
}

const CustomDataList: React.FC<CustomDataListProps> = ({
  data,
  indexLabel,
  onClick,
  here_address,
  hereAddressData,
}) => {
  const { t } = useTranslation();
  return (
    <div>
      <div className='flex items-center gap-2 w-full pt-2 px-2 justify-between'>
        <div className='label-item flex items-center gap-0 w-full pl-6'>
          <span className='mr-1.5 mt-0.5 text-primary'>
            <Icon icon='tabler:gps' className='text-2xl text-blue-400' />
          </span>
          <span className='text-gray-600 font-semibold text-md'>{t('map_page.stop_number')}: {indexLabel}</span>
        </div>
      </div>
      <div className='border-b border-gray-300 my-2 px-0'></div>
      <div className='grid grid-cols gap-4 px-4'>
        <ul className='w-full'>
          {/* Worker Row */}
          <li className='text-body-color dark:text-dark-6 text-sm'>
            <div className='grid grid-cols-12 items-center w-full'>
              <div className='label-item col-span-4 flex items-center'>
                <span className='mr-1.5 mt-0.5 text-primary'>
                  <Icon icon='fa-regular:dot-circle' className='text-sm' />
                </span>
                <span className='text-gray-600'>{firstUpperLetter(t('map_page.worker'))}</span>
              </div>
              <div className='value-item col-span-8'>
                <span className='text-gray-600'>: {data['worker']}</span>
              </div>
            </div>
          </li>

          <div className='border-b border-gray-300 my-2 px-2'></div>
          <li className='text-body-color dark:text-dark-6 text-sm'>
            <div className='grid grid-cols-12 items-center w-full'>
              <div className='label-item col-span-4 flex items-center'>
                <span className='mr-1.5 mt-0.5 text-primary'>
                  <Icon icon='fa-regular:dot-circle' className='text-sm' />
                </span>
                <span className='text-gray-600'>{firstUpperLetter(t('map_page.address'))}</span>
              </div>
              <div className='value-item col-span-8'>
                <span className='text-gray-600'>
                  : {data['address'] ? data['address'] : hereAddressData.here_address}
                </span>
              </div>
            </div>
          </li>

          <div className='border-b border-gray-300 my-2 px-2'></div>
          <li className='text-body-color dark:text-dark-6 text-sm'>
            <div className='grid grid-cols-12 items-center w-full'>
              <div className='label-item col-span-4 flex items-center'>
                <span className='mr-1.5 mt-0.5 text-primary'>
                  <Icon icon='fa-regular:dot-circle' className='text-sm' />
                </span>
                <span className='text-gray-600'>{firstUpperLetter(t('map_page.lat_lng'))}</span>
              </div>
              <div className='value-item col-span-8'>
                <div className='flex justify-between'>
                  <div>
                    <span className='text-gray-600'>
                      : {data?.lat}, {data?.lon}
                    </span>
                  </div>
                  <div className='cursor-pointer'
                  onClick={() => openStreetView(data?.lat, data?.lon)} 
                  >
                    <Icon icon='mdi:eye-outline' className='text-2xl text-blue-400' />
                  </div>
                </div>
              </div>
            </div>
          </li>

          <div className='border-b border-gray-300 my-2 px-2'></div>

          {/* Next Address Row */}
          <li className='text-body-color dark:text-dark-6 text-sm'>
            <div className='grid grid-cols-12 items-center w-full'>
              <div className='label-item col-span-4 flex items-center'>
                <span className='mr-1.5 mt-0.5 text-primary'>
                  <Icon icon='fa-regular:dot-circle' className='text-sm' />
                </span>
                <span className='text-gray-600'>{t('map_page.next_address')}</span>
              </div>
              <div className='value-item col-span-8'>
                <span className='text-gray-600'>
                  :{' '}
                  {data['next_address'] ? data['next_address'] : hereAddressData.here_next_address}
                </span>
              </div>
            </div>
          </li>

          <div className='border-b border-gray-300 my-2 px-2'></div>

          {/* Zone Row */}
          <li className='text-body-color dark:text-dark-6 text-sm'>
            <div className='grid grid-cols-12 items-center w-full'>
              <div className='label-item col-span-4 flex items-center'>
                <span className='mr-1.5 mt-0.5 text-primary'>
                  <Icon icon='fa-regular:dot-circle' className='text-sm' />
                </span>
                <span className='text-gray-600'>{t('map_page.zone')}</span>
              </div>
              <div className='value-item col-span-8'>
                <span className='text-gray-600'>: {data['zone']}</span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CustomDataList;
