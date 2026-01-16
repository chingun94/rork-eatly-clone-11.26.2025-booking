import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { getDb } from '@/config/firebase';
import { Booking, BookingStatus, CreateBookingInput, RestaurantAvailability } from '@/types/booking';

const BOOKINGS_COLLECTION = 'bookings';
const AVAILABILITY_COLLECTION = 'restaurant_availability';
const NOTIFICATIONS_COLLECTION = 'staff_notifications';

export const bookingFirebase = {
  async getAllBookings(filters?: { restaurantId?: string; userId?: string; date?: string; status?: BookingStatus[] }): Promise<Booking[]> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      let q = query(collection(db, BOOKINGS_COLLECTION));

      if (filters?.restaurantId) {
        q = query(q, where('restaurantId', '==', filters.restaurantId));
      }

      if (filters?.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }

      if (filters?.date) {
        q = query(q, where('date', '==', filters.date));
      }

      if (filters?.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status));
      }

      const snapshot = await getDocs(q);
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      
      return bookings.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      console.error('[bookingFirebase] Error getting bookings:', error);
      return [];
    }
  },

  async getBookingById(id: string): Promise<Booking | null> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, BOOKINGS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Booking;
      }
      return null;
    } catch (error) {
      console.error('[bookingFirebase] Error getting booking:', error);
      return null;
    }
  },

  async createBooking(input: CreateBookingInput & { userId: string; userName: string; userEmail: string; status?: BookingStatus }): Promise<Booking> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const confirmationCode = Math.random().toString(36).substr(2, 8).toUpperCase();

      const booking: Booking = {
        id: bookingId,
        restaurantId: input.restaurantId,
        restaurantName: input.restaurantName,
        userId: input.userId,
        userName: input.userName,
        userEmail: input.userEmail,
        userPhone: input.userPhone || '',
        date: input.date,
        time: input.time,
        partySize: input.partySize,
        status: input.status || 'pending',
        specialRequests: input.specialRequests || '',
        createdAt: now,
        updatedAt: now,
        confirmationCode,
      };

      const bookingData = Object.fromEntries(
        Object.entries(booking).filter(([_, value]) => value !== undefined && value !== null)
      );

      await setDoc(doc(db, BOOKINGS_COLLECTION, bookingId), bookingData);
      console.log('[bookingFirebase] Booking created successfully:', bookingId, bookingData);

      await this.createNotification({
        restaurantId: input.restaurantId,
        title: 'New Booking',
        body: `${input.userName} - ${input.partySize} guests at ${input.time}`,
        type: 'booking_created',
        bookingId,
        data: { date: input.date, time: input.time, partySize: input.partySize },
      });

      return booking;
    } catch (error) {
      console.error('[bookingFirebase] Error creating booking:', error);
      throw error;
    }
  },

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | null> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, BOOKINGS_COLLECTION, id);
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(docRef, updatedData);
      console.log('[bookingFirebase] Booking updated:', id);

      const updated = await this.getBookingById(id);
      
      if (updated && updates.status) {
        const statusMessages: Record<string, string> = {
          confirmed: 'Booking confirmed',
          seated: 'Guest seated',
          completed: 'Booking completed',
          cancelled: 'Booking cancelled',
          'no-show': 'Guest marked as no-show',
        };

        const message = statusMessages[updates.status];
        if (message) {
          await this.createNotification({
            restaurantId: updated.restaurantId,
            title: message,
            body: `${updated.userName} - ${updated.partySize} guests at ${updated.time}`,
            type: updates.status === 'cancelled' ? 'booking_cancelled' : 'booking_updated',
            bookingId: id,
            data: { status: updates.status },
          });
        }
      }
      
      return updated;
    } catch (error) {
      console.error('[bookingFirebase] Error updating booking:', error);
      throw error;
    }
  },

  async cancelBooking(id: string): Promise<Booking | null> {
    return this.updateBooking(id, { status: 'cancelled' });
  },

  async deleteBooking(id: string): Promise<void> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      await deleteDoc(doc(db, BOOKINGS_COLLECTION, id));
      console.log('[bookingFirebase] Booking deleted:', id);
    } catch (error) {
      console.error('[bookingFirebase] Error deleting booking:', error);
      throw error;
    }
  },

  async getAvailability(restaurantId: string): Promise<RestaurantAvailability | null> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, AVAILABILITY_COLLECTION, restaurantId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as RestaurantAvailability;
      }
      
      return null;
    } catch (error) {
      console.error('[bookingFirebase] Error getting availability:', error);
      return null;
    }
  },

  async setAvailability(availability: RestaurantAvailability): Promise<void> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, AVAILABILITY_COLLECTION, availability.restaurantId);
      await setDoc(docRef, availability);
      console.log('[bookingFirebase] Availability updated for:', availability.restaurantId);
      console.log('[bookingFirebase] Management mode:', availability.managementMode);
      console.log('[bookingFirebase] Schedule:', JSON.stringify(availability.schedule, null, 2));
    } catch (error) {
      console.error('[bookingFirebase] Error setting availability:', error);
      throw error;
    }
  },

  async getAvailableSlots(restaurantId: string, date: string): Promise<string[]> {
    try {
      const availability = await this.getAvailability(restaurantId);
      if (!availability) return [];

      const dateObj = new Date(date);
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      
      const specialDate = availability.specialDates?.[date];
      if (specialDate) {
        if (!specialDate.isOpen) return [];
        return this.filterBookedSlots(restaurantId, date, specialDate.slots, specialDate.capacityPerSlot);
      }

      const daySchedule = availability.schedule?.[dayOfWeek];
      if (!daySchedule || !daySchedule.isOpen) return [];

      return this.filterBookedSlots(restaurantId, date, daySchedule.slots, daySchedule.capacityPerSlot);
    } catch (error) {
      console.error('[bookingFirebase] Error getting available slots:', error);
      return [];
    }
  },

  parseTime(timeStr: string): { hour: number; minute: number } {
    const [timeOnly] = timeStr.split(' ');
    const [hourStr, minuteStr] = timeOnly.split(':');
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr || '0');
    
    if (timeStr.includes('PM') && hour !== 12) {
      hour += 12;
    } else if (timeStr.includes('AM') && hour === 12) {
      hour = 0;
    }
    
    return { hour, minute };
  },

  getTimeInMinutes(timeStr: string): number {
    const { hour, minute } = this.parseTime(timeStr);
    return hour * 60 + minute;
  },

  isSlotBlockedByBooking(slotTime: string, bookingTime: string, turningTimeMinutes: number): boolean {
    const slotMinutes = this.getTimeInMinutes(slotTime);
    const bookingMinutes = this.getTimeInMinutes(bookingTime);
    const bookingEndMinutes = bookingMinutes + turningTimeMinutes;
    
    const isBlocked = slotMinutes >= bookingMinutes && slotMinutes < bookingEndMinutes;
    
    console.log('[isSlotBlockedByBooking]', {
      slotTime,
      bookingTime,
      turningTimeMinutes,
      slotMinutes,
      bookingMinutes,
      bookingEndMinutes,
      isBlocked,
    });
    
    return isBlocked;
  },

  async getAvailableSlotsWithCapacity(restaurantId: string, date: string, partySize: number): Promise<{ time: string; available: number; capacity: number }[]> {
    try {
      const availability = await this.getAvailability(restaurantId);
      if (!availability) {
        console.log('[bookingFirebase] No availability found for restaurant:', restaurantId);
        return [];
      }

      const dateObj = new Date(date);
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      
      let slots: string[] = [];
      let capacityPerSlot = 0;

      const specialDate = availability.specialDates?.[date];
      if (specialDate) {
        if (!specialDate.isOpen) return [];
        slots = specialDate.slots;
        capacityPerSlot = specialDate.capacityPerSlot;
      } else {
        const daySchedule = availability.schedule?.[dayOfWeek];
        if (!daySchedule || !daySchedule.isOpen) return [];
        slots = daySchedule.slots;
        capacityPerSlot = daySchedule.capacityPerSlot;
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const isToday = date === today;
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const filteredSlots = slots.filter(slot => {
        if (!isToday) return true;
        
        const { hour, minute } = this.parseTime(slot);
        
        if (hour < currentHour || (hour === currentHour && minute <= currentMinute)) {
          return false;
        }
        
        return true;
      });

      const bookings = await this.getAllBookings({
        restaurantId,
        date,
        status: ['pending', 'confirmed', 'seated'],
      });

      const turningTime = availability.tableTurningTime || 60;

      console.log('[bookingFirebase] Availability check:', {
        restaurantId,
        date,
        managementMode: availability.managementMode,
        capacityPerSlot,
        turningTime,
        totalSlots: filteredSlots.length,
        totalBookings: bookings.length,
        bookingDetails: bookings.map(b => ({ time: b.time, partySize: b.partySize, tableId: b.tableId })),
      });

      if (availability.managementMode === 'guest-count') {
        const result = filteredSlots.map(slot => {
          let bookedGuests = 0;
          
          bookings.forEach(booking => {
            if (this.isSlotBlockedByBooking(slot, booking.time, turningTime)) {
              bookedGuests += booking.partySize;
            }
          });
          
          const available = Math.max(0, capacityPerSlot - bookedGuests);
          
          console.log('[bookingFirebase] Slot availability:', {
            slot,
            capacityPerSlot,
            bookedGuests,
            available,
            partySize,
            canBook: available >= partySize,
          });
          
          return {
            time: slot,
            available,
            capacity: capacityPerSlot,
          };
        }).filter(s => s.available >= partySize);
        
        console.log('[bookingFirebase] Final available slots:', result.length);
        return result;
      } else {
        const tables = availability.tables?.filter(t => t.isActive) || [];
        
        const result = filteredSlots.map(slot => {
          const slotBookings: { time: string; partySize: number; blocks: boolean }[] = [];
          let tablesNeeded = 0;
          
          bookings.forEach(booking => {
            const blocks = this.isSlotBlockedByBooking(slot, booking.time, turningTime);
            slotBookings.push({ time: booking.time, partySize: booking.partySize, blocks });
            
            if (blocks) {
              if (booking.tableId) {
                tablesNeeded += 1;
              } else {
                const suitableTablesForBooking = tables.filter(t => t.capacity >= booking.partySize);
                if (suitableTablesForBooking.length > 0) {
                  tablesNeeded += 1;
                }
              }
            }
          });
          
          const totalTables = tables.filter(t => t.capacity >= partySize).length;
          const availableTables = Math.max(0, totalTables - tablesNeeded);
          
          console.log('[bookingFirebase] Table slot availability:', {
            slot,
            totalTables,
            tablesNeeded,
            availableTables,
            partySize,
            slotBookings,
          });
          
          return {
            time: slot,
            available: availableTables,
            capacity: totalTables,
          };
        }).filter(s => s.available > 0);
        
        console.log('[bookingFirebase] Final available table slots:', result.length);
        return result;
      }
    } catch (error) {
      console.error('[bookingFirebase] Error getting available slots with capacity:', error);
      return [];
    }
  },

  async filterBookedSlots(restaurantId: string, date: string, slots: string[], capacityPerSlot: number): Promise<string[]> {
    try {
      const availability = await this.getAvailability(restaurantId);
      const turningTime = availability?.tableTurningTime || 60;
      
      const bookings = await this.getAllBookings({
        restaurantId,
        date,
        status: ['pending', 'confirmed', 'seated'],
      });

      return slots.filter(slot => {
        let bookedCount = 0;
        
        bookings.forEach(booking => {
          if (this.isSlotBlockedByBooking(slot, booking.time, turningTime)) {
            bookedCount++;
          }
        });
        
        return bookedCount < capacityPerSlot;
      });
    } catch (error) {
      console.error('[bookingFirebase] Error filtering booked slots:', error);
      return slots;
    }
  },

  async createNotification(notification: {
    restaurantId: string;
    title: string;
    body: string;
    type: 'booking_created' | 'booking_updated' | 'booking_cancelled' | 'walk_in';
    bookingId?: string;
    data?: any;
  }): Promise<void> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');

      const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const notificationData = {
        id: notificationId,
        restaurantId: notification.restaurantId,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        bookingId: notification.bookingId || null,
        data: notification.data || null,
        read: false,
        createdAt: now,
      };

      await setDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), notificationData);
      console.log('[bookingFirebase] Notification created:', notificationId);
    } catch (error) {
      console.error('[bookingFirebase] Error creating notification:', error);
    }
  },

  async getNotifications(restaurantId: string, limit?: number): Promise<{
    id: string;
    restaurantId: string;
    title: string;
    body: string;
    type: string;
    bookingId?: string;
    data?: any;
    read: boolean;
    createdAt: string;
  }[]> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');

      let q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('restaurantId', '==', restaurantId)
      );

      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as {
        id: string;
        restaurantId: string;
        title: string;
        body: string;
        type: string;
        bookingId?: string;
        data?: any;
        read: boolean;
        createdAt: string;
      }));

      const sorted = notifications.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      return limit ? sorted.slice(0, limit) : sorted;
    } catch (error) {
      console.error('[bookingFirebase] Error getting notifications:', error);
      return [];
    }
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');

      const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(docRef, { read: true });
      console.log('[bookingFirebase] Notification marked as read:', notificationId);
    } catch (error) {
      console.error('[bookingFirebase] Error marking notification as read:', error);
    }
  },

  async markAllNotificationsAsRead(restaurantId: string): Promise<void> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');

      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('restaurantId', '==', restaurantId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
      );

      await Promise.all(updatePromises);
      console.log('[bookingFirebase] All notifications marked as read');
    } catch (error) {
      console.error('[bookingFirebase] Error marking all notifications as read:', error);
    }
  },
};
