import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { bookingStore } from '../store';

type BookingStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';

interface Booking {
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

function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const createBookingProcedure = publicProcedure
  .input(z.object({
    restaurantId: z.string(),
    restaurantName: z.string(),
    userId: z.string(),
    userName: z.string(),
    userEmail: z.string(),
    userPhone: z.string(),
    date: z.string(),
    time: z.string(),
    partySize: z.number(),
    specialRequests: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    console.log('[Backend] Create booking called:', input);

    const availableSlots = bookingStore.getAvailableSlots(input.restaurantId, input.date);
    
    if (!availableSlots.includes(input.time)) {
      throw new Error('Selected time slot is not available');
    }

    const booking: Booking = {
      id: `booking_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      restaurantId: input.restaurantId,
      restaurantName: input.restaurantName,
      userId: input.userId,
      userName: input.userName,
      userEmail: input.userEmail,
      userPhone: input.userPhone,
      date: input.date,
      time: input.time,
      partySize: input.partySize,
      status: 'pending',
      specialRequests: input.specialRequests,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmationCode: generateConfirmationCode(),
    };

    const createdBooking = bookingStore.createBooking(booking);
    console.log('[Backend] Booking created:', createdBooking.id);

    return createdBooking;
  });

export default createBookingProcedure;
