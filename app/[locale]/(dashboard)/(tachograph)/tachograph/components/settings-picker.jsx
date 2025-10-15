"use client";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";
import { useTranslation } from 'react-i18next';
import { firstUpperLetter } from "@/lib/utils";

export default function SettingsPickers({
  className = undefined,
  reportType,
  reportTypeList,
  setReportType,
  dataSource,
  dataSourceList,
  setDataSource,
  penalties,
  penaltiesList,
  setPenalties,
  cultures,
  culturesList,
  setCultures,
  timeZone,
  timeZoneList,
  setTimeZone,
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
            <span>{firstUpperLetter(t('general.settings'))}</span>
            {/*    <Separator orientation="vertical" className="mx-2 h-4" />
            {reportType && <Badge
              color="secondary"
              className="rounded-sm px-1 font-normal"
            >
              {t('general.report_type') + ": " + t(reportType)}
            </Badge>}
            {dataSource && <Badge
              color="secondary"
              className="rounded-sm px-1 font-normal ml-2"
            >
              {t('general.data_source') + ": " + t(dataSource)}
            </Badge>}
            {penalties && <Badge
              color="secondary"
              className="rounded-sm px-1 font-normal ml-2"
            >
              {t('general.penalties') + ": " + t(penalties)}
            </Badge>}
            {cultures && <Badge
              color="secondary"
              className="rounded-sm px-1 font-normal ml-2"
            >
              {t('general.cultures') + ": " + t(cultures)}
            </Badge>}
            {timeZone && <Badge
              color="secondary"
              className="rounded-sm px-1 font-normal ml-2"
            >
              {t('general.time_zone') + ": " + t(timeZone)}
            </Badge>} */}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[90%] md:w-auto py-4" align="center">
          <div className="flex flex-row space-x-4">
            <div className="space-y-4">
              {reportTypeList.length > 0 &&
                <div>
                  <Label className="mb-3">
                    {firstUpperLetter(t('general.report_type'))}
                  </Label>
                  <Select value={reportType} onValueChange={(value) => (setReportType(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder={firstUpperLetter(t('general.please_select'))} />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypeList.map((reportType, index) => {
                        return (
                          <SelectItem
                            value={reportType.title}
                            key={index}
                          >
                            {firstUpperLetter(t('(' + reportType.title + '): ' + reportType.value).slice(0, 50))}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              }
              {dataSourceList.length > 0 &&
                <div>
                  <Label className="mb-3">
                    {firstUpperLetter(t('general.data_source'))}
                  </Label>
                  <Select value={dataSource} onValueChange={(value) => (setDataSource(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder={firstUpperLetter(t('general.please_select'))} />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSourceList.map((dataSource, index) => {
                        return (
                          <SelectItem
                            value={dataSource.title}
                            key={index}
                          >
                            {firstUpperLetter(t('(' + dataSource.title + '): ' + dataSource.value).slice(0, 50))}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              }
              {penaltiesList.length > 0 &&
                <div>
                  <Label className="mb-3">
                    {firstUpperLetter(t('general.penalties'))}
                  </Label>
                  <Select value={penalties} onValueChange={(value) => (setPenalties(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder={firstUpperLetter(t('general.please_select'))} />
                    </SelectTrigger>
                    <SelectContent>
                      {penaltiesList.map((penalties, index) => {
                        return (
                          <SelectItem
                            value={penalties.title}
                            key={index}
                          >
                            {firstUpperLetter(t('(' + penalties.title + '): ' + penalties.value).slice(0, 50))}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              }
              {culturesList.length > 0 &&
                <div>
                  <Label className="mb-3">
                    {firstUpperLetter(t('general.cultures'))}
                  </Label>
                  <Select value={cultures} onValueChange={(value) => (setCultures(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder={firstUpperLetter(t('general.please_select'))} />
                    </SelectTrigger>
                    <SelectContent>
                      {culturesList.map((cultures, index) => {
                        return (
                          <SelectItem
                            value={cultures.title}
                            key={index}
                          >
                            {firstUpperLetter(t('(' + cultures.title + '): ' + cultures.value).slice(0, 50))}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              }
              {timeZoneList.length > 0 &&
                <div>
                  <Label className="mb-3">
                    {firstUpperLetter(t('general.time_zone'))}
                  </Label>
                  <Select value={timeZone} onValueChange={(value) => (setTimeZone(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder={firstUpperLetter(t('general.please_select'))} />
                    </SelectTrigger>
                    <SelectContent>
                      {timeZoneList.map((timeZone, index) => {
                        return (
                          <SelectItem
                            value={timeZone.title}
                            key={index}
                          >
                            {firstUpperLetter(t('(' + timeZone.title + '): ' + timeZone.value).slice(0, 50))}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              }
            </div>
          </div>
          <Separator orientation="horizontal" className="mt-4" />
          <div className="flex flex-row w-full justify-end gap-1 p-2">
            <PopoverClose asChild>
              <Button
                className="justify-center text-center capitalize"
                variant="outline"
                color="dark"
                size="xxs"
              >
                {t('general.close')}
              </Button>
            </PopoverClose>
          </div>
        </PopoverContent >
      </Popover >
    </div >
  );
}
