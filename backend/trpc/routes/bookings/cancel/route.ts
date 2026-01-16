import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { bookingStore } from '../store';

export const cancelBookingProcedure = publicProcedure
  .input(z.object({
    id: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log('[Backend] Cancel booking called:', input.id);

    const cancelledBooking = bookingStore.cancelBooking(input.id);

    if (!cancelledBooking) {
      throw new Error('Booking not found');
    }

    console.log('[Backend] Booking cancelled:', cancelledBooking.id);
    return cancelledBooking;
  });

export default cancelBookingProcedure;
