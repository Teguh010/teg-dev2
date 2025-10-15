import React, { useState, useRef, useEffect } from 'react';
import { Icon } from "@iconify/react";
import { createPortal } from 'react-dom';

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

interface LocationAutocompleteProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelectLocation: (lat: number, lon: number, address: string) => void;
  label?: string;
  icon?: string;
  className?: string;
  disabled?: boolean;
}

// Helper function to parse coordinate input (lat,lon format)
function parseCoordinateInput(input: string): { lat: number; lon: number } | null {
  // Remove extra spaces and normalize
  const cleanInput = input.trim().replace(/\s+/g, '');
  
  // Check if it matches lat,lon pattern (with optional spaces)
  const coordinatePattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
  const match = cleanInput.match(coordinatePattern);
  
  if (match) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    
    // Validate coordinate ranges
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }
  
  return null;
}

// Helper function to parse decimal degrees with direction (e.g., 7.4705° S, 112.4401° E)
function parseDecimalDegreesWithDirection(input: string): { lat: number; lon: number } | null {
  // Pattern for decimal degrees with direction: 7.4705° S, 112.4401° E
  // Support various formats with optional spaces and different separators
  const decimalDegreesPattern = /^([\d.]+)°?\s*([NS])\s*,?\s*([\d.]+)°?\s*([EW])$/i;
  const match = input.trim().replace(/\s+/g, ' ').match(decimalDegreesPattern);
  
  if (match) {
    const latValue = parseFloat(match[1]);
    const latDirection = match[2].toUpperCase();
    const lonValue = parseFloat(match[3]);
    const lonDirection = match[4].toUpperCase();
    
    // Apply direction
    const lat = latDirection === 'S' ? -latValue : latValue;
    const lon = lonDirection === 'W' ? -lonValue : lonValue;
    
    // Validate coordinate ranges
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }
  
  return null;
}

// Helper function to parse DMS format and convert to decimal degrees
function parseDMSInput(input: string): { lat: number; lon: number } | null {
  // DMS pattern: 7°28'20.0"S 112°25'42.5"E
  // Support various formats with optional spaces and different separators
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
    
    // Convert to decimal degrees
    let lat = latDegrees + latMinutes / 60 + latSeconds / 3600;
    let lon = lonDegrees + lonMinutes / 60 + lonSeconds / 3600;
    
    // Apply direction
    if (latDirection === 'S') lat = -lat;
    if (lonDirection === 'W') lon = -lon;
    
    // Validate coordinate ranges
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }
  
  return null;
}

