# Quick Reference: Push Notifications

## Send a Notification (Admin)

```typescript
// Already implemented in app/admin/notifications/index.tsx
const sendNotificationMutation = trpc.notifications.send.useMutation({
  onSuccess: (data) => {
    console.log(`Sent to ${data.sentCount} users`);
  },
});

sendNotificationMutation.mutate({ 
  title: 'Hello!', 
  body: 'This is a test notification' 
});
```

## Send from Backend

```typescript
import { sendNotificationProcedure } from './backend/trpc/routes/notifications/send/route';

// This is already exposed via tRPC at:
// trpc.notifications.send.mutate({ title: '...', body: '...' })
```

## Check if User Has Notifications Enabled

```typescript
import { useUser } from '@/contexts/UserContext';

function MyComponent() {
  const { pushToken } = useUser();
  
  const hasNotifications = !!pushToken;
  
  return (
    <Text>
      {hasNotifications ? 'Notifications enabled ✓' : 'Notifications disabled ✗'}
    </Text>
  );
}
```

## Send Targeted Notifications

To send to specific users, modify `backend/trpc/routes/notifications/send/route.ts`:

```typescript
.input(
  z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    userIds: z.array(z.string()).optional(), // Add this
  })
)
.mutation(async ({ input }) => {
  // ... existing code ...
  
  // Filter tokens based on userIds if provided
  const filteredTokens = input.userIds
    ? snapshot.docs
        .filter(doc => input.userIds.includes(doc.data().id))
        .map(doc => doc.data().pushToken)
        .filter(Boolean)
    : pushTokens;
  
  // Send to filteredTokens instead of pushTokens
});
```

## Add Custom Data to Notifications

```typescript
// In backend/trpc/routes/notifications/send/route.ts
sendPushNotification({
  to: token,
  sound: 'default',
  title: input.title,
  body: input.body,
  data: {
    // Add custom data here
    type: 'restaurant_review',
    restaurantId: 'abc123',
    // ... any other data
  }
});
```

Then handle it in the app:

```typescript
// In contexts/UserContext.tsx
responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  
  if (data.type === 'restaurant_review') {
    // Navigate to restaurant details
    router.push(`/restaurant/${data.restaurantId}`);
  }
});
```

## Schedule Local Notifications

```typescript
import * as Notifications from 'expo-notifications';

async function scheduleNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "You've got mail! 📬",
      body: 'Check out the new restaurant nearby!',
    },
    trigger: {
      seconds: 60, // 1 minute from now
      repeats: false,
    },
  });
}
```

## Test Push Notifications

### Using Expo's Push Tool
1. Get your push token from the app (logged in console)
2. Go to https://expo.dev/notifications
3. Paste your token
4. Enter title and body
5. Click "Send a Notification"

### Using curl
```bash
curl -H "Content-Type: application/json" -X POST \
  -d '{
    "to": "ExponentPushToken[xxxxxx]",
    "sound": "default",
    "title": "Test",
    "body": "This is a test notification"
  }' \
  https://exp.host/--/api/v2/push/send
```

## Common Issues

### Token not saved
- User must be logged in
- Notification permissions must be granted
- Must be on physical device

### Notifications not received
- Check internet connection
- Verify token in Firestore
- Check device notification settings
- Ensure app has notification permissions

### Build fails
- Ensure `google-services.json` exists in project root
- Verify `app.json` configuration is correct
- Clear cache: `npx expo start -c`

## Best Practices

1. **Don't spam**: Limit notifications to important updates only
2. **Personalize**: Use user's name and relevant information
3. **Timing**: Consider time zones and user preferences
4. **Testing**: Always test on physical devices before production
5. **Fallbacks**: Handle notification failures gracefully
6. **Analytics**: Track send/delivery/open rates

## Notification Categories

Create categories for better organization:

```typescript
// For restaurant reviews
{
  title: "New Review",
  body: `${userName} left a review for ${restaurantName}`,
  data: { type: 'review', restaurantId }
}

// For promotions
{
  title: "Special Offer!",
  body: "50% off at your favorite restaurant",
  data: { type: 'promotion', restaurantId }
}

// For reminders
{
  title: "Don't forget!",
  body: "You have a reservation at 7 PM",
  data: { type: 'reminder', reservationId }
}
```

## Resources

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Console](https://console.firebase.google.com)
- [Expo Push Tool](https://expo.dev/notifications)
- [Push Notification Best Practices](https://documentation.onesignal.com/docs/sending-notifications)
