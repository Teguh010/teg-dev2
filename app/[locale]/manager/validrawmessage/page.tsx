"use client";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { controller } from "./controller";
import { Button } from "@/components/ui/button";
import DatePickerWithRange from "@/components/partials/pickers/date-picker-with-range";
import VehiclePicker from "@/components/partials/pickers/vehicle-picker";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/many-advanced";
import loadHereMaps from "@/components/maps/here-map/utils/here-map-loader";
import { useTranslation } from "react-i18next";
import { SettingsPicker } from "./components/settings-picker";
import { DataTypeFilter } from "../input-report/components/DataTypeFilter";
import { firstUpperLetter } from "@/lib/utils";
import Draggable from "react-draggable";


const HereMap = dynamic(() => import("./HereMap"), { ssr: false });
const HereMap2 = dynamic(() => import("./Map2"), { ssr: false });


const ValidRawMessage = () => {
  const { t } = useTranslation();
  const [mapLoaded, setMapLoaded] = useState(false);
  const { models, operations, setDataValidRawMessages } = controller();
  const [selectedRowIds, setSelectedRowIds] = useState([]); // array of id (misal: location.id)
  const [activeRowId, setActiveRowId] = useState(null); // id baris yang aktif dari klik marker
  const [isMapVisible, setIsMapVisible] = useState(false); // default: map hidden
  const [showAllMarkers, setShowAllMarkers] = useState(false); // state baru
  const mapRef = useRef(null);


  // --- ALL HOOKS MUST BE CALLED BEFORE ANY RETURN/IF ---
  useEffect(() => {
    loadHereMaps(() => setMapLoaded(true));
  }, []);

  // Data untuk map dan table: tambahkan id unik (index array)
  const dataForTable = useMemo(() => {
    const result = models.dataValidRawMessages?.map((item, idx) => ({
      ...item,
      id: idx,
      lat: Number(item.lat ?? item.latitude ?? item.gpsLat ?? 0), // pastikan number
      lon: Number(item.lon ?? item.longitude ?? item.gpsLon ?? 0), // pastikan number
    })) || [];
    return result;
  }, [models.dataValidRawMessages]);

  // Optimized: Map hanya tampilkan 30 data teratas + semua yang terseleksi (tanpa duplikat)
  const mapData = useMemo(() => {
    if (!isMapVisible || dataForTable.length === 0) return [];
    if (showAllMarkers) {
      // Tampilkan semua data + yang terseleksi (tanpa duplikat)
      const selected = dataForTable.filter(row => selectedRowIds.includes(row.id));
      const combined = [...dataForTable, ...selected].filter(
        (item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx
      );
      return combined;
    } else {
      // Tampilkan 30 data teratas + yang terseleksi (tanpa duplikat)
      const top30 = dataForTable.slice(0, 30);
      const selected = dataForTable.filter(row => selectedRowIds.includes(row.id));
      const combined = [...top30, ...selected].filter(
        (item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx
      );
      return combined;
    }
  }, [isMapVisible, dataForTable, selectedRowIds, showAllMarkers]);

  // Trigger showAllMarkers setelah map tampil dan visible
  useEffect(() => {
    let timer;
    if (isMapVisible) {
      setShowAllMarkers(false); // reset dulu
      timer = setTimeout(() => {
        setShowAllMarkers(true);
      }, 1500); // 1.5 detik (bisa diubah ke 1000/2000 ms)
    } else {
      setShowAllMarkers(false);
    }
    return () => clearTimeout(timer);
  }, [isMapVisible, dataForTable]);

  // Handler untuk toggle map
  const toggleMapVisibility = () => {
    setIsMapVisible((prev) => {
      if (!prev && selectedRowIds.length > 0) {
        setSelectedRowIds([]);
      }
      return !prev;
    });
  };

  // Handler ketika marker di map di klik
  const handleMarkerClick = (id) => {
    setActiveRowId(id); // hanya set active row, tidak mengubah selectedRowIds
  };

  // Handler ketika checkbox di table di klik
  const handleSelectedRowsChange = useCallback(
    (rows) => {
      const newIds = rows.map((row) => row.id);
      if (
        newIds.length !== selectedRowIds.length ||
        newIds.some((id, idx) => id !== selectedRowIds[idx])
      ) {
        setSelectedRowIds(newIds);
        setActiveRowId(newIds[0] ?? null); // update activeRowId ke id pertama yang terpilih
      }
    },
    [selectedRowIds, setSelectedRowIds]
  );

  // Handler untuk tombol generate
  const handleGenerate = () => {
    setIsMapVisible(false); // hide map
    setSelectedRowIds([]); // reset selected row
    setActiveRowId(null); // reset active row
    setShowAllMarkers(false); // reset marker state
    setDataValidRawMessages([]); // reset dataValidRawMessages agar total langsung 0
    operations.setGenerate(true); // trigger generate
  };

  const pickers = () => {
    return (
      <>
        <div className='flex flex-col lg:flex-row justify-start gap-2'>
          <VehiclePicker
            vehicles={models.dataObjectList}
            setVehicle={operations.setVehicle}
            vehicle={models.vehicle}
          />
          <DatePickerWithRange
            setStartDate={operations.setStartDate}
            setEndDate={operations.setEndDate}
            startDate={models.startDate}
            endDate={models.endDate}
            settings={models.settings}
          />
          <SettingsPicker
            datatypeList={models.datatypeList}
            ioIdsFilter={models.ioIdsFilter}
            setIoIdsFilter={operations.setIoIdsFilter}
            setNumberRows={operations.setNumberRows}
            numberRows={models.numberRows}
            setGenerate={operations.setGenerate}
          />
          <DataTypeFilter
            datatypeList={models.datatypeList}
            selectedDataTypes={models.selectedDataTypes}
            onDataTypesChange={operations.setSelectedDataTypes}
            disabled={models.isLoading}
            vehicle={models.vehicle}
          />
          <Button
            variant="outline"
            color="success"
            size="sm"
            className="h-8"
            disabled={
              models.isGenerate ||
              !models.vehicle ||
              !models.startDate ||
              !models.endDate
            }
            onClick={handleGenerate}
          >
            <span className='capitalize'>
              {models.isGenerate ? t("general.generating") : t("general.generate")}
            </span>
          </Button>
          <Button
            variant='outline'
            color='success'
            size='sm'
            className='h-8 show-hide-button'
            onClick={toggleMapVisibility}
            disabled={!models.dataValidRawMessages?.length}
          >
            <span className='capitalize'>
              {isMapVisible ? t("general.hide_map") : t("general.show_map")}
            </span>
          </Button>
          {/* Info box: total & selected rows */}
          <div className="flex gap-2 ml-2">
          <div className="bg-white border border-gray-300 rounded px-3 py-0 flex items-center shadow-sm min-w-[30px]">
          <span className="font-semibold text-md mr-1">{dataForTable.length}</span>
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <div className="bg-white border border-gray-300 rounded px-3 py-0 flex items-center shadow-sm min-w-[30px]">
              <span className="font-semibold text-md mr-1">{selectedRowIds.length}</span>
              <span className="text-xs text-gray-500">Selected</span>
            </div>
          </div>
        </div>
      </>
    );
  };

  /*   const totals = () => {
    return (
      models.dataTimeline.length > 0 && (
        <div className="lg:w-full">
          <div className="grid grid-cols-1 pb-4">
            <Card>
              <CardContent>
                <Timeline
                  data={models.dataTimeline}
                  yLength={models.yLengthTimeline}
                  colorCode={models.colorCodeTimeline}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )
    );
  }; */

  // Pilih komponen map sesuai jumlah data
  const MapComponent = mapData.length > 1000 ? HereMap : HereMap2;

  if (!models.user || !models.dataObjectList || !mapLoaded) {
    return <LayoutLoader />;
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-12 gap-6'>
        <div className='col-span-12 lg:col-span-12 overflow-x-auto'>
          <span className='text-xl font-bold'>
            {firstUpperLetter(t("general.valid_raw_message"))}
          </span>
        </div>
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <div className="absolute bottom-10 right-10">
            <div className="border-2 border-gray-400 rounded-lg">
                {isMapVisible && mapData.length > 0 && (
                  <Draggable
                    axis='both'
                    handle='.draggable-header'
                    nodeRef={mapRef}
                    bounds={typeof window !== "undefined"
                      ? {
                          left: -(window.innerWidth - 354 - 30), // drag ke kiri sampai nempel
                          top: -(window.innerHeight - 300 - 60), // drag ke atas sampai nempel
                          right: 30, // drag ke kanan sampai margin kanan
                          bottom: 60 // drag ke bawah sampai margin bawah
                        }
                      : { left: 0, top: 0, right: 0, bottom: 0 }}
                  >
                    <div
                      ref={mapRef}
                      style={{
                        zIndex: 1000,
                        position: "fixed",
                        right: 30,
                        bottom: 60,
                        width: 354,
                        height: 300
                      }}
                    >
                                  {/* Draggable header */}
                                  <div
                                    className='draggable-header'
                                    style={{
                                      height: 32,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "grab",
                                      background: "#f3f4f6",
                                      borderTopLeftRadius: 8,
                                      borderTopRightRadius: 8,
                                      border: "1px solid #e5e7eb",
                                      borderBottom: "none",
                                      userSelect: "none"
                                    }}
                                  >
                                    <span style={{ fontSize: 20, opacity: 0.6 }}>⠿</span>
                                  </div>
                                  <div className='border-2 border-gray-400 rounded-b-lg rounded-t-none'>
                                  <MapComponent
                  vehicleList={mapData}
                  selectedRowIds={selectedRowIds}
                  onMarkerClick={handleMarkerClick}
                />
                                  </div>
                                </div>
                  </Draggable>
                )}
            </div>
          </div>
          {models.isLoading || !models.dataValidRawMessages?.length ? (
            <div className='space-y-4'>
              {pickers()}
              <AdvancedTable
                ifSelect
                ifVirtualized={true}
                dataList={[]}
                ignoreList={models.ignoreList}
                ifPagination={false}
                styleRowList={models.styleRowList}
                styleColumnList={models.styleColumnList}
                onSelectedRowsChange={handleSelectedRowsChange}
                selectedRowIds={selectedRowIds}
                activeRowId={activeRowId} // <-- tambahkan prop baru
                loading={models.isLoading}
              />
            </div>
          ) : (
            <AdvancedTable
              ifSelect
              ifVirtualized={true}
              dataList={dataForTable}
              ignoreList={models.ignoreList}
              pickers={pickers}
              ifPagination={false}
              styleRowList={models.styleRowList}
              styleColumnList={models.styleColumnList}
              onSelectedRowsChange={handleSelectedRowsChange}
              selectedRowIds={selectedRowIds}
              activeRowId={activeRowId} // <-- tambahkan prop baru
              //totals={totals}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidRawMessage;
