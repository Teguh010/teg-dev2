import React, { useEffect, useRef, useState } from 'react';
import { useDrawingMode } from './hooks/useDrawingMode';
import { useShapeManagement } from './hooks/useShapeManagement';
import { useDrawingControls } from './hooks/useDrawingControls';
import { updateAvoidAreasForRerouting } from './utils/avoidAreasUtils';
import './styles/drawing-controls.css';

// Tambahkan deklarasi global agar linter tidak error
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window {
    H: any;
  }
}

const HERE_API_KEY = process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN;

interface HereMapNativeProps {
  startLocation?: { lat: number; lon: number } | null;
  endLocation?: { lat: number; lon: number } | null;
  transportMode?: string;
  setStartLocation?: (loc: { lat: number; lon: number }) => void;
  setEndLocation?: (loc: { lat: number; lon: number }) => void;
  width?: string;
  height?: string;
  truckHeight?: number;
  truckGrossWeight?: number;
  truckWeightPerAxle?: number;
  smallTruckHeight?: number;
  smallTruckGrossWeight?: number;
  smallTruckWeightPerAxle?: number;
  length?: number;
  routeData?: Array<{
    polyline: [number, number][]; // Changed from string to array of coordinates
    summary: any;
    actions?: any[]; // Made optional since it's not used
    tolls: any;
    travelSummary: any;
    notices: any;
    spans?: Array<{ offset: number; noThroughRestrictions?: any[]; notices?: number[] }>;
    noThroughRestrictions?: any[];
  }> | null;
  onMapClickSetLocation?: (lat: number, lon: number, isStart: boolean) => void;
  onGeoshapesChange?: (shapes: Array<{ type: string; coordinates: any }>) => void;
  onAvoidAreasChange?: (areas: string[]) => void;
  onWaypointsChange?: (waypoints: { origin: { lat: number; lon: number } | null; destination: { lat: number; lon: number } | null; waypoints: { lat: number; lon: number }[] }) => void;
  shouldFitBounds?: boolean;
  // NEW: callback to change route order (clicked route becomes main)
  onRouteOrderChange?: (newRouteOrder: any[]) => void;
  optimizedWaypoints?: { lat: number; lon: number }[];
}

// Route color palette: blue gradient from dark to light (matching settings.tsx)
const routeColors = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];

// Fungsi untuk parsing restrictedTimes ke format jam user-friendly
export function parseRestrictedTimes(str: string): string {
  if (!str || typeof str !== 'string') return 'No time restrictions';
  const regex = /(?:\+)?\(h(\d+)\)\{h(\d+)\}/g;
  let match;
  const allowed: { start: number; end: number }[] = [];
  while ((match = regex.exec(str)) !== null) {
    const start = parseInt(match[1], 10);
    const dur = parseInt(match[2], 10);
    const end = (start + dur) % 24;
    allowed.push({ start, end });
  }
  if (allowed.length === 0) return str;
  // Sort by start time
  allowed.sort((a, b) => a.start - b.start);
  // Build forbidden intervals (the gaps between allowed)
  const forbidden: { start: number; end: number }[] = [];
  for (let i = 0; i < allowed.length; i++) {
    const currEnd = allowed[i].end;
    const nextStart = allowed[(i + 1) % allowed.length].start;
    if (currEnd !== nextStart) {
      forbidden.push({ start: currEnd, end: nextStart });
    }
  }
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatRange = (s: number, e: number) => `${pad(s)}:00–${pad(e === 0 ? 24 : e)}:00`;
  const allowedStr = allowed.map(r => formatRange(r.start, r.end)).join(', ');
  const forbiddenStr = forbidden.length > 0 ? forbidden.map(r => formatRange(r.start, r.end)).join(', ') : '';
  if (forbidden.length === 0) {
    return `Allowed: ${allowedStr}`;
  } else {
    return `Allowed only: ${allowedStr}\nNot allowed: ${forbiddenStr}`;
  }
}

