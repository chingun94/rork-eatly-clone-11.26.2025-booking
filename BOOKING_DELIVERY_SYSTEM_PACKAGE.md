# 📦 Booking & Delivery System Package

Complete package of all files needed for the booking and delivery system. Copy the entire structure below to your new project.

## 📁 Required Folder Structure

```
your-project/
├── types/
│   ├── booking.ts
│   ├── restaurant-staff.ts
│   └── delivery.ts
│
├── contexts/
│   ├── BookingContext.tsx
│   ├── RestaurantStaffAuthContext.tsx
│   ├── CartContext.tsx
│   ├── OrderContext.tsx
│   └── MenuContext.tsx
│
├── utils/
│   ├── bookingFirebase.ts
│   ├── staffFirebase.ts
│   └── floorPlanFirebase.ts
│
├── app/
│   ├── booking.tsx
│   ├── cart.tsx
│   ├── order-tracking.tsx
│   │
│   ├── restaurant/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── index.tsx (Dashboard)
│   │   ├── reservations.tsx
│   │   ├── availability.tsx
│   │   ├── floorplan.tsx
│   │   └── notifications.tsx
│   │
│   └── (tabs)/(home)/
│       └── menu.tsx
│
└── backend/
    └── trpc/
        └── routes/
            ├── bookings/
            │   ├── store.ts
            │   ├── get-all/route.ts
            │   ├── create/route.ts
            │   ├── update/route.ts
            │   ├── cancel/route.ts
            │   ├── get-availability/route.ts
            │   └── set-availability/route.ts
            │
            ├── staff/
            │   ├── store.ts
            │   ├── get-all/route.ts
            │   ├── create/route.ts
            │   ├── update/route.ts
            │   ├── delete/route.ts
            │   ├── authenticate/route.ts
            │   └── sync/route.ts
            │
            ├── floorplans/
            │   ├── store.ts
            │   ├── get-all/route.ts
            │   ├── get/route.ts
            │   ├── create/route.ts
            │   ├── update/route.ts
            │   └── delete/route.ts
            │
            ├── orders/
            │   ├── store.ts
            │   ├── get-all/route.ts
            │   ├── get/route.ts
            │   ├── create/route.ts
            │   ├── update-status/route.ts
            │   ├── update-driver-location/route.ts
            │   └── stats/route.ts
            │
            ├── menu/
            │   ├── store.ts
            │   ├── get-all/route.ts
            │   ├── create/route.ts
            │   ├── update/route.ts
            │   ├── toggle-availability/route.ts
            │   ├── delete/route.ts
            │   └── categories/route.ts
            │
            └── drivers/
                ├── store.ts
                ├── get-all/route.ts
                ├── create/route.ts
                ├── update/route.ts
                └── update-location/route.ts
```

## 📋 File Checklist

### Types (3 files)
- [ ] `types/booking.ts` - Booking type definitions
- [ ] `types/restaurant-staff.ts` - Staff type definitions
- [ ] `types/delivery.ts` - Delivery & order type definitions

### Contexts (5 files)
- [ ] `contexts/BookingContext.tsx` - Booking state management
- [ ] `contexts/RestaurantStaffAuthContext.tsx` - Staff authentication
- [ ] `contexts/CartContext.tsx` - Shopping cart state
- [ ] `contexts/OrderContext.tsx` - Order state management
- [ ] `contexts/MenuContext.tsx` - Menu state management

### Utils (3 files)
- [ ] `utils/bookingFirebase.ts` - Booking Firebase operations
- [ ] `utils/staffFirebase.ts` - Staff Firebase operations
- [ ] `utils/floorPlanFirebase.ts` - Floor plan Firebase operations

### App Pages (11 files)
- [ ] `app/booking.tsx` - User booking page
- [ ] `app/cart.tsx` - Shopping cart page
- [ ] `app/order-tracking.tsx` - Live order tracking
- [ ] `app/(tabs)/(home)/menu.tsx` - Restaurant menu browsing
- [ ] `app/restaurant/_layout.tsx` - Restaurant section layout
- [ ] `app/restaurant/login.tsx` - Staff login
- [ ] `app/restaurant/index.tsx` - Staff dashboard
- [ ] `app/restaurant/reservations.tsx` - Manage reservations
- [ ] `app/restaurant/availability.tsx` - Time slot management
- [ ] `app/restaurant/floorplan.tsx` - Floor plan editor
- [ ] `app/restaurant/notifications.tsx` - Staff notifications

### Backend Routes (43 files)

#### Bookings (7 files)
- [ ] `backend/trpc/routes/bookings/store.ts`
- [ ] `backend/trpc/routes/bookings/get-all/route.ts`
- [ ] `backend/trpc/routes/bookings/create/route.ts`
- [ ] `backend/trpc/routes/bookings/update/route.ts`
- [ ] `backend/trpc/routes/bookings/cancel/route.ts`
- [ ] `backend/trpc/routes/bookings/get-availability/route.ts`
- [ ] `backend/trpc/routes/bookings/set-availability/route.ts`

#### Staff (7 files)
- [ ] `backend/trpc/routes/staff/store.ts`
- [ ] `backend/trpc/routes/staff/get-all/route.ts`
- [ ] `backend/trpc/routes/staff/create/route.ts`
- [ ] `backend/trpc/routes/staff/update/route.ts`
- [ ] `backend/trpc/routes/staff/delete/route.ts`
- [ ] `backend/trpc/routes/staff/authenticate/route.ts`
- [ ] `backend/trpc/routes/staff/sync/route.ts`

