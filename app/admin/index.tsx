import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAdmin } from '@/contexts/AdminContext';
import React, { useState } from "react";
import {
  Users,
  Store,
  MessageSquare,
  Gift,
  TrendingUp,
  Bell,
  Settings,
  FileText,
  Bug,
  LogOut,
  RefreshCw,
  Terminal,
  Activity,
  Calendar,
  Shield,
  UserCog,
} from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RESTAURANTS } from '@/mocks/restaurants';

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  color: string;
}

function MenuItem({ icon, title, subtitle, onPress, color }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { adminUser, logout } = useAdmin();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  const restaurantsQuery = trpc.restaurants.getAll.useQuery();
  const adsQuery = trpc.ads.getAll.useQuery();
  const syncRestaurantsMutation = trpc.restaurants.sync.useMutation();
  const syncAdsMutation = trpc.ads.sync.useMutation();

  const handleLogout = async () => {
    await logout();
    router.replace('/(tabs)/(home)/home' as any);
  };

  const handleRecoverData = async () => {
    setIsRecovering(true);
    setSyncMessage('');
    try {
      console.log('========================================');
      console.log('Admin: DATA RECOVERY INITIATED');
      console.log('Admin: Restoring default restaurants:', RESTAURANTS.length);
      console.log('========================================');
      
      await AsyncStorage.setItem('restaurants_data', JSON.stringify(RESTAURANTS));
      console.log('Admin: Saved default restaurants to AsyncStorage');
      
      await syncRestaurantsMutation.mutateAsync(RESTAURANTS);
      console.log('Admin: Uploaded default restaurants to backend');
      
      await restaurantsQuery.refetch();
      console.log('Admin: Refetched from backend');
      
      console.log('========================================');
      console.log('Admin: DATA RECOVERY COMPLETED');
      console.log('========================================');
      
      setSyncMessage(`✓ Data recovered! ${RESTAURANTS.length} restaurants restored.`);
      setTimeout(() => setSyncMessage(''), 5000);
    } catch (error) {
      console.error('Admin: DATA RECOVERY FAILED:', error);
      setSyncMessage('✗ Recovery failed. Please try again.');
      setTimeout(() => setSyncMessage(''), 3000);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    try {
      console.log('========================================');
      console.log('Admin: MANUAL SYNC INITIATED');
      console.log('Admin: Device Platform:', Platform.OS);
      console.log('Admin: Current time:', new Date().toISOString());
      console.log('========================================');
      
      console.log('Admin: Step 1 - Reading local AsyncStorage data...');
      const [localRestaurantsStr, localAdsStr] = await Promise.all([
        AsyncStorage.getItem('restaurants_data'),
        AsyncStorage.getItem('ad_campaigns'),
      ]);
      
      let localRestaurants = [];
      let localAds = [];
      
      try {
        localRestaurants = localRestaurantsStr ? JSON.parse(localRestaurantsStr) : [];
        if (!Array.isArray(localRestaurants)) {
          console.warn('Admin: Invalid restaurants data format, resetting');
          localRestaurants = [];
          await AsyncStorage.removeItem('restaurants_data');
        }
      } catch (parseError) {
        console.error('Admin: Error parsing restaurants data:', parseError);
        await AsyncStorage.removeItem('restaurants_data');
      }
      
      try {
        localAds = localAdsStr ? JSON.parse(localAdsStr) : [];
        if (!Array.isArray(localAds)) {
          console.warn('Admin: Invalid ads data format, resetting');
          localAds = [];
          await AsyncStorage.removeItem('ad_campaigns');
        }
      } catch (parseError) {
        console.error('Admin: Error parsing ads data:', parseError);
        await AsyncStorage.removeItem('ad_campaigns');
      }
      
      console.log('Admin: LOCAL DATA on this device:');
      console.log('  - Restaurants count:', localRestaurants.length);
      console.log('  - Ads count:', localAds.length);
      if (localRestaurants.length > 0) {
        console.log('  - Restaurant IDs:', localRestaurants.map((r: any) => r.id).join(', '));
      }
      if (localAds.length > 0) {
        console.log('  - Ad IDs:', localAds.map((a: any) => a.id).join(', '));
        console.log('  - First ad details:', {
          id: localAds[0].id,
          name: localAds[0].restaurantName,
          hasImage: !!localAds[0].imageUrl,
          imageSize: localAds[0].imageUrl?.length || 0,
        });
      }
      
      console.log('Admin: Step 2 - Uploading local data to backend...');
      console.log('Admin: NOTE: Even if local data is empty, we still sync to get backend data');
      const [restaurantSyncResult, adSyncResult] = await Promise.all([
        syncRestaurantsMutation.mutateAsync(localRestaurants),
        syncAdsMutation.mutateAsync(localAds),
      ]);
      console.log('Admin: Upload complete!');
      console.log('Admin: Restaurant sync result:', restaurantSyncResult);
      console.log('Admin: Ad sync result:', adSyncResult);
      
      console.log('Admin: Step 3 - Fetching merged data from backend...');
      const [restaurantsResult, adsResult] = await Promise.all([
        restaurantsQuery.refetch(),
        adsQuery.refetch(),
      ]);
      
      console.log('Admin: BACKEND DATA (after merge):');
      console.log('  - Restaurants count:', restaurantsResult.data?.length || 0);
      console.log('  - Ads count:', adsResult.data?.length || 0);
      if (restaurantsResult.data && restaurantsResult.data.length > 0) {
        console.log('  - Restaurant IDs:', restaurantsResult.data.map(r => r.id).join(', '));
      }
      if (adsResult.data && adsResult.data.length > 0) {
        console.log('  - Ad IDs:', adsResult.data.map(a => a.id).join(', '));
        console.log('  - First ad details:', {
          id: adsResult.data[0].id,
          name: adsResult.data[0].restaurantName,
          hasImage: !!adsResult.data[0].imageUrl,
          imageSize: adsResult.data[0].imageUrl?.length || 0,
        });
      }
      
      console.log('Admin: Step 4 - Saving merged data to local AsyncStorage...');
      await Promise.all([
        AsyncStorage.setItem('restaurants_data', JSON.stringify(restaurantsResult.data || [])),
        AsyncStorage.setItem('ad_campaigns', JSON.stringify(adsResult.data || [])),
      ]);
      
      console.log('========================================');
      console.log('Admin: SYNC COMPLETED SUCCESSFULLY');
      console.log('========================================');
      
      setSyncMessage(`✓ Sync complete! Restaurants: ${restaurantsResult.data?.length || 0}, Ads: ${adsResult.data?.length || 0}`);
      setTimeout(() => setSyncMessage(''), 5000);
    } catch (error) {
      console.error('========================================');
      console.error('Admin: SYNC FAILED');
      console.error('Admin: Error:', error);
      console.error('========================================');
      setSyncMessage('✗ Sync failed. Please try again.');
      setTimeout(() => setSyncMessage(''), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Text style={styles.name}>{adminUser?.name}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={[styles.recoveryButton, isRecovering && styles.syncButtonDisabled]} 
              onPress={handleRecoverData}
              disabled={isRecovering || isSyncing}
            >
              {isRecovering ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <RefreshCw size={18} color="#fff" />
              )}
              <Text style={styles.recoveryButtonText}>
                {isRecovering ? 'Recovering...' : 'Recover'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]} 
              onPress={handleSync}
              disabled={isSyncing || isRecovering}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <RefreshCw size={20} color="#fff" />
              )}
              <Text style={styles.syncButtonText}>
                {isSyncing ? 'Syncing...' : 'Sync'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {syncMessage ? (
          <View style={[styles.syncMessageContainer, syncMessage.startsWith('✓') ? styles.syncSuccess : styles.syncError]}>
            <Text style={styles.syncMessage}>{syncMessage}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.menu}>
        <MenuItem
          icon={<Users size={28} color="#3B82F6" />}
          title="User Management"
          subtitle="View, edit, suspend, delete users"
          color="#3B82F6"
          onPress={() => router.push('/admin/users' as any)}
        />

        <MenuItem
          icon={<Store size={28} color="#10B981" />}
          title="Restaurant Management"
          subtitle="Add, edit, verify restaurants"
          color="#10B981"
          onPress={() => router.push('/admin/restaurants' as any)}
        />

        <MenuItem
          icon={<MessageSquare size={28} color="#F59E0B" />}
          title="Review Moderation"
          subtitle="Approve, reject, flag reviews"
          color="#F59E0B"
          onPress={() => router.push('/admin/reviews' as any)}
        />

        <MenuItem
          icon={<Gift size={28} color="#8B5CF6" />}
          title="Rewards & Points"
          subtitle="Manage rewards and coupons"
          color="#8B5CF6"
          onPress={() => router.push('/admin/rewards' as any)}
        />

        <MenuItem
          icon={<TrendingUp size={28} color="#EC4899" />}
          title="Advertising"
          subtitle="Manage ad campaigns"
          color="#EC4899"
          onPress={() => router.push('/admin/ads' as any)}
        />

        <MenuItem
          icon={<TrendingUp size={28} color="#06B6D4" />}
          title="Analytics"
          subtitle="View insights and statistics"
          color="#06B6D4"
          onPress={() => router.push('/admin/analytics' as any)}
        />

        <MenuItem
          icon={<Bell size={28} color="#F97316" />}
          title="Notifications"
          subtitle="Send push notifications"
          color="#F97316"
          onPress={() => router.push('/admin/notifications' as any)}
        />

        <MenuItem
          icon={<Settings size={28} color="#6B7280" />}
          title="Settings"
          subtitle="App configuration"
          color="#6B7280"
          onPress={() => router.push('/admin/settings' as any)}
        />

        <MenuItem
          icon={<FileText size={28} color="#14B8A6" />}
          title="Content Management"
          subtitle="Manage FAQs, blogs, legal"
          color="#14B8A6"
          onPress={() => router.push('/admin/cms' as any)}
        />

        <MenuItem
          icon={<Bug size={28} color="#EF4444" />}
          title="Feedback & Reports"
          subtitle="View user feedback"
          color="#EF4444"
          onPress={() => router.push('/admin/feedback' as any)}
        />

        <MenuItem
          icon={<Terminal size={28} color="#A855F7" />}
          title="Console Logs"
          subtitle="View app logs in real-time"
          color="#A855F7"
          onPress={() => router.push('/admin/logs' as any)}
        />

        <MenuItem
          icon={<Calendar size={28} color="#F472B6" />}
          title="Booking History"
          subtitle="View all restaurant bookings"
          color="#F472B6"
          onPress={() => router.push('/admin/bookings' as any)}
        />

        <MenuItem
          icon={<Activity size={28} color="#22D3EE" />}
          title="Firebase Diagnostics"
          subtitle="Check sync status & connection"
          color="#22D3EE"
          onPress={() => router.push('/admin/diagnostics' as any)}
        />

        <MenuItem
          icon={<UserCog size={28} color="#84CC16" />}
          title="Restaurant Staff"
          subtitle="Manage restaurant staff accounts"
          color="#84CC16"
          onPress={() => router.push('/admin/staff' as any)}
        />

        <MenuItem
          icon={<Shield size={28} color="#EF4444" />}
          title="Admin Accounts"
          subtitle="Create & manage admin accounts"
          color="#EF4444"
          onPress={() => router.push('/admin/admins' as any)}
        />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  headerButtons: {
    flexDirection: 'row' as const,
    gap: 8,
    alignItems: 'center' as const,
  },
  recoveryButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  recoveryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  welcome: {
    fontSize: 16,
    color: '#999',
  },
  name: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 4,
  },
  syncButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  syncMessageContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  syncSuccess: {
    backgroundColor: '#10B98120',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  syncError: {
    backgroundColor: '#EF444420',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  syncMessage: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center' as const,
  },
  menu: {
    padding: 16,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  menuContent: {
    flex: 1,
    marginLeft: 16,
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  logoutButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  footer: {
    height: 32,
  },
});
