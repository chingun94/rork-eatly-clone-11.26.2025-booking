import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { restaurantStore } from '../store';

export const syncRestaurantsProcedure = publicProcedure
  .input(z.array(z.any()))
  .mutation(async ({ input }) => {
    console.log('[Backend] Restaurants sync mutation called');
    console.log('[Backend] Received restaurants count:', input.length);
    console.log('[Backend] First restaurant ID:', input[0]?.id);
    console.log('[Backend] Restaurant IDs:', input.map(r => r.id).join(', '));
    restaurantStore.setAll(input);
    const currentCount = restaurantStore.getAll().length;
    console.log('[Backend] Restaurants stored successfully. Backend now has:', currentCount);
    return { success: true, count: currentCount };
  });

export default syncRestaurantsProcedure;
