"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { firstUpperLetter } from "@/lib/utils";
import {
  Gauge,
  Router,
  Timer,
  Car,
  Home,
  Droplets,
  GaugeCircle,
  Briefcase,
  User,
  CheckCircle,
  XCircle,
  TrendingDown,
  RotateCcw,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import dynamic from "next/dynamic";

const HereMap = dynamic(() => import("./HereMap"), { ssr: false });

const Totals = ({
  totals,
  tripData = [],
  focusLocation,
  onMarkerClick,
  selectedLocation,
  onZoomToggle,
  onResetZoom,
  onResetZoomClick,
  isZoomEnabled,
  userToken,
  selectedVehicle,
  startDate,
  endDate,
  showTrajectory,
  onTrajectoryToggle,
  trajectoryData,
  onFetchTrajectory
}) => {
  const { t } = useTranslation();

  // Tambahkan mapping dari key backend ke translation key
  const keyToTranslationKey = {
    "avg_speed_(km)": "general.avg_speed",
    "distance_(km)": "general.distance",
    "distance_job": "general.distance_job",
    "distance_private": "general.distance_private",
    "fuel/km": "general.fuel_per_km",
    "fuel_used_(l)": "general.fuel_used",
    "fuel_used_job": "general.fuel_used_job",
    "fuel_used_private": "general.fuel_used_private",
    "moving_time": "general.moving_time",
    "moving_time_job": "general.moving_time_job",
    "moving_time_private": "general.moving_time_private",
    "stationary_time": "general.stationary_time",
    "stationary_time_job": "general.stationary_time_job",
    "stationary_time_private": "general.stationary_time_private",
    "trip_mode_exists": "general.trip_mode_exists",
    "object_name": "general.object_name"
  };

  // Batasi hanya key yang didukung oleh getDataConfig agar tampil
  const supportedTranslationKeys = new Set([
    "general.distance",
    "general.fuel_used",
    "general.fuel_per_km",
    "general.avg_speed",
    "general.distance_job",
    "general.distance_private",
    "general.moving_time_job",
    "general.moving_time_private",
  ]);

  const getDataConfig = (key: string, value: unknown) => {
    const configs = {
      "general.distance": { icon: Router, color: "text-blue-500" },
      "general.fuel_used": { icon: Droplets, color: "text-blue-500" },
      "general.fuel_per_km": { icon: GaugeCircle, color: "text-blue-500" },
      "general.avg_speed": { icon: Gauge, color: "text-blue-500" },
      "general.distance_job": { icon: Car, color: "text-blue-500" },
      "general.distance_private": { icon: Home, color: "text-blue-500" },
      // "general.moving_time": { icon: Timer, color: "text-blue-500" },
      "general.moving_time_job": { icon: Briefcase, color: "text-blue-500" },
      "general.moving_time_private": { icon: User, color: "text-blue-500" },
      // 'general.total_stops': { icon: ParkingCircle, color: 'text-blue-500' },
      // 'general.total_moving': { icon: Car, color: 'text-blue-500' },
      // 'general.fuel_norm': { icon: BarChart, color: 'text-blue-500' },
      // 'general.fuel_norm_job': { icon: Building, color: 'text-blue-500' },
      // 'general.fuel_norm_private': { icon: Hotel, color: 'text-blue-500' },
      // 'general.fuel_used_job': { icon: Factory, color: 'text-blue-500' },
      // 'general.fuel_used_private': { icon: Store, color: 'text-blue-500' },
      // 'general.moving_time': { icon: Clock, color: 'text-blue-500' },
      // 'general.stationary_time': { icon: ParkingCircle, color: 'text-blue-500' },
      // 'general.stationary_time_job': { icon: Timer, color: 'text-blue-500' },
      // 'general.stationary_time_private': { icon: Timer, color: 'text-blue-500' },
      "general.trip_mode_exists": {
        icon: value ? CheckCircle : XCircle,
        color: value ? "text-blue-500" : "text-red-500"
      }
    };
    return configs[key] || { icon: Timer, color: "text-gray-500" };
  };

  // Urutan tampilan mengikuti urutan di getDataConfig
  const translationOrder = [
    "general.distance",
    "general.fuel_used",
    "general.fuel_per_km",
    "general.avg_speed",
    "general.distance_job",
    "general.distance_private",
    "general.moving_time",
    "general.moving_time_job",
    "general.moving_time_private",
    "general.trip_mode_exists"
  ];

  const createList = (data) => {
    if (!data) return [];
    // const totalStops = tripData.filter((item) => item.state === "stationary").length;
    // const totalMoving = tripData.filter((item) => item.state === "moving").length;
    const enhancedData = {
 
      ...data
    };
    return Object.entries(enhancedData)
      .map(([key, value]) => {
        const translationKey = keyToTranslationKey[key] || key;
        return { rawKey: key, translationKey, value };
      })
      .filter(({ rawKey, translationKey, value }) => {
        if (typeof rawKey === "string" && rawKey.toLowerCase() === "object name") return false;
        if (value === null || value === undefined || value === "") return false;
        
        // Hide moving time job and private if they are null or "00:00:00"
        if (translationKey === "general.moving_time_job" || translationKey === "general.moving_time_private") {
          if (value === "00:00:00" || value === "00:00" || value === "0" || value === 0 || 
              (typeof value === "string" && value.match(/^0+:0+$/))) return false;
        }
        
        return supportedTranslationKeys.has(translationKey);
      })
      .sort((a, b) => {
        const ia = translationOrder.indexOf(a.translationKey);
        const ib = translationOrder.indexOf(b.translationKey);
        return (ia === -1 ? Number.POSITIVE_INFINITY : ia) - (ib === -1 ? Number.POSITIVE_INFINITY : ib);
      })
      .map(({ translationKey, value }) => {
        return {
          key: firstUpperLetter(t(translationKey)),
          value:
            translationKey === "general.trip_mode_exists"
              ? value
                ? t("general.yes")
                : t("general.no")
              : value,
          ...getDataConfig(translationKey, value)
        };
      });
  };

  const dataList = createList(totals?.[0]);

  const getValueColor = (value) => {
    if (value === null || value === "") return "text-gray-400 italic";
    if (typeof value === "string") {
      if (value.includes("-")) return "text-red-600";
      if (parseFloat(value) > 0) return "text-green-600";
    }
    return "text-gray-900";
  };

  if (!totals?.length) {
    return (
      <div className='flex flex-col lg:flex-row gap-4'>
        <Card className='w-full lg:w-2/3 bg-gradient-to-r from-white to-gray-50'>
          <CardContent className='p-6 text-center'>
            <div className='text-gray-400 flex items-center gap-2 justify-center'>
              <TrendingDown className='w-5 h-5' />
              <p>{t("no_data_available")}</p>
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
            <h3 className='text-sm font-medium text-gray-700'>
              {firstUpperLetter(t("general.totals"))}
            </h3>
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
                    <div
                      className={`text-[13px]  font-medium ${getValueColor(item.value)} truncate`}
                    >
                      {item.value === null || item.value === "" ? t("general.no_data") : item.value}
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
            <h3 className='text-sm font-medium text-gray-700'>{firstUpperLetter(t("map"))}</h3>
            <div className='flex items-center gap-2'>
              {/* Toggle Zoom */}
              <Button variant='ghost' size='sm' onClick={onZoomToggle} className='h-6 px-2 text-xs'>
                {isZoomEnabled ? (
                  <>
                    <ToggleRight className='w-3 h-3 mr-1 text-green-600' />
                    <span className='text-green-600'>{t("general.zoom_on")}</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className='w-3 h-3 mr-1 text-gray-400' />
                    <span className='text-gray-400'>{t("general.zoom_off")}</span>
                  </>
                )}
              </Button>

              {/* Toggle Trajectory */}
              <Button
                variant='ghost'
                size='sm'
                onClick={onTrajectoryToggle}
                className='h-6 px-2 text-xs'
                disabled={!userToken || !selectedVehicle || !startDate || !endDate}
              >
                {showTrajectory ? (
                  <>
                    <ToggleRight className='w-3 h-3 mr-1 text-blue-600' />
                    <span className='text-blue-600'>{t("general.hide_trajectory")}</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className='w-3 h-3 mr-1 text-gray-400' />
                    <span className='text-gray-400'>{t("general.show_trajectory")}</span>
                  </>
                )}
              </Button>

              {/* Reset Zoom */}
              <Button
                variant='ghost'
                size='sm'
                onClick={onResetZoomClick}
                className='h-6 px-2 text-xs'
                title='Reset zoom to fit all markers'
              >
                <RotateCcw className='w-3 h-3 mr-1' />
                <span>{t("general.reset")}</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className='px-3 mb-[6px] pb-[6px]'>
          <HereMap
            vehicleList={tripData}
            focusLocation={focusLocation}
            onMarkerClick={onMarkerClick}
            selectedLocation={selectedLocation}
            isZoomEnabled={isZoomEnabled}
            onResetZoom={onResetZoom}
            userToken={userToken}
            selectedVehicle={selectedVehicle}
            startDate={startDate}
            endDate={endDate}
            showTrajectory={showTrajectory}
            trajectoryData={trajectoryData}
            onFetchTrajectory={onFetchTrajectory}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Totals;
