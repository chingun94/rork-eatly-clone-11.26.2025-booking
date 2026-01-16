import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { staffStore } from '../store';
import { TRPCError } from '@trpc/server';

export default publicProcedure
  .input(
    z.object({
      id: z.string(),
      email: z.string().email().optional(),
      name: z.string().optional(),
      role: z.enum(['owner', 'general_manager', 'assistant_manager', 'host', 'event_manager']).optional(),
      phone: z.string().optional(),
      isActive: z.boolean().optional(),
      password: z.string().min(6).optional(),
    })
  )
  .mutation(({ input }) => {
    try {
      const staff = staffStore.update(input);
      
      return {
        ...staff,
        password: undefined,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: error instanceof Error ? error.message : 'Failed to update staff member',
      });
    }
  });
