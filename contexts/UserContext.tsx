import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { User, UserReview } from '@/types/user';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc, getDocs, where, waitForPendingWrites, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, getDb as getFirestoreDb, getStorage as getFirebaseStorage } from '@/config/firebase';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const getDb = () => getFirestoreDb();
const getStorageInstance = () => getFirebaseStorage();

const STORAGE_KEYS = {
  USER: 'user_data',
  SAVED_RESTAURANTS: 'saved_restaurants',
  REVIEWS: 'user_reviews',
};

const REVIEWS_COLLECTION = 'reviews';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});



export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [savedRestaurants, setSavedRestaurants] = useState<string[]>([]);
  const [allReviews, setAllReviews] = useState<UserReview[]>([]);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    let mounted = true;

    const loadUserData = async () => {
      try {
        const [userData, savedData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.SAVED_RESTAURANTS),
        ]);

        if (!mounted) return;

        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
          } catch (parseError) {
            console.error('Error parsing user data, clearing:', parseError);
            await AsyncStorage.removeItem(STORAGE_KEYS.USER);
          }
        }
        if (savedData) {
          try {
            const parsedSaved = JSON.parse(savedData);
            if (Array.isArray(parsedSaved)) {
              setSavedRestaurants(parsedSaved);
            } else {
              await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_RESTAURANTS);
            }
          } catch (parseError) {
            console.error('Error parsing saved restaurants, clearing:', parseError);
            await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_RESTAURANTS);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const registerForPushNotifications = async () => {
      if (!Device.isDevice) {
        console.log('UserContext: Push notifications only work on physical devices');
        return null;
      }

      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('UserContext: Notification permission denied');
          return null;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;
        console.log('UserContext: Push token obtained:', token);

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF6B35',
          });
        }

        return token;
      } catch (error) {
        console.error('UserContext: Error getting push token:', error);
        return null;
      }
    };

    const setupNotifications = async () => {
      if (!mounted) return;

      const token = await registerForPushNotifications();
      if (token && mounted) {
        setPushToken(token);

        if (user) {
          try {
            const dbInstance = getDb();
            if (dbInstance) {
              const usersRef = collection(dbInstance, 'users');
              const q = query(usersRef, where('id', '==', user.id));
              const snapshot = await getDocs(q);
              
              if (!snapshot.empty) {
                const userDocRef = doc(dbInstance, 'users', snapshot.docs[0].id);
                await updateDoc(userDocRef, { pushToken: token });
                console.log('UserContext: Push token saved to Firestore');
              }
            }
          } catch (error) {
            console.error('UserContext: Error saving push token:', error);
          }
        }
      }
    };

    setupNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('UserContext: Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('UserContext: Notification tapped:', response);
    });

    return () => {
      mounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const setupReviewsListener = async () => {
      try {
        const dbInstance = getDb();
        if (!dbInstance) {
          console.log('UserContext: Firestore not initialized, reviews will not sync');
          return;
        }

        console.log('UserContext: Setting up reviews listener...');
        const q = query(collection(dbInstance, REVIEWS_COLLECTION));

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (!mounted) return;

            console.log('UserContext: Reviews snapshot received, count:', snapshot.docs.length);
            const data = snapshot.docs.map((doc) => {
              const docData = doc.data();
              console.log('UserContext: Review document:', { id: doc.id, userId: docData.userId, userName: docData.userName });
              return {
                id: doc.id,
                ...docData,
              };
            }) as UserReview[];

            console.log('UserContext: Setting all reviews, total count:', data.length);
            setAllReviews(data);
          },
          (err) => {
            if (!mounted) return;
            console.error('UserContext: Error listening to reviews:', err);
          }
        );
      } catch (err: any) {
        if (!mounted) return;
        console.error('UserContext: Failed to setup reviews listener:', err);
      }
    };

    setupReviewsListener();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };
  }, []);

  const login = useCallback(async (userData: { id: string; name: string; email: string; phone?: string }) => {
    const newUser: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      joinDate: new Date().toISOString(),
    };
    setUser(newUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));

    (async () => {
      try {
        const dbInstance = getDb();
        if (dbInstance) {
          console.log('UserContext: Saving user to Firestore (non-blocking)...', newUser);
          
          const savePromise = Promise.race([
            (async () => {
              const userData: any = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone || '',
                joinDate: newUser.joinDate,
              };
              if (pushToken) {
                userData.pushToken = pushToken;
              }
              return await addDoc(collection(dbInstance, 'users'), userData);
            })(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Firestore save timeout')), 15000)
            )
          ]);
          
          const docRef = await savePromise as any;
          console.log('UserContext: User saved to Firestore with doc ID:', docRef.id);
        } else {
          console.warn('UserContext: Firestore not initialized, user not saved to database');
        }
      } catch (error: any) {
        console.error('UserContext: Error saving user to Firestore:', error);
        console.error('UserContext: Error details:', error.message);
      }
    })();
  }, [pushToken]);

  const logout = useCallback(async () => {
    console.log('UserContext: Logging out user...');
    try {
      const auth = getAuth();
      if (auth && auth.currentUser) {
        console.log('UserContext: Signing out from Firebase Auth...');
        await auth.signOut();
        console.log('UserContext: Firebase Auth sign out successful');
      }
      
      setUser(null);
      setSavedRestaurants([]);
      setAllReviews([]);
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.SAVED_RESTAURANTS,
        STORAGE_KEYS.REVIEWS,
      ]);
      console.log('UserContext: Logout successful, cleared all data');
    } catch (error) {
      console.error('UserContext: Error during logout:', error);
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
  }, [user]);

  const toggleSaveRestaurant = useCallback(async (restaurantId: string) => {
    setSavedRestaurants((prev) => {
      const newSaved = prev.includes(restaurantId)
        ? prev.filter((id) => id !== restaurantId)
        : [...prev, restaurantId];
      
      AsyncStorage.setItem(STORAGE_KEYS.SAVED_RESTAURANTS, JSON.stringify(newSaved));
      return newSaved;
    });
  }, []);

  const isRestaurantSaved = useCallback(
    (restaurantId: string) => savedRestaurants.includes(restaurantId),
    [savedRestaurants]
  );

  const addReview = useCallback(async (review: Omit<UserReview, 'id' | 'date'>, onSuccess?: () => void) => {
    try {
      console.log('UserContext: Adding review for restaurant:', review.restaurantId);
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error('Database not initialized');
      }

      if (!user) {
        throw new Error('User must be logged in to add a review');
      }

      let uploadedPhotoUrls: string[] = [];

      if (review.photos && review.photos.length > 0) {
        console.log('UserContext: Uploading', review.photos.length, 'photos to Firebase Storage...');
        const storageInstance = getStorageInstance();
        
        if (!storageInstance) {
          throw new Error('Firebase Storage not initialized');
        }
        
        uploadedPhotoUrls = await Promise.all(
          review.photos.map(async (photoUri, index) => {
            try {
              console.log('UserContext: Uploading photo', index + 1, 'of', review.photos!.length);
              
              const response = await fetch(photoUri);
              const blob = await response.blob();
              
              const filename = `reviews/${user.id}/${Date.now()}_${index}.jpg`;
              const storageRef = ref(storageInstance!, filename);
              
              console.log('UserContext: Uploading to path:', filename);
              await uploadBytes(storageRef, blob);
              
              const downloadUrl = await getDownloadURL(storageRef);
              console.log('UserContext: Photo', index + 1, 'uploaded successfully');
              
              return downloadUrl;
            } catch (error) {
              console.error('UserContext: Error uploading photo', index + 1, ':', error);
              throw error;
            }
          })
        );
        
        console.log('UserContext: All photos uploaded successfully. URLs:', uploadedPhotoUrls);
      }

      const newReviewData: {
        restaurantId: string;
        restaurantName: string;
        rating: number;
        comment: string;
        date: string;
        photos?: string[];
        userId: string;
        userName: string;
        userEmail: string;
        detailedRatings?: {
          food: number;
          service: number;
          ambience: number;
          value: number;
          cleanliness: number;
        };
      } = {
        restaurantId: review.restaurantId,
        restaurantName: review.restaurantName,
        rating: review.rating,
        comment: review.comment,
        date: new Date().toISOString(),
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
      };

      if (uploadedPhotoUrls.length > 0) {
        newReviewData.photos = uploadedPhotoUrls;
      }

      if (review.detailedRatings) {
        newReviewData.detailedRatings = review.detailedRatings;
      }

      console.log('UserContext: Submitting review to Firestore...', newReviewData);
      const docRef = await addDoc(collection(dbInstance, REVIEWS_COLLECTION), newReviewData);
      console.log('UserContext: Review added with ID:', docRef.id);
      console.log('UserContext: ⏳ Waiting for server confirmation (30 second timeout)...');

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('TIMEOUT: Server did not confirm write within 30 seconds')),
            30000
          )
        );

        await Promise.race([waitForPendingWrites(dbInstance), timeoutPromise]);

        console.log('UserContext: ✅ waitForPendingWrites completed');
        console.log('UserContext: 🔍 Verifying review actually reached server...');

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const verifyDoc = await getDoc(doc(dbInstance, REVIEWS_COLLECTION, docRef.id));

        if (!verifyDoc.exists()) {
          console.error('UserContext: ❌ VERIFICATION FAILED: Review does not exist on server!');
          throw new Error(
            'Review was not saved to server. This indicates a Firestore security rules issue.'
          );
        }

        console.log('UserContext: ✅✅✅ VERIFIED! Review confirmed on server');
        console.log('UserContext: Document metadata:', {
          fromCache: verifyDoc.metadata.fromCache,
          hasPendingWrites: verifyDoc.metadata.hasPendingWrites,
        });

        if (verifyDoc.metadata.fromCache && !verifyDoc.metadata.hasPendingWrites) {
          console.warn('UserContext: ⚠️ WARNING: Review exists but only in cache!');
          console.warn('UserContext: This may indicate a rules issue or offline mode');
        }
      } catch (syncError: any) {
        console.error('UserContext: ==========================================');
        console.error('UserContext: ❌❌❌ CRITICAL ERROR: Review write failed to sync!');
        console.error('UserContext: ==========================================');
        console.error('UserContext: Error type:', typeof syncError);
        console.error('UserContext: Error name:', syncError?.name);
        console.error('UserContext: Error message:', syncError?.message);
        console.error('UserContext: Error code:', syncError?.code);
        console.error('UserContext: Error stack:', syncError?.stack);
        console.error('UserContext: ==========================================');
        console.error('UserContext: ⚠️ Review was saved LOCALLY ONLY');
        console.error('UserContext: ⚠️ It will DISAPPEAR when you reload');
        console.error('UserContext: ⚠️ This usually means:');
        console.error('UserContext:    1. Firestore security rules are blocking the write');
        console.error('UserContext:    2. Network connection lost during sync');
        console.error('UserContext:    3. Firebase project misconfigured');
        console.error('UserContext: ==========================================');

        let errorMsg = 'SYNC FAILED: ';
        if (syncError?.message?.includes('TIMEOUT')) {
          errorMsg +=
            'Server did not confirm the write. This almost certainly means your Firestore security rules are blocking the write. Check Firebase Console > Firestore Database > Rules.';
        } else if (syncError?.code === 'permission-denied') {
          errorMsg +=
            'Permission denied by Firestore rules. Go to Firebase Console > Firestore Database > Rules and verify your security rules allow review creation.';
        } else if (syncError?.message?.includes('does not exist')) {
          errorMsg +=
            'Review failed to save to server. Firestore rules are likely rejecting the write. Verify rules and authentication.';
        } else {
          errorMsg += 'Failed to sync: ' + (syncError?.message || 'Unknown error');
        }

        throw new Error(errorMsg);
      }

      const newReview: UserReview = {
        id: docRef.id,
        ...newReviewData,
      };

      if (onSuccess) {
        onSuccess();
      }

      return newReview;
    } catch (error: any) {
      console.error('UserContext: Error adding review:', error);
      throw error;
    }
  }, [user]);

  const getReviewsForRestaurant = useCallback(
    (restaurantId: string) => allReviews.filter((r) => r.restaurantId === restaurantId),
    [allReviews]
  );

  const reviews = useMemo(() => {
    const filtered = allReviews.filter((r) => r.userId === user?.id);
    console.log('UserContext: Filtering reviews for user:', user?.id);
    console.log('UserContext: All reviews count:', allReviews.length);
    console.log('UserContext: All reviews:', allReviews.map(r => ({ id: r.id, userId: r.userId, name: r.restaurantName })));
    console.log('UserContext: Filtered user reviews:', filtered.length);
    console.log('UserContext: Filtered reviews:', filtered.map(r => ({ id: r.id, userId: r.userId, name: r.restaurantName })));
    return filtered;
  }, [allReviews, user?.id]);

  const deleteReview = useCallback(async (reviewId: string) => {
    try {
      console.log('UserContext: Deleting review:', reviewId);
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error('Database not initialized');
      }
      const docRef = doc(dbInstance, REVIEWS_COLLECTION, reviewId);
      await deleteDoc(docRef);
      console.log('UserContext: Review deleted successfully');
    } catch (error: any) {
      console.error('UserContext: Error deleting review:', error);
      throw error;
    }
  }, []);

  const isAuthenticated = useMemo(() => !!user, [user]);

  return useMemo(() => ({
    user,
    isAuthenticated,
    login,
    logout,
    updateUser,
    savedRestaurants,
    toggleSaveRestaurant,
    isRestaurantSaved,
    reviews,
    allReviews,
    addReview,
    getReviewsForRestaurant,
    deleteReview,
    pushToken,
  }), [user, isAuthenticated, login, logout, updateUser, savedRestaurants, toggleSaveRestaurant, isRestaurantSaved, reviews, allReviews, addReview, getReviewsForRestaurant, deleteReview, pushToken]);
});
