import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { fetchAddress } from "@/components/maps/here-map/utils/reverse-geocode";
import { addressCacheAdd, addressCacheGet, serverAddressCacheAdd, serverAddressCacheGet } from "@/models/address_cache";
import moment from 'moment';
import 'moment-timezone';


export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const isLocationMatch = (href, pathname) => {
  if (href === pathname) return true;
  
  if (href !== '/' && pathname.startsWith(href) && 
      (pathname.length === href.length || pathname[href.length] === '/')) {
    return true;
  }
  
  return false;
};

export const RGBToHex = (r, g, b) => {
  const componentToHex = (c) => {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const redHex = componentToHex(r);
  const greenHex = componentToHex(g);
  const blueHex = componentToHex(b);

  return "#" + redHex + greenHex + blueHex;
};

export function hslToHex(hsl) {
  // Remove "hsla(" and ")" from the HSL string
  hsl = hsl.replace("hsla(", "").replace(")", "");

  // Split the HSL string into an array of H, S, and L values
  const [h, s, l] = hsl.split(" ").map((value) => {
    if (value.endsWith("%")) {
      // Remove the "%" sign and parse as a float
      return parseFloat(value.slice(0, -1));
    } else {
      // Parse as an integer
      return parseInt(value);
    }
  });

  // Function to convert HSL to RGB
  function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    // Convert RGB values to integers
    const rInt = Math.round(r * 255);
    const gInt = Math.round(g * 255);
    const bInt = Math.round(b * 255);

    // Convert RGB values to a hex color code
    const rgbToHex = (value) => {
      const hex = value.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${rgbToHex(rInt)}${rgbToHex(gInt)}${rgbToHex(bInt)}`;
  }

  // Call the hslToRgb function and return the hex color code
  return hslToRgb(h, s, l);
}

export const hexToRGB = (hex, alpha) => {
  var r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);

  if (alpha) {
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
  } else {
    return "rgb(" + r + ", " + g + ", " + b + ")";
  }
};

export const formatTime = (time) => {
  if (!time) return "";

  const date = new Date(time);
  const formattedTime = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Add this option to display AM/PM
  });

  return formattedTime;
};

export function isObjectNotEmpty(obj) {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  return Object.keys(obj).length > 0;
}

export const formatDate = (date) => {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(date).toLocaleDateString("en-US", options);
};

export function getWords(inputString) {
  // Remove spaces from the input string
  const stringWithoutSpaces = inputString.replace(/\s/g, "");

  // Extract the first three characters
  return stringWithoutSpaces.substring(0, 3);
}

export const firstUpperLetter = (word) => {
  let modifiedStr = word;

  if (modifiedStr?.length > 0) {
    modifiedStr = modifiedStr.replace(/_/g, ' ');
    modifiedStr = modifiedStr.charAt(0).toUpperCase() + modifiedStr.slice(1);
  }

  return modifiedStr;
};

export const translateObjects = (objects, t, isTime = []) => {
  return objects.map(object => {
    const translatedObject = {};

    Object.entries(object).forEach(([key, value]) => {
      // Skip translation for worker field
      if (key === 'worker') {
        translatedObject[t(`general.${key}`)] = value;
        return;
      }

      const translatedKey = t(key);

      if (isTime.some(key => key in object)) {
        translatedObject[translatedKey] = value;
      } else {
        translatedObject[translatedKey] = typeof value === 'string'
          ? t(value.replace(/\s+/g, '_')).replace(/_/g, ' ')
          : value;
      }
    });

    return translatedObject;
  });
};

export const translateDataStructure = (data, t, isTime = []) => {
  if (Array.isArray(data)) {
    return data.map(item => translateDataStructure(item, t, isTime));
  } else if (data !== null && typeof data === 'object') {
    const translatedObject = {};
    Object.entries(data).forEach(([key, value]) => {
      const translatedKey = t(key);
      if (isTime.includes(key)) {
        translatedObject[translatedKey] = value;
      } else if (typeof value === 'string') {
        translatedObject[translatedKey] = t(value.replace(/\s+/g, '_')).replace(/_/g, ' ');
      } else {
        translatedObject[translatedKey] = translateDataStructure(value, t, isTime);
      }
    });
    return translatedObject;
  }
  return data;
};

export const cleanObjectsColumns = (objects) => {
  const nullCounts = objects.reduce((acc, obj) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        acc[key] = (acc[key] || 0) + 1;
      }
    });
    return acc;
  }, {});

  const alwaysNullKeys = Object.keys(nullCounts).filter(key => nullCounts[key] === objects.length);

  return objects.map(obj => {
    const newObj = { ...obj };
    alwaysNullKeys.forEach(key => delete newObj[key]);
    return newObj;
  });
};

export function cleanDataStructure(data) {
  // Si es un array
  if (Array.isArray(data)) {
    // Si es un array de objetos (excluyendo arrays anidados)
    if (data.every(
      item => item && typeof item === 'object' && !Array.isArray(item)
    )) {
      // Primero, aplicamos la limpieza recursivamente a cada objeto
      const cleaned = data.map(item => cleanDataStructure(item));

      // Obtenemos el conjunto de todas las claves presentes en al menos un objeto
      const allKeys = new Set();
      cleaned.forEach(obj => {
        Object.keys(obj).forEach(key => allKeys.add(key));
      });

      // Para cada clave, comprobamos si en TODOS los objetos el valor es null o undefined
      const alwaysNullKeys = [...allKeys].filter(key =>
        cleaned.every(obj => obj[key] === null || obj[key] === undefined)
      );

      // Eliminamos dichas claves de cada objeto
      return cleaned.map(obj => {
        const newObj = { ...obj };
        alwaysNullKeys.forEach(key => delete newObj[key]);
        return newObj;
      });
    } else {
      // Si el array no es de objetos (o contiene otros arrays), limpiamos cada elemento
      return data.map(item => cleanDataStructure(item));
    }
  }
  // Si es un objeto (no un array)
  else if (data && typeof data === 'object') {
    const newObj = {};
    for (const [key, value] of Object.entries(data)) {
      newObj[key] = cleanDataStructure(value);
    }
    return newObj;
  }
  // En cualquier otro caso (números, strings, etc.), se devuelve tal cual
  return data;
};

// Helper function to validate coordinates
const isValidCoordinate = (lat, lon) => {
  return (
    lat !== null &&
    lat !== undefined &&
    lon !== null &&
    lon !== undefined &&
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    isFinite(lat) &&
    isFinite(lon)
  );
};

export const fetchAddresses = async (token, objects) => {
  if (objects) {
    let newAddresses = [];

    try {
      const results = await Promise.allSettled(
        objects.map(async (obj) => {
          let updatedObj = { ...obj };

          // Validate coordinates before attempting to fetch address
          if (isValidCoordinate(obj.lat, obj.lon) && !obj.address) {
            let address = await addressCacheGet(token, obj.lat, obj.lon);
            if (address) {
              updatedObj.from = address;
            } else {
              const { address } = await fetchAddress(obj.lat, obj.lon);
              // Only add to cache if we got a valid address and coordinates are valid
              if (address?.label && isValidCoordinate(obj.lat, obj.lon)) {
                newAddresses.push({ lat: obj.lat, lng: obj.lon, a: address.label });
              }
              updatedObj.from = address?.label;
            }
          } else {
            updatedObj.from = obj.address;
          }

          // Validate next coordinates before attempting to fetch address
          if (isValidCoordinate(obj.next_lat, obj.next_lon) && !obj.next_address) {
            let address = await addressCacheGet(token, obj.next_lat, obj.next_lon);
            if (address) {
              updatedObj.to = address;
            } else {
              const { address } = await fetchAddress(obj.next_lat, obj.next_lon);
              // Only add to cache if we got a valid address and coordinates are valid
              if (address?.label && isValidCoordinate(obj.next_lat, obj.next_lon)) {
                newAddresses.push({ lat: obj.next_lat, lng: obj.next_lon, a: address.label });
              }
              updatedObj.to = address?.label;
            }
          } else {
            updatedObj.to = obj.next_address;
          }

          return updatedObj;
        })
      );

      // Filter out any entries with null/invalid coordinates before caching
      const validAddresses = newAddresses.filter(addr => 
        isValidCoordinate(addr.lat, addr.lng) && addr.a
      );

      if (validAddresses.length >= 1) {
        await addressCacheAdd(token, validAddresses);
      }

      return results.map((result, index) =>
        result.status === "fulfilled" ? result.value : objects[index]
      );
    } catch (error) {
      console.error("Error fetching addresses:", error);
      return objects;
    }
  }
  else {
    return [];
  }
};
export const serverFetchAddresses = async (token, objects) => {
  if (objects) {
    let newAddresses = [];

    try {
      const results = await Promise.allSettled(
        objects.map(async (obj) => {
          let updatedObj = { ...obj };

          // Validate coordinates before attempting to fetch address
          if (isValidCoordinate(obj.lat, obj.lon) && !obj.address) {
            let address = await serverAddressCacheGet(token, obj.lat, obj.lon);
            if (address) {
              updatedObj.from = address;
            } else {
              const { address } = await fetchAddress(obj.lat, obj.lon);
              // Only add to cache if we got a valid address and coordinates are valid
              if (address?.label && isValidCoordinate(obj.lat, obj.lon)) {
                newAddresses.push({ lat: obj.lat, lng: obj.lon, a: address.label });
              }
              updatedObj.from = address?.label;
            }
          } else {
            updatedObj.from = obj.address;
          }

          // Validate next coordinates before attempting to fetch address
          if (isValidCoordinate(obj.next_lat, obj.next_lon) && !obj.next_address) {
            let address = await serverAddressCacheGet(token, obj.next_lat, obj.next_lon);
            if (address) {
              updatedObj.to = address;
            } else {
              const { address } = await fetchAddress(obj.next_lat, obj.next_lon);
              // Only add to cache if we got a valid address and coordinates are valid
              if (address?.label && isValidCoordinate(obj.next_lat, obj.next_lon)) {
                newAddresses.push({ lat: obj.next_lat, lng: obj.next_lon, a: address.label });
              }
              updatedObj.to = address?.label;
            }
          } else {
            updatedObj.to = obj.next_address;
          }

          return updatedObj;
        })
      );

      // Filter out any entries with null/invalid coordinates before caching
      const validAddresses = newAddresses.filter(addr => 
        isValidCoordinate(addr.lat, addr.lng) && addr.a
      );

      if (validAddresses.length >= 1) {
        await serverAddressCacheAdd(token, validAddresses);
      }

      return results.map((result, index) =>
        result.status === "fulfilled" ? result.value : objects[index]
      );
    } catch (error) {
      console.error("Error fetching addresses:", error);
      return objects;
    }
  }
  else {
    return [];
  }
};

export function mergeObjectListObjectLastPositionDatatypeList(dataObjectList, dataObjectLastPosition, dataDatatypeList) {
  return dataObjectList.map(vehicle => {
    const lastPosition = dataObjectLastPosition.find(pos => pos.objectid === vehicle.id);
    if (lastPosition?.msg_data) {
      const updatedMsgData = Object.keys(lastPosition.msg_data).map((key) => {
        const nameMsg = dataDatatypeList.find(item => String(item.id) === key);
        const name = nameMsg ? nameMsg.name : key;
        const value = lastPosition.msg_data[key];
        return [key, value, name];
      });
      updatedMsgData.forEach(([, value, name]) => {
        const transformedName = name.replace(/\s+/g, '_').toLowerCase();
        lastPosition[transformedName] = value;
      });
    }
    return lastPosition ? { ...vehicle, ...lastPosition } : vehicle;
  });
}

export const parseTimeString = (timeString, t) => {
  let days = 0;
  let hours = 0;
  let minutes = 0;
  let result = '';
  const parts = timeString.split(' ');

  if (parts.length === 3) {
    days = parseInt(parts[0]);
    const timePart = parts[2];
    [hours, minutes] = timePart.split(':').map(Number);
  } else if (parts.length === 1) {
    const timePart = parts[0];
    [hours, minutes] = timePart.split(':').map(Number);
  }

  if (hours >= 24) {
    days += Math.floor(hours / 24);
    hours = hours % 24;
  }

  if (days > 0) {
    result += `${days} ${days > 1 ? t('general.days') : t('general.day')} `;
  }

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');

  result += `${formattedHours}:${formattedMinutes}`;

  if (days === 0 && hours === 0 && minutes === 0) {
    result = '00:00';
  }

  return result;
};

export const convertUnitDistance = (value, unitDistance, t) => {
  const formatNumber = (num) => num.toFixed(2).toString().replace(".", ",");

  if (unitDistance === 'km') {
    const km = formatNumber(value);
    return `${km}`;
  }
  if (unitDistance === 'mi') {
    const miValue = value * 0.621371;
    const mi = formatNumber(miValue);
    return `${mi}`;
  }
  if (unitDistance === 'swedish_mi') {
    const scandinavianmiValue = value * 0.1;
    const scandinavianmi = formatNumber(scandinavianmiValue);
    return `${scandinavianmi}`;
  }

  return t('general.invalid_unit');
};

export const convertUnitVolume = (value, unitVolume, t) => {
  const formatNumber = (num) => num.toFixed(2).toString().replace(".", ",");

  if (unitVolume === 'l') {
    const lt = formatNumber(value);
    return `${lt}`;
  }
  if (unitVolume === 'gal') {
    const gal = formatNumber(value * 0.264172);
    return `${gal}`;
  }

  return t('general.invalid_unit');
};

export const reorderObject = (obj, order) => {
  const reorderedObj = {};

  order.forEach(item => {
    const title = item.title;
    if (obj.hasOwnProperty(title)) {
      reorderedObj[title] = obj[title];
    }
  });

  Object.keys(obj).forEach(key => {
    if (!reorderedObj.hasOwnProperty(key)) {
      reorderedObj[key] = obj[key];
    }
  });

  return reorderedObj;
};

export const aMenusBArray = (a, b) => {
  return a.filter(elemento => !b.includes(elemento));
};

// Fungsi untuk memproses nilai kecepatan (spd) dan mengonversinya menjadi float
export function parseSpeed(spd) {
  // Jika spd tidak ada (null/undefined), kembalikan 0
  if (spd == null) {
    return 0;
  }

  // Jika spd adalah string, cek apakah ada koma atau titik
  if (typeof spd === 'string') {
    // Jika string mengandung koma atau titik, ganti koma menjadi titik
    if (spd.includes(',') || spd.includes('.')) {
      spd = spd.replace(',', '.');
    }
  }

  // Jika spd sudah berupa angka, langsung return angkanya
  if (typeof spd === 'number') {
    return spd;
  }

  // Parsing string menjadi float
  const parsedSpeed = parseFloat(spd);

  // Jika hasil parsing adalah NaN, kembalikan 0
  return isNaN(parsedSpeed) ? 0 : parsedSpeed;
}


export const isVehicleOffline = (lastDataTimestamp, ignitionStatus) => {
  if (!lastDataTimestamp) {
    return true;
  }
  const lastDataTime = new Date(lastDataTimestamp).getTime();
  const currentTime = Date.now();
  const timeDifferenceInMs = currentTime - lastDataTime;

  if (ignitionStatus) {
    return timeDifferenceInMs > 20 * 60 * 1000;
  } else {
    return timeDifferenceInMs > 3 * 60 * 60 * 1000;
  }
};


export const convertTimestampsToLocal = (data) => {
  const timezone = 'Europe/Vilnius';

  return data.map((item) => {
    const gpstimeUTC = moment.tz(item.gpstime, timezone).utc().format('YYYY-MM-DD HH:mm:ss');
    const inStateSinceUTC = moment.tz(item.in_state_since, timezone).utc().format('YYYY-MM-DD HH:mm:ss');
    const lastTimestampUTC = moment.tz(item.last_timestamp, timezone).utc().format('YYYY-MM-DD HH:mm:ss');

    const gpstimeLocal = moment.utc(gpstimeUTC).local().format('YYYY-MM-DD HH:mm:ss');
    const inStateSinceLocal = moment.utc(inStateSinceUTC).local().format('YYYY-MM-DD HH:mm:ss');
    const lastTimestampLocal = moment.utc(lastTimestampUTC).local().format('YYYY-MM-DD HH:mm:ss');

    item.gpstime = gpstimeLocal;
    item.in_state_since = inStateSinceLocal;
    item.last_timestamp = lastTimestampLocal;

    return item;
  });
};

export const fetchHereAddress = async (lat, lon) => {
  const apiKey = process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN;
  const url = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lon}&lang=en-US&types=address&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items[0].address.label;
    } else {
      return 'Address not found';
    }
  } catch (error) {
    console.error('Error fetching address:', error);
    return 'Error fetching address';
  }
};

export const formatDuration = (duration) => {
  if (duration.includes('days') || duration.includes('months')) {
    return duration;
  }

  const timeParts = duration.split(':');
  const hours = parseInt(timeParts[0], 10);
  const minutes = timeParts[1];
  const seconds = Math.floor(parseFloat(timeParts[2])).toString();

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} days ${remainingHours}:${minutes}:${seconds}`;
  }

  return `${hours}:${minutes}:${seconds}`;
};

export const openStreetView = (lat, lon) => {
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`;
  window.open(streetViewUrl, '_blank');
};

export const sortArray = (
  arr,
  key,
  order = 'desc'
) => {
  return arr ? arr.sort((a, b) => {
    const valA = a[key];
    const valB = b[key];

    if (valA === undefined || valB === undefined) {
      throw new Error(`La clave ${key} no existe en alguno de los objetos`);
    }

    if (valA instanceof Date && valB instanceof Date) {
      return order === 'asc' ? valA.getTime() - valB.getTime() : valB.getTime() - valA.getTime();
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    if (typeof valA === 'number' && typeof valB === 'number') {
      return order === 'asc' ? valA - valB : valB - valA;
    }

    return 0;
  }) : [];
};

export function getCurrentWeekRange() {
  const today = new Date();
  const day = today.getDay();
  // Suponiendo que la semana inicia en lunes (día 1)
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0); // Opcional: inicio del día
  return { from: monday, to: today };
}

export function getCurrentMonthRange() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  firstDayOfMonth.setHours(0, 0, 0, 0);
  return { from: firstDayOfMonth, to: today };
}

export function getCurrentYearRange() {
  const today = new Date();
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
  firstDayOfYear.setHours(0, 0, 0, 0);
  return { from: firstDayOfYear, to: today };
}

export const formatMessageData = (item, dataDatatypeList) => {
  if (!item.msg_data || typeof item.msg_data !== 'object') {
    item.msg_data = '';
    return item;
  }

  const formattedData = Object.entries(item.msg_data).map(([id, value]) => {
    const dataType = dataDatatypeList.find(dt => String(dt.id) === id);
    const name = dataType?.name || id;
    const isInvalid = item.invalid_msg_data &&
      typeof item.invalid_msg_data === 'object' &&
      id in item.invalid_msg_data;

    // Add individual field for this data type
    const fieldName = name.toLowerCase().replace(/\s+/g, '_');
    item[fieldName] = isInvalid ? `!${value}!` : value;

    return isInvalid ? `${name}: !${value}!` : `${name}: ${value}`;
  });

  item.msg_data = formattedData.join(', ');

  // Handle invalid_msg_data
  if (item.invalid_msg_data && typeof item.invalid_msg_data === 'object') {
    const invalidData = Object.entries(item.invalid_msg_data).map(([id, value]) => {
      const dataType = dataDatatypeList.find(dt => String(dt.id) === id);
      const name = dataType?.name || id;
      return `${name}: ${value}`;
    });
    item.invalid_msg_data = invalidData.join(', ');
  } else {
    item.invalid_msg_data = '';
  }

  return item;
}; 