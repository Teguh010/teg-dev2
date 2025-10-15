"use client";
import { useState, useRef } from "react";
import { Car as CarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from 'react-i18next';
import { firstUpperLetter } from "@/lib/utils";

export default function VehiclePicker({
  vehicles,
  setVehicleObject,
  className = undefined,
  selectedVehicle,
}) {
  const [search, setSearch] = useState('')
  const inputRef = useRef(null)
  const { t } = useTranslation()

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant='outline' size='sm' className='h-8'>
            <CarIcon className='mr-2 h-4 w-4' />
            {selectedVehicle ? (
              <>
                <span className='capitalize'>{t('general.vehicle')}</span>
                <Separator orientation='vertical' className='mx-2 h-4' />
                <Badge color='secondary' className='rounded-sm px-1 font-normal'>
                  {selectedVehicle.name}
                </Badge>
              </>
            ) : (
              <span>{firstUpperLetter(t('general.pick_a_vehicle'))}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Command>
            <CommandInput
              ref={inputRef}
              className='capitalize'
              placeholder={t('general.vehicle')}
              value={search}
              onValueChange={(event) => setSearch(event)}
            />
            <CommandList>
              <CommandEmpty>{firstUpperLetter(t('general.no_results_found'))}.</CommandEmpty>
              <PopoverClose asChild>
                <CommandGroup>
                  {vehicles &&
                    vehicles.length > 0 &&
                    vehicles.map((vehicle) => (
                      <CommandItem
                        key={vehicle.id}
                        onSelect={() => {
                          setVehicleObject(vehicle)
                          setSearch('')
                        }}
                      >
                        <span>{vehicle.name}</span>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </PopoverClose>
            </CommandList>
            <CommandSeparator />
          </Command>
          <div className='flex flex-row w-full justify-end gap-1 p-2'>
            <Button
              className='justify-center text-center capitalize'
              variant='outline'
              color='dark'
              size='xxs'
              onClick={() => (setSelectedVehicle(null), setSearch(''))}
            >
              {t('reset')}
            </Button>
            <PopoverClose asChild>
              <Button
                className='justify-center text-center capitalize'
                variant='outline'
                color='dark'
                size='xxs'
              >
                {t('general.close')}
              </Button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}