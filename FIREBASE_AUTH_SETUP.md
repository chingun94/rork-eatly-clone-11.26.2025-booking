# Firebase Authentication Setup for Admin

Follow these steps to complete the Firebase setup for your admin panel:

## Step 1: Create Admin User in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **review-e8836**
3. Click on **Authentication** in the left sidebar
4. Click on **Users** tab
5. Click **Add user** button
6. Enter the following:
   - **Email**: `admin@eatly.com`
   - **Password**: `Admin 9496` (or your preferred password)
7. Click **Add user**

## Step 2: Update Firestore Security Rules

1. In Firebase Console, go to **Firestore Database**
2. Click on **Rules** tab
3. Replace the existing rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users (admin) to read/write restaurants
    match /restaurants/{restaurant} {
      allow read: if true;  // Anyone can read restaurants
      allow write: if request.auth != null;  // Only authenticated users can write
    }
    
    // Allow authenticated users (admin) to read/write ads
    match /ads/{ad} {
      allow read: if true;  // Anyone can read ads
      allow write: if request.auth != null;  // Only authenticated users can write
    }
    
    // Block all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

4. Click **Publish**

## Step 3: Update Storage Security Rules

1. In Firebase Console, go to **Storage**
2. Click on **Rules** tab
3. Replace the existing rules with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow anyone to read
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Only authenticated users (admin) can upload to restaurants folder
    match /restaurants/{fileName} {
      allow write: if request.auth != null;
    }
    
    // Only authenticated users (admin) can upload to ads folder
    match /ads/{fileName} {
      allow write: if request.auth != null;
    }
  }
}
```

4. Click **Publish**

## Important Notes

- The admin login password in the app is: **Admin 9496**
- The Firebase Auth password should also be: **Admin 9496**
- If you set a different Firebase password when creating the admin user, you need to update `DEFAULT_PASSWORD` in `contexts/AdminContext.tsx`
- The app will automatically sign in to Firebase Auth when you log in to the admin panel
- Make sure both passwords match for the authentication to work properly

## Troubleshooting

### "Permission denied" error when adding restaurants or ads:
- Make sure you've created the admin user in Firebase Authentication
- Check that the email is exactly: `admin@eatly.com`
- Check that the password matches the `DEFAULT_PASSWORD` in the code
- Verify that Firestore and Storage rules are updated correctly

### Restaurant/Ad appears but disappears after app restart:
- This means data is being written to local cache but failing to sync to Firestore
- Check Firestore rules are configured correctly
- Verify you're authenticated (check console logs for "Firebase Auth successful")
- Make sure you're connected to the internet

### "User does not have permission to access storage" error:
- Verify Storage rules are updated
- Make sure you're signed in as admin (check console logs)
- Try logging out and logging in again
