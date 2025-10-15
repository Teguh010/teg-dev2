"use client";
import { useEffect, useState, Fragment } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableRowNoBorder,
} from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { firstUpperLetter } from "@/lib/utils";
import { Label } from "@radix-ui/react-label";
import { CornerDownRight } from "lucide-react";

export function DataTable({
  columns,
  ifSearch,
  ifHide,
  dataList,
  styleColumnList,
  searchList,
  styleRowList,
  pickers,
  groups,
  totals,
  exports,
  bulk,
  ifPagination,
  onSelectedRowsChange = undefined,
  getRowClassName,
  label,
  treeList,
}) {
  const { t } = useTranslation();
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });

  const table = useReactTable({
    data: dataList,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    // getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  useEffect(() => {
    if (ifPagination === false) {
      table.setPageSize(1000);
    }
  }, []);

  useEffect(() => {
    if (onSelectedRowsChange) {
      const selectedData = table
        .getSelectedRowModel()
        .rows.map((row) => row.original);
      onSelectedRowsChange(selectedData);
    }
  }, [rowSelection, onSelectedRowsChange]);

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        ifSearch={ifSearch}
        searchList={searchList}
        exports={exports}
        pickers={pickers}
        groups={groups}
        bulk={bulk}
      />
      {totals && totals()}
      {
        //dataList?.length >= 1 &&
        <>
          {label && (
            <div>
              <Label className="font-normal">
                {firstUpperLetter(t(label))}
              </Label>
            </div>
          )}
          {!ifHide && (
            <div
              className={`rounded-md border overflow-y-auto overflow-x-auto ${
                !ifPagination && dataList?.length > 1
                  ? "h-[calc(100vh-150px)]"
                  : "h-auto"
              }`}
            >
              <Table>
                {dataList?.length >= 1 && (
                  <TableHeader className="bg-default-300 sticky z-20 top-0">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          if (
                            !header.getContext().header.id.startsWith("hidden_")
                          ) {
                            let styleHeader = "";
                            const matchedItem = styleColumnList.find(
                              (item) =>
                                item.title === header.getContext().header.id
                            );
                            if (matchedItem) {
                              styleHeader = matchedItem.header();
                            }
                            return (
                              <TableHead
                                key={header.id}
                                colSpan={header.colSpan}
                                className={styleHeader}
                              >
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </TableHead>
                            );
                          }
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                )}
                <TableBody className="bg-white">
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => {
                      let cellValue = "";
                      let styleRow = "";
                      const matchedItem = styleRowList.find((item) =>
                        row
                          .getVisibleCells()
                          .some((cell) => cell.column.id === item.title)
                      );

                      if (matchedItem) {
                        const matchedCell = row
                          .getVisibleCells()
                          .find((cell) => cell.column.id === matchedItem.title);
                        cellValue = matchedCell?.getContext().getValue() || "";
                        styleRow = matchedItem.value(cellValue);
                      }

                      const visibleCellsCount = row.getVisibleCells().length;
                      return (
                        <>
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            className={`${styleRow} ${
                              getRowClassName?.(row) || ""
                            }`}
                          >
                            {row.getVisibleCells().map((cell) => {
                              const cellContext = cell.getContext();
                              const columnId = cellContext.cell.column.id;
                              if (!columnId.startsWith("hidden_")) {
                                const matchedItem = styleColumnList.find(
                                  (item) => item.title === columnId
                                );
                                const styleCell = matchedItem
                                  ? matchedItem.value(cellValue)
                                  : "";
                                return (
                                  <TableCell
                                    key={cell.id}
                                    className={styleCell}
                                  >
                                    {cellContext.getValue() != null &&
                                      flexRender(
                                        cell.column.columnDef.cell,
                                        cellContext
                                      )}
                                    {(columnId === "select" ||
                                      columnId === "actions" ||
                                      columnId === "options") &&
                                      flexRender(
                                        cell.column.columnDef.cell,
                                        cellContext
                                      )}
                                  </TableCell>
                                );
                              }
                              return null;
                            })}
                          </TableRow>
                          {treeList.length > 0 &&
                            treeList.map((treeItem, treeIndex) => {
                              const treeData = row.original[treeItem.title];
                              if (!treeData) return null;
                              return (
                                <Fragment key={treeIndex}>
                                  {treeData.map((cell, rowIndex) => (
                                    <Fragment key={rowIndex}>
                                      {rowIndex === 0 && (
                                        <TableRowNoBorder
                                          key={`header-${rowIndex}`}
                                        >
                                          <TableCell className="flex flex-row">
                                            <CornerDownRight className="h-4 w-4" />
                                            {`${firstUpperLetter(
                                              treeItem.title
                                            )+": "}`}
                                          </TableCell>
                                          {Object.keys(cell).map(
                                            (key, cellIndex) => {
                                              if (key !== t("id")) {
                                                return (
                                                  <TableCell
                                                    key={`${rowIndex}-${cellIndex}`}
                                                    className="font-bold"
                                                  >
                                                    {`${firstUpperLetter(
                                                      t(key)
                                                    )}`}
                                                  </TableCell>
                                                );
                                              }
                                              return null;
                                            }
                                          )}
                                          {[
                                            ...Array(
                                              visibleCellsCount -
                                                Object.keys(cell).length
                                            ),
                                          ].map((_, idx) => (
                                            <TableCell key={idx} />
                                          ))}
                                        </TableRowNoBorder>
                                      )}
                                      <TableRowNoBorder key={`row-${rowIndex}`}>
                                        <TableCell />
                                        {Object.keys(cell).map(
                                          (key, cellIndex) => {
                                            if (key !== t("id")) {
                                              return (
                                                <TableCell
                                                  key={`${rowIndex}-${cellIndex}`}
                                                >
                                                  {`${cell[key]}`}
                                                </TableCell>
                                              );
                                            }
                                            return null;
                                          }
                                        )}
                                        {[
                                          ...Array(
                                            visibleCellsCount -
                                              Object.keys(cell).length
                                          ),
                                        ].map((_, idx) => (
                                          <TableCell key={idx} />
                                        ))}
                                      </TableRowNoBorder>
                                    </Fragment>
                                  ))}
                                </Fragment>
                              );
                            })}
                        </>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        {firstUpperLetter(t("general.no_data"))}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          {!ifHide && ifPagination ? (
            <div
              className={`flex ${
                bulk && table.getSelectedRowModel().rows.length > 0
                  ? "flex-row justify-between"
                  : "justify-end"
              }`}
            >
              {bulk &&
                table.getSelectedRowModel().rows.length > 0 &&
                bulk(table.getSelectedRowModel().rows)}
              <DataTablePagination table={table} />
            </div>
          ) : (
            <div className={`flex justify-start`}>
              {bulk &&
                table.getSelectedRowModel().rows.length > 0 &&
                bulk(table.getSelectedRowModel().rows)}
            </div>
          )}
        </>
      }
    </div>
  );
}
