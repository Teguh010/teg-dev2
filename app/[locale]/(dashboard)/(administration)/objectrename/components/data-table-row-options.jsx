"use client";
import React, { useState, useRef, useCallback } from "react";
import { EditIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { firstUpperLetter } from "@/lib/utils";
import "react-accessible-shuttle/css/shuttle.css";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Card from "@/components/ui/card-snippet";

const DataTableRowOptions = ({ row, setUpdateObject }) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState(null);
  const dialogContentRef = useRef(null);

  const handleCloseAutoFocus = (event) => {
    event.preventDefault();
  };

  const handleNameChange = useCallback((e) => {
    setName(e.currentTarget.value);
  }, []);

  // Populate name field when dialog is opened
  React.useEffect(() => {
    if (isDialogOpen) {
      setName(row.original?.name || "");
    }
  }, [isDialogOpen, row.original?.name]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <EditIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        ref={dialogContentRef}
        className="px-0"
        size="xl"
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        <DialogHeader>
          <DialogTitle className="font-medium text-default-700 self-center">
            {firstUpperLetter(t("general.edit"))}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <Input
            type="text"
            placeholder={firstUpperLetter(t("general.new_name"))}
            value={name}
            onChange={handleNameChange}
          />
        </div>
        <DialogFooter className="gap-2 pr-4">
          <Button
            className="capitalize"
            type="submit"
            variant="outline"
            disabled={name == "" || name == null}
            onClick={() => {
              setUpdateObject({ object: row.original, update: { name } });
            }}
          >
            {t("general.save")}
          </Button>
          <DialogClose asChild>
            <Button className="capitalize" type="submit" variant="outline">
              {t("general.close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(DataTableRowOptions);
