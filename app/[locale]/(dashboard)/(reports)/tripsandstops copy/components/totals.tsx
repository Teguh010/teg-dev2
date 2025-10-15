'use client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { firstUpperLetter } from '@/lib/utils';
import {
  Gauge,
  Router,
  Fuel,
  Clock,
  Timer,
  Car,
  Home,
  BarChart,
  Building,
  Hotel,
  Droplets,
  Factory,
  Store,
  GaugeCircle,
  Briefcase,
  User,
  ParkingCircle,
  CheckCircle,
  XCircle,
  TrendingDown
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const HereMap = dynamic(() => import('./HereMap'), { ssr: false });

const Totals = ({ totals, tripData = [], focusLocation, onMarkerClick }) => {
  const { t } = useTranslation();

  const getDataConfig = (key: string, value: any) => {
    const configs = {
      'total stops': { icon: ParkingCircle, color: 'text-blue-500' },
      'total moving': { icon: Car, color: 'text-blue-500' },
      'avg speed (km)': { icon: Gauge, color: 'text-blue-500' },
      'distance (km)': { icon: Router, color: 'text-blue-500' },
      'distance job': { icon: Car, color: 'text-blue-500' },
      'distance private': { icon: Home, color: 'text-blue-500' },
      'fuel norm': { icon: BarChart, color: 'text-blue-500' },
      'fuel norm job': { icon: Building, color: 'text-blue-500' },
      'fuel norm private': { icon: Hotel, color: 'text-blue-500' },
      'fuel used (L)': { icon: Droplets, color: 'text-blue-500' },
      'fuel used job': { icon: Factory, color: 'text-blue-500' },
      'fuel used private': { icon: Store, color: 'text-blue-500' },
      'fuel/km': { icon: GaugeCircle, color: 'text-blue-500' },
      'moving time': { icon: Clock, color: 'text-blue-500' },
      'moving time job': { icon: Briefcase, color: 'text-blue-500' },
      'moving time private': { icon: User, color: 'text-blue-500' },
      'stationary time': { icon: ParkingCircle, color: 'text-blue-500' },
      'stationary time job': { icon: Timer, color: 'text-blue-500' },
      'stationary time private': { icon: Timer, color: 'text-blue-500' },
      'trip mode exists': {
        icon: value ? CheckCircle : XCircle,
        color: value ? 'text-blue-500' : 'text-red-500'
      }
    };

    return configs[key] || { icon: Timer, color: 'text-gray-500' };
  };

  const createList = (data) => {
    if (!data) return [];

    const totalStops = tripData.filter((item) => item.state === 'stationary').length;
    const totalMoving = tripData.filter((item) => item.state === 'moving').length;

    const enhancedData = {
      'total stops': totalStops,
      'total moving': totalMoving,
      ...data
    };

    return Object.entries(enhancedData)
      .filter(([key, value]) => {
        return key !== 'object name' && value !== null && value !== undefined && value !== '';
      })
      .map(([key, value]) => ({
        key,
        value: key.includes('total')
          ? value
          : key === 'trip mode exists'
          ? value
            ? 'Yes'
            : 'No'
          : value,
        ...getDataConfig(key, value)
      }));
  };

  const dataList = createList(totals?.[0]);

  const getValueColor = (value) => {
    if (value === null || value === '') return 'text-gray-400 italic';
    if (typeof value === 'string') {
      if (value.includes('-')) return 'text-red-600';
      if (parseFloat(value) > 0) return 'text-green-600';
    }
    return 'text-gray-900';
  };

  if (!totals?.length) {
    return (
      <div className='flex flex-col lg:flex-row gap-4'>
        <Card className='w-full lg:w-2/3 bg-gradient-to-r from-white to-gray-50'>
          <CardContent className='p-6 text-center'>
            <div className='text-gray-400 flex items-center gap-2 justify-center'>
              <TrendingDown className='w-5 h-5' />
              <p>{t('no_data_available')}</p>
            </div>
          </CardContent>
        </Card>
        <div className='w-full lg:w-1/3 bg-gray-100 rounded-lg p-4'>
          <div className='text-center text-gray-500'>Column for Map</div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col lg:flex-row gap-3'>
      <Card className='w-full lg:w-1/2 bg-gradient-to-r from-white to-gray-50 border-0 shadow-sm'>
        <CardHeader className='py-2 px-3 border-b border-gray-100 mb-2'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-medium text-gray-700'>{firstUpperLetter(t('general.totals'))}</h3>
          </div>
        </CardHeader>

        <CardContent className='p-2'>
          <div className='grid grid-cols-4 gap-1.5'>
            {dataList.map((item, index) => (
              <div
                key={index}
                className='p-2 rounded-md bg-white shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group'
              >
                <div className='flex items-center gap-1.5'>
                  <div className='flex-1 min-w-0'>
                    <div className='text-[11px] text-gray-500 capitalize truncate'>{item.key}</div>
                    <div className={`text-[13px]  font-medium ${getValueColor(item.value)} truncate`}>
                      {item.value === null || item.value === '' ? 'No data' : item.value}
                    </div>
                  </div>
                  <div className={`${item.color} group-hover:text-blue-500 transition-colors`}>
                    <item.icon className='w-5 h-5' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className='w-full lg:w-1/2 bg-gradient-to-r from-white to-gray-50 border-0 shadow-sm'>
        <CardHeader className='py-2 px-3 border-b border-gray-100 mb-0'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-medium text-gray-700'>{firstUpperLetter(t('map'))}</h3>
          </div>
        </CardHeader>

        <CardContent className='px-3 mb-[6px] pb-[6px]'>
          <HereMap
            vehicleList={tripData}
            focusLocation={focusLocation}
            onMarkerClick={onMarkerClick}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Totals;
