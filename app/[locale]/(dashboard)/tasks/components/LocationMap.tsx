"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Icon } from '@iconify/react';
import loadHereMaps from '@/components/maps/here-map/utils/here-map-loader';
import { decode } from '@/lib/flexible-polyline';

// HERE Maps types// Tambahkan deklarasi global agar linter tidak error
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window {
    H: any;
  }
}

interface LocationData {
  startLocation: { lat: number; lon: number } | null;
  endLocation: { lat: number; lon: number } | null;
  waypoints: { lat: number; lon: number }[];
}

// Component untuk review marker/waypoints
const MarkerReview = ({ 
  startLocation, 
  endLocation, 
  waypoints, 
  onNavigate,
  transportMode,
  onTransportModeChange,
  onInfoToggle
}: {
  startLocation: { lat: number; lon: number } | null;
  endLocation: { lat: number; lon: number } | null;
  waypoints: { lat: number; lon: number }[];
  onNavigate: (type: 'start' | 'end' | 'waypoint' | 'reset', index?: number) => void;
  transportMode: 'car' | 'truck';
  onTransportModeChange: (mode: 'car' | 'truck') => void;
  onInfoToggle: () => void;
}) => {
  const hasWaypoints = waypoints.length > 0;
  
  return (
    <div className="flex items-center justify-center gap-1 mb-2 p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Start Marker (A) */}
      <button
        type="button"
        onClick={() => onNavigate('start')}
        disabled={!startLocation}
        className={`flex items-center justify-center w-7 h-7 rounded-full border text-xs font-bold transition-all duration-200 ${
          startLocation 
            ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600 cursor-pointer' 
            : 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed'
        }`}
        title="Zoom to start location (A)"
      >
        A
      </button>

      {/* Previous Waypoint (<) */}
      <button
        type="button"
        onClick={() => onNavigate('waypoint', -1)}
        disabled={!hasWaypoints}
        className={`flex items-center justify-center w-7 h-7 rounded-full border transition-all duration-200 ${
          hasWaypoints 
            ? 'bg-green-500 text-white border-green-500 hover:bg-green-600 hover:border-green-600 cursor-pointer' 
            : 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed'
        }`}
        title="Previous waypoint"
      >
        <Icon icon="mingcute:arrow-left-fill" width={16} height={16} />
      </button>

      {/* Next Waypoint (>) */}
      <button
        type="button"
        onClick={() => onNavigate('waypoint', 1)}
        disabled={!hasWaypoints}
        className={`flex items-center justify-center w-7 h-7 rounded-full border transition-all duration-200 ${
          hasWaypoints 
            ? 'bg-green-500 text-white border-green-500 hover:bg-green-600 hover:border-green-600 cursor-pointer' 
            : 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed'
        }`}
        title="Next waypoint"
      >
        <Icon icon="mingcute:arrow-right-fill" width={16} height={16} />
      </button>

      {/* End Marker (B) */}
      <button
        type="button"
        onClick={() => onNavigate('end')}
        disabled={!endLocation}
        className={`flex items-center justify-center w-7 h-7 rounded-full border text-xs font-bold transition-all duration-200 ${
          endLocation 
            ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600 cursor-pointer' 
            : 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed'
        }`}
        title="Zoom to end location (B)"
      >
        B
      </button>

      {/* Reset Zoom Button */}
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      <button
        type="button"
        onClick={() => onNavigate('reset')}
        disabled={!startLocation || !endLocation}
        className={`flex items-center justify-center w-7 h-7 rounded-full border transition-all duration-200 ${
          startLocation && endLocation
            ? 'bg-gray-500 text-white border-gray-500 hover:bg-gray-600 hover:border-gray-600 cursor-pointer' 
            : 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed'
        }`}
        title="Reset zoom to show all markers"
      >
        <Icon icon="mdi:view-dashboard" width={14} height={14} />
      </button>

      {/* Transport Mode Buttons */}
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      
      {/* Car Button */}
      <button
        type="button"
        onClick={() => onTransportModeChange('car')}
        className={`flex items-center justify-center w-7 h-7 rounded-full border transition-all duration-200 ${
          transportMode === 'car'
            ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600 cursor-pointer' 
            : 'bg-gray-200 text-gray-600 border-gray-200 hover:bg-gray-300 hover:border-gray-300 cursor-pointer'
        }`}
        title="Car route mode"
      >
        <Icon icon="mdi:car" width={14} height={14} />
      </button>

      {/* Truck Button */}
      <button
        type="button"
        onClick={() => onTransportModeChange('truck')}
        className={`flex items-center justify-center w-7 h-7 rounded-full border transition-all duration-200 ${
          transportMode === 'truck'
            ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600 cursor-pointer' 
            : 'bg-gray-200 text-gray-600 border-gray-200 hover:bg-gray-300 hover:border-gray-300 cursor-pointer'
        }`}
        title="Truck route mode"
      >
        <Icon icon="mdi:truck" width={14} height={14} />
      </button>

      {/* Info Button */}
      <button
        type="button"
        onClick={() => onInfoToggle()}
        className="flex items-center justify-center w-7 h-7 rounded-full border transition-all duration-200 bg-gray-200 text-gray-600 border-gray-200 hover:bg-gray-300 hover:border-gray-300 cursor-pointer"
        title="Show/hide instructions"
      >
        <Icon icon="mdi:information" width={14} height={14} />
      </button>
    </div>
  );
};

