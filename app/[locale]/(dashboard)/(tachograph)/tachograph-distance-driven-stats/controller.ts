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
import { tachoDistanceDrivenList } from "@/models/tachograph";

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user, settings } = UserContext.models;
  const { getUserRef } = UserContext.operations;
  const [dataTachoDistanceDrivenList, setDataTachoDistanceDrivenList] =
    useState([]);
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

  const [ignoreList] = useState([{ title: t("events") }]);
  const [searchList] = useState([{ title: t("vin") }, { title: t("object_name") }]);
  const [orderList] = useState([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterData = (objects: any[]) => {
    return objects.map((obj) => {
      const newObj = { ...obj };

      if (newObj.time_from) {
        const time = format(newObj.time_from, `${dateFormat} ${timeFormat}`);
        newObj.time_from = time;
      }
      if (newObj.time_to) {
        const time = format(newObj.time_to, `${dateFormat} ${timeFormat}`);
        newObj.time_to = time;
      }

      return reorderObject(newObj, orderList);
    });
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
        };
        const dataTachoDistanceDrivenList = await tachoDistanceDrivenList(
          getUserRef().token,
          params
        );
        if (dataTachoDistanceDrivenList) {
          const dataTachoDistanceDrivenListClean = cleanObjectsColumns(
            dataTachoDistanceDrivenList
          );
          const dataTachoDistanceDrivenListFilter = filterData(
            dataTachoDistanceDrivenListClean
          );
          const dataTachoDistanceDrivenListTranslate = translateObjects(
            dataTachoDistanceDrivenListFilter,
            t,
            ["time_from", "time_to"]
          );
          setDataTachoDistanceDrivenList(dataTachoDistanceDrivenListTranslate);
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
      settings,
      isLoading,
      isGenerate,
      ignoreList,
      startDate,
      endDate,
      dataList: dataTachoDistanceDrivenList,
      searchList,
    },
    operations: {
      setStartDate,
      setEndDate,
      setGenerate,
    },
  };
};
