'use client';
import React, { useEffect, useState } from 'react';
import { tachoDriverActivitiesLast24Hours, DriverActivity } from '@/models/tachograph';

interface DriverActivityChartHybridProps {
  cardNumber?: string;
  token: string | null;
}

// s_id mapping to activity names (based on mobile app implementation)
const ACTIVITY_NAMES: Record<number, string> = {
  0: 'Rest',
  1: 'Available',
  2: 'Working',
  3: 'Driving',
  4: 'Short Break',
  9: 'Unknown', // Mobile app uses s_id 9 for Unknown
};

const ACTIVITY_COLORS: Record<number, string> = {
  0: '#9E9E9E', // grey - Rest
  1: '#9C27B0', // purple - Available
  2: '#4CAF50', // green - Working
  3: '#E53935', // red - Driving
  4: '#8BC34A', // light green - Short Break
  9: '#FFEB3B', // yellow - Unknown
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

const DriverActivityChartHybrid: React.FC<DriverActivityChartHybridProps> = ({ cardNumber, token }) => {
  const [activities, setActivities] = useState<DriverActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

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

  if (!cardNumber) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          <span className="text-gray-500 text-sm ml-2">Loading activities...</span>
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <div className="text-gray-500 text-sm">No activity data available</div>
        </div>
      </div>
    );
  }

  // Fill gaps with Unknown activities
  const filledActivities = fillGapsWithUnknown(activities);

  // Calculate timeline parameters
  const allTimes = filledActivities.flatMap(a => [new Date(a.t_from), new Date(a.t_to)]);
  const minTime = Math.min(...allTimes.map(t => t.getTime()));
  const maxTime = Math.max(...allTimes.map(t => t.getTime()));
  const totalDuration = maxTime - minTime;

  // Create timeline segments
  const segments = filledActivities.map((activity, index) => {
    const start = new Date(activity.t_from).getTime();
    const end = new Date(activity.t_to).getTime();
    const duration = end - start;
    
    const relativeStart = Math.max(0, start - minTime);
    const percentage = (relativeStart / totalDuration) * 100;
    const width = (duration / totalDuration) * 100;
    
    const heightFactor = ACTIVITY_HEIGHT_FACTORS[activity.s_id] || 0.65;
    
    return {
      index,
      percentage: Math.max(0, percentage),
      width: Math.min(100, width),
      color: ACTIVITY_COLORS[activity.s_id] || ACTIVITY_COLORS[9],
      activity: ACTIVITY_NAMES[activity.s_id] || ACTIVITY_NAMES[9],
      startTime: activity.t_from,
      endTime: activity.t_to,
      duration: Math.round(duration / (1000 * 60)), // minutes
      heightFactor,
      isHovered: hoveredSegment === index,
    };
  });

  // Generate time labels every 4 hours - dynamic based on actual data like mobile app
  const timeLabels = [];
  
  // Use actual data start time, not rounded time
  const dataStartTime = new Date(minTime);
  const dataStartHour = dataStartTime.getHours();
  
  // Create labels every 4 hours for a 24-hour period starting from actual data start
  for (let i = 0; i < 24; i += 4) {
    const hour = (dataStartHour + i) % 24;
    const position = (i / 24) * 100;
    
    timeLabels.push({
      hour: hour.toString().padStart(2, '0'),
      position: position
    });
  }

  return (
    <div className="w-full">
      <div className="bg-white p-0">
        
        {/* Timeline Container */}
        <div className="relative">
          {/* Timeline Bar */}
          <div className="relative h-12  overflow-hidden">
            {segments.map((segment) => {
              const segmentHeight = `${segment.heightFactor * 100}%`;
              const segmentBottom = 0; // Stick to bottom
              
              return (
                <div
                  key={segment.index}
                  className="absolute cursor-pointer transition-all duration-200 ease-in-out"
                  style={{
                    left: `${segment.percentage}%`,
                    width: `${segment.width}%`,
                    bottom: segmentBottom,
                    height: segmentHeight,
                    backgroundColor: segment.color,
                    opacity: segment.isHovered ? 0.9 : 1,
                    transform: segment.isHovered ? 'scaleY(1.1)' : 'scaleY(1)',
                    transformOrigin: 'bottom', // Scale from bottom
                    boxShadow: segment.isHovered 
                      ? `0 4px 8px ${segment.color}40` 
                      : 'none',
                    zIndex: segment.isHovered ? 10 : 1,
                  }}
                  title={`${segment.activity}: ${segment.duration} min`}
                  onMouseEnter={() => setHoveredSegment(segment.index)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  {/* Gradient overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-sm" />
                  
                  {/* Hover effect overlay */}
                  {segment.isHovered && (
                    <div className="absolute inset-0 bg-white/10 rounded-sm" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Time Labels */}
          <div className="relative h-6 mt-2">
            {timeLabels.map((label, index) => (
              <div
                key={index}
                className="absolute"
                style={{ 
                  left: `${label.position}%`,
                  transform: 'translateX(-10%)'
                }}
              >
                <div className="text-xs text-gray-500 font-medium text-center">
                  {label.hour}
                </div>
                <div className="w-px h-2 bg-gray-300 mx-auto mt-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Legend - Only show activities that exist in data */}
        <div className="flex flex-wrap gap-1 justify-center mt-2 border-t border-gray-100">
          {Object.entries(ACTIVITY_NAMES)
            .filter(([id]) => filledActivities.some(activity => activity.s_id === parseInt(id)))
            .map(([id, name]) => (
              <div key={id} className="flex items-center gap-1 group cursor-pointer">
                <div
                  className="w-2 h-2 rounded-sm transition-all duration-200 group-hover:scale-110"
                  style={{ 
                    backgroundColor: ACTIVITY_COLORS[parseInt(id)],
                    boxShadow: `0 2px 4px ${ACTIVITY_COLORS[parseInt(id)]}40`
                  }}
                />
                <span className="text-xs text-gray-600 font-light group-hover:text-gray-800 transition-colors">
                  {name}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DriverActivityChartHybrid;
