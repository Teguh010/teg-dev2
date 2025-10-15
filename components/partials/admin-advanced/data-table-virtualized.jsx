"use client";
import { useEffect, useState, useRef } from "react";
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
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from 'react-i18next';
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { firstUpperLetter } from "@/lib/utils";

export function DataTableVirtualized({
  columns,
  ifSearch,
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
  onSelectedRowsChange = undefined
}) {
  const { t } = useTranslation()
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [sorting, setSorting] = useState([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50
  })

  const table = useReactTable({
    data: dataList,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination
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
    getFacetedUniqueValues: getFacetedUniqueValues()
  })

  const tableContainerRef = useRef();

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    estimateSize: () => 33,
    getScrollElement: () => tableContainerRef.current,
    measureElement:
      typeof window !== 'undefined' &&
        navigator.userAgent.indexOf('Firefox') === -1
        ? element => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
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
          <div
            className={`rounded-md border overflow-y-auto overflow-x-auto ${!ifPagination && dataList?.length >= 1 ? 'h-[calc(100vh-150px)]' : 'h-auto'}`}
            ref={tableContainerRef}
            style={{
              overflow: 'auto', //our scrollable table container
              position: 'relative', //needed for sticky header
            }}
          >
            <Table style={{ display: 'grid' }}>
              {dataList?.length >= 1 && (
                <TableHeader className='bg-default-300 sticky z-20 top-0'>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        let styleHeader = ''
                        const matchedItem = styleColumnList.find(
                          (item) => item.title === header.getContext().header.id
                        )
                        if (matchedItem) {
                          styleHeader = matchedItem.header()
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
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
              )}
              <TableBody className='bg-white' display='grid' height={`${rowVirtualizer.getTotalSize()}px`} position='relative'>
                {rowVirtualizer.getVirtualItems().map?.length ? (
                  rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = table.getRowModel().rows[virtualRow.index];
                    let cellValue = ''
                    let styleRow = ''
                    const matchedItem = styleRowList.find((item) =>
                      row.getVisibleCells().some((cell) => cell.column.id === item.title)
                    )
                    if (matchedItem) {
                      const matchedCell = row
                        .getVisibleCells()
                        .find((cell) => cell.column.id === matchedItem.title)
                      cellValue = matchedCell?.getContext().getValue() || ''
                      styleRow = matchedItem.value(cellValue)
                    }
                    return (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                        className={styleRow}
                        data-index={virtualRow.index}
                        ref={node => rowVirtualizer.measureElement(node)}
                        style={{
                          display: 'flex',
                          position: 'absolute',
                          transform: `translateY(${virtualRow.start}px)`,
                          width: '100%',
                        }}
                      >
                        {row.getVisibleCells().map((cell) => {
                          let styleCell = ''
                          const matchedItem = styleColumnList.find(
                            (item) => item.title === cell.getContext().cell.column.id
                          )
                          if (matchedItem) {
                            styleCell = matchedItem.value(cellValue)
                          }
                          return (
                            <TableCell key={cell.id} className={styleCell}>
                              {cell.getContext().getValue() != null
                                ? flexRender(cell.column.columnDef.cell, cell.getContext())
                                : null}
                              {cell.getContext().cell.column.id === 'select' ||
                                cell.getContext().cell.column.id === 'actions' ||
                                cell.getContext().cell.column.id === 'options'
                                ? flexRender(cell.column.columnDef.cell, cell.getContext())
                                : null}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className='h-24 text-center'>
                      {firstUpperLetter(t('general.no_data'))}.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {ifPagination ? (
            <div
              className={`flex ${bulk && table.getSelectedRowModel().rows.length > 0
                ? 'flex-row justify-between'
                : 'justify-end'
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
