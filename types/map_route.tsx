// /type/map_route.ts

export interface SettingsFormProps {
  // **Existing Props**
  transportMode: string;
  setTransportMode: (mode: string) => void;
  truckHeight: string;
  setTruckHeight: (height: string) => void;
  truckGrossWeight: string;
  setTruckGrossWeight: (weight: string) => void;
  truckWeightPerAxle: string;
  setTruckWeightPerAxle: (weight: string) => void;
  smallTruckHeight: string;
  setSmallTruckHeight: (height: string) => void;
  smallTruckGrossWeight: string;
  setSmallTruckGrossWeight: (weight: string) => void;
  smallTruckWeightPerAxle: string;
  setSmallTruckWeightPerAxle: (weight: string) => void;
  emissionType: string;
  setEmissionType: (value: string) => void;
  co2Class: string;
  setCo2Class: (value: string) => void;

  // **New Props**
  trailerType: string;
  setTrailerType: (value: string) => void;
  trailersCount: string;
  setTrailersCount: (value: string) => void;
  trailerNumberAxles: string;
  setTrailerNumberAxles: (value: string) => void;
  hybrid: string;
  setHybrid: (value: string) => void;
  height: string;
  setHeight: (value: string) => void;
  trailerHeight: string;
  setTrailerHeight: (value: string) => void;
  vehicleWeight: string;
  setVehicleWeight: (value: string) => void;
  passengersCount: string;
  setPassengersCount: (value: string) => void;
  tiresCount: string;
  setTiresCount: (value: string) => void;
  commercial: string;
  setCommercial: (value: string) => void;
  shippedHazardousGoods: string;
  setShippedHazardousGoods: (value: string) => void;
  heightAbove1stAxle: string;
  setHeightAbove1stAxle: (value: string) => void;
  length: string;
  setLength: (value) => void;
  fuelType: string;
  setFuelType: (value: string) => void;
  trailerWeight: string;
  setTrailerWeight: (value: string) => void;

  // **Route and Toll Data Props**
  routeData: { distance: string; duration: string }[];
  totalTollPrices: { [currency: string]: number };
  tollData: { tollGroups: { tollSystem: string; fares: { name: string; price: number; currency: string; id?: string; pass?: { validityPeriod?: { period: string; count?: number } }; reason?: string; paymentMethods?: string[] }[]; countryCode?: string }[] } | null;

  // Tambahan: handler submit settings
  onSettingsSubmit: () => void;
}
