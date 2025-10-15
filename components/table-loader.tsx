"use client";
import React from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from 'react-i18next';

const TableLoader = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[200px] flex items-center justify-center flex-col space-y-2">
      <span className="inline-flex gap-1 capitalize">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {t('general.generating')}...
      </span>
    </div>
  );
};

export default TableLoader; 