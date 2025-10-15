"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { cleanObjectsColumns, firstUpperLetter, reorderObject, translateObjects } from "@/lib/utils";
import { useTranslation } from 'react-i18next';
import {
  tachoFilesList,
  tachoDriverCardFilesList,
  tachoPutRawFile,
  tachoGetRawFile,
  tachoGetRawCardFile
} from "@/models/tachograph";
import toast from "react-hot-toast";
import { format } from "date-fns";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// Fungsi untuk mapping format string dari settings ke format date-fns
function fixDateFnsFormat(fmt) {
  return fmt
    .replace(/yyyy/g, 'yyyy')
    .replace(/yy/g, 'yy')
    .replace(/mm/g, 'MM') // bulan
    .replace(/dd/g, 'dd')
    .replace(/hh/g, 'HH')
    .replace(/nn/g, 'mm') // menit
    .replace(/ss/g, 'ss');
}

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user, settings } = UserContext.models;
  const { getUserRef } = UserContext.operations;
  const [isLoading, setLoading] = useState(true);
  const [isUpdateFile, setUpdateFile] = useState(false);
  const [, setUnitDistance] = useState(settings.find(setting => setting.title === "unit_distance")?.value);
  const [, setUnitVolume] = useState(settings.find(setting => setting.title === "unit_volume")?.value);
  const [dateFormat, setDateFormat] = useState(settings.find(setting => setting.title === "date_format")?.value);
  const [timeFormat, setTimeFormat] = useState(settings.find(setting => setting.title === "time_format")?.value);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [dataTachoFilesList, setDataTachoFilesList] = useState([]);
  const [dataTachoDriverCardFilesList, setDataTachoDriverCardFilesList] = useState([]);
  const [getReport, setGetReport] = useState({ value: false, rowId: "", fileType: "" });
  const [getBulkReport, setGetBulkReport] = useState({ value: false, rowIds: [], fileType: "" });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isGenerate, setGenerate] = useState(false);
  const [startPeriod, setStartPeriod] = useState(null);
  const [endPeriod, setEndPeriod] = useState(null);
  const [orderListData,] = useState([]);
  const [ignoreList,] = useState([
    { title: t("md5_hash") },
    { title: t("data_size") },
    { title: t("id") },
  ]);

