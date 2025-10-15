"use client";
import { useState, useEffect } from "react";
import { Check } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SettingsPicker({ className = null, datatypeList, ioIdsFilter, setIoIdsFilter, numberRows, setNumberRows, setGenerate }) {
  const { t } = useTranslation();
  const [stateOpen, setStateOpen] = useState(false);
  const [searchColumn, setSearchColumn] = useState("");
  const [searchRow, setSearchRow] = useState("");
  const [allSelectColumn, setAllSelectColumn] = useState(false);
  const rows = [50, 100, 200, 400, 1000]

  useEffect(() => {
    if (allSelectColumn) {
      setIoIdsFilter(datatypeList.map(item => item.id));
    } else {
      setIoIdsFilter([]);
    }
  }, [allSelectColumn]);

  return (
    <div className={cn('grid', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            className='h-8'
            onClick={() => setStateOpen(!stateOpen)}
            onAuxClick={() => setStateOpen(!stateOpen)}
          >
            <span>{firstUpperLetter(t('general.settings'))}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0 flex flex-col' align='end'>
          <Tabs defaultValue='more'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='more'>{firstUpperLetter(t('general.more'))}</TabsTrigger>
              <TabsTrigger value='columns'>{firstUpperLetter(t('columns'))}</TabsTrigger>
            </TabsList>
            <TabsContent className='w-auto p-4' align='center' value='more'>
              <div className='flex flex-row space-x-4'>
                <div className='space-y-4'>
                  <div>
                    <Label className='mb-3'>{firstUpperLetter(t('general.number_of_rows'))}</Label>
                    <Select
                      value={numberRows}
                      onValueChange={(value) => {
                        const rows = Number(value)
                        setNumberRows(rows)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={firstUpperLetter(t('general.please_select'))} />
                      </SelectTrigger>
                      <SelectContent>
                        {rows.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                        <SelectItem value={9999999}>
                          All
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value='columns'>
              <Command>
                <div className='flex flex-row'>
                  <div
                    onClick={() => setAllSelectColumn(!allSelectColumn)}
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary self-center ml-6',
                      allSelectColumn
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible'
                    )}
                  >
                    <Check className='h-4 w-4' />
                  </div>
                  <CommandInput
                    placeholder={t('column')}
                    value={searchColumn}
                    onValueChange={setSearchColumn}
                  />
                </div>
                <CommandSeparator />
                <CommandList>
                  <CommandEmpty>{firstUpperLetter(t('general.no_results_found'))}.</CommandEmpty>
                  <CommandGroup>
                    <div className='grid grid-cols-1 md:grid-cols-3 m-4'>
                      {datatypeList.map((column) => (
                        <CommandItem
                          key={column.id}
                          onSelect={() => {
                            if (ioIdsFilter.includes(column.id)) {
                              setIoIdsFilter(ioIdsFilter.filter((id) => id !== column.id))
                            } else {
                              setIoIdsFilter([...ioIdsFilter, column.id])
                            }
                          }}
                        >
                          <div
                            className={cn(
                              'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                              ioIdsFilter.includes(column.id)
                                ? 'bg-primary text-primary-foreground'
                                : 'opacity-50 [&_svg]:invisible'
                            )}
                          >
                            <Check className='h-4 w-4' />
                          </div>
                          <span>{firstUpperLetter(column.name)}</span>
                        </CommandItem>
                      ))}
                    </div>
                  </CommandGroup>
                </CommandList>
              </Command>
            </TabsContent>
          </Tabs>
          <div className='flex flex-row w-full justify-end gap-1 p-2'>
            <PopoverClose asChild>
              <Button
                className='justify-center text-center capitalize'
                variant='outline'
                color='dark'
                size='xxs'
              >
                {t('general.close')}
              </Button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
