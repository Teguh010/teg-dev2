"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { objectList, objectLastPosition } from "@/models/object";
import { datatypeList } from "@/models/datatype";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  firstUpperLetter,
  cleanObjectsColumns,
  reorderObject,
} from "@/lib/utils";
import { objectGroupList, objectGroupObjectList } from "@/models/object_group";

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user } = UserContext.models;
  const { getUserRef } = UserContext.operations;
  const [dataObjectList, setDataObjectList] = useState([]);
  const [fastFilter, setFastFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groupList, setGroupList] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [filteredObjectList, setFilteredObjectList] = useState([]);
  const [isGenerate, setIsGenerate] = useState(false);
  const [dataGenerated, setDataGenerated] = useState(false);

  /*const [styleColumnList] = useState([
    {
      title: "name",
      header: () => "sticky left-0 top-0 bg-default-300",
      value: () => `sticky left-0 z-10 bg-white`,
    },
  ]);*/
  const [ignoreList, setIgnoreList] = useState([{ title: "id" }]);
  const [orderList] = useState([{ title: "name" },{ title: "ignition" }]);
  const [styleRowList] = useState([
    {
      title: t("object_overview_page.hidden_ignition"),
      value: (val: any = undefined) => val === true && "bg-green-100",
    },
  ]);

  const filterData = (objects: any[]) => {
    return objects.map((obj) => {
      const newObj = { ...obj };
      if (newObj["ignition"] === "off") {
        newObj["ignition"] = false;
      }
      if (newObj["ignition"] === "on") {
        newObj["ignition"] = true;
      }
      if (newObj["ignition"]) {
        newObj["hidden_ignition"] = newObj["ignition"];
      }

      return reorderObject(newObj, orderList);
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!isGenerate) return;

      setLoading(true);
      try {
        const dataObjectList = await objectList(getUserRef().token);
        const dataObjectLastPosition = await objectLastPosition(
          getUserRef().token
        );
        const dataDatatypeList = await datatypeList(getUserRef().token);

        if (!dataObjectList || !dataObjectLastPosition) {
          setDataObjectList([]);
          return;
        }

        const mergedData = dataObjectList.map((vehicle) => {
          const lastPosition = dataObjectLastPosition.find(
            (pos) => pos.objectid === vehicle.id
          );

          if (lastPosition?.msg_data) {
            const msg_data = Object.keys(lastPosition.msg_data).map((key) => [
              key,
              lastPosition.msg_data[key],
            ]);
            if (msg_data.length > 0) {
              const updatedMsgData = msg_data.map((msg) => {
                const nameMsg = dataDatatypeList.find(
                  (item) => String(item.id) === String(msg[0])
                );
                if (nameMsg && nameMsg.name) {
                  const transformedName = nameMsg.name
                    .replace(/\s+/g, "_")
                    .toLowerCase();
                  lastPosition[transformedName] = msg[1];

                  const isInvalid =
                    lastPosition.invalid_msg_data &&
                    lastPosition.invalid_msg_data[msg[0]];

                  return isInvalid
                    ? `${nameMsg.name}: !${msg[1]}!`
                    : `${nameMsg.name}: ${msg[1]}`;
                }
                return `${msg[0]}: ${msg[1]}`;
              });

              lastPosition.msg_data = updatedMsgData.join(", ");
            }

            if (lastPosition.invalid_msg_data) {
              const invalidData = Object.keys(
                lastPosition.invalid_msg_data
              ).map((key) => {
                const nameMsg = dataDatatypeList.find(
                  (item) => String(item.id) === String(key)
                );
                const value = lastPosition.invalid_msg_data[key];

                if (nameMsg && nameMsg.name) {
                  const transformedName = `invalid_${nameMsg.name
                    .replace(/\s+/g, "_")
                    .toLowerCase()}`;
                  lastPosition[transformedName] = value;

                  return `${nameMsg.name}: ${value}`;
                }
                return `${key}: ${value}`;
              });

              lastPosition.invalid_msg_data =
                invalidData.length > 0 ? invalidData.join(", ") : "";
            }
          } else {
            lastPosition.msg_data = "";
            lastPosition.invalid_msg_data = "";
          }
          return lastPosition ? { ...vehicle, ...lastPosition } : vehicle;
        });

        const mergedDataClean = cleanObjectsColumns(mergedData);
        const mergedDataFilters = filterData(
          mergedDataClean
        );
        setDataObjectList(mergedDataFilters || []);
        setDataGenerated(true);
        toast.success(firstUpperLetter(t("object_overview_page.process_completed")));
      } catch (error) {
        console.error("Error:", error);
        toast.error(firstUpperLetter(t("object_overview_page.process_error")));
        setDataObjectList([]);
        setDataGenerated(false);
      } finally {
        setLoading(false);
        setIsGenerate(false);
      }
    };

    fetchData();
  }, [user, isGenerate]);

  useEffect(() => {
    if (dataObjectList) {
      let showList = [];
      let ignoreListFast = [];

      if (fastFilter === true) {
        showList = [
          { title: t("virtual_odometer_continuous") },
          { title: t("(can)_fuel_tank_level") },
          { title: t("(can)_rpm") },
          { title: t("(can)_distance_driven") },
          { title: t("(can)_wheel_based_speed") },
          { title: t("(tacho)_first_driver_id1") },
          { title: t("(tacho)_first_driver_id2") },
          { title: t("(can)_fuel_consumption") },
          { title: t("(tacho)_driver1_continous_driving_time") },
          { title: t("(tacho)_driver2_continous_driving_time") },
          { title: t("(tacho)_driver1_break_time") },
          { title: t("(tacho)_driver2_break_time") },
          { title: t("(tacho)_distance") },
          { title: t("(tacho)_vehicle_speed") },
          { title: t("driver_1_end_of_last_daily_rest_period") },
          { title: t("driver_2_end_of_last_daily_rest_period") },
          {
            title: t("driver_1_number_of_times_9h_daily_driving_time_exceeds"),
          },
          {
            title: t("driver_2_number_of_times_9h_daily_driving_time_exceeds"),
          },
          { title: t("driver_1_minimum_daily_rest") },
          { title: t("driver_2_minimum_daily_rest") },
          { title: t("driver_2_time_left_until_new_daily_rest_period") },
          { title: t("driver_1_time_left_until_new_daily_rest_period") },
          { title: t("driver_2_current_weekly_driving_time") },
          { title: t("driver_1_current_weekly_driving_time") },
          { title: t("driver_1_current_daily_driving_time") },
          {
            title: t("driver_1_remaining_time_before_next_weekly_rest_period"),
          },
          {
            title: t("driver_2_remaining_time_before_next_weekly_rest_period"),
          },
          { title: t("driver_1_remaining_current_drive_time") },
          { title: t("driver_2_remaining_current_drive_time") },
          { title: t("driver_1_remaining_drive_time_on_current_shift") },
          { title: t("driver_2_remaining_drive_time_on_current_shift") },
          { title: t("driver_1_remaining_drive_time_on_current_week") },
          { title: t("driver_2_remaining_drive_time_on_current_week") },
          { title: t("driver_1_remaining_time_before_next_drive_period") },
          { title: t("power_supply_voltage") },
          { title: t("movement") },
          { title: t("(can)_high_resolution_engine_total_fuel_used") },
          { title: t("(input)_ignition") },
          { title: t("(tacho)_rpm") },
          { title: t("axis_x") },
          { title: t("driver_2_remaining_time_before_next_drive_period") },
          { title: t("driver_1_remaining_drive_time_of_next_period") },
          { title: t("driver_2_remaining_drive_time_of_next_period") },
          { title: t("driver_1_remaining_time_of_current_rest_period") },
          { title: t("driver_2_remaining_time_of_current_rest_period") },
          { title: t("driver_1_remaining_time_before_next_rest_period") },
          { title: t("driver_2_remaining_time_before_next_rest_period") },
          { title: t("driver_1_compensation_time_of_previous_week") },
          { title: t("driver_2_compensation_time_of_previous_week") },
          { title: t("driver_1_compensation_time_of_2nd_previous_week") },
          { title: t("driver_2_compensation_time_of_2nd_previous_week") },
          { title: t("driver_1_compensation_time_of_3rd_previous_week") },
          { title: t("driver_2_compensation_time_of_3rd_previous_week") },
          { title: t("first_driver_id_(tacho)") },
          { title: t("driver_2_current_daily_driving_time") },
        ];
        const showKeys = new Set(showList.map((item) => item.title));

        ignoreListFast = Object.keys(dataObjectList[0])
          .filter((key) => !showKeys.has(key))
          .map((key) => ({ title: key }));
      } else {
        ignoreListFast = ignoreList;
      }

      setIgnoreList(ignoreListFast);
    }
  }, [fastFilter, dataObjectList]);

  // Fetch group list
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const groups = await objectGroupList(getUserRef().token);
        setGroupList(groups);
      } catch (error) {
        console.error("Error fetching groups:", error);
        toast.error(firstUpperLetter(t("process_error")));
      }
    };

    if (user.token) {
      fetchGroups();
    }
  }, [user.token]);

  // Filter objects when group is selected
  useEffect(() => {
    const filterByGroup = async () => {
      if (selectedGroup && dataObjectList?.length > 0) {
        try {
          const groupObjects = await objectGroupObjectList(
            getUserRef().token,
            selectedGroup
          );
          const groupObjectIds = new Set(groupObjects.map((obj) => obj.id));

          const filtered = dataObjectList.filter((obj) =>
            groupObjectIds.has(obj.id)
          );
          setFilteredObjectList(filtered || []);
        } catch (error) {
          console.error("Error filtering by group:", error);
          toast.error(firstUpperLetter(t("process_error")));
          setFilteredObjectList([]);
        }
      } else {
        setFilteredObjectList(dataObjectList || []);
      }
    };

    filterByGroup();
  }, [selectedGroup, dataObjectList]);

  return {
    models: {
      user,
      loading,
      dataObjectList,
      ignoreList,
      fastFilter,
      //styleColumnList,
      groupList,
      selectedGroup,
      filteredObjectList: filteredObjectList || [],
      isGenerate,
      dataGenerated,
      styleRowList,
    },
    operations: {
      setFastFilter,
      setSelectedGroup,
      setGenerate: setIsGenerate,
    },
  };
};
