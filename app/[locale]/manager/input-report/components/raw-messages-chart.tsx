"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Chart from "react-apexcharts";
import ApexCharts from "apexcharts";
import type { ApexOptions } from "apexcharts";

interface ValidRawMessage {
  msg_data?: Record<string, unknown> | string
  invalid_msg_data?: Record<string, unknown> | string
  gpstime?: string | Date
  ignition?: boolean | string
  [key: string]: unknown
}

interface RawMessagesChartProps {
  dataValidRawMessages: ValidRawMessage[]
  onPointClick?: (data: ValidRawMessage) => void
  selectedDataTypes?: number[]
  datatypeList?: Array<{ id: number; name: string }>
}

const RawMessagesChart = ({
  dataValidRawMessages,
  onPointClick,
  selectedDataTypes = [],
  datatypeList = []
}: RawMessagesChartProps) => {
  const chartId = "raw-messages-chart";
  const [series, setSeries] = useState([]);
  const [options, setOptions] = useState<ApexOptions>({});
  const onPointClickRef = useRef(onPointClick);

  useEffect(() => {
    onPointClickRef.current = onPointClick;
  }, [onPointClick]);

  const getAvailableFields = useMemo(() => {
    const firstItem = dataValidRawMessages[0];
    if (!firstItem) return [];

    const defaultSystemFields = [
      "lat",
      "lon",
      "satellites",
      "vectorangle",
      "distance",
      "fuel"
    ];

    const numericFields = Object.keys(firstItem).filter((key) => {
      const val = firstItem[key];
      return typeof val === "number" || (!isNaN(Number(val)) && val !== "");
    });

    let filteredFields = numericFields;

    if (selectedDataTypes.length > 0 && datatypeList.length > 0) {
      const selectedNames = selectedDataTypes
        .map((id) =>
          datatypeList
            .find((dt) => dt.id === id)
            ?.name.toLowerCase()
            .replace(/\s+/g, "_")
        )
        .filter(Boolean);

      filteredFields = numericFields.filter((field) => {
        const matched = selectedNames.some((name) => field.toLowerCase().includes(name));
        // Field seperti 'gpstime', 'ignition', '(input)_ignition' hanya ikut jika match
        if (
          (field === "gpstime" ||
            field === "ignition" ||
            field === "(input)_ignition") &&
          !matched
        )
          return false;
        if (defaultSystemFields.includes(field) && !matched) return false;
        return matched || !defaultSystemFields.includes(field);
      });
    } else {
      filteredFields = numericFields.filter((key) => !defaultSystemFields.includes(key));
    }


    return filteredFields;
  }, [dataValidRawMessages, selectedDataTypes, datatypeList]);

  const availableFields = getAvailableFields; // Ganti `useMemo` menjadi `useMemo` untuk memanggil fungsi

  useEffect(() => {
    if (!dataValidRawMessages || dataValidRawMessages.length === 0) {
      setSeries([]);
      setOptions({});
      return;
    }

    const validData = dataValidRawMessages
      .map((item) => {
        
        // Parse DD-MM-YYYY HH:mm:ss format
        let t;
        if (typeof item.gpstime === 'string' && item.gpstime.includes('-')) {
          // Format: "18-08-2025 14:16:06" -> convert to "2025-08-18 14:16:06"
          const parts = item.gpstime.split(' ');
          if (parts.length === 2) {
            const datePart = parts[0]; // "18-08-2025"
            const timePart = parts[1]; // "14:16:06"
            const dateParts = datePart.split('-');
            if (dateParts.length === 3) {
              const day = dateParts[0];
              const month = dateParts[1];
              const year = dateParts[2];
              const formattedDate = `${year}-${month}-${day} ${timePart}`;
              t = new Date(formattedDate).getTime();
            } else {
              t = new Date(item.gpstime).getTime();
            }
          } else {
            t = new Date(item.gpstime).getTime();
          }
        } else {
          t = new Date(item.gpstime).getTime();
        }
        
        return isNaN(t) ? null : { time: t, item };
      })
      .filter((obj) => obj !== null)
      .sort((a, b) => a.time - b.time);
    

    const times = validData.map((obj) => obj.time);

    const chartSeries = availableFields
      .map((field, index) => {
        
        const values = validData.map((obj) => {
          const value = obj.item[field];
          
          if (field === "(input)_ignition") {
            return value === true ? 1 : 0;
          }
          const convertedValue = typeof value === "number" ? value : Number(value) || 0;
          return convertedValue;
        });

        const seriesData = {
          name: field,
          data: times.map((time, index) => ({
            x: time,
            y: values[index]
          })),
          yAxisIndex: index
        };
        
        return seriesData;
      })
      .filter((series) => {
        const hasValidData = series.data.some((point) => !isNaN(point.y) && isFinite(point.y));
        return hasValidData;
      });

    const yAxisColors = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
      "#06B6D4",
      "#84CC16",
      "#F97316",
      "#6366F1",
      "#F43F5E",
      "#8B5A2B",
      "#059669",
      "#7C3AED",
      "#DC2626",
      "#EA580C",
      "#65A30D",
      "#0891B2",
      "#BE185D",
      "#9333EA",
      "#16A34A",
      "#CA8A04",
      "#2563EB",
      "#C026D3",
      "#EA5A47",
      "#F59E0B",
      "#10B981",
      "#3B82F6",
      "#8B5CF6",
      "#EF4444"
    ];
    const yAxisConfig = chartSeries.map((series, index) => {
      const color = yAxisColors[index % yAxisColors.length];
      const values = series.data
        .map((point) => point.y)
        .filter((val) => !isNaN(val) && isFinite(val));
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const range = maxValue - minValue;
      let yAxisMin, yAxisMax;

      if (series.name.toLowerCase().includes("fuel_consumption")) {
        yAxisMin = Math.floor(minValue / 1000) * 1000;
        yAxisMax = Math.ceil(maxValue / 1000) * 1000;
      } else if (series.name.toLowerCase().includes("fuel_tank_level")) {
        yAxisMin = Math.max(0, Math.floor(minValue - 5));
        yAxisMax = Math.min(100, Math.ceil(maxValue + 5));
      } else if (series.name.toLowerCase().includes("distance_driven")) {
        yAxisMin = Math.floor(minValue / 1000) * 1000;
        yAxisMax = Math.ceil(maxValue / 1000) * 1000;
      } else if (series.name.toLowerCase().includes("ignition")) {
        yAxisMin = 0;
        yAxisMax = 1;
      } else {
        yAxisMin = minValue - range * 0.05;
        yAxisMax = maxValue + range * 0.05;
      }

      return {
        axisTicks: { show: true },
        axisBorder: { show: true, color: color },
        labels: {
          style: { colors: color },
          formatter: (value: any) => {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) return value;
            if (numValue >= 100000) return numValue.toFixed(0);
            if (numValue >= 1000) return numValue.toFixed(0);
            if (numValue >= 100) return numValue.toFixed(0);
            return numValue.toFixed(1);
          }
        },
        title: { text: series.name, style: { color: color } },
        opposite: index > 0,
        min: yAxisMin,
        max: yAxisMax
      };
    });

    setSeries(chartSeries);
    setOptions({
      chart: {
        id: chartId,
        type: "line",
        height: 185,
        // animations: { enabled: false },
        zoom: {
          type: "x",
          enabled: true,
          allowMouseWheelZoom: true
        },
        toolbar: {
          show: true
        },
        events: {
          click: (event: any, chartContext: any, config: any) => {
            const dataIndex = config.dataPointIndex;
            // Pengecekan keamanan untuk memastikan dataIndex valid
            if (dataIndex !== undefined && dataIndex !== -1 && dataIndex < validData.length) {
              const clickedData = validData[dataIndex].item;
              onPointClickRef.current?.(clickedData);
            }
          }
        }
      },
      stroke: { curve: "straight", width: 2 },
      dataLabels: { enabled: false },
      xaxis: {
        type: "datetime",
        labels: { show: false }
      },
      yaxis: yAxisConfig,
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        x: {
          show: true,
          formatter: (value: any) => {
            const date = new Date(value);
            return `${date.getDate()}/${
              date.getMonth() + 1
            }/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
          }
        },
        y: {
          formatter: (value: any) => `${value}`
        }
      },
      colors: yAxisColors,
      grid: { borderColor: "#E5E7EB" },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "left",
        fontSize: "12px",
        markers: { size: 8 },
        formatter: (seriesName: string) => seriesName
      }
    });
  }, [dataValidRawMessages, availableFields]);

  if (!dataValidRawMessages || dataValidRawMessages.length === 0) {
    return (
      <div className='flex items-center justify-center h-full text-gray-500'>No data available</div>
    );
  }

  return (
    <div>
      <div
        className='px-8 py-2'
        id={chartId}
        style={{ minHeight: "38vh", height: "38vh", marginTop: "-15px", width: "100vw" }}
      >
        <Chart options={options} series={series} type='line' height='100%' width='100%' />
      </div>
    </div>
  );
};

export default RawMessagesChart;
