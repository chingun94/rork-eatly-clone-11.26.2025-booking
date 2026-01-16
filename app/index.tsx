import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getAuth } from '@/config/firebase';
import { useUser } from '@/contexts/UserContext';

export default function Index() {
  const { login } = useUser();

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    
    const setupAuth = async () => {
      try {
        const auth = getAuth();
        if (!auth) {
          console.log('Index: Auth not initialized yet, skipping auth listener');
          return;
        }
        if (!mounted) return;

        console.log('Index: Setting up auth state listener...');
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (!mounted) return;
          
          console.log('Index: Auth state changed, user:', firebaseUser?.uid || 'none');
          
          if (firebaseUser && firebaseUser.emailVerified) {
            console.log('Index: User is authenticated and verified, logging in...');
            try {
              await login({
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'User',
                email: firebaseUser.email || '',
                phone: '',
              });
              console.log('Index: User logged in successfully');
            } catch (error) {
              console.error('Index: Error logging in user:', error);
            }
          }
        });
      } catch (error) {
        console.error('Index: Error setting up auth:', error);
      }
    };

    setupAuth();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [login]);

  return <Redirect href="/(tabs)/(home)/home" />;
}
