"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { aMenusBArray, firstUpperLetter } from "@/lib/utils";
import { Shuttle, useShuttleState, useShuttleKeyboardControls } from 'react-accessible-shuttle';
import Card from "@/components/ui/card-snippet";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import 'react-accessible-shuttle/css/shuttle.css';

const DataTableRowOptions = ({ row, vehicles, updateGroup, setUpdateGroup, setDeleteGroup }) => {
  const { t } = useTranslation();
  const [isDeleteDialogOpen, setDeleteIsDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resetShuttle, setResetShuttle] = useState(false);
  const [name, setName] = useState(row?.original[t('general.tachograph')]);
  const dialogDeleteContentRef = useRef(null);
  const dialogContentRef = useRef(null);
  const shuttle = useShuttleState({
    source: [],
    target: [],
  });
  const controls = useShuttleKeyboardControls(shuttle);
  const [sourceFilter, setSourceFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');

  const handleSourceFilterChange = useCallback(e => {
    setSourceFilter(e.currentTarget.value);
  }, []);

  const handleTargetFilterChange = useCallback(e => {
    setTargetFilter(e.currentTarget.value);
  }, []);

  const handleCloseAutoFocus = (event) => {
    event.preventDefault();
  };

  useEffect(() => {
    if (vehicles && row?.original[t('map_page.vehicles')]) {
      const target = row.original[t('map_page.vehicles')].split(', ').map(item => item.trim());
      shuttle.shuttleState.target = target;
      const filteredSource = vehicles.map(vehicle => vehicle.id + " " + vehicle.name).filter(vehicle => !target.includes(vehicle));
      shuttle.shuttleState.source = filteredSource;
    }
  }, [row, vehicles]);

  useEffect(() => {
    if (resetShuttle) {
      setUpdateGroup({ value: true, rowId: row?.original[t('general.Id')], group: { name: name, vehicles: shuttle.shuttleState.target } });
      setResetShuttle(false);
    }
  }, [resetShuttle]);

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
        <Dialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        >
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="capitalize w-full"
            >
              <span>{firstUpperLetter(t('general.edit'))}</span>
            </Button>
          </DialogTrigger>
          <DialogContent ref={dialogContentRef} className="px-0" size="2xl" onCloseAutoFocus={handleCloseAutoFocus}>
            <Card title={firstUpperLetter(t('general.group'))}>
              <Input disable type="text" placeholder={t('general.name')} onChange={(e) => setName(e.target.value)} value={name} />
              <Shuttle className="pt-4 justify-center" {...shuttle}  {...controls}>
                <div className="flex flex-col">
                  <Input
                    type="text"
                    onChange={handleSourceFilterChange}
                    value={sourceFilter}
                    placeholder={firstUpperLetter(t('general.filter_source'))}
                    className="mb-4"
                  />
                  <Shuttle.Container>
                    {({ source }, getItemProps) =>
                      source.map((item, index) => {
                        if (
                          !sourceFilter ||
                          item.includes(sourceFilter)
                        ) {
                          return (
                            <Shuttle.Item
                              {...getItemProps(index)}
                              key={item}
                              value={item}>
                              {item}
                            </Shuttle.Item>
                          );
                        }

                        return null;
                      })
                    }
                  </Shuttle.Container>
                </div>
                {/* <Shuttle.Controls /> */}
                <Shuttle.Controls />
                <div className="flex flex-col">
                  <Input
                    type="text"
                    onChange={handleTargetFilterChange}
                    value={targetFilter}
                    placeholder={firstUpperLetter(t('general.filter_target'))}
                    className="mb-4 capitalize"
                  />
                  <Shuttle.Container>
                    {({ target }, getItemProps) =>
                      target.map((item, index) => {
                        if (
                          !targetFilter ||
                          item.includes(targetFilter)
                        ) {
                          return (
                            <Shuttle.Item
                              {...getItemProps(index)}
                              key={item}
                              value={item}>
                              {item}
                            </Shuttle.Item>
                          );
                        }

                        return null;
                      })
                    }
                  </Shuttle.Container>
                </div>
              </Shuttle>
            </Card>
            <DialogFooter className="gap-2 pr-4">
              <Button className="capitalize" type="submit" variant="outline" onClick={() => { setResetShuttle(true); }}>
                {t('general.save')}
              </Button>
              <DialogClose asChild>
                <Button className="capitalize" type="submit" variant="outline">
                  {t('general.close')}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={setDeleteIsDialogOpen}
        >
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="capitalize w-full"
            >
              <span>{firstUpperLetter(t('general.delete'))}</span>
            </Button>
          </DialogTrigger>
          <DialogContent ref={dialogDeleteContentRef} className="px-0" size="2xl" onCloseAutoFocus={handleCloseAutoFocus}>
            <Card title={firstUpperLetter(t('general.delete_group'))}>
              <p>{firstUpperLetter(t('are_you_sure?'))}</p>
            </Card>
            <DialogFooter className="gap-2 pr-4">
              <DialogClose asChild>
                <Button className="capitalize" type="submit" variant="outline" onClick={() => setDeleteGroup({ value: true, rowId: row.original[t('general.Id')] })}>
                  {t('general.delete')}
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button className="capitalize" type="submit" variant="outline">
                  {t('general.close')}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default React.memo(DataTableRowOptions);



