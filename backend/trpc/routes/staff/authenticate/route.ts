import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { staffStore } from '../store';

export default publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  )
  .mutation(({ input }) => {
    const staff = staffStore.authenticate(input.email, input.password);
    
    if (!staff) {
      throw new Error('Invalid email or password');
    }
    
    return {
      ...staff,
      password: undefined,
    };
  });
