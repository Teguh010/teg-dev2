"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import {
  translateObjects,
  cleanObjectsColumns,
  firstUpperLetter,
  reorderObject,
} from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { tachoStatusList } from "@/models/tachograph";

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user, settings } = UserContext.models;
  const { getUserRef } = UserContext.operations;
  const [dataTachoStatusList, setDataTachoStatusList] = useState([]);
  const [dataTimeline, setDataTimeline] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isGenerate, setGenerate] = useState(false);
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
  const presentList = {
    0: "data_missing",
    1: "data_ok",
    2: "data_old",
    3: "data_downloadable",
    6: "data_missing_downloadable",
    7: "data_locked",
  };

  const [ignoreList] = useState([
    { title: t("events") },
    { title: t("present") },
  ]);
  const [orderList] = useState([
    { title: t("vehicle") },
    { title: t("status") },
    { title: t("vin") },
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterData = (objects: any[]) => {
    return objects
      .filter(
        (obj) =>
          obj.time_from != null && obj.time_to != null && obj.present != null
      )
      .map((obj) => {
        const newObj = { ...obj };

        if (newObj.time_from) {
          const time = format(newObj.time_from, `${dateFormat} ${timeFormat}`);
          newObj.time_from = time;
        }
        if (newObj.time_to) {
          const time = format(newObj.time_to, `${dateFormat} ${timeFormat}`);
          newObj.time_to = time;
        }
        if (newObj.present) {
          const presentName = firstUpperLetter(presentList[newObj.present]);
          newObj["status"] = presentName;
        }

        return reorderObject(newObj, orderList);
      });
  };

  const fetchDataList = async () => {
    try {
      const params = {
        ...(startDate && { date_from: format(startDate, "yyyy-MM-dd") }),
        ...(endDate && { date_to: format(endDate, "yyyy-MM-dd") }),
      };
      const dataTachoStatusList = await tachoStatusList(
        getUserRef().token,
        params
      );
      if (dataTachoStatusList) {
        const dataTachoStatusListClean =
          cleanObjectsColumns(dataTachoStatusList);
        const dataTachoStatusListFilter = filterData(dataTachoStatusListClean);
        const groupedData = dataTachoStatusListFilter.reduce((acc, item) => {
          const { vehicle, time_from, time_to, present } = item;
          const presentName = firstUpperLetter(presentList[present]);
          if (!acc[presentName]) {
            acc[presentName] = { name: presentName, data: [] };
          }
          acc[presentName].data.push({
            x: /* "REG Nr: " +  */vehicle,
            y: [new Date(time_from).getTime(), new Date(time_to).getTime()],
          });
          return acc;
        }, {});
        const result = Object.values(groupedData);
        setDataTimeline(result);
        const dataTachoStatusListTranslate = translateObjects(
          dataTachoStatusListFilter,
          t,
          ["time_from", "time_to"]
        );
        setDataTachoStatusList(dataTachoStatusListTranslate);
      }
    } catch (error) {
      console.error("Error fetching client info:", error);
    }
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
          fetchDataList();
        } catch (error) {
          toast.error(firstUpperLetter(t("general.process_error")));
          console.error("Error fetching client info:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user.token]);

  useEffect(() => {
    if (!user.token || isGenerate) {
      fetchDataList();
      try {
        toast.success(firstUpperLetter(t("general.processing")));
        fetchDataList();
      } catch (error) {
        toast.error(firstUpperLetter(t("general.process_error")));
        console.error("Error fetching client info:", error);
      } finally {
        setGenerate(false);
        toast.success(firstUpperLetter(t("general.process_completed")));
      }
    }
  }, [user.token, isGenerate]);

  return {
    models: {
      user,
      settings,
      isLoading,
      isGenerate,
      ignoreList,
      startDate,
      endDate,
      dataList: dataTachoStatusList,
      dataTimeline,
    },
    operations: {
      setStartDate,
      setEndDate,
      setGenerate,
    },
  };
};
