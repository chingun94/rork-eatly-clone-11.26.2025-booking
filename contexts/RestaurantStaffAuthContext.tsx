import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { RestaurantStaff, ROLE_PERMISSIONS, RestaurantStaffPermissions } from '@/types/restaurant-staff';
import { staffFirebase } from '@/utils/staffFirebase';

const STORAGE_KEY = 'restaurant_staff_data';

export const [RestaurantStaffAuthProvider, useRestaurantStaffAuth] = createContextHook(() => {
  const [staff, setStaff] = useState<RestaurantStaff | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStaffData();
  }, []);

  const loadStaffData = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsedStaff = JSON.parse(data);
        setStaff(parsedStaff);
      }
    } catch (error) {
      console.error('Error loading staff data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const authenticatedStaff = await staffFirebase.authenticate(email, password);
      if (!authenticatedStaff) {
        throw new Error('Authentication failed');
      }
      console.log('[StaffAuth] Authenticated staff:', {
        id: authenticatedStaff.id,
        name: authenticatedStaff.name,
        restaurantId: authenticatedStaff.restaurantId,
        restaurantName: authenticatedStaff.restaurantName,
      });
      setStaff(authenticatedStaff);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedStaff));
      await AsyncStorage.setItem('restaurant_id', authenticatedStaff.restaurantId);
      return authenticatedStaff;
    } catch (error: any) {
      throw new Error(error.message || 'Authentication failed');
    }
  }, []);

  const logout = useCallback(async () => {
    setStaff(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem('restaurant_id');
  }, []);

  const updateStaffData = useCallback(async (updatedStaff: RestaurantStaff) => {
    setStaff(updatedStaff);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStaff));
  }, []);

  const permissions = useMemo<RestaurantStaffPermissions | null>(() => {
    if (!staff) return null;
    return ROLE_PERMISSIONS[staff.role];
  }, [staff]);

  const hasPermission = useCallback((permission: keyof RestaurantStaffPermissions): boolean => {
    if (!permissions) return false;
    return permissions[permission];
  }, [permissions]);

  const isAuthenticated = useMemo(() => !!staff, [staff]);

  return useMemo(() => ({
    staff,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateStaffData,
    permissions,
    hasPermission,
  }), [staff, isAuthenticated, isLoading, login, logout, updateStaffData, permissions, hasPermission]);
});
