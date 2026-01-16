import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { staffStore } from '../store';
import { TRPCError } from '@trpc/server';

export default publicProcedure
  .input(
    z.object({
      restaurantId: z.string(),
      restaurantName: z.string(),
      email: z.string().email(),
      name: z.string(),
      role: z.enum(['owner', 'general_manager', 'assistant_manager', 'host', 'event_manager']),
      phone: z.string().optional(),
      password: z.string().min(6),
    })
  )
  .mutation(({ input }) => {
    try {
      const staff = staffStore.create(input);
      
      return {
        ...staff,
        password: undefined,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: error instanceof Error ? error.message : 'Failed to create staff member',
      });
    }
  });
