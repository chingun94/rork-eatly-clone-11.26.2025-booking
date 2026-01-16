import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { bookingStore } from '../store';

export const getAvailabilityProcedure = publicProcedure
  .input(z.object({
    restaurantId: z.string(),
    date: z.string(),
  }))
  .query(async ({ input }) => {
    console.log('[Backend] Get availability called:', input);

    const availableSlots = bookingStore.getAvailableSlots(input.restaurantId, input.date);

    console.log('[Backend] Available slots:', availableSlots.length);
    return availableSlots;
  });

export default getAvailabilityProcedure;
