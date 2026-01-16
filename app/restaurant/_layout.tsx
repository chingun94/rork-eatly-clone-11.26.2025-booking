import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { RestaurantStaffAuthProvider, useRestaurantStaffAuth } from '@/contexts/RestaurantStaffAuthContext';

function RestaurantLayoutContent() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useRestaurantStaffAuth();

  useEffect(() => {
    if (!isLoading) {
      const inRestaurantGroup = segments[0] === 'restaurant';
      
      if (!isAuthenticated && inRestaurantGroup && segments[1] !== 'login') {
        router.replace('/restaurant/login');
      }
    }
  }, [isAuthenticated, segments, isLoading, router]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="reservations" options={{ title: 'Reservations' }} />
      <Stack.Screen name="availability" options={{ title: 'Availability' }} />
      <Stack.Screen name="floorplan" options={{ title: 'Floor Plan' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications', headerShown: true }} />
    </Stack>
  );
}

export default function RestaurantLayout() {
  return (
    <RestaurantStaffAuthProvider>
      <RestaurantLayoutContent />
    </RestaurantStaffAuthProvider>
  );
}
