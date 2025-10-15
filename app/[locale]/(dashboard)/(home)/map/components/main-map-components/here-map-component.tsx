"use client";

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
interface HereMapProps {
  lat?: number;
  lon?: number;
  zoom?: number;
  width?: string;
  height?: string;
  vehicleList?: any[]
  data?: any;
}


const HereMap: React.FC<HereMapProps> = ({
  lat = null,
  lon = null,
  zoom = 14,
  width = '100%',
  height = '94.5vh',
  vehicleList = [],
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  const arrowIcon = (angle: number) => `
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="45" height="45" viewBox="0 0 40 40">
      <path fill-opacity="null" stroke-opacity="null" stroke-width="1.5" stroke="#000" fill="#fff" d="M3.165 19.503L10.527 3C11.117 1.676 12.882 1.676 13.472 3L20.834 19.503C21.501 20.998 20.02 22.55 18.632 21.809L12.728 18.657C12.269 18.412 11.728 18.412 11.27 18.657L5.365 21.809C3.977 22.55 2.495 20.998 3.165 19.503Z"
        transform="rotate(${angle}, 20, 20)" />
    </svg>`;

  const dotIconSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="45px" height="45px" viewBox="0 0 256 256">
      <path fill="#0000FF" d="M128 80a48 48 0 1 0 48 48a48 48 0 0 0-48-48m0 60a12 12 0 1 1 12-12a12 12 0 0 1-12 12"/>
    </svg>`;

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) {
      return;
    }

    if (mapInstance.current) {
      return;
    }

    const initialLat = lat != null ? lat : 56.31226;
    const initialLon = lon != null ? lon : 22.3230616;

    const map = L.map(mapRef.current).setView([initialLat, initialLon], zoom);

    const urlTemplate = `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/jpeg?apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`;

    L.tileLayer(urlTemplate, {
      maxZoom: 18,
      attribution: '&copy; 2024 HERE Technologies',
    }).addTo(map);

    mapInstance.current = map;

    const markers: [number, number][] = [];

    vehicleList.forEach((location) => {
      if (location.lat && location.lon) {
        let marker;

        if (location.trip_state !== 'moving') {
          const dotIcon = L.divIcon({
            html: dotIconSVG,
            className: 'custom-dot-icon',
            iconSize: [45, 45],
          });
          marker = L.marker([location.lat, location.lon], { icon: dotIcon });
        } else {
          const iconSvg = arrowIcon(location.vectorangle);
          const arrowIconLeaflet = L.divIcon({
            html: iconSvg,
            className: 'custom-arrow-icon',
            iconSize: [45, 45],
          });
          marker = L.marker([location.lat, location.lon], { icon: arrowIconLeaflet });
        }

        marker.bindPopup(`
          <div>
            <div><b>${location.name}</b></div>
            <div>Latitude: ${location.lat}</div>
            <div>Longitude: ${location.lon}</div>
          </div>
        `);

        marker.addTo(map);

        markers.push([location.lat, location.lon]);
      }
    });

    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    const cleanupMap = () => {
      if (mapInstance.current) {
        mapInstance.current.eachLayer((layer) => {
          if (layer instanceof L.TileLayer || layer instanceof L.Marker) {
            mapInstance.current?.removeLayer(layer);
          }
        });
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };

    return () => {
      cleanupMap();
    };
  }, [lat, lon, zoom, vehicleList]);

  useEffect(() => {
    if (mapInstance.current && lat != null && lon != null) {
      mapInstance.current.setView([lat, lon], zoom);
    }
  }, [lat, lon, zoom]);

    return <div ref={mapRef} style={{ width, height, top: '50px', right: '0px', zIndex: '0' }} />;
};

export default HereMap;
