import { publicProcedure } from '../../../create-context';
import { driverStore } from '../store';
import { z } from 'zod';

export const updateDriverLocationRoute = publicProcedure
  .input(
    z.object({
      driverId: z.string(),
      latitude: z.number(),
      longitude: z.number(),
    })
  )
  .mutation(({ input }) => {
    const driver = driverStore.updateLocation(
      input.driverId,
      input.latitude,
      input.longitude
    );

    if (!driver) {
      throw new Error('Driver not found');
    }

    return driver;
  });
