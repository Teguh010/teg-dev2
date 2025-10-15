"use client";
import React, { useMemo } from "react";
import { controller } from "./controller";
import { Button } from "@/components/ui/button";
import DatePickerWithRange from "@/components/partials/pickers/date-picker-with-range";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import { useTranslation } from "react-i18next";
import DriversPicker from "@/components/partials/pickers/drivers-picker";
import SwitchPicker from "./components/switch-picker";
import { Label } from "@radix-ui/react-label";
import { firstUpperLetter } from "@/lib/utils";

const Page: React.FC = () => {
  const { t } = useTranslation();
  const { models, operations } = controller();

  const pickersElement = useMemo(
    () => (
      <div className="flex flex-col lg:flex-row justify-start gap-2 mb-4">
        <DriversPicker
          vehicles={models.dataDriverList}
          setVehicles={operations.setVehicles}
        />
        <DatePickerWithRange
          setStartDate={operations.setStartDate}
          setEndDate={operations.setEndDate}
          startDate={models.startDate}
          endDate={models.endDate}
          settings={models.settings}
        />
        <SwitchPicker handleCheckedChange={operations.handleCheckedChange} />
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
    ),
    [
      models.dataDriverList,
      models.startDate,
      models.endDate,
      models.settings,
      models.isGenerate,
      operations.setVehicles,
      operations.setStartDate,
      operations.setEndDate,
      operations.handleCheckedChange,
    ]
  );

  if (!models.user || models.isLoading || !models.dataList) {
    return <LayoutLoader />;
  }

  return (
    <div className="space-y-6 pb-4">
      <div className="col-span-12 lg:col-span-12 overflow-x-auto">
        <Label className="font-normal">
          {firstUpperLetter(
            t("general.tachograph_driving_stats_by_driver_card_data")
          )}
        </Label>
      </div>

      <div className="col-span-12 lg:col-span-12 overflow-x-auto">
        {pickersElement}
      </div>

      {models.dataList.length === 0 ? (
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <AdvancedTable
            dataList={models.dataList}
            ignoreList={models.ignoreList}
          />
        </div>
      ) : (
        models.dataList.map((item) => (
          <div className="grid grid-cols-12 gap-6" key={item.driver.card_num}>
            <div className="col-span-12 lg:col-span-12 overflow-x-auto">
              <AdvancedTable
                dataList={item.data}
                ignoreList={models.ignoreList}
                label={`${item.driver.full_name} - ${item.driver.card_num}`}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Page;
