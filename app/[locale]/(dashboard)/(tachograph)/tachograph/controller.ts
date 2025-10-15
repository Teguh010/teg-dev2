"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { translateObjects, reorderObject, firstUpperLetter } from "@/lib/utils";
import { useTranslation } from 'react-i18next';
import {
  tachoGetDriverList,
  tachoAnalysisServiceAuthorize,
  tachoGetDriverReport,
  tachoGetVehicleList,
  tachoGetVehicleReport,
  tachoActivateVehicle,
  tachoDeactivateVehicle,
  tachoActivateDriver,
  tachoDeactivateDriver
} from "@/models/tachograph";
import { format } from "date-fns";
import { PDFDocument, PDFName, PDFHexString, PDFDict, PDFNumber, PDFRef } from 'pdf-lib';
import { useSearchParams } from 'next/navigation';
import toast from "react-hot-toast";
import React from "react";

export const controller = () => {
  const searchParams = useSearchParams();
  const search = searchParams.get('search');
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user, settings } = UserContext.models;
  const { getUserRef } = UserContext.operations;
  const [isLoading, setLoading] = useState(true);
  const [tachoToken, setTachoToken] = useState(null);
  const [dataTachoDriverList, setDataTachoDriverList] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isGenerate, setGenerate] = useState(null);
  const [getDriverReport, setGetDriverReport] = useState({ value: false, rowId: "" });
  const [statusActive, setStatusActive] = useState({ value: false, rowId: "", status: false });
  const [getDriverBulkReport, setGetDriverBulkReport] = useState({ value: false, rowIds: [] });
  const [statusActiveBulk, setStatusActiveBulk] = useState({ value: false, rowIds: [], status: false });
  const [, setUnitDistance] = useState(settings.find(setting => setting.title === "unit_distance")?.value);
  const [, setUnitVolume] = useState(settings.find(setting => setting.title === "unit_volume")?.value);
  const [dateFormat, setDateFormat] = useState(settings.find(setting => setting.title === "date_format")?.value);
  const [timeFormat, setTimeFormat] = useState(settings.find(setting => setting.title === "time_format")?.value);
  const [reportType, setReportType] = useState('');
  const [reportTypeList, setReportTypeList] = useState([]);
  const [dataSource, setDataSource] = useState('');
  const [dataSourceList, setDataSourceList] = useState([]);
  const [penalties, setPenalties] = useState('');
  const [penaltiesList, setPenaltiesList] = useState([]);
  const [cultures, setCultures] = useState('');
  const [culturesList, setCulturesList] = useState([]);
  const [timeZone, setTimeZone] = useState('');
  const [timeZoneList, setTimeZoneList] = useState([]);
  const [bulkProgress, setBulkProgress] = useState({ open: false, current: 0, total: 0 });
  //const [dataObjectList, setDataObjectList] = useState([]);
  /*   const [uploadFiles, setUploadFiles] = useState([]);
    const [uploadingFiles, setUploadingFiles] = useState(false); */

  const [ignoreList,] = useState([
    { title: t("Id") },
    { title: t("DriverCard") },
    { title: t("Names") },
    { title: t("Surname") },
    { title: t("LastVehicleId") },
    { title: t("CardExpirationDate") },
    { title: t("CardIssueDate") },
    { title: t("CardValidityBeginDate") },
    { title: t("DownloadDate") },
    { title: t("LastCardDownload") },
    { title: t("NextDownloadDate") },
    { title: t("CardHolderPreferredLanguage") },
    { title: t("CardNumber") },
    { title: t("DaysToNextDownloadDate") },
    { title: t("DriverFirstActivityVehicleFile") },
   /*  { title: t('general.DriverFirstActivityDriverCard') }, */
    { title: t("DriverLastActivity") },
    { title: t("DriverLastActivityVehicleFile") },
   /*  { title: t('general.DriverLastActivityDriverCard') }, */
    { title: t("CardIssuingAuthorityName") },
    { title: t("CardIssuingMemberState") },
    { title: t("BirthDate") },
    { title: t("Created") },
    { title: t("VehicleType") },
    { title: t("LastOdometerValue") },
    { title: t("TachoCalibrationExpiry") },
    { title: t("VehicleRegistrationNation") },
  ]);
  const [searchList,] = useState([
    { title: t("firstname") },
  ]);
  const [orderList,] = useState([
    { title: "option" },
    { title: "firstname" },
    { title: "lastname" },
    { title: "vehicle" },
    { title: "card_number" }
  ]);

  /*   const handleUploadFilesChange = (event) => {
      const selectedFiles = Array.from(event.target.files);
      const validFiles = selectedFiles.filter((file: File) =>
        file.name.endsWith(".ddd")
      );
  
      if (validFiles.length !== selectedFiles.length) {
        toast.success(firstUpperLetter(t("files_have_to_be_ddd")));
      }
  
      setUploadFiles(validFiles);
    };
  
    const handleUploadFiles = async () => {
      if (uploadFiles.length === 0) {
        toast.success(firstUpperLetter(t("no_files")));
        return;
      }
  
      setUploadingFiles(true);
  
      const formData = new FormData();
      uploadFiles.forEach((file) => formData.append("files", file));
      
    }; */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterData = (objects: any[]) => {
    return objects.map(obj => {
      if (obj.Active !== false) {
        const newObj = { ...obj };
        if (newObj.DriverCard) {
          newObj.CardExpirationDate = newObj.DriverCard.CardExpirationDate ? format(newObj.DriverCard.CardExpirationDate, `${dateFormat} ${timeFormat}`) : "";
          newObj.CardIssueDate = newObj.DriverCard.CardIssueDate ? format(newObj.DriverCard.CardIssueDate, `${dateFormat} ${timeFormat}`) : "";
          newObj.CardValidityBeginDate = newObj.DriverCard.CardValidityBeginDate ? format(newObj.DriverCard.CardValidityBeginDate, `${dateFormat} ${timeFormat}`) : "";
          newObj.DownloadDate = newObj.DriverCard.DownloadDate ? format(newObj.DriverCard.DownloadDate, `${dateFormat} ${timeFormat}`) : "";
          newObj.LastCardDownload = newObj.DriverCard.LastCardDownload ? format(newObj.DriverCard.LastCardDownload, `${dateFormat} ${timeFormat}`) : "";
          newObj.NextDownloadDate = newObj.DriverCard.NextDownloadDate ? format(newObj.DriverCard.NextDownloadDate, `${dateFormat} ${timeFormat}`) : "";
          newObj.CardHolderPreferredLanguage = newObj.DriverCard.CardHolderPreferredLanguage;
          newObj.CardIssuingAuthorityName = newObj.DriverCard.CardIssuingAuthorityName;
          newObj.CardIssuingMemberState = newObj.DriverCard.CardIssuingMemberState;
          newObj.CardNumber = newObj.DriverCard.CardNumber;
          newObj.DaysToNextDownloadDate = newObj.DriverCard.DaysToNextDownloadDate;
        }
        if (newObj.DriverFirstActivity) {
          newObj.DriverFirstActivityVehicleFile = newObj.DriverFirstActivity.VehicleFile ? format(newObj.DriverFirstActivity.VehicleFile, `${dateFormat} ${timeFormat}`) : "";
          newObj.DriverFirstActivityDriverCard = newObj.DriverFirstActivity.DriverCard ? format(newObj.DriverFirstActivity.DriverCard, `${dateFormat} ${timeFormat}`) : "";
        }
        if (newObj.DriverLastActivity) {
          newObj.DriverLastActivityVehicleFile = newObj.DriverLastActivity.VehicleFile ? format(newObj.DriverLastActivity.VehicleFile, `${dateFormat} ${timeFormat}`) : "";
          newObj.DriverLastActivityDriverCard = newObj.DriverLastActivity.DriverCard ? format(newObj.DriverLastActivity.DriverCard, `${dateFormat} ${timeFormat}`) : "";
        }
        if (newObj.BirthDate) {
          newObj.BirthDate = format(newObj.BirthDate, `${dateFormat} ${timeFormat}`);
          newObj["birth_date"] = newObj.BirthDate;
          delete newObj.BirthDate;
        }
        if (newObj.Created) {
          newObj.Created = format(newObj.Created, `${dateFormat} ${timeFormat}`);
          newObj["created"] = newObj.Created;
        }
        if (newObj.Names) {
          newObj["firstname"] = newObj.Names;
        }
        if (newObj.Surname) {
          newObj["lastname"] = newObj.Surname;
        }
        if (newObj.CardExpirationDate) {
          newObj["card_expiry_date"] = newObj.CardExpirationDate;
        }
        if (newObj.DriverFirstActivity) {
          newObj["driver_first_activity"] = newObj.DriverFirstActivityVehicleFile;
          delete newObj.DriverFirstActivity;
        }
        if (newObj.DriverLastActivity) {
          newObj["driver_last_activity"] = newObj.DriverLastActivityVehicleFile;
          delete newObj.DriverLastActivity;
        }
        if (newObj.DriverCard) {
          newObj["card_number"] = newObj.CardNumber;
        }
        if (newObj.RegistrationNumber) {
          newObj["registration_number"] = newObj.RegistrationNumber;
          delete newObj.RegistrationNumber;
        }
        if (newObj.VinNumber) {
          newObj["vin_number"] = newObj.VinNumber;
          delete newObj.VinNumber;
        }
        if (newObj.LastOdometerValue) {
          newObj["last_odometer_value"] = newObj.LastOdometerValue;
          delete newObj.LastOdometerValue;
        }

        return reorderObject(newObj, orderList);
      }
    }).filter((obj) => obj !== undefined)
      .sort((a, b) => {
        const dateA = a["driver_last_activity"] ? new Date(a.DriverLastActivityVehicleFile) : new Date(0);
        const dateB = b["driver_last_activity"] ? new Date(b.DriverLastActivityVehicleFile) : new Date(0);

        return dateB.getTime() - dateA.getTime();
      });
  };

  const fetchDataList = async ({
    searchType,
    token,
    tachoToken,
    startDate,
    endDate,
    isGenerate,
    setDataList,
    setLoading,
    setGenerate,
    t,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) => {
    if (!token || !tachoToken) return;

    const params = isGenerate && startDate && endDate ? { start_date: startDate.toISOString(), end_date: endDate.toISOString() } : {};

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let dataList: any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let vehiclesPre: any[];
      if (searchType === 'vehicles') {
        dataList = await tachoGetVehicleList(tachoToken, { ...params, only_active_vehicles: false });
      } else {
        dataList = await tachoGetDriverList(tachoToken, { ...params, only_active_drivers: false });
        vehiclesPre = await tachoGetVehicleList(tachoToken, { only_active_vehicles: false });
        dataList = dataList.map(obj => {
          const newObj = { ...obj };
          newObj.vehicle = "";
          const vehicleInfo = vehiclesPre.find((item) => item.Id === newObj.LastVehicleId);
          if (vehicleInfo) {
            newObj.vehicle = vehicleInfo.RegistrationNumber;
          }
          return newObj;
        });
      }
      const filteredData = filterData(dataList);
      const translatedData = translateObjects(filteredData, t, ["driver_first_activity", "driver_last_activity", "birth_date", "card_expiry_date"]);
      setDataList(translatedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (setLoading) setLoading(false);
      if (setGenerate) setGenerate(false);
    }
  };

  const fetchReport = async ({
    searchType,
    token,
    tachoToken,
    startDate,
    endDate,
    reportParams,
    reportType,
    t,
    cultures,
    penalties,
    timeZone,
    dataSource,
    setReportState,
  }) => {
    if (!token || !tachoToken || !reportParams.value || !reportType) return;

    try {
      const options = {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        ...(startDate ? { "start_date": startDate.toISOString() } : { "start_date": new Date().setMonth(startDate.getMonth() - 6) }),
        ...(endDate ? { "end_date": endDate.toISOString() } : { "end_date": new Date() }),
        report_type: reportType,
        culture: cultures,
        penalties,
        time_zone: timeZone,
        card_overwrites: true,
      };

      let getPdfReport;
      if (searchType === 'vehicles') {
        options["vehicle_id"] = reportParams.rowId;
        options["data_source"] = dataSource;
        getPdfReport = await tachoGetVehicleReport(tachoToken, options);
      } else {
        options["driver_id"] = reportParams.rowId;
        getPdfReport = await tachoGetDriverReport(tachoToken, options);
      }

      const url = window.URL.createObjectURL(new Blob([getPdfReport]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${t('general.tachograph')}${reportType}.pdf`);
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setReportState({ ...reportParams, value: false });
    }
  };

  const fetchBulkReport = async ({
    searchType,
    token,
    tachoToken,
    startDate,
    endDate,
    bulkReportParams,
    reportType,
    t,
    cultures,
    penalties,
    timeZone,
    dataSource,
    setBulkReportState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any): Promise<void> => {
    if (
      !token ||
      !tachoToken ||
      !bulkReportParams.value ||
      !reportType
    )
      return;

    try {
      setBulkProgress({ open: true, current: 0, total: bulkReportParams.rowIds.length });
      const mergedPdf = await PDFDocument.create();
      const pdfContext = mergedPdf.context;
      const outlinesDict = pdfContext.obj({});
      const outlinesDictRef = pdfContext.register(outlinesDict);
      const outlineItems: { item: PDFDict; ref: PDFRef }[] = [];
      const failedDrivers: { id: unknown, name: string }[] = [];
      let successCount = 0;

      if (bulkReportParams.rowIds.length > 0) {
        for (const [idx, id] of bulkReportParams.rowIds.entries()) {
          const options: Record<string, unknown> = {
            start_date: startDate ? startDate.toISOString() : new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString(),
            end_date: endDate ? endDate.toISOString() : new Date().toISOString(),
            report_type: reportType,
            culture: cultures,
            penalties,
            time_zone: timeZone,
            data_source: dataSource,
            card_overwrites: true,
          };

          let getPdfReport: ArrayBuffer | undefined = undefined;
          let failed = false;
          let failReason = '';
          try {
            if (searchType === 'vehicles') {
              options.vehicle_id = id;
              getPdfReport = await tachoGetVehicleReport(tachoToken, options);
            } else {
              options.driver_id = id;
              getPdfReport = await tachoGetDriverReport(tachoToken, options);
            }
            // Coba load sebagai PDF
            try {
              const pdfBlob = new Blob([getPdfReport]);
              const pdfArrayBuffer = await pdfBlob.arrayBuffer();
              await PDFDocument.load(pdfArrayBuffer); // Jika gagal, berarti bukan PDF
            } catch {
              // Jika gagal load PDF, coba parse JSON error
              const text = new TextDecoder().decode(getPdfReport);
              try {
                const json = JSON.parse(text);
                if (json && json.Description) {
                  failed = true;
                  failReason = json.Description;
                } else {
                  failed = true;
                  failReason = 'Unknown error format';
                }
              } catch {
                failed = true;
                failReason = 'Unknown error format';
              }
            }
          } catch (error) {
            failed = true;
            failReason = error?.message || 'Unknown error';
          }

          if (failed) {
            const found = dataTachoDriverList.find(item => item.Id === id);
            const name = found ? (found.firstname || found.registration_number || id) : id;
            failedDrivers.push({ id, name: name + (failReason ? ` (${failReason})` : '') });
            continue;
          }

          // Proses PDF jika sukses
          successCount++;
          const pdfBlob = new Blob([getPdfReport!]);
          const pdfArrayBuffer = await pdfBlob.arrayBuffer();
          const reportPdf = await PDFDocument.load(pdfArrayBuffer);
          const startPageIndex = mergedPdf.getPageCount();
          const pages = await mergedPdf.copyPages(reportPdf, reportPdf.getPageIndices());
          pages.forEach((page) => mergedPdf.addPage(page));
          const destArray = pdfContext.obj([
            mergedPdf.getPage(startPageIndex).ref,
            PDFName.of('FitH'),
            PDFNumber.of(0),
          ]);
          const destArrayRef = pdfContext.register(destArray);
          const outlineItem = pdfContext.obj({});
          const outlineItemRef = pdfContext.register(outlineItem);
          const found = dataTachoDriverList.find(item => item.Id === id);
          const name = found ? (found.firstname || found.registration_number || id) : id;
          outlineItem.set(PDFName.of('Title'), PDFHexString.fromText(`${name}`));
          outlineItem.set(PDFName.of('Parent'), outlinesDictRef);
          outlineItem.set(PDFName.of('Dest'), destArrayRef);
          outlineItems.push({ item: outlineItem, ref: outlineItemRef });
          setBulkProgress(prev => ({ ...prev, current: idx + 1 }));
        }

        for (let i = 0; i < outlineItems.length; i++) {
          const currentItem = outlineItems[i];
          if (i > 0) {
            const prevItem = outlineItems[i - 1];
            currentItem.item.set(PDFName.of('Prev'), prevItem.ref);
            prevItem.item.set(PDFName.of('Next'), currentItem.ref);
          }
        }

        if (outlineItems.length > 0) {
          outlinesDict.set(PDFName.of('First'), outlineItems[0].ref);
          outlinesDict.set(
            PDFName.of('Last'),
            outlineItems[outlineItems.length - 1].ref
          );
          outlinesDict.set(PDFName.of('Count'), PDFNumber.of(outlineItems.length));
          mergedPdf.catalog.set(PDFName.of('Outlines'), outlinesDictRef);
          mergedPdf.catalog.set(PDFName.of('PageMode'), PDFName.of('UseOutlines'));
        }
      }
      if (successCount > 0) {
        const pdfBytes = await mergedPdf.save();
        const url = window.URL.createObjectURL(
          new Blob([pdfBytes], { type: 'application/pdf' })
        );
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${t('general.tachograph')}_${reportType}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        if (failedDrivers.length > 0) {
          // Buat pesan detail tanpa tag HTML, gunakan newline
          const failedList = failedDrivers.map(d => `- ${d.name} (ID: ${d.id})`).join('\n');
          toast.custom((t) => React.createElement(
            'div',
            {
              style: {
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 16,
                background: 'white',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                minWidth: 400,
                maxWidth: 'auto',
                fontSize: 14,
                color: '#363636'
              }
            },
            React.createElement('button', {
              onClick: () => toast.dismiss(t.id),
              style: {
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'none',
                border: 'none',
                fontSize: 16,
                cursor: 'pointer',
                color: '#666',
                padding: 4,
                borderRadius: 4,
                lineHeight: 1
              },
              onMouseEnter: (e) => {
                e.target.style.color = '#333';
                e.target.style.background = '#f0f0f0';
              },
              onMouseLeave: (e) => {
                e.target.style.color = '#666';
                e.target.style.background = 'none';
              }
            }, '×'),
            React.createElement('span', { style: { fontSize: 20, marginBottom: 8 } }, '⚠️'),
            React.createElement('span', { style: { textAlign: 'center', whiteSpace: 'pre-line', marginBottom: 8 } }, `${successCount} reports downloaded`),
            React.createElement('span', { style: { textAlign: 'left', width: '100%', whiteSpace: 'pre-line' } }, `${failedDrivers.length} failed:\n${failedList}`)
          ), { duration: 15000, position: 'top-center' });
        } else {
          toast.custom((t) => React.createElement(
            'div',
            {
              style: {
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 16,
                background: 'white',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                minWidth: 400,
                maxWidth: 'auto',
                fontSize: 14,
                color: '#363636' // warna teks jadi grey
              }
            },
            React.createElement('button', {
              onClick: () => toast.dismiss(t.id),
              style: {
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'none',
                border: 'none',
                fontSize: 16,
                cursor: 'pointer',
                color: '#666',
                padding: 4,
                borderRadius: 4,
                lineHeight: 1
              },
              onMouseEnter: (e) => {
                e.target.style.color = '#333';
                e.target.style.background = '#f0f0f0';
              },
              onMouseLeave: (e) => {
                e.target.style.color = '#666';
                e.target.style.background = 'none';
              }
            }, '×'),
            React.createElement('span', { style: { fontSize: 20, marginBottom: 8 } }, '✅'),
            React.createElement('span', { style: { textAlign: 'center', whiteSpace: 'pre-line' } }, `${successCount} reports downloaded successfully!`)
          ), { duration: 10000, position: 'top-right' });
        }
      } else {
        toast.error(
          'No reports could be downloaded. All selected drivers have no data.',
          { duration: 20000, icon: '❌', position: 'top-right' }
        );
      }
    } catch (error) {
      console.error('Error fetching bulk report:', error);
      alert('Error fetching bulk report: ' + error);
    } finally {
      setBulkReportState({ ...bulkReportParams, value: false });
      setBulkProgress({ open: false, current: 0, total: 0 });
    }
  };

  const fetchChangeActive = async ({
    token,
    tachoToken,
    statusActive,
    setStatusActive,
    setDataTachoDriverList,
    t,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) => {
    if (!token || !tachoToken || !statusActive.value) return;

    const params = isGenerate && startDate && endDate ? { start_date: startDate.toISOString(), end_date: endDate.toISOString() } : {};

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let dataList: any[];
      if (search === 'vehicles') {
        const status = statusActive.status;
        const options = {
          vehicle_id: statusActive.rowId
        };
        if (status) {
          await tachoDeactivateVehicle(tachoToken, options);
        } else {
          await tachoActivateVehicle(tachoToken, options);
        }
        dataList = await tachoGetVehicleList(tachoToken, { ...params, only_active_vehicles: false });
      } else if (search === 'drivers') {
        const status = statusActive.status;
        const options = {
          driver_id: statusActive.rowId
        };
        if (status) {
          await tachoDeactivateDriver(tachoToken, options);
        } else {
          await tachoActivateDriver(tachoToken, options);
        }
        dataList = await tachoGetDriverList(tachoToken, { ...params, only_active_drivers: false });
      }
      const filteredData = filterData(dataList);
      const translatedData = translateObjects(filteredData, t);
      setDataTachoDriverList(translatedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setStatusActive({ ...statusActive, value: false });
    }
  };

  const fetchChangeActiveBulk = async ({
    token,
    tachoToken,
    statusActiveBulk,
    setStatusActiveBulk,
    setDataTachoDriverList,
    t,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) => {
    if (!token || !tachoToken || !statusActiveBulk.value) return;

    const params = isGenerate && startDate && endDate ? { start_date: startDate.toISOString(), end_date: endDate.toISOString() } : {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dataList: any[];
    if (search === 'vehicles') {
      const status = statusActiveBulk.status;
      if (statusActiveBulk.rowIds.length > 0) {
        for (const id of statusActiveBulk.rowIds) {
          const options = {
            vehicle_id: id
          };
          try {
            if (status) {
              await tachoActivateDriver(tachoToken, options);
            } else {
              await tachoDeactivateDriver(tachoToken, options);
            }
          } catch (error) {
            console.error(`Error fetching vehicle_id ${id}:`, error);
          } finally {
            setStatusActiveBulk({ ...statusActiveBulk, value: false });
          }
        }
      }
      dataList = await tachoGetVehicleList(tachoToken, { ...params, only_active_vehicles: false });
    } else if (search === 'drivers') {
      const status = statusActiveBulk.status;
      if (statusActiveBulk.rowIds.length > 0) {
        for (const id of statusActiveBulk.rowIds) {
          const options = {
            driver_id: id
          };
          try {
            if (status) {
              await tachoActivateDriver(tachoToken, options);
            } else {
              await tachoDeactivateDriver(tachoToken, options);
            }
          } catch (error) {
            console.error(`Error fetching driver_id ${id}:`, error);
          } finally {
            setStatusActiveBulk({ ...statusActiveBulk, value: false });
          }
        }
      }
      dataList = await tachoGetDriverList(tachoToken, { ...params, only_active_drivers: false });
    }
    const filteredData = filterData(dataList);
    const translatedData = translateObjects(filteredData, t);
    setDataTachoDriverList(translatedData);

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
    const defaultCultures = 'eng';
    setCultures(defaultCultures);
    setCulturesList([
      { title: 'pol', value: 'polish' },
      { title: 'eng', value: 'english' },
      { title: 'deu', value: 'german' },
      { title: 'esp', value: 'spanish' },
      { title: 'prt', value: 'portuguese' },
      { title: 'ita', value: 'italian' },
      { title: 'svn', value: 'slovenian' },
      { title: 'fra', value: 'french' },
      { title: 'hrv', value: 'croatian' },
      { title: 'rou', value: 'romanian' },
      { title: 'nor', value: 'norwegian' },
      { title: 'bih', value: 'bosnian' },
      { title: 'nld', value: 'dutch' },
    ]);
    const defaultTimeZone = 'utc';
    setTimeZone(defaultTimeZone);
    setTimeZoneList([
      { title: 'utc', value: 'UTC time zone (GMT)' },
      { title: 'west', value: 'UTC/UTC+1' },
      { title: 'cest', value: 'UTC+1/UTC+2' },
      { title: 'eest', value: 'UTC+2/UTC+3' },
      { title: 'msk-1', value: 'UTC+2 (Kaliningrad)' },
      { title: 'msk', value: 'UTC+3 (Moscow)' },
      { title: 'msk1', value: 'UTC+4 (Samara)' },
      { title: 'msk2', value: 'UTC+5 (Yekaterinburg)' },
      { title: 'msk3', value: 'UTC+6 (Omsk)' },
      { title: 'msk4', value: 'UTC+7 (Krasnoyarsk)' },
      { title: 'msk5', value: 'UTC+8 (Irkutsk)' },
      { title: 'msk6', value: 'UTC+9 (Yakutsk)' },
      { title: 'msk7', value: 'UTC+10 (Vladivostok)' },
      { title: 'msk8', value: 'UTC+11 (Srednekolymsk)' },
      { title: 'msk9', value: 'UTC+12 (Kamchatka)' },
    ]);

    if (search === 'drivers') {
      const defaultReportType = t('itd');
      setReportType(defaultReportType);
      setReportTypeList([
        {
          title: 'itd',
          value: 'Road inspection report of driving, rest and break infringements according to Regulation 561/2006 (according to parameter "penalties")',
        },
        {
          title: 'aetr',
          value: 'Road inspection report of driving, rest and break infringements according to AETR (according to parameter "penalties")',
        },
        { title: 'lin', value: 'Driver activities timeline report' },
        { title: 'wyk', value: 'Infringements summary' },
        { title: 'akt', value: 'Activities table report' },
        { title: 'akt2', value: 'Activities report – detailed view' },
        { title: 'akt3', value: 'Worktime report – simplified view' },
        { title: 'dys', value: 'Distance and average speed report' },
        { title: 'srk', value: 'Daily average distance report' },
        { title: 'mis', value: 'Missing data and unknown periods report' },
        {
          title: 'itdw',
          value: 'Road inspection report of driving, rest and break infringements according to Regulation 561/2006 or AETR (no table of penalties)',
        },
        { title: 'ilw', value: 'Amount of infringements' },
        { title: 'ilwd', value: 'Dates of infringements' },
        { title: 'eff', value: 'Effectivity report' },
      ]);
      const defaultDataSource = 'c';
      setDataSource(defaultDataSource);
      setDataSourceList([
        { title: 'c', value: "Data from driver's card" },
        { title: 't', value: 'Data from tachograph' },
        { title: 'd', value: 'Data from D8 frames' },
      ]);
    } else if (search === 'vehicles') {
      const defaultReportType = t('Rpp');
      setReportType(defaultReportType);
      setReportTypeList([
        { title: 'Rpp', value: 'Vehicle mileage (card insertion and withdrawal)' },
        { title: 'Rpp2', value: 'Vehicle mileage (activities)' },
        { title: 'spp', value: 'The sum of the vehicle mileage' },
        { title: 'spp2', value: 'Average vehicle speed report' },
      ]);
      setDataSource('');
      setDataSourceList([]);
      const defaultPenalties = 'deu';
      setPenalties(defaultPenalties);
      setPenaltiesList([
        { title: 'pol', value: 'polish' },
        { title: 'deu', value: 'german' },
      ]);
    }
  }, [search]);

  useEffect(() => {
    if (user.token && search) {
      (async () => {
        try {
          const tachoAuth = await tachoAnalysisServiceAuthorize(getUserRef().token);
          setTachoToken(tachoAuth);
          await fetchDataList({
            searchType: search,
            token: user.token,
            tachoToken: tachoAuth,
            setDataList: setDataTachoDriverList,
            setLoading,
            t,
          });
        } catch (error) {
          console.error('Error authorizing service:', error);
        }
      })();
    }
  }, [user.token && search]);

  useEffect(() => {
    if (isGenerate) {
      toast.success(firstUpperLetter(t('general.processing')));

      fetchDataList({
        searchType: search,
        token: user.token,
        tachoToken,
        startDate,
        endDate,
        isGenerate,
        setDataList: setDataTachoDriverList,
        setGenerate,
        t,
      }).then(() => toast.success(firstUpperLetter(t('general.process_completed'))));
    }
  }, [isGenerate]);

  useEffect(() => {
    if (getDriverReport.value) {
      toast.success(firstUpperLetter(t('general.processing')));

      fetchReport({
        searchType: search,
        token: user.token,
        tachoToken,
        startDate,
        endDate,
        reportParams: getDriverReport,
        reportType,
        t,
        cultures,
        penalties,
        timeZone,
        dataSource,
        setReportState: setGetDriverReport,
      }).then(() => toast.success(firstUpperLetter(t('general.process_completed'))));
    }
  }, [getDriverReport.value]);

  useEffect(() => {
    if (getDriverBulkReport.value) {
      toast.success(firstUpperLetter(t('general.processing')));

      fetchBulkReport({
        searchType: search,
        token: user.token,
        tachoToken,
        startDate,
        endDate,
        bulkReportParams: getDriverBulkReport,
        reportType,
        t,
        cultures,
        penalties,
        timeZone,
        dataSource,
        setBulkReportState: setGetDriverBulkReport,
      }).then(() => toast.success(firstUpperLetter(t('general.process_completed'))));
    }
  }, [getDriverBulkReport.value]);

  useEffect(() => {
    if (statusActive.value) {
      toast.success(firstUpperLetter(t('general.processing')));

      fetchChangeActive({
        token: user.token,
        tachoToken,
        statusActive,
        setStatusActive,
        setDataTachoDriverList,
        t,
      }).then(() => toast.success(firstUpperLetter(t('general.process_completed'))));
    }
  }, [statusActive.value]);

  useEffect(() => {
    if (statusActiveBulk.value) {
      toast.success(firstUpperLetter(t('general.processing')));

      fetchChangeActiveBulk({
        token: user.token,
        tachoToken,
        statusActiveBulk,
        setStatusActiveBulk,
        setDataTachoDriverList,
        t,
      }).then(() => toast.success(firstUpperLetter(t('general.process_completed'))));
    }
  }, [statusActiveBulk.value]);

  return {
    models: {
      user,
      settings,
      isLoading,
      dataList: dataTachoDriverList,
      ignoreList,
      isGenerate,
      startDate,
      endDate,
      searchList,
      reportType,
      reportTypeList,
      getDriverReport,
      getDriverBulkReport,
      dataSource,
      dataSourceList,
      penalties,
      penaltiesList,
      cultures,
      culturesList,
      timeZone,
      timeZoneList,
      searchType: search,
      statusActive,
      statusActiveBulk,
      bulkProgress,
      /*  uploadingFiles */
    },
    operations: {
      setStartDate,
      setEndDate,
      setGenerate,
      setGetDriverReport,
      setReportType,
      setGetDriverBulkReport,
      setDataSource,
      setPenalties,
      setCultures,
      setTimeZone,
      setStatusActive,
      setStatusActiveBulk,
      setBulkProgress,
      /*  handleUploadFilesChange,
       handleUploadFiles */
    }
  };
};

/*  const fetchBulkReport = async ({
  searchType,
  token,
  tachoToken,
  startDate,
  endDate,
  bulkReportParams,
  reportType,
  t,
  cultures,
  penalties,
  timeZone,
  dataSource,
  setBulkReportState,
}: any): Promise<void> => {
  if (!token || !tachoToken || !startDate || !endDate || !bulkReportParams.value || !reportType) return;
 
  try {
    const mergedPdf = await PDFDocument.create();
 
    if (bulkReportParams.rowIds.length > 0) {
      for (const id of bulkReportParams.rowIds) {
        const options: any = {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          report_type: reportType,
          culture: cultures,
          penalties,
          time_zone: timeZone,
          data_source: dataSource,
          card_overwrites: true,
        };
 
        let getPdfReport: ArrayBuffer;
        if (searchType === 'vehicles') {
          options.vehicle_id = id;
          getPdfReport = await tachoGetVehicleReport(tachoToken, options);
        } else {
          options.driver_id = id;
          getPdfReport = await tachoGetDriverReport(tachoToken, options);
        }
 
        const pdfBlob = new Blob([getPdfReport]);
        const pdfArrayBuffer = await pdfBlob.arrayBuffer();
        const reportPdf = await PDFDocument.load(pdfArrayBuffer);
        const pages = await mergedPdf.copyPages(reportPdf, reportPdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      }
 
      const pdfBytes = await mergedPdf.save();
      const url = window.URL.createObjectURL(new Blob([pdfBytes]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${t('general.tachograph')}_${reportType}.pdf`);
      link.click();
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error fetching bulk report:', error);
  } finally {
    setBulkReportState({ ...bulkReportParams, value: false });
  }
}; */

/*   useEffect(() => {
    const fetchData = async () => {
      if (user.token) {
        try {
          const dataObjectList = await objectList(getUserRef().token);
          setDataObjectList(dataObjectList);
        } catch (error) {
          console.error('Error fetching client info:', error);
        } finally {
          setLoading(false);
        }
      }
    };
 
    fetchData();
  }, [user.token]); */
