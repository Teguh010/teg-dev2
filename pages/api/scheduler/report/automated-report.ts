import type { NextApiRequest, NextApiResponse } from "next";
import { generateTripStopPDF } from "@/lib/pdfGenerator";
import { jsPDF } from "jspdf";
import nodemailer from "nodemailer";
import "jspdf-autotable";
import { serverAddressCacheGet, serverAddressCacheAdd, fetchHereAddressesBatch } from "@/models/address_cache";
import { fetchAddress } from "@/components/maps/here-map/utils/reverse-geocode";
import { format } from "date-fns";
import axios from "axios";

interface TripStopEntry {
  objectid?: string;
  time_from?: string;
  time_to?: string;
  duration?: string;
  distance?: number;
  fuel_used?: number;
  avg_speed?: number;
  address?: string;
  lat?: number;
  lon?: number;
  next_address?: string;
  next_lat?: number;
  next_lon?: number;
  [key: string]: string | number | undefined;
}

interface TripStopVehicle {
  objectid: string
  d: TripStopEntry[]
  vehicleName?: string
}

interface TripStopTotals {
  total_distance?: number
  total_fuel?: number
  total_duration?: string
  [key: string]: string | number | undefined
}

interface TripStopPDFParams {
  doc: jsPDF
  data: TripStopVehicle[]
  totals: TripStopTotals
  dateFormat?: string
  columns?: Record<string, unknown>
  unitDistance?: string
}

interface TripStopParams {
  time_range: { start: Date; end: Date };
  report_type?: string;
  emails?: string[];
  rep_interval?: number;
  rep_int_len?: number;
  rep_time_period?: {
    from: string;
    to: string;
    sched_time: string;
  };
}

type ResponseData = {
  message?: string
  error?: string
  emails?: string[]
  data?: TripStopVehicle[] | Record<string, unknown>
  stack?: string
  timestamp?: string
  logs?: Record<string, unknown>
  status?: string
  code?: string
  example?: {
    params: {
      report_type: string
      time_range: {
        start: string
        end: string
      }
      emails: string[]
    }
  }
  details?: {
    report_type: string
    time_range: {
      start: string
      end: string
      source: string
    }
    total_vehicles: number
    generated_at: string
    period_details?: {
      interval_type: number
      interval_length: number
      schedule_time: string
    }
  }
}

const validReportTypes = [
  "trip_stop_report",
  "maintenance_report",
  "fuel_usage_report",
  "report_ok",
  "report_fail"
];

const calculateReportTimePeriod = (params: TripStopParams) => {
  if (!params.rep_interval || !params.rep_int_len) {
    return null;
  }

  const now = new Date();
  let periodInDays: number;

  switch (params.rep_interval) {
    case 3: // daily
      periodInDays = 1 * params.rep_int_len;
      break;
    case 5: // weekly
      periodInDays = 7 * params.rep_int_len;
      break;
    case 6: // monthly
      periodInDays = 30 * params.rep_int_len;
      break;
    case 7: // yearly
      periodInDays = 365 * params.rep_int_len;
      break;
    default:
      return null;
  }

  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - periodInDays);

  return {
    from: format(start, "yyyy-MM-dd HH:mm:ss"),
    to: format(end, "yyyy-MM-dd HH:mm:ss"),
    sched_time: format(end, "yyyy-MM-dd HH:mm:ss")
  };
};

const validateReportParams = (params: TripStopParams) => {
  if (!params) {
    throw new Error("Missing parameters");
  }

  const errors = [];

  // Validate report type
  if (!params.report_type) {
    errors.push("params.report_type is required");
  } else if (!validReportTypes.includes(params.report_type)) {
    errors.push(`params.report_type must be one of: ${validReportTypes.join(", ")}`);
  }

  // Validate time range
  if (!params.time_range) {
    throw new Error("time_range is required");
  }

  if (!params.time_range.start || !params.time_range.end) {
    throw new Error("time_range.start and time_range.end are required");
  }

  // Validate email format
  if (params.emails) {
    if (!Array.isArray(params.emails)) {
      throw new Error("params.emails must be an array of email addresses");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    params.emails.forEach((email, index) => {
      if (email.includes(",")) {
        errors.push(`Email at index ${index} contains comma. Each email should be a separate array element`);
      } else if (!emailRegex.test(email)) {
        errors.push(`Invalid email format at index ${index}: ${email}`);
      }
    });
  }

  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }
};

