import React from 'react';
import CustomAvatar from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { formatDuration } from '@/lib/utils';


interface CustomListProps {
  data: any
  onSelect: (data: any) => void
  isActive?: boolean
  fallback: string
  bgColor: string
  fontSize: string
  ref?: any
}

const CustomList: React.FC<CustomListProps> = ({
  data,
  onSelect,
  isActive,
  fallback,
  bgColor,
  fontSize,
  ref
}) => {
  const { t } = useTranslation();


  return (
    <div
    ref={ref} // Gunakan ref di sini
      className={`relative flex flex-col overflow-hidden text-gray-700 bg-white bg-clip-border border-b-[1px] border-gray-200 ${
        isActive ? 'bg-gray-200 text-white' : ''
      }`}
      onClick={() => onSelect(data)}
    >
      <nav className='my-0 flex min-w-[240px] flex-col gap-1 p-0 font-sans text-base font-normal text-blue-gray-700 cursor-pointer'>
        <div
          role='text'
          className={`group flex w-full rounded-none p-3 py-1.5 px-3 text-start text-sm font-normal text-blue-gray-700 outline-none transition-all ${
            isActive
              ? 'bg-gray-200 text-white'
              : 'hover:bg-gray-200 hover:bg-opacity-80 hover:text-white focus:bg-gray-200 focus:bg-opacity-80 focus:text-white'
          }`}
        >
          <div className='grid mr-4 place-items-center'>
            <CustomAvatar
              alt={t('general.name')}
              fallback={t(fallback)}
              bgColor={bgColor}
              fontSize={fontSize}
            />
          </div>
          {data[('time')] ? (
            <>
              <div className='flex flex-col items-center text-green-700 pt-1'>
                {data[('time')]}
              </div>
            </>
          ) : (
            <>
              <div>
                <div className='flex flex-col items-center text-green-700'>
                  {data[('time_from')]}
                </div>
                <div className='text-red-600'>{data[('time_to')]}</div>
              </div>
            </>
          )}

          {data[('duration')] ? (
            <>
              <div className='grid ml-auto'>
                <div>
                  <span className='text-gray-700'>
                    {formatDuration(data[('duration')])}
                    </span>
                </div>
              </div>
            </>
          ) : (
            ''
          )}
        </div>
      </nav>
    </div>
  );
};

export default CustomList;
