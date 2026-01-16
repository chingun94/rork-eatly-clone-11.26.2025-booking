import { publicProcedure } from '../../../create-context';
import { orderStore } from '../store';
import { z } from 'zod';

export const getOrder = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(({ input }) => {
    const order = orderStore.getById(input.id);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  });