// Tambahkan fungsi reverse geocode
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

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  placeholder,
  value,
  onChange,
  onSelectLocation,
  label,
  icon = "mdi:map-marker",
  className = "",
  disabled = false
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const HERE_API_KEY = process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN;

  // Cleanup effect to hide suggestions when component unmounts
  useEffect(() => {
    return () => {
      setShowSuggestions(false);
    };
  }, []);

  // Hide suggestions on scroll or resize
  useEffect(() => {
    if (!showSuggestions) return;

    const handleScrollOrResize = () => {
      setShowSuggestions(false);
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [showSuggestions]);

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
    onChange(newValue);
    
    // Check if input is a coordinate (lat,lon format)
    const coordinate = parseCoordinateInput(newValue);
    if (coordinate) {
      // Create a coordinate suggestion that will appear in dropdown
      const coordinateSuggestion: LocationSuggestion = {
        id: `coordinate-${coordinate.lat}-${coordinate.lon}`,
        address: {
          label: newValue // Show the original coordinate input in dropdown
        },
        position: {
          lat: coordinate.lat,
          lng: coordinate.lon
        }
      };
      
      // Show the coordinate as a suggestion in dropdown
      setSuggestions([coordinateSuggestion]);
      setShowSuggestions(true);
      return;
    }
    
    // Check if input is decimal degrees with direction format (e.g., 7.4705° S, 112.4401° E)
    const decimalDegreesCoordinate = parseDecimalDegreesWithDirection(newValue);
    if (decimalDegreesCoordinate) {
      // For decimal degrees with direction, do reverse geocoding to get address suggestions
      setLoading(true);
      reverseGeocode(decimalDegreesCoordinate.lat, decimalDegreesCoordinate.lon)
        .then((address) => {
          if (address) {
            // Create address suggestions from reverse geocoding
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
            // If no address found, show the decimal degrees coordinate as suggestion
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
          // Fallback to showing decimal degrees coordinate as suggestion
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
      // For DMS input, do reverse geocoding to get address suggestions
      setLoading(true);
      reverseGeocode(dmsCoordinate.lat, dmsCoordinate.lon)
        .then((address) => {
          if (address) {
            // Create address suggestions from reverse geocoding
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
            // If no address found, show the DMS coordinate as suggestion
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
          // Fallback to showing DMS coordinate as suggestion
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
    // Check if this is a coordinate suggestion (decimal format)
    const coordinate = parseCoordinateInput(suggestion.address.label);
    if (coordinate) {
      // Keep decimal format as-is when user selects the coordinate
      const decimalFormat = suggestion.address.label; // Keep original decimal format
      
      // Update the input with decimal format (no conversion to DMS)
      onChange(decimalFormat);
      
      // Get address from coordinates and trigger location selection
      reverseGeocode(coordinate.lat, coordinate.lon)
        .then((address) => {
          if (address) {
            // Use the decimal format as the display address
            onSelectLocation(coordinate.lat, coordinate.lon, decimalFormat);
          } else {
            // Fallback to decimal format if reverse geocoding fails
            onSelectLocation(coordinate.lat, coordinate.lon, decimalFormat);
          }
        })
        .catch((error) => {
          console.error('Error in reverse geocoding:', error);
          // Still select the location even if reverse geocoding fails
          onSelectLocation(coordinate.lat, coordinate.lon, decimalFormat);
        });
    } else {
      // Check if this is a decimal degrees with direction suggestion
      const decimalDegreesCoordinate = parseDecimalDegreesWithDirection(suggestion.address.label);
      if (decimalDegreesCoordinate) {
        // Decimal degrees with direction format suggestion - keep the format and set location
        onChange(suggestion.address.label);
        onSelectLocation(decimalDegreesCoordinate.lat, decimalDegreesCoordinate.lon, suggestion.address.label);
      } else {
        // Check if this is a DMS suggestion or normal address suggestion
        const dmsCoordinate = parseDMSInput(suggestion.address.label);
        if (dmsCoordinate) {
          // DMS format suggestion - keep the DMS format and set location
          onChange(suggestion.address.label);
          onSelectLocation(dmsCoordinate.lat, dmsCoordinate.lon, suggestion.address.label);
        } else {
          // Normal address suggestion
          const address = suggestion.address.label;
          onChange(address);
          onSelectLocation(suggestion.position.lat, suggestion.position.lng, address);
        }
      }
    }
    
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow click events
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submit
      
      // If there are suggestions and the first one is visible, select it
      if (showSuggestions && suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      } else {
        // If no suggestions but input looks like coordinates, try to handle it
        const coordinate = parseCoordinateInput(value);
        const decimalDegreesCoordinate = parseDecimalDegreesWithDirection(value);
        const dmsCoordinate = parseDMSInput(value);
        
        if (coordinate) {
          // Handle decimal coordinate input - keep as decimal format
          const decimalFormat = value; // Keep original decimal format
          
          onChange(decimalFormat);
          onSelectLocation(coordinate.lat, coordinate.lon, decimalFormat);
        } else if (decimalDegreesCoordinate) {
          // Handle decimal degrees with direction coordinate input
          onSelectLocation(decimalDegreesCoordinate.lat, decimalDegreesCoordinate.lon, value);
        } else if (dmsCoordinate) {
          // Handle DMS coordinate input
          onSelectLocation(dmsCoordinate.lat, dmsCoordinate.lon, value);
        }
      }
    }
  };

  const clearInput = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Get dropdown position for portal
  const getDropdownStyle = () => {
    if (!containerRef.current) return {};
    
    const rect = containerRef.current.getBoundingClientRect();
    const inputRect = inputRef.current?.getBoundingClientRect();
    
    // Use input element position if available, otherwise fall back to container
    const referenceRect = inputRect || rect;
    
    return {
      position: 'fixed' as const,
      top: referenceRect.bottom + window.scrollY + 4,
      left: referenceRect.left + window.scrollX,
      width: referenceRect.width,
      zIndex: 9999,
    };
  };

  const renderDropdown = () => {
    if (!showSuggestions || suggestions.length === 0) return null;

    const dropdownContent = (
      <div 
        style={getDropdownStyle()}
        className="bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
      >
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
                      {isDecimalDegreesAddress ? 'Address found for this location' : 'Decimal degrees coordinate - click to set location'}
                    </div>
                  )}
                  {(isDMS || isDMSAddress) && (
                    <div className="text-xs text-green-600 mt-1">
                      {isDMSAddress ? 'Address found for this location' : 'DMS coordinate - click to set location'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );

    // Use portal to render dropdown at document body level
    if (typeof document !== 'undefined') {
      return createPortal(dropdownContent, document.body);
    }
    return null;
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-500 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Icon icon={icon} width={20} height={20} />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {value && !disabled && (
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
      
      {renderDropdown()}
    </div>
  );
};

export default LocationAutocomplete;
