import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { createFloorPlan } from '../store';

const tableSchema = z.object({
  id: z.string(),
  name: z.string(),
  capacity: z.number(),
  shape: z.enum(['square', 'rectangle', 'circle', 'round']),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().optional(),
  isActive: z.boolean(),
});

const elementSchema = z.object({
  id: z.string(),
  type: z.enum(['wall', 'entrance', 'bar', 'kitchen', 'restroom', 'decoration']),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().optional(),
  label: z.string().optional(),
});

export default publicProcedure
  .input(
    z.object({
      restaurantId: z.string(),
      name: z.string(),
      width: z.number(),
      height: z.number(),
      tables: z.array(tableSchema),
      elements: z.array(elementSchema),
    })
  )
  .mutation(({ input }) => {
    return createFloorPlan(input);
  });
