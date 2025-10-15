"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { firstUpperLetter } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import 'react-accessible-shuttle/css/shuttle.css';

const DataTableBulkOptions = ({ rows, getBulkReport, setGetBulkReport, fileType}) => {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          color="default"
          size="sm"
          className="h-8"
        >
          <span>{firstUpperLetter(t('general.bulk_actions'))}</span>
        </Button>
      </DropdownMenuTrigger>
      {rows.length >= 1 && <DropdownMenuContent align="center">
        <Button
          variant="ghost"
          size="sm"
          className="capitalize w-full"
          disabled={getBulkReport.value}
          onClick={() => setGetBulkReport({ value: true, rowIds: rows.map(item => item.original[t('general.Id')]), fileType })}
        >
          <span>{firstUpperLetter(t('general.get_reports'))}</span>
        </Button>
      </DropdownMenuContent>}
    </DropdownMenu>
  );
};

export default React.memo(DataTableBulkOptions);



