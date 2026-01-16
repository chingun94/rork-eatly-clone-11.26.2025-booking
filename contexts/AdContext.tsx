import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { AdCampaign } from '@/types/admin';
import { AppState, AppStateStatus } from 'react-native';
import { getStorage, ensureNetworkEnabled } from '@/config/firebase';
import { getDb } from '@/contexts/RestaurantContext';
import { 
  collection, 
  onSnapshot,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  increment,
  waitForPendingWrites
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpcClient } from '@/lib/trpc';

const COLLECTION_NAME = 'ads';
const SHOWN_ADS_KEY = 'shown_ad_ids';

export const [AdProvider, useAds] = createContextHook(() => {
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [shownAdIds, setShownAdIds] = useState<string[]>([]);
  const [popupShownThisSession, setPopupShownThisSession] = useState(false);
  
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const loadShownAdIds = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SHOWN_ADS_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setShownAdIds(parsed);
          } else {
            console.warn('AdContext: Invalid shown ad IDs format, resetting');
            setShownAdIds([]);
            await AsyncStorage.removeItem(SHOWN_ADS_KEY);
          }
        } catch (parseError) {
          console.error('AdContext: Error parsing shown ad IDs, resetting:', parseError);
          setShownAdIds([]);
          await AsyncStorage.removeItem(SHOWN_ADS_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading shown ad IDs:', error);
    }
  }, []);

  const syncAdsToBackend = useCallback(async (currentAds: AdCampaign[]) => {
    if (!trpcClient) {
      console.log('AdContext: Backend not configured, skipping sync');
      return;
    }
    
    try {
      console.log('AdContext: Syncing ads to backend, count:', currentAds.length);
      await trpcClient.ads.sync.mutate(currentAds);
      console.log('AdContext: Sync to backend completed');
    } catch (error) {
      console.warn('AdContext: Backend sync failed (non-critical):', error instanceof Error ? error.message : error);
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let mounted = true;
    
    const setupListener = async () => {
      try {
        const dbInstance = getDb();
        if (!dbInstance) {
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        const q = query(collection(dbInstance, COLLECTION_NAME));
        
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (!mounted) return;
            
            const data = snapshot.docs.map((doc) => {
              const docData = doc.data();
              return {
                id: doc.id,
                ...docData,
              };
            }) as AdCampaign[];
            
            setAds(data);
            setIsLoading(false);
            setError(null);
            setIsConnected(!snapshot.metadata.fromCache);
            
            syncAdsToBackend(data);
          },
          (err) => {
            if (!mounted) return;
            
            let errorMessage = err.message;
            if (err.code === 'permission-denied') {
              errorMessage = 'Permission denied. Check Firestore rules in Firebase Console.';
            } else if (err.code === 'unavailable') {
              errorMessage = 'Network unavailable. Check your internet connection.';
            }
            
            setError(errorMessage);
            setIsLoading(false);
            setIsConnected(false);
          }
        );
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || 'Failed to connect to database.');
        setIsLoading(false);
        setIsConnected(false);
      }
    };

    setupListener();
    loadShownAdIds();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        setPopupShownThisSession(false);
      }
      appState.current = nextAppState;
    });

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      subscription.remove();
    };
  }, [loadShownAdIds, syncAdsToBackend]);


  const uploadImage = useCallback(async (uri: string): Promise<string> => {
    try {
      console.log('AdContext: Uploading image to Storage');
      const storageInstance = getStorage();
      if (!storageInstance) {
        throw new Error('Storage not initialized');
      }
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storageInstance, `ads/${Date.now()}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      console.log('AdContext: Image uploaded successfully');
      return downloadURL;
    } catch (error: any) {
      console.error('AdContext: Error uploading image:', error);
      throw error;
    }
  }, []);

  const addAd = useCallback(async (ad: Omit<AdCampaign, 'id'>) => {
    try {
      console.log('AdContext: Adding new ad');
      
      let imageUrl = ad.imageUrl;
      if (imageUrl && (imageUrl.startsWith('data:') || imageUrl.startsWith('file:'))) {
        imageUrl = await uploadImage(imageUrl);
      }

      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error('Database not initialized');
      }
      
      await ensureNetworkEnabled();
      
      const docRef = await addDoc(collection(dbInstance, COLLECTION_NAME), {
        ...ad,
        imageUrl,
      });
      
      console.log('AdContext: Ad added with ID:', docRef.id);
      console.log('AdContext: ⏳ Waiting for server confirmation (30 second timeout)...');
      
      try {
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('TIMEOUT: Server did not confirm write within 30 seconds')), 30000)
        );
        
        await Promise.race([
          waitForPendingWrites(dbInstance),
          timeoutPromise
        ]);
        
        console.log('AdContext: ✅ waitForPendingWrites completed');
        console.log('AdContext: 🔍 Verifying data actually reached server...');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { getDoc } = await import('firebase/firestore');
        const verifyDoc = await getDoc(doc(dbInstance, COLLECTION_NAME, docRef.id));
        
        if (!verifyDoc.exists()) {
          console.error('AdContext: ❌ VERIFICATION FAILED: Document does not exist on server!');
          throw new Error('Document was not saved to server. This indicates a Firestore security rules issue.');
        }
        
        console.log('AdContext: ✅✅✅ VERIFIED! Data confirmed on server');
        console.log('AdContext: Document metadata:', {
          fromCache: verifyDoc.metadata.fromCache,
          hasPendingWrites: verifyDoc.metadata.hasPendingWrites
        });
        
        if (verifyDoc.metadata.fromCache && !verifyDoc.metadata.hasPendingWrites) {
          console.warn('AdContext: ⚠️ WARNING: Document exists but only in cache!');
          console.warn('AdContext: This may indicate a rules issue or offline mode');
        }
        
      } catch (syncError: any) {
        console.error('AdContext: ==========================================');
        console.error('AdContext: ❌❌❌ CRITICAL ERROR: Write failed to sync!');
        console.error('AdContext: ==========================================');
        console.error('AdContext: Error type:', typeof syncError);
        console.error('AdContext: Error name:', syncError?.name);
        console.error('AdContext: Error message:', syncError?.message);
        console.error('AdContext: Error code:', syncError?.code);
        console.error('AdContext: Error stack:', syncError?.stack);
        console.error('AdContext: ==========================================');
        console.error('AdContext: ⚠️ Data was saved LOCALLY ONLY');
        console.error('AdContext: ⚠️ It will DISAPPEAR when you restart the app');
        console.error('AdContext: ==========================================');
        
        let errorMsg = 'SYNC FAILED: ';
        if (syncError?.message?.includes('TIMEOUT')) {
          errorMsg += 'Server did not confirm the write. This almost certainly means your Firestore security rules are blocking the write. Check Firebase Console > Firestore Database > Rules and verify the admin UID matches.';
        } else if (syncError?.code === 'permission-denied') {
          errorMsg += 'Permission denied by Firestore rules. Verify admin UID (18T9pxL5mqRKAzBnKzvcNklVWY43) in rules matches your user.';
        } else if (syncError?.message?.includes('does not exist')) {
          errorMsg += 'Document failed to save to server. Firestore rules are likely rejecting the write.';
        } else {
          errorMsg += 'Failed to sync: ' + (syncError?.message || 'Unknown error');
        }
        
        throw new Error(errorMsg);
      }
      return { id: docRef.id, ...ad, imageUrl } as AdCampaign;
    } catch (error: any) {
      console.error('AdContext: Error adding ad:', error);
      throw error;
    }
  }, [uploadImage]);

  const updateAd = useCallback(async (id: string, updates: Partial<AdCampaign>) => {
    try {
      console.log('AdContext: Updating ad:', id);
      
      const updateData = { ...updates };
      
      if (updates.imageUrl && (updates.imageUrl.startsWith('data:') || updates.imageUrl.startsWith('file:'))) {
        updateData.imageUrl = await uploadImage(updates.imageUrl);
      }
      
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error('Database not initialized');
      }
      const docRef = doc(dbInstance, COLLECTION_NAME, id);
      await updateDoc(docRef, updateData);
      console.log('AdContext: Ad updated successfully');
    } catch (error: any) {
      console.error('AdContext: Error updating ad:', error);
      throw error;
    }
  }, [uploadImage]);

  const deleteAd = useCallback(async (id: string) => {
    try {
      console.log('AdContext: Deleting ad:', id);
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error('Database not initialized');
      }
      const docRef = doc(dbInstance, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      console.log('AdContext: Ad deleted successfully');
    } catch (error: any) {
      console.error('AdContext: Error deleting ad:', error);
      throw error;
    }
  }, []);

  const getActivePopupAd = useCallback(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    console.log('AdContext: Checking for active ads. Total ads:', ads.length);
    console.log('AdContext: Current date:', now.toISOString());
    console.log('AdContext: Today start:', todayStart.toISOString());
    console.log('AdContext: Popup shown this session:', popupShownThisSession);
    console.log('AdContext: Shown ad IDs:', shownAdIds);
    
    const activePopupAds = ads.filter(
      (ad) => {
        const isPopup = ad.type === 'popup';
        const isActive = ad.status === 'active';
        const startDate = new Date(ad.startDate);
        const endDate = new Date(ad.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        const isInDateRange = startDate <= now && endDate >= now;
        
        console.log(`AdContext: Ad ${ad.id} (${ad.restaurantName}):`, {
          isPopup,
          isActive,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          isInDateRange,
          hasImageUrl: !!ad.imageUrl,
          imageUrlLength: ad.imageUrl?.length || 0,
        });
        
        return isPopup && isActive && isInDateRange;
      }
    );

    console.log('AdContext: Active popup ads found:', activePopupAds.length);
    
    if (activePopupAds.length === 0) {
      console.log('AdContext: No active ads found');
      return null;
    }

    if (popupShownThisSession) {
      console.log('AdContext: Popup already shown in this session, skipping');
      return null;
    }

    const unshownAds = activePopupAds.filter(ad => !shownAdIds.includes(ad.id));
    console.log('AdContext: Unshown ads found:', unshownAds.length);

    if (unshownAds.length === 0) {
      console.log('AdContext: All ads shown, resetting rotation and showing first ad');
      const firstAd = activePopupAds[0];
      setShownAdIds([]);
      AsyncStorage.setItem(SHOWN_ADS_KEY, JSON.stringify([]));
      return firstAd;
    }

    const nextAd = unshownAds[0];
    console.log('AdContext: Showing next unshown ad:', nextAd.id, nextAd.restaurantName);
    return nextAd;
  }, [ads, shownAdIds, popupShownThisSession]);



  const incrementImpressions = useCallback(async (adId: string) => {
    try {
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error('Database not initialized');
      }
      const docRef = doc(dbInstance, COLLECTION_NAME, adId);
      await updateDoc(docRef, {
        impressions: increment(1),
      });
    } catch (error: any) {
      console.error('AdContext: Error incrementing impressions:', error);
    }
  }, []);

  const incrementClicks = useCallback(async (adId: string) => {
    try {
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error('Database not initialized');
      }
      const docRef = doc(dbInstance, COLLECTION_NAME, adId);
      await updateDoc(docRef, {
        clicks: increment(1),
      });
    } catch (error: any) {
      console.error('AdContext: Error incrementing clicks:', error);
    }
  }, []);

  const resetShownAds = useCallback(async () => {
    console.log('AdContext: Resetting shown ads');
    setShownAdIds([]);
    await AsyncStorage.removeItem(SHOWN_ADS_KEY);
  }, []);

  const markPopupAsShownInSession = useCallback((adId?: string) => {
    console.log('AdContext: Marking popup as shown in this session');
    setPopupShownThisSession(true);
    if (adId) {
      console.log('AdContext: Marking ad as shown:', adId);
      setShownAdIds(prev => {
        const updated = [...prev, adId];
        AsyncStorage.setItem(SHOWN_ADS_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, []);

  return useMemo(
    () => ({
      ads,
      isLoading,
      error,
      isConnected,
      addAd,
      updateAd,
      deleteAd,
      getActivePopupAd,
      incrementImpressions,
      incrementClicks,
      resetShownAds,
      markPopupAsShownInSession,
      uploadImage,
    }),
    [ads, isLoading, error, isConnected, addAd, updateAd, deleteAd, getActivePopupAd, incrementImpressions, incrementClicks, resetShownAds, markPopupAsShownInSession, uploadImage]
  );
});
