"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { useTranslation } from 'react-i18next';

export function DataTableToolbar({ table, ifSearch, searchList, pickers, groups, exports, bulk }) {
  const { t } = useTranslation();
  const [filterValue, setFilterValue] = useState("");

  const handleSearch = (event) => {
    const value = event.target.value;
    setFilterValue(value);
    searchList.forEach(item => {
      const column = table.getColumn(item.title);
      if (column) {
        column.setFilterValue(value);
      }
    });
  };

  return (
    <div className="flex justify-between flex-col lg:flex-row lg:items-center">
      <div className="flex flex-col lg:flex-row gap-2 lg:gap-0">
        {bulk && table.getSelectedRowModel().rows.length > 0 &&
          <div className="pr-2 hidden lg:flex">
            {bulk(table.getSelectedRowModel().rows)}
          </div>
        }
        {ifSearch &&
          <>
            <div className="hidden lg:flex lg:w-[200px] mr-2">
              <Input
                placeholder={t('general.search')}
                value={filterValue}
                onChange={handleSearch}
                className="h-8 min-w-[200px] max-w-sm"
              />
            </div>
            <div className="flex flex-row lg:hidden">
              <Input
                placeholder={t('general.search')}
                value={filterValue}
                onChange={handleSearch}
                className="h-8 min-w-[200px] max-w-sm ml-0"
              />
            </div>
          </>
        }
        {pickers && pickers(table)}
        {exports && exports(table)}
      </div>
      <div className="mt-2 lg:mt-0 flex justify-between">
        {bulk && table.getSelectedRowModel().rows.length > 0 &&
          <div className="pr-2 flex lg:hidden">
            {bulk(table.getSelectedRowModel().rows)}
          </div>}
        {groups && groups(table)}
        {table.getAllColumns().length > 1 &&
          <DataTableViewOptions table={table} className="w-full" />
        }
      </div>
    </div>

  );
}
