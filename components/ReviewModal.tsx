import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Star, X } from 'lucide-react-native';
import { useState } from 'react';
import { UserReview } from '@/types/user';
import { StarRating } from '@/components/StarRating';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReviewModalProps {
  visible: boolean;
  review: UserReview | any | null;
  onClose: () => void;
  colors: any;
}

export default function ReviewModal({ visible, review, onClose, colors }: ReviewModalProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const { user } = useUser();
  const { t } = useLanguage();

  if (!review) return null;

  console.log('ReviewModal review data:', JSON.stringify(review, null, 2));

  const isCurrentUserReview = user && review.userId === user.id;
  const displayName = isCurrentUserReview ? 'You' : (review.userName || review.author || 'Anonymous');
  const avatarLetter = isCurrentUserReview ? 'You' : (displayName.charAt(0));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Review Details</Text>
            <TouchableOpacity
              onPress={() => {
                onClose();
                setPhotoIndex(0);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalScroll} 
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.modalReviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAuthor}>
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>
                      {avatarLetter}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.authorName, { color: colors.text }]}>
                      {displayName}
                    </Text>
                    <Text style={[styles.reviewDate, { color: colors.textTertiary }]}>
                      {new Date(review.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
                <View style={[styles.reviewRating, { backgroundColor: colors.starBg }]}>
                  <Star size={14} fill="#FFB800" color="#FFB800" />
                  <Text style={[styles.reviewRatingText, { color: colors.text }]}>
                    {review.rating}
                  </Text>
                </View>
              </View>

              {review.detailedRatings && (
                <View style={styles.categoryRatingsSection}>
                  <Text style={[styles.categoryRatingsTitle, { color: colors.text }]}>Category Ratings</Text>
                  <View style={styles.categoryRatingsList}>
                    {Object.entries(review.detailedRatings).map(([category, rating]: [string, any]) => {
                      const getCategoryLabel = (cat: string) => {
                        switch(cat) {
                          case 'food': return t.reviewCategories.food;
                          case 'service': return t.reviewCategories.service;
                          case 'ambience': return t.reviewCategories.ambience;
                          case 'value': return t.reviewCategories.value;
                          case 'cleanliness': return t.reviewCategories.cleanliness;
                          default: return cat.charAt(0).toUpperCase() + cat.slice(1);
                        }
                      };
                      return (
                      <View key={category} style={styles.categoryRatingRow}>
                        <Text style={[styles.categoryName, { color: colors.textSecondary }]}>
                          {getCategoryLabel(category)}
                        </Text>
                        <View style={styles.categoryStars}>
                          <StarRating rating={Number(rating)} size={16} color="#FFB800" gap={4} />
                          <Text style={[styles.categoryRatingText, { color: colors.text }]}>{rating}</Text>
                        </View>
                      </View>
                    );}
                    )}
                  </View>
                </View>
              )}

              {review.comment && (
                <Text style={[styles.modalReviewComment, { color: colors.textSecondary }]}>
                  {review.comment}
                </Text>
              )}

              {review.photos && review.photos.length > 0 && (
                <View style={styles.modalPhotosSection}>
                  <Text style={[styles.modalPhotosTitle, { color: colors.text }]}>
                    Photos ({review.photos.length})
                  </Text>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={(event) => {
                      const scrollPosition = event.nativeEvent.contentOffset.x;
                      const index = Math.round(scrollPosition / (SCREEN_WIDTH - 80));
                      setPhotoIndex(index);
                    }}
                    scrollEventThrottle={16}
                    style={styles.modalPhotosScroll}
                  >
                    {review.photos.map((photo: string, index: number) => (
                      <Image
                        key={index}
                        source={{ uri: photo }}
                        style={styles.modalPhoto}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>

                  {review.photos.length > 1 && (
                    <View style={styles.modalPhotoPaginationContainer}>
                      {review.photos.map((_: any, index: number) => (
                        <View
                          key={index}
                          style={[
                            styles.modalPhotoPaginationDot,
                            { backgroundColor: colors.textTertiary },
                            photoIndex === index && {
                              backgroundColor: colors.primary,
                              width: 24,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  modalScroll: {
    maxHeight: '100%',
  },
  modalReviewCard: {
    padding: 20,
    minHeight: 100,
  },
  reviewHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  reviewAuthor: {
    flexDirection: 'row' as const,
    gap: 12,
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2D6A4F',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  reviewDate: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reviewRatingText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  modalReviewComment: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555',
    marginTop: 12,
  },
  modalPhotosSection: {
    marginTop: 20,
  },
  modalPhotosTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  modalPhotosScroll: {
    width: '100%',
  },
  modalPhoto: {
    width: SCREEN_WIDTH - 80,
    height: 300,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  modalPhotoPaginationContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginTop: 12,
  },
  modalPhotoPaginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  categoryRatingsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  categoryRatingsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  categoryRatingsList: {
    gap: 12,
  },
  categoryRatingRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  categoryName: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },
  categoryStars: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  categoryRatingText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginLeft: 4,
  },
});
