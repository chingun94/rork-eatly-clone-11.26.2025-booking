import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { getFloorPlan } from '../store';

export default publicProcedure
  .input(
    z.object({
      id: z.string(),
    })
  )
  .query(({ input }) => {
    const floorPlan = getFloorPlan(input.id);
    if (!floorPlan) {
      throw new Error('Floor plan not found');
    }
    return floorPlan;
  });
