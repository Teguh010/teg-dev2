"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useMemo } from "react";
import { useThemeStore } from "@/store";
import { useTheme } from "next-themes";
import { themes } from "@/config/thems";
import {
  getGridConfig,
  getLabel,
  getYAxisConfig,
} from "@/lib/appex-chart-options";
import toast from "react-hot-toast";
import { firstUpperLetter } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const Timeline = ({
  horizontal = true,
  data,
  yLength = null,
  colorCode = null,
  oneDay = null,
}) => {
  const { t } = useTranslation();
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const series = data;
  let height = 120;
  if (yLength) height += 90 * yLength;
  else height += series.length * 100;

  const { theme: config } = useThemeStore();
  const { theme: mode } = useTheme();
  const themeObj = themes.find((theme) => theme.name === config);

  const copyText = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(firstUpperLetter(t("genreral.copy"))))
      .catch((err) => console.error("Error al copiar: ", err));
  };

  useEffect(() => {
    const handleClick = (event) => {
      const target = event.target;
      const labelElement = target.closest(
        ".apexcharts-xaxis-label, .apexcharts-yaxis-label"
      );
      if (labelElement) {
        const text = target.textContent;
        if (text) copyText(text);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [data]);

  let computedColors;
  if (colorCode && Array.isArray(colorCode)) {
    const AltColorArray = [
      "#FF7F00",
      "#377EB8",
      "#4DAF4A",
      "#984EA3",
      "#E41A1C",
    ];
    let fallbackIndex = 0;
    computedColors = series.map((s) => {
      const mapping = colorCode.find((obj) => obj[s.name] !== undefined);
      if (mapping) return mapping[s.name];
      const fallbackColor = AltColorArray[fallbackIndex];
      fallbackIndex++;
      return fallbackColor;
    });
  } else {
    computedColors = ["#FF7F00", "#377EB8", "#4DAF4A", "#984EA3", "#E41A1C"];
  }

  const chartGridColor =
    themeObj?.cssVars[mode === "dark" ? "dark" : "light"].chartGird;
  const chartLabelColor =
    themeObj?.cssVars[mode === "dark" || mode === "system" ? "dark" : "light"]
      .chartLabel;

  const xaxisOptions = {
    type: "datetime",
    position: "top",
    labels: {
      ...getLabel(`hsl(${chartLabelColor})`),
      style: { fontSize: "15px", fontWeight: "bold" },
      datetimeUTC: false,
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  };

  if (oneDay) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 50, 0, 0);
    xaxisOptions.min = today.getTime();
    xaxisOptions.max = endOfToday.getTime();
  }

  const options = useMemo(
    () => ({
      chart: {
        toolbar: { show: true, offsetY: -20 },
        events: {
          dataPointSelection: (event, chartContext, config) => {
            const { seriesIndex, dataPointIndex, w } = config;
            const xValue = w.config.series[seriesIndex].data[dataPointIndex].x;
            copyText(xValue);
          },
          zoomed: (chartContext, { xaxis }) => {
            if (
              xaxis.max - xaxis.min < 3600000 ||
              xaxis.max - xaxis.min > 100000000
            ) {
              chartContext.resetSeries();
            }
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal,
          barHeight: "70%",
          rangeBarGroupRows: true,
        },
      },
      dataLabels: { enabled: false },
      fill: { type: "solid" },
      colors: computedColors,
      tooltip: { theme: mode === "dark" ? "dark" : "light" },
      grid: {
        ...getGridConfig(`hsl(${chartGridColor})`),
        xaxis: { lines: { show: true } },
      },
      xaxis: xaxisOptions,
      yaxis: {
        ...getYAxisConfig(`hsl(${chartLabelColor})`),
        labels: {
          align: "left",
          style: { fontSize: "15px", fontWeight: "bold" },
        },
      },
      legend: {
        position: "bottom",
        horizontalAlign: "center",
        fontSize: "15px",
        fontWeight: "bold",
        labels: {
          colors: `hsl(${chartLabelColor})`,
        },
      },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    }),
    [chartGridColor, chartLabelColor, computedColors, horizontal, mode]
  );

  return (
    <div ref={chartContainerRef} style={{ position: "relative" }}>
      <Chart
        className="pt-6"
        ref={chartRef}
        options={options}
        series={series}
        type="rangeBar"
        height={height}
        width="100%"
      />
    </div>
  );
};

export default Timeline;
