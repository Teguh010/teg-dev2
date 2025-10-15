import { useEffect, useState } from "react"
import { DataTable } from "./data-table"
import { DataTableWindowed } from "./data-table-windowed"
import { DataTableColumnHeader } from "./data-table-column-header"
import { Checkbox } from "@/components/ui/checkbox"
import { firstUpperLetter } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function AdvancedTable({
  ifSelect = false,
  ifSearch = false,
  ifHide = false,
  ifVirtualized = false,
  ifPagination = true,
  dataList = [],
  ignoreList = [],
  actionList = [],
  styleColumnList = [],
  searchList = [],
  styleRowList = [],
  treeList = [],
  pickers = null,
  groups = null,
  actions = null,
  totals = null,
  exports = null,
  options = null,
  bulk = null,
  label = null,
  onSelectedRowsChange = undefined,
  getRowClassName = undefined,
  optionsFirst = false,
  loading = false,
  selectedRowIds = undefined, // array of id
  activeRowId = undefined, // <-- tambahkan prop baru
  onRowClick = undefined, // <-- tambahkan prop baru untuk row click handler
  hideViewOptions = false, // <-- prop baru
  tableHeight = null, // <-- prop baru untuk mengatur tinggi table
  columnVisibility = undefined, // <-- prop untuk column visibility
  setColumnVisibility = undefined, // <-- prop untuk column visibility change handler
  initialState = {}, // <-- prop untuk initial state
  orderListData = [] // <-- prop untuk menentukan urutan kolom
}) {
  const { t } = useTranslation()
  const { toast } = useToast()
  
  const generateColumns = (data) => {
    if (data.length === 0) return []

    const allKeys = data.reduce((keys, obj) => {
      Object.keys(obj).forEach((key) => {
        if (!ignoreList.find((item) => item.title === key)) {
          keys.add(key)
        }
      })
      return keys
    }, new Set())

    // Use orderListData to determine column order if available
    const orderedKeys = orderListData && orderListData.length > 0 
      ? orderListData
          .map(item => item.title.replace('general.', '')) // Remove 'general.' prefix
          .filter(key => allKeys.has(key))
          .concat(Array.from(allKeys).filter(key => !orderListData.some(item => item.title.replace('general.', '') === key)))
      : Array.from(allKeys)

    const columns = orderedKeys.map((key) => {
      const actionItem = actionList.find((item) => item.title === t(`general.${key}`))
      let cellContent

      if (actionList.some((item) => item.title === t(`general.${key}`)) && actions) {
        cellContent = ({ row }) => (
          <div className='flex space-x-1'>
            <span className='truncate font-medium'>{actions(row, t(`general.${key}`))}</span>
          </div>
        )
      } else if (typeof data[0][key] === "boolean") {
        cellContent = ({ row }) => (
          <div className='flex space-x-1'>
            {row.getValue(key) === true ? (
              <span className='inline-block px-2 py-[1px] rounded-2xl bg-success/10 text-xs text-success'>
                {t("Yes")}
              </span>
            ) : (
              <span className='inline-block px-2 py-[1px] rounded-2xl bg-red-400/10 text-xs text-red-800'>
                {t("No")}
              </span>
            )}
          </div>
        )
      } else if (typeof data[0][key] === "string" || typeof data[0][key] === "number") {
        // Check if this is a clickable column (time_from or lat_lon)
        const isClickable = key === 'time_from' || key === 'lat_lon';
        // Check if this is address column for text wrapping
        const isAddress = key === 'address';
        
        cellContent = ({ row }) => {
          const handleClick = () => {
            if (isClickable) {
              const value = String(row.getValue(key));
              navigator.clipboard.writeText(value).then(() => {
                toast({
                  title: firstUpperLetter(t('Copied to clipboard')),
                  description: value,
                  duration: 2000,
                });
              }).catch(err => {
                console.error('Failed to copy: ', err);
                toast({
                  title: firstUpperLetter(t('Copy failed')),
                  variant: "destructive",
                });
              });
            }
          };

          return (
            <div className={isAddress ? 'w-full' : 'flex space-x-1'}>
              <span 
                className={`font-medium ${isAddress ? 'w-full break-words whitespace-normal leading-tight' : 'max-w-[500px] truncate'} ${isClickable ? 'cursor-pointer hover:bg-blue-50 hover:text-blue-600 px-1 py-0.5 rounded transition-colors select-all' : ''}`}
                title={isClickable ? `${firstUpperLetter(t('general.click_to_copy'))}: ${row.getValue(key)}` : row.getValue(key)}
                onClick={handleClick}
              >
                {row.getValue(key)}
              </span>
            </div>
          );
        };
      } else {
        cellContent = ({ row }) => (
          <div className='flex space-x-1'>
            <span className='max-w-[500px] truncate font-medium' title={String(row.getValue(key))}>
{String(row.getValue(key))}
            </span>
          </div>
        )
      }

      return {
        accessorKey: key,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={
              actionItem
                ? key === "time_from"
                  ? "Time"
                  : firstUpperLetter(t(`${actionItem.title}`))
                : firstUpperLetter(t(`general.${key}`))
            }
          />
        ),
        cell: cellContent,
        // Add specific styling for address column
        ...(key === "address" && {
          size: 200, // Fixed width in pixels - increased for better wrapping
          minSize: 200,
          maxSize: 200
        })
      }
    })

    return columns
  }
  let columns = generateColumns(dataList)

  if (options) {
    const optionsColumn = {
      id: "options",
      cell: ({ row }) => options(row)
    }
    if (optionsFirst) {
      columns.unshift(optionsColumn)
    } else {
      columns.push(optionsColumn)
    }
  }

  if (ifSelect) {
    const selectColumn = {
      id: "select",
      header: ({ table }) => {
        // Use local state for immediate visual feedback
        const [isChecked, setIsChecked] = useState(table.getIsAllPageRowsSelected())
        const [isIndeterminate, setIsIndeterminate] = useState(table.getIsSomePageRowsSelected())

        // Sync local state with table only if changed from outside
        useEffect(() => {
          setIsChecked(table.getIsAllPageRowsSelected())
          setIsIndeterminate(table.getIsSomePageRowsSelected())
        }, [table.getState().rowSelection])

        const handleChange = (value) => {
          // Update UI immediately
          const newValue = !!value
          setIsChecked(newValue)
          setIsIndeterminate(false)
          // Update table state in background
          setTimeout(() => table.toggleAllPageRowsSelected(newValue), 0)
        }

        return (
          <Checkbox
            checked={isChecked || (isIndeterminate ? "indeterminate" : false)}
            onCheckedChange={handleChange}
            aria-label='Select all'
            className='translate-y-[1px] mr-2'
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click when checkbox is clicked
            }}
          />
        )
      },
      cell: ({ row, table }) => {
        // Use local state for immediate visual feedback
        const [isChecked, setIsChecked] = useState(row.getIsSelected())

        // Sync local state with row only if changed from outside
        useEffect(() => {
          setIsChecked(row.getIsSelected())
        }, [row.getIsSelected()])

        const handleChange = (value) => {
          // Update UI immediately
          const newValue = !!value
          setIsChecked(newValue)
          // Update row selection in background
          setTimeout(() => row.toggleSelected(newValue), 0)
        }

        return (
          <Checkbox
            checked={isChecked}
            onCheckedChange={handleChange}
            aria-label='Select row'
            className='translate-y-[1px]'
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click when checkbox is clicked
            }}
          />
        )
      },
      enableSorting: true,
      enableHiding: true
    }
    columns.unshift(selectColumn)
  }

  // Show loading state
  if (loading) {
    return (
      <div className='relative'>
        <div className='inset-0 bg-white flex items-center justify-center z-10 min-h-[150px]'>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
        </div>
      </div>
    )
  }

  return (
    <>
      <DataTableWindowed
        columns={columns}
        ifSearch={ifSearch}
        ifHide={ifHide}
        dataList={dataList}
        styleColumnList={styleColumnList}
        searchList={searchList}
        pickers={pickers}
        exports={exports}
        groups={groups}
        totals={totals}
        bulk={bulk}
        ifSelect={ifSelect}
        ifPagination={ifPagination}
        styleRowList={styleRowList}
        onSelectedRowsChange={onSelectedRowsChange}
        getRowClassName={getRowClassName}
        label={label}
        treeList={treeList}
        selectedRowIds={selectedRowIds}
        activeRowId={activeRowId} // <-- oper ke DataTableWindowed
        onRowClick={onRowClick} // <-- oper ke DataTableWindowed
        hideViewOptions={hideViewOptions} // <-- oper ke DataTableWindowed
        tableHeight={tableHeight} // <-- oper ke DataTableWindowed
        columnVisibility={columnVisibility} // <-- oper ke DataTableWindowed
        setColumnVisibility={setColumnVisibility} // <-- oper ke DataTableWindowed
        initialState={initialState} // <-- oper ke DataTableWindowed
        orderListData={orderListData} // <-- oper ke DataTableWindowed
      />
    </>
  )
}
