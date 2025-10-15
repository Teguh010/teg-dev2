import React from 'react';
import { Icon } from '@iconify/react';
import CustomAvatar from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { firstUpperLetter } from '@/lib/utils';

interface TotalContentProps {
  data?: any
  onClick?: () => void
}

const TotalContent: React.FC<TotalContentProps> = ({ data, onClick }) => {
  const { t } = useTranslation();
  return (
    <div>
      {/* <div className='border-b border-gray-300 my-2 px-0'></div> */}
      <div className={`grid  gap-4 px-4 ${data['trip_mode_exists'] ? 'grid-cols-2': 'grid-cols-1'}`}>
        <div>
          <ul className='w-full'>
            <li className='flex text-body-color dark:text-dark-6 text-sm'>
              <div className='flex items-center gap-2 w-full'>
                <div className='label-item flex items-center gap-0 w-full'>
                  <span className='mr-1.5 mt-0.5 text-primary'>
                    <Icon icon='fa-regular:dot-circle' className='text-sm' />
                  </span>
                  <span className='text-gray-600'>{firstUpperLetter(t('map_page.distance'))}</span>
                </div>
                <div className='value-item  w-[65%]'>
                  <span className='text-gray-600'>: {data['distance_(km)']}</span>
                </div>
              </div>
            </li>
            <div className='border-b border-gray-300 my-2 px-2'></div>
            <li className='flex text-body-color dark:text-dark-6 text-sm'>
              <div className='flex items-center gap-2 w-full'>
                <div className='label-item flex items-center gap-0 w-full'>
                  <span className='mr-1.5 mt-0.5 text-primary'>
                    <Icon icon='fa-regular:dot-circle' className='text-sm' />
                  </span>
                  <span className='text-gray-600'>{firstUpperLetter(t('map_page.fuel_used'))}</span>
                </div>
                <div className='value-item  w-[65%]'>
                  <span className='text-gray-600'>: {data['fuel_used_(l)']}</span>
                </div>
              </div>
            </li>
            <div className='border-b border-gray-300 my-2 px-2'></div>
            <li className='flex text-body-color dark:text-dark-6 text-sm'>
              <div className='flex items-center gap-2 w-full'>
                <div className='label-item flex items-center gap-0 w-full'>
                  <span className='mr-1.5 mt-0.5 text-primary'>
                    <Icon icon='fa-regular:dot-circle' className='text-sm' />
                  </span>
                  <span className='text-gray-600'>{firstUpperLetter(t('map_page.moving_time'))}</span>
                </div>
                <div className='value-item  w-[65%]'>
                  <span className='text-gray-600'>: {data['moving_time']}</span>
                </div>
              </div>
            </li>
            <div className='border-b border-gray-300 my-2 px-2'></div>
            <li className='flex text-body-color dark:text-dark-6 text-sm'>
              <div className='flex items-center gap-2 w-full'>
                <div className='label-item flex items-center gap-0 w-full'>
                  <span className='mr-1.5 mt-0.5 text-primary'>
                    <Icon icon='fa-regular:dot-circle' className='text-sm' />
                  </span>
                  <span className='text-gray-600'>{firstUpperLetter(t('map_page.fuel_norm'))}</span>
                </div>
                <div className='value-item  w-[65%]'>
                  <span className='text-gray-600'>
                    : {data['fuel_norm'] ? data['fuel_norm'] : '-'}
                  </span>
                </div>
              </div>
            </li>
            <div className='border-b border-gray-300 my-2 px-2'></div>
            <li className='flex text-body-color dark:text-dark-6 text-sm'>
              <div className='flex items-center gap-2 w-full'>
                <div className='label-item flex items-center gap-0 w-full'>
                  <span className='mr-1.5 mt-0.5 text-primary'>
                    <Icon icon='fa-regular:dot-circle' className='text-sm' />
                  </span>
                  <span className='text-gray-600'>{t('map_page.distance_job')}</span>
                </div>
                <div className='value-item  w-[65%]'>
                  <span className='text-gray-600'>
                    : {data['distance_job'] ? data['distance_job'] : '-'}
                  </span>
                </div>
              </div>
            </li>
          </ul>
        </div>
        {data['trip_mode_exists'] && (
          <div>
            <ul className='w-full'>
              {/* <li className='flex text-body-color dark:text-dark-6 text-sm'>
                <div className='flex items-center gap-2 w-full'>
                  <div className='label-item flex items-center gap-0 w-full'>
                    <span className='mr-1.5 mt-0.5 text-primary'>
                      <Icon icon='fa-regular:dot-circle' className='text-sm' />
                    </span>
                    <span className='text-gray-600'>Trip Mode Exists</span>
                  </div>
                  <div className='value-item  w-[65%]'>
                    <span className='text-gray-600'>
                      : {data['trip_mode_exists'] ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </li>
              <div className='border-b border-gray-300 my-2 px-2'></div>
              <li className='flex text-body-color dark:text-dark-6 text-sm'>
                <div className='flex items-center gap-2 w-full'>
                  <div className='label-item flex items-center gap-0 w-full'>
                    <span className='mr-1.5 mt-0.5 text-primary'>
                      <Icon icon='fa-regular:dot-circle' className='text-sm' />
                    </span>
                    <span className='text-gray-600'>Moving Time Job</span>
                  </div>
                  <div className='value-item  w-[65%]'>
                    <span className='text-gray-600'>: {data['moving_time_job']}</span>
                  </div>
                </div>
              </li>
              <div className='border-b border-gray-300 my-2 px-2'></div> */}
              <li className='flex text-body-color dark:text-dark-6 text-sm'>
                <div className='flex items-center gap-2 w-full'>
                  <div className='label-item flex items-center gap-0 w-full'>
                    <span className='mr-1.5 mt-0.5 text-primary'>
                      <Icon icon='fa-regular:dot-circle' className='text-sm' />
                    </span>
                    <span className='text-gray-600'>{t('map_page.stationary_time_job')}</span>
                  </div>
                  <div className='value-item  w-[65%]'>
                    <span className='text-gray-600'>: {data['distance_job']}</span>
                  </div>
                </div>
              </li>
              <div className='border-b border-gray-300 my-2 px-2'></div>
              <li className='flex text-body-color dark:text-dark-6 text-sm'>
                <div className='flex items-center gap-2 w-full'>
                  <div className='label-item flex items-center gap-0 w-full'>
                    <span className='mr-1.5 mt-0.5 text-primary'>
                      <Icon icon='fa-regular:dot-circle' className='text-sm' />
                    </span>
                    <span className='text-gray-600'>{t('map_page.moving_time_private')}</span>
                  </div>
                  <div className='value-item  w-[65%]'>
                    <span className='text-gray-600'>: {data['distance_private']}</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TotalContent;
