import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { jwtDecode } from 'jwt-decode';

import { settingList, settingUpdate } from '@/models/setting';
import { refreshTokenModel } from '@/models/user_profile';
import { apiDeveloperRefreshToken } from '@/models/common';
import { apiManagerRefreshToken } from '@/models/manager/common';
import { relogin } from '@/lib/auth';
import { clearAllAuthData } from '@/lib/clear-auth-data';

// Define storage keys at the top of the file
const STORAGE_KEYS = {
  USER: 'userData-client',
  MANAGER: 'userData-manager',
  DEVELOPER: 'userData-developer',
  CURRENT_ROLE: 'current-role' // To track which role is active in the current tab
};

export interface Setting {
  title: string
  value: string | boolean | number
}

export interface User {
  token: string | null
  username: string | null
  password: string | null
  customer: string | null
  role?: 'manager' | 'user' | 'developer'
  manager?: string | null
  isClientView?: boolean
  userId?: string | number
  userTypeId?: number
}

interface UserContextType {
  models: {
    user: User | null
    userProfileData: User | null
    settings: Setting[] | null
  }
  operations: {
    setUser: (user: Partial<User>) => void
    setUserWithProfile: (user: Partial<User>) => Promise<void>
    clearUser: () => void
    setSettings: (settings: Setting[]) => void
    refreshToken: () => void
    getUserRef: () => User | null
    checkAndRefreshToken: () => Promise<boolean>
  }
}

// AUTO-CLEAR OLD USER DATA ON APP LOAD (for migration/loop fix)
const APP_VERSION = '2025-10-15'; // Change this on every major deployment
if (typeof window !== 'undefined') {
  if (localStorage.getItem('app-version') !== APP_VERSION) {
    // Clear all auth-related data using centralized function
    clearAllAuthData();
    
    // Clear temporary data
    localStorage.removeItem('temp-userData-client');
    
    // Set new app version
    localStorage.setItem('app-version', APP_VERSION);
    window.location.reload();
  }
}

const UserContext = createContext<UserContextType>({
  models: {
    user: null,
    settings: null,
    userProfileData: null,
  },
  operations: {
    setUser: () => {},
    setUserWithProfile: () => Promise.resolve(),
    clearUser: () => {},
    setSettings: () => {},
    refreshToken: () => {},
    getUserRef: () => null,
    checkAndRefreshToken: () => Promise.resolve(false),
  },
});

