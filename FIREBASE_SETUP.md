# Firebase Setup Guide

Firebase has been successfully integrated into your React Native app! Follow these steps to complete the setup:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter your project name and follow the setup wizard

## 2. Register Your App

### For Web (Required for Expo Go)
1. In your Firebase project, click the **Web** icon (</>)
2. Register your app with a nickname
3. Copy the `firebaseConfig` object

### For iOS (Optional)
1. Click the **iOS** icon
2. Enter your bundle ID: `app.rork.dinereview-restaurants-6524pphm`
3. Download `GoogleService-Info.plist`

### For Android (Optional)
1. Click the **Android** icon
2. Enter your package name: `app.rork.dinereview_restaurants_6524pphm`
3. Download `google-services.json`

## 3. Configure Environment Variables

Create a `.env` file in the root of your project:

\`\`\`bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
\`\`\`

Replace the values with your Firebase project configuration.

## 4. Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get started**
3. Enable **Email/Password** sign-in method
4. Optionally enable other providers (Google, Facebook, etc.)

## 5. Setup Firestore Database (REQUIRED)

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (change rules later for production)
4. Select a location closest to your users
5. Wait for the database to be created

## 6. Setup Firebase Storage (REQUIRED)

1. Go to **Storage**
2. Click **Get started**
3. Choose **Start in test mode** (change rules later for production)
4. Select the same location as your Firestore database
5. Wait for storage to be initialized

## 7. Usage in Your App

### Using Firebase Auth

\`\`\`typescript
import { useFirebase } from '@/contexts/FirebaseContext';

function MyComponent() {
  const { user, signIn, signUp, signOut, isAuthenticated } = useFirebase();

  // Sign in
  const handleSignIn = async () => {
    const result = await signIn('email@example.com', 'password');
    if (result.success) {
      console.log('Signed in!', result.user);
    }
  };

  // Sign up
  const handleSignUp = async () => {
    const result = await signUp('email@example.com', 'password', 'Display Name');
    if (result.success) {
      console.log('Account created!', result.user);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    // Your UI
  );
}
\`\`\`

### Using Firestore

\`\`\`typescript
import { db } from '@/config/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// Add document
const addRestaurant = async (data) => {
  const docRef = await addDoc(collection(db, 'restaurants'), data);
  console.log('Document written with ID:', docRef.id);
};

// Get documents
const getRestaurants = async () => {
  const querySnapshot = await getDocs(collection(db, 'restaurants'));
  const restaurants = [];
  querySnapshot.forEach((doc) => {
    restaurants.push({ id: doc.id, ...doc.data() });
  });
  return restaurants;
};

// Update document
const updateRestaurant = async (id, data) => {
  const docRef = doc(db, 'restaurants', id);
  await updateDoc(docRef, data);
};

// Delete document
const deleteRestaurant = async (id) => {
  await deleteDoc(doc(db, 'restaurants', id));
};
\`\`\`

### Using Storage

\`\`\`typescript
import { storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Upload file
const uploadImage = async (uri: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, \`images/\${Date.now()}\`);
  await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};
\`\`\`

## 7. Test Firebase Example

Navigate to `/firebase-example` in your app to test the authentication flow.

## Important Notes

- **Web Compatibility**: This setup uses the Firebase Web SDK which works with Expo Go and React Native Web
- **Security**: Never commit your `.env` file to version control
- **Production**: Update Firestore rules before deploying to production
- **Limitations**: Some Firebase features may not work on web (e.g., phone authentication)

## Security Rules

### Firestore Rules (Production)
\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // All authenticated users can read restaurants
    match /restaurants/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Adjust based on your needs
    }
  }
}
\`\`\`

### Storage Rules (Production)
\`\`\`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{imageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
\`\`\`

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
