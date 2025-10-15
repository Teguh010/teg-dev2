"use client";
import React, { useState, useRef } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { firstUpperLetter } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import 'react-accessible-shuttle/css/shuttle.css';

const DataTableRowOptions = ({ row, getDriverReport, setGetDriverReport, statusActive, setStatusActive }) => {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <Button
          variant="ghost"
          size="sm"
          className="capitalize w-full"
          disabled={getDriverReport.value}
          onClick={() => setGetDriverReport({ value: true, rowId: row.original[t('general.Id')] })}
        >
          <span>{firstUpperLetter(t('general.get_pdf_report'))}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="capitalize w-full"
          disabled={statusActive.value}
          onClick={() => setStatusActive({ value: true, rowId: row.original[t('general.Id')], status: row.original[t('general.Active')] })}
        >
          <span>{row.original[t('general.Active')] ? firstUpperLetter(t('general.deactivate')) : firstUpperLetter(t('general.activate'))}</span>
        </Button>

        {/* <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={setDeleteIsDialogOpen}
        >
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="capitalize w-full"
            >
              <span>{firstUpperLetter(t('general.get_pdf_report'))}</span>
            </Button>
          </DialogTrigger>
          <DialogContent ref={dialogDeleteContentRef} className="px-0" size="2xl" onCloseAutoFocus={handleCloseAutoFocus}>
            <Card title={firstUpperLetter(t('general.get_pdf_report'))}>
              <p>{firstUpperLetter(t('are_you_sure?'))}</p>
            </Card>
            <DialogFooter className="gap-2 pr-4">
              <DialogClose asChild>
                <Button type="submit" variant="outline" onClick={() => setGetDriverReport({ value: true, rowId: row.original[t('general.Id')] })}>
                  {firstUpperLetter(t('general.get_pdf_report'))}
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button className="capitalize" type="submit" variant="outline">
                  {t('general.close')}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default React.memo(DataTableRowOptions);



