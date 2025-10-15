'use client';

import { clearAllAuthData } from '@/lib/clear-auth-data';

interface RequestBody {
  jsonrpc: string;
  method: string;
  id: string;
  params?: Record<string, unknown>;
}

interface ApiErrorResponse {
  error?: {
    data?: {
      message?: string;
    };
    message?: string;
  };
}

export const apiManagerRequest = async (_token: string | null, method: string, params?: Record<string, unknown>) => {
  // Get token from the manager storage
  const userData = JSON.parse(localStorage.getItem("userData-manager") || "{}");
  const latestToken = userData.token || _token;

  if (!latestToken) {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_TRACEGRID_API_URL + '/tracegrid_api/manager';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${latestToken}`
  };

  const methodsWithCustomParams = {
    'session.select_customer': (params: Record<string, unknown>) => ({ customer_id: params.id }),
    'customer.available_gui_elements': (params: Record<string, unknown>) => ({ customer_id: params.customer_id }),
    'customer.set_disabled_gui_elements': (params: Record<string, unknown>) => ({ 
      customer_id: params.customer_id, 
      report_id: params.report_id 
    }),
  };

  const body: RequestBody = {
    jsonrpc: '2.0',
    method: method,
    id: '1'
  };

  if (methodsWithCustomParams[method]) {
    body.params = methodsWithCustomParams[method](params);
  } 
  else if (params) {
    body.params = params;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      // Handle authentication errors for manager API
      if (response.status === 401 || response.status === 403 || response.status === 500) {
        try {
          const errorText = await response.text();
          
          try {
            const errorResponse: ApiErrorResponse = JSON.parse(errorText);
            
            if (errorResponse.error && 
                errorResponse.error.data && 
                errorResponse.error.data.message === "Signature has expired") {
              // Throw error with specific message instead of immediate logout
              throw new Error('TOKEN_EXPIRED');
            }
          } catch {
            // If not JSON, check if it's a simple "Signature has expired" text
            if (errorText.includes("Signature has expired")) {
              throw new Error('TOKEN_EXPIRED');
            }
          }
        } catch (error) {
          // If it's our token expired error, re-throw it
          if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
            throw error;
          }
          // Continue with normal error handling for other errors
        }
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    
    // Check for token expiration in response
    try {
      const jsonResponse: ApiErrorResponse = JSON.parse(responseText);
      
      if (jsonResponse.error && 
          jsonResponse.error.data && 
          jsonResponse.error.data.message === "Signature has expired") {
        // Throw error with specific message instead of immediate logout
        throw new Error('TOKEN_EXPIRED');
      }
    } catch (parseError) {
      // If it's our token expired error, re-throw it
      if (parseError instanceof Error && parseError.message === 'TOKEN_EXPIRED') {
        throw parseError;
      }
      // If not JSON or other parse error, continue with original response
    }

    return responseText;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

export const apiManagerAuth = async (username: string, password: string, manager: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_TRACEGRID_API_URL}/tracegrid_api/manager/auth_login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password,
        manager: manager
      })
    }
  );

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(
      `HTTP error! status: ${response.status}, message: ${errorResponse.message}`
    );
  }

  return await response.json();
};

// Add new refresh token function for manager
export const apiManagerRefreshToken = async () => {
  // Get token from the manager storage
  const userData = JSON.parse(localStorage.getItem("userData-manager") || "{}");
  const { token } = userData;

  if (!token) {
    throw new Error('No token available for refresh');
  }

  const url = `${process.env.NEXT_PUBLIC_TRACEGRID_API_URL}/tracegrid_api/manager/auth_refresh`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers
    });

    const dataResponse = await response.json();

    if (!response.ok) {
      // Check dataResponse directly since we already have it parsed
      
      // If token has expired, clear localStorage and redirect
      if (dataResponse.error?.message === 'Token has expired' || 
          (dataResponse.error?.data && dataResponse.error.data.message === 'Signature has expired')) {
        
        // Clear all auth-related data using centralized function
        clearAllAuthData();
        
        if (typeof window !== 'undefined') {
          // Get current locale from URL or default to 'en'
          const currentPath = window.location.pathname;
          const localeMatch = currentPath.match(/^\/([a-z]{2})\//);
          const currentLocale = localeMatch ? localeMatch[1] : 'en';
          const redirectUrl = `/${currentLocale}/manager/login`;
          window.location.href = redirectUrl;
        }
        throw new Error('Token expired');
      }
      

      throw new Error(dataResponse.error?.message || 'Refresh token failed');
    }

    // Update localStorage with new token
    const updatedUserData = {
      ...userData,
      token: dataResponse.access_token
    };
    localStorage.setItem('userData-manager', JSON.stringify(updatedUserData));

    return dataResponse;
  } catch (error) {
    console.error('Manager Refresh Token Error:', error);
    throw error;
  }
};
