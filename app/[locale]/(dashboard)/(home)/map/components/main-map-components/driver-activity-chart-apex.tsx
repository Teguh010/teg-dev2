'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { tachoDriverActivitiesLast24Hours, DriverActivity } from '@/models/tachograph';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface DriverActivityChartApexProps {
  cardNumber?: string;
  token: string | null;
}

// s_id mapping to activity names (based on mobile app implementation)
const ACTIVITY_NAMES: Record<number, string> = {
  0: 'Rest',
  1: 'Available',
  2: 'Working',
  3: 'Driving',
  9: 'Unknown', // Mobile app uses s_id 9 for Unknown
};

const ACTIVITY_COLORS: Record<number, string> = {
  0: '#6B7280', // gray - Rest
  1: '#10B981', // green - Available
  2: '#F59E0B', // orange - Working
  3: '#EF4444', // red - Driving
  9: '#FCD34D', // yellow - Unknown (matches mobile app)
};

// Function to fill gaps with Unknown activities (from mobile app logic)
const fillGapsWithUnknown = (originalActivities: DriverActivity[]): DriverActivity[] => {
  if (originalActivities.length === 0) return [];

  // Sort activities by start time
  const sortedActivities = [...originalActivities].sort((a, b) => 
    new Date(a.t_from).getTime() - new Date(b.t_from).getTime()
  );

  // Find earliest and latest times
  const earliestTime = new Date(sortedActivities[0].t_from);
  let latestTime = new Date(sortedActivities[sortedActivities.length - 1].t_to);

  // For any activities that end after the latest, update the latest time
  for (const activity of sortedActivities) {
    const activityEnd = new Date(activity.t_to);
    if (activityEnd > latestTime) {
      latestTime = activityEnd;
    }
  }

  // Create a new list with filled gaps
  const filledActivities: DriverActivity[] = [];
  let currentTime = new Date(earliestTime);

  for (const activity of sortedActivities) {
    const activityStart = new Date(activity.t_from);
    const activityEnd = new Date(activity.t_to);

    // If there's a gap before this activity, fill it with Unknown
    if (activityStart > currentTime) {
      filledActivities.push({
        s_id: 9, // Unknown activity type
        t_from: currentTime.toISOString(),
        t_to: activityStart.toISOString(),
      });
    }

    // Add the original activity
    filledActivities.push(activity);

    // Update current time to the end of this activity
    if (activityEnd > currentTime) {
      currentTime = activityEnd;
    }
  }

  // If there's a gap after the last activity, fill it with Unknown
  if (currentTime < latestTime) {
    filledActivities.push({
      s_id: 9, // Unknown activity type
      t_from: currentTime.toISOString(),
      t_to: latestTime.toISOString(),
    });
  }

  return filledActivities;
};

