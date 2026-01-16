# Firestore Setup Guide

## Current Issues
1. App crashes on startup
2. Data gets deleted when app closes/reopens
3. Data not syncing between devices
4. Firestore shows "start collection" button (database not initialized)

## Root Cause
Your Firestore database has not been created yet. The app is trying to connect to a database that doesn't exist.

---

## Step-by-Step Setup Instructions

### 1. Create Firestore Database

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your project: `review-e8836`
3. Click **"Firestore Database"** in the left menu
4. Click **"Create database"** button

### 2. Database Configuration

When creating the database, you'll see these options:

**Database Edition:**
- Select **"Standard Edition"** (not Enterprise - that's for large companies)

**Location:**
- Choose a location closest to your users
- For Mongolia, select: **asia-east1** or **asia-northeast1**
- ⚠️ **Important**: Location cannot be changed later!

**Security Rules:**
- Select **"Start in test mode"**
- This allows all read/write access (perfect for development)
- Click **"Enable"**

### 3. Wait for Database Creation
- Firebase will create your database (takes 1-2 minutes)
- You'll see the Firestore console when ready

### 4. Verify Firestore Rules

After database is created:

1. Go to **"Rules"** tab in Firestore
2. You should see something like:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, XX, XX);
    }
  }
}
```

3. **Replace it with** (for development):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. Click **"Publish"**

⚠️ **Note**: These rules allow anyone to read/write. For production, you should add proper authentication rules.

### 5. Verify Storage Rules

1. Go to **"Storage"** in Firebase Console
2. Click **"Rules"** tab
3. Make sure it looks like this:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

4. If different, update and click **"Publish"**

### 6. Test the App

After completing the above steps:

1. **Close the app completely** on all devices (force close)
2. **Open the app again**
3. The app should now load without crashing
4. Go to Admin panel
5. Add a test restaurant
6. Add a test ad
7. Check on other device - data should sync!

---

## Expected Results After Setup

✅ **Connection Status**: Should show "✅ Active" and "✅ Connected"
✅ **No Crashes**: App loads smoothly
✅ **Data Persists**: Restaurants and ads stay after closing/reopening app
✅ **Cross-Device Sync**: Data created on iPhone appears on Android (and vice versa)
✅ **Firestore Console**: You'll see `restaurants` and `ads` collections with documents

---

## Troubleshooting

### If app still crashes:
1. Check console logs for specific errors
2. Verify Firebase config in `config/firebase.ts` matches your project
3. Make sure internet connection is working
4. Try uninstalling and reinstalling the app

### If data doesn't sync:
1. Check Firestore rules are set correctly (allow read, write: if true)
2. Check both devices have internet connection
3. Look at console logs for "permission-denied" or "unavailable" errors
4. Use the Diagnostics page in admin to check connection status

### If you see "permission-denied" error:
- Your Firestore rules are too restrictive
- Go back to Step 4 and update rules

### If you see "unavailable" error:
- Check internet connection
- Firestore service might be down (rare)
- Try restarting the app

---

## What Collections Will Be Created?

Once you add data, Firestore will automatically create these collections:

- **`restaurants`**: All restaurant data
- **`ads`**: All ad campaign data

These collections are created automatically when you add the first document. You don't need to manually create them.

---

## Security Note

The rules we set above (`allow read, write: if true`) are for **DEVELOPMENT ONLY**.

For production, you should update the rules to require authentication:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /restaurants/{restaurant} {
      allow read: if true;  // Anyone can read
      allow write: if request.auth != null;  // Only authenticated users can write
    }
    match /ads/{ad} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

But for now, focus on getting it working first!

---

## Need Help?

If you're still having issues after following these steps:
1. Check the console logs in your app
2. Look at the error messages in the diagnostics page
3. Share the specific error messages for more targeted help
