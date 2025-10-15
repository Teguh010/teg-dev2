'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import stopBlue from '@/public/images/home/stop-blue.png';
import arrowGreen from '@/public/images/home/arrow-green.png';

type VehicleLocation = {
  id: string | number;
  lat: number;
  lon: number;
  [key: string]: unknown;
};

const HereMap = forwardRef<{ zoomToMarker: (lat: number, lon: number) => void }, {
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
}>(({
  lat = null,
  lon = null,
  zoom = 14,
  width = '350px',
  vehicleList = [],
  selectedRowIds = [], // array of id
  activeRowId = null, // id yang benar-benar aktif (dari map)
  onMarkerClick = () => {}, // allow id argument
  isZoomEnabled = true,
  onResetZoom,
}, ref) => {

  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersGroup = useRef<L.LayerGroup | null>(null);
  const polylineGroup = useRef<L.LayerGroup | null>(null);
  const markerRefs = useRef<Record<string | number, L.Marker>>({});
  // Tambahan untuk simpan posisi dan zoom terakhir
  const lastCenter = useRef<L.LatLng | null>(null);
  const lastZoom = useRef<number | null>(null);
  const prevVehicleListLength = useRef<number>(vehicleList.length);
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


  const iconCache = new Map();

  const getCachedRotatedIcon = (angle, isSelected, isActive) => {
    const key = `${angle}_${isSelected ? 'sel' : 'unsel'}_${isActive ? 'active' : 'inactive'}`;
    if (iconCache.has(key)) return iconCache.get(key);
    const icon = L.divIcon({
      html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="transform: rotate(${angle}deg); width: 23px; height: 23px; border: 2px solid ${isActive ? 'red' : (isSelected ? 'orange' : 'transparent')}; border-radius: 50%; box-sizing: border-box;">
          <img src="${arrowGreen.src}" style="width: 100%; height: 100%;" />
        </div>
      </div>
    `,
      className: '',
      iconSize: [22, 22],
      iconAnchor: [14, 14],
    });
    iconCache.set(key, icon);
    return icon;
  };

  // Tambahkan setelah getCachedRotatedIcon (sekitar line 87)
const getCachedStationaryIcon = (isSelected, isActive) => {
  const key = `stationary_${isSelected ? 'sel' : 'unsel'}_${isActive ? 'active' : 'inactive'}`;
  if (iconCache.has(key)) return iconCache.get(key);
  const icon = L.divIcon({
    html: `
    <div style="display: flex; flex-direction: column; align-items: center;">
      <div style="width: 23px; height: 23px; border: 2px solid ${isActive ? 'red' : (isSelected ? 'orange' : 'transparent')}; border-radius: 50%; box-sizing: border-box;">
        <img src="${stopBlue.src}" style="width: 100%; height: 100%;" />
      </div>
    </div>
  `,
    className: '',
    iconSize: [22, 22],
    iconAnchor: [14, 14],
  });
  iconCache.set(key, icon);
  return icon;
};

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) {
      return;
    }

    if (!mapInstance.current) {
      const initialLat = lastCenter.current?.lat ?? lat ?? 56.31226;
      const initialLon = lastCenter.current?.lng ?? lon ?? 22.3230616;
      const initialZoom = lastZoom.current ?? zoom;
      const map = L.map(mapRef.current).setView([initialLat, initialLon], initialZoom);
      // HERE Maps v3 layers
      const baseMapLayer = L.tileLayer(
        `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/jpeg?apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
        {
          maxZoom: 20,
          attribution: '&copy; 2024 HERE Technologies',
        }
      );
      const satelliteLayer = L.tileLayer(
        `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/jpeg?style=satellite.day&apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
        {
          maxZoom: 20,
          attribution: '&copy; 2024 HERE Technologies',
        }
      );
      const truckLayer = L.tileLayer(
        `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png8?features=vehicle_restrictions:active_and_inactive&style=logistics.day&apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
        {
          maxZoom: 20,
          attribution: '&copy; 2024 HERE Technologies',
        }
      );
      baseMapLayer.addTo(map);
      L.control.layers({
        'Standard Map': baseMapLayer,
        'Satellite Map': satelliteLayer,
        'Truck Map': truckLayer,
      }).addTo(map);
      markersGroup.current = L.layerGroup().addTo(map);
      polylineGroup.current = L.layerGroup().addTo(map);
      map.on('moveend', () => {
        lastCenter.current = map.getCenter();
      });
      map.on('zoomend', () => {
        lastZoom.current = map.getZoom();
      });
      mapInstance.current = map;
    }
  }, []);

  // Render markers and polylines ONLY when vehicleList changes
  useEffect(() => {
    if (mapInstance.current && markersGroup.current && polylineGroup.current) {
      markersGroup.current.clearLayers();
      polylineGroup.current.clearLayers();
      markerRefs.current = {};
      const latlngs = [];
      vehicleList.forEach((location) => {
        const markerId = location.id;
        const isSelected = selectedRowIds.includes(markerId);
        const isActive = activeRowId === markerId;
        

      let icon;
if (location.trip_state === 'stationary') {
  icon = getCachedStationaryIcon(isSelected, isActive);
} else {
  icon = getCachedRotatedIcon(location.vectorangle, isSelected, isActive);
}
        const marker = L.marker([location.lat, location.lon], { 
          icon,
          zIndexOffset: isActive ? 2000 : (isSelected ? 1000 : 0) // active lebih tinggi dari selected
        });
        marker.on('click', function() {
          onMarkerClick(markerId);
        });
        marker.addTo(markersGroup.current);
        markerRefs.current[markerId] = marker;
        latlngs.push([location.lat, location.lon]);
      });
    }
  }, [vehicleList, activeRowId, selectedRowIds]);

  // Only update marker icons when selection changes, and only for changed markers
  const prevSelectedRef = useRef<Set<string | number>>(new Set(selectedRowIds));
  useEffect(() => {
    const prevSelected = prevSelectedRef.current;
    const currSelected = new Set(selectedRowIds);
    Object.entries(markerRefs.current).forEach(([markerId, marker]) => {
      const location = vehicleList.find((loc) => String(loc.id) === markerId);
      if (!location) return;
      const wasSelected = prevSelected.has(location.id);
      const isSelected = currSelected.has(location.id);
      const isActive = activeRowId === location.id;
      if (wasSelected !== isSelected || isActive) {
       let icon;
if (location.trip_state === 'stationary') {
  icon = getCachedStationaryIcon(isSelected, isActive);
} else {
  icon = getCachedRotatedIcon(location.vectorangle, isSelected, isActive);
}
        marker.setIcon(icon);
        marker.setZIndexOffset(isActive ? 2000 : (isSelected ? 1000 : 0)); // active lebih tinggi dari selected
      }
    });
    prevSelectedRef.current = currSelected;
  }, [selectedRowIds, vehicleList, activeRowId]);



  // Only fitBounds/setView when vehicleList length changes (not selection)
  useEffect(() => {
    if (mapInstance.current && vehicleList && vehicleList.length > 0) {
      // Hanya jika jumlah kendaraan berubah
      if (prevVehicleListLength.current !== vehicleList.length) {
        const latlngs = vehicleList.map(loc => [loc.lat, loc.lon] as [number, number]);
        if (latlngs.length > 1) {
          const polyline = L.polyline(latlngs, { color: 'blue', weight: 3 });
          const bounds = polyline.getBounds();
          initialBounds.current = bounds; // Save initial bounds for reset
          mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
        } else if (latlngs.length === 1) {
          mapInstance.current.setView(latlngs[0], zoom);
        }
        prevVehicleListLength.current = vehicleList.length;
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

  useEffect(() => {
  if (mapInstance.current && vehicleList && vehicleList.length > 0) {
    const latlngs = vehicleList.map(loc => [loc.lat, loc.lon] as [number, number]);
    const allSame = latlngs.every(([lat, lon]) => lat === latlngs[0][0] && lon === latlngs[0][1]);
    if (latlngs.length > 1 && !allSame) {
      const polyline = L.polyline(latlngs, { color: 'blue', weight: 3 });
      mapInstance.current.fitBounds(polyline.getBounds());
    } else if (latlngs.length >= 1) {
      mapInstance.current.setView(latlngs[0], zoom);
    }
  }
}, []);


  return (
    <div
      ref={mapRef}
      className='rounded-lg'
      style={{ width, height: '300px', top: '0px', right: '0px', zIndex: '0' }}
    />
  );
});

export default HereMap;
