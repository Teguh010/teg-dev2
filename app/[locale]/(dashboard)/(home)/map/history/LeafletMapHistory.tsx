import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { antPath } from 'leaflet-ant-path';
import { handleSelectHistoryDataStore } from '@/redux/features/history-map/history-thunks'; // Impor thunk
import { RootState } from '@/redux/store'; // Import RootState untuk tipe state
import { AppDispatch } from '@/redux/store';

interface HereMapProps {
  lat: number
  lon: number
  zoom: number
  width?: string
  height?: string
  data: unknown
  stopsData: unknown[]
  selectedVehicles: unknown[]
  trajectoryData: unknown[]
  isSidebarOpen?: boolean
}

const LeafletMapHistory = forwardRef<unknown, HereMapProps>(
  (
    {
      lat,
      lon,
      zoom,
      width = '100%',
      data,
      stopsData,
      selectedVehicles,
      trajectoryData,
      isSidebarOpen
    },
    ref
  ) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const historyMarkersGroup = useRef<L.LayerGroup | null>(null);
    const pointMarkersGroup = useRef<L.LayerGroup | null>(null);
    const polylineGroup = useRef<L.LayerGroup | null>(null);

    const { allowZoom, stopIndex, selectedHistoryData, chartData } = useSelector(
      (state: RootState) => state.history
    );
  
    const dispatch = useDispatch<AppDispatch>();

    const dotIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 16 16"><path fill="#0000FF" d="M8 4C5.8 4 4 5.8 4 8s1.8 4 4 4s4-1.8 4-4s-1.8-4-4-4"/><path fill="#0000FF" d="M8 1c3.9 0 7 3.1 7 7s-3.1 7-7 7s-7-3.1-7-7s3.1-7 7-7m0-1C3.6 0 0 3.6 0 8s3.6 8 8 8s8-3.6 8-8s-3.6-8-8-8"/></svg>`;

    const createWaypointIcon = (label: string, color: string) => {
      return L.divIcon({
        html: `
          <svg xmlns="http://www.w3.org/2000/svg" width="${
            label === 'Stop' || label === 'Start' ? '32' : '31'
          }" height="${label === 'Stop' || label === 'Start' ? '32' : '28'}" viewBox="0 0 48 48">
            <path d="M24 0C12.955 0 4 9.075 4 20.075C4 28.35 24 48 24 48S44 28.35 44 20.075C44 9.075 35.045 0 24 0Z" fill="${color}" />
            <text x="24" y="24" font-size="${
              label === 'Stop' || label === 'Start' ? '15' : '20'
            }" text-anchor="middle" fill="#ffffff">${label}</text>
          </svg>`,
        className: 'custom-marker-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });
    };

    useImperativeHandle(ref, () => ({
      showTrackingPath,
      setMapPosition
    }));

    useEffect(() => {
      if (selectedHistoryData && allowZoom) {
        updateMarkers(selectedHistoryData, stopIndex);
      }
    }, [selectedHistoryData, stopIndex]);

    useEffect(() => {
      if (chartData) {
        updateMarkers(chartData, true);
      }
    }, [chartData]);

    useEffect(() => {
      if (!mapRef.current) return;

      if (!mapInstance.current) {
        const map = L.map(mapRef.current).setView([lat, lon], zoom);

        // Define the base map layer
        const baseMapLayer = L.tileLayer(
          `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/jpeg?apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
          {
            maxZoom: 20,
            attribution: '&copy; 2024 HERE Technologies'
          }
        );
        const satelliteLayer = L.tileLayer(
          `https://{s}.aerial.maps.ls.hereapi.com/maptile/2.1/maptile/newest/satellite.day/{z}/{x}/{y}/256/png8?apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
          {
            subdomains: ['1', '2', '3', '4'],
            maxZoom: 20,
            detectRetina: true,
            attribution: '&copy; 2024 HERE Technologies'
          }
        );

        // Truck layer
        const truckLayer = L.tileLayer(
          `https://{s}.base.maps.ls.hereapi.com/maptile/2.1/trucktile/newest/normal.day/{z}/{x}/{y}/256/png8?apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
          {
            subdomains: ['1', '2', '3', '4'],
            maxZoom: 20,
            detectRetina: true,
            attribution: '&copy; 2024 HERE Technologies'
          }
        );

        // Add baseMapLayer by default
        baseMapLayer.addTo(map);

        // Layer control to switch between baseMap, satellite, and truck
        L.control
          .layers({
            'Standard Map': baseMapLayer,
            'Satellite Map': satelliteLayer,
            'Truck Map': truckLayer
          })
          .addTo(map);

        historyMarkersGroup.current = L.layerGroup().addTo(map);
        pointMarkersGroup.current = L.layerGroup().addTo(map);
        polylineGroup.current = L.layerGroup().addTo(map);
        mapInstance.current = map;
      }
    }, [lat, lon, zoom]);

    const setMapPosition = () => {
      if (
        mapInstance.current &&
        data &&
        typeof (data as { lat?: number; lon?: number }).lat === 'number' &&
        typeof (data as { lat?: number; lon?: number }).lon === 'number' &&
        !isNaN((data as { lat: number }).lat) &&
        !isNaN((data as { lon: number }).lon)
      ) {
        const d = data as { lat: number; lon: number };
        mapInstance.current.setView([d.lat, d.lon], zoom);

        const defaultMarker = L.marker([d.lat, d.lon], {
          icon: L.divIcon({
            html: dotIconSVG,
            className: 'default-marker-icon'
          })
        });
        defaultMarker.addTo(historyMarkersGroup.current);
      }
    };

    useEffect(() => {
      setMapPosition();
    }, [data]);

    const updateMarkers = (selectedData: unknown, marker?: boolean) => {
      if (mapInstance.current) {
        pointMarkersGroup.current.clearLayers();

        if (
          selectedData &&
          typeof (selectedData as { lat?: number; lon?: number }).lat === 'number' &&
          typeof (selectedData as { lat?: number; lon?: number }).lon === 'number'
        ) {
          const d = selectedData as { lat: number; lon: number };
          const newCoords = [d.lat, d.lon] as [number, number];
          if (mapInstance.current) {
            mapInstance.current.setView(newCoords, zoom);

            if (marker) {
              const dotMarker = L.marker(newCoords, {
                icon: L.divIcon({ html: dotIconSVG, className: '' })
              });
              dotMarker.addTo(pointMarkersGroup.current);
            }
          }
        }
      }
    };

    useEffect(() => {
      if (selectedVehicles.length > 0) {
        updateMarkers(selectedVehicles[0], null);
      }
    }, [selectedVehicles]);

    const showTrackingPath = () => {
      if (!mapInstance.current || !Array.isArray(trajectoryData) || trajectoryData.length === 0 || !polylineGroup.current) return;

      // Clear previous polylines and markers
      polylineGroup.current.clearLayers();
      historyMarkersGroup.current?.clearLayers();

      // Sort data berdasarkan waktu
      const sortedTrajectory = [...trajectoryData].sort((a, b) => 
        new Date((a as { time: string }).time).getTime() - new Date((b as { time: string }).time).getTime()
      );

      // Gunakan data yang sudah diurutkan untuk membuat latlngs
      const latlngs = sortedTrajectory.map((point) => [(point as { lat: number }).lat, (point as { lon: number }).lon] as [number, number]);

      // Create AntPath dengan data yang sudah diurutkan
      const antPolyline = new antPath(latlngs, {
        color: 'rgba(0, 128, 255, 0.7)',
        weight: 6,
        pulseColor: '#FFFFFF',
        delay: 950,
        dashArray: [30, 60],
        reverse: false,
        paused: false
      });

      // Add the path to the group and map
      antPolyline.addTo(polylineGroup.current);

      // Initialize stop counter and marker index
      let markerIndex = 0;
      const waypointMarkers: L.Marker[] = [];

      // Add start marker as the first stop
      let startCoords = (Array.isArray(stopsData) && stopsData.length > 0) ? (stopsData[0] as { lat: number; lon: number }) : undefined;
      const firstStop = Array.isArray(stopsData)
        ? (stopsData.find(
            (point) =>
              (point as { state?: string; lat?: number; lon?: number }).state !== 'moving' &&
              (point as { lat?: number }).lat === startCoords?.lat &&
              (point as { lon?: number }).lon === startCoords?.lon
          ) as { lat: number; lon: number } | undefined)
        : undefined;
      if (firstStop) {
        startCoords = firstStop;
      }
      if (startCoords) {
        const startIcon = L.marker([startCoords.lat, startCoords.lon], {
          icon: createWaypointIcon('Start', '#32CD32')
        });
        waypointMarkers.push(startIcon);

        startIcon.on('click', async () => {
          const stopIndex = 0;
          const data = startCoords;
          const label = 'Start';
          // Dispatching Redux actions when marker is clicked tanpa zoom
          await dispatch(handleSelectHistoryDataStore({ data, label, stopIndex, allowZoom: false }));
        });
        markerIndex++; // Increment marker index
      }

      // Add stop marker at the last trajectory point
      if (sortedTrajectory.length > 0) {
        const stop = sortedTrajectory[sortedTrajectory.length - 1] as { lat: number; lon: number };
        const stopIcon = L.marker([stop.lat, stop.lon], {
          icon: createWaypointIcon('Stop', '#FF0000')
        });
        waypointMarkers.push(stopIcon);
      }

      // Create waypoint markers for stopsData
      let stopCounter = 0;
      const lastTrajectory = sortedTrajectory[sortedTrajectory.length - 1] as { lat: number; lon: number };
      if (Array.isArray(stopsData)) {
        stopsData.forEach((point) => {
          const p = point as { state?: string; lat?: number; lon?: number };
          if (
            p.state !== 'moving' &&
            p !== firstStop &&
            !(
              Number(p.lat).toFixed(6) === Number(lastTrajectory.lat).toFixed(6) &&
              Number(p.lon).toFixed(6) === Number(lastTrajectory.lon).toFixed(6)
            )
          ) {
            stopCounter++;

            const label = stopCounter.toString();
            const icon = createWaypointIcon(label, '#1E90FF');

            if (p.lat && p.lon) {
              const marker = L.marker([p.lat, p.lon], { icon });
              waypointMarkers.push(marker);

              const currentMarkerIndex = markerIndex - 1;

              marker.on('click', async () => {
                const stopIndex = currentMarkerIndex;
                const data = p;
                const label = 'Stop';
                await dispatch(
                  handleSelectHistoryDataStore({ data, label, stopIndex, allowZoom: false })
                );
              });
              markerIndex++; // Increment marker index
            }
          }
        });
      }

      // Add all markers to the historyMarkersGroup
      waypointMarkers.forEach((marker) => marker.addTo(historyMarkersGroup.current!));

      // Fit map bounds to polyline
      mapInstance.current.fitBounds(antPolyline.getBounds());
    };

    useEffect(() => {
      if (trajectoryData.length > 0 && stopsData.length > 0) {
        showTrackingPath();
      }
    }, [trajectoryData, stopsData, pointMarkersGroup, historyMarkersGroup]);

    useEffect(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    }, [isSidebarOpen]);

    return (
      <div
        ref={mapRef}
        style={{ width, height: 'calc(100vh - 52px)', top: '0px', right: '0px', zIndex: '0' }}
      />
    );
  }
);

export default LeafletMapHistory;
