import React, { useState, useRef } from 'react';
import { Icon } from "@iconify/react";

interface LocationSuggestion {
  id: string;
  address: {
    label: string;
  };
  position: {
    lat: number;
    lng: number;
  };
}

interface WaypointAutocompleteProps {
  onAddWaypoint: (lat: number, lon: number, address: string) => void;
  disabled?: boolean;
  className?: string;
}

// Helper function to parse coordinate input (lat,lon format)
function parseCoordinateInput(input: string): { lat: number; lon: number } | null {
  const cleanInput = input.trim().replace(/\s+/g, '');
  const coordinatePattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
  const match = cleanInput.match(coordinatePattern);
  
  if (match) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }
  
  return null;
}

// Helper function to parse decimal degrees with direction
function parseDecimalDegreesWithDirection(input: string): { lat: number; lon: number } | null {
  const decimalDegreesPattern = /^([\d.]+)°?\s*([NS])\s*,?\s*([\d.]+)°?\s*([EW])$/i;
  const match = input.trim().replace(/\s+/g, ' ').match(decimalDegreesPattern);
  
  if (match) {
    const latValue = parseFloat(match[1]);
    const latDirection = match[2].toUpperCase();
    const lonValue = parseFloat(match[3]);
    const lonDirection = match[4].toUpperCase();
    
    const lat = latDirection === 'S' ? -latValue : latValue;
    const lon = lonDirection === 'W' ? -lonValue : lonValue;
    
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }
  
  return null;
}

// Helper function to parse DMS format
function parseDMSInput(input: string): { lat: number; lon: number } | null {
  const dmsPattern = /^(-?\d+)°(\d+)'([\d.]+)"([NS])\s+(-?\d+)°(\d+)'([\d.]+)"([EW])$/i;
  const match = input.trim().match(dmsPattern);
  
  if (match) {
    const latDegrees = parseInt(match[1]);
    const latMinutes = parseInt(match[2]);
    const latSeconds = parseFloat(match[3]);
    const latDirection = match[4].toUpperCase();
    
    const lonDegrees = parseInt(match[5]);
    const lonMinutes = parseInt(match[6]);
    const lonSeconds = parseFloat(match[7]);
    const lonDirection = match[8].toUpperCase();
    
    let lat = latDegrees + latMinutes / 60 + latSeconds / 3600;
    let lon = lonDegrees + lonMinutes / 60 + lonSeconds / 3600;
    
    if (latDirection === 'S') lat = -lat;
    if (lonDirection === 'W') lon = -lon;
    
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }
  
  return null;
}

// Reverse geocode function
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN;
  const url = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lon}&lang=en&apiKey=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      return data.items[0].address.label;
    }
  } catch (e) {
    console.error('Reverse geocode error', e);
  }
  return null;
}

