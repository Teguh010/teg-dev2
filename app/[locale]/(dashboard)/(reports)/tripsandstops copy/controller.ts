"use client";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import { objectList, objectTripStop } from "@/models/object";
import {
  translateObjects,
  cleanObjectsColumns,
  fetchAddresses,
  firstUpperLetter,
  parseTimeString,
  convertUnitDistance,
  convertUnitVolume,
  reorderObject,
} from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TripOnly } from "./types";
import toast from "react-hot-toast";
import { generateTripStopPDF } from "@/lib/pdfGenerator";

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user, settings } = UserContext.models;
  const { getUserRef } = UserContext.operations;
  const [dataObjectTripStop, setDataObjectTripStop] = useState([]);
  const [dataObjectTripStopTotals, setDataObjectTripStopTotals] = useState({});
  const [dataObjectList, setDataObjectList] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dataObjectTripStopClean, setDataObjectTripStopClean] = useState(null);
  const [isGenerate, setGenerate] = useState(null);
  const [isRefresh, setRefresh] = useState(true);
  const [isLoading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [minMoving, setMinMoving] = useState(null);
  const [minStationary, setMinStationary] = useState(null);
  const [tripMode, setTripMode] = useState(null);
  const [dataTimeline, setDataTimeline] = useState([]);
  const [unitDistance, setUnitDistance] = useState(
    settings.find((setting) => setting.title === "unit_distance")?.value
  );
  const [unitVolume, setUnitVolume] = useState(
    settings.find((setting) => setting.title === "unit_volume")?.value
  );
  const [dateFormat, setDateFormat] = useState(
    settings.find((setting) => setting.title === "date_format")?.value
  );
  const [timeFormat, setTimeFormat] = useState(
    settings.find((setting) => setting.title === "time_format")?.value
  );

  const defaultReportType = t("general.trip_only");
  const [reportType, setReportType] = useState(defaultReportType);
  const [reportTypeList] = useState([
    { title: t("general.trip_only") },
    { title: t("general.stop_only") },
    { title: t("general.trip_and_stop") },
  ]);
  const [searchList] = useState([
    /* { title: "state" }, */
  ]);
  const [ignorePreList] = useState([
    { title: t("general.lat_from") },
    { title: t("general.lon_from") },
    { title: t("general.lat_to") },
    { title: t("general.lon_to") },
    { title: t("general.lat") },
    { title: t("general.lon") },
    { title: t("general.next_lat") },
    { title: t("general.next_lon") },
    { title: t("general.avg_speed") },
    { title: t("general.address_from") },
    { title: t("general.address_to") },
    { title: t("general.fuel_used") },
    { title: t("general.fuel_km") },
    { title: t("general.route") },
  ]);
  const ignoreList = useMemo(() => {
    const baseList = [...ignorePreList];
    if (reportType === t("general.trip_only")) {
      baseList.push({ title: t("general.address") });
      baseList.push({ title: t("general.next_address") });
    } else if (reportType === t("general.stop_only")) {
      baseList.push({ title: t("general.from") });
      baseList.push({ title: t("general.to") });
      baseList.push({ title: t("general.next_address") });
      baseList.push({ title: t("general.distance_(km)") });
      baseList.push({ title: t("general.distance_(mi)") });
      baseList.push({ title: t("general.distance_(swedish_mi)") });
      baseList.push({ title: t("general.fuel_used_(l)") });
      baseList.push({ title: t("general.fuel_used_(gal)") });
    } else if (reportType === t("general.trip_and_stop")) {
      baseList.push({ title: t("general.address") });
      baseList.push({ title: t("general.next_address") });
    }
    return baseList;
  }, [ignorePreList, isGenerate]);
  const [styleColumnList] = useState([
    /* {
            title: t('state'),
            value: (val: any = undefined) => val && "sticky left-0 bg-white z-10"
        }, */
  ]);
  const [groupList] = useState([
    {
      title: t("general.state"),
      values: [
        {
          value: t("general.stationary"),
          label: firstUpperLetter(t("general.stationary")),
        },
        {
          value: t("general.moving"),
          label: firstUpperLetter(t("general.moving")),
        },
        {
          value: t("general.stationary_with_ignition"),
          label: firstUpperLetter(t("general.stationary_with_ignition")),
        },
      ],
    },
  ]);
  const [orderListData] = useState([
    { title: "general.state" },
    { title: "general.from" },
    { title: "general.to" },
    { title: "general.address" },
    { title: "general.next_address" },
    { title: "general.time_from" },
    { title: "general.time_to" },
    { title: "general.duration" },
    { title: `general.distance_(km)` },
    { title: `general.distance_(mi)` },
    { title: `general.distance_(swedish_mi)` },
    { title: `general.fuel_used_(l)` },
    { title: `general.fuel_used_(gal)` },
    { title: `general.avg_speed_(km)` },
    { title: `general.avg_speed_(mi)` },
    { title: `general.avg_speed_(swedish_mi)` },
    { title: `general.fuel/km` },
    { title: `general.fuel/mi` },
    { title: `general.fuel/swedish_mi` },
  ]);
  const [orderListTotals] = useState([
    { title: "general.object_name" },
    { title: "general.moving_time" },
    { title: `general.distance_(km)` },
    { title: `general.distance_(mi)` },
    { title: `general.distance_(swedish_mi)` },
    { title: `general.fuel_used_(l)` },
    { title: `general.fuel_used_(gal)` },
    { title: `general.avg_speed_(km)` },
    { title: `general.avg_speed_(mi)` },
    { title: `general.avg_speed_(swedish_mi)` },
    { title: `general.fuel/km` },
    { title: `general.fuel/mi` },
    { title: `general.fuel/swedish_mi` },
  ]);
  const [actionList] = useState([
    { title: t("general.state") },
    { title: t("general.from") },
    { title: t("general.to") },
    { title: t("general.address") },
/*     { title: t("general.time_from") },
    { title: t("general.time_to") }, */
  ]);
  const stateTimelineList = {
    0: "moving",
    1: "stationary",
    2: "stationary with ignition",
  };

  const defaultTrip: TripOnly = {
    address_from: "",
    address_to: "",
    route: "",
    lat_from: "",
    lon_from: "",
    lat_to: "",
    lon_to: "",
    time_from: "",
    time_to: "",
    duration: "00:00:00",
    stop_time: "00:00:00",
    distance: "0",
    avg_speed: 0,
    fuel_used: "0",
  };

  const addDistances = (distance1: string, distance2: string): string => {
    const distance1Number = parseFloat(distance1);
    const distance2Number = parseFloat(distance2);

    return (distance1Number + distance2Number).toFixed(3);
  };

  const addFuels = (fuel1: string, fuel2: string): string => {
    const distance1Number = parseFloat(fuel1);
    const distance2Number = parseFloat(fuel2);

    return (distance1Number + distance2Number).toFixed(3);
  };

  const parseDuration = (duration: string): number => {
    const daysMatch = duration.match(/(\d+) day(?:s)? /);
    const timeMatch = duration.match(/(\d+):(\d+):(\d+)/);

    let days = 0;
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if (daysMatch) {
      days = parseInt(daysMatch[1], 10);
    }

    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
      seconds = parseInt(timeMatch[3], 10);
    }

    // Convert total to seconds
    return days * 24 * 3600 + hours * 3600 + minutes * 60 + seconds;
  };

  const secondsToDuration = (totalSeconds: number): string => {
    const days = Math.floor(totalSeconds / (24 * 3600));
    totalSeconds %= 24 * 3600;
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    let duration = "";
    if (days > 0) {
      duration += `${days} day${days > 1 ? "s" : ""} `;
    }
    duration += `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;

    return duration.trim();
  };

  const addDurations = (duration1: string, duration2: string): string => {
    const seconds1 = parseDuration(duration1);
    const seconds2 = parseDuration(duration2);
    const totalSeconds = seconds1 + seconds2;

    return secondsToDuration(totalSeconds);
  };

  const processTripsOnly = (objects: any[]): TripOnly[] => {
    const result: TripOnly[] = [];
    let tempTrip = { ...defaultTrip };

    const updateTrip = (trip: TripOnly, object: any, isMoving: boolean) => {
      if (isMoving) {
        if (!trip.address_from) {
          Object.assign(trip, {
            address_from: object.address,
            lat_from: object.lat,
            lon_from: object.lon,
            lat_to: object.next_lat,
            lon_to: object.next_lon,
            time_from: object.time_from,
            time_to: object.time_to,
          });
        }
        trip.address_to = object.address;
      }
      trip.duration = addDurations(trip.duration, object.duration);
      trip.distance = addDistances(trip.distance, object.distance);
      trip.avg_speed =
        trip.avg_speed !== null && object.avg_speed !== null
          ? (trip.avg_speed + object.avg_speed) / 2
          : trip.avg_speed;
      trip.fuel_used = addFuels(trip.fuel_used, object.fuel_used);
      return trip;
    };

    objects.forEach((object, index) => {
      const isStationary = object.state === "stationary";
      const isStationaryWithIgnition =
        object.state === "stationary with ignition";
      const isMoving = object.state === "moving";

      if (isStationary && index === 0) {
        tempTrip.distance = addDistances(tempTrip.distance, object.distance);
        tempTrip.fuel_used = addFuels(tempTrip.fuel_used, object.fuel_used);
      } else if (isStationaryWithIgnition) {
        tempTrip.distance = addDistances(tempTrip.distance, object.distance);
        tempTrip.stop_time = addDurations(tempTrip.stop_time, object.duration);
        tempTrip.fuel_used = addFuels(tempTrip.fuel_used, object.fuel_used);
      } else if (isMoving) {
        tempTrip = updateTrip(tempTrip, object, true);
      } else if (isStationary && index > 0) {
        tempTrip.address_to = object.address;
        tempTrip.distance = addDistances(tempTrip.distance, object.distance);
        tempTrip.stop_time = addDurations(tempTrip.stop_time, object.duration);
        tempTrip.fuel_used = addFuels(tempTrip.fuel_used, object.fuel_used);
        tempTrip.route = tempTrip.address_from + "<br />" + tempTrip.address_to;
        result.push(tempTrip);
        tempTrip = { ...defaultTrip };
      }
    });

    if (tempTrip.address_to) {
      tempTrip.route = tempTrip.address_from + " - " + tempTrip.address_to;
      result.push(tempTrip);
    }

    return result;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exportReportPDF = (table: any, totals: any = null) => {
    toast.success(firstUpperLetter(t("general.processing")));
    const doc = new jsPDF({ putOnlyUsedFonts: true, orientation: "landscape" });

    const visibleColumns = table.getVisibleFlatColumns().map((col: any) => ({
      id: col.id,
      header: firstUpperLetter(t(col.id)),
      width: "auto",
    }));

    const data = table.getRowModel().rows.map((row: any) => {
      return row.getVisibleCells().reduce((acc: any, cell: any) => {
        if (String(cell.getValue()).includes("<br />")) {
          const address = cell.getValue().split("<br />");
          acc[cell.column.id] = address[0] + "\n" + address[1];
        } else {
          acc[cell.column.id] = String(cell.getValue());
        }
        return acc;
      }, {});
    });
    const translate = (key: string) => t(key as any);

    generateTripStopPDF({
      doc,
      data,
      totals,
      t: translate,
      columns: visibleColumns,
    });

    doc.save(t("general.trip_and_stop") + ".pdf");
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exportReportCSV = (table: any, totals: any = null) => {
    toast.success(firstUpperLetter(t("general.processing")));

    let headers: string[] = [];
    const rows: string[][] = [];

    table.getHeaderGroups().forEach((headerGroup: any) => {
      const headerRow = headerGroup.headers.map(
        (header: any) => header.getContext().header.id
      );
      headers = headerRow;
    });

    table.getRowModel().rows.forEach((row: any) => {
      const rowData = row.getVisibleCells().map((cell: any) => {
        const value = String(cell.getContext().getValue());
        if (value.includes("<br />")) {
          const address = value.split("<br />");
          return address[0] + " " + address[1];
        }
        return value;
      });
      rows.push(rowData);
    });

    let csvContent = headers.join(",") + "\n";
    rows.forEach((row) => {
      csvContent += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupDataByDayAndState = (data: any) => {
    // Verificamos que startDate y endDate estén definidos
    if (!startDate || !endDate) {
      return {};
    }

    const groupedData = {};

    // Generamos una lista de días entre startDate y endDate (inclusive)
    const days = [];
    const current = new Date(startDate);
    const endDay = new Date(endDate);
    while (current <= endDay) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Recorremos cada elemento del dataset
    data.forEach((item) => {
      const { time_from, time_to, state } = item;
      const stateDesc = state;
      const itemStart = new Date(time_from);
      const itemEnd = new Date(time_to);

      // Para cada día de la lista, comprobamos si el registro se solapa
      days.forEach((day) => {
        // Definimos el inicio y fin del día (00:00 y 23:59:59.999)
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        // Verificamos si hay solapamiento entre el rango del registro y el día actual
        if (itemEnd >= dayStart && itemStart <= dayEnd) {
          // Calculamos la intersección
          const segmentStart = new Date(
            Math.max(itemStart.getTime(), dayStart.getTime())
          );
          const segmentEnd = new Date(
            Math.min(itemEnd.getTime(), dayEnd.getTime())
          );

          // Extraemos la hora (parte entera) del segmento
          const startHour = segmentStart.getHours();
          const endHour = segmentEnd.getHours();

          // Inicializamos el grupo por estado si no existe
          if (!groupedData[stateDesc]) {
            groupedData[stateDesc] = { name: state, data: [] };
          }

          // Usamos el día formateado (por ejemplo, "YYYY-MM-DD") como eje X
          const dayKey = day.toISOString().split("T")[0];

          groupedData[stateDesc].data.push({
            x: dayKey,
            y: [startHour, endHour],
          });
        }
      });
    });

    return groupedData;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterData = (objects: any[]) => {
    return objects.map((obj) => {
      const newObj = { ...obj };
      if (newObj.address && newObj.next_address && newObj.state === "moving") {
        const route = newObj.address + "<br />" + newObj.next_address;
        newObj.route = route;
      }
      if (newObj.time_from) {
        const time = format(newObj.time_from, `${dateFormat} ${timeFormat}`);
        newObj.time_from = String(time);
      }
      if (newObj.time_to) {
        const time = format(newObj.time_to, `${dateFormat} ${timeFormat}`);
        newObj.time_to = time;
      }
      if (newObj.duration) {
        newObj.duration = parseTimeString(newObj.duration, t);
      }
      if (newObj.distance) {
        newObj[`distance_(${unitDistance})`] = convertUnitDistance(
          Number(newObj.distance),
          unitDistance,
          t
        );
        delete newObj.distance;
      }
      if (newObj.fuel_used) {
        newObj[`fuel_used_(${unitVolume})`] = convertUnitVolume(
          Number(newObj.fuel_used),
          unitVolume,
          t
        );
        delete newObj.fuel_used;
      }
      if (newObj.avg_speed) {
        newObj[`avg_speed_(${unitDistance})`] = convertUnitDistance(
          Number(newObj.avg_speed),
          unitDistance,
          t
        );
        delete newObj.avg_speed;
      }
      if (newObj.fuel_km) {
        newObj[`fuel/${unitDistance}`] = convertUnitVolume(
          Number(newObj.fuel_km),
          unitVolume,
          t
        );
        delete newObj.fuel_km;
      }

      return reorderObject(newObj, orderListData);
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterTotals = (objects: any) => {
    const newObj = { ...objects };

    if (newObj.moving_time) {
      newObj.moving_time = parseTimeString(newObj.moving_time, t);
    }
    if (newObj.stationary_time) {
      newObj.stationary_time = parseTimeString(newObj.stationary_time, t);
    }
    if (newObj.moving_time_job) {
      newObj.moving_time_job = parseTimeString(newObj.moving_time_job, t);
    }
    if (newObj.stationary_time_job) {
      newObj.stationary_time_job = parseTimeString(
        newObj.stationary_time_job,
        t
      );
    }
    if (newObj.moving_time_private) {
      newObj.moving_time_private = parseTimeString(
        newObj.moving_time_private,
        t
      );
    }
    if (newObj.stationary_time_private) {
      newObj.stationary_time_private = parseTimeString(
        newObj.stationary_time_private,
        t
      );
    }
    if (newObj.distance) {
      newObj[`distance_(${unitDistance})`] = convertUnitDistance(
        Number(newObj.distance),
        unitDistance,
        t
      );
      delete newObj.distance;
    }
    if (newObj.fuel_used) {
      newObj[`fuel_used_(${unitVolume})`] = convertUnitVolume(
        Number(newObj.fuel_used),
        unitVolume,
        t
      );
      delete newObj.fuel_used;
    }
    if (newObj.avg_speed) {
      newObj[`avg_speed_(${unitDistance})`] = convertUnitDistance(
        Number(newObj.avg_speed),
        unitDistance,
        t
      );
      delete newObj.avg_speed;
    }
    if (newObj.fuel_km) {
      newObj[`fuel/${unitDistance}`] = convertUnitVolume(
        Number(newObj.fuel_km),
        unitVolume,
        t
      );
      delete newObj.fuel_km;
    }

    return reorderObject(newObj, orderListTotals);
  };

  useEffect(() => {
    if (settings.length > 0) {
      settings.map((setting) => {
        if (setting.title === "time_format") {
          setTimeFormat(setting.value);
        }
        if (setting.title === "unit_distance") {
          setUnitDistance(setting.value);
        }
        if (setting.title === "unit_volume") {
          setUnitVolume(setting.value);
        }
        if (setting.title === "date_format") {
          setDateFormat(setting.value);
        }
      });
    }
  }, [settings]);

  useEffect(() => {
    const fetchData = async () => {
      if (user.token) {
        try {
          const dataObjectList = await objectList(getUserRef().token);
          setDataObjectList(dataObjectList);
        } catch (error) {
          console.error("Error fetching client info:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user.token]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user.token || !vehicle || !startDate || !endDate || !isGenerate) {
        return;
      }

      try {
        toast.success(firstUpperLetter(t("general.processing")));
        const tripsStops =
          reportType === t("general.trip_only")
            ? 1
            : reportType === t("general.stop_only")
            ? 2
            : 3;
        const params = {
          object_id: vehicle,
          time_from: format(startDate, "yyyy-MM-dd HH:mm:ss"),
          time_to: format(endDate, "yyyy-MM-dd HH:mm:ss"),
          trips_stops: tripsStops,
          ...(minMoving && { min_moving: Number(minMoving) }),
          ...(minStationary && { min_stationary: Number(minStationary) }),
          ...(tripMode && { trip_mode: Number(tripMode) }),
          ...(schedules && schedules.length > 0 && { time_ranges: schedules }),
        };
        const dataObjectTripStop = await objectTripStop(
          getUserRef().token,
          params
        );
        const dataObjectTripStopAddresses = await fetchAddresses(
          getUserRef().token,
          dataObjectTripStop.data
        );
        const dataObjectTripStopClean = cleanObjectsColumns(
          dataObjectTripStopAddresses
        );
        setDataObjectTripStopClean(dataObjectTripStopClean);
        // data totals
        if (dataObjectTripStop.totals) {
          const dataObjectTripStopFilters = filterTotals(
            dataObjectTripStop.totals
          );
          const dataObjectTripTranslate = translateObjects(
            [dataObjectTripStopFilters],
            t,
            ["moving_time", "stationary_time"]
          );
          setDataObjectTripStopTotals(dataObjectTripTranslate);
        }
        const dataObjectTripStopFilters = filterData(dataObjectTripStopClean);
        const dataObjectByDayAndState = groupDataByDayAndState(
          dataObjectTripStopFilters
        );
        setDataTimeline(Object.values(dataObjectByDayAndState));
        // translate data
        const dataObjectTripTranslate = translateObjects(
          dataObjectTripStopFilters,
          t,
          ["duration"]
        );
        setDataObjectTripStop(dataObjectTripTranslate);
      } catch (error) {
        toast.error(firstUpperLetter(t("general.process_error")));
        console.error("Error fetching client info:", error);
      } finally {
        toast.success(firstUpperLetter(t("general.process_completed")));
        setGenerate(false);
        setRefresh(false);
      }
    };

    fetchData();
  }, [user.token, vehicle, startDate, endDate, isGenerate, reportType]);

  /*     useEffect(() => {
            const fetchData = async () => {
                const tripsStops = reportType === t('trip_only') ? 1 : reportType === t('stop_only') ? 2 : 3;
    
                if (!dataObjectTripStopClean) {
                    return;
                }
                if (reportType === t('trip_only')) {
                    const dataObjectTripOnly = processTripsOnly(dataObjectTripStopClean);
                    const dataObjectTripStopFilters = filterData(dataObjectTripOnly);
                    const dataObjectTripTranslate = translateObjects(dataObjectTripStopFilters, t);
                    setDataObjectTripStop(dataObjectTripTranslate);
                }
                else if (reportType === t('stop_only')) {
                    const dataObjectTripStopFilters = filterData(dataObjectTripStopClean);
                    const dataObjectTripTranslate = translateObjects(dataObjectTripStopFilters, t);
                    setDataObjectTripStop(dataObjectTripTranslate);
                }
                else {
                    const dataObjectTripStopFilters = filterData(dataObjectTripStopClean);
                    const dataObjectTripTranslate = translateObjects(dataObjectTripStopFilters, t);
                    setDataObjectTripStop(dataObjectTripTranslate);
                } 
            };
    
            fetchData();
        }, [reportType, dataObjectTripStopClean]); */

  return {
    models: {
      user,
      settings,
      isLoading,
      isGenerate,
      isRefresh,
      dataObjectList,
      dataObjectTripStop,
      ignoreList,
      styleColumnList,
      searchList,
      groupList,
      vehicle,
      startDate,
      endDate,
      dataObjectTripStopTotals,
      defaultReportType,
      reportType,
      reportTypeList,
      schedules,
      minMoving,
      minStationary,
      tripMode,
      actionList,
      dataTimeline,
    },
    operations: {
      setVehicle,
      setStartDate,
      setEndDate,
      setGenerate,
      translateObjects,
      exportReportPDF,
      setReportType,
      setSchedules,
      setMinMoving,
      setMinStationary,
      setTripMode,
      exportReportCSV,
    },
  };
};
