import { View, Text, StyleSheet, FlatList } from 'react-native';
import { FileText } from 'lucide-react-native';
import { mockCMSContent } from '@/mocks/admin-data';

export default function CMSManagement() {
  return (
    <View style={styles.container}>
      <FlatList
        data={mockCMSContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <FileText size={20} color="#14B8A6" />
              <View style={styles.info}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.type}>{item.type.replace('_', ' ')}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: item.published ? '#10B98120' : '#99999920' }]}>
                <Text style={[styles.badgeText, { color: item.published ? '#10B981' : '#999' }]}>
                  {item.published ? 'Published' : 'Draft'}
                </Text>
              </View>
            </View>
            <Text style={styles.content} numberOfLines={2}>
              {item.content}
            </Text>
            <Text style={styles.meta}>
              By {item.author} • {new Date(item.updatedAt).toLocaleDateString()}
            </Text>
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
  header: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 12, marginBottom: 12 },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600' as const, color: '#fff', marginBottom: 4 },
  type: { fontSize: 13, color: '#999', textTransform: 'capitalize' as const },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' as const },
  content: { fontSize: 14, color: '#ccc', marginBottom: 8, lineHeight: 20 },
  meta: { fontSize: 12, color: '#666' },
});
