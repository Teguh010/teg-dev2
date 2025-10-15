'use client';

import { useEffect, useRef, useState } from 'react';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';
import stopBlue from '@/public/images/home/stop-blue.png';
import playGreen from '@/public/images/home/play-green.png';
import playGreenFill from '@/public/images/home/play-green-fill.png';
import carbonPlay from '@/public/images/home/carbon-play.png';
import carbonPlayFilled from '@/public/images/home/carbon-play-filled.png';
import parkPlay from '@/public/images/home/parkPlay.png';
import faGreen from '@/public/images/home/fa-green.png';
import arrowGreen from '@/public/images/home/arrow-green.png';
import stopBlueBold from '@/public/images/home/stop-blue-bold.png';




import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store'; // Import RootState untuk tipe state

import { setActiveVehicle, setVehicle, setTachoData } from '@/redux/features/main-map/maps-slice';
import { setHistoryVehicle, setAllowZooming } from '@/redux/features/history-map/history-slice';
import { fetchHereAddress } from '@/lib/utils';
import { AppDispatch } from '@/redux/store';
import { tachoLiveDrivingStateStats } from '@/models/tachograph';
import { useUser } from '@/context/UserContext';

interface HereMapProps {
  lat?: number
  lon?: number
  zoom?: number
  width?: string
  height?: string
  vehicleList?: any[]
  isSidebarOpen?: boolean
}

