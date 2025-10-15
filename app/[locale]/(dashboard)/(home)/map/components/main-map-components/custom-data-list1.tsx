import React from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

interface CustomDataListProps {
  data?: Record<string, unknown>
  onClick?: () => void
  vehicleStatus: boolean
  hasCustomDataList2Data?: boolean
}

const CustomDataList: React.FC<CustomDataListProps> = ({
  data,
  // onClick, // Commented out - not used
  vehicleStatus,
  // hasCustomDataList2Data // Not used anymore after layout change
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className='flex items-center w-full justify-between'>
        <div className='label-item flex items-center gap-0 w-full'>
          <span className='mr-1.5 mt-0.5 text-primary'>
            <Icon icon='mingcute:time-line' className='text-xl text-blue-400' />
          </span>
          <span className='text-gray-600 font-medium text-sm'>{data?.last_timestamp as string || "--"} </span>
        </div>
      </div>
      <div className='border-b border-gray-300 my-1 px-0'></div>

      <div className='grid grid-cols gap-4 px-0'>
        <ul className='w-full'>
          {/* Address Row */}
          <li className='text-body-color dark:text-dark-6 text-sm'>
            <div className='label-item flex items-center text-right gap-0'>
               <span className='text-primary mr-2'>
                  <Icon icon='material-symbols:speed-outline-rounded' className='text-sm' />
                </span>
              <span className=' text-primary mr-4'>{data?.speed as string}km/hr</span>
              <span>
                <Icon
                  icon='mdi:engine-outline'
                  className={`text-lg ${
                    data?.ignition === true ? "text-orange-400" : "text-gray-400"
                  }`}
                />
              </span>
              <span className='mr-0 mt-0.5 text-primary'>
                <Icon
                  icon='radix-icons:dot-filled'
                  className={`text-2xl ${vehicleStatus ? "text-gray-400" : "text-success"}`}
                />
              </span>
              <span className={`text-md ${vehicleStatus ? "text-gray-400" : "text-success"}`}>
                {vehicleStatus ? t("general.offline") : t("general.online")}
              </span>
            </div>
            <div className='border-b border-gray-300 my-2 px-2'></div>

            <div className='flex items-center w-full gap-1'>
              <div className='label-item flex items-center'>
                <span className='mr-1.5 mt-0.5 text-primary'>
                  <Icon icon='entypo:address' className='text-sm' />
                </span>
              </div>
              <div className='value-item flex-1'>
                <span className='text-gray-600'>
                  {" "}
                  {data?.["cached_address"] === "" || data?.["cached_address"] === null
                    ? (data?.here_address as string)
                    : (data?.["cached_address"] as string)}
                </span>
                  <span className='text-gray-600 ml-2'>
                   {data?.lat ? (data.lat as string) : "--"},{" "}
                  {data?.lon ? (data.lon as string) : "--"}
                </span>
              </div>
            </div>
          </li>

          {/* Last Activity Row */}
          {/* <li className='text-body-color dark:text-dark-6 text-sm'>
            <div className='grid grid-cols-12 items-center w-full'>
              <div className={`label-item ${colSpanClass} flex items-center`}>
                <span className='mr-1.5 mt-0.5 text-primary'>
                  <Icon icon='fa-regular:dot-circle' className='text-sm' />
                </span>
                <span className='text-gray-600'>{firstUpperLetter(t('map_page.last_activity'))}</span>
              </div>
              <div className='value-item col-span-8'>
                <span className='text-gray-600'>
                  : {data?.last_timestamp == 'Invalid date' ? '--' : data?.last_timestamp as string}
                </span>
              </div>
            </div>
          </li> */}

          <div className='border-b border-gray-300 my-2 px-2'></div>
        </ul>
      </div>
    </div>
  );
};

export default CustomDataList;
