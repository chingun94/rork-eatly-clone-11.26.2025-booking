import { publicProcedure } from '../../../create-context';
import { orderStore } from '../store';
import { z } from 'zod';

export const getAllOrders = publicProcedure
  .input(
    z.object({
      userId: z.string().optional(),
      restaurantId: z.string().optional(),
      driverId: z.string().optional(),
    })
  )
  .query(({ input }) => {
    if (input.userId) {
      return orderStore.getByUserId(input.userId);
    }
    if (input.restaurantId) {
      return orderStore.getByRestaurantId(input.restaurantId);
    }
    if (input.driverId) {
      return orderStore.getByDriverId(input.driverId);
    }
    return orderStore.getAll();
  });
