import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { getAuth } from '@/config/firebase';

export const [FirebaseProvider, useFirebase] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let mounted = true;

    const setupAuth = () => {
      try {
        const authInstance = getAuth();
        if (!authInstance || !mounted) return;

        unsubscribe = onAuthStateChanged(authInstance, (user) => {
          if (mounted) {
            setUser(user);
          }
        });
      } catch (error) {
        console.error('FirebaseContext: Setup error:', error);
      }
    };

    setupAuth();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const authInstance = getAuth();
      if (!authInstance) throw new Error('Auth not initialized');
      
      console.log('Firebase: Signing in user');
      const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
      console.log('Firebase: Sign in successful', userCredential.user.uid);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      console.error('Firebase: Sign in error', error.message);
      return { success: false, error: error.message };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      const authInstance = getAuth();
      if (!authInstance) throw new Error('Auth not initialized');
      
      console.log('Firebase: Creating new user');
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
      
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
        console.log('Firebase: Updated user profile');
      }
      
      console.log('Firebase: Sign up successful', userCredential.user.uid);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      console.error('Firebase: Sign up error', error.message);
      return { success: false, error: error.message };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const authInstance = getAuth();
      if (!authInstance) throw new Error('Auth not initialized');
      
      console.log('Firebase: Signing out user');
      await firebaseSignOut(authInstance);
      console.log('Firebase: Sign out successful');
      return { success: true };
    } catch (error: any) {
      console.error('Firebase: Sign out error', error.message);
      return { success: false, error: error.message };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const authInstance = getAuth();
      if (!authInstance) throw new Error('Auth not initialized');
      
      console.log('Firebase: Sending password reset email');
      await sendPasswordResetEmail(authInstance, email);
      console.log('Firebase: Password reset email sent');
      return { success: true };
    } catch (error: any) {
      console.error('Firebase: Password reset error', error.message);
      return { success: false, error: error.message };
    }
  }, []);

  const updateUserProfile = useCallback(async (displayName?: string, photoURL?: string) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      console.log('Firebase: Updating user profile');
      await updateProfile(user, { displayName, photoURL });
      console.log('Firebase: Profile updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Firebase: Profile update error', error.message);
      return { success: false, error: error.message };
    }
  }, [user]);

  return useMemo(() => ({
    user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
    isAuthenticated: !!user,
  }), [user, signIn, signUp, signOut, resetPassword, updateUserProfile]);
});
