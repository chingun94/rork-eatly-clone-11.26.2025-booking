import { publicProcedure } from '../../../create-context';
import { orderStore } from '../store';
import { z } from 'zod';
import { Order, OrderItem } from '@/types/delivery';

const orderItemSchema = z.object({
  menuItemId: z.string(),
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
  customizations: z
    .array(
      z.object({
        customizationId: z.string(),
        customizationName: z.string(),
        selectedOptions: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            price: z.number(),
          })
        ),
      })
    )
    .optional(),
  specialInstructions: z.string().optional(),
  subtotal: z.number(),
});

export const createOrder = publicProcedure
  .input(
    z.object({
      userId: z.string(),
      restaurantId: z.string(),
      restaurantName: z.string(),
      restaurantAddress: z.string(),
      items: z.array(orderItemSchema),
      subtotal: z.number(),
      deliveryFee: z.number(),
      tax: z.number(),
      tip: z.number(),
      total: z.number(),
      deliveryAddress: z.object({
        id: z.string(),
        userId: z.string(),
        label: z.string(),
        street: z.string(),
        apartment: z.string().optional(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        instructions: z.string().optional(),
        isDefault: z.boolean(),
      }),
      contactPhone: z.string(),
      orderNotes: z.string().optional(),
      estimatedPreparationTime: z.number(),
      estimatedDeliveryTime: z.number(),
    })
  )
  .mutation(({ input }) => {
    const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const orderNumber = `#${Math.floor(1000 + Math.random() * 9000)}`;
    const now = Date.now();

    const order: Order = {
      id: orderId,
      orderNumber,
      userId: input.userId,
      restaurantId: input.restaurantId,
      restaurantName: input.restaurantName,
      restaurantAddress: input.restaurantAddress,
      items: input.items as OrderItem[],
      subtotal: input.subtotal,
      deliveryFee: input.deliveryFee,
      tax: input.tax,
      tip: input.tip,
      total: input.total,
      status: 'pending',
      paymentStatus: 'paid',
      deliveryAddress: input.deliveryAddress,
      contactPhone: input.contactPhone,
      orderNotes: input.orderNotes,
      estimatedPreparationTime: input.estimatedPreparationTime,
      estimatedDeliveryTime: input.estimatedDeliveryTime,
      createdAt: now,
      updatedAt: now,
    };

    return orderStore.create(order);
  });
