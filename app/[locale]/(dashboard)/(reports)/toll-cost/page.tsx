'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Settings from './components/settings'; // Import komponen baru
import LocationInputs from './components/location-inputs'; // Import komponen baru
import { Menu, X } from 'lucide-react';
import loadHereMaps from '@/components/maps/here-map/utils/here-map-loader';
import { parseRestrictedTimes } from './HereMapNative';
import { decode } from '@/lib/flexible-polyline';
import { emergencyCleanupCorruptedSettings } from './utils/cleanupCorruptedSettings';
import { useUser } from '@/context/UserContext';
import { loadTollCostSettings, DEFAULT_TOLL_COST_SETTINGS, deleteTollCostSettings } from './utils/tollCostSettings';

// const HereMap = dynamic(() => import('./HereMap'), { ssr: false });
const HereMap = dynamic(() => import('./HereMapNative'), { ssr: false });

// Fungsi normalisasi toll data
export type RawTollFare = {
  name?: string;
  price?: { value?: number; currency?: string; type?: string };
  id?: string;
  pass?: { validityPeriod?: { period: string; count?: number } };
  reason?: string;
  paymentMethods?: string[];
};
export type RawTollGroup = {
  fares?: RawTollFare[];
  tollSystem?: string;
  countryCode?: string;
};
// Improved: Group fares by tollSystem, include pass/validityPeriod, and keep all details for display
export type NormalizedTollFare = {
  id?: string;
  name: string;
  price: number;
  currency: string;
  pass?: { validityPeriod?: { period: string; count?: number } };
  reason?: string;
  paymentMethods?: string[];
};
export type NormalizedTollGroup = {
  tollSystem: string;
  fares: NormalizedTollFare[];
  countryCode?: string;
};

// Define the type for a single route section
export interface RestrictionDetail {
  type?: string;
  cause?: string;
  maxGrossWeight?: number;
  maxWeight?: { value: number; type?: string };
  timeDependent?: boolean;
  restrictedTimes?: string;
}

export interface Notice {
  code?: string;
  title?: string;
  details?: RestrictionDetail[];
}

export interface NoThroughRestriction {
  type?: string;
  maxGrossWeight?: number;
  maxWeight?: { value: number; type?: string };
  timeDependent?: boolean;
  restrictedTimes?: string;
}

export interface Section {
  summary?: { 
    tolls?: { 
      total?: { value?: number; currency?: string }, 
      [key: string]: unknown 
    }, 
    length?: number, 
    duration?: number 
  };
  travelSummary?: { length?: number; duration?: number };
  tolls?: RawTollGroup[];
  polyline: string;
  notices?: Notice[];
  spans?: { offset: number; noThroughRestrictions?: number[]; carAttributes?: string[]; notices?: number[] }[];
  noThroughRestrictions?: NoThroughRestriction[];
}

export type SectionNotice = Notice;

export interface RouteSection {
  polyline: [number, number][]; // Changed from string to array of coordinates
  summary: { length: number; duration: number; tolls?: { total?: { value?: number; currency?: string } } };
  tolls: unknown;
  travelSummary: unknown;
  notices: Notice[];
  spans?: { offset: number; noThroughRestrictions?: number[]; carAttributes?: string[]; notices?: number[] }[];
  noThroughRestrictions?: NoThroughRestriction[];
  sections?: Section[]; // Tambahan untuk menyimpan semua section jika perlu
}

