"use client"
import { useEffect, useState, useRef, useCallback, useMemo } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import OptimizedTableCell from "./optimized-table-cell"
import { useTablePerformance } from "@/hooks/use-table-performance"

export function DataTableWindowed({
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
  activeRowId, // <-- tambahkan prop baru
  onRowClick, // <-- tambahkan prop baru untuk row click handler
  hideViewOptions = false, // <-- prop baru
  tableHeight = null, // <-- prop baru untuk mengatur tinggi table
  columnVisibility: columnVisibilityProp, // <-- prop untuk external column visibility
  setColumnVisibility: setColumnVisibilityProp, // <-- prop untuk column visibility change handler
  initialState = {}, // <-- prop untuk initial state
  orderListData = [] // <-- prop untuk menentukan urutan kolom
}) {
  const { t } = useTranslation()
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibilityState, setColumnVisibilityState] = useState(initialState.columnVisibility || {})
  const columnVisibility = columnVisibilityProp !== undefined ? columnVisibilityProp : columnVisibilityState;
  const setColumnVisibility = setColumnVisibilityProp !== undefined ? setColumnVisibilityProp : setColumnVisibilityState;

  // Set initial column visibility when table is created
  const hasSetInitialVisibility = useRef(false);
  
  useEffect(() => {
    // Reset flag when initialState changes (e.g., report type changes)
    hasSetInitialVisibility.current = false;
  }, [initialState]);
  
  // Create a stable key from columnVisibility object
  const columnVisibilityKey = useMemo(() => {
    return initialState.columnVisibility ? JSON.stringify(initialState.columnVisibility) : '';
  }, [initialState.columnVisibility]);

  useEffect(() => {
    
    if (initialState.columnVisibility && 
        Object.keys(initialState.columnVisibility).length > 0 && 
        !hasSetInitialVisibility.current) {
      setColumnVisibilityState(initialState.columnVisibility);
      hasSetInitialVisibility.current = true;
    }
  }, [columnVisibilityKey, initialState.columnVisibility]);
  const [columnFilters, setColumnFilters] = useState([])
  const [sorting, setSorting] = useState([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50
  })

  // Windowed rendering state
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 100 })
  const tableContainerRef = useRef()

  // Performance optimizations
  const { getRowStyle, getColumnStyle, debouncedRowSelection } = useTablePerformance(
    dataList,
    styleRowList,
    styleColumnList
  )

  const table = useReactTable({
    data: dataList,
    columns,
    initialState: {
      columnVisibility: initialState.columnVisibility || {},
      ...initialState
    },
    state: {
      sorting,
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
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues()
  })

  // Create flattened rows including tree data
  const getFlattenedRows = useCallback(() => {
    const rows = []
    table.getRowModel().rows.forEach((row, index) => {
      rows.push({ type: "main", row, index })

      // Add tree data if exists
      if (treeList.length > 0) {
        treeList.forEach((treeItem) => {
          const treeData = row.original[treeItem.title]
          if (treeData) {
            treeData.forEach((cell, treeIndex) => {
              rows.push({
                type: "tree",
                row,
                treeData: cell,
                treeItem,
                treeIndex,
                parentIndex: index
              })
            })
          }
        })
      }
    })
    return rows
  }, [table, treeList])

  const flattenedRows = getFlattenedRows()

  // Calculate visible rows based on scroll position
  const calculateVisibleRange = useCallback(() => {
    if (!tableContainerRef.current) return { start: 0, end: 100 }

    const container = tableContainerRef.current
    const scrollTop = container.scrollTop
    const containerHeight = container.clientHeight
    const rowHeight = 40 // Estimated row height

    const start = Math.floor(scrollTop / rowHeight)
    const visibleCount = Math.ceil(containerHeight / rowHeight)
    const end = Math.min(start + visibleCount + 20, flattenedRows.length) // Add buffer

    return { start: Math.max(0, start - 10), end } // Add buffer at start
  }, [flattenedRows.length])

  // Handle scroll to update visible range
  const handleScroll = useCallback(() => {
    const newRange = calculateVisibleRange()
    setVisibleRange(newRange)
  }, [calculateVisibleRange])

  useEffect(() => {
    const container = tableContainerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  useEffect(() => {
    if (ifPagination === false) {
      table.setPageSize(100000)
    }
  }, [])

  // Debounced row selection change for the callback only
  const debouncedOnSelectedRowsChange = useCallback(
    debouncedRowSelection((selectedData) => {
      if (onSelectedRowsChange) {
        onSelectedRowsChange(selectedData)
      }
    }, 150), // Debounce for the callback
    [onSelectedRowsChange, debouncedRowSelection]
  )

  // Handle row selection with immediate UI update
  const handleRowSelection = useCallback(
    (updater) => {
      // Update the UI immediately
      setRowSelection((prev) => {
        const newSelection = typeof updater === "function" ? updater(prev) : updater

        // Get the selected data and call the debounced callback
        const selectedData = Object.keys(newSelection)
          .filter((id) => newSelection[id])
          .map((id) => table.getRow(id).original)

        debouncedOnSelectedRowsChange(selectedData)

        return newSelection
      })
    },
    [debouncedOnSelectedRowsChange, table]
  )

  // Update the table instance to use our custom row selection handler
  table.options.onRowSelectionChange = handleRowSelection

  const rowRefs = useRef({}) // simpan ref untuk setiap row utama

  useEffect(() => {
    if (activeRowId === undefined || activeRowId === null) return
    if (!dataList || dataList.length === 0) return
    if (!tableContainerRef.current) return
    // Find the index of the active row
    const rowIndex = dataList.findIndex((row) => row.id === activeRowId)
    if (rowIndex === -1) {
      return
    }
    // Calculate scroll position to center the row
    const container = tableContainerRef.current
    const rowHeight = 40 // Must match estimated row height
    const containerHeight = container.clientHeight
    const targetScroll = rowIndex * rowHeight - containerHeight / 2 + rowHeight / 2
    container.scrollTo({ top: targetScroll, behavior: "smooth" })
    // eslint-disable-next-line
  }, [activeRowId, dataList])

  const renderRow = useCallback(
    (rowIndex) => {
      const item = flattenedRows[rowIndex]
      if (!item) return null

      if (item.type === "main") {
        const row = item.row
        const styleRow = getRowStyle(item.index)
        const isActive = activeRowId !== undefined && row.original.id === activeRowId
        return (
          <TableRow
            key={row.id}
            ref={(el) => {
              if (el && row.original.id !== undefined) rowRefs.current[row.original.id] = el
            }}
            data-state={row.getIsSelected() && "selected"}
            className={`${styleRow} ${getRowClassName?.(row) || ""} ${
              isActive ? "border-2 border-red-500" : ""
            } cursor-pointer hover:bg-gray-50`}
            onClick={() => {
              // Handle row click - set active row and trigger map zoom
              if (onRowClick) {
                onRowClick(row.original.id)
              }
            }}
          >
            {row.getVisibleCells().map((cell) => {
              const cellContext = cell.getContext()
              const columnId = cellContext.cell.column.id
              if (!columnId.startsWith("hidden_")) {
                const styleCell = getColumnStyle(columnId, cellContext.getValue(), row.original)
                return (
                  <OptimizedTableCell
                    key={cell.id}
                    cell={cell}
                    styleCell={styleCell}
                    columnId={columnId}
                  />
                )
              }
              return null
            })}
          </TableRow>
        )
      } else if (item.type === "tree") {
        const { treeData, treeItem, treeIndex, parentIndex } = item
        const visibleCellsCount =
          table.getRowModel().rows[parentIndex]?.getVisibleCells().length || 0

        if (treeIndex === 0) {
          // Header row for tree data
          return (
            <TableRowNoBorder key={`tree-header-${parentIndex}-${treeIndex}`}>
              <TableCell className='flex flex-row'>
                <CornerDownRight className='h-4 w-4' />
                {`${firstUpperLetter(treeItem.title) + ": "}`}
              </TableCell>
              {Object.keys(treeData).map((key, cellIndex) => {
                if (key !== t("id")) {
                  return (
                    <TableCell key={`${parentIndex}-${cellIndex}`} className='font-bold'>
                      {`${firstUpperLetter(t(key))}`}
                    </TableCell>
                  )
                }
                return null
              })}
              {[...Array(visibleCellsCount - Object.keys(treeData).length)].map((_, idx) => (
                <TableCell key={idx} />
              ))}
            </TableRowNoBorder>
          )
        } else {
          // Data row for tree data
          return (
            <TableRowNoBorder key={`tree-data-${parentIndex}-${treeIndex}`}>
              <TableCell />
              {Object.keys(treeData).map((key, cellIndex) => {
                if (key !== t("id")) {
                  return (
                    <TableCell key={`${parentIndex}-${cellIndex}`}>{`${treeData[key]}`}</TableCell>
                  )
                }
                return null
              })}
              {[...Array(visibleCellsCount - Object.keys(treeData).length)].map((_, idx) => (
                <TableCell key={idx} />
              ))}
            </TableRowNoBorder>
          )
        }
      }
    },
    [flattenedRows, getRowStyle, getColumnStyle, getRowClassName, table, treeList, t, activeRowId]
  )

  // Get visible rows
  const visibleRows = flattenedRows.slice(visibleRange.start, visibleRange.end)

  // Calculate visible columns count once
  const visibleColumnsCount = table.getAllColumns().filter((col) => col.getIsVisible()).length

  return (
    <div className='space-y-2'>
      <DataTableToolbar
        table={table}
        ifSearch={ifSearch}
        searchList={searchList}
        exports={exports}
        pickers={pickers}
        groups={groups}
        bulk={bulk}
        hideViewOptions={hideViewOptions}
      />
      {totals && totals()}
      {!ifHide && (
        <>
          {label && (
            <div>
              <Label className='font-normal'>{firstUpperLetter(t(label))}</Label>
            </div>
          )}
          <div className='rounded-md border'>
            {!dataList || dataList.length === 0 ? (
              <div className='text-center text-gray-400 py-8 bg-white'>No data</div>
            ) : (
              <div
                ref={tableContainerRef}
                className={`overflow-auto ${
                  tableHeight 
                    ? tableHeight // Gunakan tableHeight sebagai class Tailwind
                    : !ifPagination && dataList?.length > 1
                      ?
                        typeof window !== "undefined" && window.innerWidth < 1024 && window.matchMedia("(orientation: landscape)").matches
                          ? "h-[calc(100vh-40px)]" // mobile landscape: lebih tinggi
                          : "h-[calc(100vh-200px)]" // default
                      : "h-auto"
                }`}
              >
                <Table>
                  {/* Sticky Header */}
                  <TableHeader className='bg-default-300 sticky top-0 z-20'>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          if (!header.getContext().header.id.startsWith("hidden_")) {
                            let styleHeader = ""
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
                          }
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>

                  {/* Windowed Body */}
                  <TableBody className='bg-white'>
                    {/* Top spacer */}
                    {visibleRange.start > 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={visibleColumnsCount}
                          style={{ height: `${visibleRange.start * 40}px` }}
                        />
                      </TableRow>
                    )}

                    {/* Visible rows */}
                    {visibleRows.map((_, index) => renderRow(visibleRange.start + index))}

                    {/* Bottom spacer */}
                    {visibleRange.end < flattenedRows.length && (
                      <TableRow>
                        <TableCell
                          colSpan={visibleColumnsCount}
                          style={{ height: `${(flattenedRows.length - visibleRange.end) * 40}px` }}
                        />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
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
      )}
    </div>
  )
}