const [actionList,] = useState([
    { title: t("error") },
]);
  const [errorMessage, setErrorMessage] = useState("");

  const handleUploadFilesChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const validFiles = selectedFiles.filter((file: File) =>
      file.name.endsWith(".ddd")
    );
    if (validFiles.length !== selectedFiles.length) {
      toast.success(firstUpperLetter(t("general.files_have_to_be_ddd")));
    }
    setUploadFiles(validFiles);
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterData = (objects: any[]) => {
    return objects.map(obj => {
      const newObj = { ...obj };

      const safeDateFormat = fixDateFnsFormat(dateFormat || 'yyyy-MM-dd');
      const safeTimeFormat = fixDateFnsFormat(timeFormat || 'HH:mm:ss');
      if (newObj.time_read) {
        const time = format(newObj.time_read, `${safeDateFormat} ${safeTimeFormat}`);
        newObj.time_read = time;
      }
      if (newObj.period_to) {
        const time = format(newObj.period_to, `${safeDateFormat} ${safeTimeFormat}`);
        newObj.period_to = time;
      }
      if (newObj.period_from) {
        const time = format(newObj.period_from, `${safeDateFormat} ${safeTimeFormat}`);
        newObj.period_from = time;
      }
      if (newObj.data_timestamp) {
        const time = format(newObj.data_timestamp, `${safeDateFormat} ${safeTimeFormat}`);
        newObj.data_timestamp = time;
      }

      return reorderObject(newObj, orderListData);
    });
  };

  const fetchReport = async ({
    token,
    report,
    t,
  }) => {
    if (!token || !report.value || !report.rowId || !report.fileType) return;

    try {
      const params = {
        file_id: report.rowId,
      };
      let getReport = null;
      if (report.fileType === "tachoGetRawFile") {
        getReport = await tachoGetRawFile(getUserRef().token, params);
      }
      else if (report.fileType === "tachoGetRawCardFile") {
        getReport = await tachoGetRawCardFile(getUserRef().token, params);
      }

      if (getReport) {
        const url = window.URL.createObjectURL(new Blob([getReport['data']]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${getReport['suggested name']}`);
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setGetReport({ ...report, value: false });
      toast.success(firstUpperLetter(t('general.process_completed')));
    }
  };

  const fetchBulkReport = async ({
    token,
    report,
    t,
  }) => {
    if (!token || !report.value || report.rowIds.length <= 0 || !report.fileType) return;
    try {
      const zip = new JSZip();
      const folder = zip.folder(t('reports'));
      if (report.rowIds.length > 0) {
        for (const id of report.rowIds) {
          const params = {
            file_id: id,
          };
          let getReport = null;
          if (report.fileType === "tachoGetRawFile") {
            getReport = await tachoGetRawFile(getUserRef().token, params);
          }
          else if (report.fileType === "tachoGetRawCardFile") {
            getReport = await tachoGetRawCardFile(getUserRef().token, params);
          }

          if (getReport) {
            const fileName = getReport["suggested name"] || `file_${id}.bin`;
            folder.file(fileName, getReport["data"]);
          }
        }
      }
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${t('reports')}.zip`);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setGetBulkReport({ ...report, value: false });
      toast.success(firstUpperLetter(t('general.process_completed')));
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
        (async () => {
          try {
            const params = {};
            const dataTachoFilesList = await tachoFilesList(getUserRef().token, params);
            const dataTachoFilesListClean = cleanObjectsColumns(dataTachoFilesList);
            const dataTachoFilesListFilter = filterData(dataTachoFilesListClean);
            const dataTachoFilesListTranslate = translateObjects(dataTachoFilesListFilter, t, ["time_read", "period_from", "period_to"]);
            // Add options property to each row for the options column
            const dataTachoFilesListWithOptions = dataTachoFilesListTranslate.map(({ options, ...row }) => ({
              ...row
            }));
            setDataTachoFilesList(dataTachoFilesListWithOptions);
            const dataTachoDriverCardFilesList = await tachoDriverCardFilesList(getUserRef().token, params);
            const dataTachoDriverCardFilesListClean = cleanObjectsColumns(dataTachoDriverCardFilesList);
            const dataTachoDriverCardFilesListFilter = filterData(dataTachoDriverCardFilesListClean);
            const dataTachoDriverCardFilesListTranslate = translateObjects(dataTachoDriverCardFilesListFilter, t, ["data_timestamp"]);
            // Add options property to each row for the options column
            const dataTachoDriverCardFilesListWithOptions = dataTachoDriverCardFilesListTranslate.map(({ options, ...row }) => ({
              ...row
            }));
            setDataTachoDriverCardFilesList(dataTachoDriverCardFilesListWithOptions);
            setLoading(false);
            setErrorMessage("");
          } catch (error) {
            setErrorMessage(error?.message || "Unknown error");
            setLoading(false);
            console.error('Error authorizing service:', error);
          }
        })();
      }
    };

    fetchData();
  }, [user.token, isUpdateFile]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user.token || !uploadFiles || !isUpdateFile) {
        return;
      }

      try {
        if (uploadFiles.length === 0) {
          toast.success(firstUpperLetter(t("general.no_files")));
          return;
        }
        toast.success(firstUpperLetter(t('general.processing')));
        for (const file of uploadFiles) {
          const fileData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result.split(",")[1]);
              } /* else {
                reject(new Error("El resultado del archivo no es una cadena."));
              } */
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
          });

          const params = {
            "file_data": fileData,
          };
          await tachoPutRawFile(getUserRef().token, params);
        }
      } catch (error) {
        toast.error(firstUpperLetter(t('general.process_error')));
        console.error('Error fetching client info:', error);
      } finally {
        toast.success(firstUpperLetter(t('general.process_completed')));
        setUploadFiles([]);
        setUpdateFile(false);
      }
    };

    fetchData();
  }, [isUpdateFile]);

  useEffect(() => {
    if (getReport.value) {
      toast.success(firstUpperLetter(t('general.processing')));
      fetchReport({
        token: user.token,
        report: getReport,
        t,
      });
    }
  }, [getReport.value]);

  useEffect(() => {
    if (getBulkReport.value) {
      toast.success(firstUpperLetter(t('general.processing')));
      fetchBulkReport({
        token: user.token,
        report: getBulkReport,
        t,
      });
    }
  }, [getBulkReport.value]);

  useEffect(() => {
    if (user.token && isGenerate) {
      const fetchData = async () => {
        if (!user.token) {
          return;
        }

        (async () => {
          toast.success(firstUpperLetter(t('general.processing')));

          try {
            let params = {};
            params = {
              //"download_time_from": format(startDate, "yyyy-MM-dd HH:mm:ss"),
              ...(startDate && { "download_time_from": format(startDate, "yyyy-MM-dd HH:mm:ss") }),
              ...(endDate && { "download_time_to": format(endDate, "yyyy-MM-dd HH:mm:ss") }),
              ...(startPeriod && { "period_time_from": format(startPeriod, "yyyy-MM-dd HH:mm:ss") }),
              ...(endPeriod && { "period_time_to": format(endPeriod, "yyyy-MM-dd HH:mm:ss") }),
            };
            const dataTachoFilesList = await tachoFilesList(getUserRef().token, params) || [];
            const dataTachoFilesListClean = cleanObjectsColumns(dataTachoFilesList);
            const dataTachoFilesListFilter = filterData(dataTachoFilesListClean);
            const dataTachoFilesListTranslate = translateObjects(dataTachoFilesListFilter, t, ["time_read", "period_from", "period_to"]);
            // Add options property to each row for the options column
            const dataTachoFilesListWithOptions = dataTachoFilesListTranslate.map(({ options, ...row }) => ({
              ...row
            }));
            setDataTachoFilesList(dataTachoFilesListWithOptions);
            params = {
              ...(startDate && { "download_time_from": format(startDate, "yyyy-MM-dd HH:mm:ss") }),
              ...(endDate && { "download_time_to": format(endDate, "yyyy-MM-dd HH:mm:ss") }),
              ...(startPeriod && { "activities_time_from": format(startPeriod, "yyyy-MM-dd HH:mm:ss") }),
              ...(endPeriod && { "activities_time_to": format(endPeriod, "yyyy-MM-dd HH:mm:ss") }),
            };
            const dataTachoDriverCardFilesList = await tachoDriverCardFilesList(getUserRef().token, params) || [];
            const dataTachoDriverCardFilesListClean = cleanObjectsColumns(dataTachoDriverCardFilesList);
            const dataTachoDriverCardFilesListFilter = filterData(dataTachoDriverCardFilesListClean);
            const dataTachoDriverCardFilesListTranslate = translateObjects(dataTachoDriverCardFilesListFilter, t, ["data_timestamp"]);
            // Add options property to each row for the options column
            const dataTachoDriverCardFilesListWithOptions = dataTachoDriverCardFilesListTranslate.map(({ options, ...row }) => ({
              ...row
            }));
            setDataTachoDriverCardFilesList(dataTachoDriverCardFilesListWithOptions);
            setLoading(false);
          } catch (error) {
            toast.error(firstUpperLetter(t('general.process_error')));
            console.error('Error fetching client info:', error);
          } finally {
            toast.success(firstUpperLetter(t('general.process_completed')));
            setGenerate(false);
          }
        })();
      };

      fetchData();
    }
  }, [user.token, isGenerate]);

  return {
    models: {
      user,
      settings,
      isLoading,
      isUpdateFile,
      uploadFiles,
      dataTachoFilesList,
      dataTachoDriverCardFilesList,
      ignoreList,
      getReport,
      getBulkReport,
      startDate,
      endDate,
      isGenerate,
      startPeriod,
      endPeriod,
      errorMessage,
      actionList
    },
    operations: {
      setUpdateFile,
      handleUploadFilesChange,
      setGetReport,
      setGetBulkReport,
      setStartDate,
      setEndDate,
      setGenerate,
      setStartPeriod,
      setEndPeriod
    }
  };
};
