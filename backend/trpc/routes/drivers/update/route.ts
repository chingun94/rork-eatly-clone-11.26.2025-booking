import { publicProcedure } from '../../../create-context';
import { driverStore } from '../store';
import { z } from 'zod';

export const updateDriver = publicProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      phone: z.string().optional(),
      photo: z.string().optional(),
      vehicleType: z.string().optional(),
      vehicleNumber: z.string().optional(),
      available: z.boolean().optional(),
    })
  )
  .mutation(({ input }) => {
    const { id, ...updates } = input;
    const driver = driverStore.update(id, updates);

    if (!driver) {
      throw new Error('Driver not found');
    }

    return driver;
  });
