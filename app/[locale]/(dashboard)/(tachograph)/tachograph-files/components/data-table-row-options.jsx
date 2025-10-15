"use client";
import React, { useState, useRef } from "react";
import { MoreHorizontal, DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { firstUpperLetter } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import 'react-accessible-shuttle/css/shuttle.css';

const DataTableRowOptions = ({ row, getReport, setGetReport, fileType }) => {
  const { t } = useTranslation();

  return (
    <Button
      variant="ghost"
      className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
      disabled={getReport.value}
      onClick={() => setGetReport({ value: true, rowId: row.original[t('general.Id')], fileType })}
    >
      <DownloadIcon className="h-4 w-4" />
      <span className="sr-only">{firstUpperLetter(t('general.download'))}</span>
    </Button>
  );
};

export default React.memo(DataTableRowOptions);



