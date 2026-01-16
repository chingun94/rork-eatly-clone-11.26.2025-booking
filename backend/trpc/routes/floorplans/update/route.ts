import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { updateFloorPlan } from '../store';

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
      id: z.string(),
      name: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      tables: z.array(tableSchema).optional(),
      elements: z.array(elementSchema).optional(),
    })
  )
  .mutation(({ input }) => {
    const { id, ...updates } = input;
    const updated = updateFloorPlan(id, updates);
    if (!updated) {
      throw new Error('Floor plan not found');
    }
    return updated;
  });
