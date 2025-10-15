'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.glify';
import type { LatLngTuple } from 'leaflet';

type VehicleLocation = {
  id: string | number;
  lat: number;
  lon: number;
  [key: string]: any;
};

type HereMapProps = {
  lat?: number | null;
  lon?: number | null;
  zoom?: number;
  width?: string;
  vehicleList?: VehicleLocation[];
  selectedRowIds?: Array<string | number>;
  activeRowId?: string | number | null;
  onMarkerClick?: (id: string | number) => void;
  isZoomEnabled?: boolean;
  onResetZoom?: (resetFn: () => void) => void;
};

// Tambahkan deklarasi interface Window untuk menghindari linter error pada akses window.L.glify
declare global {
  interface Window {
    L: typeof L & { glify?: { points: (...args: any[]) => L.Layer } };
  }
}

const HereMap = forwardRef<{ zoomToMarker: (lat: number, lon: number) => void }, HereMapProps>(({
  lat = null,
  lon = null,
  zoom = 14,
  width = '350px',
  vehicleList = [],
  selectedRowIds = [],
  activeRowId = null,
  onMarkerClick = () => {},
  isZoomEnabled = true,
  onResetZoom,
}, ref) => {

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const glifyLayerRef = useRef<L.Layer | null>(null);
  const initialBounds = useRef<L.LatLngBounds | null>(null);
  const resetZoomRef = useRef<(() => void) | null>(null);

  // Expose zoomToMarker method via ref
  const zoomToMarker = useCallback((lat: number, lon: number) => {
    if (mapInstance.current && isZoomEnabled) {
      mapInstance.current.setView([lat, lon], 16, { animate: true });
    }
  }, [isZoomEnabled]);

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    zoomToMarker
  }), [zoomToMarker]);

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    if (!mapInstance.current) {
      const initialLat = lat ?? -6.2088;
      const initialLon = lon ?? 106.8456;

      const map = L.map(mapRef.current).setView([initialLat, initialLon], zoom);
      
      // HERE Maps v3 layers
      const baseMapLayer = L.tileLayer(
        `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/jpeg?apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
        {
          maxZoom: 20,
          attribution: '&copy; HERE Technologies',
        }
      );
      const satelliteLayer = L.tileLayer(
        `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/jpeg?style=satellite.day&apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
        {
          maxZoom: 20,
          attribution: '&copy; HERE Technologies',
        }
      );
      const truckLayer = L.tileLayer(
        `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png8?features=vehicle_restrictions:active_and_inactive&style=logistics.day&apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
        {
          maxZoom: 20,
          attribution: '&copy; HERE Technologies',
        }
      );
      baseMapLayer.addTo(map);
      L.control.layers({
        'Standard Map': baseMapLayer,
        'Satellite Map': satelliteLayer,
        'Truck Map': truckLayer,
      }).addTo(map);
      mapInstance.current = map;
    }

    // Cleanup
    return () => {
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
        } catch (e) {
          console.warn('Error removing map instance:', e);
        }
        mapInstance.current = null;
      }
    };
  }, [lat, lon, zoom]);

  // Render markers with Leaflet.glify
  useEffect(() => {
    if (!mapInstance.current || !window.L?.glify) return;

    // Remove previous glify layer
    if (glifyLayerRef.current && mapInstance.current) {
      try {
        mapInstance.current.removeLayer(glifyLayerRef.current);
      } catch (e) {
        console.warn('Error removing glify layer:', e);
      }
      glifyLayerRef.current = null;
    }

    // Prepare data for glify
    const validPoints: LatLngTuple[] = [];
    const pointMetadata: Array<{
      id: string | number;
      color: { r: number; g: number; b: number; a: number };
      size: number;
    }> = [];

    // Pisahkan lokasi berdasarkan status
    const normalPoints: VehicleLocation[] = [];
    const selectedPoints: VehicleLocation[] = [];
    let activePoint: VehicleLocation | null = null;

    vehicleList.forEach((location) => {
      if (
        typeof location?.lat === 'number' &&
        typeof location?.lon === 'number' &&
        !isNaN(location.lat) &&
        !isNaN(location.lon)
      ) {
        if (activeRowId === location.id) {
          activePoint = location;
        } else if (selectedRowIds.includes(location.id)) {
          selectedPoints.push(location);
        } else {
          normalPoints.push(location);
        }
      }
    });

    // Gabungkan urutan: normal → selected → active
    const orderedPoints = [
      ...normalPoints,
      ...selectedPoints,
      ...(activePoint ? [activePoint] : []),
    ];

    orderedPoints.forEach((location) => {
      const isSelected = selectedRowIds.includes(location.id);
      const isActive = activeRowId === location.id;
      


      // Penentuan warna status
      let statusColor: { r: number; g: number; b: number; a: number } = { r: 0, g: 51, b: 153, a: 1 }; // default biru tua
      const tripState = (location.trip_state || '').toLowerCase();
    

      if (tripState === 'moving') {
        statusColor = { r: 0, g: 200, b: 0, a: 1 }; // hijau
      } else if (tripState === 'stationary with ignition') {
        statusColor = { r: 0, g: 200, b: 0, a: 1 }; // hijau
      } else if (tripState === 'stationary') {
        statusColor = { r: 0, g: 102, b: 255, a: 1 }; // biru
      }

      validPoints.push([location.lat, location.lon]);
      pointMetadata.push({
        id: location.id,
        color: isActive
          ? { r: 255, g: 0, b: 255, a: 1 } // magenta solid untuk position marker (lebih kontras)
          : isSelected
            ? { r: 255, g: 69, b: 0, a: 1 } // oranye kemerahan untuk selected markers
            : statusColor,
        size: isActive ? 26 : (isSelected ? 24 : 20), // ukuran lebih besar untuk position marker
      });
    });

    if (validPoints.length > 0) {
      try {
        glifyLayerRef.current = window.L.glify.points({
          map: mapInstance.current,
          data: validPoints,
          click: (_e: unknown, point: LatLngTuple) => {
            const clickedIndex = validPoints.findIndex(
              (p) => p[0] === point[0] && p[1] === point[1]
            );
            if (clickedIndex >= 0) {
              onMarkerClick(pointMetadata[clickedIndex].id);
            }
          },
          color: (i: number) => pointMetadata[i].color,
          size: (i: number) => pointMetadata[i].size,
        });
      } catch (error) {
        console.error('Error creating glify layer:', error);
      }
    }

    // Cleanup
    return () => {
      if (mapInstance.current && glifyLayerRef.current) {
        try {
          mapInstance.current.removeLayer(glifyLayerRef.current);
        } catch (e) {
          console.warn('Error removing glify layer (cleanup):', e);
        }
        glifyLayerRef.current = null;
      }
    };
  }, [vehicleList, onMarkerClick]); // Hanya rerender marker saat vehicleList atau onMarkerClick berubah

  // Fit bounds hanya saat vehicleList berubah
  useEffect(() => {
    if (mapInstance.current && vehicleList && vehicleList.length > 0) {
      const validPoints: LatLngTuple[] = vehicleList
        .filter(loc => typeof loc.lat === 'number' && typeof loc.lon === 'number' && !isNaN(loc.lat) && !isNaN(loc.lon))
        .map(loc => [loc.lat, loc.lon] as LatLngTuple);
      if (validPoints.length > 1) {
        const bounds = L.latLngBounds(validPoints);
        initialBounds.current = bounds; // Save initial bounds for reset
        mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
      } else if (validPoints.length === 1) {
        mapInstance.current.setView(validPoints[0], zoom);
      }
    }
  }, [vehicleList]);

  // Effect untuk reset zoom
  useEffect(() => {
    if (mapInstance.current && initialBounds.current) {
      const resetZoom = () => {
        if (mapInstance.current && initialBounds.current) {
          mapInstance.current.fitBounds(initialBounds.current, { padding: [50, 50] });
        }
      };
      
      // Store reset function in ref
      resetZoomRef.current = resetZoom;
    }
  }, [vehicleList]);

  // Effect untuk memanggil onResetZoom ketika reset function ready
  useEffect(() => {
    if (onResetZoom && resetZoomRef.current) {
      onResetZoom(resetZoomRef.current);
    }
  }, [onResetZoom, resetZoomRef.current]);

  return (
    <div
      ref={mapRef}
      className="rounded-lg"
      style={{ 
        width, 
        height: '300px', 
        backgroundColor: '#f0f0f0' // Fallback background
      }}
    />
  );
});

export default HereMap;