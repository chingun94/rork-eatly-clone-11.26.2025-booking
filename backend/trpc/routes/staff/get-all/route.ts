import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { staffStore } from '../store';

export default publicProcedure
  .input(
    z.object({
      restaurantId: z.string().optional(),
      role: z.enum(['owner', 'general_manager', 'assistant_manager', 'host', 'event_manager']).optional(),
      isActive: z.boolean().optional(),
    }).optional()
  )
  .query(({ input }) => {
    const staff = staffStore.getAll(input);
    
    return staff.map(s => ({
      ...s,
      password: undefined,
    }));
  });
