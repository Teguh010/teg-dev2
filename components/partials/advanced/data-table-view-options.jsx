"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { SlidersHorizontal, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, firstUpperLetter } from "@/lib/utils";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandInput,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

export function DataTableViewOptions({ table, className }) {
  const { t } = useTranslation();
  const [stateOpen, setStateOpen] = useState(false);
  const [searchColumn, setSearchColumn] = useState("");
  const [searchRow, setSearchRow] = useState("");
  const [allSelectColumn, setAllSelectColumn] = useState(true);
  const [allSelectRow, setAllSelectRow] = useState(true);
  const [filteredColumn, setFilteredColumn] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());

  const columns = useMemo(() => table.getAllColumns(), [table]);
  const rows = useMemo(() => table.getRowModel().rows, [table]);

  const filteredColumns = useMemo(() => {
    return columns.filter(
      (column) =>
        typeof column.accessorFn !== "undefined" &&
        column.getCanHide() &&
        column.id
          .toLowerCase()
          .includes(searchColumn.toLowerCase().replace(" ", "_"))
    );
  }, [searchColumn, columns]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      row.original[filteredColumn?.id]
        ?.toString()
        .toLowerCase()
        .includes(searchRow.toLowerCase())
    );
  }, [searchRow, rows, filteredColumn, table]);

  const toggleRowSelection = (row) => {
    const rowId = row.original[filteredColumn.id];
    const updatedSelectedRows = new Set(selectedRows);
    if (updatedSelectedRows.has(rowId)) {
      updatedSelectedRows.delete(rowId);
    } else {
      updatedSelectedRows.add(rowId);
    }
    setSelectedRows(updatedSelectedRows);
    
    if (filteredColumn) {
      filteredColumn.setFilterValue(updatedSelectedRows.size > 0 
        ? Array.from(updatedSelectedRows) 
        : undefined
      );
    }
  };

  const convertToCSV = (data) => {
    if (data.length > 0) {
      const array = [Object.keys(data[0])].concat(data);

      return array
        .map((row) =>
          Object.values(row)
            .map((value) =>
              typeof value === "object" ? JSON.stringify(value) : value
            )
            .join("\t")
        )
        .join("\n");
    }
  };

  const copyToClipboard = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  const handleCopy = () => {
    // Get visible columns in their current order
    const visibleColumns = table
      .getVisibleFlatColumns()
      .filter((column) => !["select", "options"].includes(column.id))
      .map((column) => column.id);

    // Get source rows (either selected rows or all rows)
    const sourceRows =
      table.getSelectedRowModel().rows.length > 0
        ? table.getSelectedRowModel().rows
        : table.getRowModel().rows;

    // Create data array with ordered columns
    const datalist = sourceRows.map((row) => {
      // Create new object with ordered columns
      return visibleColumns.reduce((newObj, columnId) => {
        newObj[columnId] = row.original.hasOwnProperty(columnId)
          ? row.original[columnId]
          : "";
        return newObj;
      }, {});
    });

    const csvData = convertToCSV(datalist);
    copyToClipboard(csvData);
    toast.success(firstUpperLetter(t("general.copy_successful")));
  };

  useEffect(() => {
    if (allSelectColumn) {
      filteredColumns.forEach((column) => {
        if (filteredColumn?.id !== column.id && !column.id.startsWith("hidden_")) {
          column.toggleVisibility(true);
        }
      });
    } else {
      columns.forEach((column) => {
        if (filteredColumn?.id !== column.id && !column.id.startsWith("hidden_")) {
          column.toggleVisibility(false);
        }
      });
    }
  }, [allSelectColumn, filteredColumn]);

  useEffect(() => {
    if (filteredColumn) {
      const updatedSelectedRows = new Set(
        allSelectRow
          ? filteredRows.map((row) => row.original[filteredColumn.id])
          : []
      );
      setSelectedRows(updatedSelectedRows);
      
      filteredColumn.setFilterValue(allSelectRow 
        ? undefined 
        : Array.from(updatedSelectedRows)
      );
    }
  }, [allSelectRow, filteredColumn, rows]);

  useEffect(() => {
    const validColumns = columns.filter(
      (col) => !["select", "options"].includes(col.id)
    );
    
    if (validColumns.length > 0 && !filteredColumn) {
      const initialColumn = validColumns[0];
      setFilteredColumn(initialColumn);
      
      // initialize selectedRows without setting the filter global
      const initialSelectedRows = new Set(
        rows.map((row) => row.original[initialColumn.id])
      );
      setSelectedRows(initialSelectedRows);
    }
  }, [columns, rows]);

  const formatCellValue = (value) => {
    if (value === null || value === undefined) return "-";
    const stringValue = String(value);
    return (
      firstUpperLetter(stringValue)?.replace("<br />", " - ") || stringValue
    );
  };

  return (
    <div className="flex flex-row gap-2">
      <div className={cn("grid", className)}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 capitalize"
              onClick={() => setStateOpen(!stateOpen)}
              onAuxClick={() => setStateOpen(!stateOpen)}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              {t("general.view")}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[90%] md:w-auto p-0 flex flex-col"
            align="end"
          >
            <Tabs defaultValue="columns">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="columns">
                  {firstUpperLetter(t("general.columns"))}
                </TabsTrigger>
                <TabsTrigger value="rows">
                  {firstUpperLetter(t("general.rows"))}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="columns">
                <Command>
                  <div className="flex flex-row">
                    <div
                      onClick={() => setAllSelectColumn(!allSelectColumn)}
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary self-center ml-6",
                        allSelectColumn
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <CommandInput
                      placeholder={t("general.column")}
                      value={searchColumn}
                      onValueChange={setSearchColumn}
                    />
                  </div>
                  <CommandSeparator />
                  <CommandList>
                    <div
                      className={
                        "grid grid-cols-1 lg:grid-cols-3 m-4 overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
                      }
                    >
                      {filteredColumns.map((column) => {
                        if (!column.id.startsWith("hidden_")) {
                          return (
                            <div
                              className={
                                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-default-200 aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                              }
                              key={column.id}
                              onClick={() =>
                                filteredColumn?.id !== column.id &&
                                column.toggleVisibility(!column.getIsVisible())
                              }
                            >
                              <div
                                className={cn(
                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                  column.getIsVisible()
                                    ? "bg-primary text-primary-foreground"
                                    : "opacity-50 [&_svg]:invisible"
                                )}
                              >
                                <Check className="h-4 w-4" />
                              </div>
                              <span>{firstUpperLetter(column.id)}</span>
                            </div>
                          );
                        }
                      })}
                    </div>
                    <CommandGroup>
                      <div className="grid-cols-1 lg:grid-cols-3 m-4 hidden">
                        {filteredColumns.map((column) => {
                          if (!column.id.startsWith("hidden_")) {
                            return (
                              <CommandItem
                                key={column.id}
                                onSelect={() =>
                                  column.toggleVisibility(!column.getIsVisible())
                                }
                                disabled={filteredColumn?.id === column.id}
                              >
                                <div
                                  className={cn(
                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                    column.getIsVisible()
                                      ? "bg-primary text-primary-foreground"
                                      : "opacity-50 [&_svg]:invisible"
                                  )}
                                >
                                  <Check className="h-4 w-4" />
                                </div>
                                <span>{firstUpperLetter(column.id)}</span>
                              </CommandItem>
                            );
                          }
                        })}
                      </div>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </TabsContent>
              <TabsContent value="rows">
                <Command>
                  <div className="flex flex-row">
                    <div
                      onClick={() => setAllSelectRow(!allSelectRow)}
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary self-center ml-6",
                        allSelectRow
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <CommandInput
                      placeholder={t("general.row")}
                      value={searchRow}
                      onValueChange={setSearchRow}
                    />
                  </div>
                  <CommandSeparator />
                  <CommandList>
                    <div className="grid grid-cols-1 lg:grid-cols-3 m-4">
                      {filteredRows.map((row) => (
                        <div
                          key={row.id}
                          className={
                            "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-default-200 aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                          }
                          onClick={() => toggleRowSelection(row)}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              selectedRows.has(row.original[filteredColumn.id])
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}
                          >
                            <Check className="h-4 w-4" />
                          </div>
                          <span>
                            {row.index + 1}:{" "}
                            {formatCellValue(row.original[filteredColumn.id])}
                          </span>
                        </div>
                      ))}
                    </div>
                    <CommandGroup>
                      <div className="grid grid-cols-1 lg:grid-cols-3 m-4">
                        {filteredRows.map((row) => (
                          <CommandItem
                            key={row.id}
                            onSelect={() => toggleRowSelection(row)}
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                selectedRows.has(
                                  row.original[filteredColumn.id]
                                )
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )}
                            >
                              <Check className="h-4 w-4" />
                            </div>
                            <span>
                              {row.index + 1}:{" "}
                              {formatCellValue(row.original[filteredColumn.id])}
                            </span>
                          </CommandItem>
                        ))}
                      </div>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </TabsContent>
            </Tabs>
            <div className="flex flex-row w-full justify-end gap-1 p-2">
              <PopoverClose asChild>
                <Button
                  className="justify-center text-center capitalize"
                  variant="outline"
                  color="dark"
                  size="xxs"
                >
                  {t("general.close")}
                </Button>
              </PopoverClose>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <Button
        variant="outline"
        className="h-8 w-auto px-2"
        onClick={handleCopy}
      >
        <span>{firstUpperLetter(t("general.copy_all"))}</span>
      </Button>
    </div>
  );
}
