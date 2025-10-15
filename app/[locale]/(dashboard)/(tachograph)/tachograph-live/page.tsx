"use client";
import { controller } from "./controller";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import { firstUpperLetter } from "@/lib/utils";
import { Label } from "@radix-ui/react-label";
import { useTranslation } from "react-i18next";

const TachoLive = () => {
  const { t } = useTranslation();
  const { models } = controller();

  if (models.isLoading) {
    return <LayoutLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <Label className="font-normal">
            {firstUpperLetter(t("general.tachograph_live"))}
          </Label>
        </div>
        <div className="col-span-12 lg:col-span-12">
          <div className="min-w-full overflow-x-auto">
            <AdvancedTable
              dataList={models.tachoData}
              ifPagination={false}
              styleColumnList={models.styleColumnList}
              styleRowList={models.styleRowList}
              ignoreList={models.ignoreList}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TachoLive;
