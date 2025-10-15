"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { useSelectedCustomerStore } from "@/store/selected-customer";
import { objectList, objectValidRawMessage } from "@/models/manager/object";
import { selectCustomer } from "@/models/manager/session";
import type { objectListResultVehicle } from "@/types/object";
import {
  cleanObjectsColumns,
  firstUpperLetter,
  reorderObject,
  sortArray,
  translateObjects,
} from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { currentDatatypesList } from "@/models/datatype";

interface MessageData {
  [key: string]: string | number | boolean | null;
}

interface ValidRawMessage {
  msg_data?: MessageData | string;
  invalid_msg_data?: MessageData | string;
  gpstime?: string | Date;
  ignition?: boolean | string;
  [key: string]: unknown;
}

interface TimelineData {
  data: Record<string, unknown>[];
  yLength: number;
}

interface ApiParams {
  object_id: string | null;
  time_from: string;
  time_to: string;
  io_ids_filter?: number[] | {id: string, name: string}[];
}

interface CurrentDatatypeResultItem {
  id: number;
  name: string;
}

type RawMessage = Record<string, unknown>;

export const controller = () => {
  const { t } = useTranslation();
  const {
    models: { user, settings },
    operations: { getUserRef },
  } = useUser();

  const { unitDistance, unitVolume, dateFormat, timeFormat } = useMemo(() => {
    interface Defaults {
      unitDistance: string;
      unitVolume:   string;
      dateFormat:   string;
      timeFormat:   string;
    }
  
    const defaults: Defaults = {
      unitDistance: "km",
      unitVolume:   "l",
      dateFormat:   "yyyy-MM-dd",
      timeFormat:   "HH:mm:ss",
    };
    return settings.reduce((acc, { title, value }) => {
      if (title === "unit_distance") acc.unitDistance = String(value);
      else if (title === "unit_volume") acc.unitVolume = String(value);
      else if (title === "date_format") acc.dateFormat = String(value);
      else if (title === "time_format") acc.timeFormat = String(value);
      return acc;
    }, defaults);
  }, [settings]);

  // Estados
  const [isLoading, setLoading] = useState<boolean>(true);
  const [dataObjectList, setDataObjectList] = useState<objectListResultVehicle[]>([]);
  const [dataDatatypeList, setDataDatatypeList] = useState<CurrentDatatypeResultItem[]>([]);
  const [dataValidRawMessages, setDataValidRawMessages] = useState<ValidRawMessage[]>([]);

  const [numberRows, setNumberRows] = useState<number>(9999999);
  const [vehicle, setVehicle] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isGenerate, setGenerate] = useState<boolean>(false);
  const [ioIdsFilter, setIoIdsFilter] = useState<{id: string, name: string}[]>([]);
  const [selectedDataTypes, setSelectedDataTypes] = useState<number[]>([]);
  const selectedCustomerId = useSelectedCustomerStore((state) => state.selectedCustomerId);

  // Reset state when selectedCustomerId changes
  useEffect(() => {
    const resetState = () => {
      setDataValidRawMessages([]);
      setDataDatatypeList([]);
      setVehicle(null);
      setStartDate(null);
      setEndDate(null);
      setGenerate(false);
      setIoIdsFilter([]);
      setSelectedDataTypes([]);
      // Clear object list temporarily while fetching new data
      setDataObjectList([]);
    };

    resetState();
  }, [selectedCustomerId]);

  // Memoized setSelectedDataTypes to prevent unnecessary re-renders
  const setSelectedDataTypesMemo = useCallback((newDataTypes: number[]) => {
    
    // Always update if the arrays are different (including when newDataTypes is empty)
    const currentSorted = [...selectedDataTypes].sort();
    const newSorted = [...newDataTypes].sort();
    
    const isDifferent = currentSorted.length !== newSorted.length || 
        !currentSorted.every((val, index) => val === newSorted[index]);
        
    if (isDifferent) {
      setSelectedDataTypes(newDataTypes);
    }
  }, [selectedDataTypes]); // Add selectedDataTypes back to dependency

  /*** Listas estáticas memorizadas ***/
  const ignoreList = useMemo(
    () => [],
    []
  );

  const searchList = useMemo(() => [], []);

  const groupList = useMemo(
    () => [
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
    ],
    [t]
  );

  const orderList = useMemo(
    () => [{ title: "gpstime" }, { title: "trip_state" }],
    []
  );

  const styleRowList = useMemo(
    () => [
      {
        title: t("ignition"),
        value: (val: boolean | string) => (val === true ? "bg-green-100" : ""),
      },
    ],
    [t]
  );

  const styleColumnList = useMemo(
    () => [
      {
        title: t("gpstime"),
        header: () => "sticky left-0 top-0 bg-default-300",
        value: (val: any, rowData?: any) => {
          const ignitionValue = rowData?.ignition || rowData?.["(input)_ignition"];
          return `sticky left-0 z-10 ${ignitionValue ? "bg-green-100" : "bg-white"}`;
        },
      },
    ],
    [t]
  );

  const stateListTimeline = useMemo(
    () => ({
      0: t("general.rest"),
      1: t("general.driver_available"),
      2: t("general.work"),
      3: t("general.drive"),
      6: t("general.error"),
      7: t("general.not_available"),
    }),
    [t]
  );

  const colorCodeTimeline = useMemo(
    () => [
      { [firstUpperLetter(t("general.not_available"))]: "#000000" },
      { [firstUpperLetter(t("general.drive"))]: "#ff0813" },
      { [firstUpperLetter(t("general.work"))]: "#05df72" },
      { [firstUpperLetter(t("general.rest"))]: "#808080" },
      { [firstUpperLetter(t("general.driver_available"))]: "#00bcff" },
      { [firstUpperLetter(t("general.error"))]: "#ffdf20" },
    ],
    [t]
  );

  /*** Helpers memorizados ***/
  const filterData = useCallback(
    (objects = [], dataTypes = []) =>
      (objects || []).map((obj) => {
        // Create a new object with index signature to satisfy TypeScript
        const result = {
          msg_data: obj.msg_data,
          invalid_msg_data: obj.invalid_msg_data,
          gpstime: obj.gpstime,
          ignition: obj.ignition,
          ...obj
        } as ValidRawMessage;
        
        // Process msg_data if it exists and is an object
        if (result.msg_data && typeof result.msg_data === 'object' && !Array.isArray(result.msg_data)) {
          Object.entries(result.msg_data).forEach(([key, value]) => {
            const dataType = dataTypes.find(dt => String(dt.id) === key);
            const name = dataType?.name || key;
            const isInvalid = typeof result.invalid_msg_data === 'object' && 
                           result.invalid_msg_data && 
                           !Array.isArray(result.invalid_msg_data) &&
                           key in result.invalid_msg_data;
            // Add individual fields for each data type
            const fieldName = name.toLowerCase().replace(/\s+/g, '_');
            // Use type assertion to handle the dynamic property assignment
            (result as Record<string, unknown>)[fieldName] = isInvalid ? `!${value}!` : value;
          });
        } else if (typeof result.msg_data === 'string') {
          // If it's already a string, just delete it
          delete result.msg_data;
        } else {
          // Jika tipe lain, hapus juga
          delete result.msg_data;
        }
        
        // Add: Convert invalid_data to a readable string if it's an object
        if (result.invalid_data && typeof result.invalid_data === 'object' && !Array.isArray(result.invalid_data)) {
          result.invalid_data = Object.entries(result.invalid_data)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        } else if (typeof result.invalid_data !== 'string') {
          result.invalid_data = String(result.invalid_data ?? '');
        }
        
        // Process invalid_msg_data if it exists and is an object
        if (result.invalid_msg_data && typeof result.invalid_msg_data === 'object' && !Array.isArray(result.invalid_msg_data)) {
          const invalidData = Object.entries(result.invalid_msg_data).map(([key, value]) => {
            const dataType = dataTypes.find(dt => String(dt.id) === key);
            const name = dataType?.name || key;
            return `${name}: ${value}`;
          });
          
          result.invalid_msg_data = invalidData.join(', ');
        } else if (typeof result.invalid_msg_data === 'string') {
          // If it's already a string, leave it as is
          result.invalid_msg_data = result.invalid_msg_data;
        } else if (result.invalid_msg_data) {
          // If it's something else, convert to string
          result.invalid_msg_data = String(result.invalid_msg_data);
        }

        // Normalize ignition
        ["(input)_ignition", "ignition"].forEach((key) => {
          if (result[key] === "0" || result[key] === "off") result[key] = false;
          else if (result[key] === "1" || result[key] === "on")
            result[key] = true;
        });
        
        // Format gpstime
        if (result.gpstime) {
          result.gpstime = format(
            new Date(result.gpstime),
            `${dateFormat} ${timeFormat}`
          );
        }
        
        return reorderObject(result, orderList);
      }),
    [dateFormat, timeFormat, orderList]
  );

  /*** Fetch metadata al inicio ***/
  useEffect(() => {
    if (!user.token || !selectedCustomerId) return;
    const token = getUserRef().token;
    
    setLoading(true);
    
    // First select the customer session, then fetch object list
    const fetchData = async () => {
      try {
        // Select customer session first
        await selectCustomer(token, selectedCustomerId);
        
        // Then fetch object list
        const objs = await objectList(token);
        setDataObjectList(objs);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(firstUpperLetter(t("general.process_error")));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user.token, selectedCustomerId, getUserRef, t]);

  // Fetch datatypes when vehicle is selected
  useEffect(() => {
    if (!user.token || !vehicle) return;
    const token = getUserRef().token;
    
    currentDatatypesList(token, vehicle)
      .then((dts) => {
        setDataDatatypeList(dts);
      })
      .catch(console.error);
  }, [user.token, vehicle, getUserRef]);

  /*** Procesar mensajes cuando se dispare generate ***/
  useEffect(() => {
    if (!user.token || !vehicle || !startDate || !endDate || !isGenerate)
      return;

    let mounted = true;
    setLoading(true);
    const token = getUserRef().token;
    toast.success(firstUpperLetter(t("general.processing")));

    (async () => {
      try {
        const params: ApiParams = {
          object_id: vehicle,
          time_from: format(startDate, "yyyy-MM-dd HH:mm:ss"),
          time_to: format(endDate, "yyyy-MM-dd HH:mm:ss"),
        };
        
        // Use selectedDataTypes if available, otherwise use ioIdsFilter, otherwise don't send io_ids_filter
        if (selectedDataTypes.length > 0) {
          // User has selected specific data types
          params.io_ids_filter = selectedDataTypes;
        } else if (ioIdsFilter.length > 0) {
          // Fallback to ioIdsFilter if available
          params.io_ids_filter = ioIdsFilter;
        } else {
          // Don't send io_ids_filter if no data types selected
          console.warn('[Controller] No data types selected, not sending io_ids_filter');
        }
        
        const raw = await objectValidRawMessage(token, params);
        const sorted = sortArray(raw, "gpstime", "desc");

        // Process each message to format msg_data with human-readable names
        const processed = sorted.map((item) => {
          if (item.msg_data && typeof item.msg_data === 'object') {
            Object.entries(item.msg_data).forEach(([id, value]) => {
              const dataType = dataDatatypeList.find(dt => String(dt.id) === id);
              const name = dataType?.name || id;
              const isInvalid = item.invalid_msg_data && 
                              typeof item.invalid_msg_data === 'object' && 
                              id in item.invalid_msg_data;
              // Add individual field for this data type
              const fieldName = name.toLowerCase().replace(/\s+/g, '_');
              item[fieldName] = isInvalid ? `!${value}!` : value;
            });
            // If msg_data is an object, delete it
            delete item.msg_data;
          } else if (typeof item.msg_data === 'string') {
            // If it's already a string, just delete it
            delete item.msg_data;
          } else {
            // If it's something else, delete it
            delete item.msg_data;
          }

          // Add: Convert invalid_data to a readable string if it's an object
          if (item.invalid_data && typeof item.invalid_data === 'object' && !Array.isArray(item.invalid_data)) {
            item.invalid_data = Object.entries(item.invalid_data)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ');
          } else if (typeof item.invalid_data !== 'string') {
            item.invalid_data = String(item.invalid_data ?? '');
          }

          // Process invalid_msg_data similarly
          if (item.invalid_msg_data && typeof item.invalid_msg_data === 'object') {
            const formattedInvalidData = Object.entries(item.invalid_msg_data).map(([id, value]) => {
              const dataType = dataDatatypeList.find(dt => String(dt.id) === id);
              const name = dataType?.name || id;
              return `${name}: ${value}`;
            });
            item.invalid_msg_data = formattedInvalidData.join(', ');
          }

          return item;
        });

        const cleaned = cleanObjectsColumns(processed);
        const filtered = filterData(cleaned, dataDatatypeList);
        const translated = await translateObjects(
          filtered.slice(0, numberRows),
          t,
          ["gpstime"]
        );

        if (!mounted) return;
        setDataValidRawMessages(translated);
      } catch (err) {
        toast.error(firstUpperLetter(t("general.process_error")));
        console.error(err);
      } finally {
        if (!mounted) return;
        toast.success(firstUpperLetter(t("general.process_completed")));
        setGenerate(false);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    user.token,
    vehicle,
    startDate,
    endDate,
    isGenerate,
    ioIdsFilter,
    selectedDataTypes,
    numberRows,
    filterData,
    dataDatatypeList,
    t,
    getUserRef,
  ]);

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
      selectedDataTypes,
      datatypeList: dataDatatypeList,
      styleRowList,
      numberRows,
      styleColumnList,
      colorCodeTimeline,
      unitDistance,
      unitVolume,
      dateFormat,
      timeFormat
    },
    operations: {
      setVehicle,
      setStartDate,
      setEndDate,
      setGenerate,
      setIoIdsFilter,
      setSelectedDataTypes: setSelectedDataTypesMemo,
      setNumberRows,
    },
    setDataValidRawMessages, // expose for external reset
  };
};
