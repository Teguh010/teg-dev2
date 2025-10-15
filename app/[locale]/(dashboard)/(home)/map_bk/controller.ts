
"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { objectList, objectLastPosition } from "@/models/object";
import { datatypeList } from "@/models/datatype";
import {
  mergeObjectListObjectLastPositionDatatypeList as mergeObjectList,
  cleanObjectsColumns,
  translateObjects,
  fetchAddresses
} from "@/lib/utils";
import { useTranslation } from 'react-i18next';

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user } = UserContext.models;
  const { getUserRef } = UserContext.operations;
  const [isLoading, setLoading] = useState(true);
  const [dataObjectList, setDataObjectList] = useState(null);
  const [vehicle, setVehicle] = useState(null);

  const fetchData = async (userToken: string) => {
    try {
      const dataObjectList = await objectList(userToken);
      const dataObjectLastPosition = await objectLastPosition(userToken);
      const dataDatatypeList = await datatypeList(userToken);
      const mergedData = mergeObjectList(dataObjectList, dataObjectLastPosition, dataDatatypeList);
      const dataObjectTripStopAddresses = await fetchAddresses(getUserRef().token, mergedData);
      const dataObjectListClean = cleanObjectsColumns(dataObjectTripStopAddresses);
      const dataObjectListTranslate = translateObjects(dataObjectListClean, t);
      setDataObjectList(dataObjectListTranslate);
    } catch (error) {
      console.error('Error fetching client info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.token) {
      fetchData(getUserRef().token);
      const intervalId = setInterval(() => {
        fetchData(user.token);
      }, 60000);

      return () => clearInterval(intervalId);
    }
  }, [user.token]);

  return {
    models: {
      user,
      isLoading,
      dataObjectList,
      vehicle
    },
    operations: {
      setVehicle
    }
  };
};
