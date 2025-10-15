'use client'

import React, { useState, useEffect, useRef } from 'react'
import Chart from 'react-apexcharts'
import { debounce } from 'lodash'

const FuelLevelChart = ({ dataObjectFuelLevel, onPointClick }) => {
  const [series, setSeries] = useState([])
  const [options, setOptions] = useState({})
  const chartRef = useRef(null)

  useEffect(() => {
    const updateChart = () => {
      if (!dataObjectFuelLevel || dataObjectFuelLevel.length === 0) {
        setSeries([])
        setOptions({})
        return
      }

      const fuelLevels = dataObjectFuelLevel.map((item) => item.p)
      const times = dataObjectFuelLevel.map((item) => new Date(item.t).getTime())

      setSeries([
        {
          name: 'Fuel Level',
          data: times.map((time, index) => ({
            x: time,
            y: fuelLevels[index],
          })),
        },
      ])

      setOptions({
        chart: {
          id: 'area-datetime',
          type: 'area',
          height: 185,
          animations: {
            enabled: false,
          },
          zoom: {
            enabled: true,
          },
          toolbar: {
            show: true,
          },
          events: {
            click: function (event, chartContext, config) {
              const dataIndex = config.dataPointIndex
              if (dataIndex >= 0 && dataIndex < dataObjectFuelLevel.length) {
                const clickedData = dataObjectFuelLevel[dataIndex]
                onPointClick(clickedData)
              }
            },
          },
        },
        stroke: {
          curve: 'straight',
        },
        dataLabels: {
          enabled: false,
        },
        xaxis: {
          type: 'datetime',
          labels: {
            show: true,
            datetimeFormatter: {
              year: 'yyyy',
              month: 'MMM \'yy',
              day: 'dd MMM',
              hour: 'HH:mm',
            },
          },
        },
        yaxis: {
          title: {
            text: 'Fuel Level (%)',
          },
          min: 0,
          max: 100,
        },
        tooltip: {
          enabled: true,
          x: {
            formatter: (value) => {
              const date = new Date(value)
              return `${date.getDate()}/${
                date.getMonth() + 1
              }/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`
            },
          },
          y: {
            formatter: (value) => `${value}%`,
          },
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.9,
            stops: [0, 100],
          },
        },
      })
    }

    const timeoutId = setTimeout(updateChart, 300)
    return () => clearTimeout(timeoutId)
  }, [dataObjectFuelLevel])

  useEffect(() => {
    const handleWheelZoom = debounce((event) => {
      if (chartRef.current) {
        const chart = chartRef.current.chart
        const chartRect = chart.w.globals.dom.baseEl.getBoundingClientRect()

        if (
          event.clientX >= chartRect.left &&
          event.clientX <= chartRect.right &&
          event.clientY >= chartRect.top &&
          event.clientY <= chartRect.bottom
        ) {
          event.preventDefault()
          event.stopPropagation()
          event.stopImmediatePropagation()

          const mouseX = (event.clientX - chartRect.left) / chartRect.width
          const currentMinX = chart.w.globals.minX
          const currentMaxX = chart.w.globals.maxX
          const totalX = currentMaxX - currentMinX

          const zoomFactorIn = 0.1
          const zoomFactorOut = 5
          let newMinX, newMaxX

          if (event.deltaY < 0) {
            const zoomRange = zoomFactorIn * totalX
            const midPoint = currentMinX + mouseX * totalX
            newMinX = midPoint - zoomRange / 2
            newMaxX = midPoint + zoomRange / 2
          } else {
            const zoomRange = zoomFactorOut * totalX
            newMinX = currentMinX - zoomRange / 2
            newMaxX = currentMaxX + zoomRange / 2
          }

          newMinX = Math.max(newMinX, chart.w.globals.initialMinX)
          newMaxX = Math.min(newMaxX, chart.w.globals.initialMaxX)

          if (!isNaN(newMinX) && !isNaN(newMaxX) && newMinX < newMaxX) {
            chart.zoomX(newMinX, newMaxX)
          }
        }
      }
    }, 40)

    const chartElement = document.querySelector('#chart')

    if (chartElement) {
      chartElement.addEventListener('wheel', handleWheelZoom, { passive: false })
    }

    return () => {
      if (chartElement) {
        chartElement.removeEventListener('wheel', handleWheelZoom)
      }
    }
  }, [])

  return (
    <div>
      <div className='px-8 py-2' id='chart' style={{ minHeight: '30vh', height: '38vh', marginTop: '-15px', width: '100vw' }}>
        {series.length > 0 && (
          <Chart
            key={JSON.stringify(series)}
            ref={chartRef}
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
