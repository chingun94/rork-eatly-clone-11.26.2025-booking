import { publicProcedure } from '../../../create-context';
import { menuStore } from '../store';
import { z } from 'zod';

export const getMenuCategories = publicProcedure
  .input(z.object({ restaurantId: z.string() }))
  .query(({ input }) => {
    return menuStore.getCategories(input.restaurantId);
  });
