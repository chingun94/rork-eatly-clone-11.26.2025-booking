export type BookingStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'seated' 
  | 'completed' 
  | 'cancelled' 
  | 'no-show';

export interface Booking {
  id: string;
  restaurantId: string;
  restaurantName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  date: string;
  time: string;
  partySize: number;
  status: BookingStatus;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
  confirmationCode?: string;
  tableNumber?: string;
  tableId?: string;
}

export interface RestaurantAvailability {
  restaurantId: string;
  schedule: {
    [dayOfWeek: string]: {
      isOpen: boolean;
      slots: string[];
      capacityPerSlot: number;
    };
  };
  specialDates: {
    [date: string]: {
      isOpen: boolean;
      slots: string[];
      capacityPerSlot: number;
    };
  };
  defaultCapacityPerSlot: number;
  advanceBookingDays: number;
}

class BookingStore {
  private bookings: Booking[] = [];
  private availability: RestaurantAvailability[] = [];

  getAllBookings(): Booking[] {
    return this.bookings;
  }

  getBookingById(id: string): Booking | undefined {
    return this.bookings.find(b => b.id === id);
  }

  getBookingsByRestaurant(restaurantId: string): Booking[] {
    return this.bookings.filter(b => b.restaurantId === restaurantId);
  }

  getBookingsByUser(userId: string): Booking[] {
    return this.bookings.filter(b => b.userId === userId);
  }

  createBooking(booking: Booking): Booking {
    this.bookings = [booking, ...this.bookings];
    return booking;
  }

  updateBooking(id: string, updates: Partial<Booking>): Booking | null {
    const index = this.bookings.findIndex(b => b.id === id);
    if (index === -1) return null;

    this.bookings[index] = { ...this.bookings[index], ...updates, updatedAt: new Date().toISOString() };
    return this.bookings[index];
  }

  cancelBooking(id: string): Booking | null {
    return this.updateBooking(id, { status: 'cancelled' });
  }

  deleteBooking(id: string): void {
    this.bookings = this.bookings.filter(b => b.id !== id);
  }

  getAvailability(restaurantId: string): RestaurantAvailability | undefined {
    return this.availability.find(a => a.restaurantId === restaurantId);
  }

  setAvailability(availability: RestaurantAvailability): void {
    const index = this.availability.findIndex(a => a.restaurantId === availability.restaurantId);
    
    if (index === -1) {
      this.availability.push(availability);
    } else {
      this.availability[index] = availability;
    }
  }

  getAvailableSlots(restaurantId: string, date: string): string[] {
    const availability = this.getAvailability(restaurantId);
    if (!availability) return [];

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    
    const specialDate = availability.specialDates[date];
    if (specialDate) {
      if (!specialDate.isOpen) return [];
      return this.filterBookedSlots(restaurantId, date, specialDate.slots, specialDate.capacityPerSlot);
    }

    const daySchedule = availability.schedule[dayOfWeek];
    if (!daySchedule || !daySchedule.isOpen) return [];

    return this.filterBookedSlots(restaurantId, date, daySchedule.slots, daySchedule.capacityPerSlot);
  }

  private filterBookedSlots(restaurantId: string, date: string, slots: string[], capacityPerSlot: number): string[] {
    const bookingsForDate = this.bookings.filter(
      b => b.restaurantId === restaurantId && 
      b.date === date && 
      (b.status === 'pending' || b.status === 'confirmed' || b.status === 'seated')
    );

    return slots.filter(slot => {
      const bookedCount = bookingsForDate.filter(b => b.time === slot).length;
      return bookedCount < capacityPerSlot;
    });
  }
}

export const bookingStore = new BookingStore();