const Home = () => {
  const { models } = useUser();
  const token = models.user?.token;
  const [routeData, setRouteData] = useState<RouteSection[] | null>(null);
  const [tollData, setTollData] = useState<{ tollGroups: NormalizedTollGroup[] } | null>(null);

  const [startLocation, setStartLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [endLocation, setEndLocation] = useState<{ lat: number; lon: number } | null>(null);

  
  // State untuk melacak apakah location di-set dari input component (bukan dari map click)
  const [shouldFitBounds, setShouldFitBounds] = useState(false);
  
  // Flag untuk mencegah circular update dari handleWaypointsChange
  const isUpdatingFromInputRef = useRef(false);

  // Initialize with default values, will be updated when settings are loaded
  const [transportMode, setTransportMode] = useState(DEFAULT_TOLL_COST_SETTINGS.transportMode);
  const [truckHeight, setTruckHeight] = useState(DEFAULT_TOLL_COST_SETTINGS.truckHeight);
  const [truckGrossWeight, setTruckGrossWeight] = useState(DEFAULT_TOLL_COST_SETTINGS.truckGrossWeight);
  const [truckWeightPerAxle, setTruckWeightPerAxle] = useState(DEFAULT_TOLL_COST_SETTINGS.truckWeightPerAxle);
  const [smallTruckHeight, setSmallTruckHeight] = useState(DEFAULT_TOLL_COST_SETTINGS.smallTruckHeight);
  const [smallTruckGrossWeight, setSmallTruckGrossWeight] = useState(DEFAULT_TOLL_COST_SETTINGS.smallTruckGrossWeight);
  const [smallTruckWeightPerAxle, setSmallTruckWeightPerAxle] = useState(DEFAULT_TOLL_COST_SETTINGS.smallTruckWeightPerAxle);
  const [length, setLength] = useState(DEFAULT_TOLL_COST_SETTINGS.length);


  const [totalTollPrices, setTotalTollPrices] = useState<{ [currency: string]: number }>({});
  const [emissionType, setEmissionType] = useState(DEFAULT_TOLL_COST_SETTINGS.emissionType);
  const [co2Class, setCo2Class] = useState(DEFAULT_TOLL_COST_SETTINGS.co2Class);

  const [trailerType, setTrailerType] = useState(DEFAULT_TOLL_COST_SETTINGS.trailerType);
  const [trailersCount, setTrailersCount] = useState(DEFAULT_TOLL_COST_SETTINGS.trailersCount);
  const [trailerNumberAxles, setTrailerNumberAxles] = useState(DEFAULT_TOLL_COST_SETTINGS.trailerNumberAxles);
  const [hybrid, setHybrid] = useState(DEFAULT_TOLL_COST_SETTINGS.hybrid);
  const [height, setHeight] = useState(''); // in cm - not in default settings
  const [trailerHeight, setTrailerHeight] = useState(DEFAULT_TOLL_COST_SETTINGS.trailerHeight);
  const [vehicleWeight, setVehicleWeight] = useState(DEFAULT_TOLL_COST_SETTINGS.vehicleWeight);
  const [passengersCount, setPassengersCount] = useState(DEFAULT_TOLL_COST_SETTINGS.passengersCount);
  const [tiresCount, setTiresCount] = useState(DEFAULT_TOLL_COST_SETTINGS.tiresCount);
  const [commercial, setCommercial] = useState(DEFAULT_TOLL_COST_SETTINGS.commercial);
  const [shippedHazardousGoods, setShippedHazardousGoods] = useState(DEFAULT_TOLL_COST_SETTINGS.shippedHazardousGoods);
  const [heightAbove1stAxle, setHeightAbove1stAxle] = useState(DEFAULT_TOLL_COST_SETTINGS.heightAbove1stAxle);
  const [fuelType, setFuelType] = useState(DEFAULT_TOLL_COST_SETTINGS.fuelType);
  const [trailerWeight, setTrailerWeight] = useState(DEFAULT_TOLL_COST_SETTINGS.trailerWeight);

function normalizeTollData(rawTollData: { tolls?: RawTollGroup[] }) {
  if (!rawTollData || !rawTollData.tolls) return { tollGroups: [] };
  const tollGroups: NormalizedTollGroup[] = [];
  rawTollData.tolls.forEach((tollGroup) => {
    if (Array.isArray(tollGroup.fares)) {
      tollGroups.push({
        tollSystem: tollGroup.tollSystem || 'Unknown',
        countryCode: tollGroup.countryCode,
        fares: tollGroup.fares.map((fare) => ({
          id: fare.id,
          name: fare.name || tollGroup.tollSystem || 'Unknown',
          price: fare.price?.value ?? 0,
          currency: fare.price?.currency ?? '-',
          pass: fare.pass,
          reason: fare.reason,
          paymentMethods: fare.paymentMethods,
        })),
      });
    }
  });
  return { tollGroups };
}
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showRestrictionWarning, setShowRestrictionWarning] = useState(false);
  const [isSimulatingDrag, setIsSimulatingDrag] = useState(false);

  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  const API_KEY = process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN;

  const [currency, setCurrency] = useState(DEFAULT_TOLL_COST_SETTINGS.currency); // Currency state
  const [defaultConverterCurrency, setDefaultConverterCurrency] = useState<string>(''); // Default currency for converter



  function shiftLat(lat: number, meters: number) {
    // 1 degree latitude ~ 111,320 meters
    return lat + (meters / 111320);
  }

const [avoidAreas, setAvoidAreas] = useState<string[]>([]);
// Remove unused waypoints state
// const [waypoints, setWaypoints] = useState<{ lat: number; lon: number }[]>([]);

// Fungsi untuk menghitung jarak antara dua titik (Haversine formula)
function calculateDistance(point1: { lat: number; lon: number }, point2: { lat: number; lon: number }): number {
  const R = 6371; // Radius bumi dalam km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lon - point1.lon) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Fungsi untuk mengoptimasi urutan waypoints menggunakan Nearest Neighbor
function optimizeWaypoints(
  start: { lat: number; lon: number },
  end: { lat: number; lon: number },
  waypoints: { lat: number; lon: number }[]
): { lat: number; lon: number }[] {
  if (waypoints.length <= 1) return waypoints;
  
  const optimized: { lat: number; lon: number }[] = [];
  const unvisited = [...waypoints];
  
  // Mulai dari titik terdekat dengan start
  let current = start;
  
  while (unvisited.length > 0) {
    // Cari waypoint terdekat dengan current point
    let nearestIndex = 0;
    let minDistance = calculateDistance(current, unvisited[0]);
    
    for (let i = 1; i < unvisited.length; i++) {
      const distance = calculateDistance(current, unvisited[i]);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }
    
    // Pindahkan waypoint terdekat ke optimized array
    optimized.push(unvisited[nearestIndex]);
    current = unvisited[nearestIndex];
    unvisited.splice(nearestIndex, 1);
  }
  
  return optimized;
}

// State untuk menyimpan waypoints asli dan yang sudah dioptimasi
const [originalWaypoints, setOriginalWaypoints] = useState<{ lat: number; lon: number }[]>([]);
const [optimizedWaypoints, setOptimizedWaypoints] = useState<{ lat: number; lon: number }[]>([]);

const fetchRouteFromHereAPI = async () => {
  setTollData(null);
  setTotalTollPrices({});
  if (startLocation && endLocation) {
    const params = new URLSearchParams();
    // 1. Origin
    params.append('origin', `${startLocation.lat},${startLocation.lon}`);
    // 2. Optimized waypoints as 'via'
    if (optimizedWaypoints && optimizedWaypoints.length > 0) {
      optimizedWaypoints.forEach(wp => {
        params.append('via', `${wp.lat},${wp.lon}`);
      });
    }
    // 3. Destination
    params.append('destination', `${endLocation.lat},${endLocation.lon}`);
    // 4. Other params
    params.append('routingMode', 'fast');
    params.append('transportMode', transportMode || 'truck');
    params.append('return', 'polyline,summary,tolls,travelSummary,noThroughRestrictions');
    params.append('spans', 'noThroughRestrictions,notices,carAttributes');
    params.append('alternatives', '2');
    params.append('apiKey', API_KEY);
    // Always request total toll summary from API
    params.append('tolls[summaries]', 'total');
    // HERE API now requires currency to be specified when using tolls[summaries]=total
    params.append('currency', currency); // Use selected currency

    // Define vehicle parameters based on transport mode
    const vehicleParams: { [key: string]: string } = {};
    
    if (transportMode === 'truck') {
      // Truck-specific parameters
      if (truckHeight) vehicleParams['vehicle[height]'] = truckHeight;
      if (truckGrossWeight) vehicleParams['vehicle[grossWeight]'] = truckGrossWeight;
      if (truckWeightPerAxle) vehicleParams['vehicle[weightPerAxle]'] = truckWeightPerAxle;
      if (length) vehicleParams['vehicle[length]'] = length;
      if (trailerType) vehicleParams['vehicle[trailerType]'] = trailerType;
      if (trailersCount) vehicleParams['vehicle[trailersCount]'] = trailersCount;
      if (trailerNumberAxles) vehicleParams['vehicle[trailerNumberAxles]'] = trailerNumberAxles;
      if (hybrid) vehicleParams['vehicle[hybrid]'] = hybrid;
      if (heightAbove1stAxle) vehicleParams['vehicle[heightAbove1stAxle]'] = heightAbove1stAxle;
      if (shippedHazardousGoods) vehicleParams['vehicle[shippedHazardousGoods]'] = shippedHazardousGoods;
      if (fuelType) vehicleParams['vehicle[fuelType]'] = fuelType;
      if (trailerWeight) vehicleParams['vehicle[trailerWeight]'] = trailerWeight;
      if (passengersCount) vehicleParams['vehicle[passengersCount]'] = passengersCount;
      if (tiresCount) vehicleParams['vehicle[tiresCount]'] = tiresCount;
      if (commercial) vehicleParams['vehicle[commercial]'] = commercial;
    } else if (transportMode === 'smallTruck') {
      // Small truck parameters
      if (smallTruckHeight) vehicleParams['vehicle[height]'] = smallTruckHeight;
      if (smallTruckGrossWeight) vehicleParams['vehicle[grossWeight]'] = smallTruckGrossWeight;
      if (smallTruckWeightPerAxle) vehicleParams['vehicle[weightPerAxle]'] = smallTruckWeightPerAxle;
      if (length) vehicleParams['vehicle[length]'] = length;
      if (trailerType) vehicleParams['vehicle[trailerType]'] = trailerType;
      if (trailersCount) vehicleParams['vehicle[trailersCount]'] = trailersCount;
      if (trailerNumberAxles) vehicleParams['vehicle[trailerNumberAxles]'] = trailerNumberAxles;
      if (hybrid) vehicleParams['vehicle[hybrid]'] = hybrid;
      if (heightAbove1stAxle) vehicleParams['vehicle[heightAbove1stAxle]'] = heightAbove1stAxle;
      if (shippedHazardousGoods) vehicleParams['vehicle[shippedHazardousGoods]'] = shippedHazardousGoods;
      if (fuelType) vehicleParams['vehicle[fuelType]'] = fuelType;
      if (trailerWeight) vehicleParams['vehicle[trailerWeight]'] = trailerWeight;
      if (passengersCount) vehicleParams['vehicle[passengersCount]'] = passengersCount;
      if (tiresCount) vehicleParams['vehicle[tiresCount]'] = tiresCount;
      if (commercial) vehicleParams['vehicle[commercial]'] = commercial;
    }
    // For 'car' mode, don't add any vehicle parameters
    
    Object.entries(vehicleParams).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    // Tambahkan toll[emissionType] jika emissionType atau co2Class ada
    if (emissionType || co2Class) {
      let tollEmissionParam = '';
      if (emissionType) tollEmissionParam += emissionType;
      if (co2Class) tollEmissionParam += (tollEmissionParam ? ';' : '') + `co2class=${co2Class}`;
      if (tollEmissionParam) params.append('tolls[emissionType]', tollEmissionParam);
    }
    if (avoidAreas && avoidAreas.length > 0) {
      const avoidAreasParam = avoidAreas.join('|');
      params.append('avoid[areas]', avoidAreasParam);
    }
    const url = `https://router.hereapi.com/v8/routes?${params.toString()}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      

      
      if (data.routes) {
        const routesArr: RouteSection[] = data.routes.map((route: any) => {
          // Gabungkan semua section polyline menjadi satu array koordinat
          let allCoords: [number, number][] = [];
          const allSpans: any[] = [];
          let currentOffset = 0;
          
          type Section = {
            summary?: { tolls?: { total?: { value?: number; currency?: string }, [key: string]: any }, length?: number, duration?: number };
            travelSummary?: { length?: number, duration?: number };
            tolls?: RawTollGroup[];
            polyline: string;
            notices?: Notice[];
            spans?: { offset: number; noThroughRestrictions?: number[] }[];
            noThroughRestrictions?: NoThroughRestriction[];
          };
          const allSections: Section[] = route.sections || [];
          
          allSections.forEach((section, sectionIdx) => {
            // decode returns number[][], but we want [number, number][]
            const decoded: [number, number][] = decode(section.polyline).polyline.map((pt: number[]) => [pt[0], pt[1]]);
            
            // Process spans for this section with adjusted offsets
            if (section.spans && Array.isArray(section.spans)) {
              section.spans.forEach((span, spanIdx) => {
                const adjustedSpan = {
                  ...span,
                  offset: span.offset + currentOffset // Adjust offset to global coordinate array
                };
                allSpans.push(adjustedSpan);
              });
            }
            
            // Hindari duplikasi titik sambungan antar section
            if (allCoords.length > 0 && decoded.length > 0) {
              if (
                allCoords[allCoords.length - 1][0] === decoded[0][0] &&
                allCoords[allCoords.length - 1][1] === decoded[0][1]
              ) {
                allCoords = allCoords.concat(decoded.slice(1));
                currentOffset += decoded.length - 1; // Adjust for duplicate point
              } else {
                allCoords = allCoords.concat(decoded);
                currentOffset += decoded.length;
              }
            } else {
              allCoords = allCoords.concat(decoded);
              currentOffset += decoded.length;
            }
          });
          
          const result = {
            polyline: allCoords, // array of [lat, lon]
            summary: (route.sections as Section[]).reduce((acc: { length?: number; duration?: number; tolls?: any }, s: Section) => {
              acc.length = (acc.length || 0) + (s.summary?.length || 0);
              acc.duration = (acc.duration || 0) + (s.summary?.duration || 0);
              // Ambil total toll summary dari salah satu section jika ada
              if (s.summary?.tolls?.total) {
                acc.tolls = s.summary.tolls;
              }
              return acc;
            }, {}),
            tolls: (route.sections as Section[]).flatMap((s) => s.tolls || []),
            travelSummary: (route.sections as Section[]).reduce((acc: { length?: number; duration?: number }, s: Section) => {
              acc.length = (acc.length || 0) + (s.travelSummary?.length || 0);
              acc.duration = (acc.duration || 0) + (s.travelSummary?.duration || 0);
              return acc;
            }, {}),
            notices: (route.sections as Section[]).flatMap((s) => s.notices || []),
            spans: allSpans, // Use processed spans with adjusted offsets
            noThroughRestrictions: (route.sections as Section[]).flatMap((s) => s.noThroughRestrictions || []),
            sections: route.sections, // simpan semua section jika perlu
          };
          
          return result;
        });
        

        
        setRouteData(routesArr);
        if (routesArr[0]?.tolls) {
          const normalized = normalizeTollData({ tolls: routesArr[0].tolls as RawTollGroup[] });
          setTollData(normalized);
        }
        // --- FIX: Calculate total toll from summary.tolls.total (API calculated total) ---
        const totalToll: { [currency: string]: number } = {};
        type Section = {
          summary?: { tolls?: { total?: { value?: number; currency?: string } } };
          tolls?: RawTollGroup[];
        };
        
        // Use summary.tolls.total from the main route (first section) for display
        if (routesArr[0]?.sections && Array.isArray(routesArr[0].sections) && routesArr[0].sections.length > 0) {
          const mainSection = routesArr[0].sections[0] as Section;
          const tollSummary = mainSection.summary?.tolls?.total;
          if (tollSummary && tollSummary.currency) {
            totalToll[tollSummary.currency] = tollSummary.value || 0;
          }
        }
        
        // Fallback: sum fares from main route only if summary.tolls.total not found
        if (Object.keys(totalToll).length === 0 && routesArr[0]?.sections && routesArr[0].sections.length > 0) {
          const mainSection = routesArr[0].sections[0] as Section;
          if (mainSection.tolls && Array.isArray(mainSection.tolls)) {
            mainSection.tolls.forEach((tollGroup) => {
              if (tollGroup.fares && Array.isArray(tollGroup.fares)) {
                tollGroup.fares.forEach((fare) => {
                  if (fare.price && fare.price.currency) {
                    if (!totalToll[fare.price.currency]) totalToll[fare.price.currency] = 0;
                    totalToll[fare.price.currency] += fare.price.value || 0;
                  }
                });
              }
            });
          }
        }
        setTotalTollPrices(totalToll);
        
        // Get default converter currency from individual fares (original currency)
        let converterCurrency = '';
        if (routesArr[0]?.sections && Array.isArray(routesArr[0].sections)) {
          for (const section of routesArr[0].sections) {
            if (section.tolls && Array.isArray(section.tolls)) {
              for (const tollGroup of section.tolls) {
                if (tollGroup.fares && Array.isArray(tollGroup.fares)) {
                  for (const fare of tollGroup.fares) {
                    if (fare.price && fare.price.currency) {
                      converterCurrency = fare.price.currency;
                      break;
                    }
                  }
                  if (converterCurrency) break;
                }
              }
              if (converterCurrency) break;
            }
          }
        }
        setDefaultConverterCurrency(converterCurrency);
        
        // Restriction warning logic: TRUE jika ada notice atau ada noThroughRestrictions
        type SectionNotice = { code?: string };
        const hasRestrictionNotice = routesArr[0]?.notices && (routesArr[0].notices as SectionNotice[]).some((n) => n.code === 'violatedVehicleRestriction');
        const hasNoThroughRestriction = routesArr[0]?.noThroughRestrictions && routesArr[0]?.noThroughRestrictions.length > 0;
        if (hasRestrictionNotice || hasNoThroughRestriction) {
          setShowRestrictionWarning(true);
        } else {
          setShowRestrictionWarning(false);
          if (isSimulatingDrag) setIsSimulatingDrag(false);
        }
      } else {
        setRouteData(null);
        setShowRestrictionWarning(false);
      }
    } catch (error) {
      // Perbaiki: log error dengan jelas dan tanpa baris kosong
      console.error('Error fetching route from HERE API:', error);
      console.error('Error details:', error);
      setShowRestrictionWarning(false);
    }
  } else {
    setShowRestrictionWarning(false);
  }
};


  const handleStartLocationSelect = (lat: number, lon: number, _address: string) => {
    // Set flag to prevent circular update
    isUpdatingFromInputRef.current = true;
    // Aktifkan shouldFitBounds ketika location di-set dari input component
    setShouldFitBounds(true);
    setStartLocation({ lat, lon });
    // Reset flag after a short delay
    setTimeout(() => {
      isUpdatingFromInputRef.current = false;
    }, 50);
    // Don't update input value here - let the useEffect handle it with reverse geocoding
  };

  const handleEndLocationSelect = (lat: number, lon: number, _address: string) => {
    // Set flag to prevent circular update
    isUpdatingFromInputRef.current = true;
    // Aktifkan shouldFitBounds ketika location di-set dari input component
    setShouldFitBounds(true);
    setEndLocation({ lat, lon });
    // Reset flag after a short delay
    setTimeout(() => {
      isUpdatingFromInputRef.current = false;
    }, 50);
    // Don't update input value here - let the useEffect handle it with reverse geocoding
  };

  const calculateTotalTollPrice = (tollData: { tolls: { price: number; currency: string }[] }) => {
    const totals: { [currency: string]: number } = {};

    tollData.tolls.forEach((toll) => {
      const { price, currency } = toll;
      if (!totals[currency]) {
        totals[currency] = 0;
      }
      totals[currency] += price;
    });

    return totals;
  };

  useEffect(() => {
    loadHereMaps(() => {
      setMapLoaded(true);
    });
  }, []);

  // Load settings from API when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      if (token) {
        try {
          const settings = await loadTollCostSettings(token);
          
          // Update all state with loaded settings
          setTransportMode(settings.transportMode);
          setCurrency(settings.currency);
          setTruckHeight(settings.truckHeight);
          setTruckGrossWeight(settings.truckGrossWeight);
          setTruckWeightPerAxle(settings.truckWeightPerAxle);
          setSmallTruckHeight(settings.smallTruckHeight);
          setSmallTruckGrossWeight(settings.smallTruckGrossWeight);
          setSmallTruckWeightPerAxle(settings.smallTruckWeightPerAxle);
          setLength(settings.length);
          setEmissionType(settings.emissionType);
          setCo2Class(settings.co2Class);
          setTrailerType(settings.trailerType);
          setTrailersCount(settings.trailersCount);
          setTrailerNumberAxles(settings.trailerNumberAxles);
          setHybrid(settings.hybrid);
          setTrailerHeight(settings.trailerHeight);
          setTrailerWeight(settings.trailerWeight);
          setVehicleWeight(settings.vehicleWeight);
          setPassengersCount(settings.passengersCount);
          setTiresCount(settings.tiresCount);
          setCommercial(settings.commercial);
          setShippedHazardousGoods(settings.shippedHazardousGoods);
          setHeightAbove1stAxle(settings.heightAbove1stAxle);
          setFuelType(settings.fuelType);
          
        } catch (error) {
          console.error('Error loading settings:', error);
          // Keep using default values if loading fails
        }
      }
    };

    loadSettings();
  }, [token]);

  // Sync draft state with main state when settings are loaded
  useEffect(() => {
    setDraftTransportMode(transportMode);
    setDraftCurrency(currency);
    setDraftTruckHeight(truckHeight);
    setDraftTruckGrossWeight(truckGrossWeight);
    setDraftTruckWeightPerAxle(truckWeightPerAxle);
    setDraftSmallTruckHeight(smallTruckHeight);
    setDraftSmallTruckGrossWeight(smallTruckGrossWeight);
    setDraftSmallTruckWeightPerAxle(smallTruckWeightPerAxle);
    setDraftLength(length);
  }, [transportMode, currency, truckHeight, truckGrossWeight, truckWeightPerAxle, smallTruckHeight, smallTruckGrossWeight, smallTruckWeightPerAxle, length]);

  useEffect(() => {
    if (startLocation && endLocation) {
      fetchRouteFromHereAPI();
    }
  }, [
    startLocation,
    endLocation,
    transportMode,
    truckHeight,
    truckGrossWeight,
    truckWeightPerAxle,
    smallTruckHeight,
    smallTruckGrossWeight,
    smallTruckWeightPerAxle,
    length,
    optimizedWaypoints,
    currency
  ]);

  // Effect untuk mengoptimasi waypoints setiap kali originalWaypoints berubah
  useEffect(() => {
    if (startLocation && endLocation && originalWaypoints.length > 0) {
      const optimized = optimizeWaypoints(startLocation, endLocation, originalWaypoints);
      setOptimizedWaypoints(optimized);
    } else {
      setOptimizedWaypoints(originalWaypoints);
    }
  }, [startLocation, endLocation, originalWaypoints]);

  // Initialize originalWaypoints when component mounts
  useEffect(() => {
    setOriginalWaypoints([]);
  }, []);

  // Trigger reroute otomatis jika avoidAreas berubah dan start/end sudah ada
  useEffect(() => {
    if (startLocation && endLocation) {
      fetchRouteFromHereAPI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avoidAreas]);

  // Reset shouldFitBounds setelah fit bounds selesai
  useEffect(() => {
    if (shouldFitBounds) {
      // Reset setelah 100ms untuk memastikan fit bounds sudah selesai
      const timer = setTimeout(() => {
        setShouldFitBounds(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldFitBounds]);

  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState('320px');
  const [isMobile, setIsMobile] = useState(false); // Tambahan: deteksi mobile
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Tambahkan state untuk menandai initial load

  // Set default sidebar: mobile (tertutup), desktop (terbuka) - hanya pada initial load
  useEffect(() => {
    const handleResize = () => {
      // Hanya deteksi ukuran viewport pada initial load
      if (isInitialLoad) {
        if (window.innerWidth < 768) {
          setShowSidebar(false);
          setSidebarWidth('80vw');
          setIsMobile(true);
        } else {
          setShowSidebar(true);
          setSidebarWidth('320px');
          setIsMobile(false);
        }
        // Set isInitialLoad ke false setelah pertama kali
        setIsInitialLoad(false);
      }
      // Setelah initial load, resize event tidak akan mengubah state sidebar
    };
    handleResize(); // set saat mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isInitialLoad]); // Tambahkan isInitialLoad sebagai dependency

  // Buat routeInfo agar sesuai tipe SettingsFormProps
  let routeInfo: { distance: string; duration: string }[] = [];
  if (routeData && routeData.length > 0) {
    routeInfo = routeData.map(rd => ({
      distance: (rd.summary.length / 1000).toFixed(2),
      duration: (rd.summary.duration / 60).toFixed(2),
    }));
  }

  // Tambahkan state untuk input value agar input bisa diupdate dari parent
  const [startInputValue, setStartInputValue] = useState('');
  const [endInputValue, setEndInputValue] = useState('');

  // Reverse geocoding function
  const reverseGeocode = useCallback(async (lat: number, lon: number): Promise<string | null> => {
    const url = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lon}&lang=en&apiKey=${API_KEY}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].address.label;
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
    return null;
  }, [API_KEY]);

  // Effect to handle reverse geocoding when location data changes
  useEffect(() => {
    const updateAddresses = async () => {
      // Update start location input with address
      if (startLocation) {
        try {
          const address = await reverseGeocode(startLocation.lat, startLocation.lon);
          if (address) {
            setStartInputValue(address);
            if (startInputRef.current) {
              startInputRef.current.value = address;
            }
          }
        } catch (error) {
          console.error('Error getting address for start location:', error);
        }
      }

      // Update end location input with address
      if (endLocation) {
        try {
          const address = await reverseGeocode(endLocation.lat, endLocation.lon);
          if (address) {
            setEndInputValue(address);
            if (endInputRef.current) {
              endInputRef.current.value = address;
            }
          }
        } catch (error) {
          console.error('Error getting address for end location:', error);
        }
      }
    };

    // Only update addresses when both start and end locations are set
    if (startLocation && endLocation) {
      updateAddresses();
    }
  }, [startLocation, endLocation, reverseGeocode]);

  // Handler klik map: update state dan input value
  async function handleMapClickSetLocation(lat: number, lon: number, isStart: boolean) {
    // Nonaktifkan shouldFitBounds ketika location di-set dari map click
    setShouldFitBounds(false);
    
    if (isStart) {
      setStartLocation({ lat, lon });
      // Input value will be updated by useEffect with reverse geocoding
    } else {
      setEndLocation({ lat, lon });
      // Input value will be updated by useEffect with reverse geocoding
    }
  }

  // Handler for waypoints change from HereMap
  const handleWaypointsChange = useCallback((data: { origin: { lat: number; lon: number } | null; destination: { lat: number; lon: number } | null; waypoints: { lat: number; lon: number }[] }) => {
    
    setOriginalWaypoints(data.waypoints); // Use originalWaypoints instead of waypoints
    
    // Only update start/end if NOT updating from input (to prevent circular updates)
    if (!isUpdatingFromInputRef.current) {
      // Optionally update start/end if user drags them via map
      if (data.origin && (data.origin.lat !== startLocation?.lat || data.origin.lon !== startLocation?.lon)) {
        setStartLocation(data.origin);
      }
      if (data.destination && (data.destination.lat !== endLocation?.lat || data.destination.lon !== endLocation?.lon)) {
        setEndLocation(data.destination);
      }
    } else {
    }
  }, [setOriginalWaypoints, setStartLocation, setEndLocation, startLocation, endLocation, shouldFitBounds]);

  // Handler for route order change when polyline is clicked
  const handleRouteOrderChange = useCallback((newRouteOrder: RouteSection[]) => {
    setRouteData(newRouteOrder);
    // Update toll data for the new main route (index 0)
    if (newRouteOrder[0]?.tolls) {
      const normalized = normalizeTollData({ tolls: newRouteOrder[0].tolls as RawTollGroup[] });
      setTollData(normalized);
    }
    // Recalculate total toll prices for the new main route using summary.tolls.total
    const totalToll: { [currency: string]: number } = {};
    if (newRouteOrder[0]?.sections && Array.isArray(newRouteOrder[0].sections) && newRouteOrder[0].sections.length > 0) {
      const mainSection = newRouteOrder[0].sections[0] as Section;
      const tollSummary = mainSection.summary?.tolls?.total;
      if (tollSummary && tollSummary.currency) {
        totalToll[tollSummary.currency] = tollSummary.value || 0;
      }
    }
    // Fallback: sum fares from main route only if summary.tolls.total not found
    if (Object.keys(totalToll).length === 0 && newRouteOrder[0]?.sections && newRouteOrder[0].sections.length > 0) {
      const mainSection = newRouteOrder[0].sections[0] as Section;
      if (mainSection.tolls && Array.isArray(mainSection.tolls)) {
        mainSection.tolls.forEach((tollGroup) => {
          if (tollGroup.fares && Array.isArray(tollGroup.fares)) {
            tollGroup.fares.forEach((fare) => {
              if (fare.price && fare.price.currency) {
                if (!totalToll[fare.price.currency]) totalToll[fare.price.currency] = 0;
                totalToll[fare.price.currency] += fare.price.value || 0;
              }
            });
          }
        });
      }
    }
    setTotalTollPrices(totalToll);
    
    // Get default converter currency from individual fares (original currency)
    let converterCurrency = '';
    if (newRouteOrder[0]?.sections && Array.isArray(newRouteOrder[0].sections)) {
      for (const section of newRouteOrder[0].sections) {
        if (section.tolls && Array.isArray(section.tolls)) {
          for (const tollGroup of section.tolls) {
            if (tollGroup.fares && Array.isArray(tollGroup.fares)) {
              for (const fare of tollGroup.fares) {
                if (fare.price && fare.price.currency) {
                  converterCurrency = fare.price.currency;
                  break;
                }
              }
              if (converterCurrency) break;
            }
          }
          if (converterCurrency) break;
        }
      }
    }
    setDefaultConverterCurrency(converterCurrency);
    
    // Update restriction warning for the new main route
    const hasRestrictionNotice = newRouteOrder[0]?.notices && (newRouteOrder[0].notices as SectionNotice[]).some((n) => n.code === 'violatedVehicleRestriction');
    const hasNoThroughRestriction = newRouteOrder[0]?.noThroughRestrictions && newRouteOrder[0]?.noThroughRestrictions.length > 0;
    if (hasRestrictionNotice || hasNoThroughRestriction) {
      setShowRestrictionWarning(true);
    } else {
      setShowRestrictionWarning(false);
      if (isSimulatingDrag) setIsSimulatingDrag(false);
    }
  }, [setRouteData, setTollData, setTotalTollPrices, setShowRestrictionWarning, isSimulatingDrag]);

  // DRAFT STATE untuk settings dialog (all as string)
const [draftTransportMode, setDraftTransportMode] = useState(DEFAULT_TOLL_COST_SETTINGS.transportMode);
const [draftCurrency, setDraftCurrency] = useState(DEFAULT_TOLL_COST_SETTINGS.currency);
const [draftTruckHeight, setDraftTruckHeight] = useState(DEFAULT_TOLL_COST_SETTINGS.truckHeight);
const [draftTruckGrossWeight, setDraftTruckGrossWeight] = useState(DEFAULT_TOLL_COST_SETTINGS.truckGrossWeight);
const [draftTruckWeightPerAxle, setDraftTruckWeightPerAxle] = useState(DEFAULT_TOLL_COST_SETTINGS.truckWeightPerAxle);
const [draftSmallTruckHeight, setDraftSmallTruckHeight] = useState(DEFAULT_TOLL_COST_SETTINGS.smallTruckHeight);
const [draftSmallTruckGrossWeight, setDraftSmallTruckGrossWeight] = useState(DEFAULT_TOLL_COST_SETTINGS.smallTruckGrossWeight);
const [draftSmallTruckWeightPerAxle, setDraftSmallTruckWeightPerAxle] = useState(DEFAULT_TOLL_COST_SETTINGS.smallTruckWeightPerAxle);
const [draftLength, setDraftLength] = useState(DEFAULT_TOLL_COST_SETTINGS.length);

// Handler untuk submit settings
function handleSettingsSubmit() {
  setTransportMode(draftTransportMode);
  setCurrency(draftCurrency);
  setTruckHeight(draftTruckHeight);
  setTruckGrossWeight(draftTruckGrossWeight);
  setTruckWeightPerAxle(draftTruckWeightPerAxle);
  setSmallTruckHeight(draftSmallTruckHeight);
  setSmallTruckGrossWeight(draftSmallTruckGrossWeight);
  setSmallTruckWeightPerAxle(draftSmallTruckWeightPerAxle);
  setLength(draftLength);
}

  return (
    <div>
      <div className='flex relative'>
        {/* Tombol Testing untuk set origin/destination */}
        {/* <button
          className='fixed top-2 left-2 z-50 bg-blue-600 text-white rounded px-4 py-2 shadow hover:bg-blue-700 transition'
          onClick={() => {
            setStartLocation({ lat: 51.56638085, lon: -0.20640923 });
            setEndLocation({ lat: 51.56641949, lon: -0.20904064 });
          }}
        >
          Testing Origin/Destination
        </button> */}
        {/* Tombol toggle sidebar (hanya tampil jika sidebar hidden) */}
        {!showSidebar && (
          <button
            className='fixed top-14 left-2 z-50 bg-white rounded-full shadow p-2 hover:bg-gray-100 transition'
            onClick={() => setShowSidebar(true)}
            aria-label='Show sidebar'
          >
            <Menu className='w-6 h-6' />
          </button>
        )}
        <div className='sidebar-map-container'>
          {/* Sidebar dengan animasi show/hide */}
          <div
            className={`bg-white p-0 block left-sidebar transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full'} fixed h-full z-40`}
            style={{ minHeight: '100vh', width: sidebarWidth }}
          >
            {/* Tombol close sidebar */}
            <button
              className='absolute top-2 right-4 z-50 bg-white rounded-full shadow p-2 hover:bg-gray-100 transition'
              onClick={() => setShowSidebar(false)}
              aria-label='Close sidebar'
            >
              <X className='w-4 h-4' />
            </button>
            <div className='form-input-container p-2'>
              {/* Emergency Cleanup Button */}
              {/* <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-md'>
                <p className='text-sm text-red-700 mb-2'>
                  <strong>Emergency Cleanup:</strong> If you see JSON parsing errors, click this button to clean up corrupted settings.
                </p>
                <button
                  onClick={async () => {
                    if (confirm('This will delete ALL toll cost settings. Are you sure?')) {
                      await emergencyCleanupCorruptedSettings(token);
                      alert('Cleanup completed! Please refresh the page.');
                    }
                  }}
                  className='w-full bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition'
                >
                  🧹 Clean Up Corrupted Settings
                </button>
              </div> */}
              <LocationInputs
                startInputValue={startInputValue}
                endInputValue={endInputValue}
                setStartInputValue={setStartInputValue}
                setEndInputValue={setEndInputValue}
                onStartLocationSelect={handleStartLocationSelect}
                onEndLocationSelect={handleEndLocationSelect}
              />
              <Settings
                transportMode={draftTransportMode}
                setTransportMode={setDraftTransportMode}
                truckHeight={draftTruckHeight}
                setTruckHeight={setDraftTruckHeight}
                truckGrossWeight={draftTruckGrossWeight}
                setTruckGrossWeight={setDraftTruckGrossWeight}
                truckWeightPerAxle={draftTruckWeightPerAxle}
                setTruckWeightPerAxle={setDraftTruckWeightPerAxle}
                smallTruckHeight={draftSmallTruckHeight}
                setSmallTruckHeight={setDraftSmallTruckHeight}
                smallTruckGrossWeight={draftSmallTruckGrossWeight}
                setSmallTruckGrossWeight={setDraftSmallTruckGrossWeight}
                smallTruckWeightPerAxle={draftSmallTruckWeightPerAxle}
                setSmallTruckWeightPerAxle={setDraftSmallTruckWeightPerAxle}
                emissionType={emissionType}
                setEmissionType={setEmissionType}
                co2Class={co2Class}
                setCo2Class={setCo2Class}
                trailerType={trailerType}
                setTrailerType={setTrailerType}
                trailersCount={trailersCount}
                setTrailersCount={setTrailerNumberAxles}
                trailerNumberAxles={trailerNumberAxles}
                setTrailerNumberAxles={setTrailerNumberAxles}
                hybrid={hybrid}
                setHybrid={setHybrid}
                height={height}
                setHeight={setHeight}
                trailerHeight={trailerHeight}
                setTrailerHeight={setTrailerHeight}
                vehicleWeight={vehicleWeight}
                setVehicleWeight={setVehicleWeight}
                passengersCount={passengersCount}
                setPassengersCount={setPassengersCount}
                tiresCount={tiresCount}
                setTiresCount={setTiresCount}
                commercial={commercial}
                setCommercial={setCommercial}
                shippedHazardousGoods={shippedHazardousGoods}
                setShippedHazardousGoods={setShippedHazardousGoods}
                heightAbove1stAxle={heightAbove1stAxle}
                setHeightAbove1stAxle={setHeightAbove1stAxle}
                length={draftLength}
                setLength={setDraftLength}
                fuelType={fuelType}
                setFuelType={setFuelType}
                trailerWeight={trailerWeight}
                setTrailerWeight={setTrailerWeight}
                totalTollPrices={totalTollPrices}
                tollData={tollData}
                onSettingsSubmit={handleSettingsSubmit}
                routeData={routeInfo}
                currency={draftCurrency} // Pass currency
                setCurrency={setDraftCurrency} // Pass setter
                token={token} // Pass token for API calls
                defaultConverterCurrency={defaultConverterCurrency} // Pass default converter currency
                onSettingsSave={() => {
                  console.log('Settings saved successfully');
                }}
                // onDeleteSettings={handleDeleteSettings}
              />
            </div>
          </div>
        </div>
        {/* Overlay untuk klik di luar sidebar agar sidebar tertutup (hanya mobile) */}
        {isMobile && showSidebar && (
          <div
            className='fixed inset-0 bg-black/30 z-30'
            onClick={() => setShowSidebar(false)}
            style={{ cursor: 'pointer' }}
          />
        )}
        {showRestrictionWarning && routeData && routeData[0] && (
          (routeData[0].noThroughRestrictions?.length > 0 ||
            (Array.isArray(routeData[0].notices) && routeData[0].notices.some((n: Notice) => n.code === 'violatedVehicleRestriction'))
          ) && (
            <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-200 border border-yellow-500 text-yellow-900 px-6 py-2 rounded shadow-lg" style={{ minWidth: 320, position: 'relative' }}>
              <button
                className="absolute top-[-10px] right-[-5px] rounded-full border border-yellow-500 text-yellow-900 hover:bg-yellow-300 bg-yellow-500"
                aria-label="Close warning"
                onClick={() => setShowRestrictionWarning(false)}
              >
                <X className='w-4 h-4' />
              </button>
              <b>Warning:</b> Route found, but there are segments that trucks with this specification are not allowed to pass according to HERE regulations.
              {/* Restriction details from noThroughRestrictions */}
              {routeData[0].noThroughRestrictions && routeData[0].noThroughRestrictions.length > 0 && (
                <div className="mt-2 text-sm">
                  <b>Restriction details:</b>
                  <ul className="list-disc ml-5">
                    {routeData[0].noThroughRestrictions.map((r, i) => (
                      <li key={i}>
                        {r.type && <>Type: {r.type} </>}
                        {r.maxGrossWeight && <>| Max gross weight: {r.maxGrossWeight}kg </>}
                        {r.maxWeight && r.maxWeight.value && <>| Max weight: {r.maxWeight.value}kg ({r.maxWeight.type}) </>}
                        {r.timeDependent && <>| Time dependent </>}
                        {r.restrictedTimes && <>| {parseRestrictedTimes(r.restrictedTimes)} </>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Restriction details from notices.details */}
              {Array.isArray(routeData[0].notices) &&
                routeData[0].notices
                  .filter((n: Notice) => n.code === 'violatedVehicleRestriction')
                  .map((n: Notice, i: number) =>
                    n.details && Array.isArray(n.details) && n.details.length > 0 && (
                      <div className="mt-2 text-sm" key={i}>
                        <b>Restriction details (from notice):</b>
                        <ul className="list-disc ml-5">
                          {n.details.map((d: any, j: number) => (
                            <li key={j}>
                              {d.type && <>Type: {d.type} </>}
                              {d.cause && <>| Cause: {d.cause} </>}
                              {d.maxGrossWeight && <>| Max gross weight: {d.maxGrossWeight}kg </>}
                              {d.maxWeight && d.maxWeight.value && <>| Max weight: {d.maxWeight.value}kg ({d.maxWeight.type}) </>}
                              {d.timeDependent && <>| Time dependent </>}
                              {d.restrictedTimes && <>| {parseRestrictedTimes(d.restrictedTimes)} </>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  )
              }
              {/* Restriction details from notices (title/cause) */}
              {Array.isArray(routeData[0].notices) && routeData[0].notices.some((n: Notice) => n.code === 'violatedVehicleRestriction') && (
                <div className="mt-2 text-sm">
                  <b>Restriction notice:</b>
                  <ul className="list-disc ml-5">
                    {routeData[0].notices.filter((n: Notice) => n.code === 'violatedVehicleRestriction').map((n: Notice, i: number) => (
                      <li key={i}>
                        {n.title || n.code}
                        {n.details && Array.isArray(n.details) && n.details.length > 0 && (
                          <ul className="ml-4">
                            {n.details.map((d: any, j: number) => (
                              <li key={j}>
                                {d.type && <>Type: {d.type} </>}
                                {d.cause && <>| Cause: {d.cause}</>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        )}
        <div className='flex-grow p-0'>
        {/* {mapLoaded && (
          <HereMap
            startLocation={startLocation}
            endLocation={endLocation}
            setStartLocation={setStartLocation}
            setEndLocation={setEndLocation}
            transportMode={transportMode}
            truckHeight={truckHeight}
            truckGrossWeight={truckGrossWeight}
            truckWeightPerAxle={truckWeightPerAxle}
            truckLength={Number(length)}
          />
        )} */}
         {mapLoaded && (
          <HereMap
            startLocation={startLocation}
            endLocation={endLocation}
            setStartLocation={setStartLocation}
            setEndLocation={setEndLocation}
            transportMode={transportMode}
            truckHeight={transportMode === 'truck' && truckHeight !== '' ? Number(truckHeight) : undefined}
            truckGrossWeight={transportMode === 'truck' && truckGrossWeight !== '' ? Number(truckGrossWeight) : undefined}
            truckWeightPerAxle={transportMode === 'truck' && truckWeightPerAxle !== '' ? Number(truckWeightPerAxle) : undefined}
            smallTruckHeight={transportMode === 'smallTruck' && smallTruckHeight !== '' ? Number(smallTruckHeight) : undefined}
            smallTruckGrossWeight={transportMode === 'smallTruck' && smallTruckGrossWeight !== '' ? Number(smallTruckGrossWeight) : undefined}
            smallTruckWeightPerAxle={transportMode === 'smallTruck' && smallTruckWeightPerAxle !== '' ? Number(smallTruckWeightPerAxle) : undefined}
            routeData={routeData}
            length={transportMode !== 'car' && length !== null ? Number(length) : undefined}
            onAvoidAreasChange={setAvoidAreas}
            onWaypointsChange={handleWaypointsChange}
            onRouteOrderChange={handleRouteOrderChange}
            shouldFitBounds={shouldFitBounds}
            optimizedWaypoints={optimizedWaypoints} // Pass optimized waypoints to map
          />
        )}
        </div>
      </div>
    </div>
  );
};

export default Home;