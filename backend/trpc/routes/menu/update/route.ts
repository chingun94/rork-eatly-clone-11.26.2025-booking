import { publicProcedure } from '../../../create-context';
import { menuStore } from '../store';
import { z } from 'zod';

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

export const updateMenuItem = publicProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      price: z.number().optional(),
      image: z.string().optional(),
      category: z.string().optional(),
      available: z.boolean().optional(),
      preparationTime: z.number().optional(),
      customizations: z.array(customizationSchema).optional(),
      tags: z.array(z.string()).optional(),
    })
  )
  .mutation(({ input }) => {
    const { id, ...updates } = input;
    const item = menuStore.update(id, updates);

    if (!item) {
      throw new Error('Menu item not found');
    }

    return item;
  });
