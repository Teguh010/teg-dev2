"use client";
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar-timer";
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from "@/components/ui/popover";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import { format } from "date-fns";

export default function DatePickerSingle({
  value,
  onChange,
  label = "",
  minDate,
}: {
  value: string;
  onChange: (date: Date | null) => void;
  label?: string;
  minDate?: Date; 
}) {
  // Parse value string to Date
  const parseValue = (val: string) => {
    if (!val) return null;
    const [datePart, timePart] = val.split(" ");
    if (!datePart || !timePart) return null;
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);
    return new Date(year, month - 1, day, hour, minute);
  };

  const [date, setDate] = useState<Date | null>(parseValue(value));
  const [time, setTime] = useState<string>(date ? format(date, "HH:mm") : "00:00");

  useEffect(() => {
    if (date && time) {
      const [hours, minutes] = time.split(":").map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      onChange(newDate);
    } else {
      onChange(null);
    }
    // eslint-disable-next-line
  }, [date, time]);

  useEffect(() => {
    // update local state if value prop changes
    const parsed = parseValue(value);
    setDate(parsed);
    setTime(parsed ? format(parsed, "HH:mm") : "00:00");
  }, [value]);

  return (
    <div>
      {label && <label className="block text-sm font-small text-gray-500">{label}</label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full flex justify-between">
            <span>
              {date
                ? `${format(date, "yyyy-MM-dd")} ${time}`
                : (
                  <>
                    <CalendarIcon className="inline mr-2 h-4 w-4" />
                    Select Date & Time
                  </>
                )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" side="right" align="end">
          <div className="flex flex-col gap-2 p-2">
            <Calendar
              mode="single"
              selected={date || undefined}
              onSelect={setDate}
              numberOfMonths={1}
              showOutsideDays={false}
              className=""
              classNames={{}}
              disabled={(day) => minDate ? day < minDate : false} // tambahkan ini
            />
            <TimePicker
              onChange={setTime}
              value={time}
              clearIcon={false}
              clockIcon={false}
              disableClock
            />
          </div>
          <PopoverClose asChild>
            <div className='p-2'>
              <Button className="mt-2 w-full" variant="outline" size="sm">
                OK
              </Button>
            </div>
          </PopoverClose>
        </PopoverContent>
      </Popover>
    </div>
  );
}
