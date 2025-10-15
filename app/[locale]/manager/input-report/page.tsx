"use client";
import { useEffect, useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
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

  // Handler ketika point di chart di klik
  const handlePointClick = (data: ValidRawMessage) => {
    setSelectedLocation(data);
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
          {/* {firstUpperLetter(t("general.valid_raw_message"))} */}
          Input Report
        </Label>
      </div>
      <div className="pb-0">
        {pickers()}
      </div>

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
                />
              ) : (
                <div className="text-gray-500"> No Data Available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
         <div className="flex-grow pb-8">
        {models.dataValidRawMessages && models.dataValidRawMessages.length > 0 ? (
          <RawMessagesMap
            dataValidRawMessages={models.dataValidRawMessages}
            selectedLocation={selectedLocation}
          />
        ) : (
          <div className="flex items-center justify-center h-96 text-gray-500">
            No data available
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidRawMessage;
