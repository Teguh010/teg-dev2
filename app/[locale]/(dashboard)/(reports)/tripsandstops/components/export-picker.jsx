"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from 'react-i18next';
import { cn, firstUpperLetter } from "@/lib/utils";
import TimePicker from "react-time-picker";

export function ExportPicker({
  className = undefined,
  exportReportPDF,
  exportReportCSV,
  table,
  dataObjectTripStopTotals
}) {
  const { t } = useTranslation();

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
          >
            <span>{firstUpperLetter(t('export'))}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[90%] md:w-auto py-4" align="center">
          <div className="flex flex-row space-x-4">
            <div className="space-y-4">
              <Button
                variant="outline"
                color="destructive"
                size="sm"
                className="h-8"
                disabled={table?.getRowModel().rows.length <= 0}
                onClick={() => (exportReportPDF(table, Object.keys(dataObjectTripStopTotals).length > 0 ? dataObjectTripStopTotals : null))}
              >
                <span className='capitalize'>{t('trips_and_stops.export_pdf')}</span>
              </Button>
            </div>
            <div className="space-y-4">
              <Button
                variant="outline"
                color="success"
                size="sm"
                className="h-8"
                disabled={table?.getRowModel().rows.length <= 0}
                onClick={() => (exportReportCSV(table, Object.keys(dataObjectTripStopTotals).length > 0 ? dataObjectTripStopTotals : null))}
              >
                <span className='capitalize'>{t('trips_and_stops.export_csv')}</span>
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div >
  );
}
