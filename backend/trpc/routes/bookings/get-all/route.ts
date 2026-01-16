import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { bookingStore } from '../store';

export const getAllBookingsProcedure = publicProcedure
  .input(z.object({
    restaurantId: z.string().optional(),
    userId: z.string().optional(),
    date: z.string().optional(),
    status: z.array(z.enum(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show'])).optional(),
  }))
  .query(async ({ input }) => {
    console.log('[Backend] Get all bookings called with filters:', input);
    
    let bookings = bookingStore.getAllBookings();

    if (input.restaurantId) {
      bookings = bookings.filter(b => b.restaurantId === input.restaurantId);
    }

    if (input.userId) {
      bookings = bookings.filter(b => b.userId === input.userId);
    }

    if (input.date) {
      bookings = bookings.filter(b => b.date === input.date);
    }

    if (input.status && input.status.length > 0) {
      bookings = bookings.filter(b => input.status!.includes(b.status));
    }

    console.log('[Backend] Returning', bookings.length, 'bookings');
    return bookings;
  });

export default getAllBookingsProcedure;
