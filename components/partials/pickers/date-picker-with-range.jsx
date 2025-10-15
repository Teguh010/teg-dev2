"use client";

import { useState, useEffect } from "react";
import { format, parse, isValid, differenceInCalendarDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn, firstUpperLetter } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar-timer";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";
import { Command, CommandSeparator } from "@/components/ui/command";
import TimePicker from "react-time-picker";
import "./styles.css";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import {
  getCurrentWeekRange,
  getCurrentMonthRange,
  getCurrentYearRange,
} from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Icon } from "@iconify/react";

export default function DatePickerWithRange({
  className = undefined,
  setStartDate,
  setEndDate,
  startDate,
  endDate,
  settings = [],
  text = "pick_date",
  onlyDate = false,
  range = "today",
  limitDays = null,
  useDefaultValue = true,
}) {
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [isCustomStartValid, setIsCustomStartValid] = useState(true);
  const [isCustomEndValid, setIsCustomEndValid] = useState(true);
  const [pendingNewFrom, setPendingNewFrom] = useState(null);
  // Flag untuk menunggu klik kedua (range)
  const [isAwaitingRange, setIsAwaitingRange] = useState(false);
  const [forceSingleDate, setForceSingleDate] = useState(null);

  // Tambahkan util untuk set jam pada Date
  function setTimeOnDate(date, hour, minute, second = 0) {
    const d = new Date(date);
    d.setHours(hour, minute, second, 0);
    return d;
  }

  // Perbaiki inisialisasi initialDate agar jam sesuai kebutuhan
  const initialDate =
    useDefaultValue && text === "pick_date"
      ? range === "week"
        ? {
            from: setTimeOnDate(getCurrentWeekRange().from, 0, 0, 0),
            to: setTimeOnDate(getCurrentWeekRange().to, 23, 55, 0),
          }
        : range === "month"
        ? {
            from: setTimeOnDate(getCurrentMonthRange().from, 0, 0, 0),
            to: setTimeOnDate(getCurrentMonthRange().to, 23, 55, 0),
          }
        : range === "year"
        ? {
            from: setTimeOnDate(getCurrentYearRange().from, 0, 0, 0),
            to: setTimeOnDate(getCurrentYearRange().to, 23, 55, 0),
          }
        : {
            from: setTimeOnDate(new Date(), 0, 0, 0),
            to: setTimeOnDate(new Date(), 23, 55, 0),
          }
      : null;

  const [date, setDate] = useState(initialDate);
  // Se extraen formatos (con defaults en caso de no venir en settings)
  const [dateFormat, setDateFormat] = useState(
    settings.find((setting) => setting.title === "date_format")?.value ||
      "MM/dd/yyyy"
  );
  const [timeFormat, setTimeFormat] = useState(
    settings.find((setting) => setting.title === "time_format")?.value ||
      "HH:mm:ss"
  );
  // Variables para el manejo del calendario
  // Ejemplo de días deshabilitados (en este caso, se deshabilitan días posteriores a mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultMonth = new Date();
  defaultMonth.setMonth(defaultMonth.getMonth() - 1);
  const disabledDays = [{ from: tomorrow, to: new Date(9999, 11, 31) }];
  // Si se define un límite y ya existe una fecha de inicio, agregamos
  // una restricción dinámica para los días posteriores al límite permitido.
  let extraDisabledDays = [];
  if (limitDays !== null && date?.from) {
    const maxAllowed = new Date(date.from);
    maxAllowed.setDate(maxAllowed.getDate() + limitDays - 1); // -1 para incluir el día de inicio
    extraDisabledDays.push({
      from: new Date(maxAllowed.getTime() + 24 * 60 * 60 * 1000),
      to: new Date(9999, 11, 31),
    });
  }
  // Combinar ambos arreglos de días deshabilitados
  const computedDisabledDays = [...disabledDays, ...extraDisabledDays];
  const { t } = useTranslation();
  // Arrays con los formatos aceptados para fecha y hora
  const acceptedDateFormats = ["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"];
  const acceptedTimeFormats = ["HH:mm:ss", "HH:mm", "hh:mm aa"];

  // Manejo de cambios en TimePicker para fecha de inicio
  /* const handleStartTimeChange = (time) => {
    if (time) {
      setStartTime(time);
      const baseDate = startDate ? new Date(startDate) : new Date();
      if (!onlyDate) {
        const [hours, minutes] = time.split(":");
        baseDate.setHours(hours);
        baseDate.setMinutes(minutes);
      }
      setStartDate(baseDate);
    }
  }; */

  // Manejo de cambios en TimePicker para fecha de fin
  /* const handleEndTimeChange = (time) => {
    if (time) {
      setEndTime(time);
      const baseDate = endDate ? new Date(endDate) : new Date();
      if (!onlyDate) {
        const [hours, minutes] = time.split(":");
        baseDate.setHours(hours);
        baseDate.setMinutes(minutes);
      }
      setEndDate(baseDate);
    }
  }; */

  // Función para validar el rango seleccionado en el calendario
  const handleCalendarSelect = (newRange) => {
    // Proses normal: hanya update jika belum ada range lengkap
    if (!(date?.from && date?.to)) {
      if (limitDays !== null && newRange?.from && newRange?.to) {
        const diffDays = differenceInCalendarDays(newRange.to, newRange.from) + 1;
        if (diffDays > limitDays) {
          alert(`El rango seleccionado supera el límite de ${limitDays} días.`);
          return;
        }
      }
      setDate(newRange);
      if (newRange?.from) setStartDate(newRange.from);
      if (newRange?.to) setEndDate(newRange.to);
    }
  };

  // Setelah render, jika forceSingleDate ada, set date dan startDate lalu clear forceSingleDate
  useEffect(() => {
    if (forceSingleDate) {
      setDate({ from: forceSingleDate, to: undefined });
      setStartDate(forceSingleDate);
      setForceSingleDate(null);
    }
  }, [forceSingleDate, setStartDate]);

  // Funciones para obtener formatos válidos
  /* const getValidDateFormat = (format) => {
    const formatMap = {
      "YYYY-MM-DD": "yyyy-MM-dd",
      "DD-MM-YYYY": "dd-MM-yyyy",
      "MM-DD-YYYY": "MM-dd-yyyy",
      "YYYY.MM.DD": "yyyy.MM.dd",
      "DD.MM.YYYY": "dd.MM.yyyy",
      "MM.DD.YYYY": "MM.dd.yyyy",
    };
    return formatMap[format] || "MM/dd/yyyy";
  };

  const getValidTimeFormat = (format) => {
    const formatMap = {
      "HH:mm:ss": "HH:mm:ss",
      "HH:mm": "HH:mm",
      "hh:mm A": "hh:mm aa",
    };
    return formatMap[format] || "HH:mm";
  }; */

  // Función que genera el formato esperado según solo fecha o fecha+hora
  const getExpectedFormat = () => {
    return !onlyDate ? `${dateFormat} ${timeFormat}` : dateFormat;
  };

  // Función para obtener los formatos aceptados según soloDate
  const getAcceptedFormats = () => {
    if (!onlyDate) {
      // Combina cada formato de fecha con cada formato de hora
      const formats = [];
      acceptedDateFormats.forEach((dateFmt) => {
        acceptedTimeFormats.forEach((timeFmt) => {
          formats.push(`${dateFmt} ${timeFmt}`);
        });
      });
      return formats;
    }
    return acceptedDateFormats;
  };

  // Función para normalizar el string ingresado en el input
  const normalizeDateString = (str) => {
    if (!str) return str;
    return str
      .trim() // Elimina espacios al inicio y al final
      .replace(/\s+/g, " ") // Reduce múltiples espacios a uno solo
      .replace(/[.\\]/g, "/") // Reemplaza '.' y '\' por '/'
      .replace(/\s*\/\s*/g, "/") // Elimina espacios alrededor de '/'
      .replace(/\/+/g, "/"); // Colapsa varios '/' a uno solo
  };

  const parseMultipleFormats = (value) => {
    // Normalizamos la entrada para mitigar errores comunes de formato
    const normalizedValue = normalizeDateString(value);
    const now = new Date(); // Fecha actual para validar fechas futuras

    // Intentar primero con el formato definido en settings (formato por defecto)
    const defaultFormat = getExpectedFormat();
    let parsed = parse(normalizedValue, defaultFormat, new Date());
    if (
      isValid(parsed) &&
      normalizeDateString(format(parsed, defaultFormat)) === normalizedValue
    ) {
      // Si la fecha es mayor a la de hoy, se retorna la fecha actual
      return parsed > now ? now : parsed;
    }

    // Intentar con los otros formatos aceptados
    const formats = getAcceptedFormats();
    for (const fmt of formats) {
      parsed = parse(normalizedValue, fmt, new Date());
      if (
        isValid(parsed) &&
        normalizeDateString(format(parsed, fmt)) === normalizedValue
      ) {
        return parsed > now ? now : parsed;
      }
    }
    return null;
  };

  // Al perder el foco, se parsea y valida el valor ingresado
  const handleCustomStartBlur = () => {
    const parsedDate = parseMultipleFormats(customStart);
    if (parsedDate) {
      setIsCustomStartValid(true);
      setStartDate(parsedDate);
      if (!onlyDate) {
        setStartTime(
          `${String(parsedDate.getHours()).padStart(2, "0")}:${String(
            parsedDate.getMinutes()
          ).padStart(2, "0")}`
        );
      }
      // Actualizamos la selección del calendario (rango "from")
      setDate((prev) => ({
        ...prev,
        from: parsedDate,
      }));
      // Actualizamos el input formateándolo con uno de los formatos válidos (puedes elegir el primero)
      setCustomStart(format(parsedDate, getAcceptedFormats()[0]));
    } else {
      setIsCustomStartValid(false);
    }
  };

  // Al perder el foco, se parsea y valida el valor ingresado y se verifica el límite
  const handleCustomEndBlur = () => {
    const parsedDate = parseMultipleFormats(customEnd);
    if (parsedDate) {
      // Si se definió limitDays y existe startDate, validamos la diferencia
      if (limitDays !== null && startDate) {
        const diffDays =
          differenceInCalendarDays(parsedDate, new Date(startDate)) + 1;
        if (diffDays > limitDays) {
          setIsCustomEndValid(false);
          alert(`El rango no puede ser mayor a ${limitDays} días.`);
          return;
        }
      }
      setIsCustomEndValid(true);
      setEndDate(parsedDate);
      if (!onlyDate) {
        setEndTime(
          `${String(parsedDate.getHours()).padStart(2, "0")}:${String(
            parsedDate.getMinutes()
          ).padStart(2, "0")}`
        );
      }
      setDate((prev) => ({
        ...prev,
        to: parsedDate,
      }));
      // Actualizamos el input formateándolo con el primer formato válido de la lista
      setCustomEnd(format(parsedDate, getAcceptedFormats()[0]));
    } else {
      setIsCustomEndValid(false);
    }
  };

  const handleCustomStartChange = (value) => {
    setCustomStart(value);
    setIsCustomStartValid(true);
  };

  const handleCustomEndChange = (value) => {
    setCustomEnd(value);
    setIsCustomEndValid(true);
  };

  // Actualiza formatos a partir de settings
  useEffect(() => {
    if (settings.length > 0) {
      settings.forEach((setting) => {
        if (setting.title === "time_format") {
          setTimeFormat(setting.value);
        }
        if (setting.title === "date_format") {
          setDateFormat(setting.value);
        }
      });
    }
  }, [settings]);

  // Tambahkan flag untuk deteksi mount pertama
  const [hasInitialized, setHasInitialized] = useState(false);
  // Set default value ke parent jika startDate/endDate masih null dan useDefaultValue aktif
  useEffect(() => {
    if (!hasInitialized && useDefaultValue && initialDate && !startDate && !endDate) {
      if (initialDate.from) setStartDate(initialDate.from);
      if (initialDate.to) setEndDate(initialDate.to);
      setHasInitialized(true);
    }
  }, [useDefaultValue, initialDate, startDate, endDate, hasInitialized, setStartDate, setEndDate]);

  // Actualiza el estado interno a partir de cambios en startDate y endDate externos
/*   useEffect(() => {
    if (!startDate || !endDate) return;

    const currentFrom = date?.from?.getTime();
    const currentTo = date?.to?.getTime();
    const newFrom = new Date(startDate).getTime();
    const newTo = new Date(endDate).getTime();

    if (currentFrom !== newFrom || currentTo !== newTo) {
      setDate({ from: new Date(startDate), to: new Date(endDate) });

      if (!onlyDate) {
        const startDt = new Date(startDate);
        const endDt = new Date(endDate);
        setStartTime(
          `${String(startDt.getHours()).padStart(2, "0")}:${String(
            startDt.getMinutes()
          ).padStart(2, "0")}`
        );
        setEndTime(
          `${String(endDt.getHours()).padStart(2, "0")}:${String(
            endDt.getMinutes()
          ).padStart(2, "0")}`
        );
      }
    }
  }, [startDate, endDate]); */

  // Efecto para sincronizar el valor de los inputs personalizados con startDate
  useEffect(() => {
    const expectedFormat = getExpectedFormat();
    if (startDate) {
      setCustomStart(format(new Date(startDate), expectedFormat));
    } else {
      setCustomStart("");
    }
  }, [startDate, dateFormat, timeFormat, onlyDate]);

  // Efecto para sincronizar el valor de los inputs personalizados con endDate
  useEffect(() => {
    const expectedFormat = getExpectedFormat();
    if (endDate) {
      setCustomEnd(format(new Date(endDate), expectedFormat));
    } else {
      setCustomEnd("");
    }
  }, [endDate, dateFormat, timeFormat, onlyDate]);

  // Synchronize state date with props startDate and endDate
  useEffect(() => {
    // If both are null, reset date
    if (!startDate && !endDate) {
      setDate(null);
      return;
    }
    // If either changes, update state date
    if (
      (startDate && (!date?.from || new Date(startDate).getTime() !== new Date(date.from).getTime())) ||
      (endDate && (!date?.to || new Date(endDate).getTime() !== new Date(date.to).getTime()))
    ) {
      setDate({
        from: startDate ? new Date(startDate) : date?.from,
        to: endDate ? new Date(endDate) : date?.to,
      });
    }
  }, [startDate, endDate]);

  // Handler klik hari:
  // Klik pertama: set single day range (00:00-00:55)
  // Klik kedua (hari berbeda): set range dari hari pertama (00:00) ke hari kedua (00:55)
  // Klik kedua (hari sama): tetap single day range
  const handleDayClick = (day) => {
    if (!isAwaitingRange) {
      // Klik pertama: set single day range, aktifkan flag
      const from = setTimeOnDate(day, 0, 0, 0);
      const to = setTimeOnDate(day, 23, 55, 0);
      setDate({ from, to });
      setStartDate(from);
      setEndDate(to);
      setIsAwaitingRange(true);
    } else {
      // Klik kedua: jika hari sama, tetap single day range, flag tetap ON
      const fromDate = date?.from ? new Date(date.from) : null;
      const clickedDate = new Date(day);
      if (
        fromDate &&
        fromDate.getFullYear() === clickedDate.getFullYear() &&
        fromDate.getMonth() === clickedDate.getMonth() &&
        fromDate.getDate() === clickedDate.getDate()
      ) {
        const from = setTimeOnDate(clickedDate, 0, 0, 0);
        const to = setTimeOnDate(clickedDate, 23, 55, 0);
        setDate({ from, to });
        setStartDate(from);
        setEndDate(to);
        setIsAwaitingRange(true);
      } else {
        // Klik kedua hari berbeda: set range, flag OFF
        let from, to;
        if (fromDate && fromDate <= clickedDate) {
          from = setTimeOnDate(fromDate, 0, 0, 0);
          to = setTimeOnDate(clickedDate, 23, 55, 0);
        } else {
          from = setTimeOnDate(clickedDate, 0, 0, 0);
          to = setTimeOnDate(fromDate, 23, 55, 0);
        }
        setDate({ from, to });
        setStartDate(from);
        setEndDate(to);
        setIsAwaitingRange(false);
      }
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant='outline' size='sm' className={`${!endDate ? "h-8" : "h-12 lg:h-8"}`}>
            <CalendarIcon className='mr-2 h-4 w-4' />
            <div className='flex flex-col lg:flex-row'>
              {startDate && (
                <div className='flex flex-row items-center'>
                  <span className='capitalize'>{t("general.from")}</span>
                  <Separator orientation='vertical' className='mx-2 h-4' />
                  <Badge color='secondary' className='rounded-sm px-1 font-normal'>
                    {format(new Date(startDate), `${dateFormat} ${!onlyDate ? timeFormat : ""}`)}
                  </Badge>
                </div>
              )}
              {endDate && (
                <div className='flex flex-row items-center'>
                  <span className='lg:pl-2 capitalize'>{t("general.to")}</span>
                  <Separator orientation='vertical' className='mx-2 h-4' />
                  <Badge color='secondary' className='rounded-sm px-1 font-normal'>
                    {format(new Date(endDate), `${dateFormat} ${!onlyDate ? timeFormat : ""}`)}
                  </Badge>
                </div>
              )}
            </div>
            {!startDate && !endDate && <span>{firstUpperLetter(t(text))}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[85%] lg:w-full p-0 pt-2' align='center' style={{ left: 20 }}>
          <div className='w-full flex flex-col h-[53vh] lg:h-auto overflow-y-scroll lg:overflow-hidden'>
            <Calendar
              initialFocus
              mode='range'
              defaultMonth={defaultMonth}
              selected={date}
              onSelect={handleCalendarSelect}
              onDayClick={handleDayClick}
              numberOfMonths={2}
              disabled={computedDisabledDays}
              showOutsideDays={false}
            />
            <div className='flex flex-row justify-evenly pt-8 lg:pt-0 pb-8 lg:pb-4 px-4 gap-2'>
              <Button
                className='justify-center text-center capitalize'
                variant='outline'
                color='dark'
                size='xxs'
                onClick={() => {
                  const from = setTimeOnDate(getCurrentWeekRange().from, 0, 0, 0);
                  const to = setTimeOnDate(getCurrentWeekRange().to, 23, 55, 0);
                  setDate({ from, to });
                  setStartDate(from);
                  setEndDate(to);
                }}
              >
                {t("general.week")}
              </Button>
              <Button
                className='justify-center text-center capitalize'
                variant='outline'
                color='dark'
                size='xxs'
                onClick={() => {
                  const from = setTimeOnDate(getCurrentMonthRange().from, 0, 0, 0);
                  const to = setTimeOnDate(getCurrentMonthRange().to, 23, 55, 0);
                  setDate({ from, to });
                  setStartDate(from);
                  setEndDate(to);
                }}
              >
                {t("general.month")}
              </Button>
              <Button
                className='justify-center text-center capitalize'
                variant='outline'
                color='dark'
                size='xxs'
                onClick={() => {
                  const from = setTimeOnDate(getCurrentYearRange().from, 0, 0, 0);
                  const to = setTimeOnDate(getCurrentYearRange().to, 23, 55, 0);
                  setDate({ from, to });
                  setStartDate(from);
                  setEndDate(to);
                }}
              >
                {t("general.year")}
              </Button>
              <Button
                className='justify-center text-center capitalize'
                variant='outline'
                color='dark'
                size='xxs'
                onClick={() => {
                  const from = setTimeOnDate(new Date(), 0, 0, 0);
                  const to = setTimeOnDate(new Date(), 23, 55, 0);
                  setDate({ from, to });
                  setStartDate(from);
                  setEndDate(to);
                }}
              >
                {t("general.today")}
              </Button>
            </div>
          </div>
          <Command>
            <CommandSeparator />
          </Command>
          <div className='flex flex-col p-4 justify-center'>
            <div className='flex flex-row justify-evenly gap-2 lg:gap-10'>
              <Input
                type='text'
                color='primary'
                value={customStart}
                onChange={(e) => handleCustomStartChange(e.target.value)}
                onBlur={handleCustomStartBlur}
                className={cn("", !isCustomStartValid && "border-red-500")}
              />
              <Input
                type='text'
                color='primary'
                value={customEnd}
                onChange={(e) => handleCustomEndChange(e.target.value)}
                onBlur={handleCustomEndBlur}
                className={cn("text-right", !isCustomEndValid && "border-red-500")}
              />
            </div>
          </div>
          <div className='flex flex-col lg:flex-row lg:justify-between'>
            <div className='flex flex-row w-full justify-end gap-1 px-2 pb-2'>
              <PopoverClose asChild>
                <Button
                  className='justify-center text-center capitalize'
                  variant='outline'
                  color='dark'
                  size='xxs'
                >
                  {t("general.ok")}
                </Button>
              </PopoverClose>
              <Button
                className='justify-center text-center capitalize'
                variant='outline'
                color='dark'
                size='xxs'
                onClick={() => {
                  setDate(null)
                  setStartDate(null)
                  setEndDate(null)
                  setStartTime("00:00")
                  setEndTime("23:59")
                  setCustomStart("")
                  setCustomEnd("")
                }}
              >
                {t("general.reset")}
              </Button>
              <PopoverClose asChild>
                <Button
                  className='justify-center text-center capitalize'
                  variant='outline'
                  color='dark'
                  size='xxs'
                >
                  {t("general.close")}
                </Button>
              </PopoverClose>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
