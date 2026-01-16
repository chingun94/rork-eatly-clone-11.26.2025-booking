import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UserProvider } from '@/contexts/UserContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { RestaurantProvider } from '@/contexts/RestaurantContext';
import { AdProvider } from '@/contexts/AdContext';
import { BookingContext } from '@/contexts/BookingContext';
import { FirebaseProvider } from '@/contexts/FirebaseContext';
import { CartContext } from '@/contexts/CartContext';
import { OrderContext } from '@/contexts/OrderContext';
import { MenuContext } from '@/contexts/MenuContext';
import { trpc, trpcClient } from '@/lib/trpc';
import { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="restaurant" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <trpc.Provider client={trpcClient as any} queryClient={queryClient}>
          <FirebaseProvider>
            <LanguageProvider>
              <ThemeProvider>
                <AdminProvider>
                  <AdProvider>
                    <RestaurantProvider>
                      <UserProvider>
                        <BookingContext>
                          <CartContext>
                            <OrderContext>
                              <MenuContext>
                                <GestureHandlerRootView style={{ flex: 1 }}>
                                  <RootLayoutNav />
                                </GestureHandlerRootView>
                              </MenuContext>
                            </OrderContext>
                          </CartContext>
                        </BookingContext>
                      </UserProvider>
                    </RestaurantProvider>
                  </AdProvider>
                </AdminProvider>
              </ThemeProvider>
            </LanguageProvider>
          </FirebaseProvider>
        </trpc.Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
