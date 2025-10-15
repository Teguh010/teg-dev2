'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface HereMapProps {
  lat?: number
  lon?: number
  zoom?: number
  width?: string
  height?: string
}

const HereMap: React.FC<HereMapProps> = ({
  lat = -7.614529,
  lon = 110.712247,
  zoom = 14,
  width = '100%',
  height = 'calc(100vh - 52px)',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  const [startMarker, setStartMarker] = useState<L.Marker | null>(null);
  const [endMarker, setEndMarker] = useState<L.Marker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    if (!mapInstance.current) {
      const map = L.map(mapRef.current).setView([lat, lon], zoom);

      const baseMapLayer = L.tileLayer(
        `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/jpeg?apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
        { maxZoom: 20, attribution: '&copy; 2024 HERE Technologies' }
      );

      baseMapLayer.addTo(map);
      mapInstance.current = map;
    }
  }, [lat, lon, zoom]);

  useEffect(() => {
    if (mapInstance.current) {
      const handleMapClick = (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (!startMarker) {
          const marker = L.marker([lat, lng], { title: 'Start' }).addTo(mapInstance.current!);
          setStartMarker(marker);
        } else if (!endMarker) {
          const marker = L.marker([lat, lng], { title: 'End' }).addTo(mapInstance.current!);
          setEndMarker(marker);
        }
      };
      mapInstance.current.on('click', handleMapClick);
      return () => {
        mapInstance.current?.off('click', handleMapClick);
      };
    }
  }, [startMarker, endMarker]);

  useEffect(() => {
    if (startMarker && endMarker) {
      const startLatLng = startMarker.getLatLng();
      const endLatLng = endMarker.getLatLng();

      const start = `${startLatLng.lng},${startLatLng.lat}`;
      const end = `${endLatLng.lng},${endLatLng.lat}`;

      const routeURL = `https://router.hereapi.com/v8/routes?origin=${startLatLng.lat},${startLatLng.lng}&destination=${endLatLng.lat},${endLatLng.lng}&return=tolls&transportMode=car&currency=USD&apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`;

      fetch(routeURL)
        .then((res) => res.json())
        .then((data) => {
          if (data.routes && data.routes[0]) {
            const route = data.routes[0];
            const tolls = route.sections[0].tolls;

            if (tolls && tolls.length > 0) {
              tolls.forEach((toll: any) => {
                toll.fares.forEach((fare: any) => {
                });
              });
            } else {
              console.error('No tolls found on this route.');
            }
          }
        })
        .catch((err) => console.error('Error fetching route:', err));
    }
  }, [startMarker, endMarker]);

  return <div ref={mapRef} style={{ width, height, top: '0px', right: '0px', zIndex: '0' }} />;
};

export default HereMap;
