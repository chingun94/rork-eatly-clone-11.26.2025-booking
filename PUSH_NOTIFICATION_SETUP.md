# Push Notifications Setup Guide

This guide explains how to set up Firebase Cloud Messaging (FCM) for push notifications in your app.

## 1. Update app.json

Add the following to your `app.json`:

```json
{
  "expo": {
    "notification": {
      "icon": "./assets/images/icon.png",
      "color": "#FF6B35",
      "androidMode": "default",
      "androidCollapsedTitle": "{{unread_count}} new notifications"
    },
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": [
          "location",
          "remote-notification"  // Add this
        ]
      }
    },
    "android": {
      "permissions": [
        // ... existing permissions
        "POST_NOTIFICATIONS"  // Add this
      ],
      "googleServicesFile": "./google-services.json"  // Add this
    },
    "plugins": [
      "expo-notifications",  // Add this at the beginning
      // ... rest of plugins
    ]
  }
}
```

## 2. Get Firebase Cloud Messaging Server Key

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `review-e8836`
3. Go to Project Settings (gear icon)
4. Navigate to "Cloud Messaging" tab
5. Under "Cloud Messaging API (Legacy)", copy the **Server Key**
6. Save this key securely - you'll need it for the backend

## 3. Download google-services.json (Android)

1. In Firebase Console > Project Settings
2. Under "Your apps", select your Android app
3. Download `google-services.json`
4. Place it in the root of your project

## 4. iOS APNs Configuration

1. In Firebase Console > Project Settings
2. Go to "Cloud Messaging" tab
3. Under "Apple app configuration", upload your APNs authentication key
4. This is required for iOS push notifications to work

## 5. Add Environment Variable

Create or update your `.env` file:

```
FIREBASE_SERVER_KEY=your_firebase_server_key_here
```

## 6. Testing Push Notifications

### On Device (Recommended):
1. Run the app on a physical device (push notifications don't work on simulators/emulators)
2. Log in to the app
3. Grant notification permissions when prompted
4. Go to Admin > Notifications
5. Send a test notification

### Check Token Registration:
- Check Firestore `users` collection
- Each user document should have a `pushToken` field
- This token is used to send notifications

## Architecture

The implementation consists of:

1. **User Context** (`contexts/UserContext.tsx`): 
   - Requests notification permissions on app start
   - Registers push token with Firestore
   - Updates token when it changes

2. **Backend Route** (`backend/trpc/routes/notifications/send/route.ts`):
   - Accepts notification title and body
   - Fetches all user push tokens from Firestore
   - Sends notifications via FCM API

3. **Admin Interface** (`app/admin/notifications/index.tsx`):
   - UI to compose and send notifications
   - Shows notification history

## Troubleshooting

### Notifications not received:
- Ensure you're testing on a physical device (not simulator/emulator)
- Check that notification permissions are granted
- Verify pushToken is saved in Firestore
- Check backend logs for FCM API errors

### "Missing google-services.json":
- Download from Firebase Console
- Place in project root
- Restart expo dev client

### iOS notifications not working:
- Ensure APNs key is uploaded to Firebase
- Check iOS capabilities include push notifications
- Verify bundle identifier matches Firebase configuration
