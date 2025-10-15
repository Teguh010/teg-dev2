"use client";
import { controller } from "./controller";
import { Button } from "@/components/ui/button";
import DatePickerWithRange from "@/components/partials/pickers/date-picker-with-range";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Timeline from "@/components/timeline";
import { firstUpperLetter } from "@/lib/utils";
import { Label } from "@radix-ui/react-label";

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
            text="pick_a_date"
            onlyDate={true}
          />
          <Button
            variant="outline"
            color="success"
            size="sm"
            className="h-8"
            disabled={models.isGenerate}
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

  const totals = () => {
    return (
      models.dataTimeline.length > 0 && (
        <div className="lg:w-full">
          <div className="grid grid-cols-1 pb-4">
            <Card>
              <CardHeader>
                <CardTitle>{firstUpperLetter(t("general.timeline"))}</CardTitle>
                <CardDescription>
                  {models.dataTimeline.length > 0 &&
                    firstUpperLetter(t("general.total_vehicles") + ": ") +
                      new Set(
                        models.dataList.map(
                          (item) => item[t("general.vehicle")]
                        )
                      ).size}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Timeline data={models.dataTimeline} />
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
            {firstUpperLetter(t("general.read_statuses"))}
          </Label>
        </div>
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <AdvancedTable
            dataList={models.dataList}
            ignoreList={models.ignoreList}
            pickers={pickers}
            label={
              models.dataTimeline.length === 0 &&
              "default_is_three_year_time_period"
            }
            totals={totals}
            ifHide
          />
        </div>
      </div>
    </div>
  );
};

export default ValidRawMessage;
