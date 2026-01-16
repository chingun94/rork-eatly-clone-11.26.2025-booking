import { Stack, useRouter, useSegments } from 'expo-router';
import { useAdmin } from '@/contexts/AdminContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';

export default function AdminLayout() {
  const { isAuthenticated, isLoading } = useAdmin();
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || isLoading) return;

    const inAdminGroup = segments[0] === 'admin';
    const onLoginPage = segments.length > 1 && segments.at(1) === 'login';

    if (!isAuthenticated && inAdminGroup && !onLoginPage) {
      router.replace('/(tabs)/(home)/home' as any);
    }
  }, [isAuthenticated, isLoading, segments, isMounted, router]);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600' as const,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Admin Dashboard',
        }}
      />
      <Stack.Screen
        name="users/index"
        options={{
          title: 'User Management',
        }}
      />
      <Stack.Screen
        name="restaurants/index"
        options={{
          title: 'Restaurant Management',
        }}
      />
      <Stack.Screen
        name="reviews/index"
        options={{
          title: 'Review Moderation',
        }}
      />
      <Stack.Screen
        name="rewards/index"
        options={{
          title: 'Rewards & Points',
        }}
      />
      <Stack.Screen
        name="ads/index"
        options={{
          title: 'Advertising',
        }}
      />
      <Stack.Screen
        name="analytics/index"
        options={{
          title: 'Analytics',
        }}
      />
      <Stack.Screen
        name="notifications/index"
        options={{
          title: 'Notifications',
        }}
      />
      <Stack.Screen
        name="settings/index"
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="cms/index"
        options={{
          title: 'Content Management',
        }}
      />
      <Stack.Screen
        name="feedback/index"
        options={{
          title: 'Feedback & Reports',
        }}
      />
      <Stack.Screen
        name="logs/index"
        options={{
          title: 'Console Logs',
        }}
      />
      <Stack.Screen
        name="bookings/index"
        options={{
          title: 'Booking History',
        }}
      />
      <Stack.Screen
        name="staff/index"
        options={{
          title: 'Restaurant Staff',
        }}
      />
      <Stack.Screen
        name="admins/index"
        options={{
          title: 'Admin Accounts',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#000',
  },
});
