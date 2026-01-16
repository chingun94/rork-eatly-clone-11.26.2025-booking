import { publicProcedure } from '../../../create-context';
import { adStore } from '../store';

export const getAllAdsProcedure = publicProcedure.query(async () => {
  console.log('========================================');
  console.log('[Backend] getAllAds query called');
  console.log('[Backend] Timestamp:', new Date().toISOString());
  const ads = adStore.getAll();
  console.log('[Backend] Returning ads count:', ads.length);
  if (ads.length > 0) {
    console.log('[Backend] Ad IDs:', ads.map(a => a.id).join(', '));
    console.log('[Backend] First ad:', {
      id: ads[0].id,
      restaurantName: ads[0].restaurantName,
      type: ads[0].type,
      status: ads[0].status,
      hasImageUrl: !!ads[0].imageUrl,
      imageUrlLength: ads[0].imageUrl?.length || 0,
    });
  }
  console.log('========================================');
  return ads;
});

export default getAllAdsProcedure;
