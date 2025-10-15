"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { objectList, objectDistanceFuelEngineHours } from "@/models/object";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  firstUpperLetter,
  reorderObject,
  cleanObjectsColumns,
  translateObjects,
} from "@/lib/utils";
import { format } from "date-fns";

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user, settings } = UserContext.models;
  const { getUserRef } = UserContext.operations;
  const [
    dataObjectDistanceFuelEngineHours,
    setDataObjectDistanceFuelEngineHours,
  ] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isGenerate, setGenerate] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [split, setSplit] = useState(null);
  const [splitList] = useState([
    { title: t("general.no_split") },
    { title: t("general.by_days") },
    { title: t("general.by_weeks") },
    { title: t("general.by_months") },
    { title: t("general.by_years") },
  ]);
  const [, setUnitDistance] = useState(
    settings.find((setting) => setting.title === "unit_distance")?.value
  );
  const [, setUnitVolume] = useState(
    settings.find((setting) => setting.title === "unit_volume")?.value
  );
  const [dateFormat, setDateFormat] = useState(
    settings.find((setting) => setting.title === "date_format")?.value
  );
  const [, setTimeFormat] = useState(
    settings.find((setting) => setting.title === "time_format")?.value
  );
  const [dataObjectList, setDataObjectList] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [ignoreList] = useState([{ title: "id" }, { title: "objectid" }]);
  const [orderList] = useState([{ title: "object_name" }]);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterData = (objects: any[]) => {
    return objects.map((obj) => {
      const newObj = { ...obj };

      if (newObj.date) {
        const time = format(newObj.date, `${dateFormat}`);
        newObj.date = time;
      }

      return reorderObject(newObj, orderList);
    });
  };

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
      if (!user.token || !startDate || !endDate || !isGenerate) {
        return;
      }

      try {
        toast.success(firstUpperLetter(t("processing")));
        let splitNumber: number;
        switch (split) {
          case t("general.by_days"):
            splitNumber = 1;
            break;
          case t("general.by_weeks"):
            splitNumber = 2;
            break;
          case t("general.by_months"):
            splitNumber = 3;
            break;
          case t("general.by_years"):
            splitNumber = 4;
            break;
          default:
            splitNumber = 0;
            break;
        }
        const params = {
          time_from: format(startDate, "yyyy-MM-dd HH:mm:ss"),
          time_to: format(endDate, "yyyy-MM-dd HH:mm:ss"),
          ...(vehicles.length > 0 && { object_ids: vehicles }),
          split_by: splitNumber,
        };
        const dataObjectDistanceFuelEngineHours =
          await objectDistanceFuelEngineHours(getUserRef().token, params);
        if (dataObjectDistanceFuelEngineHours) {
          const dataObjectDistanceFuelEngineHoursClean = cleanObjectsColumns(
            dataObjectDistanceFuelEngineHours.data
          );
          const dataObjectDistanceFuelEngineHoursFilter = filterData(
            dataObjectDistanceFuelEngineHoursClean
          );
          const dataObjectDistanceFuelEngineHoursTranslate = translateObjects(
            dataObjectDistanceFuelEngineHoursFilter,
            t,
            ["date"]
          );
          setDataObjectDistanceFuelEngineHours(
            dataObjectDistanceFuelEngineHoursTranslate
          );
        }
      } catch (error) {
        toast.error(firstUpperLetter(t("process_error")));
        console.error("Error fetching client info:", error);
      } finally {
        toast.success(firstUpperLetter(t("process_completed")));
        setGenerate(false);
      }
    };

    fetchData();
  }, [user.token, startDate, endDate, isGenerate]);

  return {
    models: {
      user,
      isLoading,
      dataObjectList,
      dataList: dataObjectDistanceFuelEngineHours,
      ignoreList,
      objectList: objectList || [],
      isGenerate,
      startDate,
      endDate,
      settings,
      split,
      splitList,
    },
    operations: {
      setGenerate,
      setVehicles,
      setStartDate,
      setEndDate,
      setSplit,
    },
  };
};
