"use client";
import { controller } from "./controller";
import { Button } from "@/components/ui/button";
import DatePickerWithRange from "@/components/partials/pickers/date-picker-with-range";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import { useTranslation } from "react-i18next";
import { Label } from "@radix-ui/react-label";
import { firstUpperLetter } from "@/lib/utils";

const ValidRawMessage = () => {
  const { t } = useTranslation();
  const { models, operations } = controller();

  if (!models.user || models.isLoading || !models.dataList) {
    return <LayoutLoader />;
  }

  const pickers = () => {
    return (
      <>
        <div className="flex flex-col lg:flex-row justify-start gap-2">
          <DatePickerWithRange
            setStartDate={operations.setStartDate}
            setEndDate={operations.setEndDate}
            startDate={models.startDate}
            endDate={models.endDate}
            settings={models.settings}
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
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <Label className="font-normal">
            {firstUpperLetter(
              t("general.tachograph_distance_driven_stats")
            )}
          </Label>
        </div>
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <AdvancedTable
            dataList={models.dataList}
            ignoreList={models.ignoreList}
            pickers={pickers}
            /* searchList={models.searchList}
            ifSearch */
          />
        </div>
      </div>
    </div>
  );
};

export default ValidRawMessage;
