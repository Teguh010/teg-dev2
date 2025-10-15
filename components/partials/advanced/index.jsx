import { DataTable } from "./data-table";
import { DataTableVirtualized } from "./data-table-virtualized";
import { DataTableColumnHeader } from "./data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import { firstUpperLetter } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

/**
 * @param {object} props
 * @param {boolean=} props.ifSelect
 * @param {boolean=} props.ifSearch
 * @param {boolean=} props.ifHide
 * @param {boolean=} props.ifVirtualized
 * @param {boolean=} props.ifPagination
 * @param {boolean=} props.disableSorting
 * @param {any[]=} props.dataList
 * @param {any[]=} props.ignoreList
 * @param {any[]=} props.actionList
 * @param {any[]=} props.styleColumnList
 * @param {any[]=} props.searchList
 * @param {any[]=} props.styleRowList
 * @param {any[]=} props.treeList
 * @param {any=} props.pickers
 * @param {any=} props.groups
 * @param {any=} props.actions
 * @param {any=} props.totals
 * @param {any=} props.exports
 * @param {any=} props.options
 * @param {any=} props.bulk
 * @param {any=} props.label
 * @param {function=} props.onSelectedRowsChange
 * @param {function=} props.getRowClassName
 * @param {boolean=} props.optionsFirst
 * @param {any=} props.columnVisibility
 * @param {any=} props.setColumnVisibility
 * @param {number=} props.activeRowId
 * @param {function=} props.onRowClick
 */
