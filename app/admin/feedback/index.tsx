import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { mockFeedback } from '@/mocks/admin-data';
import { Feedback } from '@/types/admin';

export default function FeedbackManagement() {
  const [feedback, setFeedback] = useState<Feedback[]>(mockFeedback);

  const handleResolve = (item: Feedback) => {
    setFeedback((prev) =>
      prev.map((f) =>
        f.id === item.id
          ? {
              ...f,
              status: 'resolved' as const,
              resolvedAt: new Date().toISOString(),
              resolvedBy: 'admin_1',
            }
          : f
      )
    );
    Alert.alert('Success', 'Feedback marked as resolved');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={feedback}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.badges}>
                <View style={[styles.typeBadge, { backgroundColor: item.type === 'bug' ? '#EF444420' : '#3B82F620' }]}>
                  <Text style={[styles.badgeText, { color: item.type === 'bug' ? '#EF4444' : '#3B82F6' }]}>
                    {item.type.replace('_', ' ')}
                  </Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: item.priority === 'high' ? '#F59E0B20' : '#99999920' }]}>
                  <Text style={[styles.badgeText, { color: item.priority === 'high' ? '#F59E0B' : '#999' }]}>
                    {item.priority}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'resolved' ? '#10B98120' : '#F59E0B20' }]}>
                <Text style={[styles.statusText, { color: item.status === 'resolved' ? '#10B981' : '#F59E0B' }]}>
                  {item.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <Text style={styles.subject}>{item.subject}</Text>
            <Text style={styles.message} numberOfLines={3}>
              {item.message}
            </Text>
            <Text style={styles.user}>
              From {item.userName} • {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            {item.status !== 'resolved' && (
              <TouchableOpacity
                style={styles.resolveButton}
                onPress={() => handleResolve(item)}
              >
                <CheckCircle size={16} color="#10B981" />
                <Text style={styles.resolveText}>Mark as Resolved</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  list: { padding: 16 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  header: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const, marginBottom: 12 },
  badges: { flexDirection: 'row' as const, gap: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' as const, textTransform: 'capitalize' as const },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' as const, textTransform: 'capitalize' as const },
  subject: { fontSize: 16, fontWeight: '600' as const, color: '#fff', marginBottom: 8 },
  message: { fontSize: 14, color: '#ccc', marginBottom: 8, lineHeight: 20 },
  user: { fontSize: 13, color: '#666', marginBottom: 12 },
  resolveButton: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6, backgroundColor: '#10B98110', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#10B98140' },
  resolveText: { fontSize: 14, fontWeight: '600' as const, color: '#10B981' },
});
