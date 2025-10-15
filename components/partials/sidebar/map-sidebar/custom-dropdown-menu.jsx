import React from 'react'
import { Icon } from '@iconify/react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

const CustomDropdownMenu = ({
  icon,
  menuItems,
  textColor = 'text-black',
  bgColor = 'bg-white',
  side = 'right',
  align = 'center'
}) => {
  const handleMenuItemClick = (onClick) => (e) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {icon ? <Icon icon={icon} className={`text-lg cursor-pointer ${textColor}`} /> : ''}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align} className={`${bgColor} z-50`}>
        {menuItems.map((item, index) => (
          <DropdownMenuItem key={index} onClick={handleMenuItemClick(item.onClick)}>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default CustomDropdownMenu
