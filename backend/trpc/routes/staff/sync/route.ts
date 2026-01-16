import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { staffStore } from '../store';

const staffSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  restaurantName: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(['owner', 'general_manager', 'assistant_manager', 'host', 'event_manager']),
  phone: z.string().optional(),
  password: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastLogin: z.string().optional(),
});

export default publicProcedure
  .input(z.object({
    staff: z.array(staffSchema),
  }))
  .mutation(({ input }) => {
    staffStore.setAll(input.staff);
    return { success: true, count: input.staff.length };
  });
