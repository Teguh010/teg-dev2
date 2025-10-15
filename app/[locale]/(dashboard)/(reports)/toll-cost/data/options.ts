
export interface Option {
  value: string;
  label: string;
}

// Define option arrays with the Option type
export const transportOptions: Option[] = [
  { value: "car", label: "Car" },
  { value: "truck", label: "Truck" },
  { value: "small_truck", label: "Small Truck" },
];

export const emissionTypeOptions: Option[] = [
  { value: 'euro1', label: 'Euro I' },
  { value: 'euro2', label: 'Euro II' },
  { value: 'euro3', label: 'Euro III' },
  { value: 'euro4', label: 'Euro IV' },
  { value: 'euro5', label: 'Euro V' },
  { value: 'euro6', label: 'Euro VI' },
  { value: 'euro7', label: 'EURO EEV' },
  { value: 'euro8', label: 'Electric Vehicles' },
  { value: 'euro9', label: 'EURO II with PRC' },
  { value: 'euro10', label: 'EURO III with PRC' },
];

export const co2ClassOptions: Option[] = [
  { value: '1', label: 'CO2 Class 1' },
  { value: '2', label: 'CO2 Class 2' },
  { value: '3', label: 'CO2 Class 3' },
  { value: '4', label: 'CO2 Class 4' },
  { value: '5', label: 'CO2 Class 5' },
];



export const fuelTypeOptions = [
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Petrol', label: 'Petrol' },
  { value: 'LPG', label: 'LPG' },
  { value: 'LNG', label: 'LNG' },
  { value: 'CNG', label: 'CNG' },
  { value: 'Ethanol', label: 'Ethanol' },
  { value: 'Propane', label: 'Propane' },
  { value: 'Hydrogen', label: 'Hydrogen' },
  { value: 'Electric', label: 'Electric' },
];

export const trailerTypeOptions = [
  { value: '0', label: 'None' },
  { value: '1', label: 'Caravan' },
  { value: '2', label: 'Trailer' },
  { value: '3', label: 'RV Trailer' },
  { value: '4', label: 'Boat Trailer' },
];

export const trailersCountOptions = [
  { value: '0', label: '0' },
  { value: '1', label: '1 or more' },
  { value: '2', label: '2 or more' },
  { value: '3', label: '3 or more' },
  { value: '4', label: '1 or more semi-trailers' },
];

export const commercialOptions = [
  { value: '0', label: 'No' },
  { value: '1', label: 'Yes' },
];


// Export all options in a central object
export const options = {
  transportOptions,
  emissionTypeOptions,
  co2ClassOptions,
  commercialOptions,
  trailersCountOptions,
  trailerTypeOptions,
  fuelTypeOptions
};
