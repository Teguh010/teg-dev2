"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { objectList } from "@/models/object";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  firstUpperLetter,
  cleanObjectsColumns,
  reorderObject,
  translateObjects,
} from "@/lib/utils";
import { objectGroupList, objectGroupObjectList } from "@/models/object_group";
import { objectRename } from "@/models/object";

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user } = UserContext.models;
  const { getUserRef } = UserContext.operations;
  const [dataObjectList, setDataObjectList] = useState([]);
  const [updateObject, setUpdateObject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [groupList, setGroupList] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [filteredObjectList, setFilteredObjectList] = useState([]);
  const [isGenerate, setIsGenerate] = useState(true);
  const [dataGenerated, setDataGenerated] = useState(false);

  const [ignoreList] = useState([
    { title: "id" },
    { title: "garmin" },
    { title: "distance_type" },
    { title: "ignition_configured" },
    { title: "card_downloads_configured" },
    { title: "is_virtual" },
  ]);
  const [orderList] = useState([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterData = (objects: any[]) => {
    return objects.map((obj) => {
      const newObj = { ...obj };

      return reorderObject(newObj, orderList);
    });
  };

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

  useEffect(() => {
    const fetchData = async () => {
      if (!isGenerate) return;

      setLoading(true);
      try {
        const dataObjectList = await objectList(getUserRef().token);
        if (!dataObjectList) {
          setDataObjectList([]);
          return;
        }
        const mergedDataClean = cleanObjectsColumns(dataObjectList);
        const mergedDataFilters = filterData(mergedDataClean);
        const dataObjectListTranslate = translateObjects(mergedDataFilters, t);
        setDataObjectList(dataObjectListTranslate || []);
        setDataGenerated(true);
        toast.success(firstUpperLetter(t("general.process_completed")));
      } catch (error) {
        console.error("Error:", error);
        toast.error(firstUpperLetter(t("general.process_error")));
        setDataObjectList([]);
        setDataGenerated(false);
      } finally {
        setLoading(false);
        setIsGenerate(false);
      }
    };

    fetchData();
  }, [user, isGenerate]);

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

  useEffect(() => {
    if (user.token && updateObject) {
      Object.keys(updateObject.update).forEach(async (key) => {
        if (
          key === "name" &&
          updateObject.object.name != updateObject.update.name
        ) {
          const params = {
            object_id: updateObject.object.id,
            new_name: updateObject.update.name,
          };
          try {
            const dataRename = await objectRename(getUserRef().token, params);
            if (dataRename) {
              const updateDataObjectList = dataObjectList.map((object) => {
                if (object.id === updateObject.object.id) {
                  return { ...object, name: updateObject.update.name };
                }
                return object;
              });
              setDataObjectList(updateDataObjectList);
            }
            toast.success(firstUpperLetter(t("general.process_completed")));
          } catch (error) {
            console.error("Error:", error);
            toast.error(firstUpperLetter(t("general.process_error")));
          } finally {
            setUpdateObject(null);
          }
        }
      });
    }
  }, [user.token, updateObject]);

  return {
    models: {
      user,
      loading,
      dataObjectList,
      ignoreList,
      groupList,
      selectedGroup,
      filteredObjectList: filteredObjectList || [],
      isGenerate,
      dataGenerated,
    },
    operations: {
      setSelectedGroup,
      setGenerate: setIsGenerate,
      setUpdateObject,
    },
  };
};
