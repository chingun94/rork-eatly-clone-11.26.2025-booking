import createContextHook from "@nkzw/create-context-hook";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Restaurant,
  FeaturedTimeline,
  CategoryFeatured,
} from "@/types/restaurant";
import {
  getStorage,
  ensureNetworkEnabled,
} from "@/config/firebase";
import {
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  waitForPendingWrites,
  addDoc,
  collection,
  getFirestore,
  getDocs,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";
import { trpcClient } from '@/lib/trpc';

const COLLECTION_NAME = "restaurants";

const firebaseConfig = {
  apiKey: "AIzaSyA0pWGIav6WLKMeEhq-p5q-GsNfE69HLuk",
  authDomain: "eatly-dev-f4f83.firebaseapp.com",
  projectId: "eatly-dev-f4f83",
  storageBucket: "eatly-dev-f4f83.firebasestorage.app",
  messagingSenderId: "1048705518768",
  appId: "1:1048705518768:web:7ee7ca36118c9869da3f75",
  measurementId: "G-DD9BV32S63",
};

const app = initializeApp(firebaseConfig);
export const getDb = () => getFirestore(app);

export const [RestaurantProvider, useRestaurants] = createContextHook(() => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionSeed] = useState(() => Math.random());

  const syncRestaurantsToBackend = useCallback(async (currentRestaurants: Restaurant[]) => {
    if (!trpcClient) {
      console.log('RestaurantContext: Backend not configured, skipping sync');
      return;
    }
    
    try {
      console.log('RestaurantContext: Syncing restaurants to backend, count:', currentRestaurants.length);
      await trpcClient.restaurants.sync.mutate(currentRestaurants);
      console.log('RestaurantContext: Sync to backend completed');
    } catch (error) {
      console.warn('RestaurantContext: Backend sync failed (non-critical):', error instanceof Error ? error.message : error);
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

            console.log('RestaurantContext: 🔥 Firestore snapshot received, doc count:', snapshot.docs.length);
            const data = snapshot.docs.map((doc) => {
              const docData = doc.data();
              return {
                id: doc.id,
                ...docData,
              };
            }) as Restaurant[];

            console.log('RestaurantContext: Updating local restaurants state');
            setRestaurants(data);
            setIsLoading(false);
            setError(null);
            setIsConnected(!snapshot.metadata.fromCache);
            
            syncRestaurantsToBackend(data);
          },
          (err) => {
            if (!mounted) return;

            let errorMessage = err.message;
            if (err.code === "permission-denied") {
              errorMessage =
                "Permission denied. Check Firestore rules in Firebase Console.";
            } else if (err.code === "unavailable") {
              errorMessage =
                "Network unavailable. Check your internet connection.";
            }

            setError(errorMessage);
            setIsLoading(false);
            setIsConnected(false);
          }
        );
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "Failed to connect to database.");
        setIsLoading(false);
        setIsConnected(false);
      }
    };

    setupListener();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };
  }, [syncRestaurantsToBackend]);

  const uploadImage = useCallback(
    async (uri: string, path: string): Promise<string> => {
      try {
        console.log("RestaurantContext: Uploading image to Storage");
        const storageInstance = getStorage();
        if (!storageInstance) {
          throw new Error("Storage not initialized");
        }
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(
          storageInstance,
          `restaurants/${path}_${Date.now()}`
        );
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        console.log("RestaurantContext: Image uploaded successfully");
        return downloadURL;
      } catch (error: any) {
        console.error("RestaurantContext: Error uploading image:", error);
        throw error;
      }
    },
    []
  );

  const addRestaurant = useCallback(
    async (restaurant: Omit<Restaurant, "id">) => {
      try {
        console.log(
          "RestaurantContext: Adding new restaurant:",
          restaurant.name
        );
        console.log(
          "RestaurantContext: Image count:",
          restaurant.images?.length || 0
        );

        let imageUrl = restaurant.image;
        if (
          restaurant.image &&
          (restaurant.image.startsWith("data:") ||
            restaurant.image.startsWith("file:"))
        ) {
          console.log("RestaurantContext: Uploading main image...");
          imageUrl = await uploadImage(restaurant.image, "main");
          console.log("RestaurantContext: Main image uploaded");
        }

        let imagesUrls = restaurant.images;
        if (restaurant.images && restaurant.images.length > 0) {
          console.log("RestaurantContext: Uploading gallery images...");
          imagesUrls = await Promise.all(
            restaurant.images.map(async (img, idx) => {
              if (img && (img.startsWith("data:") || img.startsWith("file:"))) {
                console.log(`RestaurantContext: Uploading image ${idx + 1}...`);
                return await uploadImage(img, `gallery_${idx}`);
              }
              return img;
            })
          );
          console.log("RestaurantContext: All gallery images uploaded");
        }

        const dbInstance = getDb();
        if (!dbInstance) {
          throw new Error("Database not initialized");
        }

        await ensureNetworkEnabled();

        console.log(
          "RestaurantContext: Attempting to add document to Firestore..."
        );
        const docRef = await addDoc(collection(dbInstance, COLLECTION_NAME), {
          ...restaurant,
          image: imageUrl,
          images: imagesUrls,
        });

        console.log("RestaurantContext: Restaurant added with ID:", docRef.id);
        console.log(
          "RestaurantContext: ⏳ Waiting for server confirmation (30 second timeout)..."
        );

        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    "TIMEOUT: Server did not confirm write within 30 seconds"
                  )
                ),
              30000
            )
          );

          await Promise.race([
            waitForPendingWrites(dbInstance),
            timeoutPromise,
          ]);

          console.log("RestaurantContext: ✅ waitForPendingWrites completed");
          console.log(
            "RestaurantContext: 🔍 Verifying data actually reached server..."
          );

          await new Promise((resolve) => setTimeout(resolve, 2000));

          const { getDoc } = await import("firebase/firestore");
          const verifyDoc = await getDoc(
            doc(dbInstance, COLLECTION_NAME, docRef.id)
          );

          if (!verifyDoc.exists()) {
            console.error(
              "RestaurantContext: ❌ VERIFICATION FAILED: Document does not exist on server!"
            );
            throw new Error(
              "Document was not saved to server. This indicates a Firestore security rules issue."
            );
          }

          console.log(
            "RestaurantContext: ✅✅✅ VERIFIED! Data confirmed on server"
          );
          console.log("RestaurantContext: Document metadata:", {
            fromCache: verifyDoc.metadata.fromCache,
            hasPendingWrites: verifyDoc.metadata.hasPendingWrites,
          });

          if (
            verifyDoc.metadata.fromCache &&
            !verifyDoc.metadata.hasPendingWrites
          ) {
            console.warn(
              "RestaurantContext: ⚠️ WARNING: Document exists but only in cache!"
            );
            console.warn(
              "RestaurantContext: This may indicate a rules issue or offline mode"
            );
          }
        } catch (syncError: any) {
          console.error(
            "RestaurantContext: =========================================="
          );
          console.error(
            "RestaurantContext: ❌❌❌ CRITICAL ERROR: Write failed to sync!"
          );
          console.error(
            "RestaurantContext: =========================================="
          );
          console.error("RestaurantContext: Error type:", typeof syncError);
          console.error("RestaurantContext: Error name:", syncError?.name);
          console.error(
            "RestaurantContext: Error message:",
            syncError?.message
          );
          console.error("RestaurantContext: Error code:", syncError?.code);
          console.error("RestaurantContext: Error stack:", syncError?.stack);
          console.error(
            "RestaurantContext: =========================================="
          );
          console.error("RestaurantContext: ⚠️ Data was saved LOCALLY ONLY");
          console.error(
            "RestaurantContext: ⚠️ It will DISAPPEAR when you restart the app"
          );
          console.error("RestaurantContext: ⚠️ This usually means:");
          console.error(
            "RestaurantContext:    1. Firestore security rules are blocking the write"
          );
          console.error(
            "RestaurantContext:    2. Network connection lost during sync"
          );
          console.error(
            "RestaurantContext:    3. Firebase project misconfigured"
          );
          console.error(
            "RestaurantContext: =========================================="
          );

          let errorMsg = "SYNC FAILED: ";
          if (syncError?.message?.includes("TIMEOUT")) {
            errorMsg +=
              "Server did not confirm the write. This almost certainly means your Firestore security rules are blocking the write. Check Firebase Console > Firestore Database > Rules and verify the admin UID matches your authenticated user UID.";
          } else if (syncError?.code === "permission-denied") {
            errorMsg +=
              "Permission denied by Firestore rules. Go to Firebase Console > Firestore Database > Rules and verify your admin UID (18T9pxL5mqRKAzBnKzvcNklVWY43) is correct.";
          } else if (syncError?.message?.includes("does not exist")) {
            errorMsg +=
              "Document failed to save to server. Firestore rules are likely rejecting the write. Verify rules and authentication.";
          } else {
            errorMsg +=
              "Failed to sync: " + (syncError?.message || "Unknown error");
          }

          throw new Error(errorMsg);
        }
        return {
          id: docRef.id,
          ...restaurant,
          image: imageUrl,
          images: imagesUrls,
        } as Restaurant;
      } catch (error: any) {
        console.error("RestaurantContext: Error adding restaurant:", error);
        console.error("RestaurantContext: Error code:", error.code);
        console.error("RestaurantContext: Error message:", error.message);
        console.error("RestaurantContext: Error stack:", error.stack);
        throw error;
      }
    },
    [uploadImage]
  );

  const updateRestaurant = useCallback(
    async (id: string, updates: Partial<Restaurant>) => {
      try {
        console.log("RestaurantContext: Updating restaurant:", id);

        const updateData = { ...updates };

        if (
          updates.image &&
          (updates.image.startsWith("data:") ||
            updates.image.startsWith("file:"))
        ) {
          updateData.image = await uploadImage(updates.image, "main");
        }

        if (updates.images && updates.images.length > 0) {
          updateData.images = await Promise.all(
            updates.images.map(async (img, idx) => {
              if (img.startsWith("data:") || img.startsWith("file:")) {
                return await uploadImage(img, `gallery_${idx}`);
              }
              return img;
            })
          );
        }

        const cleanedData: Record<string, any> = {};
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== undefined) {
            cleanedData[key] = value;
          }
        });

        const dbInstance = getDb();
        if (!dbInstance) {
          throw new Error("Database not initialized");
        }
        const docRef = doc(dbInstance, COLLECTION_NAME, id);
        await updateDoc(docRef, cleanedData);
        console.log("RestaurantContext: Restaurant updated successfully");
      } catch (error: any) {
        console.error("RestaurantContext: Error updating restaurant:", error);
        throw error;
      }
    },
    [uploadImage]
  );

  const deleteRestaurant = useCallback(async (id: string) => {
    try {
      console.log("RestaurantContext: Deleting restaurant:", id);
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error("Database not initialized");
      }
      const docRef = doc(dbInstance, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      console.log("RestaurantContext: Restaurant deleted successfully");
    } catch (error: any) {
      console.error("RestaurantContext: Error deleting restaurant:", error);
      throw error;
    }
  }, []);

  const getRestaurantById = useCallback(
    (id: string) => restaurants.find((r) => r.id === id),
    [restaurants]
  );

  const toggleFeatured = useCallback(
    async (id: string) => {
      try {
        const restaurant = restaurants.find((r) => r.id === id);
        if (!restaurant) return;

        console.log("RestaurantContext: Toggling featured status for:", id);
        const dbInstance = getDb();
        if (!dbInstance) {
          throw new Error("Database not initialized");
        }
        const docRef = doc(dbInstance, COLLECTION_NAME, id);
        await updateDoc(docRef, {
          isFeatured: !restaurant.isFeatured,
        });
        console.log("RestaurantContext: Featured status toggled");
      } catch (error: any) {
        console.error("RestaurantContext: Error toggling featured:", error);
        throw error;
      }
    },
    [restaurants]
  );

  const setFeaturedTimeline = useCallback(
    async (id: string, timeline: FeaturedTimeline | null) => {
      try {
        console.log("RestaurantContext: Setting featured timeline for:", id);
        const dbInstance = getDb();
        if (!dbInstance) {
          throw new Error("Database not initialized");
        }
        const docRef = doc(dbInstance, COLLECTION_NAME, id);
        await updateDoc(docRef, {
          featuredTimeline: timeline,
          isFeatured: timeline ? true : false,
        });
        console.log("RestaurantContext: Featured timeline set");
      } catch (error: any) {
        console.error(
          "RestaurantContext: Error setting featured timeline:",
          error
        );
        throw error;
      }
    },
    []
  );

  const setCategoryFeatured = useCallback(
    async (id: string, categoryFeatured: CategoryFeatured) => {
      try {
        console.log("RestaurantContext: Setting category featured for:", id);
        const dbInstance = getDb();
        if (!dbInstance) {
          throw new Error("Database not initialized");
        }
        const docRef = doc(dbInstance, COLLECTION_NAME, id);
        await updateDoc(docRef, {
          categoryFeatured,
        });
        console.log("RestaurantContext: Category featured set");
      } catch (error: any) {
        console.error(
          "RestaurantContext: Error setting category featured:",
          error
        );
        throw error;
      }
    },
    []
  );

  const isFeaturedActive = useCallback((restaurant: Restaurant): boolean => {
    if (!restaurant.isFeatured) return false;
    
    if (!restaurant.featuredTimeline) {
      return true;
    }
    
    const now = new Date();
    const start = new Date(restaurant.featuredTimeline.startDate);
    const end = new Date(restaurant.featuredTimeline.endDate);
    return now >= start && now <= end;
  }, []);

  const isCategoryFeaturedActive = useCallback(
    (
      restaurant: Restaurant,
      category: "cuisine" | "serviceStyle" | "ambiance",
      value?: string
    ): boolean => {
      if (!restaurant.categoryFeatured) return false;

      const now = new Date();

      if (category === "cuisine" && restaurant.categoryFeatured.cuisine) {
        const start = new Date(restaurant.categoryFeatured.cuisine.startDate);
        const end = new Date(restaurant.categoryFeatured.cuisine.endDate);
        return now >= start && now <= end;
      }

      if (
        category === "serviceStyle" &&
        restaurant.categoryFeatured.serviceStyle
      ) {
        const start = new Date(
          restaurant.categoryFeatured.serviceStyle.startDate
        );
        const end = new Date(restaurant.categoryFeatured.serviceStyle.endDate);
        return now >= start && now <= end;
      }

      if (
        category === "ambiance" &&
        value &&
        restaurant.categoryFeatured.ambiance?.[value]
      ) {
        const timeline = restaurant.categoryFeatured.ambiance[value];
        const start = new Date(timeline.startDate);
        const end = new Date(timeline.endDate);
        return now >= start && now <= end;
      }

      return false;
    },
    []
  );

  const getFranchiseBranches = useCallback(
    (parentRestaurantId: string): Restaurant[] => {
      return restaurants.filter(
        (r) => r.parentRestaurantId === parentRestaurantId
      );
    },
    [restaurants]
  );

  const updateRestaurantRatings = useCallback(
    async (restaurantId: string) => {
      try {
        console.log('RestaurantContext: ===== STARTING RATING UPDATE =====');
        console.log('RestaurantContext: Restaurant ID:', restaurantId);
        const dbInstance = getDb();
        if (!dbInstance) {
          console.warn('RestaurantContext: Database not initialized');
          return;
        }

        console.log('RestaurantContext: Fetching reviews from Firestore...');
        const reviewsRef = collection(dbInstance, 'reviews');
        const q = query(reviewsRef, where('restaurantId', '==', restaurantId));
        const snapshot = await getDocs(q);

        const reviews = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log('RestaurantContext: Review found:', { id: doc.id, rating: data.rating, userId: data.userId });
          return data;
        });
        console.log('RestaurantContext: Total reviews found:', reviews.length);

        if (reviews.length === 0) {
          console.log('RestaurantContext: No reviews found, NOT updating (keeping initial rating)');
          return;
        }

        const totalRating = reviews.reduce((sum, review: any) => {
          const rating = review.rating || 0;
          console.log('RestaurantContext: Adding rating:', rating);
          return sum + rating;
        }, 0);
        const avgRating = Math.round((totalRating / reviews.length) * 10) / 10;

        console.log('RestaurantContext: Total rating sum:', totalRating);
        console.log('RestaurantContext: Calculated average rating:', avgRating, 'from', reviews.length, 'reviews');

        const restaurantRef = doc(dbInstance, COLLECTION_NAME, restaurantId);
        console.log('RestaurantContext: Updating Firestore document...');
        await updateDoc(restaurantRef, {
          rating: avgRating,
          reviewCount: reviews.length,
        });

        console.log('RestaurantContext: ✅ Successfully updated restaurant in Firestore');
        console.log('RestaurantContext: - New rating:', avgRating);
        console.log('RestaurantContext: - New review count:', reviews.length);
        console.log('RestaurantContext: ===== RATING UPDATE COMPLETE =====');
        
        console.log('RestaurantContext: Waiting for snapshot listener to update local state...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('RestaurantContext: Local state should now be updated');
      } catch (error: any) {
        console.error('RestaurantContext: ❌ ERROR updating restaurant ratings:', error);
        console.error('RestaurantContext: Error details:', error.message, error.code);
      }
    },
    []
  );

  const setWeekSpecial = useCallback(
    async (id: string, timeline: FeaturedTimeline | null) => {
      try {
        console.log('RestaurantContext: Setting week special for:', id);
        const dbInstance = getDb();
        if (!dbInstance) {
          throw new Error('Database not initialized');
        }
        const docRef = doc(dbInstance, COLLECTION_NAME, id);
        await updateDoc(docRef, {
          weekSpecialTimeline: timeline,
          isWeekSpecial: timeline ? true : false,
        });
        console.log('RestaurantContext: Week special set');
      } catch (error: any) {
        console.error('RestaurantContext: Error setting week special:', error);
        throw error;
      }
    },
    []
  );

  const setDiscount = useCallback(
    async (id: string, timeline: FeaturedTimeline | null, discountAmount?: string) => {
      try {
        console.log('RestaurantContext: Setting discount for:', id);
        const dbInstance = getDb();
        if (!dbInstance) {
          throw new Error('Database not initialized');
        }
        const docRef = doc(dbInstance, COLLECTION_NAME, id);
        await updateDoc(docRef, {
          discountTimeline: timeline,
          hasDiscount: timeline ? true : false,
          discountAmount: discountAmount || null,
        });
        console.log('RestaurantContext: Discount set');
      } catch (error: any) {
        console.error('RestaurantContext: Error setting discount:', error);
        throw error;
      }
    },
    []
  );

  const setTop10 = useCallback(
    async (id: string, timeline: FeaturedTimeline | null, rank?: number) => {
      try {
        console.log('RestaurantContext: Setting top 10 for:', id);
        const dbInstance = getDb();
        if (!dbInstance) {
          throw new Error('Database not initialized');
        }
        const docRef = doc(dbInstance, COLLECTION_NAME, id);
        await updateDoc(docRef, {
          top10Timeline: timeline,
          isTop10: timeline ? true : false,
          top10Rank: rank || null,
        });
        console.log('RestaurantContext: Top 10 set');
      } catch (error: any) {
        console.error('RestaurantContext: Error setting top 10:', error);
        throw error;
      }
    },
    []
  );

  const isWeekSpecialActive = useCallback((restaurant: Restaurant): boolean => {
    if (!restaurant.isWeekSpecial || !restaurant.weekSpecialTimeline) return false;
    const now = new Date();
    const start = new Date(restaurant.weekSpecialTimeline.startDate);
    const end = new Date(restaurant.weekSpecialTimeline.endDate);
    return now >= start && now <= end;
  }, []);

  const isDiscountActive = useCallback((restaurant: Restaurant): boolean => {
    if (!restaurant.hasDiscount || !restaurant.discountTimeline) return false;
    const now = new Date();
    const start = new Date(restaurant.discountTimeline.startDate);
    const end = new Date(restaurant.discountTimeline.endDate);
    return now >= start && now <= end;
  }, []);

  const isTop10Active = useCallback((restaurant: Restaurant): boolean => {
    if (!restaurant.isTop10 || !restaurant.top10Timeline) return false;
    const now = new Date();
    const start = new Date(restaurant.top10Timeline.startDate);
    const end = new Date(restaurant.top10Timeline.endDate);
    return now >= start && now <= end;
  }, []);

  return useMemo(
    () => ({
      restaurants,
      isLoading,
      error,
      isConnected,
      sessionSeed,
      addRestaurant,
      updateRestaurant,
      deleteRestaurant,
      getRestaurantById,
      toggleFeatured,
      setFeaturedTimeline,
      setCategoryFeatured,
      isFeaturedActive,
      isCategoryFeaturedActive,
      uploadImage,
      getFranchiseBranches,
      updateRestaurantRatings,
      setWeekSpecial,
      setDiscount,
      setTop10,
      isWeekSpecialActive,
      isDiscountActive,
      isTop10Active,
    }),
    [
      restaurants,
      isLoading,
      error,
      isConnected,
      sessionSeed,
      addRestaurant,
      updateRestaurant,
      deleteRestaurant,
      getRestaurantById,
      toggleFeatured,
      setFeaturedTimeline,
      setCategoryFeatured,
      isFeaturedActive,
      isCategoryFeaturedActive,
      uploadImage,
      getFranchiseBranches,
      updateRestaurantRatings,
      setWeekSpecial,
      setDiscount,
      setTop10,
      isWeekSpecialActive,
      isDiscountActive,
      isTop10Active,
    ]
  );
});
