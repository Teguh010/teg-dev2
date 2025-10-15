"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import LocationMap from "./LocationMap";
import DatePickerSingle from "@/components/date-picker-single";
import DynamicInput from "@/app/[locale]/(dashboard)/(reports)/map-route/components/input-form/custom-input2";
import TransportModeSelect from "@/app/[locale]/(dashboard)/(reports)/scheduled/components/custom-seleect";
import SearchableSelect from '@/components/ui/searchable-select';
import { workersList, statusesList, prioritiesList, taskTypesList, TaskFormData } from "@/models/task";
import { useTranslation } from 'react-i18next';

interface LocationData {
  startLocation: { lat: number; lon: number } | null;
  endLocation: { lat: number; lon: number } | null;
  waypoints: { lat: number; lon: number }[];
}
import { firstUpperLetter } from "@/lib/utils";
import toast from "react-hot-toast";

import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import WaypointAutocomplete from "@/components/WaypointAutocomplete";
import { Icon } from "@iconify/react";


const getTodayString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}:00`;
};

const defaultTask: TaskFormData = {
  description: "",
  task_body: {
    task_type: 2 // Default to full route
  },
  task_time: getTodayString(),
  status_id: 1,
  priority: 1,
  memo: "",
  assigned_to: 0
};

type Worker = { worker_id: number; worker_name: string }
type Status = { id: number; name: string }
type Priority = { id: number; name: string }
type TaskType = { id: number; name: string }

interface TaskFormProps {
  onSubmit: (data: TaskFormData) => void
  loading: boolean
  initialData?: TaskFormData
  isEdit?: boolean
}

export default function TaskForm({
  onSubmit,
  loading,
  initialData,
  isEdit = false
}: TaskFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<TaskFormData>(initialData || defaultTask);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [loadingPriorities, setLoadingPriorities] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [locationData, setLocationData] = useState<LocationData>({
    startLocation: null,
    endLocation: null,
    waypoints: []
  });
  const [startLocationInput, setStartLocationInput] = useState("");
  const [endLocationInput, setEndLocationInput] = useState("");
  const [destinationLocationInput, setDestinationLocationInput] = useState("");
  // Flag untuk tracking sumber lokasi
  const [shouldZoomToStart, setShouldZoomToStart] = useState(false);
  const [shouldFitBounds, setShouldFitBounds] = useState(false);
  // State untuk waypoints dari input autocomplete
  const [waypointInputs, setWaypointInputs] = useState<Array<{ id: string; address: string; lat: number; lon: number }>>([]);
  const router = useRouter();


  const UserContext = useUser();
  const { getUserRef } = UserContext.operations;

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = useCallback(async (lat: number, lon: number): Promise<string | null> => {
    const HERE_API_KEY = process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN;
    const url = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lon}&lang=en&apiKey=${HERE_API_KEY}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].address.label;
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
    return null;
  }, []);

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      
      const taskType = initialData.task_body?.task_type || 2;
      
      if (taskType === 1 && initialData.task_body?.destination) {
        // Task Type 1: Only destination
        const destinationLocation = {
          lat: initialData.task_body.destination.latitude,
          lon: initialData.task_body.destination.longitude
        };
        
        setLocationData({
          startLocation: null,
          endLocation: destinationLocation, // Use endLocation for destination in type 1
          waypoints: []
        });
        
        // Set destination input value from coordinates using reverse geocoding
        const setDestinationInputValue = async () => {
          if (destinationLocation.lat && destinationLocation.lon) {
            const destinationAddress = await reverseGeocode(destinationLocation.lat, destinationLocation.lon);
            if (destinationAddress) setDestinationLocationInput(destinationAddress);
          }
        };
        
        setDestinationInputValue();
      } else if (taskType === 2 && initialData.task_body?.origin && initialData.task_body?.destination) {
        // Task Type 2: Full route with origin and destination
        const startLocation = {
          lat: initialData.task_body.origin.latitude,
          lon: initialData.task_body.origin.longitude
        };
        const endLocation = {
          lat: initialData.task_body.destination.latitude,
          lon: initialData.task_body.destination.longitude
        };
        
        setLocationData({
          startLocation,
          endLocation,
          waypoints: initialData.task_body.waypoints?.map(wp => ({
            lat: wp.latitude,
            lon: wp.longitude
          })) || []
        });
        
        // Set input values from coordinates using reverse geocoding
        const setInitialInputValues = async () => {
          if (startLocation.lat && startLocation.lon) {
            const startAddress = await reverseGeocode(startLocation.lat, startLocation.lon);
            if (startAddress) setStartLocationInput(startAddress);
          }
          
          if (endLocation.lat && endLocation.lon) {
            const endAddress = await reverseGeocode(endLocation.lat, endLocation.lon);
            if (endAddress) setEndLocationInput(endAddress);
          }
        };
        
        setInitialInputValues();
      }
      
      // Clear waypoint inputs when loading initial data
      setWaypointInputs([]);
    }
  }, [initialData, reverseGeocode]);

  const fetchWorkers = useCallback(async () => {
    setLoadingWorkers(true);
    const token = getUserRef().token;
    try {
      const data = await workersList(token);
      setWorkers(data);
    } catch {
      setWorkers([]);
    }
    setLoadingWorkers(false);
  }, [getUserRef]);

  const fetchStatuses = useCallback(async () => {
    setLoadingStatuses(true);
    const token = getUserRef().token;
    try {
      const data = await statusesList(token);
      setStatuses(data);
    } catch {
      setStatuses([]);
    }
    setLoadingStatuses(false);
  }, [getUserRef]);

  const fetchPriorities = useCallback(async () => {
    setLoadingPriorities(true);
    const token = getUserRef().token;
    try {
      const data = await prioritiesList(token);
      setPriorities(data);
    } catch {
      setPriorities([]);
    }
    setLoadingPriorities(false);
  }, [getUserRef]);

  const fetchTaskTypes = useCallback(async () => {
    try {
      const data = await taskTypesList();
      setTaskTypes(data);
    } catch {
      setTaskTypes([]);
    }
  }, []);

  useEffect(() => {
    if (UserContext.models.user) {
      fetchWorkers();
      fetchStatuses();
      fetchPriorities();
    }
    // Fetch task types regardless of user (it's static data)
    fetchTaskTypes();
  }, [UserContext.models.user, fetchWorkers, fetchStatuses, fetchPriorities, fetchTaskTypes]);

  const handleChange = useCallback((name: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (value) delete newErrors[name];
      return newErrors;
    });
  }, []);

  // Handle task type change
  const handleTaskTypeChange = useCallback((value: string | number) => {
    const taskType = Number(value);
    const previousTaskType = form.task_body?.task_type || 2;
    
    setForm((prev) => ({
      ...prev,
      task_body: {
        ...prev.task_body,
        task_type: taskType
      }
    }));
    
    // Handle location data based on task type change
    if (previousTaskType === 1 && taskType === 2) {
      // Task Type 1 → 2: Keep destination as end location, clear start and waypoints
      setLocationData(prev => ({
        startLocation: null,
        endLocation: prev.endLocation, // Keep the destination as end location
        waypoints: []
      }));
      setStartLocationInput("");
      // Keep end location input (copy from destination if exists), clear destination input
      if (destinationLocationInput) {
        setEndLocationInput(destinationLocationInput);
      }
      setDestinationLocationInput("");
    } else if (previousTaskType === 2 && taskType === 1) {
      // Task Type 2 → 1: Keep end location as destination, clear start and waypoints
      setLocationData(prev => ({
        startLocation: null,
        endLocation: prev.endLocation, // Keep end as destination
        waypoints: []
      }));
      setStartLocationInput("");
      // Keep destination input (copy from end location if exists), clear end location input
      if (endLocationInput) {
        setDestinationLocationInput(endLocationInput);
      }
      setEndLocationInput("");
    } else {
      // Other cases: clear all
      setLocationData({
        startLocation: null,
        endLocation: null,
        waypoints: []
      });
      setStartLocationInput("");
      setEndLocationInput("");
      setDestinationLocationInput("");
      setWaypointInputs([]); // Clear waypoint inputs
    }
    
    // Reset zoom flags
    setShouldZoomToStart(false);
    setShouldFitBounds(false);
    
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.route;
      return newErrors;
    });
  }, [form.task_body?.task_type]);



  // Handler untuk date picker
  const handleTaskTimeChange = useCallback((date: Date | null) => {
    setForm((prev) => ({
      ...prev,
      task_time: date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
            date.getDate()
          ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
            date.getMinutes()
          ).padStart(2, "0")}:00`
        : ""
    }));
  }, []);

  // Handle location data change from HERE Maps
  const handleLocationDataChange = useCallback(async (data: LocationData) => {
    
    // Only update location data, don't trigger reverse geocoding during drag operations
    setLocationData(data);
    
    // Sync waypoint inputs with waypoints from map
    if (data.waypoints) {
      setWaypointInputs(prev => {
        const newWaypointInputs = [...prev];
        
        // Add new waypoints from map that don't exist in waypoint inputs
        data.waypoints.forEach(mapWp => {
          const exists = newWaypointInputs.some(wp => 
            Math.abs(wp.lat - mapWp.lat) < 0.000001 && 
            Math.abs(wp.lon - mapWp.lon) < 0.000001
          );
          
          if (!exists) {
            // Add new waypoint from map with reverse geocoding
            const newWaypoint = {
              id: `waypoint-map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              address: `Map waypoint (${mapWp.lat.toFixed(6)}, ${mapWp.lon.toFixed(6)})`,
              lat: mapWp.lat,
              lon: mapWp.lon
            };
            newWaypointInputs.push(newWaypoint);
            
            // Try to get address via reverse geocoding
            reverseGeocode(mapWp.lat, mapWp.lon)
              .then((address) => {
                if (address) {
                  setWaypointInputs(current => 
                    current.map(wp => 
                      wp.id === newWaypoint.id 
                        ? { ...wp, address }
                        : wp
                    )
                  );
                }
              })
              .catch((error) => {
                console.error('Error getting address for map waypoint:', error);
              });
          } else {
            console.warn('[TaskForm] Waypoint already exists:', mapWp);
          }
        });
        
        // Remove waypoints that no longer exist in map
        const filteredWaypoints = newWaypointInputs.filter(wp => 
          data.waypoints.some(mapWp => 
            Math.abs(mapWp.lat - wp.lat) < 0.000001 && 
            Math.abs(mapWp.lon - wp.lon) < 0.000001
          )
        );
        
        return filteredWaypoints;
      });
    }
  }, [reverseGeocode, waypointInputs.length]);

  // Separate effect to handle reverse geocoding when location data changes
  useEffect(() => {
    const updateAddresses = async () => {
      // Update start location input with address
      if (locationData.startLocation) {
        try {
          const address = await reverseGeocode(locationData.startLocation.lat, locationData.startLocation.lon);
          if (address) {
            setStartLocationInput(address);
          }
        } catch (error) {
          console.error('Error getting address for start location:', error);
        }
      }

      // Update end location input with address
      if (locationData.endLocation) {
        try {
          const address = await reverseGeocode(locationData.endLocation.lat, locationData.endLocation.lon);
          if (address) {
            setEndLocationInput(address);
          }
        } catch (error) {
          console.error('Error getting address for end location:', error);
        }
      }
    };

    // Only update addresses when both start and end locations are set (not during dragging)
    if (locationData.startLocation && locationData.endLocation) {
      updateAddresses();
    }
  }, [locationData.startLocation, locationData.endLocation, reverseGeocode]);

  // Reset flags setelah digunakan
  useEffect(() => {
    if (shouldFitBounds) {
      const timer = setTimeout(() => {
        setShouldFitBounds(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldFitBounds]);

  useEffect(() => {
    if (shouldZoomToStart) {
      const timer = setTimeout(() => {
        setShouldZoomToStart(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldZoomToStart]);

  // Handle start location selection from autocomplete
  const handleStartLocationSelect = useCallback((lat: number, lon: number) => {
    const startLocation = { lat, lon };
    
    // Update location data for map
    setLocationData(prev => {
      const newData = {
        ...prev,
        startLocation
      };
      
      // If end location already exists, trigger fit bounds
      if (prev.endLocation) {
        setShouldFitBounds(true);
        setShouldZoomToStart(false);
      } else {
        // If no end location yet, zoom to start
        setShouldZoomToStart(true);
        setShouldFitBounds(false);
      }
      
      return newData;
    });
  }, []);

  // Handle end location selection from autocomplete
  const handleEndLocationSelect = useCallback((lat: number, lon: number) => {
    const endLocation = { lat, lon };
    
    // Update location data for map
    setLocationData(prev => {
      const newData = {
        ...prev,
        endLocation
      };
      
      // If start location already exists, trigger fit bounds
      if (prev.startLocation) {
        setShouldFitBounds(true);
        setShouldZoomToStart(false);
      } else {
        // If no start location yet, zoom to end
        setShouldZoomToStart(false);
        setShouldFitBounds(false);
        // We could add a shouldZoomToEnd flag if needed
      }
      
      return newData;
    });
  }, []);

  // Handle destination location selection from autocomplete (for task type 1)
  const handleDestinationLocationSelect = useCallback((lat: number, lon: number) => {
    const destinationLocation = { lat, lon };
    
    // For task type 1, we store destination in endLocation
    setLocationData(prev => ({
      ...prev,
      startLocation: null, // Task type 1 doesn't have start location
      endLocation: destinationLocation,
      waypoints: [] // Task type 1 doesn't have waypoints
    }));
    
    // Zoom to destination
    setShouldZoomToStart(true); // Will zoom to destination since it's stored in endLocation
    setShouldFitBounds(false);
  }, []);

  // Handle waypoint addition from autocomplete input
  const handleAddWaypoint = useCallback((lat: number, lon: number, address: string) => {
    const newWaypoint = {
      id: `waypoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      address,
      lat,
      lon
    };
    
    // Add to waypoint inputs state
    setWaypointInputs(prev => [...prev, newWaypoint]);
    
    // Add to location data waypoints
    setLocationData(prev => ({
      ...prev,
      waypoints: [...prev.waypoints, { lat, lon }]
    }));
    
    // Trigger fit bounds to show all waypoints
    setShouldFitBounds(true);
    setShouldZoomToStart(false);
  }, []);

  // Handle waypoint removal
  const handleRemoveWaypoint = useCallback((waypointId: string) => {
    setWaypointInputs(prev => {
      const waypointToRemove = prev.find(wp => wp.id === waypointId);
      if (!waypointToRemove) return prev;
      
      // Remove from waypoint inputs
      const newWaypointInputs = prev.filter(wp => wp.id !== waypointId);
      
      // Update location data waypoints
      setLocationData(prev => ({
        ...prev,
        waypoints: prev.waypoints.filter(wp => 
          !(Math.abs(wp.lat - waypointToRemove.lat) < 0.000001 && 
            Math.abs(wp.lon - waypointToRemove.lon) < 0.000001)
        )
      }));
      
      return newWaypointInputs;
    });
  }, []);

  // Handle clear all waypoints
  const handleClearAllWaypoints = useCallback(() => {
    setWaypointInputs([]);
    setLocationData(prev => ({
      ...prev,
      waypoints: []
    }));
  }, []);

  // Handle waypoint address change (editing)
  const handleWaypointAddressChange = useCallback((waypointId: string, newAddress: string) => {
    setWaypointInputs(prev => 
      prev.map(wp => 
        wp.id === waypointId 
          ? { ...wp, address: newAddress }
          : wp
      )
    );
  }, []);

  // Handle waypoint location selection from autocomplete
  const handleWaypointLocationSelect = useCallback((waypointId: string, lat: number, lon: number) => {
    // Update waypoint with new coordinates
    setWaypointInputs(prev => 
      prev.map(wp => 
        wp.id === waypointId 
          ? { ...wp, lat, lon }
          : wp
      )
    );
    
    // Update location data waypoints
    setLocationData(prev => ({
      ...prev,
      waypoints: prev.waypoints.map((wp, index) => {
        const waypointIndex = waypointInputs.findIndex(wpInput => wpInput.id === waypointId);
        if (waypointIndex === index) {
          return { lat, lon };
        }
        return wp;
      })
    }));
    
    // Trigger fit bounds to show updated location
    setShouldFitBounds(true);
    setShouldZoomToStart(false);
    
    toast.success("Waypoint location updated!");
  }, [waypointInputs]);


  const validate = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!form.description) newErrors.description = "Description is required";
    if (!form.status_id) newErrors.status_id = "Status is required";
    if (!form.priority) newErrors.priority = "Priority is required";
    if (!form.assigned_to) newErrors.assigned_to = "Assignee is required";
    if (!form.task_time) newErrors.task_time = "Task time is required";
    if (!form.task_body?.task_type) newErrors.task_type = "Task type is required";
    
    const taskType = form.task_body?.task_type || 2;
    
    if (taskType === 1) {
      // Task Type 1: Only destination is required
      if (!locationData.endLocation) {
        newErrors.route = "Please set a destination location on the map";
      }
    } else if (taskType === 2) {
      // Task Type 2: Both start and end locations are required
      if (locationData.startLocation && !locationData.endLocation) {
        newErrors.route = "Please set an end point (B) on the map to complete the route";
      } else if (!locationData.startLocation && locationData.endLocation) {
        newErrors.route = "Please set a start point (A) on the map to complete the route";
      } else if (!locationData.startLocation && !locationData.endLocation) {
        newErrors.route = "Please set both start (A) and end (B) points on the map";
      }
    }
    
    return newErrors;
  }, [form, locationData]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const validationErrors = validate();
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) {
        toast.error("Please fill all required fields.");
        return;
      }
      
      // Format route data for API submission based on task type
      const taskType = form.task_body?.task_type || 2;
      const extendedTaskBody: {
        task_type: number;
        origin?: { lat: number; lon: number };
        destination?: { lat: number; lon: number };
        waypoints?: Array<{ lat: number; lon: number }>;
      } = {
        task_type: taskType
      };
      
      if (taskType === 1) {
        // Task Type 1: Only destination - API expects lat/lon format
        if (locationData.endLocation) {
          extendedTaskBody.destination = {
            lat: locationData.endLocation.lat,
            lon: locationData.endLocation.lon
          };
        }
      } else if (taskType === 2) {
        // Task Type 2: Full route - API expects lat/lon format for all coordinates
        if (locationData.startLocation && locationData.endLocation) {
          extendedTaskBody.origin = {
            lat: locationData.startLocation.lat,
            lon: locationData.startLocation.lon
          };
          extendedTaskBody.destination = {
            lat: locationData.endLocation.lat,
            lon: locationData.endLocation.lon
          };
          
          if (locationData.waypoints.length > 0) {
            extendedTaskBody.waypoints = locationData.waypoints.map(wp => ({
              lat: wp.lat,
              lon: wp.lon
            }));
          }
        }
      }
      
      // Log the route data for debugging
      
      onSubmit({
        ...form,
        task_body: extendedTaskBody as unknown as typeof form.task_body, // Type assertion needed due to API using lat/lon vs internal latitude/longitude
        status_id: Number(form.status_id),
        priority: Number(form.priority),
        assigned_to: Number(form.assigned_to)
      });
      toast.success("Task submitted successfully!");
    },
    [form, validate, onSubmit, locationData]
  );

  return (
    <form onSubmit={handleSubmit} className='w-full h-full'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-8 h-full'>
        <div className='flex flex-col gap-4'>
            <div>
            <TransportModeSelect
              label={t('tasks.task_type')}
              value={form.task_body?.task_type ? String(form.task_body.task_type) : ""}
              onChange={(v) => handleTaskTypeChange(v)}
              options={
                !Array.isArray(taskTypes) || taskTypes.length === 0
                  ? []
                  : taskTypes.map((tType: TaskType) => ({
                      value: String(tType.id),
                      label: tType.name
                    }))
              }
              placeholder={!Array.isArray(taskTypes) || taskTypes.length === 0
                ? t('general.no_data_available')
                : t('tasks.select_task_type')}
              disabled={!Array.isArray(taskTypes) || taskTypes.length === 0}
            />
            {errors.task_type && (
              <span className='text-xs text-red-500'>{t('general.task_type_required')}</span>
            )}
          </div>
          <div>
            <DynamicInput
              label={t('general.description')}
              value={form.description}
              onChange={(v) => handleChange("description", v)}
              type='text'
              placeholder={t('general.task_description')}
            />
            {errors.description && (
              <span className='text-xs text-red-500'>{t('general.description_required')}</span>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-500 mb-1'>
              {t('general.task_time_format')}
            </label>
            <DatePickerSingle
              value={form.task_time}
              onChange={handleTaskTimeChange}
              minDate={new Date()}
            />
            {errors.task_time && <span className='text-xs text-red-500'>{t('general.task_time_required')}</span>}
          </div>
          <TransportModeSelect
            label={t('general.status')}
            value={form.status_id ? String(form.status_id) : ""}
            onChange={(v) => handleChange("status_id", v)}
            options={
              loadingStatuses
                ? []
                : !Array.isArray(statuses) || statuses.length === 0
                  ? []
                  : statuses.map((s: Status) => ({
                      value: String(s.id),
                      label: firstUpperLetter(s.name)
                    }))
            }
            placeholder={loadingStatuses
              ? t('general.loading')
              : !Array.isArray(statuses) || statuses.length === 0
                ? t('general.no_data_available')
                : t('general.select_status')}
            disabled={loadingStatuses || !Array.isArray(statuses) || statuses.length === 0}
          />
          {errors.status_id && <span className='text-xs text-red-500'>{t('general.status_required')}</span>}
          <TransportModeSelect
            label={t('general.priority')}
            value={form.priority ? String(form.priority) : ""}
            onChange={(v) => handleChange("priority", v)}
            options={
              loadingPriorities
                ? []
                : !Array.isArray(priorities) || priorities.length === 0
                  ? []
                  : priorities.map((p: Priority) => ({
                      value: String(p.id),
                      label: firstUpperLetter(p.name)
                    }))
            }
            placeholder={loadingPriorities
              ? t('general.loading')
              : !Array.isArray(priorities) || priorities.length === 0
                ? t('general.no_data_available')
                : t('general.select_priority')}
            disabled={loadingPriorities || !Array.isArray(priorities) || priorities.length === 0}
          />
          {errors.priority && <span className='text-xs text-red-500'>{t('general.priority_required')}</span>}
          <div>
            <label className='block mb-1 text-sm font-medium text-gray-500'>{t('general.memo')}</label>
            <textarea
              className='w-full border rounded-md p-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary'
              value={form.memo}
              onChange={(e) => handleChange("memo", e.target.value)}
              placeholder={t('general.memo')}
              rows={4}
            />
          </div>
          <div>
            <SearchableSelect
              label={t('general.assign_to')}
              value={form.assigned_to ? String(form.assigned_to) : ""}
              onChange={(v) => handleChange("assigned_to", v ? Number(v) : 0)}
              options={
                loadingWorkers
                  ? []
                  : !Array.isArray(workers) || workers.length === 0
                    ? []
                    : workers.map((w: Worker) => ({
                        value: String(w.worker_id),
                        label: w.worker_name
                      }))
              }
              placeholder={loadingWorkers
                ? t('general.loading')
                : !Array.isArray(workers) || workers.length === 0
                  ? t('general.no_data_available')
                  : t('general.select_worker')}
              disabled={loadingWorkers || !Array.isArray(workers) || workers.length === 0}
            />
            {errors.assigned_to && (
              <span className='text-xs text-red-500'>{t('general.assignee_required')}</span>
            )}
          </div>
          {/* Tombol submit & cancel: hanya tampil di desktop (md ke atas) */}
          <div className="hidden md:flex w-full gap-4 mt-4">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.back();
              }}
              className='w-full'
              variant='outline'
              color='destructive'
            >
              {t('general.cancel')}
            </Button>
            <Button type='submit' disabled={loading} className='w-full'>
              {loading
                ? isEdit
                  ? t('general.updating')
                  : t('general.creating')
                : isEdit
                ? t('general.update_task')
                : t('general.create_task')}
            </Button>
          </div>
        </div>
        <div className='flex flex-col gap-2 h-full'>
          {/* Location Autocomplete Inputs - conditional based on task type */}
          <div className='grid grid-cols-1 gap-3 flex-shrink-0'>
            {form.task_body?.task_type === 1 ? (
              // Task Type 1: Only destination input
              <LocationAutocomplete
                label={t('general.destination_location')}
                placeholder={t('general.search_address_or_coordinates')}
                value={destinationLocationInput}
                onChange={setDestinationLocationInput}
                onSelectLocation={handleDestinationLocationSelect}
                icon="mdi:map-marker"
              />
            ) : (
              // Task Type 2: Start and end location inputs
              <>
                <LocationAutocomplete
                  label={t('general.start_location_a')}
                  placeholder={t('general.search_address_or_coordinates')}
                  value={startLocationInput}
                  onChange={setStartLocationInput}
                  onSelectLocation={handleStartLocationSelect}
                  icon="mdi:map-marker-radius"
                />
                <LocationAutocomplete
                  label={t('general.end_location_b')}
                  placeholder={t('general.search_address_or_coordinates')}
                  value={endLocationInput}
                  onChange={setEndLocationInput}
                  onSelectLocation={handleEndLocationSelect}
                  icon="mdi:map-marker-check"
                />
                {/* Waypoints Section - only for task type 2 */}
                <div className="space-y-2 flex-shrink-0">
                  <label className="block text-sm font-medium text-gray-500">
                    {t('general.waypoints')}
                  </label>
                  {/* Waypoint Input */}
                  <WaypointAutocomplete
                    onAddWaypoint={handleAddWaypoint}
                    disabled={!startLocationInput || !endLocationInput}
                    className="mb-2"
                  />
                  {/* Helper text */}
                  {!startLocationInput || !endLocationInput ? (
                    <p className="text-xs text-gray-500">
                      {t('general.set_start_end_first')}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      {t('general.add_waypoints_help')}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          {/* Scrollable Waypoints List - only for task type 2 */}
          {form.task_body?.task_type === 2 && waypointInputs.length > 0 && (
            <div className="flex-shrink-0 max-h-[200px] overflow-y-auto border border-gray-200 rounded-md bg-gray-50 p-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">{t('general.added_waypoints', { count: waypointInputs.length })}</h4>
                  <button
                    type="button"
                    onClick={handleClearAllWaypoints}
                    className="text-xs text-red-500 hover:text-red-700 hover:bg-red-100 px-2 py-1 rounded"
                    title={t('general.clear_all_waypoints')}
                  >
                    {t('general.clear_all')}
                  </button>
                </div>
                {waypointInputs.map((waypoint, index) => (
                  <div
                    key={waypoint.id}
                    className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md shadow-sm"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <LocationAutocomplete
                          label=""
                          placeholder={t('general.search_waypoint_address')}
                          value={waypoint.address}
                          onChange={(value) => handleWaypointAddressChange(waypoint.id, value)}
                          onSelectLocation={(lat, lon) => handleWaypointLocationSelect(waypoint.id, lat, lon)}
                          icon="mdi:map-marker"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveWaypoint(waypoint.id)}
                        className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                        title={t('general.remove_waypoint')}
                      >
                        <Icon icon="mdi:close" width={16} height={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex-1 min-h-[500px]">
            <LocationMap
              lat={locationData.startLocation?.lat?.toString() || locationData.endLocation?.lat?.toString() || ""}
              lon={locationData.startLocation?.lon?.toString() || locationData.endLocation?.lon?.toString() || ""}
              onChange={() => {}}
              onLocationDataChange={handleLocationDataChange}
              startLocation={locationData.startLocation}
              endLocation={locationData.endLocation}
              waypoints={locationData.waypoints}
              taskType={form.task_body?.task_type || 2}
              onStartLocationChange={(location) => {
                setLocationData(prev => ({
                  ...prev,
                  startLocation: location
                }));
              }}
              onEndLocationChange={(location) => {
                setLocationData(prev => ({
                  ...prev,
                  endLocation: location
                }));
              }}
              shouldFitBounds={shouldFitBounds}
              shouldZoomToStart={shouldZoomToStart}
            />
          </div>
          {/* Show route validation errors */}
          {errors.route && (
            <div className='mt-2 p-3 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-xs text-red-700'>{t(errors.route)}</p>
            </div>
          )}
          {/* Tombol submit & cancel: hanya tampil di mobile (md ke bawah) */}
          <div className='flex md:hidden w-full gap-4 mt-4 mb-8'>
            <Button type='submit' disabled={loading} className='w-full'>
              {loading
                ? isEdit
                  ? t('general.updating')
                  : t('general.creating')
                : isEdit
                ? t('general.update_task')
                : t('general.create_task')}
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.back();
              }}
              className='w-full'
              variant='outline'
              color='destructive'
            >
              {t('general.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
