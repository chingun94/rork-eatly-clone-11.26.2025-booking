import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRestaurantStaffAuth } from '@/contexts/RestaurantStaffAuthContext';
import { Calendar, Users, Plus, Pause, Play, ChevronLeft, X } from 'lucide-react-native';
import { useRestaurantBookings } from '@/contexts/BookingContext';
import { BookingStatus, Booking, RestaurantAvailability } from '@/types/booking';
import { bookingFirebase } from '@/utils/bookingFirebase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface TimeSlotGroup {
  time: string;
  bookings: Booking[];
  totalGuests: number;
}

export default function ReservationsScreen() {
  const router = useRouter();
  const { staff } = useRestaurantStaffAuth();
  const [restaurantId, setRestaurantId] = useState('');
  const { bookings, isLoading, refetch } = useRestaurantBookings(restaurantId);
  const [availability, setAvailability] = useState<RestaurantAvailability | null>(null);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInPartySize, setWalkInPartySize] = useState('2');
  const [walkInName, setWalkInName] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  const queryClient = useQueryClient();
  
  const updateBookingMutation = useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Booking>) =>
      bookingFirebase.updateBooking(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'restaurant', restaurantId] });
      refetch();
    },
  });

  const createWalkInMutation = useMutation({
    mutationFn: (input: any) => bookingFirebase.createBooking(input),
    onSuccess: async (newBooking) => {
      console.log('[Reservations] Walk-in created successfully:', newBooking);
      setShowWalkInModal(false);
      setWalkInName('');
      setWalkInPartySize('2');
      
      setTimeout(async () => {
        console.log('[Reservations] Refetching bookings...');
        await queryClient.invalidateQueries({ queryKey: ['bookings', 'restaurant', restaurantId] });
        const result = await refetch();
        console.log('[Reservations] Refetch result:', result.data?.length, 'bookings');
        Alert.alert('Success', 'Walk-in added successfully');
      }, 500);
    },
    onError: (error) => {
      console.error('[Reservations] Error creating walk-in:', error);
      Alert.alert('Error', 'Failed to add walk-in');
    },
  });

  useEffect(() => {
    if (staff?.restaurantId) {
      console.log('[Reservations] Setting restaurant ID from staff:', staff.restaurantId);
      setRestaurantId(staff.restaurantId);
    }
  }, [staff]);

  const loadAvailability = useCallback(async () => {
    try {
      const avail = await bookingFirebase.getAvailability(restaurantId);
      console.log('[Reservations] Loaded availability mode:', avail?.managementMode);
      setAvailability(avail);
    } catch (error) {
      console.error('[Reservations] Error loading availability:', error);
    }
  }, [restaurantId]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    console.log('[Reservations] Selected date set to:', today);
  }, []);

  useEffect(() => {
    if (restaurantId) {
      loadAvailability();
    }
  }, [restaurantId, loadAvailability]);

  useEffect(() => {
    console.log('[Reservations] Bookings updated:', bookings.length, 'total bookings');
  }, [bookings]);

  const todayBookings = useMemo(() => {
    const filtered = bookings.filter(b => 
      b.date === selectedDate && 
      b.status !== 'cancelled' && 
      b.status !== 'no-show'
    );
    console.log('[Reservations] Today bookings:', filtered.length, 'for date:', selectedDate, 'from total:', bookings.length);
    return filtered;
  }, [bookings, selectedDate]);

  const timeSlotGroups = useMemo(() => {
    const groups: { [key: string]: TimeSlotGroup } = {};
    
    todayBookings.forEach(booking => {
      if (!groups[booking.time]) {
        groups[booking.time] = {
          time: booking.time,
          bookings: [],
          totalGuests: 0,
        };
      }
      groups[booking.time].bookings.push(booking);
      groups[booking.time].totalGuests += booking.partySize;
    });

    return Object.values(groups).sort((a, b) => a.time.localeCompare(b.time));
  }, [todayBookings]);

  const maxCapacity = useMemo(() => {
    if (!availability) return 100;
    
    if (availability.managementMode === 'guest-count') {
      const dateObj = new Date(selectedDate);
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const specialDate = availability.specialDates?.[selectedDate];
      
      if (specialDate) {
        return specialDate.capacityPerSlot * specialDate.slots.length;
      }
      
      const daySchedule = availability.schedule?.[dayOfWeek];
      if (daySchedule && daySchedule.isOpen) {
        return daySchedule.capacityPerSlot * daySchedule.slots.length;
      }
    } else if (availability.managementMode === 'table-based') {
      const activeTables = availability.tables?.filter(t => t.isActive) || [];
      return activeTables.reduce((sum, table) => sum + table.capacity, 0);
    }
    
    return 100;
  }, [availability, selectedDate]);

  const totalGuestsBooked = todayBookings.reduce((sum, b) => sum + b.partySize, 0);
  const capacityPercentage = Math.min((totalGuestsBooked / maxCapacity) * 100, 100);

  const getCapacityColor = () => {
    if (capacityPercentage < 70) return '#10B981';
    if (capacityPercentage < 90) return '#F59E0B';
    return '#EF4444';
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      await updateBookingMutation.mutateAsync({ id: bookingId, status });
    } catch {
      Alert.alert('Error', 'Failed to update booking');
    }
  };

  const showTableAssignmentModal = (booking: Booking) => {
    if (!availability?.tables || availability.tables.length === 0) {
      Alert.alert('No Tables', 'Please add tables in availability settings first.');
      return;
    }

    const activeTables = availability.tables.filter(t => t.isActive);
    if (activeTables.length === 0) {
      Alert.alert('No Tables', 'All tables are currently inactive.');
      return;
    }

    const assignedTableIds = todayBookings
      .filter(b => b.time === booking.time && b.id !== booking.id && b.tableId)
      .map(b => b.tableId);

    const availableTables = activeTables.filter(t => !assignedTableIds.includes(t.id));

    if (availableTables.length === 0) {
      Alert.alert('No Tables Available', 'All tables are assigned for this time slot.');
      return;
    }

    const buttons = availableTables.map(table => ({
      text: `${table.name} (${table.capacity} seats)`,
      onPress: async () => {
        try {
          await updateBookingMutation.mutateAsync({
            id: booking.id,
            status: booking.status,
            tableId: table.id,
            tableNumber: table.name,
          });
          Alert.alert('Success', `Table ${table.name} assigned`);
        } catch {
          Alert.alert('Error', 'Failed to assign table');
        }
      },
    }));

    Alert.alert(
      'Assign Table',
      `Select a table for ${booking.userName} (${booking.partySize} guests)`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...buttons,
      ]
    );
  };

  const handleAddWalkIn = () => {
    if (!walkInName.trim()) {
      Alert.alert('Error', 'Please enter guest name');
      return;
    }
    const partySize = parseInt(walkInPartySize);
    if (isNaN(partySize) || partySize < 1) {
      Alert.alert('Error', 'Please enter valid party size');
      return;
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    console.log('[Reservations] Creating walk-in:', {
      restaurantId,
      date: selectedDate,
      time: currentTime,
      partySize,
      name: walkInName,
    });

    createWalkInMutation.mutate({
      restaurantId,
      restaurantName: 'Restaurant',
      userId: 'walk_in',
      userName: walkInName,
      userEmail: 'walkin@restaurant.com',
      userPhone: '',
      date: selectedDate,
      time: currentTime,
      partySize,
      status: 'confirmed',
    });
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    Alert.alert(
      isPaused ? 'Reservations Resumed' : 'Reservations Paused',
      isPaused 
        ? 'New reservations are now being accepted' 
        : 'New reservations have been paused'
    );
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'seated': return '#3B82F6';
      case 'completed': return '#8B5CF6';
      default: return '#666';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateStr === today) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Service</Text>
        <TouchableOpacity 
          onPress={togglePause} 
          style={[styles.pauseButton, isPaused && styles.pauseButtonActive]}
        >
          {isPaused ? <Play size={20} color="#10B981" /> : <Pause size={20} color="#EF4444" />}
        </TouchableOpacity>
      </View>

      <View style={styles.dateSelector}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
          <Text style={styles.dateArrowText}>←</Text>
        </TouchableOpacity>
        <View style={styles.dateDisplay}>
          <Calendar size={18} color="#2D6A4F" />
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </View>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow}>
          <Text style={styles.dateArrowText}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.capacityCard}>
        <View style={styles.capacityHeader}>
          <Users size={20} color="#666" />
          <Text style={styles.capacityLabel}>Guests Booked</Text>
        </View>
        <View style={styles.capacityStats}>
          <Text style={styles.capacityValue}>{totalGuestsBooked}</Text>
          <Text style={styles.capacityMax}>/ {maxCapacity}</Text>
        </View>
        <View style={styles.capacityBarContainer}>
          <View 
            style={[
              styles.capacityBarFill, 
              { width: `${capacityPercentage}%`, backgroundColor: getCapacityColor() }
            ]} 
          />
        </View>
        <Text style={[styles.capacityPercent, { color: getCapacityColor() }]}>
          {capacityPercentage.toFixed(0)}% Capacity
        </Text>
      </View>

      {isPaused && (
        <View style={styles.pausedBanner}>
          <Pause size={16} color="#EF4444" />
          <Text style={styles.pausedText}>New Reservations Paused</Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2D6A4F" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {timeSlotGroups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Calendar size={48} color="#ccc" />
              <Text style={styles.emptyText}>No Reservations</Text>
              <Text style={styles.emptySubtext}>for {formatDate(selectedDate)}</Text>
            </View>
          ) : (
            <View style={styles.slotsList}>
              {timeSlotGroups.map((group) => (
                <View key={group.time} style={styles.slotGroup}>
                  <View style={styles.slotHeader}>
                    <Text style={styles.slotTime}>{group.time}</Text>
                    <View style={styles.slotBadge}>
                      <Users size={14} color="#666" />
                      <Text style={styles.slotGuestCount}>{group.totalGuests} guests</Text>
                    </View>
                  </View>

                  {group.bookings.map((booking) => (
                    <View key={booking.id} style={styles.bookingRow}>
                      <View style={styles.bookingInfo}>
                        <Text style={styles.bookingName}>{booking.userName}</Text>
                        <View style={styles.bookingMeta}>
                          <Users size={14} color="#999" />
                          <Text style={styles.bookingPartySize}>{booking.partySize}</Text>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: getStatusColor(booking.status) },
                            ]}
                          />
                          <Text style={[styles.statusLabel, { color: getStatusColor(booking.status) }]}>
                            {booking.status === 'confirmed' && 'Confirmed'}
                            {booking.status === 'seated' && 'Arrived'}
                            {booking.status === 'completed' && 'Done'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.bookingActions}>
                        {availability?.managementMode === 'table-based' && !booking.tableId && (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.assignTableButton]}
                            onPress={() => showTableAssignmentModal(booking)}
                            disabled={updateBookingMutation.isPending}
                          >
                            <Text style={styles.actionButtonText}>Assign Table</Text>
                          </TouchableOpacity>
                        )}

                        {availability?.managementMode === 'table-based' && booking.tableId && (
                          <View style={styles.assignedTableBadge}>
                            <Text style={styles.assignedTableText}>
                              {availability.tables?.find(t => t.id === booking.tableId)?.name || 'Table'}
                            </Text>
                          </View>
                        )}

                        {booking.status === 'confirmed' && (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.arrivedButton]}
                            onPress={() => updateBookingStatus(booking.id, 'seated')}
                            disabled={updateBookingMutation.isPending}
                          >
                            <Text style={styles.actionButtonText}>Arrived</Text>
                          </TouchableOpacity>
                        )}
                        
                        {booking.status === 'seated' && (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.doneButton]}
                            onPress={() => updateBookingStatus(booking.id, 'completed')}
                            disabled={updateBookingMutation.isPending}
                          >
                            <Text style={styles.actionButtonText}>Done</Text>
                          </TouchableOpacity>
                        )}

                        {(booking.status === 'confirmed' || booking.status === 'seated') && (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => {
                              Alert.alert(
                                'Cancel Reservation',
                                'Mark this reservation as:',
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  {
                                    text: 'No-Show',
                                    onPress: () => updateBookingStatus(booking.id, 'no-show'),
                                  },
                                  {
                                    text: 'Cancelled',
                                    onPress: () => updateBookingStatus(booking.id, 'cancelled'),
                                  },
                                ]
                              );
                            }}
                            disabled={updateBookingMutation.isPending}
                          >
                            <X size={16} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <TouchableOpacity 
        style={styles.walkInButton} 
        onPress={() => setShowWalkInModal(true)}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#fff" />
        <Text style={styles.walkInButtonText}>Add Walk-in</Text>
      </TouchableOpacity>

      <Modal
        visible={showWalkInModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowWalkInModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Walk-in</Text>
              <TouchableOpacity onPress={() => setShowWalkInModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Guest Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter guest name"
                placeholderTextColor="#999"
                value={walkInName}
                onChangeText={setWalkInName}
                autoFocus
              />

              <Text style={styles.inputLabel}>Party Size</Text>
              <TextInput
                style={styles.input}
                placeholder="Number of guests"
                placeholderTextColor="#999"
                value={walkInPartySize}
                onChangeText={setWalkInPartySize}
                keyboardType="number-pad"
              />

              <View style={styles.walkInInfo}>
                <Text style={styles.walkInInfoText}>
                  Time will be set to current time
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddWalkIn}
                disabled={createWalkInMutation.isPending}
              >
                {createWalkInMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addButtonText}>Add Walk-in</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  pauseButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  pauseButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  dateArrow: {
    padding: 8,
  },
  dateArrowText: {
    fontSize: 24,
    color: '#2D6A4F',
    fontWeight: '700' as const,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  capacityCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  capacityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  capacityLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600' as const,
  },
  capacityStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  capacityValue: {
    fontSize: 42,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  capacityMax: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#999',
    marginLeft: 4,
  },
  capacityBarContainer: {
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  capacityBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  capacityPercent: {
    fontSize: 14,
    fontWeight: '700' as const,
    textAlign: 'right',
  },
  pausedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  pausedText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#EF4444',
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
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    marginTop: 4,
  },
  slotsList: {
    padding: 16,
    paddingBottom: 100,
  },
  slotGroup: {
    marginBottom: 24,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  slotTime: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  slotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  slotGuestCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 6,
  },
  bookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingPartySize: {
    fontSize: 14,
    color: '#999',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivedButton: {
    backgroundColor: '#3B82F6',
  },
  doneButton: {
    backgroundColor: '#8B5CF6',
  },
  cancelButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    minWidth: 40,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  assignTableButton: {
    backgroundColor: '#8B5CF6',
  },
  assignedTableBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  assignedTableText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#8B5CF6',
  },
  walkInButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    left: 24,
    backgroundColor: '#2D6A4F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  walkInButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  walkInInfo: {
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  walkInInfoText: {
    fontSize: 14,
    color: '#2D6A4F',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
