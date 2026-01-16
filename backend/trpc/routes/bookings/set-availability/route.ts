import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { bookingStore } from '../store';

interface RestaurantAvailability {
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

export const setAvailabilityProcedure = publicProcedure
  .input(z.object({
    restaurantId: z.string(),
    schedule: z.record(z.string(), z.object({
      isOpen: z.boolean(),
      slots: z.array(z.string()),
      capacityPerSlot: z.number(),
    })),
    specialDates: z.record(z.string(), z.object({
      isOpen: z.boolean(),
      slots: z.array(z.string()),
      capacityPerSlot: z.number(),
    })).optional(),
    defaultCapacityPerSlot: z.number(),
    advanceBookingDays: z.number(),
  }))
  .mutation(async ({ input }) => {
    console.log('[Backend] Set availability called for restaurant:', input.restaurantId);

    const availability: RestaurantAvailability = {
      restaurantId: input.restaurantId,
      schedule: input.schedule as RestaurantAvailability['schedule'],
      specialDates: (input.specialDates || {}) as RestaurantAvailability['specialDates'],
      defaultCapacityPerSlot: input.defaultCapacityPerSlot,
      advanceBookingDays: input.advanceBookingDays,
    };

    bookingStore.setAvailability(availability);
    console.log('[Backend] Availability set successfully');

    return { success: true };
  });

export default setAvailabilityProcedure;
