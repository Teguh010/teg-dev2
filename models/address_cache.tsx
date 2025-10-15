"use client";
import axios from 'axios';


import {
  apiRequest,
} from "./common";
import { apiRequestServer } from "@/models/server/common";

export const addressCacheGet = async (token: string | null, lat: number | string, lon: number | string) => {
  // Validate coordinates before making API request
  const parsedLat = typeof lat === 'number' ? lat : parseFloat(lat);
  const parsedLon = typeof lon === 'number' ? lon : parseFloat(lon);
  
  // Return null if coordinates are invalid
  if (
    lat === null ||
    lat === undefined ||
    lon === null ||
    lon === undefined ||
    isNaN(parsedLat) ||
    isNaN(parsedLon) ||
    !isFinite(parsedLat) ||
    !isFinite(parsedLon)
  ) {
    console.warn('Invalid coordinates provided to addressCacheGet:', { lat, lon });
    return null;
  }
  
  const params = {
    "lat": parsedLat,
    "lon": parsedLon
  };
  return await apiRequest(token, "address_cache.get", params);
};

export const serverAddressCacheGet = async (token: string | null, lat: number | string, lon: number | string) => {
  // Validate coordinates before making API request
  const parsedLat = typeof lat === 'number' ? lat : parseFloat(lat);
  const parsedLon = typeof lon === 'number' ? lon : parseFloat(lon);
  
  // Return null if coordinates are invalid
  if (
    lat === null ||
    lat === undefined ||
    lon === null ||
    lon === undefined ||
    isNaN(parsedLat) ||
    isNaN(parsedLon) ||
    !isFinite(parsedLat) ||
    !isFinite(parsedLon)
  ) {
    console.warn('Invalid coordinates provided to serverAddressCacheGet:', { lat, lon });
    return null;
  }
  
  const params = {
    "lat": parsedLat,
    "lon": parsedLon
  };
  return await apiRequestServer(token, "address_cache.get", params);
};

export const addressCacheAdd = async (
  token: string,
  addresses: { lat: number, lng: number, a: string }[]
) => {
  // Filter out any addresses with invalid coordinates before sending to backend
  const validAddresses = addresses.filter(address => {
    const isValid = (
      address.lat !== null &&
      address.lat !== undefined &&
      address.lng !== null &&
      address.lng !== undefined &&
      typeof address.lat === 'number' &&
      typeof address.lng === 'number' &&
      !isNaN(address.lat) &&
      !isNaN(address.lng) &&
      isFinite(address.lat) &&
      isFinite(address.lng) &&
      address.a // Ensure address label is present
    );
    
    if (!isValid) {
      console.warn('Skipping invalid address entry:', address);
    }
    
    return isValid;
  });

  // If no valid addresses, return early
  if (validAddresses.length === 0) {
    console.warn('No valid addresses to cache');
    return false;
  }

  const params = {
    json_data: validAddresses.map(address => ({
      lat: address.lat,
      lng: address.lng,
      a: address.a
    }))
  };

  try {
    const result: string = await apiRequest(token, "address_cache.add", params);
    const data: boolean = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const serverAddressCacheAdd = async (
  token: string,
  addresses: { lat: number, lng: number, a: string }[]
) => {
  // Filter out any addresses with invalid coordinates before sending to backend
  const validAddresses = addresses.filter(address => {
    const isValid = (
      address.lat !== null &&
      address.lat !== undefined &&
      address.lng !== null &&
      address.lng !== undefined &&
      typeof address.lat === 'number' &&
      typeof address.lng === 'number' &&
      !isNaN(address.lat) &&
      !isNaN(address.lng) &&
      isFinite(address.lat) &&
      isFinite(address.lng) &&
      address.a // Ensure address label is present
    );
    
    if (!isValid) {
      console.warn('Skipping invalid address entry:', address);
    }
    
    return isValid;
  });

  // If no valid addresses, return early
  if (validAddresses.length === 0) {
    console.warn('No valid addresses to cache');
    return false;
  }

  const params = {
    json_data: validAddresses.map(address => ({
      lat: address.lat,
      lng: address.lng,
      a: address.a
    }))
  };

  try {
    const result: string = await apiRequestServer(token, "address_cache.add", params);
    const data: boolean = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};



export const fetchHereAddressesBatch = async (coordinates) => {
  const apiKey = process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN;
  const hereBatchUrl = `https://batch.geocoder.ls.hereapi.com/6.2/jobs`;

  // Filter out coordinates with null/invalid values before sending to HERE
  const validCoordinates = coordinates.filter(coord => {
    const isValid = (
      coord.lat !== null &&
      coord.lat !== undefined &&
      coord.lon !== null &&
      coord.lon !== undefined &&
      typeof coord.lat === 'number' &&
      typeof coord.lon === 'number' &&
      !isNaN(coord.lat) &&
      !isNaN(coord.lon) &&
      isFinite(coord.lat) &&
      isFinite(coord.lon)
    );
    
    if (!isValid) {
      console.warn('Skipping invalid coordinate for batch geocoding:', coord);
    }
    
    return isValid;
  });

  // If no valid coordinates, return empty array
  if (validCoordinates.length === 0) {
    console.warn('No valid coordinates for batch geocoding');
    return [];
  }

  const coordList = validCoordinates.map(coord => `${coord.lat},${coord.lon}`).join('\n');
  const formData = new URLSearchParams();
  formData.append('action', 'run');
  formData.append('apikey', apiKey); // Ensure API key is included
  formData.append('in', 'csv');
  formData.append('out', 'json');
  formData.append('csvAttributes', 'latitude,longitude');
  formData.append('locationattributes', 'address');
  formData.append('indelim', '\n');
  formData.append('outdelim', ',');
  formData.append('query', coordList);

  try {
    // Send POST request to start batch job
    const response = await axios.post(hereBatchUrl, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!response.data.Response || !response.data.Response.JobId) {
      throw new Error('Failed to start batch geocoding job.');
    }

    const jobId = response.data.Response.JobId;

    // Poll the job status
    let jobStatus = 'running';
    while (jobStatus === 'running' || jobStatus === 'pending') {
      const jobStatusUrl = `${hereBatchUrl}/${jobId}?apikey=${apiKey}`;
      const statusResponse = await axios.get(jobStatusUrl);
      jobStatus = statusResponse.data.Response.Status;

      if (jobStatus === 'completed') break;

      // Delay before checking again
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Fetch the result
    const resultUrl = `${hereBatchUrl}/${jobId}/result?apikey=${apiKey}`;
    const resultResponse = await axios.get(resultUrl);

    // Process and return geocoded addresses
    const addresses = resultResponse.data.map(item => ({
      lat: item.latitude,
      lon: item.longitude,
      address: item.address.label || 'Address not found',
    }));

    return addresses;
  } catch (error) {
    console.error('Error fetching batch addresses:', error);
    throw error;
  }
};


