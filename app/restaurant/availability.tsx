import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, Clock, Plus, Trash2, Save, Settings, Table2 } from 'lucide-react-native';
import { bookingFirebase } from '@/utils/bookingFirebase';
import { RestaurantAvailability, SimpleTable } from '@/types/booking';
import { useMutation } from '@tanstack/react-query';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DEFAULT_TIME_SLOTS = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
];

export default function AvailabilityScreen() {
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState('');
  const [availability, setAvailability] = useState<RestaurantAvailability | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);

  const setAvailabilityMutation = useMutation({
    mutationFn: (availability: RestaurantAvailability) => bookingFirebase.setAvailability(availability),
    onSuccess: () => {
      Alert.alert('Success', 'Availability settings saved successfully');
      setHasChanges(false);
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to save availability settings');
      console.error('Save availability error:', error);
    },
  });

  const loadAvailabilityFromFirebase = useCallback(async () => {
    if (!restaurantId) {
      setIsLoadingAvailability(false);
      return;
    }
    
    try {
      setIsLoadingAvailability(true);
      const existingAvailability = await bookingFirebase.getAvailability(restaurantId);
      
      if (existingAvailability) {
        console.log('[Availability] Loaded from Firebase:', existingAvailability.managementMode);
        setAvailability(existingAvailability);
      } else {
        console.log('[Availability] Creating default availability');
        const defaultAvailability: RestaurantAvailability = {
          restaurantId,
          managementMode: 'guest-count',
          schedule: DAYS_OF_WEEK.reduce((acc, day) => {
            acc[day] = {
              isOpen: true,
              slots: DEFAULT_TIME_SLOTS,
              capacityPerSlot: 4,
            };
            return acc;
          }, {} as RestaurantAvailability['schedule']),
          specialDates: {},
          defaultCapacityPerSlot: 4,
          advanceBookingDays: 30,
          tableTurningTime: 60,
          tables: [],
        };
        setAvailability(defaultAvailability);
      }
    } catch (error) {
      console.error('[Availability] Error loading:', error);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    const loadRestaurantId = async () => {
      const id = await AsyncStorage.getItem('restaurant_id');
      if (id) {
        setRestaurantId(id);
      }
    };
    loadRestaurantId();
  }, []);

  useEffect(() => {
    loadAvailabilityFromFirebase();
  }, [loadAvailabilityFromFirebase]);

  const toggleDayOpen = (day: string) => {
    if (!availability) return;
    
    setAvailability({
      ...availability,
      schedule: {
        ...availability.schedule,
        [day]: {
          ...availability.schedule[day],
          isOpen: !availability.schedule[day].isOpen,
        },
      },
    });
    setHasChanges(true);
  };

  const updateCapacity = (day: string, capacity: number) => {
    if (!availability) return;
    
    setAvailability({
      ...availability,
      schedule: {
        ...availability.schedule,
        [day]: {
          ...availability.schedule[day],
          capacityPerSlot: capacity,
        },
      },
    });
    setHasChanges(true);
  };

  const addTimeSlot = (day: string, time: string) => {
    if (!availability) return;
    
    const daySchedule = availability.schedule[day];
    if (daySchedule.slots.includes(time)) {
      Alert.alert('Error', 'This time slot already exists');
      return;
    }

    const newSlots = [...daySchedule.slots, time].sort();
    
    setAvailability({
      ...availability,
      schedule: {
        ...availability.schedule,
        [day]: {
          ...daySchedule,
          slots: newSlots,
        },
      },
    });
    setHasChanges(true);
  };

  const removeTimeSlot = (day: string, time: string) => {
    if (!availability) return;
    
    const daySchedule = availability.schedule[day];
    const newSlots = daySchedule.slots.filter(slot => slot !== time);
    
    setAvailability({
      ...availability,
      schedule: {
        ...availability.schedule,
        [day]: {
          ...daySchedule,
          slots: newSlots,
        },
      },
    });
    setHasChanges(true);
  };

  const applyToAllDays = (day: string) => {
    if (!availability) return;
    
    Alert.alert(
      'Apply to All Days',
      `Apply ${day}'s settings to all days?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            const daySchedule = availability.schedule[day];
            const newSchedule = DAYS_OF_WEEK.reduce((acc, d) => {
              acc[d] = { ...daySchedule };
              return acc;
            }, {} as RestaurantAvailability['schedule']);

            setAvailability({
              ...availability,
              schedule: newSchedule,
            });
            setHasChanges(true);
          },
        },
      ]
    );
  };

  const saveAvailability = async () => {
    if (!availability) return;

    try {
      await setAvailabilityMutation.mutateAsync(availability);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  if (!availability || isLoadingAvailability) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2D6A4F" />
          <Text style={styles.loadingText}>Loading availability settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Availability Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Clock size={20} color="#2D6A4F" />
          <Text style={styles.infoText}>
            Configure your restaurant&apos;s availability schedule. Set opening hours and table
            capacity for each day of the week.
          </Text>
        </View>

        <View style={styles.modeCard}>
          <View style={styles.modeSectionHeader}>
            <Settings size={20} color="#1a1a1a" />
            <Text style={styles.modeSectionTitle}>Management Mode</Text>
          </View>
          <Text style={styles.modeDescription}>
            Choose how you want to manage reservations
          </Text>
          
          <View style={styles.modeOptions}>
            <TouchableOpacity
              style={[
                styles.modeOption,
                availability.managementMode === 'guest-count' && styles.modeOptionActive,
              ]}
              onPress={() => {
                setAvailability({ ...availability, managementMode: 'guest-count' });
                setHasChanges(true);
              }}
            >
              <View style={styles.modeOptionHeader}>
                <View style={[
                  styles.modeRadio,
                  availability.managementMode === 'guest-count' && styles.modeRadioActive,
                ]}>
                  {availability.managementMode === 'guest-count' && (
                    <View style={styles.modeRadioInner} />
                  )}
                </View>
                <Text style={[
                  styles.modeOptionTitle,
                  availability.managementMode === 'guest-count' && styles.modeOptionTitleActive,
                ]}>Simple Guest Count</Text>
              </View>
              <Text style={styles.modeOptionDesc}>
                Fast and simple. Set maximum number of guests per time slot.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeOption,
                availability.managementMode === 'table-based' && styles.modeOptionActive,
              ]}
              onPress={() => {
                setAvailability({ ...availability, managementMode: 'table-based' });
                setHasChanges(true);
              }}
            >
              <View style={styles.modeOptionHeader}>
                <View style={[
                  styles.modeRadio,
                  availability.managementMode === 'table-based' && styles.modeRadioActive,
                ]}>
                  {availability.managementMode === 'table-based' && (
                    <View style={styles.modeRadioInner} />
                  )}
                </View>
                <Text style={[
                  styles.modeOptionTitle,
                  availability.managementMode === 'table-based' && styles.modeOptionTitleActive,
                ]}>Table-Based Seating</Text>
              </View>
              <Text style={styles.modeOptionDesc}>
                More control. Define tables and assign them to reservations.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {availability.managementMode === 'table-based' && (
          <View style={styles.tablesCard}>
            <View style={styles.tablesSectionHeader}>
              <View style={styles.tablesHeaderLeft}>
                <Table2 size={20} color="#1a1a1a" />
                <Text style={styles.tablesSectionTitle}>Tables</Text>
              </View>
              <TouchableOpacity
                style={styles.addTableButton}
                onPress={() => {
                  Alert.prompt(
                    'Add Table',
                    'Enter table name (e.g., T1, Table 1)',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Next',
                        onPress: (name?: string) => {
                          if (!name || !name.trim()) {
                            Alert.alert('Error', 'Please enter a table name');
                            return;
                          }
                          Alert.prompt(
                            'Table Capacity',
                            'How many guests can this table seat?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Add',
                                onPress: (capacityStr?: string) => {
                                  const capacity = parseInt(capacityStr || '2');
                                  if (isNaN(capacity) || capacity < 1) {
                                    Alert.alert('Error', 'Please enter a valid capacity');
                                    return;
                                  }
                                  const newTable: SimpleTable = {
                                    id: `table_${Date.now()}`,
                                    name: name.trim(),
                                    capacity,
                                    isActive: true,
                                  };
                                  setAvailability({
                                    ...availability,
                                    tables: [...(availability.tables || []), newTable],
                                  });
                                  setHasChanges(true);
                                },
                              },
                            ],
                            'plain-text',
                            '4'
                          );
                        },
                      },
                    ],
                    'plain-text'
                  );
                }}
              >
                <Plus size={16} color="#2D6A4F" />
                <Text style={styles.addTableButtonText}>Add Table</Text>
              </TouchableOpacity>
            </View>

            {(!availability.tables || availability.tables.length === 0) ? (
              <View style={styles.emptyTables}>
                <Table2 size={32} color="#ccc" />
                <Text style={styles.emptyTablesText}>No tables added yet</Text>
                <Text style={styles.emptyTablesSubtext}>Add tables to start managing reservations</Text>
              </View>
            ) : (
              <View style={styles.tablesList}>
                {availability.tables.map((table) => (
                  <View key={table.id} style={styles.tableItem}>
                    <View style={styles.tableItemLeft}>
                      <View style={styles.tableIcon}>
                        <Table2 size={18} color="#2D6A4F" />
                      </View>
                      <View>
                        <Text style={styles.tableName}>{table.name}</Text>
                        <Text style={styles.tableCapacity}>{table.capacity} guests</Text>
                      </View>
                    </View>
                    <View style={styles.tableItemRight}>
                      <Switch
                        value={table.isActive}
                        onValueChange={() => {
                          setAvailability({
                            ...availability,
                            tables: availability.tables?.map(t =>
                              t.id === table.id ? { ...t, isActive: !t.isActive } : t
                            ),
                          });
                          setHasChanges(true);
                        }}
                        trackColor={{ false: '#e0e0e0', true: '#52B788' }}
                        thumbColor={table.isActive ? '#2D6A4F' : '#f4f3f4'}
                      />
                      <TouchableOpacity
                        style={styles.deleteTableButton}
                        onPress={() => {
                          Alert.alert(
                            'Delete Table',
                            `Are you sure you want to delete ${table.name}?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => {
                                  setAvailability({
                                    ...availability,
                                    tables: availability.tables?.filter(t => t.id !== table.id),
                                  });
                                  setHasChanges(true);
                                },
                              },
                            ]
                          );
                        }}
                      >
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {DAYS_OF_WEEK.map((day) => {
          const daySchedule = availability.schedule[day];
          return (
            <View key={day} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View style={styles.dayTitleRow}>
                  <Text style={styles.dayTitle}>{day}</Text>
                  <Switch
                    value={daySchedule.isOpen}
                    onValueChange={() => toggleDayOpen(day)}
                    trackColor={{ false: '#e0e0e0', true: '#52B788' }}
                    thumbColor={daySchedule.isOpen ? '#2D6A4F' : '#f4f3f4'}
                  />
                </View>
                {daySchedule.isOpen && (
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={() => applyToAllDays(day)}
                  >
                    <Text style={styles.applyButtonText}>Apply to all days</Text>
                  </TouchableOpacity>
                )}
              </View>

              {daySchedule.isOpen && (
                <>
                  {availability.managementMode === 'guest-count' && (
                    <View style={styles.capacitySection}>
                      <Text style={styles.sectionLabel}>Maximum guests per time slot</Text>
                      <View style={styles.capacityControls}>
                        <TouchableOpacity
                          style={styles.capacityButton}
                          onPress={() => updateCapacity(day, Math.max(1, daySchedule.capacityPerSlot - 1))}
                        >
                          <Text style={styles.capacityButtonText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.capacityValue}>{daySchedule.capacityPerSlot}</Text>
                        <TouchableOpacity
                          style={styles.capacityButton}
                          onPress={() => updateCapacity(day, daySchedule.capacityPerSlot + 1)}
                        >
                          <Text style={styles.capacityButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <View style={styles.slotsSection}>
                    <View style={styles.slotsSectionHeader}>
                      <Text style={styles.sectionLabel}>Time Slots</Text>
                      <TouchableOpacity
                        style={styles.addSlotButton}
                        onPress={() => {
                          Alert.prompt(
                            'Add Time Slot',
                            'Enter time in HH:MM format (e.g., 18:00)',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Add',
                                onPress: (time?: string) => {
                                  if (time && /^\d{2}:\d{2}$/.test(time)) {
                                    addTimeSlot(day, time);
                                  } else {
                                    Alert.alert('Error', 'Invalid time format. Use HH:MM');
                                  }
                                },
                              },
                            ],
                            'plain-text'
                          );
                        }}
                      >
                        <Plus size={16} color="#2D6A4F" />
                        <Text style={styles.addSlotButtonText}>Add Slot</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.slotsGrid}>
                      {daySchedule.slots.map((slot) => (
                        <View key={slot} style={styles.slotChip}>
                          <Text style={styles.slotTime}>{slot}</Text>
                          <TouchableOpacity
                            onPress={() => removeTimeSlot(day, slot)}
                            style={styles.removeSlotButton}
                          >
                            <Trash2 size={14} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </View>
          );
        })}

        <View style={styles.advanceBookingCard}>
          <Text style={styles.sectionLabel}>Advance Booking</Text>
          <Text style={styles.advanceBookingText}>
            Customers can book up to{' '}
            <Text style={styles.advanceBookingValue}>{availability.advanceBookingDays}</Text> days
            in advance
          </Text>
          <View style={styles.capacityControls}>
            <TouchableOpacity
              style={styles.capacityButton}
              onPress={() => {
                setAvailability({
                  ...availability,
                  advanceBookingDays: Math.max(1, availability.advanceBookingDays - 7),
                });
                setHasChanges(true);
              }}
            >
              <Text style={styles.capacityButtonText}>-7</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.capacityButton}
              onPress={() => {
                setAvailability({
                  ...availability,
                  advanceBookingDays: availability.advanceBookingDays + 7,
                });
                setHasChanges(true);
              }}
            >
              <Text style={styles.capacityButtonText}>+7</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {hasChanges && (
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              setAvailabilityMutation.isPending && styles.saveButtonDisabled,
            ]}
            onPress={saveAvailability}
            disabled={setAvailabilityMutation.isPending}
          >
            {setAvailabilityMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#2D6A4F',
    lineHeight: 20,
  },
  dayCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeader: {
    marginBottom: 16,
  },
  dayTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  applyButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  applyButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#2D6A4F',
  },
  capacitySection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 8,
  },
  capacityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  capacityButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capacityButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#2D6A4F',
  },
  capacityValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    minWidth: 40,
    textAlign: 'center',
  },
  slotsSection: {
    marginTop: 8,
  },
  slotsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
  },
  addSlotButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#2D6A4F',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  removeSlotButton: {
    padding: 2,
  },
  advanceBookingCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  advanceBookingText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 16,
  },
  advanceBookingValue: {
    fontWeight: '700' as const,
    color: '#2D6A4F',
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  modeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  modeSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  modeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modeOptions: {
    gap: 12,
  },
  modeOption: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
  },
  modeOptionActive: {
    borderColor: '#2D6A4F',
    backgroundColor: 'rgba(45, 106, 79, 0.05)',
  },
  modeOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  modeRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeRadioActive: {
    borderColor: '#2D6A4F',
  },
  modeRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2D6A4F',
  },
  modeOptionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  modeOptionTitleActive: {
    color: '#2D6A4F',
  },
  modeOptionDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  tablesCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tablesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tablesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tablesSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  addTableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
  },
  addTableButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#2D6A4F',
  },
  emptyTables: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTablesText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
    marginTop: 12,
  },
  emptyTablesSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  tablesList: {
    gap: 10,
  },
  tableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 10,
  },
  tableItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  tableIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  tableCapacity: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  tableItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteTableButton: {
    padding: 6,
  },
});