const DriverActivityChartApex: React.FC<DriverActivityChartApexProps> = ({ cardNumber, token }) => {
  const [activities, setActivities] = useState<DriverActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartOptions, setChartOptions] = useState<any>(null);
  const [chartSeries, setChartSeries] = useState<any[]>([]);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!cardNumber || !token) {
        return;
      }

      setLoading(true);
      try {
        const data = await tachoDriverActivitiesLast24Hours(token, cardNumber);
        setActivities(data);
      } catch (error) {
        console.error('Error fetching driver activities:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [cardNumber, token]);

  // Update chart when activities change
  useEffect(() => {
    if (activities.length === 0) return;

    // Fill gaps with Unknown activities
    const filledActivities = fillGapsWithUnknown(activities);

    // Calculate time range
    const allTimes = filledActivities.flatMap(a => [new Date(a.t_from), new Date(a.t_to)]);
    const minTime = Math.min(...allTimes.map(t => t.getTime()));
    const maxTime = Math.max(...allTimes.map(t => t.getTime()));

    // Prepare data for ApexCharts - create multiple series for each activity type
    const activitySeries: any[] = [];
    const activityTypes = [...new Set(filledActivities.map(a => a.s_id))];
    
    activityTypes.forEach(sId => {
      const activityData = filledActivities
        .filter(activity => activity.s_id === sId)
        .map(activity => {
          const start = new Date(activity.t_from).getTime();
          const end = new Date(activity.t_to).getTime();
          
          return {
            x: ACTIVITY_NAMES[sId] || 'Unknown',
            y: [start, end]
          };
        });
      
      activitySeries.push({
        name: ACTIVITY_NAMES[sId] || 'Unknown',
        data: activityData,
        color: ACTIVITY_COLORS[sId] || ACTIVITY_COLORS[9]
      });
    });

    const options = {
      chart: {
        type: 'rangeBar' as const,
        height: 250,
        toolbar: {
          show: false
        },
        background: 'transparent',
        stacked: false,
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 2,
          barHeight: '80%',
          dataLabels: {
            hideOverflowingLabels: true,
            position: 'center'
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        type: 'datetime' as const,
        min: minTime,
        max: maxTime,
        labels: {
          formatter: function(val: number) {
            const hour = new Date(val).getHours();
            return hour.toString().padStart(2, '0');
          },
          style: {
            colors: '#6B7280',
            fontSize: '12px'
          },
          offsetY: 5
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        tooltip: {
          enabled: false
        }
      },
      yaxis: {
        show: false,
        labels: {
          show: false
        }
      },
      grid: {
        show: true,
        borderColor: '#E5E7EB',
        strokeDashArray: 0,
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: false
          }
        },
        padding: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        }
      },
      tooltip: {
        enabled: true,
        shared: false,
        custom: function({ series, seriesIndex, dataPointIndex, w }: any) {
          const activity = filledActivities[dataPointIndex];
          if (!activity) return '';
          
          const startTime = new Date(activity.t_from).toLocaleTimeString();
          const endTime = new Date(activity.t_to).toLocaleTimeString();
          const duration = Math.round((new Date(activity.t_to).getTime() - new Date(activity.t_from).getTime()) / (1000 * 60));
          
          return `
            <div style="padding: 8px; background: white; border: 1px solid #E5E7EB; border-radius: 4px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="font-weight: 600; color: #374151;">${ACTIVITY_NAMES[activity.s_id] || 'Unknown'}</div>
              <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">
                ${startTime} - ${endTime}
              </div>
              <div style="font-size: 12px; color: #6B7280;">
                Duration: ${duration} minutes
              </div>
            </div>
          `;
        }
      },
      legend: {
        show: false // We'll create custom legend below
      }
    };

    const series = activitySeries;

    setChartOptions(options);
    setChartSeries(series);
  }, [activities]);

  if (!cardNumber) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 text-sm">Loading activities...</div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 text-sm">No activity data available</div>
      </div>
    );
  }

  if (!chartOptions || !chartSeries) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 text-sm">Preparing chart...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Driver Activity Last 24 Hours</h3>
        </div>
        
        <div className="h-64">
          <Chart
            options={chartOptions}
            series={chartSeries}
            type="rangeBar"
            height="100%"
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center mt-4 pt-4 border-t border-gray-100">
          {Object.entries(ACTIVITY_NAMES).map(([id, name]) => (
            <div key={id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: ACTIVITY_COLORS[parseInt(id)] }}
              />
              <span className="text-sm text-gray-600">{name}</span>
            </div>
          ))}
        </div>

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-xs text-gray-400 border-t border-gray-100 pt-2">
            <div>Original activities: {activities.length}</div>
            <div>Filled activities: {fillGapsWithUnknown(activities).length}</div>
            <div>Original s_ids: {[...new Set(activities.map(a => a.s_id))].join(', ')}</div>
            <div>Filled s_ids: {[...new Set(fillGapsWithUnknown(activities).map(a => a.s_id))].join(', ')}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverActivityChartApex;
