import { publicProcedure } from '../../../create-context';
import { menuStore } from '../store';
import { z } from 'zod';

export const deleteMenuItem = publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(({ input }) => {
    const deleted = menuStore.delete(input.id);

    if (!deleted) {
      throw new Error('Menu item not found');
    }

    return { success: true };
  });
