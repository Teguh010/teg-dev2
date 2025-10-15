'use client';

import { useEffect, useRef, useState } from 'react';
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
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersGroup = useRef<L.LayerGroup | null>(null);
  const polylineGroup = useRef<L.LayerGroup | null>(null);

  const stopIcon = L.icon({
    iconUrl: stopBlue.src,
    iconSize: [24, 24], // Size according to your icon PNG
    iconAnchor: [10, 12], // Adjust position anchor
    popupAnchor: [1, -34], // Position popup
  });

  const createRotatedPlayIcon = (angle) => {
    return L.divIcon({
      html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="transform: rotate(${angle}deg); width: 23px; height: 23px;">
          <img src="${arrowGreen.src}" style="width: 100%; height: 100%;" />
        </div>
      </div>
    `,
      className: '',
      iconSize: [22, 22],
      iconAnchor: [14, 14],
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) {
      return;
    }

    if (!mapInstance.current) {
      const initialLat = lat ?? 56.31226;
      const initialLon = lon ?? 22.3230616;

      const map = L.map(mapRef.current).setView([initialLat, initialLon], zoom);
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
      mapInstance.current = map;
    }
  }, []);

  useEffect(() => {
    if (mapInstance.current && markersGroup.current && polylineGroup.current) {
      markersGroup.current.clearLayers();
      polylineGroup.current.clearLayers();

      const latlngs = [];

      vehicleList.forEach((location) => {
        const icon = location.trip_state === 'stationary'
          ? stopIcon
          : createRotatedPlayIcon(location.vectorangle);

        const marker = L.marker([location.lat, location.lon], { icon });
        marker.addTo(markersGroup.current);
        latlngs.push([location.lat, location.lon]);
      });

      if (latlngs.length > 1) {
        const polyline = L.polyline(latlngs, { color: 'blue', weight: 3 }).addTo(polylineGroup.current);
        mapInstance.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      } else if (latlngs.length === 1) {
        mapInstance.current.setView(latlngs[0], zoom);
      }
    }
  }, [vehicleList]);

  return (
    <div
      ref={mapRef}
      className='rounded-lg'
      style={{ width, height: '300px', top: '0px', right: '0px', zIndex: '0' }}
    />
  );
};

export default HereMap;
