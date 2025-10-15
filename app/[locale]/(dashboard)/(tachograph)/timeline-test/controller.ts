"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { objectList, objectValidRawMessage } from "@/models/object";
import {
  cleanObjectsColumns,
  firstUpperLetter,
  reorderObject,
  sortArray,
} from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { datatypeList } from "@/models/datatype";

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user, settings } = UserContext.models;
  const { getUserRef } = UserContext.operations;
  const [dataValidRawMessages, /* setDataValidRawMessages */] = useState([]);
  const [dataObjectList, setDataObjectList] = useState(null);
  const [dataDatatypeList, setDataDatatypeList] = useState(null);
  const [numberRows, setNumberRows] = useState(1000);
  const [vehicle, setVehicle] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isGenerate, setGenerate] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [ioIdsFilter, setIoIdsFilter] = useState([]);
  const [dataTimeline, setDataTimeline] = useState([]);
  const [yLengthTimeline, setyLengthTimeline] = useState(null);
  const stateListTimeline = {
    0: t("general.rest"),
    1: t("general.driver_available"),
    2: t("general.work"),
    3: t("general.drive"),
    6: t("general.error"),
    7: t("general.not_available"),
  };
  const colorCodeTimeline = [
    { [firstUpperLetter(t("general.not_available"))]: "#000000" },
    { [firstUpperLetter(t("general.drive"))]: "#ff0813" },
    { [firstUpperLetter(t("general.work"))]: "#05df72" },
    { [firstUpperLetter(t("general.rest"))]: "#808080" },
    { [firstUpperLetter(t("general.driver_available"))]: "#00bcff" },
    { [firstUpperLetter(t("general.error"))]: "#ffdf20" },
  ];
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
  const [searchList] = useState([
    /* { title: "state" }, */
  ]);
  const [ignoreList] = useState([
    { title: t("msg_data") },
    { title: t("invalid_data") },
  ]);
  const [groupList] = useState([
    {
      title: t("state"),
      values: [
        {
          value: t("general.stationary"),
          label: firstUpperLetter(t("general.stationary")),
        },
        {
          value: t("moving"),
          label: firstUpperLetter(t("moving")),
        },
        {
          value: t("general.stationary_with_ignition"),
          label: firstUpperLetter(t("general.stationary_with_ignition")),
        },
      ],
    },
  ]);
  const [orderList] = useState([{ title: "gpstime" }, { title: "trip_state" }]);
  const [styleRowList] = useState([
    {
      title: t("ignition"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: (val: any = undefined) => val === true && "bg-green-100",
    },
  ]);
  const [styleColumnList] = useState([
    {
      title: t("gpstime"),

      header: (/* val: any = undefined */) =>
        "sticky left-0 top-0 bg-default-300",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: (val: any = undefined) =>
        `sticky left-0 z-10 ${val === true ? "bg-green-100" : "bg-white"}`,
    },
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupDataByDayAndState = (data: any) => {
    const segments: { state: number; start: Date; end: Date }[] = [];
    let currentSegment: { state: number; start: Date; end: Date } | null = null;
    let baseDate: Date | null = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.forEach((item: any) => {
      const state = Number(item["(tacho)_first_driver_state"]);
      const gpstime = new Date(item.gpstime);

      if (!currentSegment) {
        currentSegment = { state, start: gpstime, end: gpstime };
        if (!baseDate) {
          baseDate = new Date(gpstime);
          baseDate.setHours(0, 0, 0, 0);
        }
      } else {
        if (state === currentSegment.state) {
          currentSegment.end = gpstime;
        } else {
          segments.push(currentSegment);
          currentSegment = { state, start: gpstime, end: gpstime };
        }
      }
    });
    if (currentSegment) {
      segments.push(currentSegment);
    }

    if (!baseDate && segments.length > 0) {
      baseDate = new Date(segments[0].start);
      baseDate.setHours(0, 0, 0, 0);
    }

    const applyBaseDay = (original: Date, base: Date): number => {
      const newDate = new Date(base);
      newDate.setHours(
        original.getHours(),
        original.getMinutes(),
        original.getSeconds(),
        original.getMilliseconds()
      );
      return newDate.getTime();
    };
    const dayList = [];
    const groupedData = segments.reduce((acc, item) => {
      const { start, end, state } = item;
      const stateName = firstUpperLetter(stateListTimeline[state]);
      if (!acc[stateName]) {
        acc[stateName] = { name: stateName, data: [] };
      }

      const startDayStr = start.toLocaleDateString();
      const endDayStr = end.toLocaleDateString();
      dayList.push(startDayStr);
      dayList.push(endDayStr);
      if (startDayStr === endDayStr) {
        acc[stateName].data.push({
          x: startDayStr,
          y: [applyBaseDay(start, baseDate!), applyBaseDay(end, baseDate!)],
        });
      } else {
        const endOfStartDay = new Date(start);
        endOfStartDay.setHours(23, 59, 59, 999);
        acc[stateName].data.push({
          x: startDayStr,
          y: [
            applyBaseDay(start, baseDate!),
            applyBaseDay(endOfStartDay, baseDate!),
          ],
        });

        const startOfEndDay = new Date(end);
        startOfEndDay.setHours(0, 0, 0, 0);
        acc[stateName].data.push({
          x: endDayStr,
          y: [
            applyBaseDay(startOfEndDay, baseDate!),
            applyBaseDay(end, baseDate!),
          ],
        });
      }

      return acc;
    }, {});

    return {
      data: Object.values(groupedData),
      yLength: [...new Set(dayList)].length,
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterData = (objects: any[]) => {
    return objects.map((obj) => {
      const newObj = { ...obj };
      if (newObj["(input)_ignition"] === "0") {
        newObj["(input)_ignition"] = false;
      }
      if (newObj["(input)_ignition"] === "1") {
        newObj["(input)_ignition"] = true;
      }
      if (newObj["ignition"] === "off") {
        newObj["ignition"] = false;
      }
      if (newObj["ignition"] === "on") {
        newObj["ignition"] = true;
      }
      if (newObj["gpstime"]) {
        const time = format(newObj["gpstime"], `${dateFormat} ${timeFormat}`);
        newObj["gpstime"] = String(time);
      }
      /*if (newObj.time_to) {
                newObj.time_to = format(newObj.time_to, `${dateFormat} ${timeFormat}`);
            }
            if (newObj.duration) {
                newObj.duration = parseTimeString(newObj.duration, t);
            }
            if (newObj.distance) {
                newObj[`distance_(${unitDistance})`] = convertUnitDistance(Number(newObj.distance), unitDistance, t);
                delete newObj.distance;
            }
            if (newObj.fuel_used) {
                newObj[`fuel_used_(${unitVolume})`] = convertUnitVolume(Number(newObj.fuel_used), unitVolume, t);
                delete newObj.fuel_used;
            }
            if (newObj.avg_speed) {
                newObj[`avg_speed_(${unitDistance})`] = convertUnitDistance(Number(newObj.avg_speed), unitDistance, t);
                delete newObj.avg_speed;
            }
            if (newObj.fuel_km) {
                newObj[`fuel/${unitDistance}`] = convertUnitVolume(Number(newObj.fuel_km), unitVolume, t);
                delete newObj.fuel_km;
            }
            if (newObj.route) {
                newObj.route = newObj.route;
            } */

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
          const dataObjectList = await objectList(getUserRef().token);
          setDataObjectList(dataObjectList);
          const dataDatatypeList = await datatypeList(getUserRef().token);
          setDataDatatypeList(dataDatatypeList);
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
        const params = {
          object_id: vehicle,
          time_from: format(startDate, "yyyy-MM-dd HH:mm:ss"),
          time_to: format(endDate, "yyyy-MM-dd HH:mm:ss"),
          ...(ioIdsFilter.length > 0 && { io_ids_filter: ioIdsFilter }),
        };
        const dataValidRawMessages = sortArray(
          await objectValidRawMessage(getUserRef().token, params),
          "gpstime",
          "desc"
        );
        const mergedData = dataValidRawMessages
          ?.slice(/* 0, numberRows */)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((dataValidRawMessage: any) => {
            if (dataValidRawMessage?.msg_data) {
              const msg_data = Object.keys(dataValidRawMessage.msg_data).map(
                (key) => [key, dataValidRawMessage.msg_data[key]]
              );
              if (msg_data.length > 0) {
                const updatedMsgData = msg_data.map((msg) => {
                  const nameMsg = dataDatatypeList.find(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (item: any) => String(item.id) === String(msg[0])
                  );
                  if (nameMsg && nameMsg.name) {
                    return [...msg, nameMsg.name];
                  } else {
                    return msg;
                  }
                });
                updatedMsgData.forEach(([, value, name]) => {
                  const transformedName = name
                    .replace(/\s+/g, "_")
                    .toLowerCase();
                  dataValidRawMessage[transformedName] = value;
                });
              }
            }
            return dataValidRawMessage;
          });
        const dataValidRawMessagesClean = cleanObjectsColumns(mergedData);
        const dataValidRawMessagesFilters = filterData(
          dataValidRawMessagesClean
        );
        /* const dataValidRawMessagesTranslate = await translateObjects(
          dataValidRawMessagesFilters.slice(0, numberRows),
          t,
          ["gpstime"]
        ); */
        /* setDataValidRawMessages(dataValidRawMessagesTranslate); */
        const dataObjectByDay = groupDataByDayAndState(
          dataValidRawMessagesFilters
        );
        setDataTimeline(dataObjectByDay.data);
        setyLengthTimeline(dataObjectByDay.yLength);
      } catch (error) {
        toast.error(firstUpperLetter(t("general.process_error")));
        console.error("Error fetching client info:", error);
      } finally {
        toast.success(firstUpperLetter(t("general.process_completed")));
        setGenerate(false);
      }
    };

    fetchData();
  }, [user.token, vehicle, startDate, endDate, isGenerate]);

  return {
    models: {
      user,
      settings,
      isLoading,
      isGenerate,
      dataObjectList,
      dataValidRawMessages,
      ignoreList,
      searchList,
      groupList,
      vehicle,
      startDate,
      endDate,
      ioIdsFilter,
      datatypeList: dataDatatypeList,
      styleRowList,
      numberRows,
      styleColumnList,
      dataTimeline,
      yLengthTimeline,
      colorCodeTimeline,
    },
    operations: {
      setVehicle,
      setStartDate,
      setEndDate,
      setGenerate,
      setIoIdsFilter,
      setNumberRows,
    },
  };
};
