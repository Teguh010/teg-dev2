"use client";
import { useEffect, useState, useRef } from "react";
import { controller } from "./controller";
import { Button } from "@/components/ui/button";
/* import { DataTableFacetedFilter } from "./components/data-table-faceted-filter"; */
import DatePickerWithRange from "@/components/partials/pickers/date-picker-with-range";
import VehiclePicker from "@/components/partials/pickers/vehicle-picker";
import ReportTypePicker from "@/components/partials/pickers/report-type-picker";
import Totals from "./components/totals";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/many-advanced";
import loadHereMaps from "@/components/maps/here-map/utils/here-map-loader";
import { useTranslation } from "react-i18next";
import { SettingsPicker } from "./components/settings-picker";
import { ExportPicker } from "./components/export-picker";
import { firstUpperLetter } from "@/lib/utils";
import { Label } from "@radix-ui/react-label";
/* import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Timeline from './components/timeline'; */

const ObjectOverview = () => {
  const { t } = useTranslation();
  const [mapLoaded, setMapLoaded] = useState(false);
  const { models, operations } = controller();
  const [focusLocation, setFocusLocation] = useState({
    fromLat: null,
    fromLon: null,
    toLat: null,
    toLon: null,
    activeRow: null,
    activeColumn: "from",
    fromClick: false,
    activeFromRow: null,
  });
  const [activeRowId, setActiveRowId] = useState<number | null>(null); // ID baris aktif dari klik table
  const [selectedLocation, setSelectedLocation] = useState<Record<string, unknown> | null>(null); // Data lokasi terpilih untuk map
  const [isZoomEnabled, setIsZoomEnabled] = useState<boolean>(true); // Zoom enable/disable state
  const resetZoomRef = useRef<(() => void) | null>(null); // Ref untuk reset zoom function

  useEffect(() => {
    loadHereMaps(() => setMapLoaded(true));
  }, []);

  useEffect(() => {
    setFocusLocation({
      fromLat: null,
      fromLon: null,
      toLat: null,
      toLon: null,
      activeRow: null,
      activeColumn: models.reportType === "stop only" ? "address" : "from",
      fromClick: false,
      activeFromRow: null,
    });
    // Reset table selection when report type changes
    setActiveRowId(null);
    setSelectedLocation(null);
  }, [models.reportType]);

  if (
    !models.user ||
    models.isLoading ||
    !models.dataObjectList ||
    !mapLoaded
  ) {
    return <LayoutLoader />;
  }

  const pickers = (table: unknown = undefined) => {
    return (
      <>
        <div className="flex flex-col lg:flex-row justify-start gap-2 flex-wrap">
          <VehiclePicker
            vehicles={models.dataObjectList}
            setVehicle={operations.setVehicle}
            vehicle={models.vehicle}
          />
          <ReportTypePicker
            defaultReportType={models.defaultReportType}
            reportType={models.reportType}
            reportTypes={models.reportTypeList}
            setReportType={operations.setReportType}
          />
          <DatePickerWithRange
            setStartDate={operations.setStartDate}
            setEndDate={operations.setEndDate}
            startDate={models.startDate}
            endDate={models.endDate}
            settings={models.settings}
          />
          <SettingsPicker
            settings={models.settings}
            schedules={models.schedules}
            setSchedules={operations.setSchedules}
            minMoving={models.minMoving}
            minStationary={models.minStationary}
            tripMode={models.tripMode}
            showStationaryIgnition={models.showStationaryIgnition}
            setMinMoving={operations.setMinMoving}
            setMinStationary={operations.setMinStationary}
            setTripMode={operations.setTripMode}
            setShowStationaryIgnition={operations.setShowStationaryIgnition}
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
            onClick={() => operations.setGenerate(true)}
          >
            <span className="capitalize">
              {models.isGenerate
                ? t("general.generating")
                : t("general.generate")}
            </span>
          </Button>
          <ExportPicker
            exportReportPDF={operations.exportReportPDF}
            exportReportCSV={operations.exportReportCSV}
            table={table}
            dataObjectTripStopTotals={models.dataObjectTripStopTotals}
          />
          {/* <Button
          variant="outline"
          color="destructive"
          size="sm"
          className="h-8"
          disabled={table.getRowModel().rows.length <= 0}
          onClick={() => (operations.exportReportPDF(table, Object.keys(models.dataObjectTripStopTotals).length > 0 ? models.dataObjectTripStopTotals : null))}
        >
          <span className='capitalize'>{t('export_pdf')}</span>
        </Button>
        <Button
          variant="outline"
          color="destructive"
          size="sm"
          className="h-8"
          disabled={table.getRowModel().rows.length <= 0}
          onClick={() => (operations.exportReportCSV(table, Object.keys(models.dataObjectTripStopTotals).length > 0 ? models.dataObjectTripStopTotals : null))}
        >
          <span className='capitalize'>{t('export_csv')}</span>
        </Button> */}
        </div>
      </>
    );
  };

  /*   const exports = (table: any) => {
    return <>
      <div className="flex flex-col lg:flex-row justify-start gap-2 lg:pl-2">
        <Button
          variant="outline"
          color="destructive"
          size="sm"
          className="h-8"
          disabled={table.getRowModel().rows.length <= 0}
          onClick={() => (operations.exportReportPDF(table, Object.keys(models.dataObjectTripStopTotals).length > 0 ? models.dataObjectTripStopTotals : null))}
        >
          <span className='capitalize'>{t('export_pdf')}</span>
        </Button>
      </div>
    </>;
  }; */

  /*   const groups = (table: any) => {
    return <>
      {table.getRowModel().rows.length > 0 &&
        <div className="gap-2 mr-2 flex flex-row">
          {models.groupList.map((group, index) => {
            return table.getColumn(t(group.title)) && (
              <DataTableFacetedFilter
                key={index}
                column={table.getColumn(t(group.title))}
                title={t('state')}
                options={group.values}
              />
            );
          })}
        </div>
      }
    </>;
  }; */

  const handleLocationClick = (rowId, type, lat, lon) => {
    if (models.reportType === "stop only") {
      setFocusLocation({
        fromLat: lat,
        fromLon: lon,
        toLat: null,
        toLon: null,
        activeRow: rowId,
        activeColumn: t("general.address"),
        fromClick: true,
        activeFromRow: rowId,
      });
    } else {
      if (type === t("general.from")) {
        setFocusLocation({
          fromLat: lat,
          fromLon: lon,
          toLat: null,
          toLon: null,
          activeRow: rowId,
          activeColumn: t("general.from"),
          fromClick: true,
          activeFromRow: rowId,
        });
      } else if (type === t("general.to")) {
        setFocusLocation({
          fromLat: focusLocation.fromLat,
          fromLon: focusLocation.fromLon,
          toLat: lat,
          toLon: lon,
          activeRow: rowId,
          activeColumn: t("general.to"),
          fromClick: true,
          activeFromRow: focusLocation.activeFromRow,
        });
      }
    }
  };

  // Handler ketika row di table diklik
  const handleRowClick = (id: number) => {
    setActiveRowId(id);
    if (models.dataObjectTripStop && models.dataObjectTripStop[id]) {
      const rowData = models.dataObjectTripStop[id];
      setSelectedLocation(rowData);
      
      // Update focusLocation untuk map
      if (models.reportType === "stop only") {
        setFocusLocation({
          fromLat: rowData.lat,
          fromLon: rowData.lon,
          toLat: null,
          toLon: null,
          activeRow: String(id),
          activeColumn: t("general.address"),
          fromClick: isZoomEnabled, // Hanya true jika zoom enabled
          activeFromRow: String(id),
        });
      } else {
        setFocusLocation({
          fromLat: rowData.lat,
          fromLon: rowData.lon,
          toLat: null,
          toLon: null,
          activeRow: String(id),
          activeColumn: t("general.from"),
          fromClick: isZoomEnabled, // Hanya true jika zoom enabled
          activeFromRow: String(id),
        });
      }
    }
  };


  // Handler untuk toggle zoom
  const handleZoomToggle = () => {
    setIsZoomEnabled(!isZoomEnabled);
  };

  // Handler untuk toggle trajectory
  const handleTrajectoryToggle = () => {
    operations.setShowTrajectory(!models.showTrajectory);
  };

  // Handler untuk menerima reset function dari HereMap
  const handleSetResetFunction = (resetFn: () => void) => {
    resetZoomRef.current = resetFn;
  };

  // Handler untuk reset zoom
  const handleResetZoom = () => {
    if (resetZoomRef.current) {
      resetZoomRef.current();
    }
  };

  const actions = (row: { id: string; original: Record<string, unknown> }, key: string) => {
    const isMoving = String(row.original.state || '') === t("general.moving");
    const isStationaryWithIgnition = String(row.original.state || '') === t("general.stationary_with_ignition");
    const currentIndex = Number(row.id);
    const totalRows = models.dataObjectTripStop.length;
    
    const getStateColor = () => {
      if (currentIndex === 0) return "bg-green-500"; // First row - green
      if (currentIndex === totalRows - 1) return "bg-red-500"; // Last row - red
      return "bg-blue-500"; // Middle rows - blue
    };
    
    // Calculate stop number - count only stops up to current row
    const getStopNumber = () => {
      if (isMoving) return null;
      let stopCount = 0;
      for (let i = 0; i <= currentIndex; i++) {
        const state = String(models.dataObjectTripStop[i]?.state || '');
        if (state !== t("general.moving")) {
          stopCount++;
        }
      }
      return stopCount;
    };

    const numberBadge = (
      <span
        className={`w-5 h-5 mr-3 rounded-full flex items-center justify-center text-xs text-white
        ${getStateColor()}`}
      >
        {isMoving ? (
          <svg 
            className="w-3 h-3" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z"/>
          </svg>
        ) : (
          <span>{getStopNumber()}</span>
        )}
      </span>
    );

    // Add key icon for stationary with ignition
    const keyIcon = isStationaryWithIgnition ? (
      <svg 
        className="w-4 h-4 ml-1 text-blue-500" 
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M12.02 8.846q.769 0 1.307-.538T13.866 7t-.539-1.308t-1.308-.538t-1.307.538T10.173 7t.539 1.308t1.307.538m.006 12.914q-.161 0-.298-.053t-.267-.178l-1.537-1.442q-.111-.106-.17-.24q-.059-.133-.084-.276q-.025-.142.028-.291q.053-.15.14-.28l.932-1.211l-1.05-1.358q-.092-.112-.135-.229t-.043-.26t.043-.26t.116-.228l.82-1.07v-2.85q-1.34-.355-2.285-1.607T7.289 7q0-2 1.365-3.366q1.365-1.365 3.365-1.365t3.366 1.365T16.75 7q0 1.698-.958 2.941t-2.273 1.593v8.7q0 .162-.056.311t-.186.28l-.698.698q-.125.125-.259.18q-.133.057-.295.057"/>
      </svg>
    ) : null;

    if (key === t("general.state")) {
      return (
        <div className="flex items-center gap-0">
          {numberBadge}
          {keyIcon}
        </div>
      );
    }
    if (key === t("general.from")) {
      const fromValue = String(row.original[t("general.from")] || '');
      const hasFromAddress = fromValue && fromValue.trim() !== '';
      const isFromLoading = models.addressLoadingStates[Number(row.id)] === true;
      
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className={`capitalize p-1 h-5 ${
              (focusLocation.activeRow === row.id &&
                focusLocation.activeColumn === t("general.from")) ||
              focusLocation.activeFromRow === row.id
                ? "bg-blue-100"
                : ""
            }`}
            onClick={() =>
              handleLocationClick(
                row.id,
                t("general.from"),
                row.original[t("general.lat")],
                row.original[t("general.lon")]
              )
            }
            disabled={isFromLoading}
          >
            {isFromLoading ? (
              <div className="flex items-center gap-1">
                <svg 
                  className="w-3 h-3 animate-spin" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-gray-500 text-xs">Loading...</span>
              </div>
            ) : (
              fromValue || '-'
            )}
          </Button>
        </div>
      );
    }
    if (key === t("general.to")) {
      const toValue = String(row.original[t("general.to")] || '');
      const hasToAddress = toValue && toValue.trim() !== '';
      const isToLoading = models.addressLoadingStates[Number(row.id)] === true;
      
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className={`capitalize p-1 h-5 ${
              focusLocation.activeRow === row.id &&
              focusLocation.activeColumn === t("general.to")
                ? "bg-blue-100"
                : ""
            }`}
            onClick={() =>
              handleLocationClick(
                row.id,
                t("general.to"),
                row.original[t("general.next_lat")],
                row.original[t("general.next_lon")]
              )
            }
            disabled={isToLoading}
          >
            {isToLoading ? (
              <div className="flex items-center gap-1">
                <svg 
                  className="w-3 h-3 animate-spin" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-gray-500 text-xs">Loading...</span>
              </div>
            ) : (
              toValue || '-'
            )}
          </Button>
        </div>
      );
    }
    if (key === t("general.address")) {
      const addressValue = String(row.original[t("general.address")] || '');
      const hasAddress = addressValue && addressValue.trim() !== '';
      const isAddressLoading = models.addressLoadingStates[Number(row.id)] === true;
      
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className={`px-0.5 py-0.5 h-auto min-h-5 break-words overflow-wrap-anywhere whitespace-normal text-left max-w-[280px] text-xs font-normal leading-tight ${
              focusLocation.activeRow === row.id &&
              focusLocation.activeColumn === t("general.address")
                ? "bg-blue-100"
                : ""
            }`}
            onClick={() =>
              handleLocationClick(
                row.id,
                t("general.address"),
                row.original[t("general.lat")],
                row.original[t("general.lon")]
              )
            }
            disabled={isAddressLoading}
          >
            {isAddressLoading ? (
              <div className="flex items-center gap-1">
                <svg 
                  className="w-3 h-3 animate-spin" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-gray-500">Loading...</span>
              </div>
            ) : (
              addressValue || '-'
            )}
          </Button>
        </div>
      );
    }
    if (key === t("general.time_from")) {
      
      return (
        <div className="flex items-center gap-2">
          <div className="text-xs leading-tight">
            <div className="whitespace-nowrap">
              {String(row.original["time_from"] || '')}
            </div>
            <div className="whitespace-nowrap">
              {String(row.original["time_to"] || '')}
            </div>
          </div>
        </div>
      );
    }
    if (key === t("general.time_to")) {
      return null; // Hide this column since we're showing both times in time_from
    }
    if (key === "#") {
      return numberBadge;
    }
    return null;
  };

  const handleMarkerClick = (location) => {
    models.dataObjectTripStop.forEach((row, index) => {
      if (models.reportType === t("stop_only")) {
        if (row.lat === location.lat && row.lon === location.lon) {
          setActiveRowId(index); // Update table row highlight
          setSelectedLocation(row); // Update selected location
          setFocusLocation({
            fromLat: location.lat,
            fromLon: location.lon,
            toLat: null,
            toLon: null,
            activeRow: String(index),
            activeColumn: "address",
            fromClick: false,
            activeFromRow: String(index),
          });
        }
      } else {
        if (row.lat === location.lat && row.lon === location.lon) {
          setActiveRowId(index); // Update table row highlight
          setSelectedLocation(row); // Update selected location
          setFocusLocation({
            fromLat: location.lat,
            fromLon: location.lon,
            toLat: null,
            toLon: null,
            activeRow: String(index),
            activeColumn: "from",
            fromClick: false,
            activeFromRow: String(index),
          });
        } else if (
          row.next_lat === location.lat &&
          row.next_lon === location.lon
        ) {
          setActiveRowId(index); // Update table row highlight
          setSelectedLocation(row); // Update selected location
          setFocusLocation({
            fromLat: null,
            fromLon: null,
            toLat: location.lat,
            toLon: location.lon,
            activeRow: String(index),
            activeColumn: "to",
            fromClick: false,
            activeFromRow: focusLocation.activeFromRow,
          });
        }
      }
    });
  };

  const totals = () => {
    return (
      <div className="lg:w-full">
        <Totals
          totals={models.dataObjectTripStopTotals}
          tripData={models.dataObjectTripStop}
          focusLocation={focusLocation}
          onMarkerClick={handleMarkerClick}
          selectedLocation={selectedLocation}
          onZoomToggle={handleZoomToggle}
          onResetZoom={handleSetResetFunction}
          onResetZoomClick={handleResetZoom}
          isZoomEnabled={isZoomEnabled}
          userToken={models.user?.token}
          selectedVehicle={models.vehicle}
          startDate={models.startDate}
          endDate={models.endDate}
          showTrajectory={models.showTrajectory}
          onTrajectoryToggle={handleTrajectoryToggle}
          trajectoryData={models.trajectoryData}
          onFetchTrajectory={operations.fetchTrajectoryData}
        />
        {/* {models.reportType === t("general.trip_and_stop") && (
          <div className="grid grid-cols-1 py-4">
            <Card>
              <CardHeader>
                <CardTitle>{firstUpperLetter(t("general.timeline"))}</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline data={models.dataTimeline} horizontal={true} />
              </CardContent>
            </Card>
          </div>
        )} */}
      </div>
    );
  };



  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <Label className="font-normal">
            <span className="text-xl font-bold">
               {firstUpperLetter(t("general.trip_and_stop"))}
            </span>
          </Label>
        </div>
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <AdvancedTable
            ifVirtualized={true}
            dataList={models.dataObjectTripStop.map((item, idx) => ({ ...item, id: idx }))}
            ignoreList={models.ignoreList}
            actionList={models.actionList}
            styleColumnList={models.styleColumnList}
            pickers={pickers}
            //exports={exports}
            /*  groups={models.dataObjectTripStop[0]?.state ? groups : null} */
            actions={actions}
            ifPagination={false}
            activeRowId={activeRowId}
            onRowClick={handleRowClick}
            tableHeight="h-[40vh]"
            orderListData={models.orderListData}
            initialState={{ columnVisibility: models.initialColumnVisibility }}
            totals={
              Object.keys(models.dataObjectTripStopTotals).length > 0
                ? totals
                : null
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ObjectOverview;
