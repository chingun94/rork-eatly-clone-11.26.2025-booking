import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Bell, Calendar, Users, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { bookingFirebase } from '@/utils/bookingFirebase';
import { useRestaurantStaffAuth } from '@/contexts/RestaurantStaffAuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Notification {
  id: string;
  restaurantId: string;
  title: string;
  body: string;
  type: 'booking_created' | 'booking_updated' | 'booking_cancelled' | 'walk_in';
  bookingId?: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { staff } = useRestaurantStaffAuth();
  const [restaurantId, setRestaurantId] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['notifications', restaurantId],
    queryFn: () => bookingFirebase.getNotifications(restaurantId),
    enabled: !!restaurantId,
  });

  useEffect(() => {
    if (staff?.restaurantId) {
      setRestaurantId(staff.restaurantId);
    }
  }, [staff]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await notificationsQuery.refetch();
    setRefreshing(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!restaurantId) return;
    await bookingFirebase.markAllNotificationsAsRead(restaurantId);
    await queryClient.invalidateQueries({ queryKey: ['notifications', restaurantId] });
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await bookingFirebase.markNotificationAsRead(notification.id);
      await queryClient.invalidateQueries({ queryKey: ['notifications', restaurantId] });
    }

    if (notification.bookingId) {
      router.push('/restaurant/reservations' as any);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_created':
        return <Calendar size={20} color="#3B82F6" />;
      case 'booking_updated':
        return <CheckCircle size={20} color="#10B981" />;
      case 'booking_cancelled':
        return <XCircle size={20} color="#EF4444" />;
      case 'walk_in':
        return <Users size={20} color="#F59E0B" />;
      default:
        return <Bell size={20} color="#666" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking_created':
        return 'rgba(59, 130, 246, 0.1)';
      case 'booking_updated':
        return 'rgba(16, 185, 129, 0.1)';
      case 'booking_cancelled':
        return 'rgba(239, 68, 68, 0.1)';
      case 'walk_in':
        return 'rgba(245, 158, 11, 0.1)';
      default:
        return 'rgba(102, 102, 102, 0.1)';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const notifications = (notificationsQuery.data || []) as Notification[];
  const unreadCount = notifications.filter(n => !n.read).length;

  if (notificationsQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            title: 'Notifications',
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: '#1a1a1a',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2D6A4F" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1a1a1a',
          headerBackVisible: true,
        }}
      />

      {unreadCount > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerText}>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</Text>
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllButtonText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2D6A4F" />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bell size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>You&apos;re all caught up!</Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationCardUnread,
                ]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationHeader}>
                  <View style={[
                    styles.notificationIcon,
                    { backgroundColor: getNotificationColor(notification.type) },
                  ]}>
                    {getNotificationIcon(notification.type)}
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationTitleRow}>
                      <Text style={[
                        styles.notificationTitle,
                        !notification.read && styles.notificationTitleUnread,
                      ]}>
                        {notification.title}
                      </Text>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationBody}>{notification.body}</Text>
                    <View style={styles.notificationFooter}>
                      <Clock size={12} color="#999" />
                      <Text style={styles.notificationTime}>{formatTime(notification.createdAt)}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
  },
  markAllButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#2D6A4F',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
  },
  notificationsList: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: '#2D6A4F',
  },
  notificationHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  notificationTitleUnread: {
    fontWeight: '700' as const,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D6A4F',
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
});