export default function LocationMap({
  // ...existing code...
  lat,
  lon,
  onChange,
  onLocationDataChange,
  // Tambahkan props baru untuk start dan end location
  startLocation: externalStartLocation,
  endLocation: externalEndLocation,
  waypoints: externalWaypoints,
  taskType = 2, // Default to task type 2 (full route)
  onStartLocationChange,
  onEndLocationChange,
  shouldFitBounds = false,
  shouldZoomToStart = false,
}: {
  lat: string;
  lon: string;
  onChange: (lat: string, lon: string) => void;
  onLocationDataChange?: (data: LocationData) => void;
  // Props baru
  startLocation?: { lat: number; lon: number } | null;
  endLocation?: { lat: number; lon: number } | null;
  waypoints?: { lat: number; lon: number }[] | null;
  taskType?: number; // 1 = destination only, 2 = full route
  onStartLocationChange?: (location: { lat: number; lon: number } | null) => void;
  onEndLocationChange?: (location: { lat: number; lon: number } | null) => void;
  shouldFitBounds?: boolean;
  shouldZoomToStart?: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);
  const platformRef = useRef<unknown>(null);
  const uiRef = useRef<unknown>(null);
  const startMarkerRef = useRef<unknown>(null);
  const endMarkerRef = useRef<unknown>(null);
  const routeLineRef = useRef<unknown>(null);
  const waypointMarkersRef = useRef<unknown[]>([]);
  const behaviorRef = useRef<unknown>(null);
  const isDraggingRef = useRef(false); // Track if we're currently dragging
  const isAddingWaypointRef = useRef(false); // Track if we're currently adding waypoint
  const isDraggingWaypointRef = useRef(false); // Track if we're currently dragging a waypoint
  const dragEventListenersRef = useRef<{ 
    dragstart: (ev: unknown) => void; 
    drag: (ev: unknown) => void; 
    dragend: () => void; 
  } | null>(null);

  // Untuk suppress context menu setelah double tap
  const suppressNextContextMenuRef = useRef(false);

  // SEMUA deklarasi state harus di atas sebelum useEffect
  const [startLocation, setStartLocation] = useState<{ lat: number; lon: number } | null>(
    externalStartLocation || null
  );
  const [endLocation, setEndLocation] = useState<{ lat: number; lon: number } | null>(
    externalEndLocation || null
  );
  const [originalWaypoints, setOriginalWaypoints] = useState<{ lat: number; lon: number }[]>([]);
  const [optimizedWaypoints, setOptimizedWaypoints] = useState<{ lat: number; lon: number }[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [shouldAutoFit, setShouldAutoFit] = useState(false);
  const [hasInitialRoute, setHasInitialRoute] = useState(false);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(-1); // -1 = start, -2 = end, 0+ = waypoint index
  const [transportMode, setTransportMode] = useState<'car' | 'truck'>('truck'); // Default to truck
  const [showInfo, setShowInfo] = useState(false); // State untuk mengontrol visibility info

  // Konstanta untuk padding yang konsisten
  const PADDING = 0.2; // Padding dalam derajat untuk fit bounds (maximum)
  
  // Helper function to calculate dynamic padding based on distance
  const calculateDynamicPadding = (points: { lat: number; lon: number }[]): number => {
    if (points.length < 2) return 0.01; // Default minimum padding for single point
    
    let minLat = points[0].lat, maxLat = points[0].lat, minLon = points[0].lon, maxLon = points[0].lon;
    points.forEach(pt => {
      if (pt.lat < minLat) minLat = pt.lat;
      if (pt.lat > maxLat) maxLat = pt.lat;
      if (pt.lon < minLon) minLon = pt.lon;
      if (pt.lon > maxLon) maxLon = pt.lon;
    });
    
    const latRange = maxLat - minLat;
    const lonRange = maxLon - minLon;
    const maxRange = Math.max(latRange, lonRange);
    
    // Use minimum padding for very close points, scale up for distant points
    const minPadding = 0.01; // ~1km minimum padding
    const dynamicPadding = Math.max(minPadding, maxRange * 0.1); // 10% of range, minimum 1km
    return Math.min(dynamicPadding, PADDING); // Cap at original PADDING value
  };

  // Sinkronisasi externalWaypoints ke state originalWaypoints saat edit (hanya jika tidak sedang drag atau add waypoint)
  useEffect(() => {
    if (!isDraggingRef.current && !isAddingWaypointRef.current && !isDraggingWaypointRef.current && externalWaypoints && Array.isArray(externalWaypoints)) {
      // Cek jika data berbeda (untuk mencegah loop)
      const isDifferent =
        externalWaypoints.length !== originalWaypoints.length ||
        externalWaypoints.some((wp, i) =>
          !originalWaypoints[i] ||
          Math.abs(wp.lat - originalWaypoints[i].lat) > 0.000001 ||
          Math.abs(wp.lon - originalWaypoints[i].lon) > 0.000001
        );
      if (isDifferent) {
        setOriginalWaypoints(externalWaypoints);
      }
    }
  }, [externalWaypoints, originalWaypoints]);

  // Fit bounds otomatis saat pertama kali load jika sudah ada start & end (dan/atau waypoints)
  useEffect(() => {
    const map = mapInstance.current;
    // Hanya trigger sekali di awal, jika sudah ada start & end, dan map siap
    if (
      map && isMapReady &&
      startLocation && endLocation &&
      !hasInitialRoute && // pastikan belum pernah fit bounds
      // Validate coordinates are valid numbers
      typeof startLocation.lat === 'number' && !isNaN(startLocation.lat) &&
      typeof startLocation.lon === 'number' && !isNaN(startLocation.lon) &&
      typeof endLocation.lat === 'number' && !isNaN(endLocation.lat) &&
      typeof endLocation.lon === 'number' && !isNaN(endLocation.lon)
    ) {
      // Kumpulkan semua titik: start, end, waypoints
      const points = [startLocation, endLocation, ...originalWaypoints];
      let minLat = points[0].lat, maxLat = points[0].lat, minLon = points[0].lon, maxLon = points[0].lon;
      points.forEach(pt => {
        if (typeof pt.lat === 'number' && !isNaN(pt.lat) && typeof pt.lon === 'number' && !isNaN(pt.lon)) {
          if (pt.lat < minLat) minLat = pt.lat;
          if (pt.lat > maxLat) maxLat = pt.lat;
          if (pt.lon < minLon) minLon = pt.lon;
          if (pt.lon > maxLon) maxLon = pt.lon;
        }
      });
      
      // Use dynamic padding based on distance between points
      const dynamicPadding = calculateDynamicPadding(points);
      
      // Apply dynamic padding
      minLat -= dynamicPadding;
      maxLat += dynamicPadding;
      minLon -= dynamicPadding;
      maxLon += dynamicPadding;
      
      // Buat bounds rectangle
      const bounds = new window.H.geo.Rect(minLat, minLon, maxLat, maxLon);
      (map as any).getViewModel().setLookAtData({ bounds });
      setHasInitialRoute(true);
    }
  }, [isMapReady, startLocation, endLocation, originalWaypoints, hasInitialRoute]);

  const HERE_API_KEY = process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN;

  // Function to snap a point to the nearest road
  const snapToNearestRoad = async (point: { lat: number; lng: number }): Promise<{ lat: number; lng: number }> => {
    if (!window.H) {
      console.error('HERE Maps API not loaded');
      return point;
    }
    if (!platformRef.current) {
      console.error('HERE Platform not initialized');
      return point;
    }
    
    try {
      const router = (platformRef.current as any).getRoutingService(null, 8);
      
      // Create a point slightly offset from the original point to force a route calculation
      const offset = 0.0001; // Small offset (about 11 meters at equator)
      const offsetLat = point.lat + offset;
      const offsetLng = point.lng + offset;
      
      const routingParameters = {
        routingMode: 'fast',
        transportMode: transportMode,
        origin: `${point.lat},${point.lng}`, // Original point
        destination: `${offsetLat},${offsetLng}`, // Slightly offset point
        return: 'polyline,summary',
        alternatives: 1
        // apiKey is automatically added by the HERE Maps SDK
      };

      return new Promise((resolve) => {
        router.calculateRoute(
          routingParameters,
          (result: any) => {
            if (result?.routes?.[0]?.sections?.[0]?.departure?.place?.location) {
              // Get the snapped departure point (should be on a road)
              const snappedPoint = result.routes[0].sections[0].departure.place.location;
              resolve({
                lat: snappedPoint.lat,
                lng: snappedPoint.lng
              });
              return;
            }
            resolve(point);
          },
          (error: any) => {
            console.error('Error in routing API:', error);
            if (error.details) {
              console.error('Error details:', error.details);
            }
            resolve(point);
          }
        );
      });
    } catch (error) {
      console.error('Exception in snapToNearestRoad:', error);
      return point;
    }
  };

  // Fungsi untuk menghitung jarak antara dua titik (Haversine formula)
  function calculateDistance(point1: { lat: number; lon: number }, point2: { lat: number; lon: number }): number {
    const R = 6371; // Radius bumi dalam km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lon - point1.lon) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Fungsi untuk mengoptimasi urutan waypoints menggunakan Nearest Neighbor
  function optimizeWaypoints(
    start: { lat: number; lon: number },
    end: { lat: number; lon: number },
    waypoints: { lat: number; lon: number }[]
  ): { lat: number; lon: number }[] {
    if (waypoints.length <= 1) return waypoints;
    
    const optimized: { lat: number; lon: number }[] = [];
    const unvisited = [...waypoints];
    
    // Mulai dari titik terdekat dengan start
    let current = start;
    
    while (unvisited.length > 0) {
      // Cari waypoint terdekat dengan current point
      let nearestIndex = 0;
      let minDistance = calculateDistance(current, unvisited[0]);
      
      for (let i = 1; i < unvisited.length; i++) {
        const distance = calculateDistance(current, unvisited[i]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }
      
      // Pindahkan waypoint terdekat ke optimized array
      optimized.push(unvisited[nearestIndex]);
      current = unvisited[nearestIndex];
      unvisited.splice(nearestIndex, 1);
    }
    
    return optimized;
  }

  // Helper: Marker Icon with color by type
  function getMarkerIcon(id: string | number, currentTaskType: number = 2) {
    let fill = "#0099D8"; // default blue
    let stroke = "#0099D8";
    
    if (currentTaskType === 1) {
      // Task Type 1: Use simple location marker instead of A/B
      fill = "#dc2626"; // red for destination
      stroke = "#dc2626";
      const svgCircle = `<svg width="30" height="30" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <g id="marker">
          <circle cx="15" cy="15" r="10" fill="${fill}" stroke="${stroke}" stroke-width="4" />
          <circle cx="15" cy="15" r="4" fill="#FFFFFF" />
        </g></svg>`;
      return new window.H.map.Icon(svgCircle, { anchor: { x: 15, y: 15 } });
    } else {
      // Task Type 2: Use A/B markers
      if (id === "A") {
        fill = "#0099D8"; // blue
        stroke = "#0099D8";
      } else if (id === "B") {
        fill = "#dc2626"; // red
        stroke = "#dc2626";
      } else {
        fill = "#22c55e"; // green
        stroke = "#22c55e";
      }
      const svgCircle = `<svg width="30" height="30" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <g id="marker">
          <circle cx="15" cy="15" r="10" fill="${fill}" stroke="${stroke}" stroke-width="4" />
          <text x="50%" y="50%" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="12px" dy=".3em">${id}</text>
        </g></svg>`;
      return new window.H.map.Icon(svgCircle, { anchor: { x: 15, y: 15 } });
    }
  }

  // Load HERE Maps JS API using utility
  const [mapLoaded, setMapLoaded] = useState(false);
  useEffect(() => {
    loadHereMaps(() => {
      setMapLoaded(true);
    });
  }, []);

  // Initialize HERE Map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    if (!mapLoaded || !window.H || !window.H.Map) return;

    // Default center: Lithuania/Eropa
    const defaultCenter = { lat: 55.1694, lng: 23.8813 };

    // Fungsi untuk inisialisasi map
    const initMap = (center: { lat: number; lng: number }) => {
      platformRef.current = new window.H.service.Platform({ apikey: HERE_API_KEY });
      const engineType = window.H.Map.EngineType["HARP"];
      const defaultLayers = (platformRef.current as any).createDefaultLayers({ engineType });

      const map = new window.H.Map(
        mapRef.current,
        defaultLayers.vector.normal.logistics,
        {
          engineType,
          center,
          zoom: 8,
          pixelRatio: window.devicePixelRatio || 1,
        }
      );

      window.addEventListener('resize', () => map.getViewPort().resize());
      mapInstance.current = map;
      uiRef.current = window.H.ui.UI.createDefault(map, defaultLayers);
      setIsMapReady(true);

      // Enable map interaction
      if (window.H && window.H.mapevents) {
        behaviorRef.current = new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(map));
      }

      // Initialize with current lat/lon if provided
      if (lat && lon) {
        const initialLocation = { lat: parseFloat(lat), lon: parseFloat(lon) };
        setStartLocation(initialLocation);
      }
    };

    // Jika lat/lon ada, langsung inisialisasi map
    if (lat && lon) {
      initMap({ lat: parseFloat(lat), lng: parseFloat(lon) });
      return;
    }

    // Jika tidak ada lat/lon, coba geolokasi user
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userCenter = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          initMap(userCenter);
        },
        (err) => {
          console.warn('[LocationMap] Gagal dapat lokasi user:', err);
          // Gagal dapat lokasi user, pakai default Lithuania
          initMap(defaultCenter);
        },
        { timeout: 5000 }
      );
    } else {
      // Geolokasi tidak tersedia
      console.warn('[LocationMap] navigator.geolocation tidak tersedia, pakai default.');
      initMap(defaultCenter);
    }
  }, [lat, lon, HERE_API_KEY, mapLoaded]);

  // Refresh markers (start, end, waypoints)
  const refreshMarkers = useCallback((map: any) => {
    // Remove old markers
    if (startMarkerRef.current) { map.removeObject(startMarkerRef.current); startMarkerRef.current = null; }
    if (endMarkerRef.current) { map.removeObject(endMarkerRef.current); endMarkerRef.current = null; }
    if (waypointMarkersRef.current.length > 0) {
      waypointMarkersRef.current.forEach((m: any) => map.removeObject(m));
      waypointMarkersRef.current = [];
    }

    if (taskType === 1) {
      // Task Type 1: Only destination marker (stored in endLocation)
      if (endLocation) {
        const marker = new window.H.map.Marker({ lat: endLocation.lat, lng: endLocation.lon }, {
          data: { id: 'destination' },
          icon: getMarkerIcon('destination', taskType),
          volatility: true
        });
        marker.draggable = true;
        map.addObject(marker);
        endMarkerRef.current = marker;
      }
    } else {
      // Task Type 2: Start marker (A) and End marker (B)
      // Add start marker (A)
      if (startLocation) {
        const marker = new window.H.map.Marker({ lat: startLocation.lat, lng: startLocation.lon }, {
          data: { id: 'A' },
          icon: getMarkerIcon('A', taskType),
          volatility: true
        });
        marker.draggable = true;
        map.addObject(marker);
        startMarkerRef.current = marker;
      }

      // Add end marker (B)
      if (endLocation) {
        const marker = new window.H.map.Marker({ lat: endLocation.lat, lng: endLocation.lon }, {
          data: { id: 'B' },
          icon: getMarkerIcon('B', taskType),
          volatility: true
        });
        marker.draggable = true;
        map.addObject(marker);
        endMarkerRef.current = marker;
      }
    }

    // Add waypoint markers - only for task type 2
    if (taskType === 2) {
      optimizedWaypoints.forEach((wp, idx) => {
        // Find original index of this optimized waypoint
        const originalIndex = originalWaypoints.findIndex(owp => 
          Math.abs(owp.lat - wp.lat) < 0.000001 && Math.abs(owp.lon - wp.lon) < 0.000001
        );
        
        const marker = new window.H.map.Marker({ lat: wp.lat, lng: wp.lon }, {
          data: { 
            id: idx + 1, 
            optimizedIndex: idx,
            originalIndex: originalIndex >= 0 ? originalIndex : idx
          },
          icon: getMarkerIcon(idx + 1, taskType),
          volatility: true
        });
        marker.draggable = true;
        
        // Add dragend event listener to snap to nearest road
        marker.addEventListener('dragend', async (evt: any) => {
          const target = evt.target;
          const originalPosition = target.getGeometry();
          const originalLat = originalPosition.lat;
          const originalLng = originalPosition.lng;
          
          try {
            // Show loading state or disable marker during processing
            target.setIcon(getMarkerIcon('...', taskType));
            
            // Snap to nearest road
            const snappedPoint = await snapToNearestRoad({ lat: originalLat, lng: originalLng });
            
            // Update marker position
            target.setGeometry(snappedPoint);
            
            // Update waypoints state with new position
            const originalIndex = target.getData().originalIndex;
            if (originalIndex >= 0) {
              setOriginalWaypoints(prev => {
                const newArr = [...prev];
                if (originalIndex < newArr.length) {
                  newArr[originalIndex] = { lat: snappedPoint.lat, lon: snappedPoint.lng };
                }
                return newArr;
              });
            }
          } catch (error) {
            console.error('Error snapping waypoint to road:', error);
            // Revert to original position if there's an error
            target.setGeometry(originalPosition);
          } finally {
            // Restore original icon
            target.setIcon(getMarkerIcon(idx + 1, taskType));
          }
        }, false);
        
        map.addObject(marker);
        waypointMarkersRef.current.push(marker);
      });
    }
  }, [startLocation, endLocation, optimizedWaypoints, originalWaypoints, transportMode, taskType]);

  // Fetch route from HERE API
  const fetchRoute = useCallback(async () => {
    // Only fetch route for task type 2 (full route)
    if (taskType === 1) return;
    if (!startLocation || !endLocation) return;

    const params = new URLSearchParams();
    params.append('origin', `${startLocation.lat},${startLocation.lon}`);
    
    // Add optimized waypoints as 'via'
    optimizedWaypoints.forEach(wp => {
      params.append('via', `${wp.lat},${wp.lon}`);
    });
    
    params.append('destination', `${endLocation.lat},${endLocation.lon}`);
    params.append('routingMode', 'fast');
    params.append('transportMode', transportMode);
    params.append('return', 'polyline,summary');
    params.append('apiKey', HERE_API_KEY);

    const url = `https://router.hereapi.com/v8/routes?${params.toString()}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const map = mapInstance.current;
        
        // Remove old route
        if (routeLineRef.current) {
          (map as any).removeObject(routeLineRef.current);
        }
        
        // Create polyline from route
        let allCoords: [number, number][] = [];
        route.sections.forEach((section: unknown) => {
          // decode returns number[][], but we want [number, number][]
          const decoded: [number, number][] = decode((section as any).polyline).polyline.map((pt: number[]) => [pt[0], pt[1]]);
          // Hindari duplikasi titik sambungan antar section
          if (allCoords.length > 0 && decoded.length > 0) {
            if (
              allCoords[allCoords.length - 1][0] === decoded[0][0] &&
              allCoords[allCoords.length - 1][1] === decoded[0][1]
            ) {
              allCoords = allCoords.concat(decoded.slice(1));
            } else {
              allCoords = allCoords.concat(decoded);
            }
          } else {
            allCoords = allCoords.concat(decoded);
          }
        });

        // Create LineString from coordinates
        const lineString = new window.H.geo.LineString();
        allCoords.forEach((pt: [number, number]) => lineString.pushPoint({ lat: pt[0], lng: pt[1] }));
        
        const polyline = new window.H.map.Polyline(lineString, {
          style: { strokeColor: '#2563eb', lineWidth: 4, opacity: 0.8 }
        });
        
        (map as any).addObject(polyline);
        routeLineRef.current = polyline;
        
        // Auto-fit bounds for route if needed
        if (shouldAutoFit && !hasInitialRoute) {
          const bounds = polyline.getBoundingBox();
          (map as any).getViewModel().setLookAtData({ bounds });
          setHasInitialRoute(true);
          setShouldAutoFit(false);
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  }, [startLocation, endLocation, optimizedWaypoints, transportMode, HERE_API_KEY, shouldAutoFit, hasInitialRoute, taskType]);

  // Effect: Render markers when locations change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.H || !isMapReady) return;
    refreshMarkers(map);
  }, [startLocation, endLocation, optimizedWaypoints, isMapReady, refreshMarkers]);

  // Effect: Fetch route when start, end, or optimized waypoints change
  useEffect(() => {
    if (startLocation && endLocation && taskType === 2) {
      fetchRoute();
    } else {
      // Clear existing route when conditions are not met or task type is 1
      const map = mapInstance.current;
      if (map && routeLineRef.current) {
        (map as any).removeObject(routeLineRef.current);
        routeLineRef.current = null;
      }
    }
  }, [startLocation, endLocation, optimizedWaypoints, fetchRoute, transportMode, taskType]);

  // Effect: Optimize waypoints when originalWaypoints change
  useEffect(() => {
    if (startLocation && endLocation && originalWaypoints.length > 0) {
      const optimized = optimizeWaypoints(startLocation, endLocation, originalWaypoints);
      setOptimizedWaypoints(optimized);
    } else {
      // Always update optimizedWaypoints even without start/end locations
      setOptimizedWaypoints(originalWaypoints);
    }
  }, [startLocation, endLocation, originalWaypoints, transportMode]);

  // Effect: Sync external props with internal state - FIXED to prevent infinite loop
  useEffect(() => {
    // Only update if external props are different and we're not dragging
    if (!isDraggingRef.current) {
      // Handle both cases: when externalStartLocation exists and when it's null
      if (externalStartLocation && (
        !startLocation || 
        startLocation.lat !== externalStartLocation.lat || 
        startLocation.lon !== externalStartLocation.lon
      )) {
        setStartLocation(externalStartLocation);
      } else if (!externalStartLocation && startLocation) {
        // Clear startLocation when external prop becomes null
        setStartLocation(null);
      }
    }
  }, [externalStartLocation, startLocation]); // Add startLocation back for null check

  useEffect(() => {
    // Only update if external props are different and we're not dragging
    if (!isDraggingRef.current) {
      // Handle both cases: when externalEndLocation exists and when it's null
      if (externalEndLocation && (
        !endLocation || 
        endLocation.lat !== externalEndLocation.lat || 
        endLocation.lon !== externalEndLocation.lon
      )) {
        setEndLocation(externalEndLocation);
      } else if (!externalEndLocation && endLocation) {
        // Clear endLocation when external prop becomes null
        setEndLocation(null);
      }
    }
  }, [externalEndLocation, endLocation]); // Add endLocation back for null check



  // Effect: Handle zoom behavior based on flags
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.H || !isMapReady) return;

    if (shouldZoomToStart && startLocation && 
        typeof startLocation.lat === 'number' && !isNaN(startLocation.lat) &&
        typeof startLocation.lon === 'number' && !isNaN(startLocation.lon)) {
      // Zoom to start location only
      (map as any).setCenter({ lat: startLocation.lat, lng: startLocation.lon });
      (map as any).setZoom(15);
    } else if (shouldZoomToStart && endLocation && 
               typeof endLocation.lat === 'number' && !isNaN(endLocation.lat) &&
               typeof endLocation.lon === 'number' && !isNaN(endLocation.lon)) {
      // For task type 1, zoom to end location (destination)
      (map as any).setCenter({ lat: endLocation.lat, lng: endLocation.lon });
      (map as any).setZoom(15);
    } else if (shouldFitBounds && startLocation && endLocation &&
               typeof startLocation.lat === 'number' && !isNaN(startLocation.lat) &&
               typeof startLocation.lon === 'number' && !isNaN(startLocation.lon) &&
               typeof endLocation.lat === 'number' && !isNaN(endLocation.lat) &&
               typeof endLocation.lon === 'number' && !isNaN(endLocation.lon)) {
      // Fit bounds to show both start and end with dynamic padding
      const points = [startLocation, endLocation];
      const dynamicPadding = calculateDynamicPadding(points);
      const bounds = new window.H.geo.Rect(
        Math.min(startLocation.lat, endLocation.lat) - dynamicPadding,
        Math.min(startLocation.lon, endLocation.lon) - dynamicPadding,
        Math.max(startLocation.lat, endLocation.lat) + dynamicPadding,
        Math.max(startLocation.lon, endLocation.lon) + dynamicPadding
      );
      (map as any).getViewModel().setLookAtData({ bounds });
    }
  }, [shouldZoomToStart, shouldFitBounds, startLocation, endLocation, isMapReady]);

  // Handle map clicks to set start/end locations - REMOVED, now handled by right-click/long press

  // Helper function to show context menu for adding start/end locations or waypoints
  const showContextMenu = (evt: any) => {
    const map = mapInstance.current;
    
    // Get coordinates - handle both mouse and touch events
    let coord;
    let clientX, clientY;
    
    try {
      if (evt.currentPointer) {
        // HERE Maps event
        coord = (map as any).screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY);
        clientX = evt.currentPointer.viewportX;
        clientY = evt.currentPointer.viewportY;
      } else if (evt.touches && evt.touches[0]) {
        // Touch event (mobile)
        const touch = evt.touches[0];
        const target = evt.currentTarget || evt.target;
        if (!target) {
          console.error('No valid target for touch event');
          return;
        }
        const rect = target.getBoundingClientRect();
        const viewportX = touch.clientX - rect.left;
        const viewportY = touch.clientY - rect.top;
        coord = (map as any).screenToGeo(viewportX, viewportY);
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        // Mouse event (desktop)
        const target = evt.currentTarget || evt.target;
        if (!target) {
          console.error('No valid target for mouse event');
          return;
        }
        const rect = target.getBoundingClientRect();
        const viewportX = evt.clientX - rect.left;
        const viewportY = evt.clientY - rect.top;
        coord = (map as any).screenToGeo(viewportX, viewportY);
        clientX = evt.clientX;
        clientY = evt.clientY;
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
      return;
    }
    
    if (!coord) return;
    
    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = `${clientX}px`;
    contextMenu.style.top = `${clientY}px`;
    contextMenu.style.background = 'white';
    contextMenu.style.border = '1px solid #ccc';
    contextMenu.style.borderRadius = '8px';
    contextMenu.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
    contextMenu.style.zIndex = '1000';
    contextMenu.style.padding = '8px 0';
    contextMenu.style.minWidth = '180px';
    contextMenu.style.maxWidth = '240px';
    
    // Add close button for mobile
    if ('ontouchstart' in window) {
      const closeButton = document.createElement('div');
      closeButton.innerHTML = '✕';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '-18px';
      closeButton.style.right = '-18px';
      closeButton.style.width = '32px';
      closeButton.style.height = '32px';
      closeButton.style.display = 'flex';
      closeButton.style.alignItems = 'center';
      closeButton.style.justifyContent = 'center';
      closeButton.style.cursor = 'pointer';
      closeButton.style.fontSize = '12px';
      closeButton.style.color = '#666';
      closeButton.style.borderRadius = '50%';
      closeButton.style.backgroundColor = '#f0f0f0';
      
      closeButton.addEventListener('click', () => {
        if (contextMenu) {
          document.body.removeChild(contextMenu);
        }
      });
      
      contextMenu.appendChild(closeButton);
    }
    
    // Determine what options to show based on current state and task type
    // For task type specific logic
    const hasStart = taskType === 2 ? !!startLocation : false; // Task type 1 doesn't have start location
    const hasEnd = !!endLocation;
    
    // Function to create menu item
    const createMenuItem = (text: string, onClick: () => void, color: string = '#333') => {
      const menuItem = document.createElement('div');
      menuItem.textContent = text;
      menuItem.style.padding = '8px 12px';
      menuItem.style.cursor = 'pointer';
      menuItem.style.fontSize = '14px';
      menuItem.style.color = color;
      menuItem.style.borderBottom = '1px solid #f0f0f0';
      
      // Add touch-friendly styling for mobile
      if ('ontouchstart' in window) {
        menuItem.style.minHeight = '44px';
        menuItem.style.display = 'flex';
        menuItem.style.alignItems = 'center';
        if (text.includes('Start')) {
          menuItem.style.paddingTop = '12px'; // Extra padding for close button
        }
      }
      
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.background = '#f0f0f0';
      });
      
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.background = 'transparent';
      });
      
      menuItem.addEventListener('click', onClick);
      menuItem.addEventListener('touchend', onClick);
      
      return menuItem;
    };
    
    if (taskType === 1) {
      // Task Type 1: Only destination option
      const destinationItem = createMenuItem(
        hasEnd ? '📍Move Destination' : '📍Add Destination', 
        () => {
          const newDestination = { lat: coord.lat, lon: coord.lng };
          setEndLocation(newDestination); // Store destination in endLocation
          onChange(coord.lat.toString(), coord.lng.toString());
          if (onEndLocationChange) {
            onEndLocationChange(newDestination);
          }
          
          // Zoom to destination
          setTimeout(() => {
            const map = mapInstance.current;
            if (map && window.H && isMapReady) {
              (map as any).setCenter({ lat: coord.lat, lng: coord.lng });
              (map as any).setZoom(15);
            }
          }, 100);
          
          document.body.removeChild(contextMenu);
        }, 
        '#dc2626' // Red color for destination
      );
      contextMenu.appendChild(destinationItem);
    } else {
      // Task Type 2: Start and End Location options
      // Always show Start Location option
      const startItem = createMenuItem(
        hasStart ? '📍Move Start Location(A)' : '📍Add Start Location(A)', 
        () => {
          const newStart = { lat: coord.lat, lon: coord.lng };
          setStartLocation(newStart);
          onChange(coord.lat.toString(), coord.lng.toString());
          if (onStartLocationChange) {
            onStartLocationChange(newStart);
          }
          
          // If end location already exists, fit bounds with dynamic padding immediately
          if (endLocation) {
            setTimeout(() => {
              const map = mapInstance.current;
              if (map && window.H && isMapReady) {
                const points = [newStart, endLocation];
                const dynamicPadding = calculateDynamicPadding(points);
                const bounds = new window.H.geo.Rect(
                  Math.min(newStart.lat, endLocation.lat) - dynamicPadding,
                  Math.min(newStart.lon, endLocation.lon) - dynamicPadding,
                  Math.max(newStart.lat, endLocation.lat) + dynamicPadding,
                  Math.max(newStart.lon, endLocation.lon) + dynamicPadding
                );
                (map as any).getViewModel().setLookAtData({ bounds });
              }
            }, 100);
          }
          
          document.body.removeChild(contextMenu);
        }, 
        '#2563eb' // Blue color for start
      );
      contextMenu.appendChild(startItem);
      
      // Always show End Location option
      const endItem = createMenuItem(
        hasEnd ? '🎯Move End Location(B)' : '🎯Add End Location(B)', 
        () => {
          const newEnd = { lat: coord.lat, lon: coord.lng };
          setEndLocation(newEnd);
          if (onEndLocationChange) {
            onEndLocationChange(newEnd);
          }
          // Enable auto fit when both start and end are set for the first time
          if (!hasStart || !hasEnd) {
            setShouldAutoFit(true);
            // Also trigger immediate fit bounds with dynamic padding for better UX
            setTimeout(() => {
              const map = mapInstance.current;
              if (map && window.H && isMapReady) {
                const points = startLocation ? [startLocation, {lat: coord.lat, lon: coord.lng}] : [{lat: coord.lat, lon: coord.lng}];
                const dynamicPadding = calculateDynamicPadding(points);
                const bounds = new window.H.geo.Rect(
                  Math.min(startLocation?.lat || coord.lat, coord.lat) - dynamicPadding,
                  Math.min(startLocation?.lon || coord.lng, coord.lng) - dynamicPadding,
                  Math.max(startLocation?.lat || coord.lat, coord.lat) + dynamicPadding,
                  Math.max(startLocation?.lon || coord.lng, coord.lng) + dynamicPadding
                );
                (map as any).getViewModel().setLookAtData({ bounds });
              }
            }, 100); // Small delay to ensure state is updated
          } else {
            // If both start and end already exist, fit bounds immediately
            setTimeout(() => {
              const map = mapInstance.current;
              if (map && window.H && isMapReady && startLocation) {
                const points = [startLocation, {lat: coord.lat, lon: coord.lng}];
                const dynamicPadding = calculateDynamicPadding(points);
                const bounds = new window.H.geo.Rect(
                  Math.min(startLocation.lat, coord.lat) - dynamicPadding,
                  Math.min(startLocation.lon, coord.lng) - dynamicPadding,
                  Math.max(startLocation.lat, coord.lat) + dynamicPadding,
                  Math.max(startLocation.lon, coord.lng) + dynamicPadding
                );
                (map as any).getViewModel().setLookAtData({ bounds });
              }
            }, 100);
          }
          document.body.removeChild(contextMenu);
        }, 
        '#dc2626' // Red color for end
      );
      contextMenu.appendChild(endItem);
    }
    
    // Add Waypoint option (only for task type 2 and if both start and end exist)
    if (taskType === 2 && hasStart && hasEnd) {
      const waypointItem = createMenuItem('➕ Add Waypoint', () => {
        // Show loading state
        waypointItem.textContent = 'Snapping to road...';
        waypointItem.style.cursor = 'wait';
        waypointItem.style.opacity = '0.7';
        
        // Set flag to prevent external sync during waypoint addition
        isAddingWaypointRef.current = true;
        
        // Snap to nearest road before adding waypoint
        snapToNearestRoad({ lat: coord.lat, lng: coord.lng })
          .then((snappedPoint) => {
            setOriginalWaypoints(prev => {
              // Check if waypoint already exists (prevent duplicates)
              const exists = prev.some(wp => 
                Math.abs(wp.lat - snappedPoint.lat) < 0.000001 && 
                Math.abs(wp.lon - snappedPoint.lng) < 0.000001
              );
              
              if (exists) {
                return prev;
              }
              
              const newWaypoints = [...prev, { lat: snappedPoint.lat, lon: snappedPoint.lng }];
              
              // Notify parent immediately with new waypoints
              setTimeout(() => {
                isAddingWaypointRef.current = false;
                if (onLocationDataChange) {
                  onLocationDataChange({
                    startLocation,
                    endLocation,
                    waypoints: newWaypoints
                  });
                }
              }, 50);
              
              return newWaypoints;
            });
          })
          .catch((error) => {
            console.error('Error snapping waypoint to road:', error);
            // Fallback to original coordinates if snapping fails
            setOriginalWaypoints(prev => {
              // Check if waypoint already exists (prevent duplicates)
              const exists = prev.some(wp => 
                Math.abs(wp.lat - coord.lat) < 0.000001 && 
                Math.abs(wp.lon - coord.lng) < 0.000001
              );
              
              if (exists) {
                return prev;
              }
              
              const newWaypoints = [...prev, { lat: coord.lat, lon: coord.lng }];
              
              // Notify parent immediately with new waypoints
              setTimeout(() => {
                isAddingWaypointRef.current = false;
                if (onLocationDataChange) {
                  onLocationDataChange({
                    startLocation,
                    endLocation,
                    waypoints: newWaypoints
                  });
                }
              }, 50);
              
              return newWaypoints;
            });
          })
          .finally(() => {
            document.body.removeChild(contextMenu);
          });
      }, '#059669'); // Green color for waypoint
      contextMenu.appendChild(waypointItem);
    }
    
    // Remove last border-bottom
    const lastItem = contextMenu.lastElementChild;
    if (lastItem) {
      (lastItem as HTMLElement).style.borderBottom = 'none';
    }
    
    document.body.appendChild(contextMenu);
    
    // Close context menu when clicking elsewhere (desktop only)
    if (!('ontouchstart' in window)) {
      const closeContextMenu = (evt: Event) => {
        if (contextMenu && !contextMenu.contains(evt.target as Node)) {
          document.body.removeChild(contextMenu);
          document.removeEventListener('click', closeContextMenu);
        }
      };
      
      setTimeout(() => {
        document.addEventListener('click', closeContextMenu, true);
      }, 300);
    }
  };

  // Helper function to show delete waypoint menu
  const showWaypointDeleteMenu = (evt: any, marker: any) => {
    // Get mouse/touch coordinates for menu positioning
    let clientX, clientY;
    
    if (evt.currentPointer) {
      // HERE Maps event
      clientX = evt.currentPointer.viewportX;
      clientY = evt.currentPointer.viewportY;
    } else if (evt.touches && evt.touches[0]) {
      // Touch event
      const touch = evt.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      // Mouse event
      clientX = evt.clientX;
      clientY = evt.clientY;
    }
    
    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = `${clientX}px`;
    contextMenu.style.top = `${clientY}px`;
    contextMenu.style.background = 'white';
    contextMenu.style.border = '1px solid #ccc';
    contextMenu.style.borderRadius = '8px';
    contextMenu.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
    contextMenu.style.zIndex = '1000';
    contextMenu.style.padding = '8px 0';
    contextMenu.style.minWidth = '140px';
    
    // Add close button for mobile
    if ('ontouchstart' in window) {
      const closeButton = document.createElement('div');
      closeButton.innerHTML = '✕';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '4px';
      closeButton.style.right = '8px';
      closeButton.style.width = '20px';
      closeButton.style.height = '20px';
      closeButton.style.display = 'flex';
      closeButton.style.alignItems = 'center';
      closeButton.style.justifyContent = 'center';
      closeButton.style.cursor = 'pointer';
      closeButton.style.fontSize = '12px';
      closeButton.style.color = '#666';
      closeButton.style.borderRadius = '50%';
      closeButton.style.backgroundColor = '#f0f0f0';
      
      closeButton.addEventListener('click', () => {
        if (contextMenu) {
          document.body.removeChild(contextMenu);
        }
      });
      
      contextMenu.appendChild(closeButton);
    }
    
    const menuItem = document.createElement('div');
    menuItem.textContent = 'Delete Waypoint';
    menuItem.style.padding = '8px 12px';
    menuItem.style.cursor = 'pointer';
    menuItem.style.fontSize = '14px';
    menuItem.style.color = '#dc2626'; // Red color for delete
    
    // Add touch-friendly styling for mobile
    if ('ontouchstart' in window) {
      menuItem.style.minHeight = '44px';
      menuItem.style.display = 'flex';
      menuItem.style.alignItems = 'center';
      menuItem.style.paddingTop = '12px';
    }
    
    menuItem.addEventListener('mouseenter', () => {
      menuItem.style.background = '#fef2f2'; // Light red background
    });
    
    menuItem.addEventListener('mouseleave', () => {
      menuItem.style.background = 'transparent';
    });
    
    menuItem.addEventListener('click', () => {
      const originalIndex = marker.getData().originalIndex;
      if (originalIndex >= 0) {
        setOriginalWaypoints(prev => {
          const newArr = [...prev];
          if (originalIndex < newArr.length) {
            newArr.splice(originalIndex, 1);
          }
          return newArr;
        });
      }
      document.body.removeChild(contextMenu);
    });
    
    contextMenu.appendChild(menuItem);
    document.body.appendChild(contextMenu);
    
    // Close context menu when clicking elsewhere (desktop only)
    if (!('ontouchstart' in window)) {
      const closeContextMenu = (evt: Event) => {
        if (contextMenu && !contextMenu.contains(evt.target as Node)) {
          document.body.removeChild(contextMenu);
          document.removeEventListener('click', closeContextMenu);
        }
      };
      
      setTimeout(() => {
        document.addEventListener('click', closeContextMenu, true);
      }, 100);
    }
  };

  // Handle right-click for waypoints and waypoint deletion, plus mobile long press
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.H || !isMapReady) return;
    

    let contextMenu: HTMLDivElement | null = null;
    let longPressTimer: NodeJS.Timeout | null = null;
    let touchStartX = 0;
    let touchStartY = 0;
    const MOVE_THRESHOLD = 10; // px

    const handleContextMenu = (evt: any) => {
      // Cegah context menu jika suppressNextContextMenuRef aktif (misal setelah double tap)
      if (suppressNextContextMenuRef.current) {
        evt.preventDefault();
        suppressNextContextMenuRef.current = false;
        return;
      }
      evt.preventDefault();
      // Check if right-clicking on a waypoint marker (only for task type 2)
      if (taskType === 2 && evt.target && evt.target instanceof window.H.map.Marker) {
        const markerId = evt.target.getData().id;
        if (markerId !== 'A' && markerId !== 'B' && markerId !== 'destination') {
          showWaypointDeleteMenu(evt, evt.target);
          return;
        }
      }
      showContextMenu(evt);
    };

    const handleTouchStart = (evt: any) => {
      // For task type 1, allow long press regardless of location state
      if (taskType === 1) {
        // Allow long press for task type 1 regardless of location state
      } else {
        // For task type 2, allow long press to add start/end locations
        // Only restrict waypoint addition when both start and end exist
        // But still allow long press for adding start/end locations
      }
      // Jika pinch (2 jari atau lebih), abaikan long press
      if (evt.touches && evt.touches.length > 1) return;
      const touch = evt.touches && evt.touches[0];
      if (touch) {
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      }
      const target = evt.currentTarget;
      target.style.cursor = 'wait';
      longPressTimer = setTimeout(() => {
        showContextMenu(evt);
        target.style.cursor = '';
      }, 500);
    };

    const handleTouchEnd = (evt: any) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      if (evt.currentTarget) {
        evt.currentTarget.style.cursor = '';
      }
    };

    const handleTouchMove = (evt: any) => {
      // Jika pinch (2 jari atau lebih), batalkan long press
      if (evt.touches && evt.touches.length > 1) {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        if (evt.currentTarget) {
          evt.currentTarget.style.cursor = '';
        }
        return;
      }
      // Batalkan long press hanya jika benar-benar bergerak jauh
      const touch = evt.touches && evt.touches[0];
      if (touch) {
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        if (Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD) {
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
          if (evt.currentTarget) {
            evt.currentTarget.style.cursor = '';
          }
        }
      }
    };
    
    // Add event listeners for different platforms
    const viewport = (map as any).getViewPort().element;
    const mapContainer = mapRef.current;
    
    // HERE Maps viewport listener for desktop (right-click)
    viewport.addEventListener('contextmenu', handleContextMenu);
    
    // Add event listeners for mobile (long press)
    viewport.addEventListener('touchstart', handleTouchStart, { passive: false });
    viewport.addEventListener('touchend', handleTouchEnd, { passive: false });
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    // DOM element listener for better macOS compatibility
    if (mapContainer) {
      mapContainer.addEventListener('contextmenu', handleContextMenu);
    }
    
    return () => {
      viewport.removeEventListener('contextmenu', handleContextMenu);
      viewport.removeEventListener('touchstart', handleTouchStart);
      viewport.removeEventListener('touchend', handleTouchEnd);
      viewport.removeEventListener('touchmove', handleTouchMove);
      
      if (mapContainer) {
        mapContainer.removeEventListener('contextmenu', handleContextMenu);
      }
      
      // Clear any pending timers
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
      
      if (contextMenu) {
        document.body.removeChild(contextMenu);
      }
    };
  }, [startLocation, endLocation, isMapReady, transportMode, taskType]);

  // Handle marker dragging - FIXED to prevent recreation on every render
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.H || !isMapReady) return;
    
    // Clean up existing event listeners
    if (dragEventListenersRef.current) {
      const { dragstart, drag, dragend } = dragEventListenersRef.current;
      (map as any).removeEventListener('dragstart', dragstart);
      (map as any).removeEventListener('drag', drag);
      (map as any).removeEventListener('dragend', dragend);
    }
    
    let draggedMarker: any = null;
    let dragType: 'start' | 'end' | 'waypoint' | null = null;
    let dragIdx: number | null = null;
    
    const handleDragStart = function (ev: unknown) {
      const target = (ev as any).target;
      if (target instanceof window.H.map.Marker && target.draggable) {
        isDraggingRef.current = true;
        draggedMarker = target;
        const id = target.getData().id;
        if (id === 'A') dragType = 'start';
        else if (id === 'B' || id === 'destination') dragType = 'end';
        else { 
          dragType = 'waypoint'; 
          dragIdx = target.getData().originalIndex; // Use original index for tracking
          isDraggingWaypointRef.current = true; // Set waypoint dragging flag
        }
        if (behaviorRef.current) (behaviorRef.current as any).disable(window.H.mapevents.Behavior.DRAGGING);
      }
    };
    
    const handleDrag = function (ev: unknown) {
      if (draggedMarker) {
        const pointer = (ev as any).currentPointer;
        const geo = (map as any).screenToGeo(pointer.viewportX, pointer.viewportY);
        draggedMarker.setGeometry(geo);
      }
    };
    
    const handleDragEnd = function () {
      if (draggedMarker) {
        const geo = draggedMarker.getGeometry();
        if (dragType === 'start') {
          const newStart = { lat: geo.lat, lon: geo.lng };
          setStartLocation(newStart);
          onChange(geo.lat.toString(), geo.lng.toString());
          // Call external callback if provided
          if (onStartLocationChange) {
            onStartLocationChange(newStart);
          }
        } else if (dragType === 'end') {
          const newEnd = { lat: geo.lat, lon: geo.lng };
          setEndLocation(newEnd);
          // Call external callback if provided
          if (onEndLocationChange) {
            onEndLocationChange(newEnd);
          }
        } else if (dragType === 'waypoint' && dragIdx !== null) {
          // Update the waypoint directly using original index
          const originalIndex = dragIdx!;
          
          // Snap to nearest road after drag
          snapToNearestRoad({ lat: geo.lat, lng: geo.lng })
            .then((snappedPoint) => {
              setOriginalWaypoints(prev => {
                const newArr = [...prev];
                if (originalIndex >= 0 && originalIndex < newArr.length) {
                  newArr[originalIndex] = { lat: snappedPoint.lat, lon: snappedPoint.lng };
                }
                
                // Notify parent immediately with updated waypoints after drag
                setTimeout(() => {
                  if (onLocationDataChange) {
                    onLocationDataChange({
                      startLocation,
                      endLocation,
                      waypoints: newArr
                    });
                  }
                }, 50);
                
                return newArr;
              });
            })
            .catch((error) => {
              console.error('Error snapping waypoint to road:', error);
              // Fallback to original coordinates if snapping fails
              setOriginalWaypoints(prev => {
                const newArr = [...prev];
                if (originalIndex >= 0 && originalIndex < newArr.length) {
                  newArr[originalIndex] = { lat: geo.lat, lon: geo.lng };
                }
                
                // Notify parent immediately with updated waypoints after drag fallback
                setTimeout(() => {
                  if (onLocationDataChange) {
                    onLocationDataChange({
                      startLocation,
                      endLocation,
                      waypoints: newArr
                    });
                  }
                }, 50);
                
                return newArr;
              });
            });
        }
        draggedMarker = null;
        dragType = null;
        dragIdx = null;
        isDraggingRef.current = false;
        isDraggingWaypointRef.current = false; // Reset waypoint dragging flag
        if (behaviorRef.current) (behaviorRef.current as any).enable(window.H.mapevents.Behavior.DRAGGING);
      }
    };
    
    // Store references to event listeners for cleanup
    dragEventListenersRef.current = { dragstart: handleDragStart, drag: handleDrag, dragend: handleDragEnd };
    
    (map as any).addEventListener('dragstart', handleDragStart, false);
    (map as any).addEventListener('drag', handleDrag, false);
    (map as any).addEventListener('dragend', handleDragEnd, false);
    
    // Cleanup function
    return () => {
      if (dragEventListenersRef.current) {
        const { dragstart, drag, dragend } = dragEventListenersRef.current;
        (map as any).removeEventListener('dragstart', dragstart);
        (map as any).removeEventListener('drag', drag);
        (map as any).removeEventListener('dragend', dragend);
        dragEventListenersRef.current = null;
      }
    };
  }, [isMapReady, onChange, onStartLocationChange, onEndLocationChange, transportMode]); // Only depend on stable values

  // Notify parent component of location data changes - with debounce to prevent infinite loops
  useEffect(() => {
    
    if (onLocationDataChange && !isAddingWaypointRef.current && !isDraggingWaypointRef.current) {
      // Use a timeout to debounce rapid updates during dragging
      const timeoutId = setTimeout(() => {
        onLocationDataChange({
          startLocation,
          endLocation,
          waypoints: optimizedWaypoints // Use optimized waypoints for parent
        });
      }, 100); // 100ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [startLocation, endLocation, optimizedWaypoints, onLocationDataChange]);

  // Handle double-tap to remove waypoints
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.H || !isMapReady) return;
    
    const handleDblTap = (evt: any) => {
      const target = evt.target;
      if (target instanceof window.H.map.Marker) {
        const id = target.getData().id;
        // Only allow removing numbered waypoints, not 'A', 'B', or 'destination'
        if (id !== 'A' && id !== 'B' && id !== 'destination') {
          const originalIndex = target.getData().originalIndex;
          if (originalIndex >= 0) {
            setOriginalWaypoints(prev => {
              const newArr = [...prev];
              if (originalIndex < newArr.length) {
                newArr.splice(originalIndex, 1);
              }
              
              // Notify parent immediately with updated waypoints
              setTimeout(() => {
                if (onLocationDataChange) {
                  onLocationDataChange({
                    startLocation,
                    endLocation,
                    waypoints: newArr
                  });
                }
              }, 50);
              
              return newArr;
            });
            // Aktifkan suppress context menu agar tidak muncul setelah double tap
            suppressNextContextMenuRef.current = true;
            setTimeout(() => {
              suppressNextContextMenuRef.current = false;
            }, 400); // 400ms, cukup untuk suppress event berikutnya
          }
        }
      }
    };

    (map as any).addEventListener('dbltap', handleDblTap);
    return () => { (map as any).removeEventListener('dbltap', handleDblTap); };
  }, [isMapReady, transportMode, taskType]);

  return (
    <div>
      {/* Marker Review Component - di atas map, only show for task type 2 */}
      {taskType === 2 && (
        <MarkerReview 
          startLocation={startLocation} 
          endLocation={endLocation} 
          waypoints={optimizedWaypoints} 
          onNavigate={(type, direction) => {
          const map = mapInstance.current;
          if (!map || !window.H) return;
          
          if (type === 'start') {
            if (startLocation) {
              (map as any).setCenter({ lat: startLocation.lat, lng: startLocation.lon });
              (map as any).setZoom(17);
              setCurrentWaypointIndex(-1);
            }
          } else if (type === 'end') {
            if (endLocation) {
              (map as any).setCenter({ lat: endLocation.lat, lng: endLocation.lon });
              (map as any).setZoom(17);
              setCurrentWaypointIndex(-2);
            }
          } else if (type === 'waypoint' && direction !== undefined) {
            // Navigate through waypoints
            let newIndex: number;
            
            if (direction === 1) { // Next (→)
              if (currentWaypointIndex === -1) {
                // From start, go to first waypoint
                newIndex = 0;
              } else if (currentWaypointIndex === -2) {
                // From end, go to start (A)
                newIndex = -1;
              } else if (currentWaypointIndex >= 0 && currentWaypointIndex < optimizedWaypoints.length - 1) {
                // Go to next waypoint
                newIndex = currentWaypointIndex + 1;
              } else if (currentWaypointIndex === optimizedWaypoints.length - 1) {
                // From last waypoint, go to end (B)
                newIndex = -2;
              } else {
                // Fallback to first waypoint
                newIndex = 0;
              }
            } else { // Previous (←)
              if (currentWaypointIndex === -1) {
                // From start, go to end (B)
                newIndex = -2;
              } else if (currentWaypointIndex === -2) {
                // From end, go to last waypoint
                newIndex = optimizedWaypoints.length - 1;
              } else if (currentWaypointIndex > 0) {
                // Go to previous waypoint
                newIndex = currentWaypointIndex - 1;
              } else if (currentWaypointIndex === 0) {
                // From first waypoint, go to start (A)
                newIndex = -1;
              } else {
                // Fallback to end
                newIndex = -2;
              }
            }
            
            // Navigate to the new location
            if (newIndex === -1 && startLocation) {
              (map as any).setCenter({ lat: startLocation.lat, lng: startLocation.lon });
              (map as any).setZoom(17);
            } else if (newIndex === -2 && endLocation) {
              (map as any).setCenter({ lat: endLocation.lat, lng: endLocation.lon });
              (map as any).setZoom(17);
            } else if (newIndex >= 0 && newIndex < optimizedWaypoints.length) {
              const waypoint = optimizedWaypoints[newIndex];
              (map as any).setCenter({ lat: waypoint.lat, lng: waypoint.lon });
              (map as any).setZoom(17);
            }
            
            setCurrentWaypointIndex(newIndex);
          } else if (type === 'reset') {
            // Reset zoom to fit all markers (start, end, waypoints) with padding
            if (startLocation && endLocation) {
              const map = mapInstance.current;
              if (!map || !window.H) return;
              
              // Collect all points: start, end, waypoints
              const points = [startLocation, endLocation, ...optimizedWaypoints];
              if (points.length > 0) {
                let minLat = points[0].lat, maxLat = points[0].lat;
                let minLon = points[0].lon, maxLon = points[0].lon;
                
                points.forEach(pt => {
                  if (pt.lat < minLat) minLat = pt.lat;
                  if (pt.lat > maxLat) maxLat = pt.lat;
                  if (pt.lon < minLon) minLon = pt.lon;
                  if (pt.lon > maxLon) maxLon = pt.lon;
                });
                // Use dynamic padding based on distance between points
                const dynamicPadding = calculateDynamicPadding(points);
                minLat -= dynamicPadding;
                maxLat += dynamicPadding;
                minLon -= dynamicPadding;
                maxLon += dynamicPadding;
                // Create bounds rectangle and fit view
                const bounds = new window.H.geo.Rect(minLat, minLon, maxLat, maxLon);
                (map as any).getViewModel().setLookAtData({ bounds });
                // Reset current waypoint index
                setCurrentWaypointIndex(-1);
              }
            }
          }
        }}
        transportMode={transportMode}
        onTransportModeChange={setTransportMode}
        onInfoToggle={() => setShowInfo(!showInfo)}
      />
      )}
      
      <div
        ref={mapRef}
        style={{ width: "100%", height: "400px", marginTop: 8, borderRadius: 8, overflow: "hidden" }}
        className="flex-1 min-h-[400px]"
      />
      
      {showInfo && (
        <div className="mt-2 text-xs text-gray-500">
          {taskType === 1 ? (
            // Task Type 1: Destination only instructions
            <>
              <p>• Right-click (desktop) or long press (mobile) to add destination location</p>
              <p>• Drag marker to adjust position</p>
              <p>• Simple location marking for single destination tasks</p>
            </>
          ) : (
            // Task Type 2: Full route instructions
            <>
              <p>• Right-click (desktop) or long press (mobile) to add start (A) and end (B) locations</p>
              <p>• Right-click (desktop) or long press (mobile) to add waypoints between start and end</p>
              <p>• Waypoints automatically snap to nearest road for optimal routing</p>
              <p>• Route calculation adapts to selected transport mode (car/truck)</p>
              <p>• Drag markers to adjust positions (waypoints auto-snap to roads)</p>
              <p>• Double-click waypoints to remove them</p>
              <p>• Use A ← → B buttons above map to navigate between markers</p>
              <p>• Use 📊 button to reset zoom and view all markers</p>
              <p>• Use 🚗/🚛 buttons to switch between car and truck route modes</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
