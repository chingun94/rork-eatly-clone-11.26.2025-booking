import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Star } from 'lucide-react-native';
import ReviewModal from '@/components/ReviewModal';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { useState, useMemo, useRef } from 'react';

type SortOption = 'all' | '5' | '4' | '3' | '2' | '1';

export default function RestaurantReviewsScreen() {
  const { restaurantId, restaurantName } = useLocalSearchParams<{ restaurantId: string; restaurantName: string }>();
  const { getReviewsForRestaurant, user } = useUser();
  const { colors } = useTheme();
  const { restaurants } = useRestaurants();
  const restaurant = restaurants.find((r) => r.id === restaurantId);
  const [sortBy, setSortBy] = useState<SortOption>('all');
  const [selectedReview, setSelectedReview] = useState<any>(null);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const filterHeight = useRef(new Animated.Value(1)).current;
  
  const userReviews = getReviewsForRestaurant(restaurantId!);

  const allReviews = useMemo(() => {
    if (!restaurant) return [];
    return [...userReviews, ...restaurant.reviews];
  }, [restaurant, userReviews]);
  
  const filteredReviews = useMemo(() => {
    if (sortBy === 'all') {
      return allReviews;
    }
    const targetRating = parseInt(sortBy);
    return allReviews.filter((review) => review.rating === targetRating);
  }, [sortBy, allReviews]);

  if (!restaurant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Restaurant not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Reviews',
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
        }}
      />
      <Animated.ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false,
            listener: (event: any) => {
              const currentScrollY = event.nativeEvent.contentOffset.y;
              const diff = currentScrollY - lastScrollY.current;
              
              if (diff > 10 && currentScrollY > 50) {
                Animated.timing(filterHeight, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: false,
                }).start();
              } else if (diff < -10 || currentScrollY < 50) {
                Animated.timing(filterHeight, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: false,
                }).start();
              }
              
              lastScrollY.current = currentScrollY;
            },
          }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.header}>
          <Text style={[styles.restaurantName, { color: colors.text }]}>{restaurantName}</Text>
          <View style={[styles.ratingContainer, { backgroundColor: colors.card }]}>
            <Star size={20} fill="#FFB800" color="#FFB800" />
            <Text style={[styles.ratingText, { color: colors.text }]}>{restaurant.rating}</Text>
            <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
              ({allReviews.length} reviews)
            </Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.filterContainer,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
              maxHeight: filterHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200],
              }),
              opacity: filterHeight,
              overflow: 'hidden' as const,
            },
          ]}
        >
          <Text style={[styles.filterLabel, { color: colors.text }]}>Filter by stars:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterOptions}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                { backgroundColor: colors.tag },
                sortBy === 'all' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSortBy('all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: colors.textSecondary },
                  sortBy === 'all' && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {['5', '4', '3', '2', '1'].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.tag },
                  sortBy === rating && { backgroundColor: colors.primary },
                ]}
                onPress={() => setSortBy(rating as SortOption)}
              >
                <Star size={14} fill={sortBy === rating ? '#fff' : '#FFB800'} color={sortBy === rating ? '#fff' : '#FFB800'} />
                <Text
                  style={[
                    styles.filterChipText,
                    { color: colors.textSecondary },
                    sortBy === rating && styles.filterChipTextActive,
                  ]}
                >
                  {rating}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        <View style={styles.reviewsList}>
          {filteredReviews.map((review) => {
            const isCurrentUserReview = user && 'userId' in review && review.userId === user.id;
            const displayName = isCurrentUserReview ? 'You' : ('userName' in review ? review.userName : 'author' in review ? review.author : 'Anonymous');
            const avatarLetter = isCurrentUserReview ? 'Y' : (displayName ? displayName.charAt(0) : 'A');
            
            return (
              <TouchableOpacity 
                key={review.id} 
                style={[styles.reviewCard, isCurrentUserReview && styles.userReviewCard, { backgroundColor: colors.card, borderColor: isCurrentUserReview ? colors.primary : 'transparent', shadowColor: colors.shadow }]}
                onPress={() => setSelectedReview(review)}
                activeOpacity={0.7}
              >
                {isCurrentUserReview && (
                  <View style={[styles.userReviewBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.userReviewBadgeText}>Your Review</Text>
                  </View>
                )}
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAuthor}>
                    <View style={[styles.avatarPlaceholder, isCurrentUserReview && styles.userAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={styles.avatarText}>{avatarLetter}</Text>
                    </View>
                    <View>
                      <Text style={[styles.authorName, { color: colors.text }]}>{displayName}</Text>
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
                    <Text style={[styles.reviewRatingText, { color: colors.text }]}>{review.rating}</Text>
                  </View>
                </View>
                {review.detailedRatings && (
                  <View style={styles.categoryRatingsPreview}>
                    {Object.entries(review.detailedRatings).slice(0, 3).map(([category, rating]: [string, any]) => (
                      <View key={category} style={styles.categoryRatingItem}>
                        <Text style={[styles.categoryLabel, { color: colors.textTertiary }]}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                        <View style={styles.categoryStarsSmall}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              color="#FFB800"
                              fill={star <= rating ? '#FFB800' : 'transparent'}
                              strokeWidth={1.5}
                            />
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={[styles.reviewComment, { color: colors.textSecondary }]} numberOfLines={3}>{review.comment}</Text>
                {review.photos && review.photos.length > 0 && (
                  <View style={styles.photoBadgeContainer}>
                    <View style={[styles.photoBadge, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.photoText, { color: colors.primary }]}>{review.photos.length} photo(s)</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.ScrollView>

      <ReviewModal
        visible={selectedReview !== null}
        review={selectedReview}
        onClose={() => setSelectedReview(null)}
        colors={colors}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    padding: 20,
    gap: 12,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  reviewCount: {
    fontSize: 15,
    color: '#666',
  },
  reviewsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userReviewCard: {
    borderWidth: 2,
    borderColor: '#2D6A4F',
  },
  userReviewBadge: {
    position: 'absolute' as const,
    top: -10,
    right: 12,
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  userReviewBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
  },
  userAvatar: {
    backgroundColor: '#2D6A4F',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewAuthor: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2D6A4F',
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  filterOptions: {
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  photoBadgeContainer: {
    marginTop: 8,
  },
  photoBadge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: '#E8F5F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  photoText: {
    fontSize: 12,
    color: '#2D6A4F',
    fontWeight: '600' as const,
  },
  categoryRatingsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  categoryRatingItem: {
    flexDirection: 'column',
    gap: 4,
  },
  categoryLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500' as const,
  },
  categoryStarsSmall: {
    flexDirection: 'row',
    gap: 2,
  },
});
