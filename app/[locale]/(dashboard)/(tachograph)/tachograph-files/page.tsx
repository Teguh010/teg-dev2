"use client";
import { Button } from "@/components/ui/button";
import { controller } from "./controller";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import { useTranslation } from "react-i18next";
import UploadFiles from "./components/upload-files";
import DataTableRowOptions from "./components/data-table-row-options";
import DataTableBulkOptions from "./components/data-table-bulk-options";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { firstUpperLetter } from "@/lib/utils";
import DatePickerWithRange from "@/components/partials/pickers/date-picker-with-range";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import toast from "react-hot-toast";
import { Label } from "@radix-ui/react-label";

const Tachograph = () => {
  const { t } = useTranslation();
  const { models, operations } = controller();

  if (!models.user || models.isLoading) {
    return <LayoutLoader />;
  }

  const pickersTachoGetRawFile = () => {
    return (
      <>
        <div className="flex flex-col lg:flex-row justify-start gap-2">
          <UploadFiles
            handleUploadFilesChange={operations.handleUploadFilesChange}
            isUpdateFile={models.isUpdateFile}
            uploadFiles={models.uploadFiles}
            setUpdateFile={operations.setUpdateFile}
          />
          <DatePickerWithRange
            setStartDate={operations.setStartDate}
            setEndDate={operations.setEndDate}
            startDate={models.startDate}
            endDate={models.endDate}
            settings={models.settings}
            text="pick_a_donwload_date"
          />
          <DatePickerWithRange
            setStartDate={operations.setStartPeriod}
            setEndDate={operations.setEndPeriod}
            startDate={models.startPeriod}
            endDate={models.endPeriod}
            settings={models.settings}
            text="pick_a_period"
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

  const pickersTachoGetRawCardFile = () => {
    return (
      <>
        <div className="flex flex-col lg:flex-row justify-start gap-2">
          <UploadFiles
            handleUploadFilesChange={operations.handleUploadFilesChange}
            isUpdateFile={models.isUpdateFile}
            uploadFiles={models.uploadFiles}
            setUpdateFile={operations.setUpdateFile}
          />
          <DatePickerWithRange
            setStartDate={operations.setStartDate}
            setEndDate={operations.setEndDate}
            startDate={models.startDate}
            endDate={models.endDate}
            settings={models.settings}
            text="pick_a_donwload_date"
          />
          <DatePickerWithRange
            setStartDate={operations.setStartPeriod}
            setEndDate={operations.setEndPeriod}
            startDate={models.startPeriod}
            endDate={models.endPeriod}
            settings={models.settings}
            text="pick_a_activities"
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const optionsTachoGetRawFile = (row: any) => {
    return (
      <>
        <DataTableRowOptions
          row={row}
          getReport={models.getReport}
          setGetReport={operations.setGetReport}
          fileType="tachoGetRawFile"
        />
      </>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const optionsTachoGetRawCardFile = (row: any) => {
    return (
      <>
        <DataTableRowOptions
          row={row}
          getReport={models.getReport}
          setGetReport={operations.setGetReport}
          fileType="tachoGetRawCardFile"
        />
      </>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bulkTachoGetRawFile = (rows: any) => {
    return (
      <>
        <DataTableBulkOptions
          rows={rows}
          getBulkReport={models.getBulkReport}
          setGetBulkReport={operations.setGetBulkReport}
          fileType="tachoGetRawFile"
        />
      </>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bulkTachoGetRawCardFile = (rows: any) => {
    return (
      <>
        <DataTableBulkOptions
          rows={rows}
          getBulkReport={models.getBulkReport}
          setGetBulkReport={operations.setGetBulkReport}
          fileType="tachoGetRawCardFile"
        />
      </>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actions = (row: any, key: any) => {
    if (key === t("general.error")) {
      return (
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  color="secondary"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(row.original.error)
                      .then(() => {
                        toast.success(firstUpperLetter(t("general.copied")));
                      })
                      .catch((err) => {
                        toast.error(err);
                      });
                  }}
                >
                  {row.original.error.slice(0, 50) + "..."}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{row.original.error}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="col-span-12 lg:col-span-12 overflow-x-auto">
         <span className="text-xl font-bold">{firstUpperLetter(t("general.tachograph_files"))}</span>
        {models.errorMessage && (
          <div className="bg-white border border-red-200 text-red-600 rounded-md p-4 my-4 text-center">
            {models.errorMessage}
          </div>
        )}
      </div>
      {models.errorMessage === "Insufficient privileges" ? null : (
        <Tabs defaultValue="table1">
          <TabsList className="grid w-full space-x-2 grid-cols-2 bg-default">
            <TabsTrigger value="table1" className="border border-gray-300">
              {firstUpperLetter(t("general.vehicle_file"))}
            </TabsTrigger>
            <TabsTrigger value="table2" className="border border-gray-300">
              {firstUpperLetter(t("general.driver_file"))}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="table1">
            <div className="space-y-6">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-12 overflow-x-auto">
                  <AdvancedTable
                    ifSelect
                    pickers={pickersTachoGetRawFile}
                    dataList={models.dataTachoFilesList}
                    ignoreList={models.ignoreList}
                    options={optionsTachoGetRawFile}
                    bulk={bulkTachoGetRawFile}
                    actionList={models.actionList}
                    actions={actions}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="table2">
            <div className="space-y-6">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-12 overflow-x-auto">
                  <AdvancedTable
                    ifSelect
                    pickers={pickersTachoGetRawCardFile}
                    dataList={models.dataTachoDriverCardFilesList}
                    ignoreList={models.ignoreList}
                    options={optionsTachoGetRawCardFile}
                    bulk={bulkTachoGetRawCardFile}
                    actionList={models.actionList}
                    actions={actions}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Tachograph;
