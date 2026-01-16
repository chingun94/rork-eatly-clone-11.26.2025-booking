import { publicProcedure } from '../../../create-context';
import { restaurantStore } from '../store';

export const getAllRestaurantsProcedure = publicProcedure.query(async () => {
  console.log('[Backend] getAllRestaurants query called');
  const restaurants = restaurantStore.getAll();
  console.log('[Backend] Returning restaurants count:', restaurants.length);
  console.log('[Backend] Restaurant IDs:', restaurants.map(r => r.id).join(', '));
  return restaurants;
});

export default getAllRestaurantsProcedure;
