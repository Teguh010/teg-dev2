import React, { useState } from 'react'
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from '@/components/ui/custom-select'
import { Icon } from '@iconify/react'
import './footer-map.css'
import { useTranslation } from 'react-i18next'

const GroupSelection = ({ data, onSelect, onClear, selectedGroupId }) => {
  const { t } = useTranslation()
  const [internalSelectedGroupId, setInternalSelectedGroupId] = useState(selectedGroupId || '')
   const handleClear = () => {
     setInternalSelectedGroupId('') 
     onSelect('') 
     if (onClear) onClear() // Call onClear if provided
   }


  const handleValueChange = (value) => {
    setInternalSelectedGroupId(value) // Update internal state
    onSelect(value) // Callback to parent
  }

  return (
    <div className='mb-2 flex items-center border rounded-sm'>
      <Select
        value={internalSelectedGroupId}
        onValueChange={handleValueChange}
        className='rounded-xs w-full'
      >
        <SelectTrigger>
          <SelectValue>
            {data.find((item) => item.id === internalSelectedGroupId)?.val || t('map_page.select_group')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {data.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.val}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        onClick={handleClear}
        className='p-0 rounded-full hover:bg-gray-200 focus:outline-none ml-[-5px] mr-4'
      >
        <Icon icon='tabler:x' className='text-xl text-gray-400' />
      </button>
    </div>
  )
}

export default GroupSelection
