import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Platform,
  Dimensions,
  Animated,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Star, MapPin, Phone, Clock, DollarSign, Bookmark, Edit3, Trees, ChevronLeft, ChevronRight, MapPinned, Calendar } from 'lucide-react-native';
import ReviewModal from '@/components/ReviewModal';
import { StarRating } from '@/components/StarRating';
import { useUser } from '@/contexts/UserContext';
import { RestaurantMapView } from '@/components/MapComponents';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { groupHours } from '@/utils/formatHours';
import { isRestaurantOpen } from '@/utils/isRestaurantOpen';
import { useState, useRef, useEffect } from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RestaurantDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isRestaurantSaved, toggleSaveRestaurant, getReviewsForRestaurant, isAuthenticated } = useUser();
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { restaurants, getFranchiseBranches } = useRestaurants();
  const restaurant = restaurants.find((r) => r.id === id);
  const branches = restaurant?.franchiseId ? getFranchiseBranches(restaurant.franchiseId) : [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const footerTranslateY = useRef(new Animated.Value(100)).current;
  const callButtonOpacity = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const imageScrollViewRef = useRef<FlatList>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  
  const isSaved = isAuthenticated ? isRestaurantSaved(id!) : false;
  const userReviews = isAuthenticated ? getReviewsForRestaurant(id!) : [];

  useEffect(() => {
    if (restaurant) {
      console.log('RestaurantDetail: Restaurant data updated:', restaurant.name, 'rating:', restaurant.rating, 'reviewCount:', restaurant.reviewCount);
    }
  }, [restaurant?.rating, restaurant?.reviewCount, restaurant?.name]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const images = restaurant ? (restaurant.images && restaurant.images.length > 0 
    ? restaurant.images.filter(img => img && img.trim() !== '') 
    : (restaurant.image && restaurant.image.trim() !== '' ? [restaurant.image] : [])) : [];

  if (!restaurant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Restaurant not found</Text>
      </View>
    );
  }

  const priceSymbol = '₮'.repeat(restaurant.priceLevel);
  const isOpen = isRestaurantOpen(restaurant.hours);

  const formattedHours = groupHours(restaurant.hours, t.dayNames);

  const handleCallPress = () => {
    const phoneNumber = restaurant.phone.replace(/[^0-9]/g, '');
    const phoneUrl = Platform.OS === 'ios' ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl).catch(() => {
      console.log('Could not open phone dialer');
    });
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const maxScroll = contentHeight - scrollViewHeight;
    const scrollThreshold = maxScroll - 150;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    Animated.timing(callButtonOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    scrollTimeoutRef.current = setTimeout(() => {
      Animated.timing(callButtonOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 150);

    if (offsetY > scrollThreshold && offsetY > 200) {
      Animated.spring(footerTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      Animated.spring(footerTranslateY, {
        toValue: 100,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: restaurant.name,
          headerTransparent: true,
          headerTintColor: '#fff',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => toggleSaveRestaurant(restaurant.id)}
              style={{ marginRight: 16 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Bookmark
                size={24}
                color="#fff"
                fill={isSaved ? '#fff' : 'transparent'}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Animated.ScrollView 
        ref={scrollViewRef}
        style={[styles.container, { backgroundColor: colors.background }]} 
        showsVerticalScrollIndicator={false}
        onLayout={(event) => {
          setScrollViewHeight(event.nativeEvent.layout.height);
        }}
        onContentSizeChange={(width, height) => {
          setContentHeight(height);
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
            listener: handleScroll,
          }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.heroContainer}>
          <FlatList
            ref={imageScrollViewRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const scrollPosition = event.nativeEvent.contentOffset.x;
              const index = Math.round(scrollPosition / SCREEN_WIDTH);
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
            keyExtractor={(item, index) => `${restaurant.id}-${index}`}
            renderItem={({ item: imageUrl, index }) => (
              <Image
                source={{ 
                  uri: imageUrl,
                  cache: 'force-cache',
                }}
                style={styles.heroImage}
                resizeMode="cover"
                onError={(error) => {
                  console.error('RestaurantDetail: Image load error for', restaurant.name, 'index', index, ':', error.nativeEvent?.error);
                }}
              />
            )}
            getItemLayout={(data, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
          />
          
          {images.length > 1 && (
            <>
              {currentImageIndex > 0 && (
                <TouchableOpacity
                  style={[styles.arrowButton, styles.arrowLeft]}
                  onPress={() => {
                    if (imageScrollViewRef.current) {
                      imageScrollViewRef.current.scrollToIndex({
                        index: currentImageIndex - 1,
                        animated: true,
                      });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={24} color="#fff" strokeWidth={3} />
                </TouchableOpacity>
              )}
              {currentImageIndex < images.length - 1 && (
                <TouchableOpacity
                  style={[styles.arrowButton, styles.arrowRight]}
                  onPress={() => {
                    if (imageScrollViewRef.current) {
                      imageScrollViewRef.current.scrollToIndex({
                        index: currentImageIndex + 1,
                        animated: true,
                      });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <ChevronRight size={24} color="#fff" strokeWidth={3} />
                </TouchableOpacity>
              )}
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1}/{images.length}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.mainInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]}>{restaurant.name}</Text>
              <View style={[styles.openStatusBadge, isOpen ? styles.openBg : styles.closedBg]}>
                <Clock size={14} color={isOpen ? '#10B981' : '#EF4444'} />
                <Text style={[styles.openStatusText, isOpen ? styles.openText : styles.closedText]}>
                  {isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
            </View>
            
            <View style={styles.metaRow}>
              <View style={[styles.ratingBadge, { backgroundColor: colors.starBg }]}>
                <Star size={16} fill="#FFB800" color="#FFB800" />
                <Text style={[styles.ratingText, { color: colors.text }]}>{restaurant.rating}</Text>
                <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
                  ({restaurant.reviewCount} reviews)
                </Text>
              </View>
              <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
              <Text style={[styles.priceText, { color: colors.textSecondary }]}>{priceSymbol}</Text>
            </View>

            <View style={styles.cuisineRow}>
              <Text style={[styles.cuisine, { color: colors.primary }]}>
                {restaurant.cuisine.map(c => t.cuisineTypes[c] || c).join(', ')}
              </Text>
              <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
              <Text style={[styles.serviceStyle, { color: colors.textSecondary }]}>{t.serviceTypes[restaurant.serviceStyle] || restaurant.serviceStyle}</Text>
            </View>

            <Text style={[styles.description, { color: colors.textSecondary }]}>{restaurant.description}</Text>
          </View>

          <View style={styles.ambianceSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.restaurant.vibes}</Text>
            <View style={styles.ambianceTags}>
              {restaurant.ambiance.map((amb, index) => (
                <View key={index} style={[styles.ambianceTag, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                  <Text style={[styles.ambianceText, { color: colors.primary }]}>{t.ambianceTypes[amb] || amb}</Text>
                </View>
              ))}
            </View>
          </View>

          {restaurant.hasDiscount && restaurant.discountAmount && (
            <View style={[styles.discountSection, { backgroundColor: colors.card, shadowColor: colors.shadow, borderColor: colors.primary }]}>
              <Text style={[styles.discountTitle, { color: colors.text }]}>
                {language === 'mn' ? 'Хөнгөлөлт' : 'Discount'}
              </Text>
              <View style={styles.discountContent}>
                <Text style={[styles.discountAmount, { color: colors.primary }]}>
                  {restaurant.discountAmount}
                </Text>
                {restaurant.discountDescription && (
                  <Text style={[styles.discountText, { color: colors.text }]}>
                    {' '}{restaurant.discountDescription}
                  </Text>
                )}
              </View>
              <View style={styles.discountDetails}>
                {restaurant.discountTimeline?.startDate && restaurant.discountTimeline?.endDate && (
                  <Text style={[styles.discountDetailText, { color: colors.textSecondary }]}>
                    • {language === 'mn' ? 'Дуусах хугацаа:' : 'Valid until'} {new Date(restaurant.discountTimeline.endDate).toLocaleDateString(language === 'mn' ? 'mn-MN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Text>
                )}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.bookingSection, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (!isAuthenticated) {
                router.push('/auth');
                return;
              }
              router.push({
                pathname: '/booking',
                params: {
                  restaurantId: restaurant.id,
                  restaurantName: restaurant.name,
                },
              } as any);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.bookingContent}>
              <Calendar size={24} color="#fff" />
              <View style={styles.bookingTextContainer}>
                <Text style={styles.bookingTitle}>
                  {language === 'mn' ? 'Ширээ захиалах' : 'Reserve a Table'}
                </Text>
                <Text style={styles.bookingSubtitle}>
                  {language === 'mn' ? 'Цагийн захиалга' : 'Book your table now'}
                </Text>
              </View>
            </View>
            <ChevronRight size={24} color="#fff" />
          </TouchableOpacity>

          <View style={[styles.infoSection, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Мэдээлэл</Text>
            
            <View style={styles.infoRow}>
              <MapPin size={18} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{restaurant.address}</Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoGridItem}>
                <Phone size={18} color={colors.primary} />
                <Text style={[styles.infoValueCompact, { color: colors.text }]}>{restaurant.phone}</Text>
              </View>
              
              <View style={styles.infoGridItem}>
                <DollarSign size={18} color={colors.primary} />
                <Text style={[styles.infoValueCompact, { color: colors.text }]}>{priceSymbol}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Clock size={18} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoValue, { color: colors.text }]}>{formattedHours}</Text>
              </View>
            </View>

            {restaurant.hasOutdoorTerrace !== undefined && (
              <View style={styles.infoRow}>
                <Trees size={18} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {restaurant.hasOutdoorTerrace ? 'Байгаа' : 'Байхгүй'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {branches.length > 0 && (
            <View style={[styles.branchesSection, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              <View style={styles.branchesSectionHeader}>
                <MapPinned size={24} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Салбарууд</Text>
              </View>
              <Text style={[styles.branchesCount, { color: colors.textSecondary }]}>
                {branches.length + 1} Бүртгэлтэй салбар
              </Text>
              <TouchableOpacity
                style={[styles.viewBranchesButton, { backgroundColor: colors.primary }]}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/(home)/restaurant/branches',
                    params: {
                      franchiseId: restaurant.franchiseId,
                      franchiseName: restaurant.name,
                    },
                  } as any)
                }
                activeOpacity={0.7}
              >
                <MapPinned size={20} color="#fff" />
                <Text style={styles.viewBranchesButtonText}>Бүх Салбар Харах</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.mapSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.restaurant.location}</Text>
            <RestaurantMapView
              latitude={restaurant.location.latitude}
              longitude={restaurant.location.longitude}
              name={restaurant.name}
              address={restaurant.address}
            />
          </View>

          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t.restaurant.reviews} ({userReviews.length})
              </Text>
              <View style={styles.reviewActions}>
                <TouchableOpacity
                  style={[styles.viewAllButton, { borderColor: colors.primary, backgroundColor: colors.card }]}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/(home)/restaurant/reviews',
                      params: {
                        restaurantId: restaurant.id,
                        restaurantName: restaurant.name,
                      },
                    } as any)
                  }
                  activeOpacity={0.7}
                >
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.writeReviewButton, { borderColor: colors.primary, backgroundColor: colors.card }]}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/(home)/write-review',
                      params: {
                        restaurantId: restaurant.id,
                        restaurantName: restaurant.name,
                      },
                    } as any)
                  }
                  activeOpacity={0.7}
                >
                  <Edit3 size={16} color={colors.primary} />
                  <Text style={[styles.writeReviewText, { color: colors.primary }]}>Write</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={[styles.categoryRatingsCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              {['food', 'service', 'ambience', 'value', 'cleanliness'].map((category) => {
                const allReviews = [...userReviews, ...restaurant.reviews];
                const reviewsWithCategory = allReviews.filter(r => r.detailedRatings && r.detailedRatings[category as keyof typeof r.detailedRatings]);
                const avgRating = reviewsWithCategory.length > 0
                  ? reviewsWithCategory.reduce((sum, r) => sum + (r.detailedRatings?.[category as keyof typeof r.detailedRatings] || 0), 0) / reviewsWithCategory.length
                  : 0;
                
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
                    <Text style={[styles.categoryRatingLabel, { color: colors.text }]}>
                      {getCategoryLabel(category)}
                    </Text>
                    <View style={styles.categoryStars}>
                      <StarRating rating={avgRating} size={18} color="#FFB800" gap={4} />
                      <Text style={[styles.categoryRatingValue, { color: colors.textSecondary }]}>
                        {avgRating > 0 ? avgRating.toFixed(1) : 'N/A'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      <ReviewModal
        visible={selectedReview !== null}
        review={selectedReview}
        onClose={() => setSelectedReview(null)}
        colors={colors}
      />

      <Animated.View
        style={[
          styles.floatingCallButton,
          {
            bottom: insets.bottom + 100,
            backgroundColor: colors.primary,
            shadowColor: colors.shadow,
            opacity: callButtonOpacity,
          },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.callButton}
          onPress={handleCallPress}
          activeOpacity={0.8}
        >
          <Phone size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View 
        style={[
          styles.footer, 
          { 
            paddingBottom: insets.bottom + 8, 
            backgroundColor: colors.card, 
            borderTopColor: colors.border, 
            shadowColor: colors.shadow,
            transform: [{ translateY: footerTranslateY }],
          }
        ]}
      >
        <TouchableOpacity
          style={[styles.saveButtonFooter, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => toggleSaveRestaurant(restaurant.id)}
          activeOpacity={0.8}
        >
          <Bookmark
            size={20}
            color="#fff"
            fill={isSaved ? '#fff' : 'transparent'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.reserveButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
          onPress={handleCallPress}
        >
          <Phone size={20} color="#fff" />
          <Text style={styles.reserveButtonText}>Call Now</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
  heroContainer: {
    height: 300,
    position: 'relative' as const,
  },
  heroScrollView: {
    width: '100%',
    height: 300,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  arrowButton: {
    position: 'absolute' as const,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  imageCounter: {
    position: 'absolute' as const,
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  mainInfo: {
    gap: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    flex: 1,
  },
  openStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  openBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  closedBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  openStatusText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  openText: {
    color: '#059669',
  },
  closedText: {
    color: '#DC2626',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#999',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
  cuisineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cuisine: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#2D6A4F',
  },
  serviceStyle: {
    fontSize: 15,
    color: '#666',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
  },
  ambianceSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  ambianceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ambianceTag: {
    backgroundColor: '#E8F5F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D6A4F',
  },
  ambianceText: {
    fontSize: 14,
    color: '#2D6A4F',
    fontWeight: '600' as const,
  },
  infoSection: {
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500' as const,
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoGridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(45, 106, 79, 0.08)',
    padding: 10,
    borderRadius: 10,
  },
  infoValueCompact: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600' as const,
  },
  branchesSection: {
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  branchesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  branchesCount: {
    fontSize: 14,
    color: '#666',
    marginTop: -4,
  },
  viewBranchesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  viewBranchesButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  mapSection: {
    gap: 12,
  },
  reviewsSection: {
    gap: 16,
    paddingBottom: 180,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D6A4F',
    backgroundColor: '#fff',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2D6A4F',
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D6A4F',
    backgroundColor: '#fff',
  },
  writeReviewText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2D6A4F',
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
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'row',
    gap: 12,
  },
  saveButtonFooter: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2D6A4F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2D6A4F',
  },
  reserveButton: {
    flex: 1,
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  reserveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
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
  floatingCallButton: {
    position: 'absolute' as const,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2D6A4F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'visible' as const,
  },
  callButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
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
  categoryRatingsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryRatingLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  categoryStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryRatingValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    marginLeft: 8,
  },
  discountSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
  },
  discountTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  discountContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  discountAmount: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#FF6B35',
  },
  discountText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  discountDetails: {
    gap: 6,
  },
  discountDetailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bookingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2D6A4F',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  bookingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  bookingTextContainer: {
    gap: 4,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  bookingSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
