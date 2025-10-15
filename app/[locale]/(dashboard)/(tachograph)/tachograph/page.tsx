"use client";
import { controller } from "./controller";
import { Button } from "@/components/ui/button";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import { useTranslation } from "react-i18next";
import DatePickerWithRange from "@/components/partials/pickers/date-picker-with-range";
import DataTableRowOptions from "./components/data-table-row-options";
import DataTableBulkOptions from "./components/data-table-bulk-options";
import SettingsPickers from "./components/settings-picker";
import UploadFiles from "./components/upload-files";
import { Label } from "@radix-ui/react-label";
import { firstUpperLetter } from "@/lib/utils";

const Tachograph = () => {
  const { t } = useTranslation();
  const { models, operations } = controller();

  if (!models.user || models.isLoading) {
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
          />
          <SettingsPickers
            reportType={models.reportType}
            reportTypeList={models.reportTypeList}
            setReportType={operations.setReportType}
            dataSource={models.dataSource}
            dataSourceList={models.dataSourceList}
            setDataSource={operations.setDataSource}
            penalties={models.penalties}
            penaltiesList={models.penaltiesList}
            setPenalties={operations.setPenalties}
            cultures={models.cultures}
            culturesList={models.culturesList}
            setCultures={operations.setCultures}
            timeZone={models.timeZone}
            timeZoneList={models.timeZoneList}
            setTimeZone={operations.setTimeZone}
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
          {/* <UploadFiles
          handleUploadFilesChange={operations.handleUploadFilesChange}
          uploadingFiles={models.uploadingFiles}
          handleUploadFiles={operations.handleUploadFiles}
        /> */}
        </div>
      </>
    );
  };

  const options = (row: any) => {
    return (
      <>
        <DataTableRowOptions
          row={row}
          getDriverReport={models.getDriverReport}
          setGetDriverReport={operations.setGetDriverReport}
          statusActive={models.statusActive}
          setStatusActive={operations.setStatusActive}
        />
      </>
    );
  };

  const bulk = (rows: any) => {
    return (
      <>
        <DataTableBulkOptions
          rows={rows}
          getDriverBulkReport={models.getDriverBulkReport}
          setGetDriverBulkReport={operations.setGetDriverBulkReport}
          statusActiveBulk={models.statusActiveBulk}
          setStatusActiveBulk={operations.setStatusActiveBulk}
        />
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Bulk Progress Bar */}
      {models.bulkProgress.open && (
        <div className="fixed top-0 left-0 w-full flex justify-center z-50">
          <div className="bg-white shadow-lg rounded px-6 py-4 mt-8 flex flex-col items-center border border-gray-300">
            <span className="mb-2 font-medium text-gray-500">Processing {models.bulkProgress.current} / {models.bulkProgress.total} drivers...</span>
            <div className="w-64 bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(models.bulkProgress.current / models.bulkProgress.total) * 100}%` }}
              />
            </div>
            <span className="mt-2 text-xs text-gray-500">{Math.round((models.bulkProgress.current / models.bulkProgress.total) * 100)}%</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-12 gap-6">
        <div className="flex flex-col col-span-3">
          <span className="text-lg font-bold">{firstUpperLetter(t("Tachograph Report"))}</span>
          <span className="text-sm font-normal">{firstUpperLetter(t("default_is_six_months_time_period"))}</span>
        </div>
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <AdvancedTable
            ifSelect
            ifSearch
            dataList={models.dataList}
            ignoreList={models.ignoreList}
            searchList={models.searchList}
            pickers={pickers}
            options={options}
            ifPagination={false}
            bulk={bulk}
            optionsFirst={true}
          />
        </div>
      </div>
    </div>
  );
};

export default Tachograph;
