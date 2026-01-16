import { publicProcedure } from '../../../create-context';
import { menuStore } from '../store';
import { z } from 'zod';

export const toggleMenuItemAvailability = publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(({ input }) => {
    const item = menuStore.toggleAvailability(input.id);

    if (!item) {
      throw new Error('Menu item not found');
    }

    return item;
  });
