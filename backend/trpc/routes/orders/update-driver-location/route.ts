import { publicProcedure } from '../../../create-context';
import { orderStore } from '../store';
import { z } from 'zod';

export const updateDriverLocation = publicProcedure
  .input(
    z.object({
      orderId: z.string(),
      latitude: z.number(),
      longitude: z.number(),
    })
  )
  .mutation(({ input }) => {
    const order = orderStore.update(input.orderId, {
      driverLocation: {
        latitude: input.latitude,
        longitude: input.longitude,
        timestamp: Date.now(),
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  });
