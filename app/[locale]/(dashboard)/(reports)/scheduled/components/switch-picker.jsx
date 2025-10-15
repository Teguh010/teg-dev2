"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { firstUpperLetter } from "@/lib/utils";
import "react-accessible-shuttle/css/shuttle.css";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const SwitchPicker = ({ handleCheckedChange, label }) => {
  const { t } = useTranslation()

  const handleChange = (checked) => {
    handleCheckedChange(checked);
  }

  return (
    <div className='flex items-center gap-2'>
      <Switch onCheckedChange={handleChange} id='controlled_Switch' />
      <Label htmlFor='controlled_Switch'>{firstUpperLetter(label)}</Label>
    </div>
  )
}

export default React.memo(SwitchPicker);
