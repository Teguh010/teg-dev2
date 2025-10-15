"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { firstUpperLetter } from "@/lib/utils";
import "react-accessible-shuttle/css/shuttle.css";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const SwitchPicker = ({
	handleCheckedChange
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <Switch
        onCheckedChange={handleCheckedChange}
        id="controlled_Switch"
      />
      <Label htmlFor="controlled_Switch">
        {firstUpperLetter(t("general.local_time"))}
      </Label>
    </div>
  );
};

export default React.memo(SwitchPicker);
