import { publicProcedure } from '../../../create-context';
import { orderStore } from '../store';
import { z } from 'zod';

export const getOrderStats = publicProcedure
  .input(z.object({ restaurantId: z.string() }))
  .query(({ input }) => {
    return orderStore.getTodayStats(input.restaurantId);
  });
