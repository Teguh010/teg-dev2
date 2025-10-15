'use client';

import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface ValidRawMessage {
  msg_data?: Record<string, unknown> | string;
  invalid_msg_data?: Record<string, unknown> | string;
  gpstime?: string | Date;
  ignition?: boolean | string;
  lat?: number;
  lon?: number;
  speed?: number;
  [key: string]: unknown;
}

interface RawMessagesMapProps {
  dataValidRawMessages: ValidRawMessage[];
  selectedLocation?: ValidRawMessage;
  onMarkerClick?: (data: ValidRawMessage) => void;
}

const RawMessagesMap: React.FC<RawMessagesMapProps> = ({
  dataValidRawMessages,
  selectedLocation,
  onMarkerClick,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersGroup = useRef<L.LayerGroup | null>(null);
  const polylineGroup = useRef<L.LayerGroup | null>(null);

  const dotIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 16 16"><path fill="#0000FF" d="M8 4C5.8 4 4 5.8 4 8s1.8 4 4 4s4-1.8 4-4s-1.8-4-4-4"/><path fill="#0000FF" d="M8 1c3.9 0 7 3.1 7 7s-3.1 7-7 7s-7-3.1-7-7s3.1-7 7-7m0-1C3.6 0 0 3.6 0 8s3.6 8 8 8s8-3.6 8-8s-3.6-8-8-8"/></svg>`;

  // Helper function to safely format date
  const formatDate = (dateValue: string | Date | undefined): string => {
    if (!dateValue) return 'N/A';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return format(date, 'dd/MM/yyyy HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current).setView([56.31226, 22.3230616], 15);

    const baseMapLayer = L.tileLayer(
      `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/jpeg?apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
      {
        maxZoom: 20,
        attribution: '&copy; 2024 HERE Technologies'
      }
    );
    
    const satelliteLayer = L.tileLayer(
      `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/jpeg?size=256&style=explore.satellite.day&apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
      {
        subdomains: ['1', '2', '3', '4'],
        maxZoom: 18,
        detectRetina: true,
        attribution: '&copy; 2024 HERE Technologies'
      }
    );

    // Coba style alternatif untuk truck map
    const truckLayer = L.tileLayer(
      `https://{s}.base.maps.ls.hereapi.com/maptile/2.1/trucktile/newest/normal.day/12/2199/1342/256/png8?apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
      {
        subdomains: ['1', '2', '3', '4'],
        maxZoom: 20,
        detectRetina: true,
        attribution: '&copy; 2024 HERE Technologies'
      }
    );

    baseMapLayer.addTo(map);

    L.control
      .layers({
        'Standard Map': baseMapLayer,
        'Satellite Map': satelliteLayer
      })
      .addTo(map);

    markersGroup.current = L.layerGroup().addTo(map);
    polylineGroup.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Show polyline trajectory as default
  useEffect(() => {
    if (!mapInstance.current || !polylineGroup.current || !dataValidRawMessages || dataValidRawMessages.length === 0) return;

    polylineGroup.current.clearLayers();

    // Sort data by time
    const sortedData = [...dataValidRawMessages].sort((a, b) => {
      const timeA = new Date(a.gpstime || '').getTime();
      const timeB = new Date(b.gpstime || '').getTime();
      return timeA - timeB;
    });

    const latlngs = sortedData
      .filter(point => point.lat && point.lon && !isNaN(point.lat) && !isNaN(point.lon))
      .map((point) => [point.lat, point.lon] as [number, number]);

    if (latlngs.length > 0) {
      const polyline = L.polyline(latlngs, {
        color: 'blue',
        weight: 4, 
        opacity: 0.7
      });

      polyline.addTo(polylineGroup.current);
      mapInstance.current.fitBounds(polyline.getBounds());
    }
  }, [dataValidRawMessages]);

  // Show marker only when selectedLocation is clicked from chart
  useEffect(() => {
    if (!mapInstance.current || !markersGroup.current || !selectedLocation) return;

    markersGroup.current.clearLayers();
    
    // Validate coordinates
    if (!selectedLocation.lat || !selectedLocation.lon || 
        isNaN(selectedLocation.lat) || isNaN(selectedLocation.lon)) {
      console.error('Invalid coordinates for selected location:', selectedLocation);
      return;
    }
    
    const marker = L.marker([selectedLocation.lat, selectedLocation.lon], {
      icon: L.divIcon({
        html: dotIconSVG,
        className: 'default-marker-icon'
      })
    }).bindPopup(`
      <div style="line-height:1.3; font-size:13px;">
        <span><strong>Time:</strong> ${formatDate(selectedLocation.gpstime)}</span><br/>
        <span><strong>Speed:</strong> ${selectedLocation.speed || 0} km/h</span><br/>
        <span><strong>Ignition:</strong> ${selectedLocation.ignition ? 'On' : 'Off'}</span><br/>
        <span><strong>Lat, Lon:</strong> 
          <a href="https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lon}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8; text-decoration:underline; display:inline-flex; align-items:center;">
            ${selectedLocation.lat}, ${selectedLocation.lon}
            <span style="margin-left:4px; display:inline-block; vertical-align:middle;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 256 367"><path fill="#34a853" d="M70.585 271.865a371 371 0 0 1 28.911 42.642c7.374 13.982 10.448 23.463 15.837 40.31c3.305 9.308 6.292 12.086 12.714 12.086c6.998 0 10.173-4.726 12.626-12.035c5.094-15.91 9.091-28.052 15.397-39.525c12.374-22.15 27.75-41.833 42.858-60.75c4.09-5.354 30.534-36.545 42.439-61.156c0 0 14.632-27.035 14.632-64.792c0-35.318-14.43-59.813-14.43-59.813l-41.545 11.126l-25.23 66.451l-6.242 9.163l-1.248 1.66l-1.66 2.078l-2.914 3.319l-4.164 4.163l-22.467 18.304l-56.17 32.432z"/><path fill="#fbbc04" d="M12.612 188.892c13.709 31.313 40.145 58.839 58.031 82.995l95.001-112.534s-13.384 17.504-37.662 17.504c-27.043 0-48.89-21.595-48.89-48.825c0-18.673 11.234-31.501 11.234-31.501l-64.489 17.28z"/><path fill="#4285f4" d="M166.705 5.787c31.552 10.173 58.558 31.53 74.893 63.023l-75.925 90.478s11.234-13.06 11.234-31.617c0-27.864-23.463-48.68-48.81-48.68c-23.969 0-37.735 17.475-37.735 17.475v-57z"/><path fill="#1a73e8" d="M30.015 45.765C48.86 23.218 82.02 0 127.736 0c22.18 0 38.89 5.823 38.89 5.823L90.29 96.516H36.205z"/><path fill="#ea4335" d="M12.612 188.892S0 164.194 0 128.414c0-33.817 13.146-63.377 30.015-82.649l60.318 50.759z"/></svg>
            </span>
          </a>
        </span><br/>
        ${selectedLocation['(can)_distance_driven'] ? `<span><strong>Distance:</strong> ${selectedLocation['(can)_distance_driven']} km</span><br/>` : ''}
        ${selectedLocation['(can)_fuel_consumption'] ? `<span><strong>Fuel Consumption:</strong> ${selectedLocation['(can)_fuel_consumption']} L</span><br/>` : ''}
        ${selectedLocation['(can)_fuel_tank_level'] ? `<span><strong>Fuel Level:</strong> ${selectedLocation['(can)_fuel_tank_level']}%</span><br/>` : ''}
      </div>
    `);
    
    marker.addTo(markersGroup.current);
    marker.openPopup();
    
    // Center map on selected location
    mapInstance.current.setView([selectedLocation.lat, selectedLocation.lon], 14);
  }, [selectedLocation]);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '38vh',
        position: 'relative',
      }}
    />
  );
};

export default RawMessagesMap; 