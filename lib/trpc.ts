import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  if (!baseUrl) {
    console.warn('[tRPC] EXPO_PUBLIC_RORK_API_BASE_URL not set. Backend features will be disabled.');
    return null;
  }

  return baseUrl;
};

const baseUrl = getBaseUrl();

let adminTokenCache: string | null = null;

const getAdminToken = async () => {
  if (adminTokenCache) {
    return adminTokenCache;
  }
  
  try {
    const token = await AsyncStorage.getItem('admin_token');
    if (token) {
      adminTokenCache = token;
      return token;
    }
  } catch (error) {
    console.error('[tRPC] Error getting admin token:', error);
  }
  return null;
};

export const clearAdminTokenCache = () => {
  adminTokenCache = null;
};

export const trpcClient = baseUrl ? trpc.createClient({
  links: [
    httpLink({
      url: `${baseUrl}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        const token = await getAdminToken();
        
        return fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        }).catch(err => {
          console.error('[tRPC] Fetch error:', err.message);
          throw err;
        });
      },
    }),
  ],
}) : null;
