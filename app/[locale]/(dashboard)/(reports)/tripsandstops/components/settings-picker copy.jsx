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
// Removed TimePicker in favor of manual hour/minute inputs

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
  const [startHourInput, setStartHourInput] = useState("00");
  const [startMinuteInput, setStartMinuteInput] = useState("00");
  const [endHourInput, setEndHourInput] = useState("23");
  const [endMinuteInput, setEndMinuteInput] = useState("59");
  const days = ['1', '2', '3', '4', '5', '6', '7'];

  // Normalize time to HH:mm, filling missing minutes with 00 and clamping ranges
  const pad2 = (n) => String(n).padStart(2, '0');
  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
  const normalizeTime = (value, fallback) => {
    if (!value || typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    // Accept formats: H, HH, H:, HH:, H:M, HH:M, H:MM, HH:MM
    const parts = trimmed.split(':');
    let hStr = parts[0] ?? '';
    let mStr = parts[1] ?? '';
    if (hStr === '' && mStr === '') return fallback;
    let hours = parseInt(hStr, 10);
    if (isNaN(hours)) hours = 0;
    hours = clamp(hours, 0, 23);
    let minutes;
    if (mStr === '' || mStr === undefined) {
      minutes = 0; // default minutes when user deletes them
    } else {
      minutes = parseInt(mStr, 10);
      if (isNaN(minutes)) minutes = 0;
    }
    minutes = clamp(minutes, 0, 59);
    return `${pad2(hours)}:${pad2(minutes)}`;
  };

  const handleStartHourChange = (e) => {
    const raw = e.currentTarget.value.replace(/\D/g, '').slice(0, 2);
    setStartHourInput(raw);
  };

  const handleStartMinuteChange = (e) => {
    const raw = e.currentTarget.value.replace(/\D/g, '').slice(0, 2);
    setStartMinuteInput(raw);
  };

  const handleEndHourChange = (e) => {
    const raw = e.currentTarget.value.replace(/\D/g, '').slice(0, 2);
    setEndHourInput(raw);
  };

  const handleEndMinuteChange = (e) => {
    const raw = e.currentTarget.value.replace(/\D/g, '').slice(0, 2);
    setEndMinuteInput(raw);
  };

  const handleStartHourBlur = () => {
    const h = clamp(parseInt(startHourInput || '0', 10) || 0, 0, 23);
    const normalized = `${pad2(h)}:${pad2(startMinuteInput === '' ? 0 : clamp(parseInt(startMinuteInput, 10) || 0, 0, 59))}`;
    setStartHourInput(pad2(h));
    setStartTime(normalized);
  };

  const handleStartMinuteBlur = () => {
    const h = clamp(parseInt(startHourInput || '0', 10) || 0, 0, 23);
    let m;
    if (startMinuteInput === '') {
      m = 0;
    } else if (startMinuteInput.length === 1) {
      // If only one digit entered, treat as tens place (e.g., '5' -> 50)
      m = clamp((parseInt(startMinuteInput, 10) || 0) * 10, 0, 59);
    } else {
      m = clamp(parseInt(startMinuteInput, 10) || 0, 0, 59);
    }
    setStartMinuteInput(pad2(m));
    setStartTime(`${pad2(h)}:${pad2(m)}`);
  };

  const handleEndHourBlur = () => {
    const h = clamp(parseInt(endHourInput || '0', 10) || 0, 0, 23);
    const normalized = `${pad2(h)}:${pad2(endMinuteInput === '' ? 0 : clamp(parseInt(endMinuteInput, 10) || 0, 0, 59))}`;
    setEndHourInput(pad2(h));
    setEndTime(normalized);
  };

  const handleEndMinuteBlur = () => {
    const h = clamp(parseInt(endHourInput || '0', 10) || 0, 0, 23);
    let m;
    if (endMinuteInput === '') {
      m = 0;
    } else if (endMinuteInput.length === 1) {
      // If only one digit entered, treat as tens place (e.g., '5' -> 50)
      m = clamp((parseInt(endMinuteInput, 10) || 0) * 10, 0, 59);
    } else {
      m = clamp(parseInt(endMinuteInput, 10) || 0, 0, 59);
    }
    setEndMinuteInput(pad2(m));
    setEndTime(`${pad2(h)}:${pad2(m)}`);
  };

  // sync hour/minute inputs from base values
  useEffect(() => {
    const [h, m] = (startTime || '00:00').split(':');
    setStartHourInput(h);
    setStartMinuteInput(m);
  }, [startTime]);
  useEffect(() => {
    const [h, m] = (endTime || '23:59').split(':');
    setEndHourInput(h);
    setEndMinuteInput(m);
  }, [endTime]);

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
                  <div className="flex items-center gap-1">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-12 text-center"
                      value={startHourInput}
                      onChange={handleStartHourChange}
                      onBlur={handleStartHourBlur}
                      placeholder="00"
                    />
                    <span>:</span>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-12 text-center pr-5"
                        value={startMinuteInput}
                        onChange={handleStartMinuteChange}
                        onBlur={handleStartMinuteBlur}
                        placeholder="00"
                      />
                      {startMinuteInput !== '' && startMinuteInput.length === 1 && (
                        <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-gray-400">0</span>
                      )}
                    </div>
                  </div>
                  <Label className="my-3">
                    {firstUpperLetter(t('trips_and_stops.end_time'))}
                  </Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-12 text-center"
                      value={endHourInput}
                      onChange={handleEndHourChange}
                      onBlur={handleEndHourBlur}
                      placeholder="00"
                    />
                    <span>:</span>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-12 text-center pr-5"
                        value={endMinuteInput}
                        onChange={handleEndMinuteChange}
                        onBlur={handleEndMinuteBlur}
                        placeholder="00"
                      />
                      {endMinuteInput !== '' && endMinuteInput.length === 1 && (
                        <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-gray-400">0</span>
                      )}
                    </div>
                  </div>
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
