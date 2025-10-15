"use client";
import { controller } from "./controller";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import { useTranslation } from "react-i18next";
import { Label } from "@radix-ui/react-label";
import { firstUpperLetter } from "@/lib/utils";

const ModuleOverview = () => {
  const { t } = useTranslation();
  const { models } = controller();
  const user = models.user;

  if (!user) {
    return <LayoutLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <Label className="font-normal">
            {firstUpperLetter(t("Module Overview"))}
          </Label>
        </div>
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <AdvancedTable
            dataList={models.dataGenerated ? models.moduleList : []}
            ignoreList={models.ignoreList}
            styleRowList={models.styleRowList}
            styleColumnList={models.styleColumnList}
            ifSearch={true}
            ifPagination={false}
            searchList={models.searchList}
          />
        </div>
      </div>
    </div>
  );
};

export default ModuleOverview;
