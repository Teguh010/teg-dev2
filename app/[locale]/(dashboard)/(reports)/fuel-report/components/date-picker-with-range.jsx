'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn, firstUpperLetter } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar-timer'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from '@/components/ui/popover'
import { Command, CommandSeparator } from '@/components/ui/command'
import TimePicker from 'react-time-picker'
import 'react-time-picker/dist/TimePicker.css'
import 'react-clock/dist/Clock.css'
import { Separator } from '@/components/ui/separator'
import { useTranslation } from 'react-i18next'

export default function DatePickerWithRange({
  className = undefined,
  setStartDate,
  setEndDate,
  startDate,
  endDate,
  settings = undefined,
}) {
  const [startTime, setStartTime] = useState('00:00')
  const [endTime, setEndTime] = useState('23:59')
  const [date, setDate] = useState({ from: new Date(), to: new Date() })
  const [unitDistance, setUnitDistance] = useState(
    settings.find((setting) => setting.title === 'unit_distance')?.value
  )
  const [unitVolume, setUnitVolume] = useState(
    settings.find((setting) => setting.title === 'unit_volume')?.value
  )
  const [dateFormat, setDateFormat] = useState(
    settings.find((setting) => setting.title === 'date_format')?.value
  )
  const [timeFormat, setTimeFormat] = useState(
    settings.find((setting) => setting.title === 'time_format')?.value
  )
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultMonth = new Date()
  defaultMonth.setMonth(defaultMonth.getMonth() - 1)
  const disabledDays = [{ from: tomorrow, to: new Date(9999, 11, 31) }]
  const { t } = useTranslation()

  const handleStartTimeChange = (time) => {
    setStartTime(time)
    if (startDate) {
      const updatedDate = new Date(startDate)
      const [hours, minutes] = time.split(':')
      updatedDate.setHours(hours)
      updatedDate.setMinutes(minutes)
      setStartDate(updatedDate)
    }
  }

  const handleEndTimeChange = (time) => {
    setEndTime(time)
    if (endDate) {
      const updatedDate = new Date(endDate)
      const [hours, minutes] = time.split(':')
      updatedDate.setHours(hours)
      updatedDate.setMinutes(minutes)
      setEndDate(updatedDate)
    }
  }

  useEffect(() => {
    if (date?.from) {
      const updatedDate = new Date(date.from)
      const [hours, minutes] = startTime.split(':')
      updatedDate.setHours(hours)
      updatedDate.setMinutes(minutes)
      setStartDate(updatedDate)
    }
    if (date?.to) {
      const updatedDate = new Date(date.to)
      const [hours, minutes] = endTime.split(':')
      updatedDate.setHours(hours)
      updatedDate.setMinutes(minutes)
      setEndDate(updatedDate)
    }
  }, [date])

  useEffect(() => {
    if (settings.length > 0) {
      settings.map((setting) => {
        if (setting.title === 'time_format') {
          setTimeFormat(setting.value)
        }
        if (setting.title === 'unit_distance') {
          setUnitDistance(setting.value)
        }
        if (setting.title === 'unit_volume') {
          setUnitVolume(setting.value)
        }
        if (setting.title === 'date_format') {
          setDateFormat(setting.value)
        }
      })
    }
  }, [settings])

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            className={`${!endDate ? 'h-8' : 'h-12 md:h-8'} px-0`}
          >
            <div className='flex flex-col md:flex-row'>
              {startDate && (
                <div className='flex flex-row items-center px-2'>
                  <span className='capitalize'>{t('general.from')}</span>
                  <Badge color='secondary' className='rounded-sm font-normal px-2 mx-2'>
                    {format(startDate, 'LLLdd,yy-h:mmaaa')}
                  </Badge>
                </div>
              )}
              {endDate && (
                <div className='flex flex-row items-center px-2'>
                  <span className='md:pl-2 capitalize'>{t('to')}</span>
                  <Badge color='secondary' className='rounded-sm font-normal px-2 mx-2'>
                    {format(endDate, 'LLLdd,yy-h:mmaaa')}
                  </Badge>
                </div>
              )}
            </div>
            {!startDate && !endDate && (
              <>
                <CalendarIcon className='mr-2 h-4 w-4' />
                <span>{firstUpperLetter(t('general.pick_a_date'))}</span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='end'>
          <div className='w-full flex flex-row md:flex-col h-[500px] overflow-y-scroll md:h-auto md:overflow-hidden'>
            <Calendar
              initialFocus
              mode='range'
              defaultMonth={defaultMonth}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              disabled={disabledDays}
              showOutsideDays={false}
            />
            <div className='flex flex-col md:flex-row justify-around pb-2 pl-4 md:pl-0'>
              <TimePicker
                locale={timeFormat === 'HH:mm' && 'hu-HU'}
                onChange={handleStartTimeChange}
                value={startTime}
                clearIcon={false}
                clockIcon={false}
                CalendarIcon={false}
              />
              <TimePicker
                locale={timeFormat === 'HH:mm' && 'hu-HU'}
                onChange={handleEndTimeChange}
                value={endTime}
                clearIcon={false}
                clockIcon={false}
                CalendarIcon={false}
              />
            </div>
          </div>
          <Command>
            <CommandSeparator />
          </Command>
          <div className='flex flex-row w-full justify-end gap-1 p-2'>
            <PopoverClose asChild>
              <Button
                className='justify-center text-center capitalize'
                variant='outline'
                color='dark'
                size='xxs'
              >
                {t('ok')}
              </Button>
            </PopoverClose>
            <Button
              className='justify-center text-center capitalize'
              variant='outline'
              color='dark'
              size='xxs'
              onClick={() => (
                setDate(null),
                setStartDate(null),
                setEndDate(null),
                setStartTime('00:00'),
                setEndTime('00:00')
              )}
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
