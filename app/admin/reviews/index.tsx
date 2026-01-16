import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CheckCircle, XCircle, Flag, Star } from 'lucide-react-native';
import { getDb } from '@/config/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { ReviewWithMeta } from '@/types/admin';

export default function ReviewModeration() {
  const [reviews, setReviews] = useState<ReviewWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const setupReviewsListener = async () => {
      try {
        const dbInstance = getDb();
        if (!dbInstance) {
          console.log('Admin Reviews: Firestore not initialized');
          setIsLoading(false);
          return;
        }

        const q = query(collection(dbInstance, 'reviews'));

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (!mounted) return;

            console.log('Admin Reviews: Received reviews, count:', snapshot.docs.length);
            const data = snapshot.docs.map((doc) => {
              const docData = doc.data();
              return {
                id: doc.id,
                author: docData.userName || docData.userEmail || 'Anonymous',
                restaurantName: docData.restaurantName || 'Unknown Restaurant',
                rating: docData.rating || 0,
                comment: docData.comment || '',
                date: docData.date || new Date().toISOString(),
                photos: docData.photos || [],
                status: (docData.status || 'pending') as 'pending' | 'approved' | 'rejected',
                flagged: docData.flagged || false,
                flagReason: docData.flagReason,
                moderatedBy: docData.moderatedBy,
                moderatedAt: docData.moderatedAt,
              };
            }) as ReviewWithMeta[];

            setReviews(data);
            setIsLoading(false);
          },
          (err) => {
            if (!mounted) return;
            console.error('Admin Reviews: Error listening to reviews:', err);
            setIsLoading(false);
          }
        );
      } catch (err: any) {
        if (!mounted) return;
        console.error('Admin Reviews: Failed to setup reviews listener:', err);
        setIsLoading(false);
      }
    };

    setupReviewsListener();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };
  }, []);

  const handleApprove = (review: ReviewWithMeta) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === review.id
          ? {
              ...r,
              status: 'approved' as const,
              flagged: false,
              moderatedBy: 'admin_1',
              moderatedAt: new Date().toISOString(),
            }
          : r
      )
    );
    Alert.alert('Success', 'Review approved');
  };

  const handleReject = (review: ReviewWithMeta) => {
    Alert.alert('Reject Review', 'Are you sure you want to reject this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          setReviews((prev) => prev.filter((r) => r.id !== review.id));
        },
      },
    ]);
  };

  const handleFlag = (review: ReviewWithMeta) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === review.id
          ? {
              ...r,
              flagged: !r.flagged,
              flagReason: r.flagged ? undefined : 'Flagged for review',
            }
          : r
      )
    );
  };

  const renderReview = ({ item }: { item: ReviewWithMeta }) => (
    <View style={[styles.card, item.flagged && styles.flaggedCard]}>
      {item.flagged && (
        <View style={styles.flagBanner}>
          <Flag size={16} color="#EF4444" />
          <Text style={styles.flagText}>{item.flagReason}</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.author}>{item.author}</Text>
          <Text style={styles.restaurant}>{item.restaurantName}</Text>
          <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <Star size={20} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.rating}>{item.rating}</Text>
        </View>
      </View>

      <Text style={styles.comment}>{item.comment}</Text>

      {item.photos && item.photos.length > 0 && (
        <View style={styles.photoBadge}>
          <Text style={styles.photoText}>{item.photos.length} photo(s)</Text>
        </View>
      )}

      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'approved'
                  ? '#10B98120'
                  : item.status === 'pending'
                  ? '#F59E0B20'
                  : '#EF444420',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status === 'approved'
                    ? '#10B981'
                    : item.status === 'pending'
                    ? '#F59E0B'
                    : '#EF4444',
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {item.status === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(item)}
            >
              <CheckCircle size={16} color="#10B981" />
              <Text style={[styles.actionText, { color: '#10B981' }]}>
                Approve
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(item)}
            >
              <XCircle size={16} color="#EF4444" />
              <Text style={[styles.actionText, { color: '#EF4444' }]}>
                Reject
              </Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={[
            styles.actionButton,
            item.flagged ? styles.unflagButton : styles.flagButton,
          ]}
          onPress={() => handleFlag(item)}
        >
          <Flag
            size={16}
            color={item.flagged ? '#999' : '#F59E0B'}
            fill={item.flagged ? 'transparent' : '#F59E0B'}
          />
          <Text
            style={[
              styles.actionText,
              { color: item.flagged ? '#999' : '#F59E0B' },
            ]}
          >
            {item.flagged ? 'Unflag' : 'Flag'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>Loading reviews...</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No reviews found</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  flaggedCard: {
    borderColor: '#EF4444',
  },
  flagBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: '#EF444420',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  flagText: {
    fontSize: 13,
    color: '#EF4444',
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  info: {
    flex: 1,
  },
  author: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  restaurant: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  rating: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  comment: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 12,
  },
  photoBadge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: '#3B82F620',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  photoText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600' as const,
  },
  statusRow: {
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  approveButton: {
    backgroundColor: '#10B98110',
    borderColor: '#10B98140',
  },
  rejectButton: {
    backgroundColor: '#EF444410',
    borderColor: '#EF444440',
  },
  flagButton: {
    backgroundColor: '#F59E0B10',
    borderColor: '#F59E0B40',
  },
  unflagButton: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyText: {
    textAlign: 'center' as const,
    color: '#999',
    fontSize: 16,
    marginTop: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
});
