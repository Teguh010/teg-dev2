"use client";
import { useEffect, useState } from "react";
import { controller } from "./controller";
import { Button } from "@/components/ui/button";
import DatePickerWithRange from "@/components/partials/pickers/date-picker-with-range";
import VehiclePicker from "@/components/partials/pickers/vehicle-picker";
import LayoutLoader from "@/components/layout-loader";
import loadHereMaps from "@/components/maps/here-map/utils/here-map-loader";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import Timeline from "@/components/timeline";
import { Label } from "@radix-ui/react-label";
import { firstUpperLetter } from "@/lib/utils";

const page = () => {
  const { t } = useTranslation();
  const [mapLoaded, setMapLoaded] = useState(false);
  const { models, operations } = controller();

  useEffect(() => {
    loadHereMaps(() => setMapLoaded(true));
  }, []);

  if (
    !models.user ||
    models.isLoading ||
    !models.dataObjectList ||
    !mapLoaded
  ) {
    return <LayoutLoader />;
  }

  const pickers = () => {
    return (
      <>
        <div className="flex flex-col lg:flex-row justify-start gap-2">
          <VehiclePicker
            vehicles={models.dataObjectList}
            setVehicle={operations.setVehicle}
          />
          <DatePickerWithRange
            setStartDate={operations.setStartDate}
            setEndDate={operations.setEndDate}
            startDate={models.startDate}
            endDate={models.endDate}
            settings={models.settings}
          />
          {/* <SettingsPicker
            datatypeList={models.datatypeList}
            ioIdsFilter={models.ioIdsFilter}
            setIoIdsFilter={operations.setIoIdsFilter}
            setNumberRows={operations.setNumberRows}
            numberRows={models.numberRows}
            setGenerate={operations.setGenerate}
          /> */}
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
          {/* <Button
            variant="outline"
            color="success"
            size="sm"
            className="h-8 show-hide-button"
            onClick={toggleMapVisibility}
            disabled={selectedRowData.length === 0}
          >
            <span className="capitalize">
              {isMapVisible ? t("general.hide_map") : t("general.show_map")}
            </span>
          </Button> */}
        </div>
      </>
    );
  };

  const totals = () => {
    return (
      models.dataTimeline.length > 0 && (
        <div className="lg:w-full pt-4">
          <div className="grid grid-cols-1 pb-4">
            <Card>
              <CardContent>
                <Timeline
                  data={models.dataTimeline}
                  yLength={models.yLengthTimeline}
                  colorCode={models.colorCodeTimeline}
                  oneDay={true}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <Label className="font-normal">
            {firstUpperLetter(
              t("general.timeline_test")
            )}
          </Label>
        </div>
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          {/* <AdvancedTable
            ifSelect
            dataList={models.dataValidRawMessages}
            ignoreList={models.ignoreList}
            pickers={pickers}
            ifPagination={false}
            styleRowList={models.styleRowList}
            styleColumnList={models.styleColumnList}
            onSelectedRowsChange={setSelectedRowData}
            totals={totals}
          /> */}
          {pickers()}
          {models.dataTimeline.length > 0 && totals()}
        </div>
      </div>
    </div>
  );
};

export default page;
