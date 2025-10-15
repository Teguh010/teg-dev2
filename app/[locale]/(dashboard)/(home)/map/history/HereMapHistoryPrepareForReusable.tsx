import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

declare const H: any;

interface HereMapProps {
  lat: number;
  lon: number;
  zoom: number;
  width?: string;
  height?: string;
  data: any;
  stopsData: any[];
  selectedVehicles: any[];
  trajectoryData: any[];
}

const useHereMap = (mapRef, lat, lon, zoom) => {
  const [mapInstance, setMapInstance] = useState(null);
  const [ui, setUi] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const H = window.H;
      const platform = new H.service.Platform({
        apikey:  process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN,
      });
      const defaultLayers = platform.createDefaultLayers();
      const map = new H.Map(mapRef.current, defaultLayers.vector.normal.map, {
        center: { lat, lng: lon },
        zoom: zoom,
        pixelRatio: window.devicePixelRatio || 1,
      });
      setMapInstance(map);

      new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
      const ui = H.ui.UI.createDefault(map, defaultLayers);
      setUi(ui);

      return () => {
        map.dispose();
      };
    }
  }, [mapRef, lat, lon, zoom]);

  return { mapInstance, ui };
};

const HereMapHistory = forwardRef<any, HereMapProps>(
  (
    {
      lat,
      lon,
      zoom,
      width = '100%',
      height = '100%',
      data,
      stopsData,
      selectedVehicles,
      trajectoryData
    },
    ref
  ) => {
    const mapRef = useRef(null);
    const { mapInstance, ui } = useHereMap(mapRef,  lat, lon, zoom);
    const [markersGroup, setMarkersGroup] = useState(null);
    const [historyMarkersGroup, setHistoryMarkersGroup] = useState(null);
    const [polylineGroup, setPolylineGroup] = useState(null);

    useImperativeHandle(ref, () => ({
      showTrackingPath,
      updateMarkers,
      setMapPosition,
    }));

    useEffect(() => {
      if (mapInstance) {
        const group = new H.map.Group();
        mapInstance.addObject(group);
        setMarkersGroup(group);

        const historyGroup = new H.map.Group();
        mapInstance.addObject(historyGroup);
        setHistoryMarkersGroup(historyGroup);

        const polylineGroup = new H.map.Group();
        mapInstance.addObject(polylineGroup);
        setPolylineGroup(polylineGroup);
      }
    }, [mapInstance]);

    const setMapPosition = () => {
      if (mapInstance && data.lat) {
        const newCoords = { lat: data.lat, lng: data.lon };
        mapInstance.setCenter(newCoords);

        const newMarker = new H.map.Marker(newCoords);
        markersGroup.addObject(newMarker);
      }
    };

    useEffect(() => {
      setMapPosition();
    }, [data]);

    const updateMarkers = (selectedData) => {
      if (mapInstance) {
        // Remove existing history markers
        historyMarkersGroup.removeAll();

        // Add new history marker
        const newCoords = { lat: selectedData.lat, lng: selectedData.lon };
        mapInstance.setCenter(newCoords);
        mapInstance.setZoom(16);
      }
    };

    useEffect(() => {
      if (selectedVehicles.length > 0) {
        updateMarkers(selectedVehicles[0]);
      }
    }, [selectedVehicles]);

    const showTrackingPath = () => {
      if (!mapInstance || trajectoryData.length === 0) return;

      // Clear previous polylines and markers
      if (polylineGroup) {
        polylineGroup.removeAll();
      }
      if (markersGroup) {
        markersGroup.removeAll();
      }

      const lineString = new H.geo.LineString();
      const waypointMarkers = [];

      // Determine the Start Marker
      let startCoords = trajectoryData[0];
      const firstStop = stopsData.find(
        (point) =>
          point.state !== 'moving' && point.lat === startCoords.lat && point.lon === startCoords.lon
      );
      if (firstStop) {
        startCoords = firstStop;
      }

      lineString.pushPoint(startCoords);

      const startIcon = new H.map.Icon(
        `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 48 48">
      <path d="M24 0C12.955 0 4 9.075 4 20.075C4 28.35 24 48 24 48S44 28.35 44 20.075C44 9.075 35.045 0 24 0Z" fill="#32CD32" />
      <text x="24" y="24" font-size="16" text-anchor="middle" fill="#ffff">Start</text>
    </svg>`
      );

      const startMarker = new H.map.Marker(
        { lat: startCoords.lat, lng: startCoords.lon },
        { icon: startIcon }
      );
      waypointMarkers.push(startMarker);

      // Iterate through trajectoryData and add points to the line string
      trajectoryData.forEach((coords) => {
        if (coords.lat && coords.lng) {
          lineString.pushPoint(coords);
        }
      });

      // Determine the Stop Marker
      let stopCoords = trajectoryData[trajectoryData.length - 1];
      const lastStop = stopsData.find(
        (point) =>
          point.state !== 'moving' && point.lat === stopCoords.lat && point.lon === stopCoords.lon
      );
      if (lastStop) {
        stopCoords = lastStop;
      }

      // Add the Stop Marker explicitly
      const stopIcon = new H.map.Icon(
        `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 48 48">
      <path d="M24 0C12.955 0 4 9.075 4 20.075C4 28.35 24 48 24 48S44 28.35 44 20.075C44 9.075 35.045 0 24 0Z" fill="#FF0000" />
      <text x="24" y="24" font-size="16" text-anchor="middle" fill="#ffff">Stop</text>
    </svg>`
      );

      const stopMarker = new H.map.Marker(
        { lat: stopCoords.lat, lng: stopCoords.lon },
        { icon: stopIcon }
      );
      waypointMarkers.push(stopMarker);

      // Handle waypoints/stops between Start and Stop
      let stopCounter = 0;
      stopsData.forEach((point) => {
        if (point.state !== 'moving' && point !== firstStop && point !== lastStop) {
          stopCounter++;

          const label = stopCounter.toString();
          const icon = new H.map.Icon(
            `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 48 48">
          <path d="M24 0C12.955 0 4 9.075 4 20.075C4 28.35 24 48 24 48S44 28.35 44 20.075C44 9.075 35.045 0 24 0Z" fill="#1E90FF" />
          <text x="24" y="24" font-size="16" text-anchor="middle" fill="#ffff">${label}</text>
        </svg>`
          );

          if (point && point.lat && point.lng) {
            const waypointMarker = new H.map.Marker(
              { lat: point.lat, lng: point.lon },
              { icon: icon }
            );
            waypointMarkers.push(waypointMarker);
          }
        }
      });

      // Draw the polyline
      if (lineString.getPointCount() > 1) {
        const newTripLine = new H.map.Polyline(lineString, {
          style: { lineWidth: 4, strokeColor: 'rgba(0, 128, 255, 0.7)' },
        });

        // Check if polylineGroup is initialized
        if (polylineGroup) {
          polylineGroup.addObject(newTripLine);
        }
        const routeBackground = new H.map.Polyline(lineString, {
          style: {
            lineWidth: 6,
            strokeColor: 'rgba(0, 128, 255, 0.7)',
            lineTailCap: 'arrow-tail',
            lineHeadCap: 'arrow-head',
          },
        });

        const routeArrows = new H.map.Polyline(lineString, {
          style: {
            lineWidth: 6,
            fillColor: 'white',
            strokeColor: 'rgba(255, 255, 255, 1)',
            lineDash: [0, 2],
            lineTailCap: 'arrow-tail',
            lineHeadCap: 'arrow-head',
          },
        });

        if (polylineGroup) {
          polylineGroup.addObjects([routeBackground, routeArrows]);
        }

        // Add all the markers to the group at once
        if (markersGroup) {
          markersGroup.addObjects(waypointMarkers);
        }

        const extendBoundingBox = (bbox, buffer) => {
          return new H.geo.Rect(
            bbox.getTop() + buffer,
            bbox.getLeft() - buffer,
            bbox.getBottom() - buffer,
            bbox.getRight() + buffer
          );
        };

        const boundingBox = extendBoundingBox(lineString.getBoundingBox(), 1.5);

        mapInstance.getViewModel().setLookAtData({
          bounds: boundingBox,
          padding: { top: 0, bottom: 500, left: 200, right: 0 },
        });
      }
    };

    useEffect(() => {
      if (trajectoryData.length > 0 && stopsData.length > 0) {
        showTrackingPath();
      }
    }, [trajectoryData, stopsData, markersGroup, historyMarkersGroup]);

    return (
      <div>
        <div
          ref={mapRef}
          style={{ width, height, position: 'fixed', top: '40px', right: '0px', zIndex: '0' }}
        />
      </div>
    );
  }
);

export default HereMapHistory;
