'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import stopBlue from '@/public/images/home/stop-blue.png';
import arrowGreen from '@/public/images/home/arrow-green.png';

const HereMap = ({
  lat = null,
  lon = null,
  zoom = 14,
  width = '350px',
  vehicleList = [],
  selectedRowIds = [], // array of id
  activeRowId = null, // id yang benar-benar aktif (dari map)
  onMarkerClick = (_id: string | number) => {}, // allow id argument
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersGroup = useRef<L.LayerGroup | null>(null);
  const polylineGroup = useRef<L.LayerGroup | null>(null);
  const markerRefs = useRef<Record<string | number, L.Marker>>({});
  // Tambahan untuk simpan posisi dan zoom terakhir
  const lastCenter = useRef<L.LatLng | null>(null);
  const lastZoom = useRef<number | null>(null);
  const prevVehicleListLength = useRef<number>(vehicleList.length);

  const stopIcon = L.icon({
    iconUrl: stopBlue.src,
    iconSize: [24, 24], // Size according to your icon PNG
    iconAnchor: [10, 12], // Adjust position anchor
    popupAnchor: [1, -34], // Position popup
  });

  // Icon merah untuk selected
  const selectedIcon = L.icon({
    iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png', // ganti dengan icon merah custom jika ada
    iconSize: [24, 24],
    iconAnchor: [10, 12],
    popupAnchor: [1, -34],
  });

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

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) {
      return;
    }

    if (!mapInstance.current) {
      const initialLat = lastCenter.current?.lat ?? lat ?? 56.31226;
      const initialLon = lastCenter.current?.lng ?? lon ?? 22.3230616;
      const initialZoom = lastZoom.current ?? zoom;
      const map = L.map(mapRef.current).setView([initialLat, initialLon], initialZoom);
      const baseMapLayer = L.tileLayer(
        `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/jpeg?apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
        {
          maxZoom: 20,
          attribution: '&copy; 2024 HERE Technologies',
        }
      );

      const satelliteLayer = L.tileLayer(
        `https://{s}.aerial.maps.ls.hereapi.com/maptile/2.1/maptile/newest/satellite.day/{z}/{x}/{y}/256/png8?apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
        {
          subdomains: ['1', '2', '3', '4'],
          maxZoom: 20,
          detectRetina: true,
          attribution: '&copy; 2024 HERE Technologies',
        }
      );

      // Truck layer
      const truckLayer = L.tileLayer(
        `https://{s}.base.maps.ls.hereapi.com/maptile/2.1/trucktile/newest/normal.day/{z}/{x}/{y}/256/png8?apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
        {
          subdomains: ['1', '2', '3', '4'],
          maxZoom: 20,
          detectRetina: true,
          attribution: '&copy; 2024 HERE Technologies',
        }
      );

      baseMapLayer.addTo(map);

       L.control
        .layers({
          'Standard Map': baseMapLayer,
          'Satellite Map': satelliteLayer,
          'Truck Map': truckLayer,
        })
        .addTo(map);
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
          icon = isActive ? selectedIcon : (isSelected ? selectedIcon : stopIcon);
        } else {
          icon = getCachedRotatedIcon(location.vectorangle, isSelected, isActive);
        }
        const marker = L.marker([location.lat, location.lon], { 
          icon,
          zIndexOffset: isSelected ? 1000 : 0 // hanya selected yang lebih tinggi
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
          icon = isActive ? selectedIcon : (isSelected ? selectedIcon : stopIcon);
        } else {
          icon = getCachedRotatedIcon(location.vectorangle, isSelected, isActive);
        }
        marker.setIcon(icon);
        marker.setZIndexOffset(isSelected ? 1000 : 0); // hanya selected yang lebih tinggi
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
          mapInstance.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        } else if (latlngs.length === 1) {
          mapInstance.current.setView(latlngs[0], zoom);
        }
        prevVehicleListLength.current = vehicleList.length;
      }
    }
  }, [vehicleList]);

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
};

export default HereMap;
