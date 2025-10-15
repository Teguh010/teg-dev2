import React from 'react'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'

const TransportModeSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  label, // Add label prop
}) => {
  return (
    <div >
      {/* Container for spacing */}
      {label && <label className='block mb-1 text-sm font-medium text-gray-500'>{label}</label>}{' '}
      {/* Render label */}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className='p-2 border rounded-md w-full'>
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
