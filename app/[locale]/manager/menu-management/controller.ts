import { useState, useCallback } from "react";
import { toast } from "sonner";
import { 
  getAvailableMenuElements, 
  setDisabledGuiElements,
  MenuGroup
} from "@/models/manager/menu-management";
import { useSelectedCustomerStore } from "@/store/selected-customer";

// Get token from localStorage
const getManagerToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const userData = JSON.parse(localStorage.getItem("userData-manager") || "{}");
  return userData.token || null;
};

export interface MenuManagementState {
  menuGroups: MenuGroup[];
  validationErrors: string[];
  loading: boolean;
  saving: boolean;
}

export const controller = () => {
  const { selectedCustomerId, selectedCustomerName } = useSelectedCustomerStore();
  
  const [state, setState] = useState<MenuManagementState>({
    menuGroups: [],
    validationErrors: [],
    loading: false,
    saving: false,
  });


  // Fetch menu elements for selected customer
  const fetchMenuElements = useCallback(async () => {
    if (!selectedCustomerId) {
      setState(prev => ({ ...prev, menuGroups: [] }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const token = getManagerToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await getAvailableMenuElements(token, selectedCustomerId);
      
      if (response.success) {
        setState(prev => ({ ...prev, menuGroups: response.data }));
      } else {
        throw new Error(response.message || 'Failed to fetch menu elements');
      }
    } catch (error) {
      console.error('Error fetching menu elements:', error);
      toast.error('Failed to fetch menu elements');
      // Set empty array to prevent undefined errors
      setState(prev => ({ ...prev, menuGroups: [] }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [selectedCustomerId]);


  // Toggle individual report
  const toggleReport = useCallback((reportId: number, visible: boolean) => {
    setState(prev => {
      const updatedGroups = prev.menuGroups.map(group => ({
        ...group,
        report: group.report?.map(report => {
          if (report.id === reportId) {
            return { 
              ...report, 
              visible,
              // If user checks a disabled item, we mark it as enabled locally
              // Backend will handle the actual enable when we save
              enabled: visible ? true : report.enabled,
              exception_set: true // Mark as custom setting for UI tracking
            };
          }
          return report;
        }) || []
      }));
      
      return {
        ...prev,
        menuGroups: updatedGroups
      };
    });
  }, []);

  // Enable all reports in a group
  const enableAllInGroup = useCallback((groupId: number) => {
    setState(prev => {
      const updatedGroups = prev.menuGroups.map(group => {
        if (group.group_id === groupId) {
          const updatedReports = group.report?.map(report => {
            return { 
              ...report, 
              visible: true,
              enabled: true, // Mark as enabled locally
              exception_set: true // Mark as custom setting
            };
          }) || [];
          return {
            ...group,
            report: updatedReports
          };
        }
        return group;
      });
      
      return {
        ...prev,
        menuGroups: updatedGroups
      };
    });
  }, []);

  // Disable all reports in a group
  const disableAllInGroup = useCallback((groupId: number) => {
    setState(prev => {
      const updatedGroups = prev.menuGroups.map(group => {
        if (group.group_id === groupId) {
          const updatedReports = group.report?.map(report => {
            return { 
              ...report, 
              visible: false,
              exception_set: true // Mark as custom setting
            };
          }) || [];
          return {
            ...group,
            report: updatedReports
          };
        }
        return group;
      });
      
      return {
        ...prev,
        menuGroups: updatedGroups
      };
    });
  }, []);

  // Validate menu configuration
  const validateConfiguration = useCallback(() => {
    const errors: string[] = [];
    
    if (!selectedCustomerId) {
      errors.push("Please select a customer");
      return errors;
    }

    // Only validate group-level disabled state
    // Backend will handle individual report enable/disable logic
    state.menuGroups.forEach(group => {
      if (!group.enabled) {
        errors.push(`Group "${group.name}" is disabled`);
      }
    });

    setState(prev => ({ ...prev, validationErrors: errors }));
    return errors;
  }, [selectedCustomerId, state.menuGroups]);

  // Save changes
  const saveChanges = useCallback(async () => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer first");
      return;
    }

    const errors = validateConfiguration();
    if (errors.length > 0) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    try {
      setState(prev => ({ ...prev, saving: true }));

      // Collect ALL items that should be DISABLED (not visible by user)
      // This includes both enabled items that user unchecked AND disabled items that user didn't check
      const disabledReportIds: number[] = [];
      
      state.menuGroups.forEach(group => {
        if (group.enabled) {
          group.report?.forEach(report => {
            // Collect items that should be DISABLED:
            // 1. Items that are enabled but user unchecked (visible: false)
            // 2. Items that are disabled and user didn't check (enabled: false && visible: false)
            if (!report.visible) {
              disabledReportIds.push(report.id);
            }
          });
        }
      });

      const token = getManagerToken();
      
      // Single API call: Set all disabled elements
      // Backend will enable everything NOT in this list
      const success = await setDisabledGuiElements(token, selectedCustomerId, disabledReportIds);
      
      if (success) {
        toast.success("Menu settings saved successfully");
        // Refresh menu elements to get updated state
        await fetchMenuElements();
      } else {
        throw new Error('Failed to save menu settings');
      }
    } catch (error) {
      console.error('Error saving menu settings:', error);
      toast.error('Failed to save menu settings');
    } finally {
      setState(prev => ({ ...prev, saving: false }));
    }
  }, [selectedCustomerId, state.menuGroups, validateConfiguration, fetchMenuElements]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer first");
      return;
    }

    setState(prev => ({
      ...prev,
      menuGroups: prev.menuGroups.map(group => ({
        ...group,
        report: group.report?.map(report => ({
          ...report,
          visible: report.default === "enabled",
          exception_set: false // Reset custom settings
        })) || []
      }))
    }));
    
    toast.success("Reset to default settings");
  }, [selectedCustomerId]);

  // Copy settings from another customer
  const copyFromCustomer = useCallback(async (sourceCustomerId: number) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const token = getManagerToken();
      const response = await getAvailableMenuElements(token, sourceCustomerId);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          menuGroups: response.data
        }));
        toast.success("Settings copied successfully");
      } else {
        throw new Error(response.message || 'Failed to copy settings');
      }
    } catch (error) {
      console.error('Error copying settings:', error);
      toast.error('Failed to copy settings');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);


  return {
    models: {
      ...state,
      selectedCustomer: selectedCustomerId ? { id: selectedCustomerId, name: selectedCustomerName } : null
    },
    operations: {
      fetchMenuElements,
      toggleReport,
      enableAllInGroup,
      disableAllInGroup,
      saveChanges,
      resetToDefault,
      copyFromCustomer,
      validateConfiguration,
    },
  };
};
