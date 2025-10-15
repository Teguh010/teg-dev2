import React from 'react'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { useTranslation } from 'react-i18next'

const TransportModeSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  label = undefined,
  disabled = false,
}) => {
  const { t } = useTranslation()

  return (
    <div>
      {label && <label className='block  text-sm font-small text-gray-500 pb-1'>{label}</label>}
      <Select 
        value={value} 
        onValueChange={onChange}
        disabled={disabled}
        className='h-8'
      >
        <SelectTrigger className='px-2 border rounded-md w-full my-0 py-0 h-9'>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default TransportModeSelect
