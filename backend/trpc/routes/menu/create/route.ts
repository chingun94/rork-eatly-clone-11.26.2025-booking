import { publicProcedure } from '../../../create-context';
import { menuStore } from '../store';
import { z } from 'zod';
import { MenuItem } from '@/types/delivery';

const customizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  options: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
    })
  ),
  required: z.boolean(),
  multiSelect: z.boolean(),
});

export const createMenuItem = publicProcedure
  .input(
    z.object({
      restaurantId: z.string(),
      name: z.string(),
      description: z.string(),
      price: z.number(),
      image: z.string().optional(),
      category: z.string(),
      preparationTime: z.number(),
      customizations: z.array(customizationSchema).optional(),
      tags: z.array(z.string()).optional(),
    })
  )
  .mutation(({ input }) => {
    const itemId = `MENU${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const menuItem: MenuItem = {
      id: itemId,
      restaurantId: input.restaurantId,
      name: input.name,
      description: input.description,
      price: input.price,
      image: input.image,
      category: input.category,
      available: true,
      preparationTime: input.preparationTime,
      customizations: input.customizations,
      tags: input.tags,
      createdAt: now,
      updatedAt: now,
    };

    return menuStore.create(menuItem);
  });
