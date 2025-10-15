"use client";
import { controller } from "./controller";
import { Button } from "@/components/ui/button";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import { useTranslation } from "react-i18next";
import ScheduleForm from "./components/schedule-form";
import { Card } from "@/components/ui/card";
import React from "react";
import DataTableRowOptions from "./components/data-table-row-options";
import ScheduleDetail from "./components/schedule-detail";
import { Label } from "@radix-ui/react-label";
import { firstUpperLetter } from "@/lib/utils";

const ScheduleManagement = () => {
  const { t } = useTranslation();
  const { models, operations } = controller();
  const [onlyMine, setOnlyMine] = React.useState(false);

  React.useEffect(() => {
    operations.fetchSchedules(onlyMine);
  }, [onlyMine]);

  if (!models.user || models.isLoading) {
    return <LayoutLoader />;
  }

  const options = (row) => {
    return (
      <DataTableRowOptions
        row={row}
        onEdit={operations.editSchedule}
        onDelete={operations.deleteSchedule}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="col-span-12 lg:col-span-12 overflow-x-auto">
        <Label className="font-normal">
          {firstUpperLetter(t("general.scheduled"))}
        </Label>
      </div>
      <div className="flex justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            color="success"
            size="sm"
            onClick={operations.createSchedule}
          >
            {t("schedule.create_new")}
          </Button>
        </div>
        {/* <SwitchPicker
            label={t('schedule.only_mine')}
            handleCheckedChange={setOnlyMine}
          /> */}
      </div>

      {models.isCreating || models.isEditing ? (
        <Card>
          <ScheduleForm
            schedule={models.currentSchedule}
            onCancel={operations.cancelForm}
            onSubmit={operations.submitSchedule}
            repetitionTypes={models.repetitionTypes}
          />
        </Card>
      ) : models.isViewingDetail ? (
        <ScheduleDetail
          schedule={models.selectedSchedule}
          repetitionTypes={models.repetitionTypes}
          onClose={operations.closeDetail}
        />
      ) : (
        <AdvancedTable
          dataList={models.schedules}
          ignoreList={[]}
          actionList={models.actionList}
          options={options}
          ifSearch={true}
          ifPagination={true}
        />
      )}
    </div>
  );
};

export default ScheduleManagement;
