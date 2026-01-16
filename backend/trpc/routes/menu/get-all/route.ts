import { publicProcedure } from '../../../create-context';
import { menuStore } from '../store';
import { z } from 'zod';

export const getAllMenuItems = publicProcedure
  .input(
    z.object({
      restaurantId: z.string(),
      availableOnly: z.boolean().optional(),
    })
  )
  .query(({ input }) => {
    if (input.availableOnly) {
      return menuStore.getAvailableByRestaurant(input.restaurantId);
    }
    return menuStore.getByRestaurantId(input.restaurantId);
  });
