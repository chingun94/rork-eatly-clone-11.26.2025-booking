import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { AdminUser } from '@/types/admin';
import { getAuth } from '@/config/firebase';
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { clearAdminTokenCache } from '@/lib/trpc';

const STORAGE_KEYS = {
  ADMIN_TOKEN: 'admin_token',
  ADMIN_PASSWORD: 'admin_password',
};

const DEFAULT_PASSWORD = 'Admin 9496';

export const [AdminProvider, useAdmin] = createContextHook(() => {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadAdminToken = useCallback(async () => {
    try {
      console.log('AdminContext: Loading admin token from AsyncStorage');
      const [token, storedPassword] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD),
      ]);

      console.log('AdminContext: Token exists:', !!token);
      console.log('AdminContext: Stored password exists:', !!storedPassword);

      if (!storedPassword) {
        console.log('AdminContext: Setting default password');
        await AsyncStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, DEFAULT_PASSWORD);
      }

      if (token) {
        console.log('AdminContext: Admin token found, will authenticate with Firebase in background');
        
        setAdminToken(token);
        setAdminUser({
          id: 'admin_1',
          phone: '+976 88008084',
          email: 'admin@eatly.com',
          name: 'Admin User',
          role: 'super_admin',
          createdAt: new Date().toISOString(),
        });

        setTimeout(async () => {
          try {
            const authInstance = getAuth();
            if (authInstance && !authInstance.currentUser) {
              await signInWithEmailAndPassword(authInstance, 'admin@eatly.com', storedPassword || DEFAULT_PASSWORD);
              console.log('AdminContext: Firebase Auth restored in background');
            } else if (authInstance?.currentUser) {
              console.log('AdminContext: Already authenticated with Firebase');
            }
          } catch (firebaseError: any) {
            console.error('AdminContext: Firebase Auth restore error:', firebaseError.message);
          }
        }, 100);
      } else {
        console.log('AdminContext: No admin token found');
      }
    } catch (error) {
      console.error('AdminContext: Error loading admin token:', error);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      loadAdminToken();
    }, 0);
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    try {
      console.log('AdminContext: Login attempt for phone:', phone);
      if (phone !== '+976 88008084' && phone !== '+97688008084') {
        console.log('AdminContext: Invalid phone number');
        return { success: false, error: 'Invalid phone number' };
      }

      const storedPassword = await AsyncStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD);
      const validPassword = storedPassword || DEFAULT_PASSWORD;
      console.log('AdminContext: Password validation:', password === validPassword);

      if (password !== validPassword) {
        console.log('AdminContext: Invalid password');
        return { success: false, error: 'Invalid password' };
      }

      const authInstance = getAuth();
      if (authInstance) {
        try {
          console.log('AdminContext: Signing in to Firebase Auth');
          await signInWithEmailAndPassword(authInstance, 'admin@eatly.com', DEFAULT_PASSWORD);
          console.log('AdminContext: Firebase Auth successful');
        } catch (firebaseError: any) {
          console.log('AdminContext: Firebase Auth error:', firebaseError.message);
          console.log('AdminContext: Make sure the admin user exists in Firebase Console with email: admin@eatly.com and password: Admin 9496');
          return { success: false, error: `Firebase Auth failed: ${firebaseError.message}. Please ensure admin@eatly.com exists in Firebase Console with password "Admin 9496"` };
        }
      }

      const token = `admin_token_${Date.now()}`;
      console.log('AdminContext: Saving admin token to AsyncStorage');
      await AsyncStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
      setAdminToken(token);
      setAdminUser({
        id: 'admin_1',
        phone: '+976 88008084',
        email: 'admin@eatly.com',
        name: 'Admin User',
        role: 'super_admin',
        createdAt: new Date().toISOString(),
      });
      console.log('AdminContext: Login successful');
      return { success: true };
    } catch (error) {
      console.error('AdminContext: Error saving admin token:', error);
      return { success: false, error: 'Login failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
      clearAdminTokenCache();
      
      const authInstance = getAuth();
      if (authInstance) {
        await firebaseSignOut(authInstance);
        console.log('AdminContext: Signed out from Firebase Auth');
      }
      
      setAdminToken(null);
      setAdminUser(null);
    } catch (error) {
      console.error('Error removing admin token:', error);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      const storedPassword = await AsyncStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD);
      const validPassword = storedPassword || DEFAULT_PASSWORD;

      if (currentPassword !== validPassword) {
        return { success: false, error: 'Current password is incorrect' };
      }

      if (newPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      await AsyncStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, error: 'Failed to change password' };
    }
  }, []);

  const isAuthenticated = useMemo(() => !!adminToken, [adminToken]);

  return useMemo(() => ({
    adminToken,
    adminUser,
    isAuthenticated,
    login,
    logout,
    changePassword,
    isLoading,
  }), [adminToken, adminUser, isAuthenticated, login, logout, changePassword, isLoading]);
});
