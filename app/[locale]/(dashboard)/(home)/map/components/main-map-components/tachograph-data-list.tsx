import React from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { parseISO, differenceInMinutes, format } from 'date-fns';

interface TachographStats {
  ignition: string;
  driver_state: number;
  gpstime: string;
  remaining_current_drive_time: number;
  remaining_drive_time_current_shift: number;
  remaining_drive_time_current_week: number;
  total_drive_time: number;
  remaining_10h_times: number;
  next_break_rest_duration: number;
  time_left_until_daily_rest: number;
  reduced_daily_rests_remaining: number;
  end_of_last_daily_rest: number;
}

interface TachographData {
  stats: TachographStats[][];
}

interface TachographDataListProps {
  objectId?: string | number
  tachoData?: TachographData[]
}

const isValidTachoValue = (value: number | null): boolean => {
  return value !== null && value !== 7 && value >= 0; // 7 indicates data not available
};

const TachographDataList: React.FC<TachographDataListProps> = ({ tachoData }) => {
  const { t } = useTranslation();
  const matchingTachoData = tachoData?.[0];
  const stats = matchingTachoData?.stats?.[0]?.[0];

  if (!matchingTachoData || !stats) return null;

  const formatMinutes = (minutes: number): string => {
    if (!minutes && minutes !== 0) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const calculateProgress = (current: number, max: number) => {
    return ((max - current) / max) * 100;
  };

    const calculateProgress2 = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const timers = [
    {
      label: t('map_page.time_before_rest'),
      value: stats.remaining_current_drive_time,
      max: 270,
      maxLabel: '4:30',
      icon: 'tabler:steering-wheel-filled',
      warning: 27,    // 10% from 270
      critical: 13    // 5% from 270
    },
    {
      label: t('map_page.shift'),
      value: stats.remaining_drive_time_current_shift,
      max: isValidTachoValue(stats.remaining_10h_times) && stats.remaining_10h_times > 0 ? 600 : 540,
      maxLabel: isValidTachoValue(stats.remaining_10h_times) && stats.remaining_10h_times > 0 ? '10:00' : '9:00',
      icon: 'tabler:steering-wheel-filled',
      warning: 60,    // 10% from 600
      critical: 30    // 5% from 600
    },
    {
      label: t('map_page.weekly'),
      value: stats.remaining_drive_time_current_week,
      max: 3360,
      maxLabel: '56:00',
      icon: 'mdi:calendar-week',
      warning: 336,   // 10% from 3360
      critical: 168   // 5% from 3360
    },
    {
      label: t('map_page.biweekly'),
      value: stats.total_drive_time,
      max: 5400,
      maxLabel: '90:00',
      icon: 'mdi:calendar-month',
      warning: 540,   // 10% from 5400
      critical: 270   // 5% from 5400
    }
  ];

  const getDriverStateInfo = (state: number) => {
    switch (state) {
      case 0:
        return {
          label: t('map_page.driver_state_0'),
          icon: 'mdi:account-sleep',
          color: 'text-gray-400'
        };
      case 1:
        return {
          label: t('map_page.driver_state_1'),
          icon: 'mdi:account-clock',
          color: 'text-blue-400'
        };
      case 2:
        return {
          label: t('map_page.driver_state_2'),
          icon: 'mdi:account-hard-hat',
          color: 'text-amber-500'
        };
      case 3:
        return {
          label: t('map_page.driver_state_3'),
          icon: 'mdi:steering',
          color: 'text-green-500'
        };
      default:
        return {
          label: t('map_page.unknown'),
          icon: 'mdi:help-circle',
          color: 'text-gray-400'
        };
    }
  };

  const getProgressColor = (value: number, warning: number, critical: number, max: number) => {
    const remainingPercentage = ((max - value) / max) * 100;

    if (remainingPercentage >= 100) {
      return 'bg-blue-400'; //
    }
    if (remainingPercentage >= 30) {
      return 'bg-blue-300';
    }
    if (remainingPercentage >= 10) {
      return 'bg-amber-500';
    }
    return 'bg-red-500';
  };

 const getTextColor = (label: string, value: number, warning: number, critical: number, max: number) => {
  let percentage;

  if (label === 'Time Before Rest' || label === t('map_page.time_before_rest') || label === t('map_page.shift')) {
    percentage = (value / max) * 100;
  } else {
    percentage = ((max - value) / max) * 100;
  }

  if (percentage >= 100) {
    return 'text-gray-600'; 
  }
  if (percentage >= 10) {
    return 'text-gray-600'; 
  }
  if (percentage >= 5) {
    return 'text-gray-600'; 
  }
  return 'text-red-500';
};

  const getRestDuration = (gpstime: string, ignition: string) => {
    if (ignition === 'off') return null;

    try {
      const gpsDate = parseISO(gpstime);
      const now = new Date();
      const diffInMinutes = differenceInMinutes(now, gpsDate);

      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;

      const hoursText = hours > 0 ? `${hours} ${hours === 1 ? 'hour' : 'hours'}` : '';
      const minutesText = minutes > 0 ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}` : '';

      if (hours > 0 && minutes > 0) {
        return `${hoursText} ${minutesText}`;
      } else if (hours > 0) {
        return hoursText;
      } else if (minutes > 0) {
        return minutesText;
      } else {
        return '0 minutes';
      }
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };

  return (
    <div className='p-1 bg-slate-50/80 rounded-lg text-xs'>
      {/* Header with Driver State and Ignition */}
      <div
        className={`flex items-center justify-between mb-1 ${
          stats.ignition === 'off' ? 'opacity-60 pointer-events-none' : ''
        }`}
      >
        <div className='flex flex-col sm:flex-row sm:items-center gap-1.5'>
          {/* Row 1: Ignition + Driver State (always in one row) */}
          <div className='flex items-center gap-1.5'>
            {/* Ignition Status */}
            <div className='flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border'>
              <Icon
                icon={stats.ignition === 'on' ? 'mdi:engine' : 'mdi:engine-off'}
                className={`text-base ${
                  stats.ignition === 'on' ? 'text-green-600' : 'text-gray-400'
                }`}
              />
              <span className='text-[11px] text-gray-600 capitalize'>{stats.ignition}</span>
            </div>

            {/* Driver State */}
            <div className='flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border'>
              <Icon
                icon={getDriverStateInfo(stats.driver_state).icon}
                className={`text-base ${getDriverStateInfo(stats.driver_state).color}`}
              />
              <span className='text-[11px] text-gray-600'>
                {t(getDriverStateInfo(stats.driver_state).label)}
                {stats.ignition === 'off' && stats.driver_state === 0 && (
                  <span className='text-[10px] text-gray-600'>
                    : {getRestDuration(stats.gpstime, stats.ignition)}
                  </span>
                )}
              </span>
            </div>
          </div>
          
          {/* Row 2: GPS Time (separate row on mobile, inline on desktop) */}
          <div className='text-gray-600 text-[11px] sm:text-xs'>
            {stats.gpstime ? format(parseISO(stats?.gpstime), 'yyyy-MM-dd HH:mm:ss') : "-"}
          </div>
        </div>
      </div>

      {/* Main Timers Grid */}

      <div className={`${
            stats.ignition === 'off' ? 'opacity-30 pointer-events-none' : ''
          }`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-1.5">
          {timers.map((timer, idx) => {
            return (
              <div key={idx} className='bg-white rounded p-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'>
                <div className='flex items-center justify-between gap-1'>
                  <div className='flex items-center gap-1'>
                    <Icon icon={timer.icon} className='text-base text-blue-400' />
                    <div className='flex flex-col'>
                      <span className='text-[10px] text-gray-500 leading-tight'>{timer.label}</span>
                      <span
                        className={`text-[10px] font-medium leading-tight ${getTextColor(
                          timer.label,
                          timer.value,
                          timer.warning,
                          timer.critical,
                          timer.max
                        )}`}
                      >
                        {formatMinutes(timer.value)} / {timer.maxLabel}
                      </span>
                    </div>
                  </div>
                  {timer.label === 'Shift' && (
                    <div className='flex flex-col'>
                      <div className='flex gap-0.5'>
                        {[...Array(2)].map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-[14px] h-[14px] rounded-full${
                              isValidTachoValue(stats.remaining_10h_times) &&
                              idx < (stats.remaining_10h_times || 0)
                                ? ' bg-blue-400'
                                : 'bg-gray-200'
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className='relative'>
                  {timer.label === 'Time Before Rest' || timer.label === 'Shift' ? (
                    <Progress
                      value={calculateProgress2(timer.value, timer.max)}
                      className='h-[10px] mt-1'
                      indicatorClassName={`transition-all ${getProgressColor(
                        timer.max - timer.value,
                        timer.warning,
                        timer.critical,
                        timer.max
                      )}`}
                    />
                  ) : (
                    <Progress
                      value={calculateProgress(timer.value, timer.max)}
                      className='h-[10px] mt-1'
                      indicatorClassName={`transition-all ${getProgressColor(
                        timer.value,
                        timer.warning,
                        timer.critical,
                        timer.max
                      )}`}
                    />
                  )}
                  <div className='text-[8px] text-gray-400 text-center absolute left-1/2 -translate-x-1/2 top-[-3px]'>
                    {timer.label === t('map_page.time_before_rest') || timer.label === t('map_page.shift') ? 
                      Math.round((timer.value / timer.max) * 100) :
                      Math.round(((timer.max - timer.value) / timer.max) * 100)
                    }%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Info Row - Mobile Responsive */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-1.5 mt-1.5'>
          {/* Break Time */}
          <div className='bg-white rounded p-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'>
            <div className='flex items-center justify-between gap-1'>
              <div className='flex items-center gap-1'>
                <Icon icon='mdi:coffee' className='text-base text-blue-400' />
                <div className='flex flex-col'>
                  <span className='text-[10px] text-gray-500 leading-tight'>Next Break Time</span>
                  <span className='text-[10px] font-medium text-gray-600'>
                    {formatMinutes(stats.next_break_rest_duration)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Time until daily rest */}
          <div className='bg-white rounded p-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'>
            <div className='flex items-center justify-between gap-1'>
              <div className='flex items-center gap-1'>
                <Icon icon='mdi:bed' className='text-base text-blue-400' />
                <div className='flex flex-col'>
                  <span className='text-[10px] text-gray-500 leading-tight'>
                    {t('map_page.time_left_until_daily_rest')}
                  </span>
                  <span className='text-[10px] font-medium text-gray-600'>
                    {formatMinutes(stats.time_left_until_daily_rest)} / 15:00
                  </span>
                </div>
              </div>
              <div className='flex gap-0.5'>
                {[...Array(3)].map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-[14px] h-[14px] rounded-full ${
                      isValidTachoValue(stats.reduced_daily_rests_remaining) &&
                      idx < (stats.reduced_daily_rests_remaining || 0)
                        ? 'bg-blue-400'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className='relative'>
              <Progress
                value={(stats.time_left_until_daily_rest / 900) * 100}
                className='h-[10px] mt-1'
                indicatorClassName={`transition-all ${getProgressColor(
                  900 - stats.time_left_until_daily_rest,
                  120,
                  60,
                  900
                )}`}
              />
              <div className='text-[8px] text-gray-400 text-center absolute left-1/2 -translate-x-1/2 top-[-3px]'>
                {Math.round((stats.time_left_until_daily_rest / 900) * 100)}%
              </div>
            </div>
          </div>

          {/* End of Last Daily Rest */}
          <div className='bg-white rounded p-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'>
            <div className='flex items-center justify-between gap-1'>
              <div className='flex items-center gap-1'>
                <Icon icon='ri:rest-time-fill' className='text-base text-blue-400' />
                <div className='flex flex-col'>
                  <span className='text-[10px] text-gray-500 leading-tight'>
                    {t('map_page.end_of_last_daily_rest')}
                  </span>
                  <span className='text-[10px] font-medium text-gray-600'>
                      {stats.end_of_last_daily_rest ? 
                      format(new Date(stats.end_of_last_daily_rest * 1000), 'yyyy-MM-dd HH:mm') : 
                      '-'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TachographDataList;
