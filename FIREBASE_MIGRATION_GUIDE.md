# Firebase Migration Guide

Your app has been updated to use **Firestore** for data storage and **Firebase Storage** for image uploads!

## What Changed?

### Before:
- Data stored in AsyncStorage (local only)
- Backend sync via tRPC
- Data could be lost when switching devices
- Images stored as base64 strings (large data size)

### After:
- Data stored in Firestore (cloud database)
- Real-time sync across all devices automatically
- Images stored in Firebase Storage (optimized URLs)
- Automatic backup and recovery

## Setup Steps

### 1. Complete Firebase Setup

Follow the instructions in `FIREBASE_SETUP.md`:
- Create Firebase project
- Enable Firestore Database
- Enable Firebase Storage
- Add configuration to `.env` file

### 2. Firestore Security Rules

In the Firebase Console, go to **Firestore Database** → **Rules** and update:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Restaurants collection
    match /restaurants/{restaurantId} {
      allow read: if true;  // Public read
      allow write: if request.auth != null;  // Authenticated users can write
    }
    
    // Ads collection
    match /ads/{adId} {
      allow read: if true;  // Public read
      allow write: if request.auth != null;  // Authenticated users can write
    }
  }
}
```

### 3. Firebase Storage Rules

Go to **Storage** → **Rules** and update:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Restaurant images
    match /restaurants/{allPaths=**} {
      allow read: if true;  // Public read
      allow write: if request.auth != null;  // Authenticated users can upload
    }
    
    // Ad images
    match /ads/{allPaths=**} {
      allow read: if true;  // Public read
      allow write: if request.auth != null;  // Authenticated users can upload
    }
  }
}
```

## How It Works

### RestaurantContext

```typescript
import { useRestaurants } from '@/contexts/RestaurantContext';

function MyComponent() {
  const { 
    restaurants,      // Real-time synced data
    isLoading,        // Loading state
    error,            // Error state
    addRestaurant,    // Add new restaurant (auto-uploads images)
    updateRestaurant, // Update restaurant (auto-uploads new images)
    deleteRestaurant, // Delete restaurant
    toggleFeatured,   // Toggle featured status
    uploadImage       // Upload image manually
  } = useRestaurants();
}
```

### AdContext

```typescript
import { useAds } from '@/contexts/AdContext';

function MyComponent() {
  const { 
    ads,                        // Real-time synced data
    isLoading,                  // Loading state
    error,                      // Error state
    addAd,                      // Add new ad (auto-uploads image)
    updateAd,                   // Update ad (auto-uploads new image)
    deleteAd,                   // Delete ad
    getActivePopupAd,           // Get active popup ad
    incrementImpressions,       // Track ad impressions
    incrementClicks,            // Track ad clicks
    uploadImage                 // Upload image manually
  } = useAds();
}
```

## Key Features

### 1. Real-time Sync
Changes made on one device instantly appear on all other devices. No manual sync needed!

### 2. Automatic Image Uploads
When adding or updating restaurants/ads:
- Images starting with `data:` (base64) or `file:` (local file) are automatically uploaded to Firebase Storage
- The context returns a permanent download URL
- Images are optimized and stored in the cloud

### 3. Error Handling
Each context now has an `error` state that captures any Firebase errors.

### 4. Offline Support
Firestore has built-in offline persistence. Data will sync when the device comes back online.

## Migration Notes

### Data Migration
Since this switches from AsyncStorage to Firestore:
- Existing local data will NOT be automatically migrated
- On first load, if Firestore is empty, default restaurants from `RESTAURANTS` mock data will be loaded
- Any ads or restaurants added after setup will be stored in Firestore

### Admin Panel
The admin panel will now work seamlessly across devices:
1. Add restaurant/ad on iPhone → immediately visible on Android
2. Update data on Android → immediately visible on iPhone
3. No manual sync button needed!

## Troubleshooting

### "Permission denied" errors
- Check Firestore and Storage rules are set correctly
- Ensure you're authenticated if rules require authentication

### Images not uploading
- Check Storage rules allow write access
- Verify EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET is correct in .env
- Check console logs for specific error messages

### Data not syncing
- Verify Firestore Database is created and active
- Check EXPO_PUBLIC_FIREBASE_PROJECT_ID is correct in .env
- Open Firebase Console → Firestore Database to see if data is being written

### Empty data on startup
- Check console logs for Firebase initialization errors
- Verify all environment variables are set correctly
- Restart the app after setting environment variables

## Testing

1. **Add a restaurant on one device**
   - Should appear immediately on other devices
   - Check Firebase Console → Firestore to see the data

2. **Upload an image**
   - Should upload to Firebase Storage
   - Check Firebase Console → Storage to see the file
   - The restaurant/ad should have a `https://` URL

3. **Update data**
   - Changes should sync in real-time
   - No refresh needed

4. **Delete data**
   - Should be removed from all devices
   - Should be removed from Firestore

## Benefits

✅ No more sync issues between devices
✅ Data persists even if app is deleted and reinstalled
✅ Images are properly stored in cloud storage
✅ Real-time updates across all users
✅ Built-in offline support
✅ Automatic backups via Firebase
✅ Scalable to millions of users
✅ No need for custom backend sync logic
