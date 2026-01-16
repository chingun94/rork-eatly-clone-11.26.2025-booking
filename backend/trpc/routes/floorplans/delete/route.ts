import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { deleteFloorPlan } from '../store';

export default publicProcedure
  .input(
    z.object({
      id: z.string(),
    })
  )
  .mutation(({ input }) => {
    const success = deleteFloorPlan(input.id);
    if (!success) {
      throw new Error('Floor plan not found');
    }
    return { success: true };
  });
