"use client";
import { useState, useRef } from "react";
import { Car as CarIcon, Check } from "lucide-react";
import { cn, firstUpperLetter } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
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
import { useTranslation } from "react-i18next";

export default function DriversPicker({
  vehicles,
  setVehicles,
  className = undefined,
}) {
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);
  const { t } = useTranslation();

  const toggleVehicle = (id) => {
    let newSelected;
    if (selectedVehicles.includes(id)) {
      newSelected = selectedVehicles.filter((vehicleId) => vehicleId !== id);
    } else {
      newSelected = [...selectedVehicles, id];
    }
    setSelectedVehicles(newSelected);
    setVehicles(newSelected);
  };

  const resetSelection = () => {
    setSelectedVehicles([]);
    setVehicles([]);
    setSearch("");
  };

  // Función para seleccionar o deseleccionar todos los vehículos según el estado actual
  const toggleSelectAllVehicles = () => {
    if (selectedVehicles.length === vehicles.length) {
      resetSelection();
    } else {
      const allVehicleIds = vehicles.map((vehicle) => vehicle.id);
      setSelectedVehicles(allVehicleIds);
      setVehicles(allVehicleIds);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <CarIcon className="mr-2 h-4 w-4" />
            {selectedVehicles.length > 0 ? (
              <>
                <span className="capitalize">{t("general.driver")}</span>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <div className="flex flex-wrap gap-1">
                  {selectedVehicles.slice(0, 3).map((id) => {
                    const veh = vehicles.find((v) => v.id === id);
                    return veh ? (
                      <Badge
                        key={id}
                        color="secondary"
                        className="rounded-sm px-1 font-normal"
                      >
                        {veh.name}
                      </Badge>
                    ) : null;
                  })}
                  {selectedVehicles.length > 3 && (
                    <Badge
                      color="secondary"
                      className="rounded-sm px-1 font-normal"
                    >
                      {`+ ${selectedVehicles.length - 3} ${t('general.more')}`}
                    </Badge>
                  )}
                </div>
              </>
            ) : (
              <span>{firstUpperLetter(t("general.pick_drivers"))}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[90%] md:w-auto p-0" align="start">
          <Command>
            <CommandInput
              ref={inputRef}
              className="capitalize"
              placeholder={t("general.driver")}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {firstUpperLetter(t("general.no_results_found"))}.
              </CommandEmpty>
              <CommandGroup>
                {vehicles.length > 0 &&
                  vehicles.map((vehicle) => (
                    <CommandItem
                      key={vehicle.id}
                      onSelect={() => toggleVehicle(vehicle.id)}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          selectedVehicles.includes(vehicle.id)
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </div>
                      <span>{vehicle.name}</span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
          </Command>
          <div className="flex flex-row w-full justify-end gap-1 p-2">
            <Button
              className="justify-center text-center capitalize"
              variant="outline"
              color="dark"
              size="xxs"
              onClick={toggleSelectAllVehicles}
            >
              {selectedVehicles.length === vehicles.length
                ? t("general.unselect_all")
                : t("general.select_all")}
            </Button>
            <Button
              className="justify-center text-center capitalize"
              variant="outline"
              color="dark"
              size="xxs"
              onClick={resetSelection}
            >
              {t("general.reset")}
            </Button>
            <PopoverClose asChild>
              <Button
                className="justify-center text-center capitalize"
                variant="outline"
                color="dark"
                size="xxs"
              >
                {t("general.close")}
              </Button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
