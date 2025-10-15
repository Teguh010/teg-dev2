'use client';
import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import VehiclePicker from './vehicle-picker';
import DatePickerWithRange from './date-picker-with-range';
import CustomList from './custom-list';
import CustomListCheckBox from './custom-list-checkbox';
import BarChart from './bar-chart';
import GroupSelection from './group-selction';
import { Icon } from '@iconify/react';
import { useUser } from '@/context/UserContext';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import {
  setStartDate as setStartDateAction,
  setEndDate as setEndDateAction,
  setHistoryVehicle,
  setMinMoving,
  setMinStationary,
  setShowStationaryIgnition,
  setAllowZooming,
} from '@/redux/features/history-map/history-slice';
import CollapsibleComponent from '../history-components/collapsible-component';
import { handleSelectHistoryDataStore } from '@/redux/features/history-map/history-thunks'; // Impor thunk

import { fetchHereAddress } from '@/lib/utils';
import { addressCacheAdd } from '@/models/address_cache';
import { tachoLiveDrivingStateStats } from '@/models/tachograph';
import {
  setSearchQuery,
  setFilteredVehicle,
  setObjectGroupId,
  setVehicle,
} from '@/redux/features/main-map/maps-slice';

import {
  fetchGroupListDataById,
  filterByGroup,
  filterBySearch,
} from '@/redux/features/main-map/maps-thunks';

import { setActiveVehicle, setTachoData } from '@/redux/features/main-map/maps-slice';

import ReusableDialog from '@/components/organisms/ReusableDialog';
import PopupTrajectoryMap from './PopupTrajectoryMap';
import dayjs from 'dayjs';
import { objectTrajectoryNormalized } from '@/models/object';
import { filterTrajectoryData } from '@/lib/map-filters';

