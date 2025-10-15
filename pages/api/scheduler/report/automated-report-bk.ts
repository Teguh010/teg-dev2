import type { NextApiRequest, NextApiResponse } from 'next';
import { format as autoDateFormat, subDays } from 'date-fns';

type ResponseData = {
  message?: string
  error?: string
  emails?: string[]
  data?: any
  details?: string | {
    report_type?: string
    params?: any
    timestamp?: string
  }
  stack?: string
  timestamp?: string
}

const apiAuth = async (username: string, password: string, customer: string) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_TRACEGRID_API_URL}/tracegrid_api/client/auth_login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username,
      password,
      customer
    })
  });

  if (!response.ok) {
    const errorResponse = await response.json();
    console.error('Auth error:', errorResponse);
    throw new Error(`Auth failed: ${response.status}`);
  }

  return await response.json();
};

// Tambahkan fungsi untuk mendapatkan nama kendaraan
const getVehicleNames = async (token: string) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_TRACEGRID_API_URL}/tracegrid_api/client`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      id: "1",
      jsonrpc: "2.0",
      method: "object.list",
      params: { with_archived: false, without_virtual: true }
    })
  });

  if (!response.ok) throw new Error('Failed to get vehicle list');
  
  const data = await response.json();
  const vehicles = JSON.parse(data.result); // Parse string JSON menjadi array
  
  return new Map(vehicles.map(v => [v.id, v.name]));
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Ambil token dari header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token format' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validasi payload
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: "Invalid payload",
        message: "Payload must be a JSON object"
      });
    }

    const { 
      params = {
        report_type: 'trip_stop_report',
        vehicle_ids: [0],
        time_range: {
          start: subDays(new Date(), 2),
          end: new Date()
        },
        emails: []
      },
    } = req.body;

    // Validasi report_type
    const validReportTypes = [
      'trip_stop_report', 
      'maintenance_report', 
      'fuel_usage_report',
      'report_ok',
      'report_fail'
    ];
    if (!params.report_type || !validReportTypes.includes(params.report_type)) {
      return res.status(400).json({ 
        error: 'Invalid report type',
        message: `Valid report types are: ${validReportTypes.join(', ')}`
      });
    }

    // Validasi params
    if (!params || typeof params !== 'object') {
      return res.status(400).json({
        error: "Invalid params",
        message: "Params must be a JSON object"
      });
    }

    // Validasi time_range
    if (!params.time_range || typeof params.time_range !== 'object') {
      return res.status(400).json({
        error: "Invalid time_range",
        message: "time_range must be a JSON object with start and end dates"
      });
    }
    if (!params.time_range.start || !params.time_range.end) {
      return res.status(400).json({
        error: "Missing time_range values",
        message: "time_range must include both start and end dates"
      });
    }

    // Validasi emails
    if (!params.emails || !Array.isArray(params.emails)) {
      return res.status(400).json({
        error: "Invalid emails",
        message: "emails must be an array of strings"
      });
    }

    if (params.report_type === 'report_ok') {
      return res.status(200).json({
        message: 'Test success - report_ok type requested',
        data: { test: true }
      });
    }
    if (params.report_type === 'report_fail') {
      throw new Error('Test failure - report_fail type requested');
    }

    // Map report_type ke method yang sesuai
    const methodMap = {
      trip_stop_report: 'object.trip_stop',
      maintenance_report: 'object.maintenance',
      fuel_usage_report: 'object.fuel_usage'
    };

    const apiParams = {
      object_id: params.vehicle_ids || [0],
      time_from: autoDateFormat(params.time_range.start, "yyyy-MM-dd 00:00:00"),
      time_to: autoDateFormat(params.time_range.end, "yyyy-MM-dd 23:59:59")
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_TRACEGRID_API_URL}/tracegrid_api/client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: '1',
        jsonrpc: '2.0',
        method: methodMap[params.report_type],
        params: apiParams
      })
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      console.error('API Error:', errorResponse);

      const errorMessage = errorResponse.error?.data?.message || errorResponse.error?.message || 'Unknown error';
      throw new Error(`API request failed: ${response.status} - ${errorMessage}`);
    }

    const rawData = await response.json();


    if (!rawData.result) {
      throw new Error('Invalid API response: result is missing');
    }

    const parsedData = {
      id: rawData.id,
      jsonrpc: rawData.jsonrpc,
      result: JSON.parse(rawData.result),
      error: rawData.error
    }

    if (parsedData.error) {
      throw new Error(parsedData.error.message || 'Failed to generate report')
    }

    // Tambahkan fungsi untuk mendapatkan nama kendaraan
    const vehicleMap = await getVehicleNames(token);

    // Modifikasi sebelum mengirim ke trip-stop:
    const enrichedData = {
      ...parsedData.result,
      data: parsedData.result.data.map(vehicle => ({
        ...vehicle,
        vehicleName: vehicleMap.get(vehicle.objectid) || `Unknown Vehicle (ID: ${vehicle.objectid})`
      }))
    };

    // Forward to trip_stop endpoint
    const tripStopUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/api/scheduler/report/trip-stop'
      : `${process.env.NEXT_PUBLIC_APP_URL}/api/scheduler/report/trip-stop`;
    
    // Forward to trip-stop dengan report_type
    const tripStopResponse = await fetch(tripStopUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        token: token,
        schedule_date: autoDateFormat(new Date(), "yyyy-MM-dd"),
        format: 'pdf',
        email: params.emails,
        data: {
          ...enrichedData,
          params: params  // Ensure params is included in the data object
        }
      })
    });

    if (!tripStopResponse.ok) {
      const errorText = await tripStopResponse.text();
      console.error('Trip stop error response:', {
        status: tripStopResponse.status,
        statusText: tripStopResponse.statusText,
        body: errorText
      });
      throw new Error(`Trip stop failed: ${tripStopResponse.status} - ${errorText}`);
    }

    const tripStopResult = await tripStopResponse.json();
    return res.status(200).json({
      message: 'Report generated and sent successfully',
      data: tripStopResult
    });

  } catch (error: any) {
    console.error('Detailed error:', error);
    console.error('Error stack:', error.stack);

    const errorResponse: ResponseData = {
      error: "Report generation failed",
      message: error.message,
      details: {
        report_type: req.body?.params?.report_type || 'unknown',
        params: req.body?.params || {},
        timestamp: new Date().toISOString()
      }
    };

    return res.status(500).json(errorResponse);
  }
}
