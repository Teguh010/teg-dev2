"use client";
import React, { useState, useRef, useEffect } from "react";
import { HereMap } from "@/components/maps/here-map/HereMap";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';

const DataTableRowActions = ({ row, name }) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [locations, setLocations] = useState([]);
  const dialogContentRef = useRef(null);

  useEffect(() => {
    const calculateLocations = () => {
      if (name === t('address')) {
        setLocations([{ lat: row.original[t('lat')], lon: row.original[t('lon')] }]);
      } else if (name === t('general.route')) {
        setLocations([
          { lat: row.original[t('lat_from')], lon: row.original[t('lon_from')] },
          { lat: row.original[t('lat_to')], lon: row.original[t('lon_to')] }
        ]);
      } else {
        setLocations([]);
      }
    };

    calculateLocations();
  }, [name, row]);

  const handleCloseAutoFocus = (event) => {
    event.preventDefault();
  };

  return (
    <>
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      >
        <DialogTrigger asChild>
          {name === t('address') ?
            <Button variant="ghost" className="capitalize p-1 h-5">{row.original[t('address')]}</Button> :
            <Button variant="ghost" className="capitalize p-1 h-10 text-justify">
              <>
                {row.original[t('address_from')]}<br />
                {row.original[t('address_to')]}
              </>
            </Button>
          }
        </DialogTrigger>
        <DialogContent ref={dialogContentRef} className="px-1" size="2xl" onCloseAutoFocus={handleCloseAutoFocus}>
          <DialogHeader>
            <DialogTitle className="text-base font-medium text-default-700 self-center">
              {name === t('address') ?
                <>
                  {row.original[t('address')]}
                </> :
                <>
                  {row.original[t('address_from')]}<br />
                  {row.original[t('address_to')]}
                </>
              }
            </DialogTitle>
          </DialogHeader>
          <HereMap
            locations={locations}
            zoom={15}
          />
          <DialogFooter className="gap-2 pr-4">
            <DialogClose asChild>
              <Button className="capitalize" type="submit" variant="outline">
                {t('general.close')}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default React.memo(DataTableRowActions);