const SidebarContent = ({
  vehiclesToMap,
  dataObjectTripStop,
  vehicleHistoryMap,
  isGenerate,
  selectedVehicles,
  setSelectedVehicles,
  handleGenerateClick,
  setSelectedTab,
  setActiveItem,
}) => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { getUserRef } = UserContext.operations;
  const [selectedTab, setSelectedTabState] = useState('tab-vehicles');
  const [setActiveItemState] = useState(null);
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const [setByVehicleObjectClick, setSetByVehicleObjectClick] = useState(false);
  const [setByHistoryObjectClick, setSetByHistoryObjectClick] = useState(false);

  const activeItemRef = useRef(null);
  const activeHistoryItemRef = useRef(null);

  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState(null);
  const [trajectoryData, setTrajectoryData] = useState([]);
  const [loadingTrajectory, setLoadingTrajectory] = useState(false);

  const handleToggleCollapsible = () => {
    setIsCollapsibleOpen((prev) => !prev);
  };

  const userToken = getUserRef().token;
  const dispatch = useDispatch<AppDispatch>();

  const {
    searchQuery,
    dataObjectListGroup,
    dataObjectListGroupIds,
    dataObjectList,
    isLoadingGroup,
    activeVehicleId,
  } = useSelector((state: RootState) => state.maps);

  const {
    startDate,
    endDate,
    settings,
    minMoving,
    minStationary,
    showStationaryIgnition,
    stopIndex,
    historyVehicle,
  } = useSelector((state: RootState) => state.history);
  useEffect(() => {
    dispatch(filterBySearch());
  }, [searchQuery]);

  useEffect(() => {
    dispatch(filterByGroup());
  }, [dataObjectList, dataObjectListGroupIds]);

  useEffect(() => {
    if (!vehicleHistoryMap || !startDate || !endDate || selectedVehicles.length === 0) {
      isGenerate = false;
    }
  }, [
    startDate,
    endDate,
    minMoving,
    selectedVehicles,
    vehicleHistoryMap,
    minStationary,
    showStationaryIgnition,
  ]);

  const handleCheckboxChange = (vehicle, checked) => {
    if (checked) {
      setSelectedVehicles((prev) => [...prev, vehicle]);
    } else {
      setSelectedVehicles((prev) => prev.filter((v) => v !== vehicle));
    }
  };

  const handleSelectGroup = (selectedId: unknown) => {
    if (!selectedId) return;
    dispatch(fetchGroupListDataById(userToken, selectedId as string));
    dispatch(filterByGroup());
  };

  const handleClearGroupSelection = () => {
    dispatch(setObjectGroupId(null));
    if (searchQuery) {
      dispatch(filterBySearch());
    } else {
      dispatch(setFilteredVehicle([...dataObjectList]));
    }
  };

  const handleSetStartDate = (date) => {
    dispatch(setStartDateAction(date));
  };

  const handleSetMinMoving = (value) => {
    dispatch(setMinMoving(value));
  };

  const handleSetMinStationary = (value) => {
    dispatch(setMinStationary(value));
  };

  const handleSetShowStationaryIgnition = (value) => {
    dispatch(setShowStationaryIgnition(value));
  };

  const handleSetEndDate = (date) => {
    dispatch(setEndDateAction(date));
  };

  useEffect(() => {
    if (!setByVehicleObjectClick && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Reset the flag after scrolling
    setSetByVehicleObjectClick(false);
  }, [activeVehicleId]);

  useEffect(() => {
    if (!setByHistoryObjectClick && activeHistoryItemRef.current) {
      activeHistoryItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Reset the flag after scrolling
    setSetByHistoryObjectClick(false);
  }, [stopIndex]);

  const handleDistanceTo = async (vehicle) => {
    setSelectedMapLocation(vehicle);
    setIsMapDialogOpen(true);
    setLoadingTrajectory(true);
    setTrajectoryData([]);
    try {
      // Default: hari ini jam 00:00 sampai 23:59
      const todayStart = dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss');
      const todayEnd = dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss');
      const data = await objectTrajectoryNormalized(getUserRef().token, vehicle, todayStart, todayEnd);
      // Ambil setting format dari settings jika ada, jika tidak pakai default
      const dateFormat = String(settings.find(s => s.title === 'date_format')?.value || 'yyyy-MM-dd');
      const timeFormat = String(settings.find(s => s.title === 'time_format')?.value || 'HH:mm:ss');
      const unitDistance = String(settings.find(s => s.title === 'unit_distance')?.value || 'km');
      if (Array.isArray(data)) {
        const filtered = filterTrajectoryData(data, dateFormat, timeFormat, unitDistance, t);
        setTrajectoryData(filtered);
      } else {
        setTrajectoryData([]);
      }
    } catch {
      setTrajectoryData([]);
    } finally {
      setLoadingTrajectory(false);
    }
  };

  const VehicleObjects = () => {
    return vehiclesToMap?.map((object, index) => {
      const handleTriggerClick = async () => {
        let here_address = object.cached_address || '';
        
        if (!here_address) {
          here_address = await fetchHereAddress(object.lat, object.lon);
          try {
            await addressCacheAdd(userToken, [{
              lat: object.lat,
              lng: object.lon,
              a: here_address,
            }]);
          } catch (error) {
            console.error('Failed to cache address:', error);
          }
        }

        // Fetch tachograph data when vehicle is selected
        try {
          const tachoResponse = await tachoLiveDrivingStateStats(userToken, object.objectid);
          if (tachoResponse) {
            dispatch(setTachoData([{
              id: object.objectid,
              name: object.object_name,
              stats: [tachoResponse]
            }]));
          } else {
            dispatch(setTachoData([]));
          }
        } catch (error) {
          console.error('Error fetching tachograph data:', error);
        }

        const finalVehicleData = {
          ...object,
          here_address,
        };
        
        dispatch(setVehicle(finalVehicleData));
        setActiveItem(true);
        dispatch(setHistoryVehicle(object));
        dispatch(setActiveVehicle(object.id));
        dispatch(setAllowZooming(true));
        setSetByVehicleObjectClick(true);
      };
      const isChecked = selectedVehicles.includes(object);
      const isActiveVehicle = activeVehicleId === object.id;

      // const isActiveVehicle = activeVehicleId === object.id; // Check if this item is active

      return (
        <div key={index} ref={isActiveVehicle ? activeItemRef : null}>
          <CustomListCheckBox
            onCheckboxChange={(checked) => handleCheckboxChange(object, checked)}
            onClickList={handleTriggerClick}
            object={object}
            title={object.object_name}
            isChecked={isChecked}
            trip_state={object.trip_state}
            ignition={object.ignition}
            activeVehicleId={activeVehicleId}
            onDistanceTo={handleDistanceTo}
          />
        </div>
      );
    });
  };

  const ListHistory = () => {
    // Ambil semua stop (state !== 'moving')
    let stops = dataObjectTripStop.filter((point) => point.state !== 'moving');
    // Cek dan tambahkan stop terakhir dari trajectory jika belum ada atau berbeda
    if (trajectoryData && trajectoryData.length > 0) {
      const lastTrajectory = trajectoryData[trajectoryData.length - 1];
      if (
        stops.length === 0 ||
        Number(stops[stops.length - 1].lat).toFixed(6) !== Number(lastTrajectory.lat).toFixed(6) ||
        Number(stops[stops.length - 1].lon).toFixed(6) !== Number(lastTrajectory.lon).toFixed(6)
      ) {
        stops = [...stops, { ...lastTrajectory, state: 'stationary' }];
      }
    }
    if (stops.length > 0) {
      return (
        <div>
          {/* Start marker */}
          <CustomList
            data={stops[0]}
            key='start-marker'
            onSelect={async (data) => {
              const label = 'Start';
              const stopIndex = 0;
              await dispatch(
                handleSelectHistoryDataStore({ data, label, stopIndex, allowZoom: true })
              );
              setActiveItemState(data);
              setSetByHistoryObjectClick(true);
            }}
            isActive={stopIndex === 0}
            fallback='Start'
            bgColor='bg-green-500'
            fontSize='8px'
          />
          {/* Stop points di tengah, label angka */}
          {stops.slice(1, -1).map((object, index) => (
            <div
              ref={isActiveHistoryItem(object, index + 1) ? activeHistoryItemRef : null}
              key={index + 1}
            >
              <CustomList
                data={object}
                onSelect={async (data) => {
                  const label = `${index + 1}`;
                  const stopIndex = index + 1;
                  await dispatch(
                    handleSelectHistoryDataStore({ data, label, stopIndex, allowZoom: true })
                  );
                  setActiveItemState(data);
                  setSetByHistoryObjectClick(true);
                }}
                isActive={stopIndex === index + 1}
                fallback={`${index + 1}`}
                bgColor='bg-blue-500'
                fontSize='12px'
              />
            </div>
          ))}
          {/* Stop marker terakhir */}
          {stops.length > 1 && (
            <div
              ref={isActiveHistoryItem(stops[stops.length - 1], stops.length - 1) ? activeHistoryItemRef : null}
            >
              <CustomList
                data={stops[stops.length - 1]}
                key='stop-marker'
                onSelect={async (data) => {
                  const label = 'Stop';
                  const stopIndex = stops.length - 1;
                  await dispatch(
                    handleSelectHistoryDataStore({ data, label, stopIndex, allowZoom: true })
                  );
                  setActiveItemState(data);
                  setSetByHistoryObjectClick(true);
                }}
                isActive={stopIndex === stops.length - 1}
                fallback='Stop'
                bgColor='bg-red-500'
                fontSize='8px'
              />
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const handleTabChange = (value) => {
    setSelectedTabState(value);
    setSelectedTab(value);
  };

  const selectedGroupId = dataObjectListGroupIds.length > 0 ? dataObjectListGroupIds[0] : null;

  const isActiveHistoryItem = (item, index) => stopIndex === index;

  return (
    <>
      <Card
        className='sidebar-tab p-0 rounded-none shadow-none relative z-10 h-full'
        style={{ width: '320px' }}
      >
        <div>
          <Tabs defaultValue='tab-vehicles' onValueChange={handleTabChange}>
            <TabsList className='w-full'>
              <TabsTrigger value='tab-vehicles' className='w-full'>
                {t('map_page.vehicles')}
              </TabsTrigger>
              <TabsTrigger value='tab-history' className='w-full'>
                {t('map_page.history')}
              </TabsTrigger>
            </TabsList>
            {selectedTab === 'tab-vehicles' && (
              <div className='p-1'>
                <div>
                  <div style={{ height: '150px' }}>
                    <div className='flex items-center align-middle flex-col justify-center'>
                      <BarChart data={vehiclesToMap} />
                      {/* <span>some information</span> */}
                    </div>
                  </div>
                  {dataObjectListGroup && (
                    <GroupSelection
                      data={dataObjectListGroup}
                      onSelect={handleSelectGroup}
                      onClear={handleClearGroupSelection}
                      selectedGroupId={selectedGroupId}
                    />
                  )}
                </div>
                <input
                  type='text'
                  placeholder={t('map_page.search_vehicles')}
                  value={searchQuery}
                  onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                  className='w-full p-2 border rounded'
                />
              </div>
            )}
            <Card
              className={`tab-content-card shadow-none ${
                selectedTab === 'tab-vehicles' ? 'overflow-y-auto' : ''
              }`}
              style={{
                height:
                  selectedTab === 'tab-vehicles' ? 'calc(100vh - 350px)' : 'calc(100vh - 300px)',
              }}
            >
              {' '}
              <TabsContent value='tab-vehicles'>
                <div>{isLoadingGroup ? t('Loading') : <VehicleObjects />}</div>
              </TabsContent>
              <TabsContent value='tab-history'>
                <div className='p-2 tab-history-content'>
                  <div className='flex flex-col w-full gap-2'>
                    <VehiclePicker
                      vehicles={dataObjectList}
                      setVehicleHistoryMap={(vehicle) => dispatch(setHistoryVehicle(vehicle))}
                      setVehicleObject={(vehicle) => dispatch(setHistoryVehicle(vehicle))}
                      selectedVehicle={historyVehicle}
                      setSelectedVehicle={(vehicle) => dispatch(setHistoryVehicle(vehicle))}
                      className='w-full'
                    />
                    <DatePickerWithRange
                      setStartDate={handleSetStartDate}
                      setEndDate={handleSetEndDate}
                      startDate={startDate}
                      endDate={endDate}
                      settings={settings}
                      className='w-full'
                    />
                  </div>
                  <div className='more-settings my-2'>
                    <Button
                      variant='outline'
                      color='primary'
                      size='sm'
                      className={`h-8 w-full ${
                        isCollapsibleOpen ? 'bg-primary text-primary-foreground border-primary' : ''
                      }`}
                      onClick={handleToggleCollapsible}
                    >
                      <span className='capitalize'>{t('map_page.additional_setting')}</span>
                    </Button>
                    <CollapsibleComponent
                      open={isCollapsibleOpen}
                      handleSetMinMoving={handleSetMinMoving}
                      minMoving={minMoving}
                      handleSetMinStationary={handleSetMinStationary}
                      minStationary={minStationary}
                      handleSetShowStationaryIgnition={handleSetShowStationaryIgnition}
                      showStationaryIgnition={showStationaryIgnition}
                    />{' '}
                  </div>
                  <div className='mt-2 mb-1'>
                    <Button
                      variant='outline'
                      color='success'
                      size='sm'
                      className='h-8 w-full'
                      disabled={isGenerate || !historyVehicle || !startDate || !endDate}
                      onClick={handleGenerateClick}
                    >
                      <span className='capitalize'>
                        {isGenerate ? t('general.generating') : t('general.generate')}
                      </span>
                    </Button>
                  </div>
                </div>
                <div
                  className='overflow-y-auto bg-blue'
                  style={{
                    height: isCollapsibleOpen ? 'calc(85vh - 320px)' : 'calc(85vh - 160px)',
                  }}
                >
                  {dataObjectTripStop && (
                    <div>
                      {isGenerate ? (
                        <>
                          <div className='flex justify-center '>
                            <Icon icon='eos-icons:bubble-loading' className='text-2xl' />
                          </div>
                        </>
                      ) : (
                        <ListHistory />
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Card>
          </Tabs>
        </div>
      </Card>
      {isMapDialogOpen && (
      <ReusableDialog
        isOpen={isMapDialogOpen}
        onOpenChange={setIsMapDialogOpen}
        dialogTitle={selectedMapLocation?.object_name || ''}
      >
        {selectedMapLocation && (
          <PopupTrajectoryMap
            lat={selectedMapLocation.lat}
            lon={selectedMapLocation.lon}
            trajectoryData={trajectoryData}
            loading={loadingTrajectory}
            width="100%"
            height="300px"
          />
        )}
      </ReusableDialog>
      )}
    </>
  );
};

export default SidebarContent;

