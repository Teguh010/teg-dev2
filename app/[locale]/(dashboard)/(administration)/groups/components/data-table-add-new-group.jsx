"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { Shuttle, useShuttleState, useShuttleKeyboardControls } from 'react-accessible-shuttle';
import { firstUpperLetter } from "@/lib/utils";
import Card from "@/components/ui/card-snippet";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import 'react-accessible-shuttle/css/shuttle.css';

const DataTableAddNewGroup = ({ vehicles, saveGroup, setSaveGroup }) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resetShuttle, setResetShuttle] = useState(false);
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
    setSaveGroup({ ...saveGroup, group: { ...saveGroup.group, vehicles: shuttle.shuttleState.target } });
  }, [shuttle.shuttleState]);

  useEffect(() => {
    shuttle.shuttleState.source = vehicles.map(item => item.id + " " + item.name);
    shuttle.shuttleState.target = [];
    setResetShuttle(false);
  }, [resetShuttle]);

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
        >
          <span>{firstUpperLetter(t('general.add_new'))}</span>
        </Button>
      </DialogTrigger>
      <DialogContent ref={dialogContentRef} className="px-0" size="2xl" onCloseAutoFocus={handleCloseAutoFocus}>
        <Card title={firstUpperLetter(t('general.group'))}>
          <Input type="text" placeholder={firstUpperLetter(t('general.group_name'))} onChange={(e) => setSaveGroup({ ...saveGroup, group: { ...saveGroup.group, name: e.target.value } })} value={saveGroup.group.name} />
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
          <DialogClose asChild>
            <Button className="capitalize" type="submit" variant="outline" onClick={() => { setSaveGroup({ ...saveGroup, value: true }); setResetShuttle(true); }}>
              {t('general.save')}
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button className="capitalize" type="submit" variant="outline">
              {t('general.close')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
};

export default React.memo(DataTableAddNewGroup);
