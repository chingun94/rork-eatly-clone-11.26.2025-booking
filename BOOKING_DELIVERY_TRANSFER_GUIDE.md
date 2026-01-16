# 🚀 ONE-GO TRANSFER GUIDE - Booking & Delivery System

**Transfer the entire booking and delivery system to your other Rork project in ONE session.**

---

## 📦 WHAT YOU'RE GETTING

This package includes:
- ✅ Restaurant table booking system (customer + staff interface)
- ✅ Food delivery & order tracking (menu, cart, live tracking)
- ✅ Staff management (login, dashboard, reservations, floor plans)
- ✅ Admin panel (bookings overview, staff management)
- ✅ Complete UI (all screens, buttons, forms)
- ✅ Backend API (tRPC routes)
- ✅ Firebase integration

---

## 🎯 STEP 1: COPY ALL FILES (Use Rork's File Transfer)

### Copy these directories entirely:
```
FROM this project → TO your other project (keep same structure):

📁 types/
   - booking.ts
   - restaurant-staff.ts  
   - delivery.ts

📁 contexts/
   - BookingContext.tsx
   - RestaurantStaffAuthContext.tsx
   - CartContext.tsx
   - OrderContext.tsx
   - MenuContext.tsx

📁 utils/
   - bookingFirebase.ts
   - staffFirebase.ts
   - floorPlanFirebase.ts
   - formatHours.ts
   - isRestaurantOpen.ts

📁 components/
   - StarRating.tsx

📁 app/
   - booking.tsx
   - cart.tsx
   - order-tracking.tsx
   
   📁 (tabs)/(home)/
      - menu.tsx
      
      📁 restaurant/
         - branches.tsx (optional)
   
   📁 restaurant/
      - _layout.tsx
      - login.tsx
      - index.tsx
      - reservations.tsx
      - availability.tsx
      - floorplan.tsx
      - notifications.tsx
   
   📁 admin/bookings/
      - index.tsx
   
   📁 admin/staff/
      - index.tsx
   
   📁 admin/admins/
      - index.tsx

📁 backend/trpc/routes/
   📁 bookings/
      - store.ts
      - get-all/route.ts
      - create/route.ts
      - update/route.ts
      - cancel/route.ts
      - get-availability/route.ts
      - set-availability/route.ts
   
   📁 staff/
      - store.ts
      - get-all/route.ts
      - create/route.ts
      - update/route.ts
      - delete/route.ts
      - authenticate/route.ts
      - sync/route.ts
   
   📁 floorplans/
      - store.ts
      - get-all/route.ts
      - get/route.ts
      - create/route.ts
      - update/route.ts
      - delete/route.ts
   
   📁 orders/
      - store.ts
      - get-all/route.ts
      - get/route.ts
      - create/route.ts
      - update-status/route.ts
      - update-driver-location/route.ts
      - stats/route.ts
   
   📁 menu/
      - store.ts
      - get-all/route.ts
      - create/route.ts
      - update/route.ts
      - toggle-availability/route.ts
      - delete/route.ts
      - categories/route.ts
   
   📁 drivers/
      - store.ts
      - get-all/route.ts
      - create/route.ts
      - update/route.ts
      - update-location/route.ts
```

**💡 TIP:** In Rork, you can select multiple files and copy them at once!

---

## 🎯 STEP 2: INSTALL PACKAGES (Copy & Run)

Open terminal in your new project and run:

```bash
npm install @tanstack/react-query @nkzw/create-context-hook
```

*(Other packages like firebase, lucide-react-native, expo-image, expo-location, react-native-maps are likely already installed)*

---

## 🎯 STEP 3: INTEGRATE PROVIDERS (Copy & Paste)

### FILE: `app/_layout.tsx`

**ADD these imports at the top:**
```typescript
import { BookingContextProvider } from '@/contexts/BookingContext';
import { RestaurantStaffAuthProvider } from '@/contexts/RestaurantStaffAuthContext';
import { CartProvider } from '@/contexts/CartContext';
```

**FIND your QueryClientProvider** and wrap your app like this:

```typescript
<QueryClientProvider client={queryClient}>
  <RestaurantStaffAuthProvider>
    <BookingContextProvider>
      <CartProvider>
        {/* Your existing providers and navigation */}
        <YourExistingProvidersHere>
          <Stack>
            {/* Add these screen configurations if needed */}
            <Stack.Screen name="booking" options={{ title: "Book a Table", presentation: "modal" }} />
            <Stack.Screen name="cart" options={{ title: "Cart", presentation: "modal" }} />
            <Stack.Screen name="order-tracking" options={{ title: "Track Order", presentation: "modal" }} />
          </Stack>
        </YourExistingProvidersHere>
      </CartProvider>
    </BookingContextProvider>
  </RestaurantStaffAuthProvider>
</QueryClientProvider>
```

**⚠️ IMPORTANT:** Place the 3 new providers INSIDE QueryClientProvider but OUTSIDE any theme/language providers.

---

## 🎯 STEP 4: REGISTER BACKEND ROUTES (Copy & Paste)

### FILE: `backend/trpc/app-router.ts`

**ADD these imports at the top:**
```typescript
import { bookingsRouter } from './routes/bookings/store';
import { staffRouter } from './routes/staff/store';
import { floorplansRouter } from './routes/floorplans/store';
import { ordersRouter } from './routes/orders/store';
import { menuRouter } from './routes/menu/store';
import { driversRouter } from './routes/drivers/store';
```

**ADD these routes to your appRouter:**
```typescript
export const appRouter = t.router({
  // Your existing routes...
  bookings: bookingsRouter,
  staff: staffRouter,
  floorplans: floorplansRouter,
  orders: ordersRouter,
  menu: menuRouter,
  drivers: driversRouter,
});
```

