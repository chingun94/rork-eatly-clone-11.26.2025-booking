import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { bookingStore } from '../store';

export const updateBookingProcedure = publicProcedure
  .input(z.object({
    id: z.string(),
    status: z.enum(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show']).optional(),
    tableNumber: z.string().optional(),
    specialRequests: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    console.log('[Backend] Update booking called:', input);

    const { id, ...updates } = input;
    const updatedBooking = bookingStore.updateBooking(id, updates);

    if (!updatedBooking) {
      throw new Error('Booking not found');
    }

    console.log('[Backend] Booking updated:', updatedBooking.id);
    return updatedBooking;
  });

export default updateBookingProcedure;
