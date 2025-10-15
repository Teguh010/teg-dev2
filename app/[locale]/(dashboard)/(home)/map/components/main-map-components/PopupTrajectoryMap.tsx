import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

interface TrajectoryPoint {
  lat: number;
  lon: number;
  time?: string;
  [key: string]: unknown;
}

interface PopupTrajectoryMapProps {
  lat: number;
  lon: number;
  trajectoryData: TrajectoryPoint[];
  loading?: boolean;
  height?: string;
  width?: string;
}

const PopupTrajectoryMap: React.FC<PopupTrajectoryMapProps> = ({
  lat,
  lon,
  trajectoryData,
  loading = false,
  height = '300px',
  width = '100%',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerGroup = useRef<L.LayerGroup | null>(null);
  const polylineGroup = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!mapInstance.current) {
      const map = L.map(mapRef.current).setView([lat, lon], 14);
      const baseMapLayer = L.tileLayer(
        `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/jpeg?apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
        {
          maxZoom: 20,
          attribution: '&copy; 2024 HERE Technologies',
        }
      );
      baseMapLayer.addTo(map);
      markerGroup.current = L.layerGroup().addTo(map);
      polylineGroup.current = L.layerGroup().addTo(map);
      mapInstance.current = map;
    }
  }, [lat, lon]);

  useEffect(() => {
    if (!mapInstance.current || !markerGroup.current || !polylineGroup.current) return;
    markerGroup.current.clearLayers();
    polylineGroup.current.clearLayers();

    // Add marker for the vehicle
    if (lat && lon) {
      const defaultIcon = L.icon({
        iconUrl: markerIconPng.src,
        shadowUrl: markerShadowPng.src,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      L.marker([lat, lon], { icon: defaultIcon }).addTo(markerGroup.current);
      mapInstance.current.setView([lat, lon], 14);
    }

    // Add trajectory polyline and start/stop markers
    if (trajectoryData && trajectoryData.length > 1) {
      // Sort by time if available
      const sorted = [...trajectoryData].sort((a, b) => {
        if (a.time && b.time) {
          return new Date(a.time).getTime() - new Date(b.time).getTime();
        }
        return 0;
      });
      const latlngs = sorted.map((point) => [point.lat, point.lon] as [number, number]);
      const polyline = L.polyline(latlngs, { color: '#3B82F6', weight: 4 });
      polyline.addTo(polylineGroup.current);
      mapInstance.current.fitBounds(polyline.getBounds(), { padding: [30, 30] });

      // Start marker (green)
      const start = sorted[0];
      const startIcon = L.divIcon({
        html: `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 48 48'><path d='M24 0C12.955 0 4 9.075 4 20.075C4 28.35 24 48 24 48S44 28.35 44 20.075C44 9.075 35.045 0 24 0Z' fill='#32CD32'/><text x='24' y='24' font-size='15' text-anchor='middle' fill='#fff'>Start</text></svg>`,
        className: 'custom-marker-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });
      L.marker([start.lat, start.lon], { icon: startIcon }).addTo(markerGroup.current!);

      // Stop marker (default Leaflet)
      const stop = sorted[sorted.length - 1];
      const defaultIcon = L.icon({
        iconUrl: markerIconPng.src,
        shadowUrl: markerShadowPng.src,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      L.marker([stop.lat, stop.lon], { icon: defaultIcon }).addTo(markerGroup.current!);
    }
  }, [lat, lon, trajectoryData]);

  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.invalidateSize();
    }
  }, [height, width]);

  return (
    <div style={{ position: 'relative', width, height }}>
      {loading && (
        <div style={{ position: 'absolute', zIndex: 10, left: 0, top: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span>Loading...</span>
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '8px', zIndex: 1 }} />
    </div>
  );
};

export default PopupTrajectoryMap; 