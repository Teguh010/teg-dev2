"use client";
import { controller } from "./controller";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import { useTranslation } from "react-i18next";
import { Label } from "@radix-ui/react-label";
import { firstUpperLetter } from "@/lib/utils";

const ModuleList = () => {
  const { t } = useTranslation();
  const { models } = controller();
  const user = models.user;

  if (!user) {
    return <LayoutLoader />;
  }

  const hasData = models.dataGenerated && models.moduleList?.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <Label className="font-normal">
            {firstUpperLetter(t("Module List"))}
          </Label>
        </div>
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <AdvancedTable
            dataList={models.dataGenerated && Array.isArray(models.moduleList) ? models.moduleList : []}
            ignoreList={models.ignoreList}
            styleRowList={models.styleRowList}
            ifPagination={false}
            ifSearch={true}
            searchList={models.searchList}
          />
        </div>
      </div>
    </div>
  );
};

export default ModuleList;
