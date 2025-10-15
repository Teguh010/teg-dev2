// error-maintenance.jsx
'use client'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useMaintenance } from '@/context/MaintenanceContext'

const ErrorMaintenance = () => {
  const { theme } = useTheme()
  const { statusCode } = useMaintenance()

  const maintenanceMessage =
    statusCode === 503 ? (
      'TraceGrid is currently undergoing maintenance to improve our services. Please check back later.'
    ) : (
      <>
        <div>Please check if your internet connection is working correctly.</div>
        <br/>
        <div>We might be under maintenance, please try again a bit later.</div>
      </>
    )

  return (
    <div className='flex justify-center items-center p-10'>
      <div className='w-full flex flex-col items-center'>
        <div className='text-center'>
          <div className='text-7xl font-semibold text-gray-400 '>{statusCode}</div>
          <div className='mt-8 text-2xl font-semibold text-default-900'>
            {statusCode === 503 ? 'TraceGrid Under Maintenance' : 'Connection lost'}
          </div>
          <div className='mt-3 text-default-600 text-sm lg:text-base'>{maintenanceMessage}</div>
        </div>
      </div>
    </div>
  )
}

export default ErrorMaintenance
