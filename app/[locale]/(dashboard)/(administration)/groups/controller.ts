
"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { translateObjects, firstUpperLetter } from "@/lib/utils";
import { useTranslation } from 'react-i18next';
import { objectGroupList, objectGroupObjectList, objectsGroupCreate, objectsGroupDelete, objectsGroupUpdate } from "@/models/object_group";
import { objectList } from "@/models/object";
import { group } from "console";
import toast from "react-hot-toast";

export const controller = () => {
    const { t } = useTranslation();
    const UserContext = useUser();
    const { user, settings } = UserContext.models;
    const { getUserRef } = UserContext.operations;
    const [isLoading, setLoading] = useState(true);
    const [dataobjectGroupList, setDataobjectGroupList] = useState(null);
    const [dataObjectList, setDataObjectList] = useState(null);
    const [saveGroup, setSaveGroup] = useState({ value: false, group: { name: "", vehicles: [] } });
    const [deleteGroup, setDeleteGroup] = useState({ value: false, rowId: "" });
    const [updateGroup, setUpdateGroup] = useState({ value: false, rowId: "", group: { name: "", vehicles: [] } });
    const [unitDistance, setUnitDistance] = useState(settings.find(setting => setting.title === "unit_distance")?.value);
    const [unitVolume, setUnitVolume] = useState(settings.find(setting => setting.title === "unit_volume")?.value);
    const [dateFormat, setDateFormat] = useState(settings.find(setting => setting.title === "date_format")?.value);
    const [timeFormat, setTimeFormat] = useState(settings.find(setting => setting.title === "time_format")?.value);
    const [ignoreList,] = useState([
        { title: t("id") },
        { title: t("owner_id") },
        { title: t("owner") },
    ]);

    const fetchObjectsList = async (token, group) => {
        try {
            if (!Array.isArray(group)) return [];
            const results = await Promise.allSettled(
                group.map(async (item) => {
                    if (item.id) {
                        const objectsList = await objectGroupObjectList(token, item.id);
                        return { ...item, vehicles: Array.isArray(objectsList) ? objectsList.map(object => object.id + " " + object.name).join(', ') : "" };
                    }
                    return item;
                })
            );

            return results.map((result, index) =>
                result.status === 'fulfilled' ? result.value : group[index]
            );
        } catch (error) {
            console.error('Error fetching addresses:', error);
            return Array.isArray(group) ? group : [];
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
                    const dataObjectList = await objectList(getUserRef().token);
                    setDataObjectList(dataObjectList);
                    const dataobjectGroupList = await objectGroupList(getUserRef().token);
                    const dataobjectGroupObjectsList = await fetchObjectsList(getUserRef().token, dataobjectGroupList);
                    const dataobjectGroupObjectsListTranslate = translateObjects(Array.isArray(dataobjectGroupObjectsList) ? dataobjectGroupObjectsList : [], t);
                    setDataobjectGroupList(dataobjectGroupObjectsListTranslate);
                } catch (error) {
                    console.error('Error fetching client info:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [user.token]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user.token || !saveGroup.value || !saveGroup.group.name || saveGroup.group.vehicles.length < 1) {
                setSaveGroup({ value: false, group: { name: saveGroup.group.name, vehicles: saveGroup.group.vehicles } });
                return;
            }

            try {
                toast.success(firstUpperLetter(t('processing')));
                const objects_id = saveGroup.group.vehicles.map(item => {
                    const match = item.match(/^\d+/);
                    return match ? parseInt(match[0], 10) : null;
                }).filter(num => num !== null);
                const params = {
                    "group_name": saveGroup.group.name,
                    "object_ids": objects_id
                };
                const dataObjectsGroupCreate = await objectsGroupCreate(getUserRef().token, params);
                if (dataObjectsGroupCreate?.length >= 1) {
                    const dataobjectGroupList = await objectGroupList(getUserRef().token);
                    const dataobjectGroupObjectsList = await fetchObjectsList(getUserRef().token, dataobjectGroupList);
                    setDataobjectGroupList(dataobjectGroupObjectsList);
                }
            } catch (error) {
                console.error('Error fetching client info:', error);
            } finally {
                setSaveGroup({ value: false, group: { name: "", vehicles: [] } });
            }
        };

        fetchData();
    }, [user.token, saveGroup.value]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user.token || !deleteGroup.value) {
                setDeleteGroup({ value: false, rowId: deleteGroup.rowId });
                return;
            }

            try {
                toast.success(firstUpperLetter(t('processing')));
                const params = {
                    "group_id": deleteGroup.rowId,
                };
                const dataObjectsGroupDelete = await objectsGroupDelete(getUserRef().token, params);
                if (dataObjectsGroupDelete) {
                    const dataobjectGroupList = await objectGroupList(getUserRef().token);
                    const dataobjectGroupObjectsList = await fetchObjectsList(getUserRef().token, dataobjectGroupList);
                    setDataobjectGroupList(dataobjectGroupObjectsList);
                }

            } catch (error) {
                console.error('Error fetching client info:', error);
            } finally {
                setDeleteGroup({ value: false, rowId: deleteGroup.rowId });
            }
        };

        fetchData();
    }, [user.token, deleteGroup.value]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user.token || !updateGroup.value || !updateGroup.group.name || updateGroup.group.vehicles.length < 1 || !updateGroup.rowId) {
                setUpdateGroup({ value: false, rowId: updateGroup.rowId, group: { name: updateGroup.group.name, vehicles: updateGroup.group.vehicles } });
                return;
            }

            try {
                toast.success(firstUpperLetter(t('processing')));
                const objects_id = updateGroup.group.vehicles.map(item => {
                    const match = item.match(/^\d+/);
                    return match ? parseInt(match[0], 10) : null;
                }).filter(num => num !== null);

                const params = {
                    "group_id": updateGroup.rowId,
                    "group_name": updateGroup.group.name,
                    "object_ids": objects_id
                };
                const dataObjectsGroupUpdate = await objectsGroupUpdate(getUserRef().token, params);
                if (dataObjectsGroupUpdate.length >= 1) {
                    const dataobjectGroupList = await objectGroupList(getUserRef().token);
                    const dataobjectGroupObjectsList = await fetchObjectsList(getUserRef().token, dataobjectGroupList);
                    setDataobjectGroupList(dataobjectGroupObjectsList);
                }
            } catch (error) {
                console.error('Error fetching client info:', error);
            } finally {
                setUpdateGroup({ value: false, rowId: "", group: { name: "", vehicles: [] } });
            }
        };

        fetchData();
    }, [user.token, updateGroup.value]);

    return {
        models: {
            user,
            settings,
            isLoading,
            ignoreList,
            dataList: dataobjectGroupList,
            vehicles: dataObjectList,
            saveGroup,
            updateGroup
        },
        operations: {
            setSaveGroup,
            setDeleteGroup,
            setUpdateGroup
        }
    };
};
