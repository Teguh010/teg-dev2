import React, { useState } from 'react'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

const MultiSelect = ({
  value = [],
  onChange,
  options = [],
  placeholder = 'Select options',
  label = undefined,
  disabled = false,
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Convert value to string for comparison
  const valueStrings = value.map(v => String(v))
  
  // Filter options by search
  const filteredOptions = search
    ? options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = (selectedValue) => {
    const selectedValueStr = String(selectedValue)
    
    if (valueStrings.includes(selectedValueStr)) {
      // Remove if already selected
      const newValue = value.filter(v => String(v) !== selectedValueStr)
      onChange(newValue)
    } else {
      // Add if not selected - convert back to original type
      const originalValue = options.find(opt => String(opt.value) === selectedValueStr)?.value
      if (originalValue !== undefined) {
        const newValue = [...value, originalValue]
        onChange(newValue)
      }
    }
  }

  const handleRemove = (valueToRemove) => {
    const newValue = value.filter(v => v !== valueToRemove)
    onChange(newValue)
  }

  const getSelectedLabels = () => {
    return value.map(v => {
      const option = options.find(opt => opt.value === v)
      return option ? option.label : String(v)
    })
  }

  return (
    <div>
      {label && <label className='block text-sm font-medium text-gray-700 mb-2'>{label}</label>}
      
      {/* Multi-select dropdown with badges inside */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          disabled={disabled}
          className="w-full px-2 py-1 border rounded-md min-h-9 flex items-center justify-between text-left bg-white"
        >
          <div className="flex-1 flex flex-wrap gap-1 py-1">
            {value.length > 0 ? (
              getSelectedLabels().map((label, index) => (
                <span
                  key={value[index]}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
                >
                  {label}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(value[index])
                    }}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {open && (
          <div className="absolute z-50 w-full mt-1 border rounded-md shadow-lg max-h-100 overflow-auto bg-white">
            <div className="p-2">
              <input
                type="text"
                className="w-full border px-2 py-1 rounded focus:outline-none"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-gray-400">No options</div>
            )}
            {filteredOptions.map((option) => {
              const optionValueStr = String(option.value)
              const isSelected = valueStrings.includes(optionValueStr)
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    handleSelect(option.value)
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
                    isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                >
                  <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                    isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {option.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Click outside to close */}
      {open && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}

export default MultiSelect