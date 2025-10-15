"use client";
import { controller } from "./controller";
import LayoutLoader from "@/components/layout-loader";
import AdminAdvancedTable from "@/components/partials/admin-advanced";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Label } from "@radix-ui/react-label";
import { firstUpperLetter } from "@/lib/utils";
import CustomSelect from "./components/custom-select";

const ManufacturerList = () => {
  const { t } = useTranslation();
  const { models, operations } = controller();
  const user = models.user;

  if (!user) {
    return <LayoutLoader />;
  }

  const hasData = models.dataGenerated && models.manufacturerList?.length > 0;

  const customerOptions = [
    { value: 'all', label: t('All Customers') },
    ...models.customers.map(customer => ({
      value: customer.id.toString(),
      label: customer.name
    }))
  ];

   const pickers = () => {
    return (
      <div className="flex flex-col lg:flex-row justify-start items-center gap-2">
        <CustomSelect
          value={models.selectedCustomerId?.toString() || 'all'}
          onChange={(value) => {
            operations.handleCustomerSelect(value);
          }}
          options={customerOptions}
          placeholder={t("Select Customer")}
          disabled={models.loading}
        />

        <Button
          variant="outline"
          color="success"
          size="sm"
          className="h-8"
          disabled={models.isGenerate || models.loading}
          onClick={() => operations.setIsGenerate(true)}
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
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <Label className="font-normal">
            {firstUpperLetter(t("Manufacturer List"))}
          </Label>
        </div>
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <AdminAdvancedTable
            dataList={models.dataGenerated ? models.manufacturerList : []}
          ignoreList={models.ignoreList}
            styleRowList={models.styleRowList}
            pickers={pickers}
            ifPagination={hasData}
          />
        </div>
      </div>
    </div>
  );
};

export default ManufacturerList;