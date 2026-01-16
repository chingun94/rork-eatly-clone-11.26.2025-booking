import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Users,
  Clock,
  Phone,
  Mail,
  MapPin,
  X,
} from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { Booking, BookingStatus } from '@/types/booking';

export default function AdminBookingsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'all'>('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming' | 'past'>('all');

  const bookingsQuery = trpc.bookings.getAll.useQuery({});
  const restaurantsQuery = trpc.restaurants.getAll.useQuery();

  const bookings = useMemo(() => bookingsQuery.data || [], [bookingsQuery.data]);
  const restaurants = useMemo(() => restaurantsQuery.data || [], [restaurantsQuery.data]);

  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.userName.toLowerCase().includes(query) ||
          b.userEmail.toLowerCase().includes(query) ||
          b.userPhone.includes(query) ||
          b.restaurantName.toLowerCase().includes(query) ||
          b.confirmationCode?.toLowerCase().includes(query)
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((b) => b.status === selectedStatus);
    }

    if (selectedRestaurant !== 'all') {
      filtered = filtered.filter((b) => b.restaurantId === selectedRestaurant);
    }

    const today = new Date().toISOString().split('T')[0];
    if (dateFilter === 'today') {
      filtered = filtered.filter((b) => b.date === today);
    } else if (dateFilter === 'upcoming') {
      filtered = filtered.filter((b) => b.date >= today);
    } else if (dateFilter === 'past') {
      filtered = filtered.filter((b) => b.date < today);
    }

    return filtered.sort((a, b) => {
      if (a.date === b.date) {
        return b.time.localeCompare(a.time);
      }
      return b.date.localeCompare(a.date);
    });
  }, [bookings, searchQuery, selectedStatus, selectedRestaurant, dateFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: bookings.length,
      today: bookings.filter((b) => b.date === today).length,
      upcoming: bookings.filter(
        (b) => b.date >= today && (b.status === 'pending' || b.status === 'confirmed')
      ).length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      noShow: bookings.filter((b) => b.status === 'no-show').length,
    };
  }, [bookings]);

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'seated':
        return '#3B82F6';
      case 'completed':
        return '#8B5CF6';
      case 'cancelled':
        return '#EF4444';
      case 'no-show':
        return '#6B7280';
      default:
        return '#666';
    }
  };

  const statusOptions: { value: BookingStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'seated', label: 'Seated' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no-show', label: 'No Show' },
  ];

  const dateFilterOptions = [
    { value: 'all' as const, label: 'All Dates' },
    { value: 'today' as const, label: 'Today' },
    { value: 'upcoming' as const, label: 'Upcoming' },
    { value: 'past' as const, label: 'Past' },
  ];

  const handleBookingPress = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const isLoading = bookingsQuery.isLoading || restaurantsQuery.isLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>All Bookings</Text>
          <Text style={styles.headerSubtitle}>
            {filteredBookings.length} of {bookings.length} bookings
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterButton}
        >
          <Filter size={20} color={showFilters ? '#FF6B35' : '#fff'} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
        >
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.today}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.upcoming}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.cancelled}</Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#6B7280' }]}>{stats.noShow}</Text>
            <Text style={styles.statLabel}>No Show</Text>
          </View>
        </ScrollView>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Date Range</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {dateFilterOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterChip,
                      dateFilter === option.value && styles.filterChipActive,
                    ]}
                    onPress={() => setDateFilter(option.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        dateFilter === option.value && styles.filterChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterChip,
                      selectedStatus === option.value && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedStatus(option.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedStatus === option.value && styles.filterChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Restaurant</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedRestaurant === 'all' && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedRestaurant('all')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedRestaurant === 'all' && styles.filterChipTextActive,
                    ]}
                  >
                    All Restaurants
                  </Text>
                </TouchableOpacity>
                {restaurants.map((restaurant) => (
                  <TouchableOpacity
                    key={restaurant.id}
                    style={[
                      styles.filterChip,
                      selectedRestaurant === restaurant.id && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedRestaurant(restaurant.id)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedRestaurant === restaurant.id && styles.filterChipTextActive,
                      ]}
                    >
                      {restaurant.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Search size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search bookings..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Calendar size={48} color="#666" />
              <Text style={styles.emptyText}>No bookings found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || selectedStatus !== 'all' || selectedRestaurant !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Bookings will appear here'}
              </Text>
            </View>
          ) : (
            <View style={styles.bookingsList}>
              {filteredBookings.map((booking) => (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingCard}
                  onPress={() => handleBookingPress(booking)}
                  activeOpacity={0.7}
                >
                  <View style={styles.bookingHeader}>
                    <View style={styles.bookingHeaderLeft}>
                      <Text style={styles.restaurantName}>{booking.restaurantName}</Text>
                      <View style={styles.bookingDateTime}>
                        <Calendar size={14} color="#666" />
                        <Text style={styles.bookingDateText}>{booking.date}</Text>
                        <Clock size={14} color="#666" />
                        <Text style={styles.bookingTimeText}>{booking.time}</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(booking.status)}15` },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: getStatusColor(booking.status) }]}
                      >
                        {booking.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.bookingBody}>
                    <Text style={styles.userName}>{booking.userName}</Text>
                    <View style={styles.bookingDetails}>
                      <View style={styles.bookingDetail}>
                        <Users size={14} color="#666" />
                        <Text style={styles.bookingDetailText}>{booking.partySize} guests</Text>
                      </View>
                      {booking.confirmationCode && (
                        <Text style={styles.confirmationCode}>#{booking.confirmationCode}</Text>
                      )}
                    </View>
                    {booking.tableNumber && (
                      <View style={styles.tableInfo}>
                        <Text style={styles.tableLabel}>Table:</Text>
                        <Text style={styles.tableValue}>{booking.tableNumber}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking Details</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Restaurant</Text>
                  <Text style={styles.modalValue}>{selectedBooking.restaurantName}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Customer Information</Text>
                  <View style={styles.modalInfoRow}>
                    <Users size={16} color="#999" />
                    <Text style={styles.modalInfoText}>{selectedBooking.userName}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Mail size={16} color="#999" />
                    <Text style={styles.modalInfoText}>{selectedBooking.userEmail}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Phone size={16} color="#999" />
                    <Text style={styles.modalInfoText}>{selectedBooking.userPhone}</Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Reservation Details</Text>
                  <View style={styles.modalInfoRow}>
                    <Calendar size={16} color="#999" />
                    <Text style={styles.modalInfoText}>{selectedBooking.date}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Clock size={16} color="#999" />
                    <Text style={styles.modalInfoText}>{selectedBooking.time}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Users size={16} color="#999" />
                    <Text style={styles.modalInfoText}>
                      {selectedBooking.partySize} guests
                    </Text>
                  </View>
                  {selectedBooking.tableNumber && (
                    <View style={styles.modalInfoRow}>
                      <MapPin size={16} color="#999" />
                      <Text style={styles.modalInfoText}>
                        Table {selectedBooking.tableNumber}
                      </Text>
                    </View>
                  )}
                </View>

                {selectedBooking.specialRequests && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Special Requests</Text>
                    <Text style={styles.modalValue}>{selectedBooking.specialRequests}</Text>
                  </View>
                )}

                {selectedBooking.confirmationCode && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Confirmation Code</Text>
                    <Text style={styles.modalValue}>#{selectedBooking.confirmationCode}</Text>
                  </View>
                )}

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Status</Text>
                  <View
                    style={[
                      styles.currentStatusBadge,
                      { backgroundColor: `${getStatusColor(selectedBooking.status)}15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.currentStatusText,
                        { color: getStatusColor(selectedBooking.status) },
                      ]}
                    >
                      {selectedBooking.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Timestamps</Text>
                  <Text style={styles.timestampText}>
                    Created: {new Date(selectedBooking.createdAt).toLocaleString()}
                  </Text>
                  <Text style={styles.timestampText}>
                    Updated: {new Date(selectedBooking.updatedAt).toLocaleString()}
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  filterButton: {
    padding: 8,
  },
  statsContainer: {
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statsScroll: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  filtersContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 16,
  },
  filterSection: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#999',
    textTransform: 'uppercase' as const,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#262626',
  },
  filterChipActive: {
    backgroundColor: '#FF6B35',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#999',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 6,
  },
  bookingsList: {
    padding: 16,
    gap: 12,
  },
  bookingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingHeaderLeft: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 6,
  },
  bookingDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingDateText: {
    fontSize: 13,
    color: '#999',
    marginRight: 8,
  },
  bookingTimeText: {
    fontSize: 13,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginBottom: 12,
  },
  bookingBody: {
    gap: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
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
    fontSize: 13,
    color: '#999',
  },
  confirmationCode: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600' as const,
  },
  tableInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tableLabel: {
    fontSize: 13,
    color: '#999',
  },
  tableValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FF6B35',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase' as const,
  },
  modalValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  modalInfoText: {
    fontSize: 15,
    color: '#fff',
  },
  currentStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  currentStatusText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  timestampText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
});
