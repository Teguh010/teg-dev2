'use client'

import React, { useState, useEffect, useRef } from 'react'
import Chart from 'react-apexcharts'


const FuelLevelChart = ({ dataObjectFuelLevel, onPointClick }) => {
  const [series, setSeries] = useState([])
  const [options, setOptions] = useState({})
  const onPointClickRef = useRef(onPointClick)

  useEffect(() => {
    onPointClickRef.current = onPointClick
  }, [onPointClick])

  useEffect(() => {
    if (!dataObjectFuelLevel || dataObjectFuelLevel.length === 0) {
      setSeries([])
      setOptions({})
      return
    }

    // Sort by time ascending
    const sortedData = [...dataObjectFuelLevel].sort((a, b) => {
      const tA = new Date(a.t).getTime()
      const tB = new Date(b.t).getTime()
      return tA - tB
    })

    const fuelLevels = sortedData.map((item) => item.p)
    const times = sortedData.map((item) => new Date(item.t).getTime())

    setSeries([
      {
        name: 'Fuel Level',
        data: times.map((time, index) => ({
          x: time,
          y: fuelLevels[index],
          originalData: sortedData[index]
        }))
      }
    ])

    setOptions({
      chart: {
        id: 'fuel-level-chart',
        type: 'area',
        height: 185,
        animations: { enabled: false },
        zoom: {
          enabled: true,
          type: 'x',
          autoScaleYaxis: true,
          allowMouseWheelZoom: true
        },
        toolbar: { show: true },
        events: {
          click: function (event, chartContext, config) {
            const dataIndex = config.dataPointIndex
            if (dataIndex !== undefined && dataIndex !== -1 && dataIndex < sortedData.length) {
              const clickedData = sortedData[dataIndex]
              onPointClickRef.current?.(clickedData)
            }
          }
        }
      },
      stroke: { curve: 'straight' },
      dataLabels: { enabled: false },
      xaxis: {
        type: 'datetime',
        labels: {
          show: true
        }
      },
      yaxis: {
        title: { text: 'Fuel Level (%)' },
        min: 0,
        max: 100
      },
      tooltip: {
        enabled: true,
        x: {
          formatter: (value) => {
            const date = new Date(value)
            return `${date.getDate()}/$${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
          }
        },
        y: {
          formatter: (value) => `${value}%`
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.9,
          stops: [0, 100]
        }
      },
      legend: { show: false }
    })
  }, [dataObjectFuelLevel])

  if (!dataObjectFuelLevel || dataObjectFuelLevel.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 32, color: '#888' }}>No data available</div>
    )
  }

  return (
    <div>
      <div id='fuel-level-chart' style={{ minHeight: '200px', height: '200px', marginTop: '-15px' }}>
        {series.length > 0 && (
          <Chart
            options={options}
            series={series}
            type='area'
            height='100%'
            width='100%'
          />
        )}
      </div>
    </div>
  )
}

export default FuelLevelChart
