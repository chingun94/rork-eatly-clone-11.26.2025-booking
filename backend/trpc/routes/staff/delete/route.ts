import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { staffStore } from '../store';
import { TRPCError } from '@trpc/server';

export default publicProcedure
  .input(
    z.object({
      id: z.string(),
    })
  )
  .mutation(({ input }) => {
    try {
      staffStore.delete(input.id);
      return { success: true };
    } catch (error) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: error instanceof Error ? error.message : 'Failed to delete staff member',
      });
    }
  });
