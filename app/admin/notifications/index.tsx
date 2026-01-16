import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Bell, Send } from 'lucide-react-native';
import { mockNotifications } from '@/mocks/admin-data';
import { trpc } from '@/lib/trpc';

export default function NotificationsManagement() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const sendNotificationMutation = trpc.notifications.send.useMutation({
    onSuccess: (data) => {
      console.log('NotificationsManagement: Notification sent successfully', data);
      Alert.alert(
        'Success',
        `Notification sent to ${data.sentCount} users successfully!${(data.failedCount ?? 0) > 0 ? `\n${data.failedCount} failed to send.` : ''}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setTitle('');
              setBody('');
            },
          },
        ]
      );
    },
    onError: (error) => {
      console.error('NotificationsManagement: Error sending notification:', error);
      Alert.alert('Error', error.message || 'Failed to send notification. Please try again.');
    },
  });

  const handleSend = async () => {
    if (!title || !body) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    sendNotificationMutation.mutate({ title, body });
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.formTitle}>Send Push Notification</Text>
        <Text style={styles.formDescription}>
          Send real-time push notifications to all app users
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Notification Title"
          placeholderTextColor="#666"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Notification Body"
          placeholderTextColor="#666"
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity 
          style={[styles.button, sendNotificationMutation.isPending && styles.buttonDisabled]} 
          onPress={handleSend}
          disabled={sendNotificationMutation.isPending}
        >
          {sendNotificationMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Send size={20} color="#fff" />
          )}
          <Text style={styles.buttonText}>
            {sendNotificationMutation.isPending ? 'Sending...' : 'Send to All Users'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.historyTitle}>Notification History</Text>
      <FlatList
        data={mockNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Bell size={20} color="#F97316" />
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
            <Text style={styles.cardBody}>{item.body}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardStat}>{item.recipientCount} recipients</Text>
              {item.openRate && <Text style={styles.cardStat}>{item.openRate}% opened</Text>}
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'sent' ? '#10B98120' : '#F59E0B20' }]}>
                <Text style={[styles.statusText, { color: item.status === 'sent' ? '#10B981' : '#F59E0B' }]}>
                  {item.status}
                </Text>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  form: { padding: 16, gap: 12 },
  formTitle: { fontSize: 18, fontWeight: '600' as const, color: '#fff', marginBottom: 4 },
  formDescription: { fontSize: 14, color: '#999', marginBottom: 8 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff', borderWidth: 1, borderColor: '#333' },
  textArea: { height: 100, textAlignVertical: 'top' as const },
  button: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, backgroundColor: '#FF6B35', borderRadius: 12, padding: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '600' as const, color: '#fff' },
  historyTitle: { fontSize: 18, fontWeight: '600' as const, color: '#fff', paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  list: { padding: 16, paddingTop: 8 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600' as const, color: '#fff', flex: 1 },
  cardBody: { fontSize: 14, color: '#999', marginBottom: 12, lineHeight: 20 },
  cardFooter: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, flexWrap: 'wrap' as const },
  cardStat: { fontSize: 13, color: '#666' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' as const, textTransform: 'capitalize' as const },
});
