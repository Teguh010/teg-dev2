import React from 'react'
import { Input } from '@/components/ui/input'

const DynamicInput = ({
  value,
  onChange,
  type = 'text', // Type can be text, number, etc.
  placeholder = '',
  label,
  min = 0,
  size,
  color,
  variant,
  radius,
  shadow,
}) => {
  return (
    <div>
      {/* Render label if provided */}
      {label && <label className='block mb-1 text-sm font-medium text-gray-500'>{label}</label>}

      {/* Render Input dynamically */}
      <Input
        type={type}
        value={value === undefined || value === null ? '' : String(value)}
        onChange={(e) => {
          const newValue = type === 'number' ? Number(e.target.value) : e.target.value
          onChange(newValue)
        }}
        placeholder={placeholder}
        min={type === 'number' ? min : undefined}
        size={size}
        color={color}
        variant={variant}
        radius={radius}
        shadow={shadow}
      />
    </div>
  )
}

export default DynamicInput
