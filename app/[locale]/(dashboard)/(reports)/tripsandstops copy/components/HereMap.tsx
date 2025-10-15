'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const HereMap = ({ 
  vehicleList = [],
  focusLocation,
  onMarkerClick,
  focusZoom = 15 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersGroup = useRef<L.LayerGroup | null>(null);
  const polylineGroup = useRef<L.LayerGroup | null>(null);

  const style = document.createElement('style');
  style.textContent = `
    @keyframes markerPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    .marker-active {
      animation: markerPulse 1.5s infinite;
    }
  `;
  document.head.appendChild(style);

  const createNumberedIcon = (number, isMoving, isActive) => {
    return L.divIcon({
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48">
          <path d="M24 0C12.955 0 4 9.075 4 20.075C4 28.35 24 48 24 48S44 28.35 44 20.075C44 9.075 35.045 0 24 0Z" 
                fill="${isMoving ? '#10B981' : '#3B82F6'}" />
          <text x="24" y="24" 
                font-size="${isActive ? '16' : '15'}" 
                text-anchor="middle" 
                fill="#ffffff" 
                font-weight="bold">
            ${number + 1}
          </text>
        </svg>
      `,
      className: 'custom-marker-icon',
      iconSize: [isActive ? 32 : 28, isActive ? 32 : 28],
      iconAnchor: [isActive ? 16 : 14, isActive ? 32 : 28]
    });
  };

  useEffect(() => {    
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      const map = L.map(mapRef.current).setView([56.31226, 22.3230616], 14);
      
      const baseMapLayer = L.tileLayer(
        `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/jpeg?apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
        {
          maxZoom: 20,
          attribution: '&copy; 2024 HERE Technologies',
        }
      );

      baseMapLayer.addTo(map);
      markersGroup.current = L.layerGroup().addTo(map);
      polylineGroup.current = L.layerGroup().addTo(map);
      mapInstance.current = map;
    }

    if (markersGroup.current) {
      markersGroup.current.clearLayers();
      
      vehicleList.forEach((location, index) => {
        const isMoving = location.state === 'moving';
        const isActiveFrom = location.lat === focusLocation?.fromLat && 
                           location.lon === focusLocation?.fromLon;
        
        const isActiveAddress = focusLocation.activeColumn === 'address' && 
                              focusLocation.activeRow === String(index);
        
        const isActiveTo = focusLocation.activeRow === String(index) && 
                         focusLocation.activeColumn === 'to';

        const isActive = isActiveFrom || isActiveTo || isActiveAddress;

        const icon = createNumberedIcon(index, isMoving, isActive);
        const marker = L.marker([location.lat, location.lon], { 
          icon,
          zIndexOffset: isActive ? 1000 : 0
        });
        marker.on('click', () => {
          onMarkerClick?.(location);
        });
        marker.addTo(markersGroup.current);
      });

      if (vehicleList.length > 0) {
        const bounds = L.latLngBounds(vehicleList.map(loc => [loc.lat, loc.lon]));
        mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
      }

      if (focusLocation.fromLat && focusLocation.fromLon) {
        const activePoint = L.latLng(focusLocation.fromLat, focusLocation.fromLon);
        if (focusLocation.fromClick) {
          mapInstance.current.setView(activePoint, focusZoom);
        }
      }
    }
  }, [vehicleList, focusLocation, onMarkerClick]);

  useEffect(() => {
    if (!mapInstance.current || !polylineGroup.current) return;

    polylineGroup.current.clearLayers();

    let fromCoords = null;
    let toCoords = null;
    
    vehicleList.forEach((location, index) => {
      const isActiveFrom = location.lat === focusLocation?.fromLat && 
                         location.lon === focusLocation?.fromLon;
      const isActiveTo = focusLocation.activeRow === String(index) && 
                       focusLocation.activeColumn === 'to';
      
      if (isActiveFrom) {
        fromCoords = [location.lat, location.lon];
      }
      if (isActiveTo) {
        toCoords = [location.lat, location.lon];
      }
    });

    if (fromCoords && toCoords) {
      const polyline = L.polyline([fromCoords, toCoords], { 
        color: '#3B82F6', 
        weight: 3 
      });
      polyline.addTo(polylineGroup.current);
      
      if (focusLocation.fromClick) {
        mapInstance.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      }
    }
  }, [focusLocation, vehicleList]);

  return (
    <div
      ref={mapRef}
      className='rounded-lg w-full'
      style={{ height: '300px', zIndex: 0 }}
    />
  );
};

export default HereMap; 