'use client';
import React, { useEffect, useState } from 'react';
import { tachoDriverActivitiesLast24Hours, DriverActivity } from '@/models/tachograph';

interface DriverActivityChartProps {
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

// Height factors for different activity types (from mobile app)
const ACTIVITY_HEIGHT_FACTORS: Record<number, number> = {
  0: 0.6, // Rest - 60% of timeline height
  1: 0.7, // Available - 70% of timeline height
  2: 0.8, // Working - 80% of timeline height
  3: 1.0, // Driving - 100% of timeline height (tallest)
  4: 0.5, // Short Break - 50% of timeline height
  9: 0.65, // Unknown - 65% of timeline height
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

const DriverActivityChart: React.FC<DriverActivityChartProps> = ({ cardNumber, token }) => {
  const [activities, setActivities] = useState<DriverActivity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!cardNumber || !token) {
        console.log('No card number or token available');
        return;
      }

      setLoading(true);
      try {
        console.log('Fetching driver activities for card:', cardNumber);
        const data = await tachoDriverActivitiesLast24Hours(token, cardNumber);
        console.log('Driver activities data:', data);
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

  // Calculate total 24-hour period based on actual data range
  let dataStartTime: Date;
  let dataEndTime: Date;
  
  if (activities.length > 0) {
    // Use actual data range
    const startTimes = activities.map(a => new Date(a.t_from).getTime());
    const endTimes = activities.map(a => new Date(a.t_to).getTime());
    
    dataStartTime = new Date(Math.min(...startTimes));
    dataEndTime = new Date(Math.max(...endTimes));
    
    // Round to the nearest hour for cleaner display
    dataStartTime.setMinutes(0, 0, 0);
    dataEndTime.setMinutes(0, 0, 0);
    
    // Don't add extra offset, use the data range as is
    // The mobile app seems to start from the actual data start time
    dataEndTime.setHours(dataEndTime.getHours() + 1);
  } else {
    // Fallback to current time - 24 hours
    const now = new Date();
    dataStartTime = new Date(now);
    dataStartTime.setHours(now.getHours() - 24, 0, 0, 0);
    dataEndTime = new Date(now);
  }
  
  // Use fixed 24-hour period for consistent display
  const total24Hours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Calculate timeline start hour based on actual data
  const dataStartHour = dataStartTime.getHours();
  
  // Find the closest 4-hour interval (0, 4, 8, 12, 16, 20) to start from
  const baseHours = [0, 4, 8, 12, 16, 20];
  const closestBaseHour = baseHours.reduce((prev, curr) => 
    Math.abs(curr - dataStartHour) < Math.abs(prev - dataStartHour) ? curr : prev
  );
  
  // If data starts after the closest base hour, use the next base hour
  const timelineStartHour = dataStartHour > closestBaseHour ? 
    (closestBaseHour + 4) % 24 : closestBaseHour;

  // Fill gaps with Unknown activities like mobile app
  const filledActivities = fillGapsWithUnknown(activities);

  // Create timeline segments using filled activities
  const segments = filledActivities.map((activity) => {
    const start = new Date(activity.t_from).getTime();
    const end = new Date(activity.t_to).getTime();
    const duration = end - start;
    
    // Calculate position relative to flexible 24-hour period
    // Create a reference time starting from the calculated timeline start hour
    const timelineStartTime = new Date(dataStartTime);
    timelineStartTime.setHours(timelineStartHour, 0, 0, 0);
    
    // If data starts after the timeline start hour, adjust timeline to previous day
    if (dataStartHour > timelineStartHour) {
      timelineStartTime.setDate(timelineStartTime.getDate() - 1);
    }
    
    const relativeStart = Math.max(0, start - timelineStartTime.getTime());
    const percentage = (relativeStart / total24Hours) * 100;
    const width = (duration / total24Hours) * 100;
    
    // Get height factor for this activity type
    const heightFactor = ACTIVITY_HEIGHT_FACTORS[activity.s_id] || 0.65; // default to Unknown height
    
    return {
      percentage: Math.max(0, percentage),
      width: Math.min(100, width),
      color: ACTIVITY_COLORS[activity.s_id] || ACTIVITY_COLORS[9], // fallback to unknown color
      activity: ACTIVITY_NAMES[activity.s_id] || ACTIVITY_NAMES[9], // fallback to unknown
      startTime: activity.t_from,
      endTime: activity.t_to,
      duration: Math.round(duration / (1000 * 60)), // minutes
      heightFactor: heightFactor,
    };
  });

  // Generate time labels for x-axis using calculated timeline start hour
  const timeLabels = [];
  
  // Create labels every 4 hours for a 24-hour period starting from calculated start hour
  for (let i = 0; i < 24; i += 4) {
    const hour = (timelineStartHour + i) % 24;
    const position = (i / 24) * 100;
    
    timeLabels.push({
      time: hour.toString().padStart(2, '0'),
      position: position
    });
  }

  return (
    <div className="w-full">
      {/* Timeline Bar */}
      <div className="relative h-8 bg-gray-100 rounded-md overflow-hidden mb-4">
        {segments.map((segment, index) => {
          // Calculate height and position based on height factor
          const segmentHeight = `${segment.heightFactor * 100}%`;
          const segmentTop = `${(1 - segment.heightFactor) * 100}%`;
          
          return (
            <div
              key={index}
              className="absolute cursor-pointer group"
              style={{
                left: `${segment.percentage}%`,
                width: `${segment.width}%`,
                top: segmentTop,
                height: segmentHeight,
                backgroundColor: segment.color,
              }}
              title={`${segment.activity}: ${segment.duration} min`}
            >
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
            </div>
          );
        })}
      </div>

      {/* Time Labels */}
      <div className="relative h-4 mb-4">
        {timeLabels.map((label, index) => (
          <div
            key={index}
            className="absolute text-xs text-gray-500 transform -translate-x-1/2"
            style={{ left: `${label.position}%` }}
          >
            {label.time}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center text-xs">
        {Object.entries(ACTIVITY_NAMES).map(([id, name]) => (
          <div key={id} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: ACTIVITY_COLORS[parseInt(id)] }}
            />
            <span className="text-gray-600">{name}</span>
          </div>
        ))}
      </div>

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-400">
          <div>Original activities: {activities.length}</div>
          <div>Filled activities: {filledActivities.length}</div>
          <div>Original s_ids: {[...new Set(activities.map(a => a.s_id))].join(', ')}</div>
          <div>Filled s_ids: {[...new Set(filledActivities.map(a => a.s_id))].join(', ')}</div>
          <div>Raw data start: {activities.length > 0 ? new Date(activities[0].t_from).toLocaleTimeString() : 'N/A'}</div>
          <div>Data start hour: {dataStartHour}</div>
          <div>Timeline start hour: {timelineStartHour}</div>
          <div>Time labels: {timeLabels.map(l => l.time).join(', ')}</div>
        </div>
      )}
    </div>
  );
};

export default DriverActivityChart;