export default function AdvancedTable({
  ifSelect = false,
  ifSearch = false,
  ifHide = false,
  ifVirtualized = false,
  ifPagination = true,
  disableSorting = false,
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
  columnVisibility,
  setColumnVisibility,
  activeRowId = null,
  onRowClick = null,
}) {
  const { t } = useTranslation();
  const generateColumns = (data) => {
    if (data.length === 0) return [];

    const allKeys = data.reduce((keys, obj) => {
      Object.keys(obj).forEach((key) => {
        if (!ignoreList.find((item) => item.title === key)) {
          keys.add(key);
        }
      });
      return keys;
    }, new Set());

    const columns = Array.from(allKeys).map((key) => {
      const actionItem = actionList.find((item) => item.title === key);
      const styleItem = styleColumnList.find((item) => item.title === key);
      let cellContent;

      if (key === "task_status") {
        cellContent = ({ row }) => {
          const value = row.getValue(key);
          let color = "default";
          if (typeof value === "string") {
            if (value.toLowerCase() === "pending") color = "warning";
            else if (value.toLowerCase() === "processing") color = "info";
            else if (value.toLowerCase() === "done") color = "success";
            else if (value.toLowerCase() === "canceled") color = "destructive";
          }
          return (
            <Badge color={color} className="capitalize">{value}</Badge>
          );
        };
      } else if (key === "priority") {
        cellContent = ({ row }) => {
          const value = row.getValue(key);
          let color = "default";
          if (typeof value === "string") {
            if (value.toLowerCase() === "low") color = "secondary";
            else if (value.toLowerCase() === "normal") color = "info";
            else if (value.toLowerCase() === "high") color = "warning";
          }
          return (
            <Badge color={color} className="capitalize">{value}</Badge>
          );
        };
      } else if (actionItem && actions) {
        cellContent = ({ row }) => (
          <div className="flex space-x-2">
            <span className="truncate font-medium">{actions(row, key)}</span>
          </div>
        );
      } else if (data.some(item => !item.isGroupHeader && typeof item[key] === "boolean")) {
        cellContent = ({ row }) => {
          const isGroupHeader = row.original?.isGroupHeader;
          
          // Don't show anything for group headers
          if (isGroupHeader) {
            return <span></span>;
          }
          
          // Check if this is a compact boolean column
          if (styleItem && styleItem.cell) {
            return (
              <div className="flex justify-left">
                {row.getValue(key) === true ? (
                  <span className="inline-block px-2 py-[1px] rounded bg-success/10 text-xs text-success font-medium">
                    {t("Yes")}
                  </span>
                ) : (
                  <span className="inline-block px-2 py-[1px] rounded bg-red-400/10 text-xs text-red-800 font-medium">
                    {t("No")}
                  </span>
                )}
              </div>
            );
          }
          
          return (
            <div className="flex space-x-2">
              {row.getValue(key) === true ? (
                <span className="inline-block px-3 py-[2px] rounded-2xl bg-success/10 text-xs text-success">
                  {t("Yes")}
                </span>
              ) : (
                <span className="inline-block px-3 py-[2px] rounded-2xl bg-red-400/10 text-xs text-red-800">
                  {t("No")}
                </span>
              )}
            </div>
          );
        };
      } else if (
        typeof data[0][key] === "string" ||
        typeof data[0][key] === "number"
      ) {
        cellContent = ({ row }) => {
          const value = row.getValue(key);
          const displayValue = value != null ? String(value) : "";
          const titleValue = value != null && value !== "" ? String(value) : undefined;
          const isGroupHeader = row.original?.isGroupHeader;
          
          // Apply conditional font weight for group headers
          const fontClass = isGroupHeader ? "font-bold" : "font-medium";
          
          // Check if this is a compact column
          if (styleItem && styleItem.cell) {
            return (
              <div className="flex justify-left">
                <span 
                  className={`text-xs ${fontClass} truncate`}
                  title={titleValue}
                >
                  {displayValue}
                </span>
              </div>
            );
          }
          
          return (
            <div className="flex space-x-2">
              <span 
                className={`max-w-[500px] truncate ${fontClass}`}
                title={titleValue}
              >
                {displayValue}
              </span>
            </div>
          );
        };
      } else {
        cellContent = ({ row }) => {
          const value = row.getValue(key);
          const displayValue = value != null ? String(value) : "";
          const titleValue = value != null && value !== "" ? String(value) : undefined;
          const isGroupHeader = row.original?.isGroupHeader;
          
          // Apply conditional font weight for group headers
          const fontClass = isGroupHeader ? "font-bold" : "font-medium";
          
          return (
            <div className="flex space-x-2">
              <span 
                className={`max-w-[500px] truncate ${fontClass}`}
                title={titleValue}
              >
                {displayValue}
              </span>
            </div>
          );
        };
      }

      return {
        accessorKey: key,
        header: ({ column }) => {
          let title;
          if (styleItem && styleItem.header) {
            title = styleItem.header();
          } else if (actionItem) {
            title = t(`general.${actionItem.title}`);
          } else if (t(`general.${key}`).startsWith('general.')) {
            title = key.split('_')
              .map(word => firstUpperLetter(word))
              .join(' ');
          } else {
            title = firstUpperLetter(t(`${key}`));
          }
          
          return (
            <DataTableColumnHeader
              column={column}
              title={title}
              className={styleItem && styleItem.headerClass ? styleItem.headerClass : ""}
              disableSorting={disableSorting}
            />
          );
        },
        cell: cellContent,
        enableSorting: !disableSorting,
        filterFn: (row, id, value) => {
          const cellValue = row.getValue(id);
          const normalize = (val) => {
            if (val === null || val === undefined) return '';
            return String(val).toLowerCase().trim();
          };
          if (Array.isArray(value)) {
            return value.some(v => normalize(v) === normalize(cellValue));
          }
          if (typeof value === 'string') {
            return normalize(cellValue).includes(normalize(value));
          }
          return normalize(cellValue) === normalize(value);
        }
      }
    })

    return columns.map(col => ({
      ...col,
      enableHiding: true,
    }));
  }
  let columns = generateColumns(dataList);

  if (options) {
    const optionsColumn = {
      id: "options",
      accessorKey: "options",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("Actions")}
          disableSorting={true}
        />
      ),
      cell: ({ row }) => options(row),
      enableSorting: false,
    };
    if (optionsFirst) {
      columns.unshift(optionsColumn);
    } else {
      columns.push(optionsColumn);
    }
  }

  if (ifSelect) {
    const selectColumn = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px] mr-4"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: true,
    };
    columns.unshift(selectColumn);
  }

  // Add actions column if actions are provided and no options column exists
  if (actions && actionList.length > 0 && !options) {
    const actionsColumn = {
      id: "actions",
      accessorKey: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("Actions")}
          disableSorting={true}
        />
      ),
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {actions(row, "actions")}
        </div>
      ),
      enableSorting: false,
    };
    columns.push(actionsColumn);
  }

  return (
    <>
      {/* {ifVirtualized ? <DataTableVirtualized
        columns={columns}
        ifSearch={ifSearch}
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
      /> : */}
      <DataTable
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
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        disableSorting={disableSorting}
        activeRowId={activeRowId}
        onRowClick={onRowClick}
      />
      {/* } */}
    </>
  );
}
