"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from 'react-i18next';
import { cn, firstUpperLetter } from "@/lib/utils";
import TimePicker from "react-time-picker";

export function SettingsPicker({
  settings = undefined,
  className = undefined,
  schedules,
  setSchedules,
  minMoving,
  minStationary,
  tripMode,
  setMinMoving,
  setMinStationary,
  setTripMode,
}) {
  const { t } = useTranslation();
  const [selectedDays, setSelectedDays] = useState([]);
  const [unitDistance, setUnitDistance] = useState(settings.find(setting => setting.title === "unit_distance")?.value);
  const [unitVolume, setUnitVolume] = useState(settings.find(setting => setting.title === "unit_volume")?.value);
  const [dateFormat, setDateFormat] = useState(settings.find(setting => setting.title === "date_format")?.value);
  const [timeFormat, setTimeFormat] = useState(settings.find(setting => setting.title === "time_format")?.value);
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const days = ['1', '2', '3', '4', '5', '6', '7'];

  const handleDayClick = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleAddSchedule = () => {
    if (selectedDays.length > 0) {
      const newSchedules = [...schedules];

      selectedDays.forEach(day => {
        const scheduleIndex = newSchedules.findIndex(schedule => schedule[0] === Number(day));

        const newSchedule = [
          Number(day),
          startTime,
          endTime
        ];

        //if (scheduleIndex !== -1) {
          // Si ya existe un horario para este día, lo reemplazamos
        //  newSchedules[scheduleIndex] = newSchedule;
        //} else {
          // Si no existe, lo agregamos
          newSchedules.push(newSchedule);
        //}
      });

      setSchedules(newSchedules);
      setSelectedDays([]);
    }
  };

  const handleRemoveSchedule = (index) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (settings.length > 0) {
      settings.map((setting) => {
        if (setting.title === "time_format") {
          setTimeFormat(setting.value);
        }
        if (setting.title === "unit_distance") {
          setUnitDistance(setting.value)
        }
        if (setting.title === "unit_volume") {
          setUnitVolume(setting.value)
        }
        if (setting.title === "date_format") {
          setDateFormat(setting.value)
        }
      })
    }

  }, [settings]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
          >
            <span>{firstUpperLetter(t('general.settings'))}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[90%] md:w-auto py-4" align="center">
          <div className="flex flex-row space-x-4">
            <div className="space-y-4">
              <div>
                <Label className="mb-3">
                  {firstUpperLetter(t('trips_and_stops.trip_time_(min)'))}
                </Label>
                <Input
                  type="number"
                  value={minMoving}
                  onChange={(e) => setMinMoving(e.currentTarget.value)}
                  min="0"
                />
              </div>

              <div>
                <Label className="mb-3">
                  {firstUpperLetter(t('trips_and_stops.stop_time_(min)'))}
                </Label>
                <Input
                  type="number"
                  value={minStationary}
                  onChange={(e) => setMinStationary(e.currentTarget.value)}
                  min="0"
                />
              </div>

              <div>
                <Label className="mb-3">
                  {firstUpperLetter(t('trips_and_stops.trip_purpose'))}
                </Label>
                <Select value={tripMode} onValueChange={(value) => setTripMode(value)}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={firstUpperLetter(t('trips_and_stops.please_select'))} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="1"
                    >
                      {firstUpperLetter(t('trips_and_stops.job'))}
                    </SelectItem>
                    <SelectItem
                      value="2"
                    >
                      {firstUpperLetter(t('trips_and_stops.private'))}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-3">
                  {firstUpperLetter(t('trips_and_stops.include_only_selected_weekdays'))}
                </Label>
                <div className="flex justify-between gap-2">
                  {days.map((day) => (
                    <Button
                      key={day}
                      variant="outline"
                      size="sm"
                      className="h-8"
                      color={selectedDays.includes(day) ? 'success' : 'primary'}
                      onClick={() => handleDayClick(day)}
                    >
                      <span>{firstUpperLetter(t(day))}</span>
                    </Button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Label className="my-3" >
                    {firstUpperLetter(t('trips_and_stops.start_time'))}
                  </Label>
                  <TimePicker
                    locale={timeFormat === "HH:mm:ss" && "hu-HU"}
                    onChange={setStartTime}
                    value={startTime}
                    clearIcon={false}
                    clockIcon={false}
                    CalendarIcon={false}
                  />
                  <Label className="my-3">
                    {firstUpperLetter(t('trips_and_stops.end_time'))}
                  </Label>
                  <TimePicker
                    locale={timeFormat === "HH:mm:ss" && "hu-HU"}
                    onChange={setEndTime}
                    value={endTime}
                    clearIcon={false}
                    clockIcon={false}
                    CalendarIcon={false}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={handleAddSchedule}
                >
                  <span>{firstUpperLetter(t('trips_and_stops.add_schedule'))}</span>
                </Button>
              </div>

              {schedules.length > 0 &&
                <div>
                  <Label>
                    {firstUpperLetter(t('trips_and_stops.weekdays_and_times'))}
                  </Label>
                  {schedules.map((schedule, index) => (
                    <div key={index} className="flex justify-between items-center my-3">
                      {firstUpperLetter(t('trips_and_stops.weekday'))}: {schedule[0]} | {firstUpperLetter(t('trips_and_stops.time'))}: {schedule[1] + "-" + schedule[2]}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 pl-2 ml-2"
                        color="destructive"
                        onClick={() => handleRemoveSchedule(index)}
                      >
                        <span>{firstUpperLetter(t('trips_and_stops.remove'))}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              }
            </div>
          </div>
          <Separator orientation="horizontal" className="mt-4" />
          <div className="flex flex-row w-full justify-end gap-1 p-2">
            <Button
              className="justify-center text-center capitalize"
              variant="outline"
              color="dark"
              size="xxs"
              onClick={() => (setMinMoving(null), setMinStationary(null), setTripMode(null), setSchedules([]))}
            >
              {t('reset')}
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
