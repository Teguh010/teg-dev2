import React from 'react'
// import CustomAvatar from '@/components/ui/avatar'
import CustomDropdownMenu from '@/components/partials/sidebar/map-sidebar/custom-dropdown-menu'
import { Icon } from '@iconify/react'
import { useTranslation } from 'react-i18next'

interface CustomListProps {
  // icon?: React.ReactNode
  title: string
  // fallback?: string
  trip_state?: string
  // badge?: string | number
  onClickList?: () => void
  onCheckboxChange?: (checked: boolean) => void
  isChecked: boolean
  ignition?: boolean
  activeVehicleId?: any
  object?: any
  onDistanceTo?: (vehicle: any) => void
}

const CustomList: React.FC<CustomListProps> = ({
  // icon,
  title,
  // fallback,
  onClickList,
  onCheckboxChange,
  isChecked,
  trip_state,
  ignition,
  activeVehicleId,
  object,
  onDistanceTo,
}) => {
  const { t } = useTranslation()

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const checked = e.target.checked;
    if (onCheckboxChange) {
      onCheckboxChange(checked);
    }
  };

  // Menu items for the dropdown
  const dropdownItems = [
    { label: t('map_page.distance_to'), onClick: () => onDistanceTo && onDistanceTo(object) },
    { label: t('map_page.show_events'), onClick: () => console.warn('Action 2 selected') },
  ]
  const isActiveVehicle = activeVehicleId === object.id // Check if this item is active
  return (
    <div
      className={`relative flex flex-col overflow-hidden text-gray-700 bg-clip-border border-b-[1px] border-gray-200 ${
        isActiveVehicle ? 'bg-blue-100' : 'bg-white' // Apply active style if the vehicle is active
      }`}
    >
      {' '}
      <nav className='my-0 flex min-w-[240px] flex-col gap-1 p-0 font-sans text-base font-normal text-blue-gray-700'>
        <div
          role='text'
          className='flex py-1 items-center text-sm font-normal text-blue-gray-700 outline-none transition-all hover:bg-blue-400 hover:bg-opacity-80 hover:text-white focus:bg-blue-500 focus:bg-opacity-80 focus:text-white active:bg-blue-gray-50 active:bg-opacity-80 active:text-blue-gray-900'
        >
          <div className='pl-4'>
            <input
              type='checkbox'
              checked={isChecked}
              onChange={handleCheckboxChange}
              className='mr-2'
            />
          </div>
          <div
            onClick={onClickList}
            className='group flex items-center w-full rounded-none p-3 py-1.5 text-start cursor-pointer'
          >
            <div>
              <div >{title}</div>
              <div className='text-xs text-gray-500'>{object.driver_name ? object.driver_name : ''}</div>
            </div>
            <div className='flex items-center gap-2 ml-auto'>
              <div className='stop-or-play'>
                <Icon
                  icon={
                    trip_state === 'moving'
                      ? 'emojione-monotone:right-arrow'
                      : 'material-symbols:stop-circle-outline'
                  }
                  className={`text-lg ${
                    trip_state === 'moving' ? 'text-success' : 'text-blue-700'
                  }`}
                />
              </div>
              <div>
                <Icon
                  icon='mdi:engine-outline'
                  className={`text-lg ${ignition === true ? 'text-orange-400' : 'text-gray-400'}`}
                />
              </div>
              {/* Use CustomDropdownMenu for the dots icon */}
              <CustomDropdownMenu
                icon='tabler:dots'
                menuItems={dropdownItems}
                textColor='text-gray-700' // Optional: Customize the text color
                bgColor='bg-white' // Optional: Customize the background color
              />
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default CustomList;
