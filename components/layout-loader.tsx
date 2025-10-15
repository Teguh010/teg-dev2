"use client";
import React from "react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import logo from "@/public/images/logo/logo_tracegrid.png";
import { useTranslation } from 'react-i18next';

interface LayoutLoaderProps {
  loadingText?: string;
}

const LayoutLoader = ({ loadingText }: LayoutLoaderProps) => {
  if (loadingText) {
    return (
      <div className="h-screen flex items-center justify-center flex-col space-y-2">
        <Image
          src={logo}
          alt=""
          style={{ objectFit: "cover" }}
        />
        <span className="inline-flex gap-1 capitalize">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </span>
      </div>
    );
  }

  const { t } = useTranslation();

  return (
    <div className="h-screen flex items-center justify-center flex-col space-y-2">
      <Image
        src={logo}
        alt=""
        style={{ objectFit: "cover" }}
      />
      <span className="inline-flex gap-1 capitalize">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {t('Loading')}...
      </span>
    </div>
  );
};

export default LayoutLoader;
