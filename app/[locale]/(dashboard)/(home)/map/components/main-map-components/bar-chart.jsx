'use client'

import dynamic from 'next/dynamic'
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

export function BarChart({ data }) {
  // Memfilter data berdasarkan kondisi yang diberikan
  const moving = data.filter((item) => item.trip_state === 'moving').length
  const notMoving = data.filter((item) => item.trip_state !== 'moving').length
  const hasAlerts = data.filter((item) => item.has_alerts === true).length

  // Membuat array untuk menyimpan data dan kategori
  const seriesData = []
  const categories = []

  // Hanya tambahkan kategori jika jumlah datanya lebih dari 0
  if (moving > 0) {
    seriesData.push(moving)
    categories.push('Moving')
  }

  if (notMoving > 0) {
    seriesData.push(notMoving)
    categories.push('Not Moving')
  }

  if (hasAlerts > 0) {
    seriesData.push(hasAlerts)
    categories.push('Has Alerts')
  }

  // Menggunakan hasil filter sebagai data untuk Bar Chart
  const series = [
    {
      data: seriesData,
    },
  ]

  // Pemetaan warna berdasarkan kategori
  const colorsMap = {
    Moving: '#76C8A3', // Hijau
    'Not Moving': '#67A3F2', // Biru
    'Has Alerts': '#FFA657', // Oranye
  }

  // Menghasilkan array warna berdasarkan kategori yang ada
  const barColors = categories.map((category) => colorsMap[category] || '#000000') // Default hitam jika kategori tidak terdefinisi

  const options = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        distributed: true, // Aktifkan kembali distributed untuk warna per bar
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        colors: ['#666666'],
      },
    },
    xaxis: {
      categories: categories,
      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    grid: {
      show: false,
    },
    colors: barColors, // Tetapkan warna berdasarkan kategori
    legend: {
      show: false,
    },
    tooltip: {
      shared: false, // Disable shared tooltips
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        // Menggunakan dataPointIndex untuk mendapatkan label kategori yang tepat
        return `<div class="apexcharts-tooltip-custom" style="padding: 15px;">
                  <span>${categories[dataPointIndex]}: ${series[seriesIndex][dataPointIndex]}</span>
                </div>`
      },
    },
  }

  return (
    <>
      <ApexChart
        type='bar'
        options={options}
        series={series}
        height={160}
        width={200}
        style={{ marginTop: '-15px' }}
      />
    </>
  )
}

export default BarChart
