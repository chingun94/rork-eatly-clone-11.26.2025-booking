import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { router } from 'expo-router';

export function useNotificationNavigation() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      console.log('Notification tapped:', data);

      if (data.type === 'restaurant') {
        router.push(`/(tabs)/(home)/restaurant/${data.restaurantId}`);
      } else if (data.type === 'review') {
        router.push(`/(tabs)/(home)/restaurant/${data.restaurantId}#reviews`);
      } else if (data.type === 'promotion') {
        router.push(`/(tabs)/explore`);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
