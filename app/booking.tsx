import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Clock, Users, ChevronRight, CheckCircle, ChevronDown, Check } from 'lucide-react-native';
import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBookings, useAvailabilityWithCapacity } from '@/contexts/BookingContext';
import { useUser } from '@/contexts/UserContext';

export default function BookingScreen() {
  const router = useRouter();
  const { restaurantId, restaurantName } = useLocalSearchParams<{
    restaurantId: string;
    restaurantName: string;
  }>();
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { createBooking, isCreating } = useBookings();
  const { user } = useUser();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [partySize, setPartySize] = useState<number>(2);
  const [phoneNumber, setPhoneNumber] = useState<string>(user?.phone || '');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [showGuestPicker, setShowGuestPicker] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  const { availableSlots, isLoading: isLoadingSlots } = useAvailabilityWithCapacity(
    restaurantId || '',
    selectedDate,
    partySize
  );

  const availableDates = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  const calendarDates = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const dates: { date: string; day: number; isCurrentMonth: boolean; isAvailable: boolean; isToday: boolean }[] = [];
    
    for (let i = 0; i < startDay; i++) {
      const prevMonthDay = new Date(currentYear, currentMonth, -startDay + i + 1);
      dates.push({
        date: prevMonthDay.toISOString().split('T')[0],
        day: prevMonthDay.getDate(),
        isCurrentMonth: false,
        isAvailable: false,
        isToday: false,
      });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      dates.push({
        date: dateStr,
        day,
        isCurrentMonth: true,
        isAvailable: availableDates.includes(dateStr),
        isToday: dateStr === todayStr,
      });
    }
    
    const totalCells = Math.ceil(dates.length / 7) * 7;
    for (let i = dates.length; i < totalCells; i++) {
      const nextMonthDay = new Date(currentYear, currentMonth + 1, i - dates.length + 1);
      dates.push({
        date: nextMonthDay.toISOString().split('T')[0],
        day: nextMonthDay.getDate(),
        isCurrentMonth: false,
        isAvailable: false,
        isToday: false,
      });
    }
    
    return dates;
  }, [availableDates]);

  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString(language === 'mn' ? 'mn-MN' : 'en-US', options);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert(
        language === 'mn' ? 'Алдаа' : 'Error',
        language === 'mn' ? 'Огноо болон цаг сонгоно уу' : 'Please select date and time'
      );
      return;
    }

    if (!phoneNumber || phoneNumber.trim().length < 8) {
      Alert.alert(
        language === 'mn' ? 'Алдаа' : 'Error',
        language === 'mn' ? 'Утасны дугаараа оруулна уу' : 'Please enter your phone number'
      );
      return;
    }

    try {
      const selectedSlot = availableSlots.find(s => s.time === selectedTime);
      if (selectedSlot && selectedSlot.available < partySize) {
        Alert.alert(
          language === 'mn' ? 'Алдаа' : 'Error',
          language === 'mn'
            ? 'Энэ цагт хүрэлцэхгүй байр байна'
            : 'Not enough available seats for this time slot'
        );
        return;
      }

      await createBooking({
        restaurantId: restaurantId!,
        restaurantName: restaurantName!,
        date: selectedDate,
        time: selectedTime,
        partySize,
        specialRequests: specialRequests.trim() || undefined,
        userPhone: phoneNumber,
      });

      setBookingSuccess(true);
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert(
        language === 'mn' ? 'Алдаа' : 'Error',
        language === 'mn'
          ? 'Захиалга хийхэд алдаа гарлаа'
          : 'Failed to create booking. Please try again.'
      );
    }
  };

  if (bookingSuccess) {
    return (
      <View style={[styles.successContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: language === 'mn' ? 'Захиалга' : 'Booking',
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
          }}
        />
        <CheckCircle size={80} color={colors.primary} />
        <Text style={[styles.successTitle, { color: colors.text }]}>
          {language === 'mn' ? 'Амжилттай!' : 'Success!'}
        </Text>
        <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
          {language === 'mn'
            ? 'Таны захиалга амжилттай хийгдлээ'
            : 'Your booking has been confirmed'}
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: language === 'mn' ? 'Ширээ захиалах' : 'Reserve a Table',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={[styles.restaurantHeader, { backgroundColor: colors.card }]}>
          <Text style={[styles.restaurantName, { color: colors.text }]}>
            {restaurantName}
          </Text>
        </View>

        <View style={styles.pickerSection}>
          <TouchableOpacity
            style={[styles.pickerButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowGuestPicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.pickerButtonLeft}>
              <Users size={20} color={colors.primary} />
              <View>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>
                  {language === 'mn' ? 'Хүний тоо' : 'Party Size'}
                </Text>
                <Text style={[styles.pickerValue, { color: colors.text }]}>
                  {partySize} {language === 'mn' ? 'хүн' : partySize === 1 ? 'guest' : 'guests'}
                </Text>
              </View>
            </View>
            <ChevronDown size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pickerButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.pickerButtonLeft}>
              <Calendar size={20} color={colors.primary} />
              <View>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>
                  {language === 'mn' ? 'Огноо' : 'Date'}
                </Text>
                <Text style={[styles.pickerValue, { color: colors.text }]}>
                  {selectedDate ? formatDate(selectedDate) : language === 'mn' ? 'Сонгох' : 'Select'}
                </Text>
              </View>
            </View>
            <ChevronDown size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pickerButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.pickerButtonLeft}>
              <Clock size={20} color={colors.primary} />
              <View>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>
                  {language === 'mn' ? 'Цаг' : 'Time'}
                </Text>
                <Text style={[styles.pickerValue, { color: colors.text }]}>
                  {selectedTime || (language === 'mn' ? 'Сонгох' : 'Select')}
                </Text>
              </View>
            </View>
            <ChevronDown size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            {language === 'mn' ? 'Утасны дугаар' : 'Phone Number'}
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            placeholder={language === 'mn' ? '99119911' : '99119911'}
            placeholderTextColor={colors.textTertiary}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            {language === 'mn' ? 'Тусгай хүсэлт (заавал биш)' : 'Special Requests (Optional)'}
          </Text>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            placeholder={
              language === 'mn'
                ? 'Цонхны хажууд, төрсөн өдөр гэх мэт...'
                : 'Window seat, birthday, etc...'
            }
            placeholderTextColor={colors.textTertiary}
            value={specialRequests}
            onChangeText={setSpecialRequests}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            { backgroundColor: colors.primary },
            isCreating && styles.confirmButtonDisabled,
          ]}
          onPress={handleBooking}
          disabled={isCreating || !selectedDate || !selectedTime}
          activeOpacity={0.8}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>
                {language === 'mn' ? 'Захиалга батлах' : 'Confirm Booking'}
              </Text>
              <ChevronRight size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showGuestPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGuestPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowGuestPicker(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {language === 'mn' ? 'Хүний тоо сонгох' : 'Select Party Size'}
              </Text>
            </View>
            <ScrollView style={styles.modalBody}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.modalOption,
                    { borderBottomColor: colors.border },
                    partySize === size && { backgroundColor: `${colors.primary}15` },
                  ]}
                  onPress={() => {
                    setPartySize(size);
                    setSelectedTime('');
                    setShowGuestPicker(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, { color: colors.text }]}>
                    {size} {language === 'mn' ? 'хүн' : size === 1 ? 'guest' : 'guests'}
                  </Text>
                  {partySize === size && <Check size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
          <Pressable style={[styles.calendarModalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {new Date().toLocaleDateString(language === 'mn' ? 'mn-MN' : 'en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.calendarContainer}>
              <View style={styles.weekDaysRow}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <View key={index} style={styles.weekDayCell}>
                    <Text style={[styles.weekDayText, { color: colors.textTertiary }]}>
                      {day}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.datesGrid}>
                {calendarDates.map((dateItem, index) => {
                  const isSelected = dateItem.date === selectedDate;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dateCell,
                        isSelected && [styles.dateCellSelected, { backgroundColor: colors.primary }],
                        dateItem.isToday && !isSelected && [styles.dateCellToday, { borderColor: colors.primary }],
                      ]}
                      onPress={() => {
                        if (dateItem.isAvailable) {
                          setSelectedDate(dateItem.date);
                          setSelectedTime('');
                          setShowDatePicker(false);
                        }
                      }}
                      disabled={!dateItem.isAvailable}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dateCellText,
                          { color: colors.text },
                          !dateItem.isCurrentMonth && styles.dateCellTextInactive,
                          !dateItem.isAvailable && styles.dateCellTextDisabled,
                          isSelected && styles.dateCellTextSelected,
                        ]}
                      >
                        {dateItem.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTimePicker(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {language === 'mn' ? 'Цаг сонгох' : 'Select Time'}
              </Text>
            </View>
            {isLoadingSlots ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ padding: 40 }} />
            ) : (
              <ScrollView style={styles.modalBody}>
                {availableSlots.length > 0 ? (
                  availableSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot.time}
                      style={[
                        styles.modalOption,
                        { borderBottomColor: colors.border },
                        selectedTime === slot.time && { backgroundColor: `${colors.primary}15` },
                      ]}
                      onPress={() => {
                        setSelectedTime(slot.time);
                        setShowTimePicker(false);
                      }}
                    >
                      <View>
                        <Text style={[styles.modalOptionText, { color: colors.text }]}>
                          {slot.time}
                        </Text>
                        <Text style={[styles.modalOptionSubtext, { color: colors.textSecondary }]}>
                          {slot.available} {language === 'mn' ? 'боломжтой' : slot.available === 1 ? 'table available' : 'tables available'}
                        </Text>
                      </View>
                      {selectedTime === slot.time && <Check size={20} color={colors.primary} />}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Clock size={48} color={colors.border} />
                    <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                      {language === 'mn'
                        ? `${partySize} хүнд зориулсан боломжтой цаг байхгүй`
                        : `No available times for ${partySize} ${partySize === 1 ? 'guest' : 'guests'}`}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  restaurantHeader: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  pickerSection: {
    gap: 12,
    marginBottom: 24,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  pickerButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  pickerValue: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  calendarModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    paddingBottom: 20,
  },
  calendarContainer: {
    padding: 20,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateCell: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 8,
  },
  dateCellSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateCellToday: {
    borderWidth: 2,
  },
  dateCellText: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  dateCellTextInactive: {
    opacity: 0.3,
  },
  dateCellTextDisabled: {
    opacity: 0.4,
  },
  dateCellTextSelected: {
    color: '#fff',
    fontWeight: '700' as const,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  modalBody: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  modalOptionSubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginTop: 24,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
});
