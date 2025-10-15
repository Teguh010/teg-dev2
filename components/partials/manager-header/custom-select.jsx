import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, ChevronDown } from 'lucide-react'
import { deselectCustomer } from '@/models/manager/session'
import { useUser } from '@/context/UserContext'
import { useSelectedCustomerStore } from '@/store/selected-customer'
import toast from 'react-hot-toast'
import * as Popover from '@radix-ui/react-popover'

const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  label = undefined,
  disabled = false,
  className,
  onClear 
}) => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const { operations: { getUserRef } } = useUser()
  const { clearSelectedCustomer } = useSelectedCustomerStore()

  // Get selected option label
  const selectedOption = options.find(opt => opt.value === value)
  const displayValue = selectedOption ? selectedOption.label : ''

  // Update search query when dropdown closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
    }
  }, [open])

  const handleClear = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    setSearchQuery('')
    onClear?.()
    
    const currentUser = getUserRef()
    if (!currentUser?.token) return

    try {
      const response = await deselectCustomer(currentUser.token)
      if (response?.success) {
        clearSelectedCustomer()
        toast.success(t("success.customer_deselected"))
      } else {
        toast.error(t("error.deselect_customer"))
      }
    } catch (error) {
      console.error('Error deselecting customer:', error)
      toast.error(t("error.deselect_customer"))
    }
  }

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value)
    if (!open) {
      setOpen(true)
    }
  }

  const handleInputFocus = () => {
    setOpen(true)
  }

  const handleSelectOption = (optionValue) => {
    onChange(optionValue)
    setOpen(false)
    setSearchQuery('')
    inputRef.current?.blur()
  }

  const handleInputClick = (e) => {
    if (disabled) return
    setOpen(!open)
  }

  return (
    <div className={className}>
      {label && <label className='block text-sm font-small text-gray-500'>{label}</label>}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <div className='relative'>
            <Input
              ref={inputRef}
              value={open ? searchQuery : displayValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onClick={handleInputClick}
              placeholder={placeholder}
              disabled={disabled}
              className='h-8 pr-16 cursor-pointer'
              autoComplete='off'
            />
            <div className='absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1'>
              {value && (
                <div
                  className='p-1 hover:bg-gray-100 rounded'
                  onClick={handleClear}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <X className='h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700' />
                </div>
              )}
              <ChevronDown className='h-4 w-4 text-gray-500' />
            </div>
          </div>
        </Popover.Trigger>
        
        <Popover.Portal>
          <Popover.Content
            className='bg-white border rounded-md shadow-lg z-50 w-[var(--radix-popover-trigger-width)]'
            sideOffset={5}
            align='start'
            onOpenAutoFocus={(e) => {
              e.preventDefault()
              inputRef.current?.focus()
            }}
          >
            <ScrollArea className='h-[200px]'>
              {filteredOptions.length > 0 ? (
                <div className='py-1'>
                  {filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      className='px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm'
                      onClick={() => handleSelectOption(option.value)}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              ) : (
                <div className='py-6 px-3 text-sm text-gray-500 text-center'>
                  {t('No results found')}
                </div>
              )}
            </ScrollArea>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}

export default CustomSelect
