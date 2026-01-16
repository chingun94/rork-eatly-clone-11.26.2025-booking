import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Star, MapPin, Bookmark, Zap, Clock } from 'lucide-react-native';
import { Restaurant } from '@/types/restaurant';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { useState, useRef, memo, useCallback, useEffect } from 'react';
import { isRestaurantOpen } from '@/utils/isRestaurantOpen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 32;
const IMAGE_WIDTH = SCREEN_WIDTH - CARD_PADDING;

interface RestaurantCardProps {
  restaurant: Restaurant;
  distance?: number;
  showDistance?: boolean;
  isFirstCard?: boolean;
  isScrolled?: boolean;
  compact?: boolean;
  showDiscount?: boolean;
}

export const RestaurantCard = memo(function RestaurantCard({ restaurant, distance, showDistance, isFirstCard = false, isScrolled = false, compact = false, showDiscount = false }: RestaurantCardProps) {
  const router = useRouter();
  const { isRestaurantSaved, toggleSaveRestaurant, isAuthenticated } = useUser();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { getFranchiseBranches } = useRestaurants();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    console.log('RestaurantCard: Rating updated for', restaurant.name, ':', restaurant.rating, 'reviews:', restaurant.reviewCount);
  }, [restaurant.rating, restaurant.reviewCount, restaurant.name]);

  const isSaved = isRestaurantSaved(restaurant.id);
  const priceSymbol = '₮'.repeat(restaurant.priceLevel);
  const branches = restaurant.isFranchiseParent ? getFranchiseBranches(restaurant.id) : [];
  const isOpen = isRestaurantOpen(restaurant.hours);
  
  const images = restaurant.images && restaurant.images.length > 0 
    ? restaurant.images.filter(img => img && img.trim() !== '') 
    : [];
  
  const displayImages = images.length > 0 ? images : (restaurant.image && restaurant.image.trim() !== '' ? [restaurant.image] : []);

  const handleCardPress = useCallback(() => {
    if (!isAuthenticated) {
      console.log('RestaurantCard: User not authenticated, redirecting to auth');
      router.push('/auth' as any);
    } else {
      router.push(`/(tabs)/(home)/restaurant/${restaurant.id}` as any);
    }
  }, [isAuthenticated, restaurant.id, router]);

  const handleSave = useCallback((e: any) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      console.log('RestaurantCard: User not authenticated for save, redirecting to auth');
      router.push('/auth' as any);
      return;
    }
    toggleSaveRestaurant(restaurant.id);
  }, [restaurant.id, toggleSaveRestaurant, isAuthenticated, router]);

  const handleScroll = useCallback((event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / IMAGE_WIDTH);
    setCurrentImageIndex(index);
  }, []);

  return (
    <TouchableOpacity
      style={[
        compact ? styles.cardCompact : styles.card, 
        { backgroundColor: colors.card },
        isFirstCard && isScrolled && styles.cardFirstScrolled
      ]}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      <View style={compact ? styles.imageContainerCompact : styles.imageContainer}>
        {displayImages.length > 0 ? (
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={compact ? styles.imageScrollViewCompact : styles.imageScrollView}
          >
            {displayImages.map((imageUrl, index) => (
              <Image
                key={`${restaurant.id}-${index}`}
                source={{ uri: imageUrl }}
                style={compact ? styles.imageCompact : styles.image}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={`${restaurant.id}-${index}`}
                transition={200}
                priority="high"
                onError={(error) => {
                  console.error('RestaurantCard: Image load error for', restaurant.name, 'index', index, ':', error);
                }}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={compact ? styles.imagePlaceholderCompact : styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>No Image</Text>
          </View>
        )}
        
        {!compact && displayImages.length > 1 && (
          <View style={styles.paginationContainer}>
            {displayImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  currentImageIndex === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        )}
        
        {restaurant.isFeatured && (
          <View style={styles.featuredBadge}>
            <Zap size={14} color="#FFF" fill="#FFF" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        {showDiscount && restaurant.discountAmount && (
          <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.discountText}>{restaurant.discountAmount}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Bookmark
            size={20}
            color={isSaved ? colors.primary : '#fff'}
            fill={isSaved ? colors.primary : 'transparent'}
          />
        </TouchableOpacity>
      </View>
      
      <View style={compact ? styles.contentCompact : styles.content}>
        <View style={styles.header}>
          <Text style={[compact ? styles.nameCompact : styles.name, { color: colors.text }]} numberOfLines={1}>
            {restaurant.name}
          </Text>
          {!compact && (
            <View style={styles.headerRight}>
              <View style={[styles.openStatusContainer, isOpen ? styles.openBg : styles.closedBg]}>
                <Clock size={12} color={isOpen ? '#10B981' : '#EF4444'} />
                <Text style={[styles.openStatusText, isOpen ? styles.openText : styles.closedText]}>
                  {isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
              <View style={[styles.ratingContainer, { backgroundColor: colors.starBg }]}>
                <Star size={16} fill="#FFB800" color="#FFB800" />
                <Text style={[styles.rating, { color: colors.text }]}>{restaurant.rating}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.details}>
          <Text style={[compact ? styles.cuisineCompact : styles.cuisine, { color: colors.textSecondary }]} numberOfLines={1}>
            {Array.isArray(restaurant.cuisine)
              ? restaurant.cuisine.map(c => t.cuisineTypes[c] || c).join(', ')
              : (t.cuisineTypes[restaurant.cuisine] || restaurant.cuisine)}
          </Text>
          {!compact && (
            <>
              <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
              <Text style={[styles.price, { color: colors.textSecondary }]}>{priceSymbol}</Text>
              <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
              <Text style={[styles.serviceStyle, { color: colors.textSecondary }]}>{t.serviceTypes[restaurant.serviceStyle] || restaurant.serviceStyle}</Text>
            </>
          )}
        </View>

        {compact && (
          <View style={styles.ratingRowCompact}>
            <Star size={14} fill="#FFB800" color="#FFB800" />
            <Text style={[styles.ratingCompact, { color: colors.text }]}>{restaurant.rating}</Text>
          </View>
        )}

        {!compact && (
          <>
            <View style={styles.ambianceContainer}>
              {restaurant.ambiance.slice(0, 2).map((amb, index) => (
                <View key={index} style={[styles.ambianceTag, { backgroundColor: colors.tag }]}>
                  <Text style={[styles.ambianceText, { color: colors.tagText }]}>{t.ambianceTypes[amb] || amb}</Text>
                </View>
              ))}
              {restaurant.ambiance.length > 2 && (
                <Text style={[styles.moreText, { color: colors.textTertiary }]}>+{restaurant.ambiance.length - 2}</Text>
              )}
            </View>
          </>
        )}

        {!compact && <View style={styles.footer}>
          <MapPin size={14} color={colors.textSecondary} />
          <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>
            {restaurant.address}
          </Text>
          {showDistance && distance !== undefined && (
            <View style={[styles.distanceBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.distanceText, { color: colors.primary }]}>
                {distance.toFixed(1)} km
              </Text>
            </View>
          )}
        </View>}

        {!compact && branches.length > 0 && (
          <View style={styles.branchesSection}>
            <View style={[styles.branchesDivider, { backgroundColor: colors.border }]} />
            <View style={styles.branchesHeader}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={[styles.branchesTitle, { color: colors.textSecondary }]}>
                {branches.length} {t.explore.locations}
              </Text>
            </View>
            <View style={styles.branchesList}>
              {branches.slice(0, 2).map((branch) => (
                <TouchableOpacity
                  key={branch.id}
                  style={[styles.branchItem, { backgroundColor: colors.primaryLight }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (!isAuthenticated) {
                      router.push('/auth' as any);
                    } else {
                      router.push(`/(tabs)/(home)/restaurant/${branch.id}` as any);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.branchText, { color: colors.primary }]} numberOfLines={1}>
                    {branch.location.neighborhood || branch.location.city}
                  </Text>
                </TouchableOpacity>
              ))}
              {branches.length > 2 && (
                <View style={[styles.moreBranches, { backgroundColor: colors.tag }]}>
                  <Text style={[styles.moreBranchesText, { color: colors.textSecondary }]}>
                    +{branches.length - 2} more
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  cardCompact: {
    borderRadius: 12,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
    width: 200,
  },
  cardFirstScrolled: {
    marginTop: 0,
  },
  imageContainer: {
    position: 'relative' as const,
  },
  imageContainerCompact: {
    position: 'relative' as const,
    width: 200,
    height: 140,
  },
  imageScrollView: {
    width: '100%',
    height: 220,
  },
  imageScrollViewCompact: {
    width: 200,
    height: 140,
  },
  image: {
    width: IMAGE_WIDTH,
    height: 220,
    backgroundColor: '#f0f0f0',
  },
  imageCompact: {
    width: 200,
    height: 140,
    backgroundColor: '#f0f0f0',
  },
  paginationContainer: {
    position: 'absolute' as const,
    bottom: 4,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  paginationDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 12,
  },
  featuredBadge: {
    position: 'absolute' as const,
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  discountBadge: {
    position: 'absolute' as const,
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  discountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800' as const,
  },
  saveButton: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 16,
  },
  contentCompact: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  openStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  openBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  closedBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  openStatusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  openText: {
    color: '#059669',
  },
  closedText: {
    color: '#DC2626',
  },
  name: {
    fontSize: 20,
    fontWeight: '700' as const,
    flex: 1,
    marginRight: 12,
  },
  nameCompact: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cuisine: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  cuisineCompact: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  serviceStyle: {
    fontSize: 14,
  },
  ambianceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  ambianceTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  ambianceText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  moreText: {
    fontSize: 12,
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  address: {
    fontSize: 13,
    flex: 1,
  },
  distanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  imagePlaceholder: {
    width: IMAGE_WIDTH,
    height: 220,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderCompact: {
    width: 200,
    height: 140,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#999',
  },
  branchesSection: {
    marginTop: 12,
    paddingTop: 12,
  },
  branchesDivider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginBottom: 8,
  },
  branchesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  branchesTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  branchesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  branchItem: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    flex: 0,
    maxWidth: '48%',
  },
  branchText: {
    fontSize: 12,
    fontWeight: '500' as const,
    flex: 1,
  },
  moreBranches: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: 'center',
  },
  moreBranchesText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  ratingRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingCompact: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
});