#### Floor Plans (6 files)
- [ ] `backend/trpc/routes/floorplans/store.ts`
- [ ] `backend/trpc/routes/floorplans/get-all/route.ts`
- [ ] `backend/trpc/routes/floorplans/get/route.ts`
- [ ] `backend/trpc/routes/floorplans/create/route.ts`
- [ ] `backend/trpc/routes/floorplans/update/route.ts`
- [ ] `backend/trpc/routes/floorplans/delete/route.ts`

#### Orders (7 files)
- [ ] `backend/trpc/routes/orders/store.ts`
- [ ] `backend/trpc/routes/orders/get-all/route.ts`
- [ ] `backend/trpc/routes/orders/get/route.ts`
- [ ] `backend/trpc/routes/orders/create/route.ts`
- [ ] `backend/trpc/routes/orders/update-status/route.ts`
- [ ] `backend/trpc/routes/orders/update-driver-location/route.ts`
- [ ] `backend/trpc/routes/orders/stats/route.ts`

#### Menu (7 files)
- [ ] `backend/trpc/routes/menu/store.ts`
- [ ] `backend/trpc/routes/menu/get-all/route.ts`
- [ ] `backend/trpc/routes/menu/create/route.ts`
- [ ] `backend/trpc/routes/menu/update/route.ts`
- [ ] `backend/trpc/routes/menu/toggle-availability/route.ts`
- [ ] `backend/trpc/routes/menu/delete/route.ts`
- [ ] `backend/trpc/routes/menu/categories/route.ts`

#### Drivers (5 files)
- [ ] `backend/trpc/routes/drivers/store.ts`
- [ ] `backend/trpc/routes/drivers/get-all/route.ts`
- [ ] `backend/trpc/routes/drivers/create/route.ts`
- [ ] `backend/trpc/routes/drivers/update/route.ts`
- [ ] `backend/trpc/routes/drivers/update-location/route.ts`

## 🔧 Setup Instructions

### 1. Copy Files
Copy all files listed above maintaining the exact folder structure.

### 2. Update Root Layout
In your `app/_layout.tsx`, wrap your app with the required providers:

```tsx
import { BookingContextProvider } from '@/contexts/BookingContext';
import { RestaurantStaffAuthProvider } from '@/contexts/RestaurantStaffAuthContext';
import { CartProvider } from '@/contexts/CartContext';

// Inside your root layout component:
<RestaurantStaffAuthProvider>
  <BookingContextProvider>
    <CartProvider>
      {/* Your app content */}
    </CartProvider>
  </BookingContextProvider>
</RestaurantStaffAuthProvider>
```

### 3. Register Backend Routes
In your `backend/trpc/app-router.ts`, import and register all routes:

```tsx
import { bookingsRouter } from './routes/bookings/store';
import { staffRouter } from './routes/staff/store';
import { floorplansRouter } from './routes/floorplans/store';
import { ordersRouter } from './routes/orders/store';
import { menuRouter } from './routes/menu/store';
import { driversRouter } from './routes/drivers/store';

export const appRouter = t.router({
  bookings: bookingsRouter,
  staff: staffRouter,
  floorplans: floorplansRouter,
  orders: ordersRouter,
  menu: menuRouter,
  drivers: driversRouter,
});
```

### 4. Required Dependencies
Ensure these packages are installed:

```bash
npm install @tanstack/react-query
npm install @trpc/client @trpc/server
npm install firebase
npm install expo-location
npm install react-native-calendars
npm install lucide-react-native
```

### 5. Environment Variables
Add to your `.env`:

```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

### 6. Firebase Configuration
Ensure Firebase is configured with:
- Firestore collections: `bookings`, `staff`, `floorplans`, `orders`, `menuItems`, `drivers`
- Firebase Authentication enabled
- Proper security rules

## 🎯 Features Included

### Booking System
- ✅ Real-time availability checking
- ✅ Floor plan table management
- ✅ Time slot configuration
- ✅ Reservation management (Arrived, Done, Cancel, No-show)
- ✅ Staff dashboard with metrics
- ✅ Today's bookings statistics

### Delivery System
- ✅ Menu browsing with categories
- ✅ Shopping cart management
- ✅ Real-time order tracking
- ✅ Live driver location on map
- ✅ Order status updates
- ✅ Restaurant order management
- ✅ Dynamic delivery fee calculation

### Staff Management
- ✅ Staff authentication
- ✅ Role-based access control
- ✅ Staff notifications
- ✅ Performance tracking

## 📝 Notes

- All files use TypeScript with strict type checking
- Designed for React Native with Expo
- Backend uses tRPC with Hono
- Real-time updates via Firebase
- Mobile-first responsive design
- Cross-platform (iOS, Android, Web)

## 🆘 Support

If you encounter issues after copying:
1. Verify all files are copied with correct paths
2. Check that all dependencies are installed
3. Ensure Firebase is properly configured
4. Update import paths if your project structure differs

---

**Total Files: 65**
- Types: 3
- Contexts: 5
- Utils: 3
- App Pages: 11
- Backend Routes: 43