const getVehicleNames = async (token: string): Promise<Map<number, string>> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_TRACEGRID_API_URL;

    if (!apiUrl) {
      console.warn('API URL is undefined, using default map');
      return new Map();
    }

    const response = await axios.post(
      `${apiUrl}/tracegrid_api/client`,
      {
        id: '1',
        jsonrpc: '2.0',
        method: 'object.list',
        params: { with_archived: false, without_virtual: true }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );

    const vehicles = JSON.parse(response.data.result);
    return new Map(vehicles.map((v) => [v.id, v.name]));
  } catch (error) {
    console.error('Failed to get vehicle list:', error);
    return new Map();
  }
};

const getVehicleData = async (
  token: string,
  params: TripStopParams
): Promise<TripStopVehicle[]> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_TRACEGRID_API_URL;
    if (!apiUrl) {
      throw new Error('API URL is undefined');
    }

    console.log(`[API] Calling TraceGrid API: ${apiUrl}/tracegrid_api/client`);
    console.log(`[API] Request params:`, {
      object_id: [0],
      time_from: format(params.time_range.start, 'yyyy-MM-dd') + ' 00:00:00',
      time_to: format(params.time_range.end, 'yyyy-MM-dd') + ' 23:59:59'
    });

    const response = await axios.post(
      `${apiUrl}/tracegrid_api/client`,
      {
        id: '1',
        jsonrpc: '2.0',
        method: 'object.trip_stop',
        params: {
          object_id: [0], // Get all vehicles
          time_from: format(params.time_range.start, 'yyyy-MM-dd') + ' 00:00:00',
          time_to: format(params.time_range.end, 'yyyy-MM-dd') + ' 23:59:59'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );


    if (!response.data.result) {
      console.warn('No result in API response');
      return [];
    }

    const result = JSON.parse(response.data.result);

    if (!result || !result.data) {
      console.warn('No data in parsed result');
      return [];
    }

    // Get vehicle names
    const vehicleMap = await getVehicleNames(token);

    // Process vehicle data
    const vehicles = result.data.map(vehicle => ({
      objectid: vehicle.objectid?.toString() || 'unknown',
      d: Array.isArray(vehicle.d) ? vehicle.d : [],
      vehicleName: vehicleMap.get(Number(vehicle.objectid)) || `Vehicle ${vehicle.objectid}`
    }));

    return vehicles;
  } catch (error) {
    console.error('Error in getVehicleData:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    
    if (
      error.response?.code === 'TOKEN_EXPIRED' ||
      error.message?.includes('Token has expired') ||
      error.response?.status === 401
    ) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw error;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | Buffer>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: "error",
        message: "Authentication token is required"
      });
    }
    const token = authHeader.split(' ')[1];

    const { outputFormat = "pdf", email, params } = req.body;

    // Validate parameters
    try {
      validateReportParams(params);
    } catch (error) {
      return res.status(400).json({
        status: "error",
        code: "BAD_REQUEST",
        message: error.message,
        example: {
          params: {
            report_type: "trip_stop_report",
            time_range: {
              start: "2024-03-25",
              end: "2024-03-26"
            },
            emails: ["user@example.com"]
          }
        }
      });
    }

    // Handle test report types
    if (params.report_type === "report_fail") {
      throw new Error("Test failure - report_fail type requested");
    }
    if (params.report_type === "report_ok") {
      return res.status(200).json({
        status: "success",
        message: "Test success - report_ok type requested",
        data: { test: true }
      });
    }

    // Calculate time range
    const timeRange = params.rep_time_period
      ? {
          start: new Date(params.rep_time_period.from),
          end: new Date(params.rep_time_period.to)
        }
      : params.rep_interval && params.rep_int_len
        ? {
            start: new Date(calculateReportTimePeriod(params)?.from || params.time_range.start),
            end: new Date(calculateReportTimePeriod(params)?.to || params.time_range.end)
          }
        : {
            start: new Date(params.time_range.start),
            end: new Date(params.time_range.end)
          };

    // Validate date range
    if (timeRange.end < timeRange.start) {
      return res.status(400).json({
        status: "error",
        code: "INVALID_DATE_RANGE",
        message: "End date must be after start date"
      });
    }

    // Get vehicle data from TraceGrid API
    const vehicleData = await getVehicleData(token, params);

    // Get vehicle names
    const vehicleMap = await getVehicleNames(token);

    // Enrich vehicle data with names
    const enrichedData = vehicleData.map((vehicle) => ({
      ...vehicle,
      vehicleName: vehicleMap.get(Number(vehicle.objectid)) || `Vehicle ${vehicle.objectid}`
    }));

    // Enrich addresses
    // This is a scheduled report, so skip cache checks and directly geocode
    console.log(`[ADDRESS_ENRICHMENT] Processing scheduled report - skipping cache checks`);
    
    for (const vehicleData of enrichedData) {
      if (vehicleData.d?.length > 0) {
        // Use batch processing for better efficiency
        vehicleData.d = await enrichAddressesBatch(vehicleData.d, token);
      }
    }

    // Calculate totals
    const totals: TripStopTotals = {
      total_distance: enrichedData.reduce((sum, vehicle) => 
        sum + (vehicle.d?.reduce((vSum, trip) => vSum + (trip.distance || 0), 0) || 0), 0),
      total_fuel: enrichedData.reduce((sum, vehicle) => 
        sum + (vehicle.d?.reduce((vSum, trip) => vSum + (trip.fuel_used || 0), 0) || 0), 0),
      total_duration: "0:00:00" // You might want to implement proper duration calculation
    };

    const parsedData = {
      data: enrichedData,
      totals
    };

    // Handle multiple email formats
    const emailRecipients = Array.isArray(params.emails)
      ? params.emails
      : params.emails?.includes(",")
      ? params.emails.split(",").map((e) => e.trim())
      : params.emails
      ? [params.emails]
      : Array.isArray(email)
      ? email
      : email?.includes(",")
      ? email.split(",").map((e) => e.trim())
      : email
      ? [email]
      : [];

    if (outputFormat === "pdf" && parsedData) {
      const doc = new jsPDF({
        putOnlyUsedFonts: true,
        orientation: "landscape"
      });

      doc.viewerPreferences({
        HideToolbar: false,
        HideMenubar: false,
        HideWindowUI: false,
        DisplayDocTitle: true,
        NonFullScreenPageMode: "UseOutlines"
      });

      const pdfParams: TripStopPDFParams = {
        doc,
        data: parsedData.data,
        totals: parsedData.totals,
        dateFormat: "dd/MM/yyyy",
        unitDistance: "km"
      };
      generateTripStopPDF(pdfParams);

      const pdfBuffer = doc.output("arraybuffer");

      if (emailRecipients.length > 0) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: emailRecipients.join(", "),
            subject: `Trip Stop Report - ${format(timeRange.start, "yyyy-MM-dd")} to ${format(timeRange.end, "yyyy-MM-dd")}`,
            text: `Please find attached the Trip Stop Report from ${format(timeRange.start, "yyyy-MM-dd")} to ${format(timeRange.end, "yyyy-MM-dd")}`,
            attachments: [
              {
                filename: `trip_stop_report_${format(timeRange.start, "yyyy-MM-dd")}_to_${format(timeRange.end, "yyyy-MM-dd")}.pdf`,
                content: Buffer.from(pdfBuffer),
                contentType: "application/pdf"
              }
            ]
          });
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          throw new Error(`Failed to send email: ${emailError.message}`);
        }

        return res.status(200).json({
          status: "success",
          message: `Report generated and sent to ${emailRecipients.join(", ")}`,
          details: {
            report_type: params.report_type,
            time_range: {
              start: format(timeRange.start, "yyyy-MM-dd"),
              end: format(timeRange.end, "yyyy-MM-dd"),
              source: params.rep_time_period
                ? "server_generated"
                : params.rep_interval && params.rep_int_len
                  ? "calculated"
                  : "manual"
            },
            total_vehicles: parsedData.data.length,
            generated_at: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
            period_details: params.rep_time_period
              ? {
                  interval_type: params.rep_interval,
                  interval_length: params.rep_int_len,
                  schedule_time: params.rep_time_period.sched_time
                }
              : undefined
          }
        });
      }

      // If no email recipients, return data analysis instead of PDF
      return res.status(200).json({
        status: "success",
        message: "Report generated successfully",
        details: {
          report_type: params.report_type,
          time_range: {
            start: format(timeRange.start, "yyyy-MM-dd"),
            end: format(timeRange.end, "yyyy-MM-dd"),
            source: params.rep_time_period
              ? "server_generated"
              : params.rep_interval && params.rep_int_len
                ? "calculated"
                : "manual"
          },
          total_vehicles: parsedData.data.length,
          generated_at: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
          period_details: params.rep_time_period
            ? {
                interval_type: params.rep_interval,
                interval_length: params.rep_int_len,
                schedule_time: params.rep_time_period.sched_time
              }
            : undefined
        }
      });
    }

    // Return raw data for analysis
    return res.status(200).json({
      status: "success",
      message: "Data analysis completed",
      data: parsedData,
      details: {
        report_type: params.report_type,
        time_range: {
          start: format(timeRange.start, "yyyy-MM-dd"),
          end: format(timeRange.end, "yyyy-MM-dd"),
          source: params.rep_time_period
            ? "server_generated"
            : params.rep_interval && params.rep_int_len
              ? "calculated"
              : "manual"
        },
        total_vehicles: parsedData.data.length,
        generated_at: format(new Date(), "yyyy-MM-dd HH:mm:ss")
      }
    });
  } catch (error) {
    console.error("Trip stop error:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    if (error.message === 'TOKEN_EXPIRED') {
      return res.status(401).json({
        status: "error",
        message: "Your token has expired"
      });
    }

    return res.status(500).json({
      status: "error",
      error: "Failed to generate report",
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}

const enrichAddressesBatch = async (entries: TripStopEntry[], token: string) => {
  // Collect all missing coordinates
  const missingCoords = [];
  const coordToEntryMap = new Map();
  
  entries.forEach((entry, index) => {
    // Check main address
    if ((!entry.address || entry.address === "null") && entry.lat && entry.lon) {
      const key = `${entry.lat},${entry.lon}`;
      if (!coordToEntryMap.has(key)) {
        missingCoords.push({ lat: entry.lat, lon: entry.lon, type: 'address', entryIndex: index });
        coordToEntryMap.set(key, { type: 'address', entryIndex: index });
      }
    }
    
    // Check next_address
    if ((!entry.next_address || entry.next_address === "null") && entry.next_lat && entry.next_lon) {
      const key = `${entry.next_lat},${entry.next_lon}`;
      if (!coordToEntryMap.has(key)) {
        missingCoords.push({ lat: entry.next_lat, lon: entry.next_lon, type: 'next_address', entryIndex: index });
        coordToEntryMap.set(key, { type: 'next_address', entryIndex: index });
      }
    }
  });

  if (missingCoords.length === 0) {
    console.log(`[BATCH] No missing coordinates to process`);
    return entries;
  }

  console.log(`[BATCH] Processing ${missingCoords.length} missing coordinates for scheduled report`);

  // For scheduled reports, directly batch geocode (skip cache checks)
  try {
    const batchAddresses = await fetchHereAddressesBatch(missingCoords);
    
    // Cache all results
    const cacheData = batchAddresses.map(addr => ({
      lat: addr.lat,
      lng: addr.lon,
      a: addr.address
    }));
    
    if (cacheData.length > 0) {
      await serverAddressCacheAdd(token, cacheData);
      console.log(`[BATCH] Cached ${cacheData.length} addresses for scheduled report`);
    }
    
    // Update entries with batch results
    batchAddresses.forEach(addr => {
      const key = `${addr.lat},${addr.lon}`;
      const mapping = coordToEntryMap.get(key);
      if (mapping) {
        const entry = entries[mapping.entryIndex];
        if (mapping.type === 'address') {
          entry.address = addr.address;
        } else if (mapping.type === 'next_address') {
          entry.next_address = addr.address;
        }
      }
    });
    
  } catch (error) {
    console.error('[BATCH] Error in batch geocoding, falling back to individual processing:', error);
    return await enrichAddresses(entries, token);
  }

  return entries;
};

const enrichAddresses = async (entries: TripStopEntry[], token: string) => {
  const enrichedEntries = await Promise.all(
    entries.map(async (entry, index) => {
      try {
        // Proses address utama
        if ((!entry.address || entry.address === "null") && entry.lat && entry.lon) {
          const lat = entry.lat;
          const lon = entry.lon;
          
          // For scheduled reports, skip cache check and directly geocode
          console.log(`[SCHEDULED] Skipping cache check for lat:${lat}, lon:${lon}`);
          const hereAddress = await fetchAddress(lat, lon);

          if (hereAddress?.address?.label) {
            entry.address = hereAddress.address.label
              .replace(/[^\x00-\x7F]/g, "")
              .replace(/\u00A0/g, " ")
              .normalize("NFKC");
            await serverAddressCacheAdd(token, [
              {
                lat,
                lng: lon,
                a: entry.address
              }
            ]);
            console.log(`[SCHEDULED] Cached new address for lat:${lat}, lon:${lon}`);
          }
        }

        // Proses next_address
        if (
          (!entry.next_address || entry.next_address === "null") &&
          entry.next_lat &&
          entry.next_lon
        ) {
          const nextLat = entry.next_lat;
          const nextLon = entry.next_lon;
          
          // For scheduled reports, skip cache check and directly geocode
          console.log(`[SCHEDULED] Skipping cache check for next_address lat:${nextLat}, lon:${nextLon}`);
          const hereNextAddress = await fetchAddress(nextLat, nextLon);

          if (hereNextAddress?.address?.label) {
            entry.next_address = hereNextAddress.address.label;
            await serverAddressCacheAdd(token, [
              {
                lat: nextLat,
                lng: nextLon,
                a: entry.next_address
              }
            ]);
            console.log(`[SCHEDULED] Cached new next_address for lat:${nextLat}, lon:${nextLon}`);
          }
        }
      } catch (error) {
        console.error("Error in entry processing:", {
          entryIndex: index,
          error: error.message,
          stack: error.stack
        });
      }

      return entry;
    })
  );

  return enrichedEntries;
};
