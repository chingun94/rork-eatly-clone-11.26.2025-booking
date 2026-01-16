import { z } from 'zod';
import { adminProcedure } from '../../../create-context';
import { collection, getDocs } from 'firebase/firestore';
import { getDb } from '../../../../firebase-backend';

interface PushNotification {
  to: string;
  sound: string;
  title: string;
  body: string;
  data?: any;
}

async function sendPushNotification(notification: PushNotification) {
  const message = {
    to: notification.to,
    sound: 'default',
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

export const sendNotificationProcedure = adminProcedure
  .input(
    z.object({
      title: z.string().min(1),
      body: z.string().min(1),
    })
  )
  .mutation(async ({ input }) => {
    try {
      console.log('sendNotificationProcedure: Fetching user push tokens...');
      
      const db = getDb();
      if (!db) {
        throw new Error('Firebase app not initialized');
      }
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);

      const pushTokens: string[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.pushToken) {
          pushTokens.push(data.pushToken);
        }
      });

      console.log(`sendNotificationProcedure: Found ${pushTokens.length} push tokens`);

      if (pushTokens.length === 0) {
        return {
          success: true,
          sentCount: 0,
          message: 'No users with push tokens found',
        };
      }

      const results = await Promise.allSettled(
        pushTokens.map((token) =>
          sendPushNotification({
            to: token,
            sound: 'default',
            title: input.title,
            body: input.body,
          })
        )
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      console.log(
        `sendNotificationProcedure: Sent ${successCount} notifications, ${failedCount} failed`
      );

      return {
        success: true,
        sentCount: successCount,
        failedCount,
        totalUsers: pushTokens.length,
      };
    } catch (error: any) {
      console.error('sendNotificationProcedure: Error:', error);
      throw new Error(`Failed to send notifications: ${error.message}`);
    }
  });
