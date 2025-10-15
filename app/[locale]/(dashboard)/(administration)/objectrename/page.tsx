"use client";
import { controller } from "./controller";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import TransportModeSelect from "./components/custom-seleect";
import DataTableRowOptions from "./components/data-table-row-options";
import { firstUpperLetter } from "@/lib/utils";

const ObjectRename = () => {
  const { t } = useTranslation();
  const { models, operations } = controller();
  const user = models.user;

  if (!user) {
    return <LayoutLoader />;
  }

  /* const hasData = models.dataGenerated && models.filteredObjectList?.length > 0; */

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const options = (row: any) => {
      return (
        <>
          <DataTableRowOptions
            row={row}
            setUpdateObject={operations.setUpdateObject}
          />
        </>
      );
    };

  const pickers = () => {
    return (
      <div className="flex flex-col lg:flex-row justify-start gap-2">
        <TransportModeSelect
          value={models.selectedGroup?.toString() || ""}
          onChange={(value) =>
            operations.setSelectedGroup(value ? parseInt(value) : null)
          }
          options={[
            { value: "", label: firstUpperLetter(t("general.all_groups")) },
            ...(models.groupList?.map((group) => ({
              value: group.id.toString(),
              label: group.val,
            })) || []),
          ]}
          placeholder={t("general.select_group")}
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
    );
  };

  return (
    <div className="space-y-6 pb-4">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <AdvancedTable
            dataList={models.dataGenerated ? models.filteredObjectList : []}
            ignoreList={models.ignoreList}
            pickers={pickers}
            ifPagination={true}
            options={options}
          />
        </div>
      </div>
    </div>
  );
};

export default ObjectRename;
