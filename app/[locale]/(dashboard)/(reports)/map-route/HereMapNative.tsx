import React, { useEffect, useRef } from 'react';
import { decode } from '@/lib/flexible-polyline';

// Tambahkan deklarasi global agar linter tidak error
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window {
    H: any;
  }
}

const HERE_API_KEY = process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN;

interface HereMapNativeProps {
  startLocation?: { lat: number; lon: number } | null;
  endLocation?: { lat: number; lon: number } | null;
  transportMode?: string;
  setStartLocation?: (loc: { lat: number; lon: number }) => void;
  setEndLocation?: (loc: { lat: number; lon: number }) => void;
  width?: string;
  height?: string;
  truckHeight?: number;
  truckGrossWeight?: number;
  truckWeightPerAxle?: number;
  smallTruckHeight?: number;
  smallTruckGrossWeight?: number;
  smallTruckWeightPerAxle?: number;
  length?: number;
  routeData?: {
    polyline: string;
    summary: any;
    actions: any[];
    tolls: any;
    travelSummary: any;
    notices: any;
  };
}

const HereMapNative: React.FC<HereMapNativeProps> = ({
  startLocation,
  endLocation,
  transportMode = 'car',
  setStartLocation,
  setEndLocation,
  width = '100%',
  height = '100%',
  truckHeight,
  truckGrossWeight,
  truckWeightPerAxle,
  smallTruckHeight,
  smallTruckGrossWeight,
  smallTruckWeightPerAxle,
  length,
  routeData,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const platformRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uiRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeLineRef = useRef<any>(null);
  // Simpan ref array untuk restriction polylines
  const restrictionLinesRef = useRef<any[]>([]);
  // Simpan ref array untuk restriction markers
  const restrictionMarkersRef = useRef<any[]>([]);
  const behaviorRef = useRef<any>(null);

  // Load HERE Maps JS API jika belum ada
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.H && window.H.Map) return;
    const script = document.createElement('script');
    script.src = 'https://js.api.here.com/v3/3.1/mapsjs.bundle.js';
    script.async = true;
    script.onload = () => {
      // do nothing, will re-render
    };
    document.body.appendChild(script);
  }, []);

  // Inisialisasi peta HERE
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    if (!window.H || !window.H.Map) return;

    platformRef.current = new window.H.service.Platform({ apikey: HERE_API_KEY });
    const engineType = window.H.Map.EngineType["HARP"];
    const defaultLayers = platformRef.current.createDefaultLayers({ engineType });

    const map = new window.H.Map(
      mapRef.current,
      defaultLayers.vector.normal.logistics,
      {
        engineType,
        center: { lat: 55.93308, lng: 23.31731 },
        zoom: 8,
        pixelRatio: window.devicePixelRatio || 1,
      }
    );

    window.addEventListener('resize', () => map.getViewPort().resize());
    mapInstance.current = map;
    uiRef.current = window.H.ui.UI.createDefault(map, defaultLayers);

    // Aktifkan interaksi mouse/trackpad (zoom, pan, dsb)
    if (window.H && window.H.mapevents) {
      behaviorRef.current = new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(map));
    }

    // Aktifkan visualisasi vehicle restrictions pada style
    const style = map.getBaseLayer().getProvider().getStyle();
    style.addEventListener("change", function enableVehicleRestrictions(event) {
      if (event.target.getState() === window.H.map.render.Style.State.READY) {
        event.target.removeEventListener("change", enableVehicleRestrictions, false);
        let enabledFeatures = style.getEnabledFeatures();
        if (!enabledFeatures) enabledFeatures = [];
        enabledFeatures.push({ feature: "vehicle restrictions", mode: "active & inactive" });
        style.setEnabledFeatures(enabledFeatures);
      }
    });
  }, []);

  // Set vehicle profile pada provider map setiap parameter truck berubah
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.H) return;
    const provider = map.getBaseLayer().getProvider();
    if (provider && provider.setVehicleSpecs) {
      const truckSpecs = {
        vehicleType: window.H.service.omv.Provider.IVehicleSpecs.VehicleType.TRUCK,
        grossWeightInKilograms: truckGrossWeight,
        heightInCentimeters: truckHeight,
        lengthInCentimeters: typeof length === 'number' ? length : undefined,
        weightPerAxleInKilograms: truckWeightPerAxle,
      };
      provider.setVehicleSpecs(truckSpecs);
    } else {
      console.warn('[HERE MAP] Provider tidak support setVehicleSpecs');
    }
  }, [truckGrossWeight, truckHeight, length, truckWeightPerAxle]);

  // Render marker start/end (draggable)
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.H) return;
    // Remove old markers
    if (startMarkerRef.current) {
      map.removeObject(startMarkerRef.current);
      startMarkerRef.current = null;
    }
    if (endMarkerRef.current) {
      map.removeObject(endMarkerRef.current);
      endMarkerRef.current = null;
    }
    // Add start marker (draggable)
    if (startLocation) {
      const marker = new window.H.map.Marker({ lat: startLocation.lat, lng: startLocation.lon }, { volatility: true });
      marker.draggable = true;
      map.addObject(marker);
      startMarkerRef.current = marker;
    }
    // Add end marker (draggable)
    if (endLocation) {
      const marker = new window.H.map.Marker({ lat: endLocation.lat, lng: endLocation.lon }, { volatility: true });
      marker.draggable = true;
      map.addObject(marker);
      endMarkerRef.current = marker;
    }

    // Drag event handler
    let draggedMarker = null;
    map.addEventListener('dragstart', function (ev) {
      const target = ev.target;
      if (target instanceof window.H.map.Marker && target.draggable) {
        draggedMarker = target;
        map.getViewPort().element.style.cursor = 'grabbing';
        if (behaviorRef.current) behaviorRef.current.disable(window.H.mapevents.Behavior.DRAGGING);
      }
    }, false);
    map.addEventListener('drag', function (ev) {
      if (draggedMarker) {
        const pointer = ev.currentPointer;
        const geo = map.screenToGeo(pointer.viewportX, pointer.viewportY);
        draggedMarker.setGeometry(geo);
      }
    }, false);
    map.addEventListener('dragend', function (ev) {
      if (draggedMarker) {
        const geo = draggedMarker.getGeometry();
        if (startMarkerRef.current === draggedMarker && typeof setStartLocation === 'function') {
          setStartLocation({ lat: geo.lat, lon: geo.lng });
        } else if (endMarkerRef.current === draggedMarker && typeof setEndLocation === 'function') {
          setEndLocation({ lat: geo.lat, lon: geo.lng });
        }
        draggedMarker = null;
        map.getViewPort().element.style.cursor = '';
        if (behaviorRef.current) behaviorRef.current.enable(window.H.mapevents.Behavior.DRAGGING);
      }
    }, false);
  }, [startLocation, endLocation, setStartLocation, setEndLocation]);

  // Render route polyline (hanya render dari prop routeData, tidak fetch ulang)
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.H || !routeData || !routeData.polyline) return;
    // Remove old route
    if (routeLineRef.current) {
      map.removeObject(routeLineRef.current);
      routeLineRef.current = null;
    }
    // Render polyline dari routeData
    const lineString = new window.H.geo.LineString();
    const points = decode(routeData.polyline).polyline;
    points.forEach((pt: [number, number]) => lineString.pushPoint({ lat: pt[0], lng: pt[1] }));
    const routeLine = new window.H.map.Polyline(lineString, { style: { strokeColor: 'blue', lineWidth: 5 } });
    map.addObject(routeLine);
    routeLineRef.current = routeLine;
    map.getViewModel().setLookAtData({bounds: routeLine.getBoundingBox()});
  }, [routeData]);

  // Zoom ke startLocation jika routeData belum ada
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.H) return;
    if (!routeData && startLocation) {
      map.setCenter({ lat: startLocation.lat, lng: startLocation.lon });
      map.setZoom(14); // atau zoom level yang sesuai
    }
  }, [startLocation, routeData]);

  return (
    <div ref={mapRef} style={{ width, height, minHeight: 300, borderRadius: 8, zIndex: 0 }} />
  );
};

export default HereMapNative;