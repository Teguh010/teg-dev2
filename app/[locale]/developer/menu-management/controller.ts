import { useState, useCallback } from "react";
import { toast } from "sonner";
import { 
  getUsersList, 
  getUserGUIElementsOverview,
  setDisabledGUIElements,
  getUserById,
  User,
  GUIGroup
} from "@/models/users";

// Get token from localStorage
const getClientToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const userData = JSON.parse(localStorage.getItem("userData-client") || "{}");
  return userData.token || null;
};

export interface UserDetails {
  name: string;
  expires: string | null;
  typeid: number;
  data_age_limit: number | null;
  all_objects_visible: boolean;
  assigned_objects: number[] | null;
  assigned_object_groups: number[] | null;
  user_groups: number[] | null;
  worker: {
    id: number;
    name: string;
    surname: string;
    phone: string;
    email: string;
  } | null;
}

export interface ClientMenuManagementState {
  users: User[];
  selectedUser: User | null;
  selectedUserDetails: UserDetails | null;
  menuGroups: GUIGroup[];
  validationErrors: string[];
  loading: boolean;
  saving: boolean;
  usersLoading: boolean;
  userDetailsLoading: boolean;
}

export const controller = () => {
  const [state, setState] = useState<ClientMenuManagementState>({
    users: [],
    selectedUser: null,
    selectedUserDetails: null,
    menuGroups: [],
    validationErrors: [],
    loading: false,
    saving: false,
    usersLoading: false,
    userDetailsLoading: false,
  });

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, usersLoading: true }));
      
      const token = getClientToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const users = await getUsersList(token);
      setState(prev => ({ ...prev, users }));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users list');
      setState(prev => ({ ...prev, users: [] }));
    } finally {
      setState(prev => ({ ...prev, usersLoading: false }));
    }
  }, []);

  // Fetch user details by ID
  const fetchUserDetails = useCallback(async (userId: number) => {
    try {
      setState(prev => ({ ...prev, userDetailsLoading: true }));
      
      const token = getClientToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const userDetails = await getUserById(token, userId);
      setState(prev => ({ ...prev, selectedUserDetails: userDetails }));
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to fetch user details');
      setState(prev => ({ ...prev, selectedUserDetails: null }));
    } finally {
      setState(prev => ({ ...prev, userDetailsLoading: false }));
    }
  }, []);

  // Fetch menu elements for selected user
  const fetchUserMenuElements = useCallback(async (userId: number) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const token = getClientToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const menuGroups = await getUserGUIElementsOverview(token, userId);
      setState(prev => ({ ...prev, menuGroups }));
    } catch (error) {
      console.error('Error fetching user menu elements:', error);
      toast.error('Failed to fetch user menu elements');
      setState(prev => ({ ...prev, menuGroups: [] }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Select user and fetch their menu elements and details
  const selectUser = useCallback(async (user: User | null) => {
    setState(prev => ({ ...prev, selectedUser: user }));
    
    if (user) {
      // Fetch both user details and menu elements in parallel
      await Promise.all([
        fetchUserDetails(user.id),
        fetchUserMenuElements(user.id)
      ]);
    } else {
      setState(prev => ({ 
        ...prev, 
        menuGroups: [],
        selectedUserDetails: null
      }));
    }
  }, [fetchUserDetails, fetchUserMenuElements]);

  // Toggle individual report
  const toggleReport = useCallback((reportId: number, checked: boolean) => {
    setState(prev => {
      const updatedGroups = prev.menuGroups.map(group => ({
        ...group,
        report: group.report?.map(report => {
          if (report.id === reportId) {
            // Similar to manager side: toggle accessible, auto-enable if user checks
            return { 
              ...report, 
              enabled: checked
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
              enabled: true
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
              enabled: false
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
    
    if (!state.selectedUser) {
      errors.push("Please select a user");
      return errors;
    }

    setState(prev => ({ ...prev, validationErrors: errors }));
    return errors;
  }, [state.selectedUser]);

  // Save changes
  const saveChanges = useCallback(async () => {
    if (!state.selectedUser) {
      toast.error("Please select a user first");
      return;
    }

    const errors = validateConfiguration();
    if (errors.length > 0) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    try {
      setState(prev => ({ ...prev, saving: true }));

      // Collect ALL items that should be DISABLED (enabled: false)
      const disabledReportIds: number[] = [];
      const disabledGroupIds: number[] = [];
      
      state.menuGroups.forEach(group => {
        group.report?.forEach(report => {
          // Collect items that should be DISABLED (enabled: false)
          if (report.enabled === false) {
            disabledReportIds.push(report.id);
          }
        });
      });

      const token = getClientToken();
      
      // Single API call: Set all disabled elements
      // Backend will enable everything NOT in these lists
      const success = await setDisabledGUIElements(token, state.selectedUser.id, disabledReportIds, disabledGroupIds);
      
      if (success) {
        toast.success("Menu settings saved successfully");
        // Refresh menu elements to get updated state
        await fetchUserMenuElements(state.selectedUser.id);
      } else {
        throw new Error('Failed to save menu settings');
      }
    } catch (error) {
      console.error('Error saving menu settings:', error);
      toast.error('Failed to save menu settings');
    } finally {
      setState(prev => ({ ...prev, saving: false }));
    }
  }, [state.selectedUser, state.menuGroups, validateConfiguration, fetchUserMenuElements]);

  // Reset to default
  const resetToDefault = useCallback(async () => {
    if (!state.selectedUser) {
      toast.error("Please select a user first");
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const token = getClientToken();
      // Reset by setting all elements as enabled (empty disabled lists)
      await setDisabledGUIElements(token, state.selectedUser.id, [], []);
      
      // Refresh the data
      await fetchUserMenuElements(state.selectedUser.id);
      toast.success("Reset to default settings");
    } catch (error) {
      console.error('Error resetting to default:', error);
      toast.error('Failed to reset to default settings');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.selectedUser, fetchUserMenuElements]);

  return {
    models: {
      ...state
    },
    operations: {
      fetchUsers,
      fetchUserDetails,
      fetchUserMenuElements,
      selectUser,
      toggleReport,
      enableAllInGroup,
      disableAllInGroup,
      saveChanges,
      resetToDefault,
      validateConfiguration,
    },
  };
};
