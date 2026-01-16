# Firestore Security Rules Fix

## Problem
Data is being saved locally but not persisting to Firestore server. When you restart the app, the data disappears.

## Root Cause
Firestore Security Rules are blocking write operations because:
1. The authenticated user UID doesn't match the admin UID in the rules, OR
2. The rules are too restrictive

## Solution

### Step 1: Get Your Current User UID

1. Open the app and login as admin
2. Go to **Admin Dashboard** → **Diagnostics** (or Admin Settings → Diagnostics)
3. Look for "User UID" in the Connection Status section
4. Copy this UID - you'll need it for Step 2

Example: `18T9pxL5mqRKAzBnKzvcNklVWY43`

### Step 2: Update Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **review-e8836**
3. In the left sidebar, click **Firestore Database**
4. Click the **Rules** tab at the top
5. Replace the existing rules with these updated rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      // IMPORTANT: Replace this UID with YOUR UID from Step 1
      return request.auth != null && request.auth.uid == "YOUR_UID_HERE";
    }
    
    // Allow anyone to read restaurants and ads (for mobile app users)
    match /restaurants/{restaurantId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /ads/{adId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // All other collections require admin
    match /{document=**} {
      allow read, write: if isAdmin();
    }
  }
}
```

6. **IMPORTANT**: Replace `"YOUR_UID_HERE"` with your actual UID from Step 1
7. Click **Publish** button to save the rules

### Step 3: Verify the Fix

1. Go back to the app
2. Go to **Admin Dashboard** → **Diagnostics**
3. Click the **Refresh** button
4. Check that:
   - Connection Status shows "✅ Active"
   - Firebase Auth User shows "✅ [your-email]"
   - Both listeners show "✅ Connected"
5. Try adding a new restaurant
6. Close and reopen the app
7. The restaurant should still be there!

## Alternative: Temporary Development Rules

If you're still testing and want to allow all writes temporarily (NOT RECOMMENDED FOR PRODUCTION):

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // WARNING: This allows anyone to read/write. Only use for testing!
      allow read, write: if true;
    }
  }
}
```

**⚠️ IMPORTANT**: These open rules are ONLY for development. Before launching your app, implement proper security rules!

## Troubleshooting

### Error: "Permission Denied"
- Your UID in the rules doesn't match your authenticated user UID
- Double-check you copied the UID correctly from the Diagnostics screen
- Make sure you published the rules in Firebase Console

### Error: "Connection Failed"
- Check your internet connection
- Verify the Firebase config in `config/firebase.ts` is correct
- Check that your Firebase project is active

### Data still disappearing after restart
1. Clear app cache completely
2. Uninstall and reinstall the app
3. Login again and check Diagnostics
4. Verify Firestore rules are published

### Multiple admins
To add multiple admin users, change the isAdmin() function:

```javascript
function isAdmin() {
  let adminUIDs = [
    "uid_of_admin_1",
    "uid_of_admin_2",
    "uid_of_admin_3"
  ];
  return request.auth != null && adminUIDs.hasAny([request.auth.uid]);
}
```

## Need Help?

If you're still experiencing issues:
1. Check the console logs for detailed error messages
2. Use the Diagnostics page to verify connection status
3. Make sure your Firebase project billing is active (Firestore requires Blaze plan for production)
