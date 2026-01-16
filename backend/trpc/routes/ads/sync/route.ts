import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { adStore } from '../store';

export const syncAdsProcedure = publicProcedure
  .input(z.array(z.any()))
  .mutation(async ({ input }) => {
    console.log('========================================');
    console.log('[Backend] Ads sync mutation called');
    console.log('[Backend] Timestamp:', new Date().toISOString());
    console.log('[Backend] Received ads count:', input.length);
    if (input.length > 0) {
      console.log('[Backend] Ad IDs:', input.map(a => a.id).join(', '));
      console.log('[Backend] First ad details:', {
        id: input[0].id,
        restaurantName: input[0].restaurantName,
        type: input[0].type,
        status: input[0].status,
        hasImageUrl: !!input[0].imageUrl,
        imageUrlLength: input[0].imageUrl?.length || 0,
        isBase64: input[0].imageUrl?.startsWith('data:image'),
      });
    }
    
    console.log('[Backend] Calling adStore.setAll()');
    adStore.setAll(input);
    
    console.log('[Backend] Calling adStore.getAll() to verify storage...');
    const currentAds = adStore.getAll();
    console.log('[Backend] Current store count after setAll:', currentAds.length);
    if (currentAds.length > 0) {
      console.log('[Backend] Store ad IDs:', currentAds.map(a => a.id).join(', '));
    }
    
    console.log('[Backend] Sync mutation complete');
    console.log('========================================');
    return { success: true, count: currentAds.length };
  });

export default syncAdsProcedure;
