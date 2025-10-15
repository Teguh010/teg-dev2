"use client";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
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
import { firstUpperLetter } from "@/lib/utils";

export default function GeneralPicker({
  valueList,
  value,
  setValue,
  className = undefined,
  label = null,
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);
  const { t } = useTranslation();

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            {value ? (
              <>
                <Badge
                  color="secondary"
                  className="rounded-sm px-1 font-normal capitalize"
                >
                  {t(value)}
                </Badge>
              </>
            ) : label ? (
              <span>{label}</span>
            ) : (
              <span>{firstUpperLetter(t("general.pick_a_value"))}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[90%] md:w-auto p-0" align="start">
          <Command>
            <CommandInput
              ref={inputRef}
              placeholder={firstUpperLetter(t("general.search"))}
              value={search}
              onValueChange={(event) => setSearch(event)}
            />
            <CommandList>
              <CommandEmpty>
                {firstUpperLetter(t("general.no_results_found"))}.
              </CommandEmpty>
              <PopoverClose asChild>
                <CommandGroup>
                  {valueList.length > 0 &&
                    valueList.map((value, index) => {
                      return (
                        <CommandItem
                          key={index}
                          onSelect={() => (
                            setValue(value.title), setSearch("")
                          )}
                        >
                          <span>{firstUpperLetter(value.title)}</span>
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
              onClick={() => (setValue(""), setSearch(""))}
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
