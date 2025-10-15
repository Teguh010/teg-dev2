'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet-routing-machine-here';
import 'leaflet-draw'; 

interface HereMapProps {
  lat?: number;
  lon?: number;
  zoom?: number;
  width?: string;
  height?: string;
  onTollData?: any;
  startLocation?: { lat: number; lon: number };
  endLocation?: { lat: number; lon: number };
  setStartLocation?: (loc: { lat: number; lon: number }) => void;
  setEndLocation?: (loc: { lat: number; lon: number }) => void;
  transportMode?: string;
  truckHeight?: number;
  truckWidth?: number;
  truckLength?: number;
  truckGrossWeight?: number;
  truckWeightPerAxle?: number;
  shippedHazardousGoods?: string[];
  trailerCount?: number;
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  avoidFerries?: boolean;
  avoidDirtRoad?: boolean;
  departureTime?: string;
  routingMode?: string;
  widthCm?: number;
  lengthCm?: number;
  grossWeightKg?: number;
  weightPerAxleKg?: number;
  smallTruckHeight?:number
  smallTruckGrossWeight?: number;
  smallTruckWeightPerAxle?: number;
}

const HereMap: React.FC<HereMapProps> = ({
  lat = 55.174112,
  lon = 23.906736,
  zoom = 14,
  width = '100%',
  height = 'calc(100vh - 52px)',
  transportMode,
  startLocation,
  endLocation,
  setStartLocation,
  setEndLocation,
  truckHeight,
  truckWidth,
  truckLength,
  truckGrossWeight,
  truckWeightPerAxle,
  shippedHazardousGoods,
  trailerCount,
  avoidHighways,
  avoidTolls,
  avoidFerries,
  avoidDirtRoad,
  departureTime,
  routingMode,
  widthCm,
  lengthCm,
  grossWeightKg,
  weightPerAxleKg,
  smallTruckHeight,
  smallTruckGrossWeight,
  smallTruckWeightPerAxle
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const routingControl = useRef<L.Routing.Control | null>(null);
  const [isSelectingStart, setIsSelectingStart] = useState(true);
  const [avoidAreas, setAvoidAreas] = useState<L.LatLngBounds[]>([]);
  const drawControl = useRef<L.Control.Draw | null>(null);
  const [isRoutingUpdating, setIsRoutingUpdating] = useState(false);


  // Tambahkan state untuk melacak apakah sedang menggambar
  const [isDrawing, setIsDrawing] = useState(false);

  const defaultIcon = L.icon({
    iconUrl: markerIconPng.src,
    shadowUrl: markerShadowPng.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const addOrUpdateStartMarker = (latLng: L.LatLng) => {
    if (!mapInstance.current) return;

    if (startMarkerRef.current) {
      startMarkerRef.current.setLatLng(latLng);
    } else {
      const marker = L.marker(latLng, {
        icon: defaultIcon,
        draggable: true,
      }).addTo(mapInstance.current);

      marker.on('dragend', function (event) {
        const { lat, lng } = (event.target as L.Marker).getLatLng();
        if (setStartLocation) {
          setStartLocation({ lat, lon: lng });
        }
      });

      startMarkerRef.current = marker;
    }
  };

  const addOrUpdateEndMarker = (latLng: L.LatLng) => {
    if (!mapInstance.current) return;

    if (endMarkerRef.current) {
      endMarkerRef.current.setLatLng(latLng);
    } else {
      const marker = L.marker(latLng, {
        icon: defaultIcon,
        draggable: true,
      }).addTo(mapInstance.current);

      marker.on('dragend', function (event) {
        const { lat, lng } = (event.target as L.Marker).getLatLng();
        if (setEndLocation) {
          setEndLocation({ lat, lon: lng });
        }
      });

      endMarkerRef.current = marker;
    }
  };

  const addAvoidZone = (circle: L.Circle) => {
    // Hitung bounds secara manual untuk lingkaran
    const center = circle.getLatLng();
    const radius = circle.getRadius();

    // Membuat LatLngBounds secara manual berdasarkan radius
    const bounds = L.latLngBounds(
      L.latLng(center.lat - radius / 111000, center.lng - radius / 111000), // Perkiraan 111km per derajat
      L.latLng(center.lat + radius / 111000, center.lng + radius / 111000)
    );

    // Menambahkan bounds ini ke daftar avoidAreas
    setAvoidAreas((prevAvoidAreas) => {
      const updatedAvoidAreas = [...prevAvoidAreas, bounds];
      return updatedAvoidAreas;
    });
  };

  //@ts-ignore

  const CustomHere = L.Routing.Here.extend({
    options: {
      avoidAreas: null,
    },

    initialize: function (apiKey, options) {
      //@ts-ignore
      L.Routing.Here.prototype.initialize.call(this, apiKey, options);
      if (options.avoidAreas) {
        this.options.avoidAreas = options.avoidAreas;
      }
    },

    buildRouteUrl: function (waypoints, options) {
      //@ts-ignore
      const url = L.Routing.Here.prototype.buildRouteUrl.call(this, waypoints, options);

      // Format avoidAreas as required by the API
      if (this.options.avoidAreas && this.options.avoidAreas.length > 0) {
        const formattedAvoidAreas = this.options.avoidAreas
          .map((bounds) => {
            const southWest = bounds.getSouthWest();
            const northEast = bounds.getNorthEast();
            return `bbox:${southWest.lng},${southWest.lat},${northEast.lng},${northEast.lat}`;
          })
          .join('|'); // Join multiple areas with '|'

        // Append avoid areas to the URL
        const modifiedUrl = `${url}&avoid[areas]=${formattedAvoidAreas}`;
        return modifiedUrl;
      }

      return url;
    },
  });


const updateRoutingMachine = (startLatLng: L.LatLng, endLatLng: L.LatLng) => {

   if (routingControl.current) {
    if (mapInstance.current) {
      mapInstance.current.removeControl(routingControl.current); // Remove the routing control
      routingControl.current = null; // Ensure routingControl is set to null after removal
    }
  }

  routingControl.current = L.Routing.control({
    waypoints: [startLatLng, endLatLng],
    routeWhileDragging: true,
    router: new CustomHere(process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN, {
      routeRestriction: {
        transportMode: transportMode || 'car',
        avoidHighways: avoidHighways ?? false,
        avoidTolls: avoidTolls ?? false,
        avoidFerries: avoidFerries ?? false,
        avoidDirtRoad: avoidDirtRoad ?? false,
        departureTime: departureTime,
        routingMode: routingMode || 'fast',
      },
      truckRestriction: {
        ...(truckHeight && { height: truckHeight }),
        ...(truckWidth && { width: truckWidth }),
        ...(truckLength && { length: truckLength }),
        ...(truckGrossWeight && { grossWeight: truckGrossWeight }),
        ...(truckWeightPerAxle && { weightPerAxle: truckWeightPerAxle }),
        ...(shippedHazardousGoods && { shippedHazardousGoods }),
        ...(trailerCount !== undefined && { trailerCount }),
        ...(widthCm && { width: widthCm }),
        ...(lengthCm && { length: lengthCm }),
        ...(grossWeightKg && { grossWeight: grossWeightKg }),
        ...(weightPerAxleKg && { weightPerAxle: weightPerAxleKg }),
      },
      avoidAreas: avoidAreas.length > 0 ? avoidAreas : [],
    }),
    //@ts-ignore
    createMarker: function (i, waypoint, n) {
      const markerOptions: L.MarkerOptions = {
        draggable: true,
        icon: defaultIcon,
      };
      const marker = L.marker(waypoint.latLng, markerOptions);

      marker.on('dragend', function (event) {
        const { lat, lng } = (event.target as L.Marker).getLatLng();
        if (i === 0 && setStartLocation) {
          setStartLocation({ lat, lon: lng });
        } else if (i === n - 1 && setEndLocation) {
          setEndLocation({ lat, lon: lng });
        }
      });
      return marker;
    },
    show: false,
  }).addTo(mapInstance.current!);
};



  useEffect(() => {
    if (startLocation) {
      const startLatLng = L.latLng(startLocation.lat, startLocation.lon);
      addOrUpdateStartMarker(startLatLng);

      if (mapInstance.current) {
        mapInstance.current.setView(startLatLng, zoom);
      }
    }
  }, [startLocation]);

useEffect(() => {
  if (!mapInstance.current) return;

  if (startLocation && endLocation) {
    const startLatLng = L.latLng(startLocation.lat, startLocation.lon);
    const endLatLng = L.latLng(endLocation.lat, endLocation.lon);

    addOrUpdateEndMarker(endLatLng);
    updateRoutingMachine(startLatLng, endLatLng); // Always call the routing update function

    // Fit map to show both start and end locations
    const bounds = L.latLngBounds(startLatLng, endLatLng);
    mapInstance.current.fitBounds(bounds);
  }

  // Cleanup routing control on component unmount
  return () => {
    if (routingControl.current && mapInstance.current) {
      mapInstance.current.removeControl(routingControl.current);
    }
  };
}, [startLocation, endLocation, transportMode, avoidAreas]);


  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    if (!mapInstance.current) {
      // --- HERE MAP LAYERS ---
      const map = L.map(mapRef.current).setView([lat, lon], zoom);

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

      const truckLayer = L.tileLayer(
        `https://{s}.base.maps.ls.hereapi.com/maptile/2.1/trucktile/newest/normal.day/{z}/{x}/{y}/256/png8?apiKey=${process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN}`,
        {
          subdomains: ['1', '2', '3', '4'],
          maxZoom: 20,
          detectRetina: true,
          attribution: '&copy; 2024 HERE Technologies',
        }
      );

      // Default: truckLayer
      baseMapLayer.addTo(map);

      L.control.layers({
        'Truck Map': truckLayer,
        'Standard Map': baseMapLayer,
        'Satellite Map': satelliteLayer,
      }).addTo(map);

      mapInstance.current = map;
    }

    // Definisikan handleMapClick di sini dan gunakan state isDrawing
    // const handleMapClick = (e: L.LeafletMouseEvent) => {
    //   if (isDrawing) {
    //     // Jangan lakukan apa-apa jika sedang menggambar
    //     return
    //   }
    //   const { lat, lng } = e.latlng
    //   if (isSelectingStart) {
    //     if (setStartLocation) setStartLocation({ lat, lon: lng })
    //   } else {
    //     if (setEndLocation) setEndLocation({ lat, lon: lng })
    //   }
    //   setIsSelectingStart(!isSelectingStart)
    // }

    const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (isDrawing || (startLocation && endLocation)) {
      // Jangan lakukan apapun jika sedang menggambar atau jika start dan end sudah dipilih
      return;
    }
    
    const { lat, lng } = e.latlng;
    if (isSelectingStart) {
      if (setStartLocation) setStartLocation({ lat, lon: lng });
    } else {
      if (setEndLocation) setEndLocation({ lat, lon: lng });
    }

    setIsSelectingStart(!isSelectingStart);
  };

  // Tambahkan handler klik peta
  mapInstance.current.on('click', handleMapClick);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.off('click', handleMapClick);
      }
    };
  }, [isSelectingStart, setStartLocation, setEndLocation, isDrawing]);

  useEffect(() => {
    if (!mapInstance.current) return;

    // Check if drawControl has already been added to avoid duplicates
    if (!drawControl.current) {
      drawControl.current = new L.Control.Draw({
        draw: {
          polygon: {
            allowIntersection: false, // Nonaktifkan interseksi
            drawError: {
              color: '#e1e100', // Warna untuk kesalahan saat menggambar
              timeout: 1000,
            },
            shapeOptions: {
              color: '#ff0000', // Warna lingkaran
            },
          },
          circle: {
            shapeOptions: {
              color: '#ff0000', // Warna lingkaran
            },
          },
          marker: false,
          polyline: false,
          rectangle: {
            shapeOptions: {
              color: '#ff0000', // Warna lingkaran
            },
          },
          circlemarker: false,
        },
      });
      mapInstance.current.addControl(drawControl.current); // Tambahkan kontrol hanya sekali
    }

    // Event handlers untuk Leaflet.Draw
    const onDrawStart = () => {
      setIsDrawing(true);
    };

    const onDrawCreated = (event: any) => {
      const layer = event.layer;

      // Avoid adding multiple markers or unwanted behavior
      if (event.layerType === 'circle') {
        const circle = layer as L.Circle;
        addAvoidZone(circle); // Add avoid zone for circle
      } else if (event.layerType === 'polygon') {
        const polygon = layer as L.Polygon;
        const bounds = polygon.getBounds();
        setAvoidAreas((prevAvoidAreas) => [...prevAvoidAreas, bounds]);
      } else if (event.layerType === 'rectangle') {
        const rectangle = layer as L.Rectangle;
        const bounds = rectangle.getBounds();
        setAvoidAreas((prevAvoidAreas) => [...prevAvoidAreas, bounds]);
      }

      mapInstance.current?.addLayer(layer);
      setIsDrawing(false);
    };

    const onDrawStop = () => {
      setIsDrawing(false);
    };

    // Bind event listeners
    mapInstance.current.on(L.Draw.Event.DRAWSTART, onDrawStart);
    mapInstance.current.on(L.Draw.Event.CREATED, onDrawCreated);
    mapInstance.current.on(L.Draw.Event.DRAWSTOP, onDrawStop);

    return () => {
      
      mapInstance.current?.off(L.Draw.Event.DRAWSTART, onDrawStart);
      mapInstance.current?.off(L.Draw.Event.CREATED, onDrawCreated);
      mapInstance.current?.off(L.Draw.Event.DRAWSTOP, onDrawStop);
    };
  }, [isSelectingStart, setStartLocation, setEndLocation, avoidAreas]);

  useEffect(() => {
  return () => {
    if (routingControl.current) {
      mapInstance.current?.removeControl(routingControl.current);
      routingControl.current = null;
    }
  };
}, []);


  return <div ref={mapRef} style={{ width, height, top: '0px', right: '0px', zIndex: '0' }} />;
};

export default HereMap;