const defaultSettings: Setting[] = [
  { title: 'time_format', value: 'HH:mm:ss' },
  { title: 'language', value: 'en' },
  { title: 'date_format', value: 'dd-MM-yyyy' },
  { title: 'unit_volume', value: 'l' },
  { title: 'unit_distance', value: 'km' },
];

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null); // Initialize as null
  const userRef = useRef<User | null>(user);
  const [settings, setSettingsState] = useState<Setting[]>([]);

  const [userProfileData, setUserProfileData] = useState(null);
  const dataFetchedRef = useRef(false);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // New function to handle login with complete profile data
  const handleLoginWithProfile = useCallback(async (loginData: Partial<User>) => {
    
    // For manager, just set user directly (no need for profile fetch)
    if (loginData.role === 'manager') {
      handleSetUser(loginData);
      return;
    }
    
    // For user role, fetch profile first
    if (loginData.role === 'user' && loginData.token) {
      try {
        const { getMyProfile } = await import('@/models/users');
        const profile = await getMyProfile(loginData.token);
        
        const userTypeId = profile?.user?.type;
        const userId = profile?.user?.id;
                
        // Set user with complete data including userId and userTypeId
        const completeUserData = {
          ...loginData,
          userId,
          userTypeId
        };
        
        handleSetUser(completeUserData);
        
      } catch (error) {
        console.error('Failed to fetch user profile during login:', error);
        // Fallback: set user without profile data
        handleSetUser(loginData);
      }
    } else {
      // Fallback for other cases
      handleSetUser(loginData);
    }
  }, []);

  const handleSetUser = useCallback((newUser: Partial<User>) => {
    setUserState((prevUser) => {
      const updatedUser = { ...prevUser, ...newUser };
      
      // Determine which storage key to use based on role
      const storageKey = updatedUser.role === 'manager'
        ? STORAGE_KEYS.MANAGER
        : updatedUser.role === 'developer'
          ? STORAGE_KEYS.DEVELOPER
          : STORAGE_KEYS.USER;
      
      // Store only necessary data based on role
      const storageData = {
        token: updatedUser.token,
        username: updatedUser.username,
        password: updatedUser.password,
        role: updatedUser.role,
        manager: updatedUser.role === 'manager' ? updatedUser.manager : null,
        customer: updatedUser.role === 'user' || updatedUser.role === 'developer' ? updatedUser.customer : null,
        userId: updatedUser.userId,
        userTypeId: updatedUser.userTypeId
      };

      if (updatedUser.token) {
        // Store in role-specific localStorage (don't overwrite other role's data)
        localStorage.setItem(storageKey, JSON.stringify(storageData));
        
        // Track current active role for this tab
        localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, updatedUser.role || 'user');
        
        // Store in cookies with proper encoding
        const encodedData = encodeURIComponent(JSON.stringify(storageData));
        document.cookie = `${storageKey}=${encodedData}; path=/; max-age=86400`;
      }
      
      return updatedUser;
    });
  }, []);

  const handleClearUser = useCallback(() => {
    // Clear ALL user-related data using centralized function
    clearAllAuthData();
    
    // Clear React state
    setUserState(null);
    setSettingsState([]);
  }, []);

  // Special function to update only the token without replacing the entire user object
  const updateToken = useCallback((newToken: string) => {
    setUserState(prev => {
      if (!prev) return prev;
      const updatedUser = { ...prev, token: newToken };
      // Update storage/cookie for current role only
      const storageKey = updatedUser.role === 'manager' 
        ? STORAGE_KEYS.MANAGER 
        : STORAGE_KEYS.USER;
      const storageData = {
        token: updatedUser.token,
        username: updatedUser.username,
        password: updatedUser.password,
        role: updatedUser.role,
        manager: updatedUser.role === 'manager' ? updatedUser.manager : null,
        customer: updatedUser.role === 'user' ? updatedUser.customer : null
      };
      localStorage.setItem(storageKey, JSON.stringify(storageData));
      const encodedData = encodeURIComponent(JSON.stringify(storageData));
      document.cookie = `${storageKey}=${encodedData}; path=/; max-age=86400`;
      return updatedUser;
    });
  }, []);

  const refreshToken = useCallback(async () => {
    const userData = userRef.current;
    if (userData?.token) {
      try {
        let refreshedData;
        
        // Use different refresh token endpoint based on role
        if (userData.role === 'manager') {
          refreshedData = await apiManagerRefreshToken();
        } else if (userData.role === 'developer') {
          refreshedData = await apiDeveloperRefreshToken();
        } else {
          refreshedData = await refreshTokenModel(userData.token);
        }

        if (refreshedData) {
          // Update token di context dan storage tanpa replace user object
          updateToken(refreshedData.access_token);
          return refreshedData;
        } else {
          console.error('Failed to refresh token: No refreshed token returned.');
          throw new Error('Failed to refresh token');
        }
      } catch (error: unknown) {
        console.error('Refresh token error:', error);
        
        // If token has expired, force logout immediately
        if (error && typeof error === 'object' && 'msg' in error && error.msg === 'Token has expired') {
          console.warn('Token has expired, forcing logout');
          handleClearUser();
          // Force redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/auth-login';
          }
          return;
        }
        
        // If other refresh/re-login failed, try relogin but don't force redirect
        if (error && typeof error === 'object' && 'msg' in error && error.msg !== 'Token has expired') {
          try {
            await relogin();
          } catch (reloginError) {
            console.error('Relogin failed during refresh:', reloginError);
            // Don't force redirect, let the app handle it gracefully
          }
        }
        throw error;
      }
    } else {
      console.warn('No token available to refresh');
      handleClearUser();
      // Don't force redirect, let the app handle it gracefully
      // window.location.assign('/');
    }
  }, [updateToken, handleClearUser]);

  // Decode token to get the exp value
  const getTokenExpirationTime = useCallback((token: string) => {
    try {
      const decoded = jwtDecode(token);
      const expTime = decoded.exp ? decoded.exp * 1000 : null; // Convert to millisecond
      return expTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }, []);

  // Validate if token is still valid
  const validateToken = useCallback((token: string) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Determine which storage to use based on URL path first, then current role
      const isManagerPath = window.location.pathname.includes('/manager');
      const isDeveloperPath = window.location.pathname.includes('/developer');
      
      // Priority: URL path > current role > default to user
      let storageKey = STORAGE_KEYS.USER; // default
      let expectedRole: 'manager' | 'user' | 'developer' = 'user';
      
      if (isManagerPath) {
        storageKey = STORAGE_KEYS.MANAGER;
        expectedRole = 'manager';
      } else if (isDeveloperPath) {
        storageKey = STORAGE_KEYS.DEVELOPER;
        expectedRole = 'developer';
      } else {
        storageKey = STORAGE_KEYS.USER;
        expectedRole = 'user';
      }
      
      const storedUserData = localStorage.getItem(storageKey);
      
      if (storedUserData) {
        try {
          const parsedData = JSON.parse(storedUserData);
          
                    // Validate that the stored data matches the expected role and token is valid
          if (parsedData.role === expectedRole && parsedData.token) {
            // Check if token is still valid
            if (validateToken(parsedData.token)) {
              const initialUserState = {
                token: parsedData.token || null,
                username: parsedData.username || null,
                password: parsedData.password || null,
                role: parsedData.role || null,
                manager: parsedData.role === 'manager' ? parsedData.manager : null,
                customer: parsedData.role === 'user' ? parsedData.customer : null,
                userId: parsedData.userId || null,
                userTypeId: parsedData.userTypeId || null
              };

              setUserState(initialUserState);
              userRef.current = initialUserState;
              
              // Update current role for this tab
              localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, parsedData.role);
            } else {
              console.warn('Token has expired, clearing ALL user data');
              // Clear ALL expired token data using centralized function
              clearAllAuthData();
              // Set user state to null to prevent any rendering with expired data
              setUserState(null);
            }
          } else {
            console.warn(`Role mismatch or no token: expected ${expectedRole}, got ${parsedData.role}. Clearing user data.`);
            handleClearUser();
          }
        } catch (error) {
          console.error('Error parsing userData from localStorage:', error);
          handleClearUser();
        }
      } else {
        // No data found for expected role, check if we have data for the other role(s)
        const otherStorageKey = isManagerPath ? STORAGE_KEYS.USER : isDeveloperPath ? STORAGE_KEYS.USER : STORAGE_KEYS.MANAGER;
        const otherStoredData = localStorage.getItem(otherStorageKey);
        
        if (otherStoredData) {
          try {
            const otherParsedData = JSON.parse(otherStoredData);
            if (otherParsedData.token && otherParsedData.role) {
              // Check if the other role's token is still valid
              if (validateToken(otherParsedData.token)) {
                // We have valid data for the other role, use it
                const initialUserState = {
                  token: otherParsedData.token || null,
                  username: otherParsedData.username || null,
                  password: otherParsedData.password || null,
                  role: otherParsedData.role || null,
                  manager: otherParsedData.role === 'manager' ? otherParsedData.manager : null,
                  customer: otherParsedData.role === 'user' ? otherParsedData.customer : null,
                  userId: otherParsedData.userId || null,
                  userTypeId: otherParsedData.userTypeId || null
                };

                setUserState(initialUserState);
                userRef.current = initialUserState;
                
                // Update current role for this tab
                localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, otherParsedData.role);
              } else {
                console.warn('Other role token has expired, clearing ALL data');
                // Clear ALL expired token data using centralized function
                clearAllAuthData();
                // Set user state to null to prevent any rendering with expired data
                setUserState(null);
              }
            } else {
              localStorage.removeItem(STORAGE_KEYS.CURRENT_ROLE);
            }
          } catch (error) {
            console.error('Error parsing other role data:', error);
            localStorage.removeItem(STORAGE_KEYS.CURRENT_ROLE);
          }
        } else {
          // No data found for any role, clear current role
          localStorage.removeItem(STORAGE_KEYS.CURRENT_ROLE);
        }
      }
    }
  }, []); // Empty dependency array for initialization

  useEffect(() => {
    if (user?.token) {
      const expirationTime = getTokenExpirationTime(user.token);
      if (expirationTime) {
        const currentTime = Date.now();
        const timeUntilExpiration = expirationTime - currentTime;

        const isManagerToken = localStorage.getItem('is-manager-token') === 'true';
        
        const refreshTime = isManagerToken 
          ? Math.max(timeUntilExpiration * 0.5, 10000)
          : Math.max(timeUntilExpiration - 60000, timeUntilExpiration * 0.5);

        // const refreshTime = 20000;
              
        if (refreshTime > 0) {
          const timeoutId = setTimeout(() => {
            refreshToken();
          }, refreshTime);
          return () => clearTimeout(timeoutId);
        } else {
          refreshToken();
        }
      }
    }
  }, [user?.token, getTokenExpirationTime, refreshToken]);


  const handleSetSettings = useCallback(
    async (newSettings: Setting[]) => {
      if (!userRef.current?.token) return;

      const updatedSettings = [...settings];

      for (const newSetting of newSettings) {
        const storedSetting = updatedSettings.find((setting) => setting.title === newSetting.title);
        if (!storedSetting || storedSetting.value !== newSetting.value) {
          const settingIndex = updatedSettings.findIndex(
            (setting) => setting.title === newSetting.title
          );

          if (settingIndex !== -1) {
            updatedSettings[settingIndex] = newSetting;
          } else {
            updatedSettings.push(newSetting);
          }

          try {
            await settingUpdate(userRef.current.token, newSetting.title, String(newSetting.value));
          } catch (error) {
            console.error(`Error updating setting ${newSetting.title}:`, error);
          }
        }
      }

      setSettingsState(updatedSettings);
    },
    [settings]
  );

  // Fetch settings when token is available
  useEffect(() => {
    if (user?.token) {
      const fetchUserSettings = async () => {
        try {
          // If user is a manager, use default settings without API call
          if (user.role === 'manager') {
            setSettingsState(defaultSettings);
            return;
          }

          const data = await settingList(user.token);
          if (data && data.items) {
            let updatedSettings = [...defaultSettings];
            
            // Safely access data using optional chaining
            const timeFormat = data.items?.find((item) => item.key === 'time_format');
            const language = data.items?.find((item) => item.key === 'language');
            const dateFormat = data.items?.find((item) => item.key === 'date_format');
            const unitVolume = data.items?.find((item) => item.key === 'unit_volume');
            const unitDistance = data.items?.find((item) => item.key === 'unit_distance');

            if (timeFormat) {
              updatedSettings = updatedSettings.map((setting) =>
                setting.title === 'time_format' ? { ...setting, value: timeFormat.vle } : setting
              );
            }
            if (language) {
              updatedSettings = updatedSettings.map((setting) =>
                setting.title === 'language' ? { ...setting, value: language.vle } : setting
              );
            }
            if (dateFormat) {
              updatedSettings = updatedSettings.map((setting) =>
                setting.title === 'date_format' ? { ...setting, value: dateFormat.vle } : setting
              );
            }
            if (unitVolume) {
              updatedSettings = updatedSettings.map((setting) =>
                setting.title === 'unit_volume' ? { ...setting, value: unitVolume.vle } : setting
              );
            }
            if (unitDistance) {
              updatedSettings = updatedSettings.map((setting) =>
                setting.title === 'unit_distance'
                  ? { ...setting, value: unitDistance.vle }
                  : setting
              );
            }
            setSettingsState(updatedSettings);
          } else {
            setSettingsState(defaultSettings);
          }
        } catch (error) {
          console.error('Error fetching client info:', error);
          setSettingsState(defaultSettings);
        }
      };
      fetchUserSettings();
    }
  }, [user?.token, user?.role]);

  // Listener for cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Check if the changed storage key is relevant to our context
      if (event.key === STORAGE_KEYS.USER || event.key === STORAGE_KEYS.MANAGER) {
        // Only update if the changed key matches our current context
        const isManagerPath = window.location.pathname.includes('/manager');
        const relevantKey = isManagerPath ? STORAGE_KEYS.MANAGER : STORAGE_KEYS.USER;
        
        if (event.key === relevantKey) {
          const newUserData = event.newValue ? JSON.parse(event.newValue) : null;
          setUserState((prevUser) => ({
            ...prevUser,
            token: newUserData ? newUserData.token : null,
          }));

          if (!newUserData) {
            setSettingsState([]);
          }
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    if (!dataFetchedRef.current) {
      // Determine which storage to use based on URL path first, then current role
      const isManagerPath = window.location.pathname.includes('/manager');
      
      let storageKey = STORAGE_KEYS.USER; // default
      let expectedRole = 'user';
      
      if (isManagerPath) {
        storageKey = STORAGE_KEYS.MANAGER;
        expectedRole = 'manager';
      } else {
        // For non-manager paths, always use user data
        storageKey = STORAGE_KEYS.USER;
        expectedRole = 'user';
      }
      
      const storedUserData = localStorage.getItem(storageKey);

      if (storedUserData) {
        try {
          const parsedData = JSON.parse(storedUserData);
          
          // Validate that the stored data matches the expected role and token is valid
          if (parsedData.token && parsedData.username && parsedData.role === expectedRole) {
            // Check if token is still valid
            if (validateToken(parsedData.token)) {
              const userData: User = {
                username: parsedData.username,
                token: parsedData.token,
                password: parsedData.password,
                customer: parsedData.customer,
                role: parsedData.role,
                manager: parsedData.manager,
                userId: parsedData.userId,
                userTypeId: parsedData.userTypeId
              };

              // Set data ke state
              setUserProfileData(userData);
              dataFetchedRef.current = true;
            } else {
              console.error('Token has expired in userData, clearing data');
              localStorage.removeItem(storageKey);
            }
          } else {
            console.error('Invalid userData in localStorage or role mismatch', parsedData);
          }
        } catch (error) {
          console.error('Error parsing userData from localStorage:', error);
        }
      } else {
        console.error('No userData found in localStorage for expected role:', expectedRole);
      }
    }
  }, []);

  useEffect(() => {
    if (user?.token && !dataFetchedRef.current) {
      fetchUserData();
    }
  }, [user?.token, fetchUserData]);

  // Add debug logging to getUserRef
  const getUserRef = useCallback(() => {
    return userRef.current;
  }, []);

  const checkAndRefreshToken = useCallback(async () => {
    const userData = userRef.current;
    if (userData?.token) {
      const expirationTime = getTokenExpirationTime(userData.token);
      if (expirationTime) {
        const currentTime = Date.now();
        const timeUntilExpiration = expirationTime - currentTime;
        
        if (timeUntilExpiration < 30000) {
          console.warn('Token will expire soon, refreshing...');
          try {
            await refreshToken();
            return true; 
          } catch (error) {
            console.error('Failed to refresh token:', error);
            return false; 
          }
        }
      }
    }
    return false;
  }, [getTokenExpirationTime, refreshToken]);

  useEffect(() => {
  const fetchAndSetUserTypeId = async () => {
    
    if (user?.token && user?.role === 'user' && (user.userTypeId === undefined || user.userId === undefined || user.userTypeId === null || user.userId === null)) {
      try {
        const { getMyProfile } = await import('@/models/users');
        const profile = await getMyProfile(user.token);
        
        const userTypeId = profile?.user?.type;
        const userId = profile?.user?.id;
        
        if (userTypeId !== undefined || userId !== undefined) {
          setUserState(prev => prev ? { ...prev, userTypeId, userId } : prev);
          // Only update storage if we're in user context
          const isManagerPath = window.location.pathname.includes('/manager');
          if (!isManagerPath) {
            const storageKey = STORAGE_KEYS.USER;
            const storedUserData = localStorage.getItem(storageKey);
            if (storedUserData) {
              const parsed = JSON.parse(storedUserData);
              if (userTypeId !== undefined) parsed.userTypeId = userTypeId;
              if (userId !== undefined) parsed.userId = userId;
              localStorage.setItem(storageKey, JSON.stringify(parsed));
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch user profile for type id', e);
      }
    }
  };
  fetchAndSetUserTypeId();
}, [user?.token, user?.role]);

  return (
    <UserContext.Provider
      value={{
        models: {
          user,
          settings,
          userProfileData,
        },
        operations: {
          setUser: handleSetUser,
          setUserWithProfile: handleLoginWithProfile,
          clearUser: handleClearUser,
          setSettings: handleSetSettings,
          refreshToken,
          getUserRef,
          checkAndRefreshToken,
        },
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
