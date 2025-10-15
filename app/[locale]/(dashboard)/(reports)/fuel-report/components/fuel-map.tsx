import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { RootState } from '@/redux/store';

interface HereMapProps {
  lat: number
  lon: number
  zoom: number
  width?: string
  height?: string
  trajectoryData: any[]
  selectedLocation: any
}

const DATE_TIME_FORMAT = 'dd/MM/yyyy HH:mm';

const LeafletMapHistory = forwardRef<any, HereMapProps>(
  ({ lat, lon, zoom, width = '100%', trajectoryData, selectedLocation }, ref) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const historyMarkersGroup = useRef<L.LayerGroup | null>(null);
    const pointMarkersGroup = useRef<L.LayerGroup | null>(null);
    const polylineGroup = useRef<L.LayerGroup | null>(null);

    const { allowZoom, stopIndex, selectedHistoryData, chartData } = useSelector(
      (state: RootState) => state.history
    );

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

        const truckLayer = L.tileLayer(
          `https://{s}.base.maps.ls.hereapi.com/maptile/2.1/trucktile/newest/normal.day/{z}/{x}/{y}/256/png8?apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
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

    const updateMarkers = (selectedData: any, marker?: boolean) => {
      if (mapInstance.current) {
        pointMarkersGroup.current.clearLayers();

        if (selectedData?.lat && selectedData?.lon) {
          const newCoords = [selectedData.lat, selectedData.lon] as [number, number];
          if (mapInstance.current) {
            mapInstance.current.setView(newCoords, zoom);

            if (marker) {
              const dotMarker = L.marker(newCoords, {
                icon: L.divIcon({ html: dotIconSVG, className: 'default-marker-icon' })
              });
              dotMarker.addTo(pointMarkersGroup.current);
            }
          }
        }
      }
    };

    const showTrackingPath = () => {
      if (!mapInstance.current || trajectoryData.length === 0 || !polylineGroup.current) return;
      polylineGroup.current.clearLayers();
      historyMarkersGroup.current?.clearLayers();

      const sortedTrajectory = [...trajectoryData].sort((a, b) => 
        new Date(a.time).getTime() - new Date(b.time).getTime()
      );

      const latlngs = sortedTrajectory.map((point) => [point.lat, point.lon] as [number, number]);

      const polyline = L.polyline(latlngs, {
        color: 'blue',
        weight: 4, 
        opacity: 0.7
      });

      polyline.addTo(polylineGroup.current);
      mapInstance.current.fitBounds(polyline.getBounds());
    };

    useEffect(() => {
      if (trajectoryData.length > 0) {
        showTrackingPath();
      }
    }, [trajectoryData, pointMarkersGroup, historyMarkersGroup]);

    useEffect(() => {
      if (selectedLocation && mapInstance.current && pointMarkersGroup.current) {
        pointMarkersGroup.current.clearLayers();
        const newCoords = [selectedLocation.lat, selectedLocation.lon] as [number, number];
        mapInstance.current.setView(newCoords, zoom);

        const dotMarker = L.marker(newCoords, {
          icon: L.divIcon({
            html: dotIconSVG,
            className: 'default-marker-icon'
          })
        }).bindPopup(`
          <div>
            <p>Time: ${format(new Date(selectedLocation.time), DATE_TIME_FORMAT)}</p>
            <p>Fuel Level: ${selectedLocation.fuelLevel}%</p>
          </div>
        `);
        
        dotMarker.addTo(pointMarkersGroup.current);
        dotMarker.openPopup();
      }
    }, [selectedLocation]);

    return (
      <div
        ref={mapRef}
        style={{ width, height: '45vh', top: '0px', right: '0px', zIndex: '0' }}
      />
    );
  }
);

export default LeafletMapHistory;
