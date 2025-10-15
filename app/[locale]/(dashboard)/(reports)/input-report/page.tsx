"use client";
import { useEffect, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { controller } from "./controller";
import { Button } from "@/components/ui/button";
import DatePickerWithRange from "@/components/partials/pickers/date-picker-with-range";
import VehiclePicker from "@/components/partials/pickers/vehicle-picker";
import LayoutLoader from "@/components/layout-loader";
import loadHereMaps from "@/components/maps/here-map/utils/here-map-loader";
import { useTranslation } from "react-i18next";
import { SettingsPicker } from "./components/settings-picker";
import { DataTypeFilter } from "./components/DataTypeFilter";
import AdvancedTable from "@/components/partials/many-advanced";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/custom-checkbox";

import { Label } from "@radix-ui/react-label";

const RawMessagesMap = dynamic(() => import("./components/raw-messages-map"), { ssr: false });
const FooterRawMessages = dynamic(() => import("./components/footer-raw-messages"), { ssr: false });

interface ValidRawMessage {
  msg_data?: Record<string, unknown> | string;
  invalid_msg_data?: Record<string, unknown> | string;
  gpstime?: string | Date;
  ignition?: boolean | string;
  [key: string]: unknown;
}

const ValidRawMessage = () => {
  const { t } = useTranslation();
  const [mapLoaded, setMapLoaded] = useState(false);
  const { models, operations, setDataValidRawMessages } = controller();
  const [isPending, startTransition] = useTransition();
  // State lokal untuk checkbox agar UI responsif
  const [showGpsspeedLocal, setShowGpsspeedLocal] = useState(models.showGpsspeed);

  // Sinkronkan state lokal jika global berubah (misal: reset)
  useEffect(() => {
    setShowGpsspeedLocal(models.showGpsspeed);
  }, [models.showGpsspeed]);
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]); // array of index id
  const [activeRowId, setActiveRowId] = useState<number | null>(null); // id baris aktif dari klik marker
  const [selectedLocation, setSelectedLocation] = useState<ValidRawMessage | null>(null);

  // --- ALL HOOKS MUST BE CALLED BEFORE ANY RETURN/IF ---
  useEffect(() => {
    loadHereMaps(() => setMapLoaded(true));
  }, []);

  // Handler untuk tombol generate
  const handleGenerate = () => {
    setDataValidRawMessages([]); // reset dataValidRawMessages agar total langsung 0
    operations.setGenerate(true); // trigger generate
  };

  // Handler ketika point di chart di klik (dari FooterRawMessages/RawMessagesChart)
  const handlePointClick = (data: ValidRawMessage) => {
    // Cari index data di dataValidRawMessages
    const idx = models.dataValidRawMessages.findIndex((item) => item === data);
    setSelectedLocation(data);
    if (idx !== -1) setActiveRowId(idx);
  };

  // Handler ketika row di table di klik
  const handleRowClick = (id: number) => {
    setActiveRowId(id);
    if (models.dataValidRawMessages && models.dataValidRawMessages[id]) {
      setSelectedLocation(models.dataValidRawMessages[id]);
    }
  };

  // Handler ketika checkbox di table di klik
  const handleSelectedRowsChange = (rows: { id: number }[]) => {
    const newIds = rows.map((row) => row.id);
    setSelectedRowIds(newIds);
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
          <Checkbox
            id="showGpsspeed"
            checked={showGpsspeedLocal}
            onCheckedChange={(checked) => {
              setShowGpsspeedLocal(checked === true); // UI langsung update
              startTransition(() => {
                setTimeout(() => {
                  operations.setShowGpsspeed(checked === true);
                }, 0);
              });
            }}
            size="sm"
          >
            GPS Speed
            {isPending && models.dataValidRawMessages.length > 0 && (
              <span className="ml-2 animate-spin inline-block w-4 h-4 border-2 border-t-transparent border-gray-400 rounded-full align-middle"></span>
            )}
          </Checkbox>
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
        </div>
      </>
    );
  };

  if (!models.user || !models.dataObjectList || !mapLoaded) {
    return <LayoutLoader />;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="col-span-12 lg:col-span-12 overflow-x-auto">
        <Label className="font-semibold text-lg">
          Input Report
        </Label>
      </div>
      <div className="pb-0">{pickers()}</div>

      {/* Layout side by side: Table & Map */}
       <div className="bg-gray-800 text-white p-0">
        <Card
          className="data-content-card p-0 bg-white w-full rounded-none shadow-none"
        >
          <CardContent className="px-0 pt-0 pb-0">
            <div
              className={`text-center flex justify-center items-center w-full`}
              style={{ minHeight: "40vh", height: "40vh" }}
            >
              {models.dataValidRawMessages && models.dataValidRawMessages.length > 0 ? (
                <FooterRawMessages
                  dataValidRawMessages={models.dataValidRawMessages}
                  onPointClick={handlePointClick}
                  selectedDataTypes={models.selectedDataTypes}
                  datatypeList={models.datatypeList}
                  showGpsspeed={models.showGpsspeed}
                />
              ) : (
                <div className="text-gray-500"> No Data Available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        {/* Table Section */}
        <div className="w-full lg:w-1/2">
          {models.dataValidRawMessages && models.dataValidRawMessages.length > 0 ? (
            <AdvancedTable
              ifSelect
              ifVirtualized={true}
              dataList={models.dataValidRawMessages.map((item, idx) => ({ ...item, id: idx }))}
              ignoreList={models.ignoreList}
              ifPagination={false}
              styleRowList={models.styleRowList}
              styleColumnList={models.styleColumnList}
              onSelectedRowsChange={handleSelectedRowsChange}
              selectedRowIds={selectedRowIds}
              activeRowId={activeRowId}
              onRowClick={handleRowClick}
              loading={models.isLoading}
              hideViewOptions={true}
              tableHeight="h-[40vh]"
            />
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">No data available</div>
          )}
        </div>

        {/* Map Section */}
        <div className="w-full lg:w-1/2 pt-2">
          {models.dataValidRawMessages && models.dataValidRawMessages.length > 0 ? (
            <RawMessagesMap
              dataValidRawMessages={models.dataValidRawMessages}
              selectedLocation={selectedLocation}
            />
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidRawMessage;