const HereMapNative: React.FC<HereMapNativeProps> = ({
  startLocation,
  endLocation,
  transportMode = 'car',
  setStartLocation,
  setEndLocation,
  width = '100%',
  height = '100%',
  truckHeight,
  truckGrossWeight,
  truckWeightPerAxle,
  length,
  routeData,
  onMapClickSetLocation,
  onGeoshapesChange,
  onAvoidAreasChange,
  onWaypointsChange,
  shouldFitBounds = false,
  onRouteOrderChange,
  optimizedWaypoints = [],
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const platformRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uiRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeLineRef = useRef<any>(null);

  // Simpan ref array untuk restriction markers
  const restrictionMarkersRef = useRef<any[]>([]);
  const behaviorRef = useRef<any>(null);
  // Ref to track active restriction InfoBubble
  const restrictionBubbleRef = useRef<any>(null);

  // Geoshape drawing state (PASTIKAN INI DI ATAS SEMUA useEffect)
  const [drawingMode, setDrawingMode] = React.useState<string | null>(null); // 'polygon' | 'polyline' | 'circle' | 'rectangle' | null

  // --- STATE: Avoid Areas ---
  const [avoidAreas, setAvoidAreas] = React.useState<string[]>([]);

  // --- STATE: User Interaction ---
  const [hasUserInteracted, setHasUserInteracted] = React.useState(false);
  const lastRouteBoundsRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);


  

  // --- WAYPOINTS STATE ---
  const [waypoints, setWaypoints] = useState<{ lat: number; lon: number }[]>([]);
  const waypointMarkersRef = useRef<any[]>([]);
  const isAddingWaypointRef = useRef(false); // Track if we're currently adding waypoint
  
  // Sync external optimizedWaypoints to internal waypoints state (only on initial load)
  useEffect(() => {
    if (optimizedWaypoints && Array.isArray(optimizedWaypoints) && optimizedWaypoints.length > 0 && waypoints.length === 0) {
      setWaypoints(optimizedWaypoints);
    }
  }, [optimizedWaypoints]); // Remove waypoints from dependency to prevent loop

  // --- Helper: Marker Icon ---
  function getMarkerIcon(id: string | number) {
    const svgCircle = `<svg width="30" height="30" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <g id="marker">
        <circle cx="15" cy="15" r="10" fill="#0099D8" stroke="#0099D8" stroke-width="4" />
        <text x="50%" y="50%" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="12px" dy=".3em">${id}</text>
      </g></svg>`;
    return new window.H.map.Icon(svgCircle, { anchor: { x: 10, y: 10 } });
  }

  // --- Add/Remove/Update Waypoint Markers ---
  function refreshWaypointMarkers(map: any) {
    // Remove old markers
    if (waypointMarkersRef.current.length > 0) {
      waypointMarkersRef.current.forEach((m) => map.removeObject(m));
      waypointMarkersRef.current = [];
    }
    // Always use internal waypoints state for rendering
    waypoints.forEach((wp, idx) => {
      const marker = new window.H.map.Marker({ lat: wp.lat, lng: wp.lon }, {
        data: { id: idx + 1, originalIndex: idx }, // Store original index for drag updates
        icon: getMarkerIcon(idx + 1), // Angka sesuai urutan optimasi
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
          target.setIcon(getMarkerIcon('...'));
          
          // Snap to nearest road
          const snappedPoint = await snapToNearestRoad({ lat: originalLat, lng: originalLng });
          
          // Update marker position
          target.setGeometry(snappedPoint);
          
          // Update waypoints state with new position
          setWaypoints(prev => {
            const newWaypoints = [...prev];
            // Find the waypoint in original order and update it
            const originalIndex = target.getData().originalIndex;
            if (originalIndex >= 0 && originalIndex < newWaypoints.length) {
              newWaypoints[originalIndex] = { lat: snappedPoint.lat, lon: snappedPoint.lng };
            }
            return newWaypoints;
          });
        } catch (error) {
          console.error('Error snapping waypoint to road:', error);
          // Revert to original position if there's an error
          target.setGeometry(originalPosition);
        } finally {
          // Restore original icon
          target.setIcon(getMarkerIcon(idx + 1));
        }
      }, false);
      
      map.addObject(marker);
      waypointMarkersRef.current.push(marker);
    });
  }

  // --- Add/Remove/Update Origin/Destination Markers ---
  function refreshOriginDestinationMarkers(map: any) {
    // Remove old markers
    if (startMarkerRef.current) { map.removeObject(startMarkerRef.current); startMarkerRef.current = null; }
    if (endMarkerRef.current) { map.removeObject(endMarkerRef.current); endMarkerRef.current = null; }
    // Add start marker (A)
    if (startLocation) {
      const marker = new window.H.map.Marker({ lat: startLocation.lat, lng: startLocation.lon }, {
        data: { id: 'A' },
        icon: getMarkerIcon('A'),
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
        icon: getMarkerIcon('B'),
        volatility: true
      });
      marker.draggable = true;
      map.addObject(marker);
      endMarkerRef.current = marker;
    }
  }

  // Load HERE Maps JS API jika belum ada
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.H && window.H.Map) return;
    const script = document.createElement('script');
    script.src = 'https://js.api.here.com/v3/3.1/mapsjs.bundle.js';
    script.async = true;
    script.onload = () => {
      // do nothing, will re-render
    };
    document.body.appendChild(script);
  }, []);

  // Inisialisasi peta HERE
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    if (!window.H || !window.H.Map) return;

    platformRef.current = new window.H.service.Platform({ apikey: HERE_API_KEY });
    const engineType = window.H.Map.EngineType["HARP"];
    const defaultLayers = platformRef.current.createDefaultLayers({ engineType });

    const map = new window.H.Map(
      mapRef.current,
      defaultLayers.vector.normal.logistics,
      {
        engineType,
        center: { lat: 55.93308, lng: 23.31731 },
        zoom: 8,
        pixelRatio: window.devicePixelRatio || 1,
      }
    );

    // Listen for user interaction (zoom/pan)
    const handleUserInteraction = () => {
      setHasUserInteracted(true);
    };
    map.addEventListener('mapviewchange', handleUserInteraction);

    window.addEventListener('resize', () => map.getViewPort().resize());
    mapInstance.current = map;
    uiRef.current = window.H.ui.UI.createDefault(map, defaultLayers);
    setIsMapReady(true);

    // Expose map instance to window for external access
    if (typeof window !== 'undefined') {
      (window as any).__HERE_MAP_INSTANCE = map;
    }

    // Aktifkan interaksi mouse/trackpad (zoom, pan, dsb)
    if (window.H && window.H.mapevents) {
      behaviorRef.current = new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(map));
    }

    // Aktifkan visualisasi vehicle restrictions pada style
    const style = map.getBaseLayer().getProvider().getStyle();
    style.addEventListener("change", function enableVehicleRestrictions(event) {
      if (event.target.getState() === window.H.map.render.Style.State.READY) {
        event.target.removeEventListener("change", enableVehicleRestrictions, false);
        let enabledFeatures = style.getEnabledFeatures();
        if (!enabledFeatures) enabledFeatures = [];
        enabledFeatures.push({ feature: "vehicle restrictions", mode: "active & inactive" });
        style.setEnabledFeatures(enabledFeatures);
      }
    });
    return () => {
      map.removeEventListener('mapviewchange', handleUserInteraction);
    };
  }, []);

  // Set vehicle profile pada provider map setiap parameter truck berubah
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.H) return;
    const provider = map.getBaseLayer().getProvider();
    if (provider && provider.setVehicleSpecs) {
      // Only set vehicle specs for truck modes
      if (transportMode === 'truck' || transportMode === 'smallTruck') {
        const truckSpecs = {
          vehicleType: window.H.service.omv.Provider.IVehicleSpecs.VehicleType.TRUCK,
          grossWeightInKilograms: truckGrossWeight,
          heightInCentimeters: truckHeight,
          lengthInCentimeters: typeof length === 'number' ? length : undefined,
          weightPerAxleInKilograms: truckWeightPerAxle,
        };
        provider.setVehicleSpecs(truckSpecs);
      } else {
        // For car mode, don't set vehicle specs
        console.warn('[HERE MAP] Car mode - no vehicle specs needed');
      }
    } else {
      console.warn('[HERE MAP] Provider tidak support setVehicleSpecs');
    }
  }, [truckGrossWeight, truckHeight, length, truckWeightPerAxle, transportMode]);

  // --- Effect: Render all markers (origin, destination, waypoints) ---
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.H) return;
    refreshOriginDestinationMarkers(map);
    refreshWaypointMarkers(map);
  }, [startLocation, endLocation, waypoints]);

  // --- Remove simple click behavior - now using right-click/long press context menu ---

  // --- Remove waypoint on marker double tap ---
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.H) return;
    const handleDblTap = (evt: any) => {
      const target = evt.target;
      if (target instanceof window.H.map.Marker) {
        const id = target.getData().id;
        // Only allow removing numbered waypoints, not 'A' or 'B'
        if (id !== 'A' && id !== 'B') {
          setWaypoints((prev) => {
            const originalIndex = target.getData().originalIndex;
            if (originalIndex >= 0 && originalIndex < prev.length) {
              const newArr = [...prev];
              newArr.splice(originalIndex, 1);
              return newArr;
            }
            return prev;
          });
        }
      }
    };
    map.addEventListener('dbltap', handleDblTap);
    return () => { map.removeEventListener('dbltap', handleDblTap); };
  }, []);

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
      const router = platformRef.current.getRoutingService(null, 8);
      // Create a point slightly offset from the original point to force a route calculation
      const offset = 0.0001; // Small offset (about 11 meters at equator)
      const offsetLat = point.lat + offset;
      const offsetLng = point.lng + offset;
      const routingParameters = {
        routingMode: 'fast',
        transportMode: 'car',
        origin: `${point.lat},${point.lng}`,
        destination: `${offsetLat},${offsetLng}`,
        return: 'polyline,summary',
        alternatives: 1
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
            if (error.details) {
              console.error('Error details:', error.details);
            }
            resolve(point);
          }
        );
      });
    } catch (error) {
      return point;
    }
  };

  // --- Add waypoint via right-click context menu (desktop) and long press (mobile) ---
  useEffect(() => {

    const map = mapInstance.current;
    if (!map || !window.H) return;

    let contextMenu: HTMLDivElement | null = null;
    let longPressTimer: NodeJS.Timeout | null = null;
    let moved = false;
    let touchStartX = 0;
    let touchStartY = 0;
    const MOVE_THRESHOLD = 20; // pixels - increase threshold for less sensitivity (was 15)

    // Suppress context menu after double-tap delete (if needed)
    const suppressNextContextMenuRef = { current: false };

    const handleContextMenu = async (evt: any) => {
      // Prevent default context menu
      evt.preventDefault();

      // Suppress context menu if flagged (e.g. after double-tap delete)
      if (suppressNextContextMenuRef.current) {
        suppressNextContextMenuRef.current = false;
        return;
      }

      // Don't show context menu if in drawing mode
      if (drawingMode) {
        return;
      }

      showContextMenu(evt);
    };

    const handleTouchStart = (evt: any) => {
      
      // Don't handle if in drawing mode
      if (drawingMode) {
        return;
      }

      // Ignore if more than one finger (pinch-zoom)
      if (evt.touches && evt.touches.length > 1) {
        return;
      }

      moved = false;

      // Store initial touch position
      if (evt.touches && evt.touches[0]) {
        touchStartX = evt.touches[0].clientX;
        touchStartY = evt.touches[0].clientY;
      }

      // Add visual feedback for long press
      const target = evt.currentTarget;
      target.style.cursor = 'wait';
      target.style.backgroundColor = 'rgba(0, 0, 255, 0.1)'; // Visual feedback
            // Start long press timer
      longPressTimer = setTimeout(() => {
        if (!moved) {
          showContextMenu(evt);
        } else {
          console.warn('[HereMapNative] Long press cancelled due to movement');
        }
        target.style.cursor = '';
        target.style.backgroundColor = '';
      }, 500); // 500ms for long press
    };

    const handleTouchEnd = (evt: any) => {
      
      // Clear long press timer
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      // Reset cursor and background
      if (evt.currentTarget) {
        evt.currentTarget.style.cursor = '';
        evt.currentTarget.style.backgroundColor = '';
      }
    };

    const handleTouchMove = (evt: any) => {
      
      // Ignore if more than one finger (pinch-zoom)
      if (evt.touches && evt.touches.length > 1) {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        moved = true;
        if (evt.currentTarget) {
          evt.currentTarget.style.cursor = '';
          evt.currentTarget.style.backgroundColor = '';
        }
        return;
      }
      
      // Only cancel if movement is significant (not just tremor)
      if (evt.touches && evt.touches[0]) {
        const touch = evt.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartX);
        const deltaY = Math.abs(touch.clientY - touchStartY);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Only cancel if movement exceeds threshold
        if (distance > MOVE_THRESHOLD) {
          moved = true;
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
          if (evt.currentTarget) {
            evt.currentTarget.style.cursor = '';
            evt.currentTarget.style.backgroundColor = '';
          }
        }
      }
    };

    const showContextMenu = async (evt: any) => {      
      // Remove existing context menu
      if (contextMenu) {
        document.body.removeChild(contextMenu);
        contextMenu = null;
      }
      
      // Get coordinates from event
      let coord;
      let clientX, clientY;
      
      try {
        if (evt.touches && evt.touches[0]) {
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
          coord = map.screenToGeo(viewportX, viewportY);
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
          coord = map.screenToGeo(viewportX, viewportY);
          clientX = evt.clientX;
          clientY = evt.clientY;
        }
      } catch (error) {
        console.error('Error getting coordinates:', error);
        return;
      }
      
      if (!coord) return;

      // Create context menu
      contextMenu = document.createElement('div');
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
          if (contextMenu && document.body.contains(contextMenu)) {
            if (contextMenu && document.body.contains(contextMenu)) {
            document.body.removeChild(contextMenu);
            contextMenu = null;
          }
            contextMenu = null;
          }
        });
        
        contextMenu.appendChild(closeButton);
      }
      
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
      
      // Determine what options to show based on current state
      // Access current values from props to ensure we get the latest state
      const hasStart = !!startLocation;
      const hasEnd = !!endLocation;
      
      // Always show Start Location option
      const startItem = createMenuItem(
        hasStart ? '📍Move Start Location(A)' : '📍Add Start Location(A)', 
        () => {
          const newStart = { lat: coord.lat, lon: coord.lng };
          if (typeof setStartLocation === 'function') {
            setStartLocation(newStart);
          }
          if (typeof onMapClickSetLocation === 'function') {
            onMapClickSetLocation(coord.lat, coord.lng, true);
          }
          if (contextMenu && document.body.contains(contextMenu)) {
            document.body.removeChild(contextMenu);
            contextMenu = null;
          }
        }, 
        '#2563eb' // Blue color for start
      );
      contextMenu.appendChild(startItem);
      
      // Always show End Location option
      const endItem = createMenuItem(
        hasEnd ? '🎯Move End Location(B)' : '🎯Add End Location(B)', 
        () => {
          const newEnd = { lat: coord.lat, lon: coord.lng };
          if (typeof setEndLocation === 'function') {
            setEndLocation(newEnd);
          }
          if (typeof onMapClickSetLocation === 'function') {
            onMapClickSetLocation(coord.lat, coord.lng, false);
          }
          if (contextMenu && document.body.contains(contextMenu)) {
            document.body.removeChild(contextMenu);
            contextMenu = null;
          }
        }, 
        '#dc2626' // Red color for end
      );
      contextMenu.appendChild(endItem);
      
      // Add Waypoint option (only if both start and end exist)
      if (hasStart && hasEnd) {
        const waypointItem = createMenuItem('➕ Add Waypoint', () => {
          // Prevent double addition on mobile
          if (isAddingWaypointRef.current) {
            return;
          }
          
          // Show loading state
          waypointItem.textContent = 'Snapping to road...';
          waypointItem.style.cursor = 'wait';
          waypointItem.style.opacity = '0.7';
          
          // Set flag to prevent double addition
          isAddingWaypointRef.current = true;
          
          // Snap to nearest road before adding waypoint
          snapToNearestRoad({ lat: coord.lat, lng: coord.lng })
            .then((snappedPoint) => {
              setWaypoints((prev) => {
                // Check if waypoint already exists (prevent duplicates)
                const exists = prev.some(wp => 
                  Math.abs(wp.lat - snappedPoint.lat) < 0.000001 && 
                  Math.abs(wp.lon - snappedPoint.lng) < 0.000001
                );
                
                if (exists) {
                  return prev;
                }
                
                const newWaypoints = [...prev, { lat: snappedPoint.lat, lon: snappedPoint.lng }];
                
                // Reset flag immediately after waypoint is added to allow parent callback
                isAddingWaypointRef.current = false;
                
                return newWaypoints;
              });
            })
            .catch((error) => {
              console.error('Error snapping waypoint to road:', error);
              // Fallback to original coordinates if snapping fails
              setWaypoints((prev) => {
                // Check if waypoint already exists (prevent duplicates)
                const exists = prev.some(wp => 
                  Math.abs(wp.lat - coord.lat) < 0.000001 && 
                  Math.abs(wp.lon - coord.lng) < 0.000001
                );
                
                if (exists) {
                  return prev;
                }
                
                // Reset flag immediately after fallback waypoint is added
                isAddingWaypointRef.current = false;
                
                return [...prev, { lat: coord.lat, lon: coord.lng }];
              });
            })
            .finally(() => {
              // Reset flag after a short delay to prevent rapid successive additions
              setTimeout(() => {
                isAddingWaypointRef.current = false;
              }, 100); // Reduced from 500ms to 100ms
              
              if (contextMenu && document.body.contains(contextMenu)) {
                document.body.removeChild(contextMenu);
                contextMenu = null;
              }
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
            if (document.body.contains(contextMenu)) {
              document.body.removeChild(contextMenu);
            }
            contextMenu = null;
            document.removeEventListener('click', closeContextMenu);
          }
        };
        
        setTimeout(() => {
          document.addEventListener('click', closeContextMenu, true);
        }, 300);
      }
    };
    
    const viewport = map.getViewPort().element;
    
    // Add event listeners for desktop (right-click)
    viewport.addEventListener('contextmenu', handleContextMenu);
    
    // Add event listeners for mobile (long press)
    viewport.addEventListener('touchstart', handleTouchStart, { passive: false });
    viewport.addEventListener('touchend', handleTouchEnd, { passive: false });
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    // Also add event listener to map container as fallback
    const mapContainer = mapRef.current;
    let containerHandler: ((evt: any) => void) | null = null;
    
    if (mapContainer) {
      containerHandler = (evt: any) => {
        // Only handle if the event target is within the map container
        if (mapContainer.contains(evt.target)) {
          handleContextMenu(evt);
        }
      };
      mapContainer.addEventListener('contextmenu', containerHandler);
    }
    
    return () => {
      viewport.removeEventListener('contextmenu', handleContextMenu);
      viewport.removeEventListener('touchstart', handleTouchStart);
      viewport.removeEventListener('touchend', handleTouchEnd);
      viewport.removeEventListener('touchmove', handleTouchMove);

      // Remove container handler if it exists
      if (mapContainer && containerHandler) {
        mapContainer.removeEventListener('contextmenu', containerHandler);
      }

      // Clear any pending timers
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }

      if (contextMenu && document.body.contains(contextMenu)) {
        document.body.removeChild(contextMenu);
      }
    };
  }, [startLocation, endLocation, drawingMode]);

  // --- Drag marker logic (origin, destination, waypoints) ---
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.H) return;
    let draggedMarker: any = null;
    let dragType: 'start' | 'end' | 'waypoint' | null = null;
    let dragIdx: number | null = null;
    map.addEventListener('dragstart', function (ev: any) {
      const target = ev.target;
      if (target instanceof window.H.map.Marker && target.draggable) {
        draggedMarker = target;
        const id = target.getData().id;
        if (id === 'A') dragType = 'start';
        else if (id === 'B') dragType = 'end';
        else { dragType = 'waypoint'; dragIdx = target.getData().originalIndex; }
        map.getViewPort().element.style.cursor = 'grabbing';
        if (behaviorRef.current) behaviorRef.current.disable(window.H.mapevents.Behavior.DRAGGING);
      }
    }, false);
    map.addEventListener('drag', function (ev: any) {
      if (draggedMarker) {
        const pointer = ev.currentPointer;
        const geo = map.screenToGeo(pointer.viewportX, pointer.viewportY);
        draggedMarker.setGeometry(geo);
      }
    }, false);
    map.addEventListener('dragend', function () {
      if (draggedMarker) {
        const geo = draggedMarker.getGeometry();
        if (dragType === 'start' && typeof setStartLocation === 'function') {
          setStartLocation({ lat: geo.lat, lon: geo.lng });
        } else if (dragType === 'end' && typeof setEndLocation === 'function') {
          setEndLocation({ lat: geo.lat, lon: geo.lng });
        } else if (dragType === 'waypoint' && dragIdx !== null) {
          setWaypoints((prev) => {
            const newArr = [...prev];
            if (dragIdx! >= 0 && dragIdx! < newArr.length) {
              newArr[dragIdx!] = { lat: geo.lat, lon: geo.lng };
            }
            return newArr;
          });
        }
        draggedMarker = null;
        dragType = null;
        dragIdx = null;
        map.getViewPort().element.style.cursor = '';
        if (behaviorRef.current) behaviorRef.current.enable(window.H.mapevents.Behavior.DRAGGING);
      }
    }, false);
    return () => {
      // No need to remove listeners, as map is persistent
    };
  }, [setStartLocation, setEndLocation]);

  // --- Notify parent on waypoints/origin/destination change ---
  useEffect(() => {
    if (onWaypointsChange && !isAddingWaypointRef.current) {
      // Immediate callback for waypoint changes to ensure route updates quickly
      onWaypointsChange({
        origin: startLocation,
        destination: endLocation,
        waypoints: waypoints
      });
    }
  }, [startLocation, endLocation, waypoints, onWaypointsChange]);

  // Render multiple route polylines (utama & alternatif)
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.H || !routeData || routeData.length === 0) {
      // If restriction InfoBubble is open, close it
      if (restrictionBubbleRef.current && uiRef.current) {
        uiRef.current.removeBubble(restrictionBubbleRef.current);
        restrictionBubbleRef.current = null;
      }
      return;
    }
    // Remove old route(s)
    if (routeLineRef.current) {
      if (Array.isArray(routeLineRef.current)) {
        routeLineRef.current.forEach((line: any) => map.removeObject(line));
      } else {
        map.removeObject(routeLineRef.current);
      }
      routeLineRef.current = null;
    }
    // Remove old custom restriction markers
    if (restrictionMarkersRef.current && restrictionMarkersRef.current.length > 0) {
      restrictionMarkersRef.current.forEach((marker: any) => map.removeObject(marker));
      restrictionMarkersRef.current = [];
    }
    
    // Close all existing InfoBubbles to prevent overlapping
    if (uiRef.current) {
      // Remove all bubbles from the UI
      const bubbles = uiRef.current.getBubbles();
      if (bubbles && bubbles.length > 0) {
        bubbles.forEach((bubble: any) => {
          uiRef.current.removeBubble(bubble);
        });
      }
      // Also clear the restriction bubble ref
      restrictionBubbleRef.current = null;
    }
    const allLines: any[] = [];
    const allMarkers: any[] = [];
    let firstRestrictionBubbleShown = false;
    let hasAnyRestriction = false;
    routeData.forEach((rd, idx) => {
      const color = routeColors[idx % routeColors.length];
      const points = Array.isArray(rd.polyline) ? rd.polyline : [];
      
      // Per-span rendering (with clickable polyline)
      if (rd.spans && Array.isArray(rd.spans) && rd.spans.length > 0) {
        for (let i = 0; i < rd.spans.length; i++) {
          const startIdx = rd.spans[i].offset;
          const endIdx = i < rd.spans.length - 1 ? rd.spans[i + 1].offset : points.length;
          const segPoints = Array.isArray(points) ? points.slice(startIdx, endIdx) : [];
          
          // Skip if no points in this segment
          if (segPoints.length === 0) {
            continue;
          }
          
          if (Array.isArray(segPoints) && segPoints.length >= 2) {
            const lineString = new window.H.geo.LineString();
            segPoints.forEach((pt: [number, number]) => lineString.pushPoint({ lat: pt[0], lng: pt[1] }));
            const hasNoThrough = rd.spans[i].noThroughRestrictions && rd.spans[i].noThroughRestrictions.length > 0;
            let lineDash = idx === 0 ? [] : [8, 8];
            let lineWidth = idx === 0 ? 5 : 4;
            let strokeColor = color;
            
            // Check for violated vehicle restriction notices
            const hasViolatedRestriction = rd.spans[i].notices && rd.spans[i].notices.length > 0 && 
              rd.notices && rd.spans[i].notices.some((noticeIndex: number) => {
                const notice = rd.notices[noticeIndex];
                return notice && notice.code === 'violatedVehicleRestriction';
              });
            
            // Check for violated blocked road notices
            const hasBlockedRoadRestriction = rd.spans[i].notices && rd.spans[i].notices.length > 0 && 
              rd.notices && rd.spans[i].notices.some((noticeIndex: number) => {
                const notice = rd.notices[noticeIndex];
                return notice && notice.code === 'violatedBlockedRoad';
              });
            
            // Determine styling based on restriction types (priority: blocked > violated > no-through)
            if (hasBlockedRoadRestriction) {
              strokeColor = '#991b1b'; // dark red for blocked road (highest priority)
              lineDash = [6, 2];
              lineWidth = 7;
            } else if (hasNoThrough && hasViolatedRestriction) {
              strokeColor = '#dc2626'; // red for violated restriction (higher priority, matching settings.tsx)
              lineDash = [4, 4];
              lineWidth = 6;
            } else if (hasNoThrough) {
              strokeColor = '#fbbf24'; // yellow for no-through restriction (matching settings.tsx)
              lineDash = [2, 8];
              lineWidth = 6;
            } else if (hasViolatedRestriction) {
              strokeColor = '#dc2626'; // red for violated restriction (matching settings.tsx)
              lineDash = [4, 4];
              lineWidth = 6;
            }
            
            if (hasNoThrough || hasViolatedRestriction || hasBlockedRoadRestriction) {
              
              // Tambahkan marker custom di awal segmen
              const markerPos = segPoints[0];
              const icon = new window.H.map.Icon('/images/all-img/restriction-warning.png', { size: { w: 32, h: 32 } });
              const marker = new window.H.map.Marker({ lat: markerPos[0], lng: markerPos[1] }, { icon });
              
              // Compose tooltip content for both restriction types
              let tooltip = '';
              const tooltipParts: string[] = [];
              
              // Add no-through restriction info
              if (hasNoThrough) {
                let noThroughInfo = 'No-through restriction';
                const restrictionsIdx = rd.spans[i].noThroughRestrictions;
                if (restrictionsIdx && restrictionsIdx.length > 0 && rd.noThroughRestrictions) {
                  // Ambil detail restriction dari section.noThroughRestrictions
                  const r = rd.noThroughRestrictions[restrictionsIdx[0]];
                  if (r) {
                    if (r.restrictedTimes) {
                      noThroughInfo += `\n${parseRestrictedTimes(r.restrictedTimes)}`;
                    }
                    if (r.timeDependent) {
                      noThroughInfo += '\nTime dependent';
                    }
                    if (r.type) {
                      noThroughInfo += `\nType: ${r.type}`;
                    }
                  }
                }
                tooltipParts.push(noThroughInfo);
              }
              
              // Add violated restriction info
              if (hasViolatedRestriction) {
                let violatedInfo = 'Violated vehicle restriction';
                // Find the violated restriction notice
                const violatedNoticeIndex = rd.spans[i].notices.find((noticeIndex: number) => {
                  const notice = rd.notices[noticeIndex];
                  return notice && notice.code === 'violatedVehicleRestriction';
                });
                if (violatedNoticeIndex !== undefined) {
                  const violatedNotice = rd.notices[violatedNoticeIndex];
                  if (violatedNotice) {
                    if (violatedNotice.title) {
                      violatedInfo = violatedNotice.title;
                    }
                    if (violatedNotice.details && violatedNotice.details.length > 0) {
                      violatedNotice.details.forEach((detail: any) => {
                        if (detail.cause) {
                          violatedInfo += `\nCause: ${detail.cause}`;
                        }
                        if (detail.type) {
                          violatedInfo += `\nType: ${detail.type}`;
                        }
                      });
                    }
                  }
                }
                tooltipParts.push(violatedInfo);
              }
              
              // Add blocked road restriction info
              if (hasBlockedRoadRestriction) {
                let blockedInfo = 'Blocked road restriction';
                // Find the blocked road notice
                const blockedNoticeIndex = rd.spans[i].notices.find((noticeIndex: number) => {
                  const notice = rd.notices[noticeIndex];
                  return notice && notice.code === 'violatedBlockedRoad';
                });
                if (blockedNoticeIndex !== undefined) {
                  const blockedNotice = rd.notices[blockedNoticeIndex];
                  if (blockedNotice) {
                    if (blockedNotice.title) {
                      blockedInfo = blockedNotice.title;
                    }
                    if (blockedNotice.details && blockedNotice.details.length > 0) {
                      blockedNotice.details.forEach((detail: any) => {
                        if (detail.cause) {
                          blockedInfo += `\nCause: ${detail.cause}`;
                        }
                        if (detail.type) {
                          blockedInfo += `\nType: ${detail.type}`;
                        }
                      });
                    }
                  }
                }
                tooltipParts.push(blockedInfo);
              }
              
              // Combine all tooltip parts
              tooltip = tooltipParts.join('\n\n---\n\n');
              marker.setData(tooltip.replace(/\n/g, '<br/>'));
              marker.addEventListener('tap', function (evt: any) {
                const bubble = new window.H.ui.InfoBubble(evt.target.getGeometry(), {
                  content: evt.target.getData()
                });
                uiRef.current.addBubble(bubble);
              });
              map.addObject(marker);
              allMarkers.push(marker);
              
              // Auto show InfoBubble hanya untuk marker restriction pertama
              if (!firstRestrictionBubbleShown) {
                const bubble = new window.H.ui.InfoBubble(
                  { lat: markerPos[0], lng: markerPos[1] },
                  { content: marker.getData() }
                );
                uiRef.current.addBubble(bubble);
                restrictionBubbleRef.current = bubble;
                firstRestrictionBubbleShown = true;
              }
            }
            
            const polyline = new window.H.map.Polyline(lineString, {
              style: {
                strokeColor,
                lineWidth: lineWidth,
                lineDash,
                opacity: 0.7,
                zIndex: 1
              },
              volatility: true
            });
            polyline.addEventListener('tap', (evt: any) => {
              if (idx !== 0 && typeof onRouteOrderChange === 'function' && Array.isArray(routeData)) {
                // Move clicked route to index 0, shift others
                const newOrder = [routeData[idx], ...routeData.slice(0, idx), ...routeData.slice(idx + 1)];
                onRouteOrderChange(newOrder);
              }
            });
            map.addObject(polyline);
            allLines.push(polyline);
          }
        }
      }
      
      // Skip fallback polyline rendering for now to focus on spans rendering
    });
    routeLineRef.current = allLines;
    restrictionMarkersRef.current = allMarkers;
    
    // If restriction InfoBubble is open but no restriction now, close it
    if (!hasAnyRestriction && restrictionBubbleRef.current && uiRef.current) {
      uiRef.current.removeBubble(restrictionBubbleRef.current);
      restrictionBubbleRef.current = null;
    }
    // Store route bounds for auto-fit effect to use
    if (allLines[0]) {
      lastRouteBoundsRef.current = allLines[0].getBoundingBox();
    }
  }, [routeData, onRouteOrderChange]);

  // Utility: fitBounds to two markers with expanded bounds
  function fitBoundsToMarkers(map, start, end) {
    if (!map || !start || !end) return;
    
    // Calculate deltas for bounds expansion
    
    // Calculate the lat/lng deltas with 20% expansion
    const latDelta = Math.abs(start.lat - end.lat) * 0.2;
    const lngDelta = Math.abs(start.lon - end.lon) * 0.2;
    
    // Create expanded bounds
    const bounds = new window.H.geo.Rect(
      Math.min(start.lat, end.lat) - latDelta,
      Math.min(start.lon, end.lon) - lngDelta,
      Math.max(start.lat, end.lat) + latDelta,
      Math.max(start.lon, end.lon) + lngDelta
    );
    
    map.getViewModel().setLookAtData({ bounds });
  }

  // Track last fit type to avoid repeated fitBounds
  const lastFitTypeRef = useRef(''); // '', 'start', 'markers', 'route'
  const lastAutoFitLocationRef = useRef<{start: any, end: any} | null>(null);

  // Effect: auto-fit/center logic - ONLY when shouldFitBounds is true
  useEffect(() => {
    const map = mapInstance.current;
    if (!isMapReady || !map || !shouldFitBounds) return;
    
    // Check if locations have actually changed
    const currentLocations = { start: startLocation, end: endLocation };
    const locationsChanged = !lastAutoFitLocationRef.current || 
      lastAutoFitLocationRef.current.start?.lat !== currentLocations.start?.lat ||
      lastAutoFitLocationRef.current.start?.lon !== currentLocations.start?.lon ||
      lastAutoFitLocationRef.current.end?.lat !== currentLocations.end?.lat ||
      lastAutoFitLocationRef.current.end?.lon !== currentLocations.end?.lon;
    
    if (!locationsChanged) {
      return;
    }
    
    // Update last auto-fit locations
    lastAutoFitLocationRef.current = currentLocations;
    
    // Reset hasUserInteracted when shouldFitBounds is true (location changed from input)
    setHasUserInteracted(false);
    
    // If routeData exists and has polyline, fit to route with expanded bounds
    if (routeData && routeData.length > 0 && routeLineRef.current && routeLineRef.current[0]) {
      
      // Check if route data is fresh (not stale from previous locations)
      const routePolyline = routeData[0].polyline;
      if (routePolyline && routePolyline.length > 0) {
        const firstPoint = routePolyline[0];
        const lastPoint = routePolyline[routePolyline.length - 1];
        
        // Check if route matches current locations (with some tolerance)
        const startMatches = startLocation && 
          Math.abs(firstPoint[0] - startLocation.lat) < 0.01 && 
          Math.abs(firstPoint[1] - startLocation.lon) < 0.01;
        const endMatches = endLocation && 
          Math.abs(lastPoint[0] - endLocation.lat) < 0.01 && 
          Math.abs(lastPoint[1] - endLocation.lon) < 0.01;
        
        if (!startMatches || !endMatches) {
          // Route data is stale, fall back to markers fit
          if (startLocation && endLocation) {
            fitBoundsToMarkers(map, startLocation, endLocation);
            lastFitTypeRef.current = 'markers';
            return;
          }
        }
      }
      
      const bounds = routeLineRef.current[0].getBoundingBox();
      
      // Expand bounds by 15% and shift center to the right
      const latDelta = (bounds.getTop() - bounds.getBottom()) * 0.15;
      const lngDelta = (bounds.getRight() - bounds.getLeft()) * 0.15;
      
      // Calculate center shift - move 20% of the width to the right
      const centerLng = (bounds.getLeft() + bounds.getRight()) / 2;
      const shiftRight = (bounds.getRight() - bounds.getLeft()) * 0.12;
      const newCenterLng = centerLng + shiftRight;
      
      // Calculate new bounds with shift
      const expandedBounds = new window.H.geo.Rect(
        bounds.getBottom() - latDelta,
        bounds.getLeft() - lngDelta - shiftRight,  // Add more space on the left
        bounds.getTop() + latDelta,
        bounds.getRight() + lngDelta - shiftRight  // Compensate the shift
      );
      
      // Apply the bounds with new center
      map.getViewModel().setLookAtData({ 
        bounds: expandedBounds,
        center: { lat: (bounds.getTop() + bounds.getBottom()) / 2, lng: newCenterLng }
      });
      lastFitTypeRef.current = 'route';
      return;
    }
    
    // If both markers exist, fit to both
    if (startLocation && endLocation) {
      fitBoundsToMarkers(map, startLocation, endLocation);
      lastFitTypeRef.current = 'markers';
      return;
    }
    
    // If only start exists, center and zoom
    if (startLocation && !endLocation) {
      map.setCenter({ lat: startLocation.lat, lng: startLocation.lon });
      map.setZoom(14);
      lastFitTypeRef.current = 'start';
      return;
    }
    // else do nothing
  }, [startLocation, endLocation, shouldFitBounds, isMapReady, routeData]);

  // After marker drag, auto-fit to both markers (or route if available)
  // (This is handled by the above effect, since setStartLocation/setEndLocation will update startLocation/endLocation)

  // Remove old hasUserInteracted logic from fitBounds/center/zoom effects
  // Remove the old useEffect for zoom ke startLocation jika routeData belum ada
  // Remove the old useEffect for fit bounds to main route

  // Ref for latest start/end/setter so handler always gets latest value
  const startLocationRef = useRef(startLocation);
  const endLocationRef = useRef(endLocation);
  const setStartLocationRef = useRef(setStartLocation);
  const setEndLocationRef = useRef(setEndLocation);
  useEffect(() => { startLocationRef.current = startLocation; }, [startLocation]);
  useEffect(() => { endLocationRef.current = endLocation; }, [endLocation]);
  useEffect(() => { setStartLocationRef.current = setStartLocation; }, [setStartLocation]);
  useEffect(() => { setEndLocationRef.current = setEndLocation; }, [setEndLocation]);

  // Handle click on map to set start/end/nearest marker (safe, no custom property)
  // useEffect(() => {
  //   const map = mapInstance.current;
  //   if (!map || !window.H) return;
  //   if (drawingMode !== null) return; // Hanya aktif jika tidak sedang gambar
  //   // Define the click handler
  //   const handleMapClick = (evt: any) => {
  //     // Pastikan window.H.map.Marker sudah ada
  //     if (!window.H || !window.H.map || !window.H.map.Marker) return;
  //     // Jika klik pada marker, abaikan (biar drag/marker event yang handle)
  //     if (evt.target && evt.target instanceof window.H.map.Marker) return;
  //     const coord = map.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY);
  //     const startLoc = startLocationRef.current;
  //     const endLoc = endLocationRef.current;
  //     const setStart = setStartLocationRef.current;
  //     const setEnd = setEndLocationRef.current;
  //     // Logic: jika belum ada start, set start. Jika belum ada end, set end. Jika sudah ada dua, geser terdekat.
  //     let isStart = false;
  //     if (!startLoc && typeof setStart === 'function') {
  //       isStart = true;
  //       setStart({ lat: coord.lat, lon: coord.lng });
  //     } else if (!endLoc && typeof setEnd === 'function') {
  //       isStart = false;
  //       setEnd({ lat: coord.lat, lon: coord.lng });
  //     } else if (startLoc && endLoc && typeof setStart === 'function' && typeof setEnd === 'function') {
  //       // Move nearest marker
  //       const getDistance = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  //         const R = 6371e3;
  //         const toRad = (deg: number) => deg * Math.PI / 180;
  //         const dLat = toRad(b.lat - a.lat);
  //         const dLon = toRad(b.lon - a.lon);
  //         const lat1 = toRad(a.lat);
  //         const lat2 = toRad(b.lat);
  //         const x = dLon * Math.cos((lat1 + lat2) / 2);
  //         const y = dLat;
  //         return Math.sqrt(x * x + y * y) * R;
  //       };
  //       const distToStart = getDistance(startLoc, { lat: coord.lat, lon: coord.lng });
  //       const distToEnd = getDistance(endLoc, { lat: coord.lat, lon: coord.lng });
  //       if (distToStart <= distToEnd) {
  //         isStart = true;
  //         setStart({ lat: coord.lat, lon: coord.lng });
  //       } else {
  //         isStart = false;
  //         setEnd({ lat: coord.lat, lon: coord.lng });
  //       }
  //     }
  //     // Trigger parent callback agar input/location state ikut update
  //     if (typeof onMapClickSetLocation === 'function') {
  //       onMapClickSetLocation(coord.lat, coord.lng, isStart);
  //     }
  //   };
  //   map.addEventListener('tap', handleMapClick);
  //   return () => {
  //     map.removeEventListener('tap', handleMapClick);
  //   };
  // }, [onMapClickSetLocation, drawingMode]);



  // Ubah cursor saat drawing mode aktif
  useEffect(() => {
    const mapDiv = mapRef.current;
    if (!mapDiv) return;
    if (drawingMode) {
      mapDiv.style.cursor = 'crosshair'; // Atau gunakan url custom jika ingin icon +
    } else {
      mapDiv.style.cursor = '';
    }
  }, [drawingMode]);

  // Use custom drawing hook
  const {
    drawnShapesRef: drawingShapesRef,
    clearAllShapes
  } = useDrawingMode({
    map: mapInstance.current,
    drawingMode,
    setDrawingMode,
    onGeoshapesChange,
    updateAvoidAreasForRerouting: () => {
      // Use the correct drawnShapesRef from the hook
      updateAvoidAreasForRerouting(drawingShapesRef, setAvoidAreas, onAvoidAreasChange);
    }
  });

  // Use custom shape management hook
  useShapeManagement({
    map: mapInstance.current,
    drawnShapesRef: drawingShapesRef,
    onGeoshapesChange,
    updateAvoidAreasForRerouting: () => {
      // Use the correct drawnShapesRef from the hook
      updateAvoidAreasForRerouting(drawingShapesRef, setAvoidAreas, onAvoidAreasChange);
    }
  });

  // Use custom drawing controls hook
  useDrawingControls({
    mapRef,
    drawingMode,
    setDrawingMode,
    onGeoshapesChange,
    updateAvoidAreasForRerouting: () => {
      // Use the correct drawnShapesRef from the hook
      updateAvoidAreasForRerouting(drawingShapesRef, setAvoidAreas, onAvoidAreasChange);
    },
    drawnShapesRef: drawingShapesRef,
    clearAllShapes
  });



  // Disable map dragging when drawingMode is active
  useEffect(() => {
    if (!behaviorRef.current || !window.H) return;
    if (drawingMode) {
      behaviorRef.current.disable(window.H.mapevents.Behavior.DRAGGING);
    } else {
      behaviorRef.current.enable(window.H.mapevents.Behavior.DRAGGING);
    }
  }, [drawingMode]);



  // --- Expose avoidAreas ke parent (optional, jika ingin trigger reroute otomatis) ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__HERE_AVOID_AREAS = avoidAreas;
    }
    if (typeof onAvoidAreasChange === 'function') {
      onAvoidAreasChange(avoidAreas);
    }
  }, [avoidAreas, onAvoidAreasChange]);



  return (
    <div style={{ position: 'relative', width, height }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 300, borderRadius: 8, zIndex: 0 }} />
  
    </div>
  );
};

export default HereMapNative;