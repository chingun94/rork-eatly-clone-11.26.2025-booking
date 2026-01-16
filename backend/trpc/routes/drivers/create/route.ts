import { publicProcedure } from '../../../create-context';
import { driverStore } from '../store';
import { z } from 'zod';
import { Driver } from '@/types/delivery';

export const createDriver = publicProcedure
  .input(
    z.object({
      name: z.string(),
      phone: z.string(),
      photo: z.string().optional(),
      vehicleType: z.string(),
      vehicleNumber: z.string(),
    })
  )
  .mutation(({ input }) => {
    const driverId = `DRV${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    const driver: Driver = {
      id: driverId,
      name: input.name,
      phone: input.phone,
      photo: input.photo,
      vehicleType: input.vehicleType,
      vehicleNumber: input.vehicleNumber,
      rating: 5.0,
      totalDeliveries: 0,
      available: true,
    };

    return driverStore.create(driver);
  });