---

## 🎯 STEP 5: ADD BOOKING BUTTON TO RESTAURANT CARD

### Option A: Using Existing RestaurantCard Component

**IF** you copied `components/RestaurantCard.tsx`, it already has a "Reserve" button built-in. Just use it:

```typescript
import { RestaurantCard } from '@/components/RestaurantCard';

<RestaurantCard
  restaurant={restaurant}
  onPress={() => router.push(`/restaurant/${restaurant.id}`)}
/>
```

### Option B: Add Button to Your Existing Restaurant Detail Page

**In your restaurant detail page** (e.g., `app/(tabs)/(home)/restaurant/[id].tsx`):

```typescript
import { useRouter } from 'expo-router';

// Inside your component:
const router = useRouter();

// Add this button somewhere in your UI:
<TouchableOpacity
  onPress={() => router.push({
    pathname: '/booking',
    params: { restaurantId: restaurant.id, restaurantName: restaurant.name }
  })}
  style={{
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  }}
>
  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
    Reserve a Table
  </Text>
</TouchableOpacity>
```

---

## 🎯 STEP 6: ADD DELIVERY BUTTON (Optional)

**In your restaurant detail page**, add a "Order Delivery" button:

```typescript
<TouchableOpacity
  onPress={() => router.push({
    pathname: '/(tabs)/(home)/menu',
    params: { restaurantId: restaurant.id }
  })}
  style={{
    backgroundColor: '#2D6A4F',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  }}
>
  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
    Order Delivery
  </Text>
</TouchableOpacity>
```

---

## 🎯 STEP 7: ADD NAVIGATION LINKS (Optional)

### For Admin Panel

**In your admin dashboard** (`app/admin/index.tsx`), add navigation cards:

```typescript
<TouchableOpacity onPress={() => router.push('/admin/bookings')}>
  <Text>View All Bookings</Text>
</TouchableOpacity>

<TouchableOpacity onPress={() => router.push('/admin/staff')}>
  <Text>Manage Staff</Text>
</TouchableOpacity>
```

### For Staff Login

**Add a link somewhere** (e.g., admin panel, settings):

```typescript
<TouchableOpacity onPress={() => router.push('/restaurant/login')}>
  <Text>Staff Login</Text>
</TouchableOpacity>
```

---

## 🎯 STEP 8: FIREBASE SETUP (If Not Already Done)

### Create These Firestore Collections:

In Firebase Console → Firestore Database:
1. `bookings`
2. `staff`
3. `floorplans`
4. `orders`
5. `menuItems`
6. `drivers`
7. `restaurantAvailability`

**💡 Collections auto-create when you save first document. You can skip this!**

### Enable Email/Password Auth:

Firebase Console → Authentication → Sign-in method → Enable "Email/Password"

---

## ✅ VERIFICATION CHECKLIST

After copying everything, test these flows:

### User Flow:
- [ ] Click on a restaurant
- [ ] See "Reserve a Table" button
- [ ] Click it → Opens booking page
- [ ] Select date, time, party size
- [ ] Submit booking → Success!

### Staff Flow:
- [ ] Navigate to `/restaurant/login`
- [ ] Login (create staff account in admin first!)
- [ ] See dashboard with stats
- [ ] Go to "Reservations" tab
- [ ] Mark booking as "Arrived" → Works!

### Delivery Flow:
- [ ] Click "Order Delivery" on restaurant
- [ ] Browse menu
- [ ] Add items to cart
- [ ] Checkout → Order created
- [ ] Track order → See live map

### Admin Flow:
- [ ] Navigate to `/admin/staff`
- [ ] Create a staff account
- [ ] Navigate to `/admin/bookings`
- [ ] See all bookings

---

## 🎨 CUSTOMIZATION

### Change Booking Button Color

**File:** `app/(tabs)/(home)/restaurant/[id].tsx` or your detail page

```typescript
// Find this line:
backgroundColor: '#FF6B35',

// Change to your color:
backgroundColor: '#YOUR_COLOR',
```

### Change Time Slots

**File:** `app/restaurant/availability.tsx`

```typescript
const DEFAULT_TIME_SLOTS = [
  '17:00', '17:30', '18:00', '18:30', // Dinner slots
  '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30',
];
```

### Change Party Size Limits

**File:** `app/booking.tsx`

```typescript
// Find this array (around line 50-70):
const partySizes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

// Change max size:
const partySizes = [1, 2, 3, 4, 5, 6]; // Up to 6 people
```

---

## 🆘 COMMON ISSUES

### Issue: "Cannot find module '@/contexts/BookingContext'"
**Fix:** Make sure you copied the file to `contexts/BookingContext.tsx`

### Issue: Backend routes not working
**Fix:** Check that you registered routes in `backend/trpc/app-router.ts`

### Issue: Providers error
**Fix:** Check provider order in `app/_layout.tsx`. QueryClientProvider must be outermost.

### Issue: Booking button doesn't appear
**Fix:** Add the button code from Step 5 to your restaurant detail page

### Issue: Firebase permission denied
**Fix:** Firebase Console → Firestore → Rules → Set to test mode temporarily:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 📊 FILE COUNT

**Total Files to Copy:** ~70 files
- 4 types
- 5 contexts
- 5 utils
- 1 component
- 10 app pages
- 39 backend routes

**Setup Time:** 30-60 minutes (including testing)

---

## ✨ THAT'S IT!

You now have a complete booking and delivery system in your project! 

**Test the full flow:**
1. Customer books table → ✅
2. Staff manages reservation → ✅
3. Customer orders food → ✅
4. Track delivery → ✅
5. Admin views everything → ✅

**Enjoy your new booking system! 🎉**
