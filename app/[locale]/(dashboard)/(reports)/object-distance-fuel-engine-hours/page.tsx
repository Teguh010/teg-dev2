"use client";
import { controller } from "./controller";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import DatePickerWithRange from "@/components/partials/pickers/date-picker-with-range";
import DriversPicker from "@/components/partials/pickers/drivers-picker";
import GeneralPicker from "@/components/partials/pickers/general-picker";
import { firstUpperLetter } from "@/lib/utils";
import { Label } from "@radix-ui/react-label";

const ObjectDistanceFuelEngineHours = () => {
  const { t } = useTranslation();
  const { models, operations } = controller();

  if (!models.user || models.isLoading || !models.dataList) {
    return <LayoutLoader />;
  }

  const pickers = () => {
    return (
      <>
        <div className="flex flex-col lg:flex-row justify-start gap-2">
          <DriversPicker
            vehicles={models.dataObjectList}
            setVehicles={operations.setVehicles}
          />
          <DatePickerWithRange
            setStartDate={operations.setStartDate}
            setEndDate={operations.setEndDate}
            startDate={models.startDate}
            endDate={models.endDate}
            settings={models.settings}
          />
          <GeneralPicker
            valueList={models.splitList}
            value={models.split}
            setValue={operations.setSplit}
            label={firstUpperLetter(t("general.split_by"))}
          />
          <Button
            variant="outline"
            color="success"
            size="sm"
            className="h-8"
            disabled={models.isGenerate || !models.startDate || !models.endDate}
            onClick={() => operations.setGenerate(true)}
          >
            <span className="capitalize">
              {models.isGenerate
                ? t("general.generating")
                : t("general.generate")}
            </span>
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6 pb-4">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <Label className="font-normal">
            {firstUpperLetter(t("general.object_distance_fuel_engine_hours"))}
          </Label>
        </div>
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <AdvancedTable
            dataList={models.dataList}
            ignoreList={models.ignoreList}
            pickers={pickers}
            ifPagination={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ObjectDistanceFuelEngineHours;