const WaypointAutocomplete: React.FC<WaypointAutocompleteProps> = ({
  onAddWaypoint,
  disabled = false,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const HERE_API_KEY = process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN;

  const fetchLocationSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(query)}&apiKey=${HERE_API_KEY}&limit=5`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.items) {
        setSuggestions(data.items);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Check if input is a coordinate (lat,lon format)
    const coordinate = parseCoordinateInput(newValue);
    if (coordinate) {
      const coordinateSuggestion: LocationSuggestion = {
        id: `coordinate-${coordinate.lat}-${coordinate.lon}`,
        address: {
          label: newValue
        },
        position: {
          lat: coordinate.lat,
          lng: coordinate.lon
        }
      };
      
      setSuggestions([coordinateSuggestion]);
      setShowSuggestions(true);
      return;
    }
    
    // Check if input is decimal degrees with direction format
    const decimalDegreesCoordinate = parseDecimalDegreesWithDirection(newValue);
    if (decimalDegreesCoordinate) {
      setLoading(true);
      reverseGeocode(decimalDegreesCoordinate.lat, decimalDegreesCoordinate.lon)
        .then((address) => {
          if (address) {
            const addressSuggestions: LocationSuggestion[] = [
              {
                id: `decimal-degrees-address-${decimalDegreesCoordinate.lat}-${decimalDegreesCoordinate.lon}`,
                address: {
                  label: address
                },
                position: {
                  lat: decimalDegreesCoordinate.lat,
                  lng: decimalDegreesCoordinate.lon
                }
              }
            ];
            
            setSuggestions(addressSuggestions);
            setShowSuggestions(true);
          } else {
            const decimalDegreesSuggestion: LocationSuggestion = {
              id: `decimal-degrees-coordinate-${decimalDegreesCoordinate.lat}-${decimalDegreesCoordinate.lon}`,
              address: {
                label: newValue
              },
              position: {
                lat: decimalDegreesCoordinate.lat,
                lng: decimalDegreesCoordinate.lon
              }
            };
            
            setSuggestions([decimalDegreesSuggestion]);
            setShowSuggestions(true);
          }
        })
        .catch((error) => {
          console.error('Error in reverse geocoding for decimal degrees:', error);
          const decimalDegreesSuggestion: LocationSuggestion = {
            id: `decimal-degrees-coordinate-${decimalDegreesCoordinate.lat}-${decimalDegreesCoordinate.lon}`,
            address: {
              label: newValue
            },
            position: {
              lat: decimalDegreesCoordinate.lat,
              lng: decimalDegreesCoordinate.lon
            }
          };
          
          setSuggestions([decimalDegreesSuggestion]);
          setShowSuggestions(true);
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }
    
    // Check if input is DMS format
    const dmsCoordinate = parseDMSInput(newValue);
    if (dmsCoordinate) {
      setLoading(true);
      reverseGeocode(dmsCoordinate.lat, dmsCoordinate.lon)
        .then((address) => {
          if (address) {
            const addressSuggestions: LocationSuggestion[] = [
              {
                id: `dms-address-${dmsCoordinate.lat}-${dmsCoordinate.lon}`,
                address: {
                  label: address
                },
                position: {
                  lat: dmsCoordinate.lat,
                  lng: dmsCoordinate.lon
                }
              }
            ];
            
            setSuggestions(addressSuggestions);
            setShowSuggestions(true);
          } else {
            const dmsSuggestion: LocationSuggestion = {
              id: `dms-coordinate-${dmsCoordinate.lat}-${dmsCoordinate.lon}`,
              address: {
                label: newValue
              },
              position: {
                lat: dmsCoordinate.lat,
                lng: dmsCoordinate.lon
              }
            };
            
            setSuggestions([dmsSuggestion]);
            setShowSuggestions(true);
          }
        })
        .catch((error) => {
          console.error('Error in reverse geocoding for DMS:', error);
          const dmsSuggestion: LocationSuggestion = {
            id: `dms-coordinate-${dmsCoordinate.lat}-${dmsCoordinate.lon}`,
            address: {
              label: newValue
            },
            position: {
              lat: dmsCoordinate.lat,
              lng: dmsCoordinate.lon
            }
          };
          
          setSuggestions([dmsSuggestion]);
          setShowSuggestions(true);
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }
    
    // If not coordinates or DMS, proceed with normal address search
    fetchLocationSuggestions(newValue);
  };

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    const coordinate = parseCoordinateInput(suggestion.address.label);
    if (coordinate) {
      const decimalFormat = suggestion.address.label;
      setInputValue('');
      reverseGeocode(coordinate.lat, coordinate.lon)
        .then((address) => {
          onAddWaypoint(coordinate.lat, coordinate.lon, address || decimalFormat);
        })
        .catch((error) => {
          console.error('Error in reverse geocoding:', error);
          onAddWaypoint(coordinate.lat, coordinate.lon, decimalFormat);
        });
    } else {
      const decimalDegreesCoordinate = parseDecimalDegreesWithDirection(suggestion.address.label);
      if (decimalDegreesCoordinate) {
        setInputValue('');
        onAddWaypoint(decimalDegreesCoordinate.lat, decimalDegreesCoordinate.lon, suggestion.address.label);
      } else {
        const dmsCoordinate = parseDMSInput(suggestion.address.label);
        if (dmsCoordinate) {
          setInputValue('');
          onAddWaypoint(dmsCoordinate.lat, dmsCoordinate.lon, suggestion.address.label);
        } else {
          // Normal address suggestion
          setInputValue('');
          onAddWaypoint(suggestion.position.lat, suggestion.position.lng, suggestion.address.label);
        }
      }
    }
    
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (showSuggestions && suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      } else {
        const coordinate = parseCoordinateInput(inputValue);
        const decimalDegreesCoordinate = parseDecimalDegreesWithDirection(inputValue);
        const dmsCoordinate = parseDMSInput(inputValue);
        
        if (coordinate) {
          setInputValue('');
          onAddWaypoint(coordinate.lat, coordinate.lon, inputValue);
        } else if (decimalDegreesCoordinate) {
          setInputValue('');
          onAddWaypoint(decimalDegreesCoordinate.lat, decimalDegreesCoordinate.lon, inputValue);
        } else if (dmsCoordinate) {
          setInputValue('');
          onAddWaypoint(dmsCoordinate.lat, dmsCoordinate.lon, inputValue);
        }
      }
    }
  };

  const clearInput = () => {
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Icon icon="mdi:plus-circle" width={20} height={20} />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Add waypoint (search address or paste coordinates)"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
        />
        {inputValue && !disabled && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <Icon icon="mdi:close" width={16} height={16} />
          </button>
        )}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon icon="mdi:loading" width={16} height={16} className="animate-spin" />
          </div>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => {
            const isCoordinate = parseCoordinateInput(suggestion.address.label);
            const isDecimalDegrees = parseDecimalDegreesWithDirection(suggestion.address.label);
            const isDMS = parseDMSInput(suggestion.address.label);
            const isDMSAddress = suggestion.id?.startsWith('dms-address-');
            const isDecimalDegreesAddress = suggestion.id?.startsWith('decimal-degrees-address-');
            
            return (
              <div
                key={suggestion.id || index}
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0 ${
                  isCoordinate ? 'bg-blue-50 hover:bg-blue-100' : 
                  isDecimalDegrees || isDecimalDegreesAddress ? 'bg-purple-50 hover:bg-purple-100' :
                  isDMS || isDMSAddress ? 'bg-green-50 hover:bg-green-100' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <Icon 
                    icon={
                      isCoordinate ? "mdi:crosshairs-gps" : 
                      isDecimalDegrees || isDecimalDegreesAddress ? "mdi:map-marker-distance" :
                      isDMS || isDMSAddress ? "mdi:map-marker-radius" : 
                      "mdi:map-marker"
                    } 
                    width={16} 
                    height={16} 
                    className={`mt-1 flex-shrink-0 ${
                      isCoordinate ? 'text-blue-500' : 
                      isDecimalDegrees || isDecimalDegreesAddress ? 'text-purple-500' :
                      isDMS || isDMSAddress ? 'text-green-500' : 
                      'text-gray-400'
                    }`} 
                  />
                  <div className="flex-1">
                    <div className={`text-sm leading-relaxed ${
                      isCoordinate ? 'text-blue-800 font-medium' : 
                      isDecimalDegrees || isDecimalDegreesAddress ? 'text-purple-800 font-medium' :
                      isDMS || isDMSAddress ? 'text-green-800 font-medium' : 
                      'text-gray-800'
                    }`}>
                      {suggestion.address.label}
                    </div>
                    {(isDecimalDegrees || isDecimalDegreesAddress) && (
                      <div className="text-xs text-purple-600 mt-1">
                        {isDecimalDegreesAddress ? 'Address found for this location' : 'Decimal degrees coordinate - click to add waypoint'}
                      </div>
                    )}
                    {(isDMS || isDMSAddress) && (
                      <div className="text-xs text-green-600 mt-1">
                        {isDMSAddress ? 'Address found for this location' : 'DMS coordinate - click to add waypoint'}
                      </div>
                    )}
                    {isCoordinate && (
                      <div className="text-xs text-blue-600 mt-1">
                        Coordinate - click to add waypoint
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WaypointAutocomplete;
