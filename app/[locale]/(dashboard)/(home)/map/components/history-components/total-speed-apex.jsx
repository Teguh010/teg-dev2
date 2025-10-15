"use client"

import React, { useState, useEffect, useRef } from "react"
import { parse, isValid } from "date-fns"
import { useDispatch } from "react-redux"
import Chart from "react-apexcharts"
import { parseSpeed } from "@/lib/utils"
import { setChartData } from "@/redux/features/history-map/history-slice"

const parseCustomDate = (dateString) => {
  const formats = [
    "dd/MM/yyyy HH:mm",
    "yyyy-MM-dd HH:mm:ss",
    "yyyy-MM-dd HH:mm",
    "yyyy-MM-dd hh:mma",
    "yyyy-MM-dd"
  ]
  let parsedDate = null
  for (const format of formats) {
    parsedDate = parse(dateString, format, new Date())
    if (isValid(parsedDate)) {
      return parsedDate
    }
  }
  return new Date()
}

const TotalSpeed = ({ dataObjectTrajectory, onPointClick }) => {
  const [ready, setReady] = useState(false)
  const [series, setSeries] = useState([])
  const [options, setOptions] = useState({})
  const dispatch = useDispatch()
  const onPointClickRef = useRef(onPointClick)
  useEffect(() => {
    onPointClickRef.current = onPointClick
  }, [onPointClick])

  useEffect(() => {
    if (
      Array.isArray(dataObjectTrajectory) &&
      dataObjectTrajectory.length > 0 &&
      dataObjectTrajectory.every((item) => item.time && item.spd)
    ) {
      setReady(true)
    } else {
      setReady(false)
    }
  }, [dataObjectTrajectory])

  useEffect(() => {
    if (!ready) {
      setSeries([])
      setOptions({})
      return
    }

    const sortedData = [...dataObjectTrajectory].sort((a, b) => {
      const timeA = parseCustomDate(a.time).getTime()
      const timeB = parseCustomDate(b.time).getTime()
      return timeA - timeB
    })

    const speeds = sortedData.map((item) => parseSpeed(item.spd))
    const times = sortedData.map((item) => parseCustomDate(item.time).getTime())

    setSeries([
      {
        name: "Vehicle Speed",
        data: times.map((time, index) => ({
          x: time,
          y: speeds[index],
          originalData: sortedData[index]
        }))
      }
    ])

    setOptions({
      chart: {
        id: "apex-speed-chart", // Ganti ID agar konsisten
        type: "area",
        height: 185,
        animations: {
          enabled: false
        },
        zoom: {
          enabled: true, // Biarkan aktif untuk interaksi manual
          type: "x",
          autoScaleYaxis: true,
          allowMouseWheelZoom: true
        },
        toolbar: {
          show: true // Tampilkan toolbar
        },
        events: {
          click: function (event, chartContext, config) {
            const dataIndex = config.dataPointIndex
            // Pengecekan keamanan
            if (dataIndex !== undefined && dataIndex !== -1 && dataIndex < sortedData.length) {
              const clickedData = sortedData[dataIndex]
              onPointClickRef.current?.(clickedData)
              dispatch(setChartData(clickedData))
            }
          }
        }
      },
      stroke: {
        curve: "straight"
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        type: "datetime",
        labels: {
          show: true // Tampilkan label x-axis agar lebih informatif
        }
      },
      yaxis: {
        title: {
          text: "Speed (km/h)"
        }
      },
      tooltip: {
        enabled: true,
        x: {
          formatter: (value) => {
            const date = new Date(value)
            return `${date.getDate()}/${
              date.getMonth() + 1
            }/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
          }
        }
      },
      legend: {
        show: false
      }
    })
  }, [ready, dataObjectTrajectory, dispatch])

  return (
    <div>
      <div
        id='apex-speed-chart'
        style={{ minHeight: "200px", height: "200px", marginTop: "-15px" }}
      >
        {ready && series.length > 0 ? (
          <Chart options={options} series={series} type='area' height={185} width='100%' />
        ) : (
          <div style={{ textAlign: "center", padding: 32, color: "#888" }}>No valid data</div>
        )}
      </div>
    </div>
  )
}

export default TotalSpeed
