'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { antPath } from 'leaflet-ant-path';

const HereMap = ({ 
  vehicleList = [],
  focusLocation,
  onMarkerClick,
  selectedLocation,
  isZoomEnabled = true,
  onResetZoom,
  focusZoom = 15,
  userToken,
  selectedVehicle,
  startDate,
  endDate,
  showTrajectory = false,
  trajectoryData = [],
  onFetchTrajectory
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersGroup = useRef<L.LayerGroup | null>(null);
  const polylineGroup = useRef<L.LayerGroup | null>(null);
  const trajectoryGroup = useRef<L.LayerGroup | null>(null);
  const initialBounds = useRef<L.LatLngBounds | null>(null);
  const resetZoomRef = useRef<(() => void) | null>(null);
  
  // Effect to fetch trajectory data when showTrajectory is true and required props are available
  useEffect(() => {
    if (showTrajectory && userToken && selectedVehicle && startDate && endDate && onFetchTrajectory) {
      onFetchTrajectory();
    }
  }, [showTrajectory, userToken, selectedVehicle, startDate, endDate, onFetchTrajectory]);

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

  const createStopIcon = (stopNumber, position, isActive) => {
    const borderStyle = isActive ? 'stroke="#FF0000" stroke-width="3"' : '';
    
    // Determine color based on position
    let color;
    if (position === 'first') {
      color = '#10B981'; // Green for first
    } else if (position === 'last') {
      color = '#EF4444'; // Red for last
    } else {
      color = '#3B82F6'; // Blue for middle
    }
    
    return L.divIcon({
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48">
          <path d="M24 0C12.955 0 4 9.075 4 20.075C4 28.35 24 48 24 48S44 28.35 44 20.075C44 9.075 35.045 0 24 0Z" 
                fill="${color}" 
                ${borderStyle} />
          <text x="24" y="24" 
                font-size="${isActive ? '16' : '15'}" 
                text-anchor="middle" 
                fill="#ffffff" 
                font-weight="bold">
            ${stopNumber}
          </text>
        </svg>
      `,
      className: 'custom-marker-icon',
      iconSize: [isActive ? 36 : 28, isActive ? 36 : 28],
      iconAnchor: [isActive ? 18 : 14, isActive ? 36 : 28]
    });
  };

  // Initial map setup
  useEffect(() => {    
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      const map = L.map(mapRef.current).setView([56.31226, 22.3230616], 14);
      
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
      trajectoryGroup.current = L.layerGroup().addTo(map);
      mapInstance.current = map;
    }
  }, []);

  // Initial bounds setup (only once when vehicleList first loads)
  useEffect(() => {
    if (mapInstance.current && vehicleList.length > 0 && !initialBounds.current) {
      // Extract lat/lon from lat_lon field or fallback to lat/lon fields
      const coordinates = vehicleList.map(loc => {
        if (loc.lat_lon) {
          // Parse lat_lon format: "lat, lon"
          const [lat, lon] = loc.lat_lon.split(',').map(coord => parseFloat(coord.trim()));
          return [lat, lon];
        } else if (loc.lat !== undefined && loc.lon !== undefined) {
          // Fallback to separate lat/lon fields
          return [loc.lat, loc.lon];
        }
        return null;
      }).filter(coord => coord !== null);
      
      if (coordinates.length > 0) {
        const bounds = L.latLngBounds(coordinates as [number, number][]);
        initialBounds.current = bounds; // Save initial bounds for reset
        mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [vehicleList]);

  // Marker rendering and updates
  useEffect(() => {
    if (!markersGroup.current) return;

    markersGroup.current.clearLayers();
    
    // Filter only stops (non-moving) and calculate stop numbers
    const stopsOnly = vehicleList.filter(location => location.state !== 'moving');
    const totalStops = stopsOnly.length;
    
    stopsOnly.forEach((location, stopIndex) => {
      // Extract lat/lon from lat_lon field or fallback to lat/lon fields
      let lat, lon;
      if (location.lat_lon) {
        // Parse lat_lon format: "lat, lon"
        const coords = location.lat_lon.split(',').map(coord => parseFloat(coord.trim()));
        lat = coords[0];
        lon = coords[1];
      } else if (location.lat !== undefined && location.lon !== undefined) {
        // Fallback to separate lat/lon fields
        lat = location.lat;
        lon = location.lon;
      } else {
        // Skip if no valid coordinates
        return;
      }

      // Find original index in vehicleList for focus location logic
      const originalIndex = vehicleList.findIndex(loc => loc === location);
      
      const isActiveFrom = lat === focusLocation?.fromLat && 
                         lon === focusLocation?.fromLon;
      
      const isActiveAddress = focusLocation.activeColumn === 'address' && 
                            focusLocation.activeRow === String(originalIndex);
      
      const isActiveTo = focusLocation.activeRow === String(originalIndex) && 
                       focusLocation.activeColumn === 'to';

      const isActive = isActiveFrom || isActiveTo || isActiveAddress;

      // Determine position for color
      let position;
      if (stopIndex === 0) {
        position = 'first'; // First stop
      } else if (stopIndex === totalStops - 1) {
        position = 'last'; // Last stop
      } else {
        position = 'middle'; // Middle stops
      }

      const stopNumber = stopIndex + 1; // Stop numbers start from 1
      const icon = createStopIcon(stopNumber, position, isActive);
      const marker = L.marker([lat, lon], { 
        icon,
        zIndexOffset: isActive ? 1000 : 0
      });

      // Add popup untuk selectedLocation
      if (selectedLocation && selectedLocation.lat === lat && selectedLocation.lon === lon) {
        const popupContent = `
          <div style="line-height:1.3; font-size:13px;">
            <span><strong>State:</strong> ${location.state || 'N/A'}</span><br/>
            <span><strong>From:</strong> ${location.from || 'N/A'}</span><br/>
            <span><strong>To:</strong> ${location.to || 'N/A'}</span><br/>
            <span><strong>Address:</strong> ${location.address || 'N/A'}</span><br/>
            <span><strong>Time From:</strong> ${location.time_from || 'N/A'}</span><br/>
            <span><strong>Time To:</strong> ${location.time_to || 'N/A'}</span><br/>
            <span><strong>Duration:</strong> ${location.duration || 'N/A'}</span><br/>
            <span><strong>Lat, Lon:</strong> 
              <a href="https://www.google.com/maps?q=${location.lat},${location.lon}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8; text-decoration:underline;">
                ${location.lat}, ${location.lon}
              </a>
            </span>
          </div>
        `;
        marker.bindPopup(popupContent);
        marker.openPopup();
      }

      marker.on('click', () => {
        onMarkerClick?.(location);
      });
      marker.addTo(markersGroup.current);
    });

    if (focusLocation.fromLat && focusLocation.fromLon && focusLocation.fromClick) {
      const activePoint = L.latLng(focusLocation.fromLat, focusLocation.fromLon);
      mapInstance.current.setView(activePoint, focusZoom);
    }
  }, [vehicleList, focusLocation, onMarkerClick, selectedLocation]);

  // Effect untuk menangani selectedLocation dari table click
  useEffect(() => {
    if (!mapInstance.current || !selectedLocation) return;

    // Hanya center map jika selectedLocation berubah dari table click (bukan dari marker click)
    // Dan hanya jika zoom enabled
    if (selectedLocation.lat && selectedLocation.lon && focusLocation?.fromClick && isZoomEnabled) {
      mapInstance.current.setView([selectedLocation.lat, selectedLocation.lon], focusZoom);
    }
  }, [selectedLocation, focusZoom, focusLocation?.fromClick, isZoomEnabled]);

  // Focus location polyline effect (keep only the focus line, not the route polyline)
  useEffect(() => {
    if (!mapInstance.current || !polylineGroup.current) return;

    polylineGroup.current.clearLayers();

    // Keep only the focus location polyline logic for highlighting selected points
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
      const focusPolyline = L.polyline([fromCoords, toCoords], { 
        color: '#FF0000', 
        weight: 4,
        opacity: 1
      });
      focusPolyline.addTo(polylineGroup.current);
      
      if (focusLocation.fromClick && isZoomEnabled) {
        mapInstance.current.fitBounds(focusPolyline.getBounds(), { padding: [50, 50] });
      }
    }
  }, [focusLocation, vehicleList]);

  // Effect to render trajectory polyline
  useEffect(() => {
    if (!mapInstance.current || !trajectoryGroup.current) return;

    // Clear previous trajectory
    trajectoryGroup.current.clearLayers();

    // Only render trajectory if showTrajectory is true and we have data
    if (showTrajectory && Array.isArray(trajectoryData) && trajectoryData.length > 0) {
      // Sort data by time
      const sortedTrajectory = [...trajectoryData].sort((a, b) => 
        new Date(a.time).getTime() - new Date(b.time).getTime()
      );

      // Create coordinates array for polyline
      const latlngs = sortedTrajectory.map((point) => [point.lat, point.lon] as [number, number]);

      // Create AntPath with sorted data
      const antPolyline = new antPath(latlngs, {
        color: 'rgba(0, 128, 255, 0.7)',
        weight: 6,
        pulseColor: '#FFFFFF',
        delay: 950,
        dashArray: [30, 60],
        reverse: false,
        paused: false
      });

      // Add the path to the group
      antPolyline.addTo(trajectoryGroup.current);

      // Add start and end markers
      if (sortedTrajectory.length > 0) {
        const startPoint = sortedTrajectory[0];
        const endPoint = sortedTrajectory[sortedTrajectory.length - 1];

        // Start marker
        const startIcon = L.divIcon({
          html: `
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48">
              <path d="M24 0C12.955 0 4 9.075 4 20.075C4 28.35 24 48 24 48S44 28.35 44 20.075C44 9.075 35.045 0 24 0Z" fill="#32CD32" />
              <text x="24" y="24" font-size="15" text-anchor="middle" fill="#ffffff">S</text>
            </svg>
          `,
          className: 'custom-marker-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 28]
        });

        const startMarker = L.marker([startPoint.lat, startPoint.lon], { icon: startIcon });
        startMarker.addTo(trajectoryGroup.current);

        // End marker
        const endIcon = L.divIcon({
          html: `
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48">
              <path d="M24 0C12.955 0 4 9.075 4 20.075C4 28.35 24 48 24 48S44 28.35 44 20.075C44 9.075 35.045 0 24 0Z" fill="#FF0000" />
              <text x="24" y="24" font-size="15" text-anchor="middle" fill="#ffffff">E</text>
            </svg>
          `,
          className: 'custom-marker-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 28]
        });

        const endMarker = L.marker([endPoint.lat, endPoint.lon], { icon: endIcon });
        endMarker.addTo(trajectoryGroup.current);

        // Fit map bounds to trajectory
        mapInstance.current.fitBounds(antPolyline.getBounds(), { padding: [50, 50] });
      }
    }
  }, [showTrajectory, trajectoryData]);

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
      // Call onResetZoom with the reset function
      onResetZoom(resetZoomRef.current);
    }
  }, [onResetZoom, resetZoomRef.current]);

  return (
    <div
      ref={mapRef}
      className='rounded-lg w-full'
      style={{ height: '300px', zIndex: 0 }}
    />
  );
};

export default HereMap;