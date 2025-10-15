"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import {
  translateDataStructure,
  firstUpperLetter,
  reorderObject,
  cleanDataStructure,
  parseTimeString,
} from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { tachoDrivingStatList } from "@/models/tachograph";
import { objectList } from "@/models/object";
import { getTachoDriversList } from "@/models/workers";

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user, settings } = UserContext.models;
  const { getUserRef } = UserContext.operations;
  const [dataTachoDrivingStatList, setDataTachoDrivingStatList] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isGenerate, setGenerate] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [, setUnitDistance] = useState(
    settings.find((setting) => setting.title === "unit_distance")?.value
  );
  const [, setUnitVolume] = useState(
    settings.find((setting) => setting.title === "unit_volume")?.value
  );
  const [dateFormat, setDateFormat] = useState(
    settings.find((setting) => setting.title === "date_format")?.value
  );
  const [timeFormat, setTimeFormat] = useState(
    settings.find((setting) => setting.title === "time_format")?.value
  );
  const [dataObjectList, setDataObjectList] = useState(null);
  const [dataDriverList, setDataDriverList] = useState([]); // <-- add driver list state
  const [vehicles, setVehicles] = useState([]);
  const [checked, setChecked] = useState(false);
  const [ignoreList] = useState([
    { title: t("events") },
    { title: t("unknown") },
  ]);
  const [orderList] = useState([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCheckedChange = (value: any) => {
    setChecked(value);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processObject = (obj: any): any => {
    const newObj = { ...obj };
    if (newObj.date) {
      newObj.date = format(newObj.date, `${dateFormat} ${timeFormat}`);
    }
    if (newObj.is_holiday === 0) {
      newObj.is_holiday = false;
    } else if (newObj.is_holiday === 1) {
      newObj.is_holiday = true;
    }
    /*    if (newObj.available) {
      newObj.available = parseTimeString(newObj.available, t);
    }
    if (newObj.driving) {
      newObj.driving = parseTimeString(newObj.driving, t);
    }
    if (newObj.rest) {
      newObj.rest = parseTimeString(newObj.rest, t);
    }
    if (newObj.unknown) {
      newObj.unknown = parseTimeString(newObj.unknown, t);
    }
    if (newObj.working) {
      newObj.working = parseTimeString(newObj.working, t);
    } */

    Object.keys(newObj).forEach((key) => {
      const value = newObj[key];

      if (Array.isArray(value)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newObj[key] = value.map((item: any) =>
          item && typeof item === "object" ? processObject(item) : item
        );
      }
      // Si es un objeto, lo procesamos recursivamente
      else if (value && typeof value === "object") {
        newObj[key] = processObject(value);
      }
    });

    return reorderObject(newObj, orderList);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterData = (objects: any[]) => {
    return objects.map((obj) => processObject(obj));
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
          // Fetch tacho drivers
          const driverListRaw = await getTachoDriversList(getUserRef().token);
          const driverList = driverListRaw.map((driver) => ({
            ...driver,
            name: `${driver.first_name} ${driver.surname}`.trim(),
          }));
          setDataDriverList(driverList);
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
      if (!user.token || !startDate || !endDate || !isGenerate) {
        return;
      }

      try {
        toast.success(firstUpperLetter(t("processing")));
        const params = {
          date_from: format(startDate, "yyyy-MM-dd"),
          date_to: format(endDate, "yyyy-MM-dd"),
          ...(vehicles.length > 0 && { driver_ids: vehicles }),
          local_times: checked,
        };
        const dataTachoDrivingStatList = await tachoDrivingStatList(
          getUserRef().token,
          params
        );
        const dataTachoDrivingStatListClean = cleanDataStructure(
          dataTachoDrivingStatList
        );
        const dataTachoDrivingStatListFilter = filterData(
          dataTachoDrivingStatListClean
        );
        const dataTachoDrivingStatListTranslate = translateDataStructure(
          dataTachoDrivingStatListFilter,
          t,
          [
            "date",
            "driving",
            "working",
            "rest",
            "available",
            "unknown",
            "total_work",
            "night_time",
          ]
        );
        setDataTachoDrivingStatList(dataTachoDrivingStatListTranslate);
      } catch (error) {
        toast.error(firstUpperLetter(t("process_error")));
        console.error("Error fetching client info:", error);
      } finally {
        toast.success(firstUpperLetter(t("process_completed")));
        setGenerate(false);
      }
    };

    fetchData();
  }, [user.token, startDate, endDate, isGenerate, checked]);

  return {
    models: {
      user,
      settings,
      isLoading,
      isGenerate,
      ignoreList,
      startDate,
      endDate,
      dataList: dataTachoDrivingStatList,
      dataObjectList,
      dataDriverList, // <-- expose driver list
      vehicles,
      checked,
    },
    operations: {
      setStartDate,
      setEndDate,
      setGenerate,
      setVehicles,
      handleCheckedChange,
    },
  };
};
