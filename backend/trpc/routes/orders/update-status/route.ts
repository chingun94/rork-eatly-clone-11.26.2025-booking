import { publicProcedure } from '../../../create-context';
import { orderStore } from '../store';
import { z } from 'zod';

export const updateOrderStatus = publicProcedure
  .input(
    z.object({
      orderId: z.string(),
      status: z.enum([
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'picked_up',
        'in_transit',
        'delivered',
        'cancelled',
        'rejected',
      ]),
      rejectionReason: z.string().optional(),
      preparationTime: z.number().optional(),
    })
  )
  .mutation(({ input }) => {
    const updates: any = { status: input.status };

    if (input.rejectionReason) {
      updates.rejectionReason = input.rejectionReason;
    }

    if (input.preparationTime) {
      updates.estimatedPreparationTime = input.preparationTime;
    }

    const order = orderStore.updateStatus(input.orderId, input.status);

    if (!order) {
      throw new Error('Order not found');
    }

    if (input.rejectionReason || input.preparationTime) {
      return orderStore.update(input.orderId, updates);
    }

    return order;
  });
