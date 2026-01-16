import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Users, TrendingUp, LogOut, Shield, Settings, Bell, X } from 'lucide-react-native';
import { useRestaurantBookings, useBookingStats } from '@/contexts/BookingContext';
import { useQuery } from '@tanstack/react-query';
import { bookingFirebase } from '@/utils/bookingFirebase';
import { RestaurantAvailability } from '@/types/booking';
import { useRestaurantStaffAuth } from '@/contexts/RestaurantStaffAuthContext';
import { ROLE_DISPLAY_NAMES } from '@/types/restaurant-staff';

export default function RestaurantDashboardScreen() {
  const router = useRouter();
  const { staff, logout, hasPermission } = useRestaurantStaffAuth();
  const [restaurantId, setRestaurantId] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedStatType, setSelectedStatType] = useState<'today' | 'upcoming' | 'avgParty' | 'completed' | null>(null);
  const { bookings, refetch } = useRestaurantBookings(restaurantId);
  const stats = useBookingStats(restaurantId);
  const [availability, setAvailability] = useState<RestaurantAvailability | null>(null);

  useEffect(() => {
    if (staff) {
      console.log('[Restaurant Dashboard] Staff data:', {
        id: staff.id,
        name: staff.name,
        restaurantId: staff.restaurantId,
        restaurantName: staff.restaurantName,
      });
      setRestaurantId(staff.restaurantId);
      if (!staff.restaurantId) {
        console.error('[Restaurant Dashboard] WARNING: Staff has no restaurantId!');
      }
    }
  }, [staff]);

  const notificationsQuery = useQuery({
    queryKey: ['notifications', restaurantId],
    queryFn: () => bookingFirebase.getNotifications(restaurantId),
    enabled: !!restaurantId,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (notificationsQuery.data) {
      const unread = notificationsQuery.data.filter(n => !n.read).length;
      setUnreadCount(unread);
    }
  }, [notificationsQuery.data]);

  useFocusEffect(
    useCallback(() => {
      if (restaurantId) {
        console.log('[Dashboard] Screen focused, refetching bookings...');
        refetch();
      }
    }, [restaurantId, refetch])
  );

  useEffect(() => {
    const loadAvailability = async () => {
      if (!restaurantId) return;
      try {
        const avail = await bookingFirebase.getAvailability(restaurantId);
        setAvailability(avail);
      } catch (error) {
        console.error('Error loading availability:', error);
      }
    };
    loadAvailability();
  }, [restaurantId]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/restaurant/login');
          },
        },
      ]
    );
  };

  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.date === today);
  const upcomingBookings = bookings.filter(
    b => b.date >= today && (b.status === 'pending' || b.status === 'confirmed')
  );
  const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'no-show');

  const getFilteredBookings = () => {
    switch (selectedStatType) {
      case 'today':
        return todayBookings;
      case 'upcoming':
        return upcomingBookings;
      case 'avgParty':
        return bookings;
      case 'completed':
        return completedBookings;
      default:
        return [];
    }
  };

  const getModalTitle = () => {
    switch (selectedStatType) {
      case 'today':
        return "Today's Bookings";
      case 'upcoming':
        return 'Upcoming Bookings';
      case 'avgParty':
        return 'All Bookings';
      case 'completed':
        return 'Completed Bookings';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>{staff?.restaurantName}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => router.push('/restaurant/notifications' as any)} 
              style={styles.notificationButton}
            >
              <Bell size={20} color="#2D6A4F" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.staffInfo}>
          <View style={styles.staffBadge}>
            <Shield size={16} color="#2D6A4F" />
            <Text style={styles.staffName}>{staff?.name}</Text>
          </View>
          <Text style={styles.staffRole}>{staff ? ROLE_DISPLAY_NAMES[staff.role] : ''}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => setSelectedStatType('today')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Calendar size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{stats.todayBookings}</Text>
            <Text style={styles.statLabel}>Today&apos;s Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => setSelectedStatType('upcoming')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <TrendingUp size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{stats.upcomingBookings}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => setSelectedStatType('avgParty')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <Users size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats.averagePartySize.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Party Size</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => setSelectedStatType('completed')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <Clock size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{stats.completedBookings}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </TouchableOpacity>
        </View>

        {hasPermission('canManageAvailability') && availability && (
          <View style={styles.managementModeCard}>
            <View style={styles.managementModeHeader}>
              <View style={styles.managementModeHeaderLeft}>
                <Settings size={20} color="#2D6A4F" />
                <Text style={styles.managementModeTitle}>Management Mode</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/restaurant/availability' as any)}
                style={styles.changeButton}
              >
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.managementModeContent}>
              {availability.managementMode === 'guest-count' ? (
                <>
                  <View style={styles.modeIndicator}>
                    <View style={styles.modeIndicatorDot} />
                    <Text style={styles.modeIndicatorText}>Simple Guest Count</Text>
                  </View>
                  <Text style={styles.modeDescription}>
                    Fast reservations with maximum guests per time slot
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.modeIndicator}>
                    <View style={styles.modeIndicatorDot} />
                    <Text style={styles.modeIndicatorText}>Table-Based Seating</Text>
                  </View>
                  <Text style={styles.modeDescription}>
                    Precise control with table assignments
                    {availability.tables && availability.tables.length > 0 && (
                      <Text style={styles.tableCount}> • {availability.tables.length} tables configured</Text>
                    )}
                  </Text>
                </>
              )}
            </View>
          </View>
        )}

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          {hasPermission('canManageReservations') && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/restaurant/reservations' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.actionContent}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(45, 106, 79, 0.1)' }]}>
                  <Calendar size={24} color="#2D6A4F" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Manage Reservations</Text>
                  <Text style={styles.actionSubtitle}>View and update bookings</Text>
                </View>
              </View>
              <Text style={styles.actionBadge}>{upcomingBookings.length}</Text>
            </TouchableOpacity>
          )}

          {hasPermission('canManageAvailability') && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/restaurant/availability' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.actionContent}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <Clock size={24} color="#3B82F6" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Set Availability</Text>
                  <Text style={styles.actionSubtitle}>Configure time slots</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}


        </View>

        {todayBookings.length > 0 && (
          <View style={styles.todaySection}>
            <Text style={styles.sectionTitle}>Today&apos;s Bookings</Text>
            {todayBookings.slice(0, 5).map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingTime}>{booking.time}</Text>
                  <View style={[
                    styles.statusBadge,
                    booking.status === 'confirmed' && styles.statusConfirmed,
                    booking.status === 'pending' && styles.statusPending,
                    booking.status === 'seated' && styles.statusSeated,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      booking.status === 'confirmed' && styles.statusTextConfirmed,
                      booking.status === 'pending' && styles.statusTextPending,
                      booking.status === 'seated' && styles.statusTextSeated,
                    ]}>
                      {booking.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bookingName}>{booking.userName}</Text>
                <View style={styles.bookingDetails}>
                  <View style={styles.bookingDetail}>
                    <Users size={14} color="#666" />
                    <Text style={styles.bookingDetailText}>{booking.partySize} guests</Text>
                  </View>
                  {booking.confirmationCode && (
                    <Text style={styles.confirmationCode}>#{booking.confirmationCode}</Text>
                  )}
                </View>
              </View>
            ))}
            {todayBookings.length > 5 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push('/restaurant/reservations' as any)}
              >
                <Text style={styles.viewAllText}>View All ({todayBookings.length})</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={selectedStatType !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedStatType(null)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{getModalTitle()}</Text>
            <TouchableOpacity onPress={() => setSelectedStatType(null)} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={getFilteredBookings()}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Calendar size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No bookings found</Text>
              </View>
            }
            renderItem={({ item: booking }) => (
              <View style={styles.modalBookingCard}>
                <View style={styles.modalBookingHeader}>
                  <View style={styles.modalBookingHeaderLeft}>
                    <Text style={styles.modalBookingDate}>{booking.date}</Text>
                    <Text style={styles.modalBookingTime}>{booking.time}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    booking.status === 'confirmed' && styles.statusConfirmed,
                    booking.status === 'pending' && styles.statusPending,
                    booking.status === 'seated' && styles.statusSeated,
                    booking.status === 'completed' && styles.statusCompleted,
                    booking.status === 'no-show' && styles.statusNoShow,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      booking.status === 'confirmed' && styles.statusTextConfirmed,
                      booking.status === 'pending' && styles.statusTextPending,
                      booking.status === 'seated' && styles.statusTextSeated,
                      booking.status === 'completed' && styles.statusTextCompleted,
                      booking.status === 'no-show' && styles.statusTextNoShow,
                    ]}>
                      {booking.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.modalBookingName}>{booking.userName}</Text>
                <View style={styles.modalBookingDetails}>
                  <View style={styles.bookingDetail}>
                    <Users size={16} color="#666" />
                    <Text style={styles.bookingDetailText}>{booking.partySize} guests</Text>
                  </View>
                  {booking.confirmationCode && (
                    <Text style={styles.confirmationCode}>#{booking.confirmationCode}</Text>
                  )}
                </View>
                {booking.specialRequests && (
                  <Text style={styles.specialRequests} numberOfLines={2}>
                    Note: {booking.specialRequests}
                  </Text>
                )}
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  staffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2D6A4F',
  },
  staffRole: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500' as const,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700' as const,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  actionBadge: {
    backgroundColor: '#2D6A4F',
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  todaySection: {
    marginBottom: 24,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingTime: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  statusConfirmed: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  statusSeated: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#666',
  },
  statusTextConfirmed: {
    color: '#10B981',
  },
  statusTextPending: {
    color: '#F59E0B',
  },
  statusTextSeated: {
    color: '#3B82F6',
  },
  bookingName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  bookingDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingDetailText: {
    fontSize: 14,
    color: '#666',
  },
  confirmationCode: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600' as const,
  },
  viewAllButton: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  managementModeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2D6A4F',
  },
  managementModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  managementModeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  managementModeTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
  },
  changeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#2D6A4F',
  },
  managementModeContent: {
    gap: 8,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2D6A4F',
  },
  modeIndicatorText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#2D6A4F',
  },
  modeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 18,
  },
  tableCount: {
    fontWeight: '600' as const,
    color: '#2D6A4F',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  modalBookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalBookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalBookingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalBookingDate: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  modalBookingTime: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#2D6A4F',
  },
  modalBookingName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalBookingDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusNoShow: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusTextCompleted: {
    color: '#22C55E',
  },
  statusTextNoShow: {
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  specialRequests: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
});