const HereMap: React.FC<HereMapProps> = ({
  lat = null,
  lon = null,
  zoom = 14,
  width = '100%',
  vehicleList = [],
  isSidebarOpen
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersGroup = useRef<L.LayerGroup | null>(null);

  const [selected, setSelected] = useState<any>(null);

  const isInitialLoadRef = useRef(true);
  const prevVehicleListRef = useRef(vehicleList);
  const [manualZoom, setManualZoom] = useState(false);

  const setByMapClick = useRef(false);

  const { historyVehicle, allowZooming } = useSelector((state: RootState) => state.history);

  const dispatch = useDispatch<AppDispatch>();
  const UserContext = useUser();
  const { getUserRef } = UserContext.operations;

  const customIcon = L.icon({
    iconUrl: markerIconPng.src,
    shadowUrl: markerShadowPng.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const defaultIcon = L.icon({
    iconUrl: markerIconPng.src,
    shadowUrl: markerShadowPng.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const stopIcon = L.icon({
    iconUrl: stopBlue.src,
    iconSize: [24, 24], // Ukuran sesuai ikon PNG
    iconAnchor: [10, 12], // Sesuaikan posisi anchor
    popupAnchor: [1, -34], // Posisi popup
  });

  const createRotatedPlayIcon = (angle: number, name: string, isGpsDelayed: boolean = false) => {
    return L.divIcon({
      html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="transform: rotate(${angle}deg); width: 23px; height: 23px;">
          <img src="${arrowGreen.src}" style="width: 100%; height: 100%;" />
        </div>
          <div style="
            color: ${isGpsDelayed ? '#ea4335' : '#000'};
            font-weight: bold;
            margin-top: 2px;
            padding: 2px 4px;
            white-space: nowrap;
            text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white, 0 0 3px white;
          ">
            ${name}
          </div>
      </div>
    `,
      className: '', // Ensure no default styles are applied
      iconSize: [22, 22],
      iconAnchor: [14, 14], // Center the icon at the marker point
    });
  };

  const arrowIcon = (angle: number) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 24 24" style="transform: rotate(${angle}deg);">
  <path fill="#fff" stroke="#000" d="m3.165 19.503l7.362-16.51c.59-1.324 2.355-1.324 2.946 0l7.362 16.51c.667 1.495-.814 3.047-2.202 2.306l-5.904-3.152c-.459-.245-1-.245-1.458 0l-5.904 3.152c-1.388.74-2.87-.81-2.202-2.306"/>
</svg>`;

  const dotIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24"><path fill="#0000FF" d="M17 3.34a10 10 0 1 1-14.995 8.984L2 12l.005-.324A10 10 0 0 1 17 3.34M12 10a2 2 0 0 0-1.977 1.697l-.018.154L10 12l.005.15A2 2 0 1 0 12 10"/></svg>`;

  const createCustomIcon = (locationName: string, iconHTML: string, isGpsDelayed: boolean = false) => {
    return L.divIcon({
      html: `
      <div style="text-align: center;">
        ${iconHTML}
        <div style="
          display: flex;
          justify-content: center;">
          <div style="
            color: ${isGpsDelayed ? '#ea4335' : '#000'};
            font-weight: bold;
            margin-top: 2px;
            padding: 2px 4px;
            white-space: nowrap;
            text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white, 0 0 3px white;
          ">
            ${locationName}
          </div>
        </div>
      </div>`,
      className: 'custom-marker-icon',
      iconSize: [24, 24],
      iconAnchor: [10, 12],
      popupAnchor: [1, -34],
    });
  };

useEffect(() => {
  if (mapInstance.current) {
    mapInstance.current.invalidateSize();
  }
}, [isSidebarOpen]);


  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) {
      return;
    }

    if (!mapInstance.current) {
      const initialLat = lat ?? 56.31226;
      const initialLon = lon ?? 22.3230616;

      const map = L.map(mapRef.current).setView([initialLat, initialLon], zoom);

      // Define multiple basemaps
      const baseMapLayer = L.tileLayer(
        `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/jpeg?apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
        {
          maxZoom: 20,
          attribution: '&copy; 2024 HERE Technologies',
        }
      );

      // Satellite layer (v3 API)
      const satelliteLayer = L.tileLayer(
        `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/jpeg?style=satellite.day&apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
        {
          maxZoom: 20,
          attribution: '&copy; 2024 HERE Technologies',
        }
      );

      // Truck layer (v3 API, with vehicle restrictions)
      const truckLayer = L.tileLayer(
        `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png8?features=vehicle_restrictions:active_and_inactive&style=explore.day&apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
        {
          maxZoom: 20,
          attribution: '&copy; 2024 HERE Technologies',
        }
      );

      // Add baseMapLayer by default
      baseMapLayer.addTo(map);

      // Layer control to switch between baseMap, satellite, and truck
      L.control
        .layers({
          'Standard Map': baseMapLayer,
          'Satellite Map': satelliteLayer,
          'Truck Map': truckLayer,
        })
        .addTo(map);

      markersGroup.current = L.layerGroup().addTo(map);
      mapInstance.current = map;
    }
  }, []);

  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.on('zoomend', () => {
        setManualZoom(true);
      });
    }
  }, []);

  useEffect(() => {
    if (mapInstance.current && markersGroup.current) {
      markersGroup.current.clearLayers();

      const markers: [number, number][] = vehicleList
        .filter((location) => location.lat != null && location.lon != null)
        .map((location) => {
          let marker: L.Marker;

          // Check if GPS data is delayed (more than 1 day)
          const isGpsDelayed = (() => {
            if (!location.gpstime) return false;
            
            const gpsTime = new Date(location.gpstime);
            const now = new Date();
            const diffInHours = (now.getTime() - gpsTime.getTime()) / (1000 * 60 * 60);
            
            return diffInHours > 24; // More than 1 day (24 hours)
          })();

          // Gunakan createCustomIcon untuk menambahkan nama dari location.name
          if (location.trip_state !== 'moving') {
            marker = L.marker([location.lat, location.lon], {
              icon: createCustomIcon(
                location.name,
                `<img src="${stopBlue.src}" style="width: 24px; height: 24px;" />`,
                isGpsDelayed
              ),
            });
          } else {
            marker = L.marker([location.lat, location.lon], {
              icon: createRotatedPlayIcon(location.vectorangle, location.name, isGpsDelayed),
            });
          }

          marker.on('click', async () => {
            const here_address = await fetchHereAddress(location.lat, location.lon);
            const userToken = getUserRef().token;

            // Fetch tachograph data when marker is clicked
            try {
              const tachoResponse = await tachoLiveDrivingStateStats(userToken, location.objectid);
              if (tachoResponse) {
                dispatch(setTachoData([{
                  id: location.objectid,
                  name: location.object_name,
                  stats: [tachoResponse]
                }]));
              } else {
                dispatch(setTachoData([]));
              }
            } catch (error) {
              console.error('Error fetching tachograph data:', error);
              dispatch(setTachoData([]));
            }

            // Dispatching Redux actions when marker is clicked
            dispatch(
              setVehicle({
                ...location,
                here_address,
              })
            );
            dispatch(setActiveVehicle(location.id));
            dispatch(setHistoryVehicle(location));
            setManualZoom(true);
            dispatch(setAllowZooming(false));
          });

          marker.addTo(markersGroup.current!);
          return [location.lat, location.lon] as [number, number];
        });

      if (markers.length > 0) {
        if (isInitialLoadRef.current) {
          const newBounds = L.latLngBounds(markers);
          mapInstance.current.fitBounds(newBounds, { padding: [50, 50] });
          isInitialLoadRef.current = false;
        } else if (vehicleList.length !== prevVehicleListRef.current.length) {
          const newBounds = L.latLngBounds(markers);
          mapInstance.current.fitBounds(newBounds, { padding: [50, 50] });
        }
      }

      prevVehicleListRef.current = vehicleList;
    }
  }, [vehicleList]);

  useEffect(() => {
    if (mapInstance.current && lat != null && lon != null && !setByMapClick.current) {
      if (!manualZoom) {
        mapInstance.current.setView([lat, lon], zoom);
      }
    }

    setByMapClick.current = false;
  }, [lat, lon, zoom]);

  useEffect(() => {
    if (!setByMapClick.current) {
      setManualZoom(false);
    }
  }, [lat, lon, zoom]);

useEffect(() => {
  if (allowZooming && mapInstance.current && historyVehicle && historyVehicle.lat && historyVehicle.lon) {
    const { lat, lon } = historyVehicle;
    mapInstance.current.setView([lat, lon], zoom);
    setManualZoom(true);
  }
}, [allowZooming, historyVehicle]);

  return (
    <div
      ref={mapRef}
      style={{ width, height: 'calc(100vh - 52px)', top: '0px', right: '0px', zIndex: '0' }}
    />
  );
};

export default HereMap;
