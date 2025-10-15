"use client";
import { controller } from "./controller";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import DataTableRowOptions from "./components/data-table-row-options";
import DataTableAddNewGroup from "./components/data-table-add-new-group";
import { useTranslation } from 'react-i18next';

const Gruops = () => {
  const { t } = useTranslation();
  const { models, operations } = controller();

  if (!models.user || models.isLoading || !models.dataList) {
    return <LayoutLoader />;
  }

  const pickers = () => {
    return <>
      <div className="flex flex-col lg:flex-row justify-start gap-2">
        <DataTableAddNewGroup
          vehicles={models.vehicles}
          saveGroup={models.saveGroup}
          setSaveGroup={operations.setSaveGroup}
        />
      </div>
    </>;
  };

  const options = (row: any) => {
    return <>
      <DataTableRowOptions
        row={row}
        vehicles={models.vehicles}
        updateGroup={models.updateGroup}
        setUpdateGroup={operations.setUpdateGroup}
        setDeleteGroup={operations.setDeleteGroup}
      />
    </>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12gap-6">
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <AdvancedTable
            dataList={models.dataList}
            ignoreList={models.ignoreList}
            options={options}
            pickers={pickers}
          />
        </div>
      </div>
    </div>
  );
};

export default Gruops;
