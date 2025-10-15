"use client"
import { useEffect, useState, Fragment } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableRowNoBorder
} from "@/components/ui/table"
import { useTranslation } from "react-i18next"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import { firstUpperLetter } from "@/lib/utils"
import { Label } from "@radix-ui/react-label"
import { CornerDownRight } from "lucide-react"

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
  columnVisibility: columnVisibilityProp,
  setColumnVisibility: setColumnVisibilityProp,
  activeRowId = null,
  onRowClick = null,
}) {
  const { t } = useTranslation()
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibilityState, setColumnVisibilityState] = useState({})
  const columnVisibility = columnVisibilityProp !== undefined ? columnVisibilityProp : columnVisibilityState;
  const setColumnVisibility = setColumnVisibilityProp !== undefined ? setColumnVisibilityProp : setColumnVisibilityState;
  const [columnFilters, setColumnFilters] = useState([])
  const [sorting, setSorting] = useState([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50
  })
  const [filterValue, setFilterValue] = useState("")

  const table = useReactTable({
    data: dataList,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      globalFilter: filterValue
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setFilterValue,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true

      const searchColumns = searchList.map((item) => item.title)

      return searchColumns.some((columnId) => {
        const cellValue = row.getValue(columnId)
        return String(cellValue || "")
          .toLowerCase()
          .includes(filterValue.toLowerCase())
      })
    }
  })

  useEffect(() => {
    if (ifPagination === false) {
      table.setPageSize(1000)
    }
  }, [])

  useEffect(() => {
    if (onSelectedRowsChange) {
      const selectedData = table.getSelectedRowModel().rows.map((row) => row.original)
      onSelectedRowsChange(selectedData)
    }
  }, [rowSelection, onSelectedRowsChange])

  return (
    <div className='space-y-4'>
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
              <Label className='font-normal'>{firstUpperLetter(t(label))}</Label>
            </div>
          )}
          {!ifHide && (
            <div
              className={`rounded-md overflow-y-auto overflow-x-auto ${
                !ifPagination && dataList?.length > 1
                  ? "h-[calc(100vh-230px)]"
                  : "h-[calc(100vh-230px)]"
              }`}
            >
              <Table>
                {dataList?.length >= 1 && (
                  <TableHeader className='bg-default-300 sticky z-20 top-0'>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          if (!header.getContext().header.id.startsWith("hidden_")) {
                            let styleHeader = ""
                            const matchedItem = styleColumnList.find(
                              (item) => item.title === header.getContext().header.id
                            )
                            if (matchedItem) {
                              if (matchedItem.header) {
                                styleHeader = matchedItem.header()
                              } else if (matchedItem.headerClass) {
                                styleHeader = matchedItem.headerClass
                              }
                            }
                            return (
                              <TableHead
                                key={header.id}
                                colSpan={header.colSpan}
                                className={styleHeader}
                              >
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(header.column.columnDef.header, header.getContext())}
                              </TableHead>
                            )
                          }
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                )}
                <TableBody className='bg-white'>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => {
                      let cellValue = ""
                      let styleRow = ""
                      const matchedItem = styleRowList.find((item) => {
                        // Check if the field exists in row.original data (even if not visible)
                        return row.original.hasOwnProperty(item.title)
                      })

                      if (matchedItem) {
                        // Get value from original data instead of visible cells
                        cellValue = row.original[matchedItem.title] || ""
                        styleRow = matchedItem.value(cellValue)
                      }

                      const visibleCellsCount = row.getVisibleCells().length
                      const isActive = activeRowId !== null && activeRowId === row.index;
                      const activeStyle = isActive ? "bg-red-50 border-l-4 border-red-500" : "";
                      
                      return (
                        <>
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            className={`${styleRow} ${getRowClassName?.(row) || ""} ${activeStyle} ${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
                            onClick={() => {
                              if (onRowClick) {
                                onRowClick(row.index);
                              }
                            }}
                          >
                            {row.getVisibleCells().map((cell) => {
                              const cellContext = cell.getContext()
                              const columnId = cellContext.cell.column.id
                              if (!columnId.startsWith("hidden_")) {
                                const matchedItem = styleColumnList.find(
                                  (item) => item.title === columnId
                                )
                                let styleCell = "";
                                if (matchedItem) {
                                  if (matchedItem.value) {
                                    styleCell = matchedItem.value(cellValue, row.original);
                                  } else if (matchedItem.cell) {
                                    styleCell = matchedItem.cell();
                                  }
                                }
                                return (
                                  <TableCell key={cell.id} className={styleCell}>
                                    {cellContext.getValue() != null &&
                                      flexRender(cell.column.columnDef.cell, cellContext)}
                                    {(columnId === "select" ||
                                      columnId === "actions" ||
                                      columnId === "options") &&
                                      flexRender(cell.column.columnDef.cell, cellContext)}
                                  </TableCell>
                                )
                              }
                              return null
                            })}
                          </TableRow>
                          {treeList.length > 0 &&
                            treeList.map((treeItem, treeIndex) => {
                              const treeData = row.original[treeItem.title]
                              if (!treeData) return null
                              return (
                                <Fragment key={treeIndex}>
                                  {treeData.map((cell, rowIndex) => (
                                    <Fragment key={rowIndex}>
                                      {rowIndex === 0 && (
                                        <TableRowNoBorder key={`header-${rowIndex}`}>
                                          <TableCell className='flex flex-row'>
                                            <CornerDownRight className='h-4 w-4' />
                                            {`${firstUpperLetter(treeItem.title) + ": "}`}
                                          </TableCell>
                                          {Object.keys(cell).map((key, cellIndex) => {
                                            if (key !== t("id")) {
                                              return (
                                                <TableCell
                                                  key={`${rowIndex}-${cellIndex}`}
                                                  className='font-bold'
                                                >
                                                  {`${firstUpperLetter(t(key))}`}
                                                </TableCell>
                                              )
                                            }
                                            return null
                                          })}
                                          {[
                                            ...Array(visibleCellsCount - Object.keys(cell).length)
                                          ].map((_, idx) => (
                                            <TableCell key={idx} />
                                          ))}
                                        </TableRowNoBorder>
                                      )}
                                      <TableRowNoBorder key={`row-${rowIndex}`}>
                                        <TableCell />
                                        {Object.keys(cell).map((key, cellIndex) => {
                                          if (key !== t("id")) {
                                            return (
                                              <TableCell key={`${rowIndex}-${cellIndex}`}>
                                                {`${cell[key]}`}
                                              </TableCell>
                                            )
                                          }
                                          return null
                                        })}
                                        {[
                                          ...Array(visibleCellsCount - Object.keys(cell).length)
                                        ].map((_, idx) => (
                                          <TableCell key={idx} />
                                        ))}
                                      </TableRowNoBorder>
                                    </Fragment>
                                  ))}
                                </Fragment>
                              )
                            })}
                        </>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className='h-24 text-center'>
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
  )
}
