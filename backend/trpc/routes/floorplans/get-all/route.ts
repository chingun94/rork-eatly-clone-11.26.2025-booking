import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { getAllFloorPlans } from '../store';

export default publicProcedure
  .input(
    z.object({
      restaurantId: z.string(),
    })
  )
  .query(({ input }) => {
    return getAllFloorPlans(input.restaurantId);
  });
