"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import {
  firstUpperLetter,
  reorderObject,
  cleanDataStructure,
  translateDataStructure,
} from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { tachoFaultsList } from "@/models/tachograph";

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user, settings } = UserContext.models;
  const { getUserRef } = UserContext.operations;
  const [dataTachoFaultsListLocked, setDataTachoFaultsListLocked] = useState(
    []
  );
  const [dataTachoFaultsListNotLocked, setDataTachoFaultsListNotLocked] =
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
  const [, setDateFormat] = useState(
    settings.find((setting) => setting.title === "date_format")?.value
  );
  const [, setTimeFormat] = useState(
    settings.find((setting) => setting.title === "time_format")?.value
  );

  const [ignoreList] = useState([
    { title: t("events") },
    { title: t("faults") },
  ]);
  const [treeList] = useState([{ title: t("events") }, { title: t("faults") }]);
  const [orderList] = useState([
    { title: "vin" },
    { title: "registration_number" },
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterData = (objects: any[]) => {
    const dataTachoFaultsLockedListFilter = [];
    const dataTachoFaultsNotLockedListFilter = [];

    objects.forEach((obj) => {
      const newObj = { ...obj };
      if (newObj.faults || newObj.events) {
        const reorderedObj = reorderObject(newObj, orderList);
        if (newObj.not_locked) {
          dataTachoFaultsNotLockedListFilter.push(reorderedObj);
        } else {
          dataTachoFaultsLockedListFilter.push(reorderedObj);
        }
      }
    });

    return {
      dataTachoFaultsLockedListFilter,
      dataTachoFaultsNotLockedListFilter,
    };
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
        toast.success(firstUpperLetter(t("general.processing")));
        const params = {
          time_from: format(startDate, "yyyy-MM-dd HH:mm:ss"),
          time_to: format(endDate, "yyyy-MM-dd HH:mm:ss"),
        };
        const dataTachoFaultsList = await tachoFaultsList(
          getUserRef().token,
          params
        );
        if (dataTachoFaultsList) {
          const dataTachoFaultsListClean = cleanDataStructure(
            dataTachoFaultsList[0]
          );
          const {
            dataTachoFaultsLockedListFilter,
            dataTachoFaultsNotLockedListFilter,
          } = filterData(dataTachoFaultsListClean);
          const dataTachoFaultsListLokedTranslate = translateDataStructure(
            dataTachoFaultsLockedListFilter,
            t,
            ["last_download", "tacho_lock_time", "began", "ended"]
          );
          setDataTachoFaultsListLocked(dataTachoFaultsListLokedTranslate);
          const dataTachoFaultsListNotLokedTranslate = translateDataStructure(
            dataTachoFaultsNotLockedListFilter,
            t,
            ["last_download", "tacho_lock_time", "began", "ended"]
          );
          setDataTachoFaultsListNotLocked(dataTachoFaultsListNotLokedTranslate);
        }
      } catch (error) {
        toast.error(firstUpperLetter(t("general.process_error")));
        console.error("Error fetching client info:", error);
      } finally {
        toast.success(firstUpperLetter(t("general.process_completed")));
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
      dataListLocked: dataTachoFaultsListLocked,
      dataListNotLocked: dataTachoFaultsListNotLocked,
      treeList,
    },
    operations: {
      setStartDate,
      setEndDate,
      setGenerate,
    },
  };
};
