"use client";
import { useState, useRef, useEffect } from "react";
import { Car as CarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from 'react-i18next';
import { firstUpperLetter } from "@/lib/utils";

export default function VehiclePicker({ vehicles, setVehicle, vehicle = null, className = undefined }) {
  const [vehicleName, setVehicleName] = useState(null);
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);
  const { t } = useTranslation();

  // Sinkronisasi label kendaraan dengan prop vehicle dari parent
  useEffect(() => {
    if (vehicle && vehicles && vehicles.length > 0) {
      const found = vehicles.find((v) => v.id === vehicle);
      setVehicleName(found ? found.name : null);
    } else {
      setVehicleName(null);
    }
  }, [vehicle, vehicles]);

  // Reset vehicle name when vehicles change and current vehicle is not in the list
  useEffect(() => {
    if (vehicles && vehicles.length > 0 && vehicle) {
      const found = vehicles.find((v) => v.id === vehicle);
      if (!found) {
        setVehicleName(null);
        setVehicle(null);
      }
    }
  }, [vehicles, vehicle]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
          >
            <CarIcon className="mr-2 h-4 w-4" />
            {vehicleName ? (
              <>
                <span className="capitalize">{t('general.vehicle')}</span>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <Badge
                  color="secondary"
                  className="rounded-sm px-1 font-normal"
                >
                  {vehicleName}
                </Badge>
              </>
            ) : (
              <span>{ firstUpperLetter(t('general.pick_a_vehicle'))}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[90%] md:w-auto p-0" align="start">
          <Command>
            <CommandInput
              ref={inputRef}
              className="capitalize"
              placeholder={t('general.vehicle')}
              value={search}
              onValueChange={(event) => setSearch(event)}
            />
            <CommandList>
              <CommandEmpty>{firstUpperLetter(t('general.no_results_found'))}.</CommandEmpty>
              <PopoverClose asChild>
                <CommandGroup>
                  {vehicles.length > 0 && vehicles.map((vehicle) => {
                    return (
                      <CommandItem
                        key={vehicle.id}
                        onSelect={() => (setVehicle(vehicle.id), setVehicleName(vehicle.name), setSearch(""))}
                      >
                        <span>{vehicle.name}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </PopoverClose>
            </CommandList>
            <CommandSeparator />
          </Command>
          <div className="flex flex-row w-full justify-end gap-1 p-2">
            <Button
              className="justify-center text-center capitalize"
              variant="outline"
              color="dark"
              size="xxs"
              onClick={() => (setVehicle(null), setVehicleName(null), setSearch(""))}
            >
              {t('general.reset')}
            </Button>
            <PopoverClose asChild>
              <Button
                className="justify-center text-center capitalize"
                variant="outline"
                color="dark"
                size="xxs"
              >
                {t('general.close')}
              </Button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
    </div >
  );
}
