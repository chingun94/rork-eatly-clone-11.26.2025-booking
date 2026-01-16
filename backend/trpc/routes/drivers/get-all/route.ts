import { publicProcedure } from '../../../create-context';
import { driverStore } from '../store';
import { z } from 'zod';

export const getAllDrivers = publicProcedure
  .input(z.object({ availableOnly: z.boolean().optional() }))
  .query(({ input }) => {
    if (input.availableOnly) {
      return driverStore.getAvailable();
    }
    return driverStore.getAll();
  });
