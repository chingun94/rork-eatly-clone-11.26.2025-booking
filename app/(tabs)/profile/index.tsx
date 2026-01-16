import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import ReviewModal from '@/components/ReviewModal';
import { useEffect, useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  UserCircle,
  Edit3,
  Star,
  Bookmark,
  Calendar,
  Trash2,
  Moon,
  Sun,
  Monitor,
  Languages,
  LogOut,
  Store,
  Clock,
  Users,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { RESTAURANTS } from '@/mocks/restaurants';
import { useBookings } from '@/contexts/BookingContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, reviews, savedRestaurants, deleteReview, logout } = useUser();
  const { themeMode, changeThemeMode, colors } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const { bookings, cancelBooking, isCancelling } = useBookings();

  useEffect(() => {
    if (!user) {
      router.replace('/auth' as any);
    }
  }, [user, router]);

  const savedRestaurantsList = savedRestaurants
    .map((id) => RESTAURANTS.find((r) => r.id === id))
    .filter(Boolean);

  const upcomingBookings = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    return bookings
      .filter(b => {
        if (b.status === 'cancelled' || b.status === 'completed' || b.status === 'no-show') {
          return false;
        }
        return b.date >= today;
      })
      .sort((a, b) => {
        if (a.date === b.date) {
          return a.time.localeCompare(b.time);
        }
        return a.date.localeCompare(b.date);
      });
  }, [bookings]);

  const pastBookings = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    return bookings
      .filter(b => {
        if (b.status === 'cancelled') {
          return true;
        }
        return b.date < today || b.status === 'completed' || b.status === 'no-show';
      })
      .sort((a, b) => {
        if (a.date === b.date) {
          return b.time.localeCompare(a.time);
        }
        return b.date.localeCompare(a.date);
      })
      .slice(0, 5);
  }, [bookings]);

  const handleDeleteReview = (reviewId: string) => {
    Alert.alert(
      t.profile.deleteReview,
      t.profile.deleteReviewConfirm,
      [
        {
          text: t.common.cancel,
          style: 'cancel',
        },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: () => deleteReview(reviewId),
        },
      ]
    );
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: typeof Moon }[] = [
    { mode: 'light', label: t.profile.light, icon: Sun },
    { mode: 'dark', label: t.profile.dark, icon: Moon },
    { mode: 'auto', label: t.profile.auto, icon: Monitor },
  ];

  const languageOptions: { lang: Language; label: string; isPrimary?: boolean }[] = [
    { lang: 'mn', label: 'Монгол', isPrimary: true },
    { lang: 'en', label: 'English' },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: t.common.cancel,
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            console.log('Profile: Logout button pressed');
            setIsLoggingOut(true);
            try {
              await logout();
              console.log('Profile: Logout successful, navigating to auth...');
              router.replace('/auth' as any);
            } catch (error) {
              console.error('Profile: Logout failed:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primaryLight }]}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <UserCircle size={80} color={colors.primary} strokeWidth={1.5} />
            )}
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
          
          <View style={[styles.statsRow, { backgroundColor: colors.input }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{reviews.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.profile.reviews}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.borderSecondary }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{savedRestaurants.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.profile.saved}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.borderSecondary }]} />
            <View style={styles.statItem}>
              <View style={styles.joinedBadge}>
                <Calendar size={14} color={colors.primary} />
                <Text style={[styles.joinedText, { color: colors.primary }]}>
                  {new Date(user.joinDate).getFullYear()}
                </Text>
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.profile.memberSince}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.editButton, { borderColor: colors.primary, backgroundColor: colors.card }]}
            onPress={() => router.push('/profile/edit-profile' as any)}
            activeOpacity={0.7}
          >
            <Edit3 size={16} color={colors.primary} />
            <Text style={[styles.editButtonText, { color: colors.primary }]}>{t.profile.editProfile}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Moon size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.profile.theme}</Text>
            </View>
          </View>

          <View style={[styles.themeSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = themeMode === option.mode;
              
              return (
                <TouchableOpacity
                  key={option.mode}
                  style={[
                    styles.themeOption,
                    { borderColor: colors.border },
                    isSelected && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                  ]}
                  onPress={() => changeThemeMode(option.mode)}
                  activeOpacity={0.7}
                >
                  <Icon 
                    size={24} 
                    color={isSelected ? colors.primary : colors.textSecondary} 
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: colors.textSecondary },
                      isSelected && { color: colors.primary, fontWeight: '600' as const },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Languages size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.profile.language}</Text>
            </View>
          </View>

          <View style={[styles.themeSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {languageOptions.map((option) => {
              const isSelected = language === option.lang;
              
              return (
                <TouchableOpacity
                  key={option.lang}
                  style={[
                    styles.themeOption,
                    { borderColor: colors.border },
                    isSelected && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                  ]}
                  onPress={() => changeLanguage(option.lang)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: option.isPrimary ? colors.text : colors.textSecondary },
                      option.isPrimary && { fontWeight: '700' as const },
                      isSelected && { color: colors.primary, fontWeight: '600' as const },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Calendar size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Reservations</Text>
            </View>
            {upcomingBookings.length > 0 && (
              <Text style={[styles.sectionCount, { color: colors.primary, backgroundColor: colors.primaryLight }]}>{upcomingBookings.length}</Text>
            )}
          </View>

          {upcomingBookings.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Calendar size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Upcoming Reservations</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Book a table at your favorite restaurant
              </Text>
            </View>
          ) : (
            upcomingBookings.map((booking) => (
              <View key={booking.id} style={[styles.bookingCard, { backgroundColor: colors.card }]}>
                <View style={styles.bookingHeader}>
                  <Text style={[styles.bookingRestaurant, { color: colors.text }]}>{booking.restaurantName}</Text>
                  <View style={[
                    styles.bookingStatusBadge,
                    booking.status === 'confirmed' && { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
                    booking.status === 'pending' && { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
                    booking.status === 'seated' && { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
                  ]}>
                    <Text style={[
                      styles.bookingStatusText,
                      booking.status === 'confirmed' && { color: '#10B981' },
                      booking.status === 'pending' && { color: '#F59E0B' },
                      booking.status === 'seated' && { color: '#3B82F6' },
                    ]}>
                      {booking.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.bookingDetails}>
                  <View style={styles.bookingDetailRow}>
                    <Calendar size={14} color={colors.textSecondary} />
                    <Text style={[styles.bookingDetailText, { color: colors.textSecondary }]}>
                      {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.bookingDetailRow}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={[styles.bookingDetailText, { color: colors.textSecondary }]}>{booking.time}</Text>
                  </View>
                  <View style={styles.bookingDetailRow}>
                    <Users size={14} color={colors.textSecondary} />
                    <Text style={[styles.bookingDetailText, { color: colors.textSecondary }]}>{booking.partySize} guests</Text>
                  </View>
                </View>
                {booking.confirmationCode && (
                  <View style={[styles.confirmationBadge, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.confirmationText, { color: colors.primary }]}>#{booking.confirmationCode}</Text>
                  </View>
                )}
                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                  <TouchableOpacity
                    style={[styles.cancelBookingButton, { borderColor: colors.error }]}
                    onPress={() => {
                      Alert.alert(
                        'Cancel Reservation',
                        'Are you sure you want to cancel this reservation?',
                        [
                          { text: 'No', style: 'cancel' },
                          {
                            text: 'Yes, Cancel',
                            style: 'destructive',
                            onPress: () => cancelBooking(booking.id),
                          },
                        ]
                      );
                    }}
                    disabled={isCancelling}
                  >
                    <Text style={[styles.cancelBookingText, { color: colors.error }]}>Cancel Reservation</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {pastBookings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Clock size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Past Reservations</Text>
              </View>
            </View>
            {pastBookings.map((booking) => (
              <View key={booking.id} style={[styles.bookingCard, { backgroundColor: colors.card, opacity: 0.7 }]}>
                <View style={styles.bookingHeader}>
                  <Text style={[styles.bookingRestaurant, { color: colors.text }]}>{booking.restaurantName}</Text>
                  <View style={[
                    styles.bookingStatusBadge,
                    booking.status === 'completed' && { backgroundColor: 'rgba(139, 92, 246, 0.1)' },
                    booking.status === 'cancelled' && { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                    booking.status === 'no-show' && { backgroundColor: 'rgba(107, 114, 128, 0.1)' },
                  ]}>
                    <Text style={[
                      styles.bookingStatusText,
                      booking.status === 'completed' && { color: '#8B5CF6' },
                      booking.status === 'cancelled' && { color: '#EF4444' },
                      booking.status === 'no-show' && { color: '#6B7280' },
                    ]}>
                      {booking.status === 'no-show' ? 'NO-SHOW' : booking.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.bookingDetails}>
                  <View style={styles.bookingDetailRow}>
                    <Calendar size={14} color={colors.textSecondary} />
                    <Text style={[styles.bookingDetailText, { color: colors.textSecondary }]}>
                      {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.bookingDetailRow}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={[styles.bookingDetailText, { color: colors.textSecondary }]}>{booking.time}</Text>
                  </View>
                  <View style={styles.bookingDetailRow}>
                    <Users size={14} color={colors.textSecondary} />
                    <Text style={[styles.bookingDetailText, { color: colors.textSecondary }]}>{booking.partySize} guests</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Star size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.profile.myReviews}</Text>
            </View>
            {reviews.length === 0 && (
              <Text style={[styles.sectionCount, { color: colors.primary, backgroundColor: colors.primaryLight }]}>0</Text>
            )}
          </View>

          {reviews.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Star size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>{t.profile.noReviewsYet}</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {t.profile.startReviewing}
              </Text>
            </View>
          ) : (
            reviews.map((review) => (
              <TouchableOpacity 
                key={review.id} 
                style={[styles.reviewCard, { backgroundColor: colors.card }]}
                onPress={() => setSelectedReview(review)}
                activeOpacity={0.7}
              >
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewTitleRow}>
                    <Text style={[styles.restaurantName, { color: colors.text }]} numberOfLines={1}>
                      {review.restaurantName}
                    </Text>
                    <View style={[styles.ratingBadge, { backgroundColor: colors.starBg }]}>
                      <Star size={14} fill={colors.star} color={colors.star} />
                      <Text style={[styles.ratingText, { color: colors.text }]}>{review.rating}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteReview(review.id);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.reviewDate, { color: colors.textTertiary }]}>
                  {new Date(review.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={[styles.reviewComment, { color: colors.textSecondary }]} numberOfLines={3}>
                  {review.comment}
                </Text>
                {review.photos && review.photos.length > 0 && (
                  <View style={styles.photoBadgeContainer}>
                    <View style={[styles.photoBadge, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.photoText, { color: colors.primary }]}>{review.photos.length} photo(s)</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Bookmark size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.profile.savedRestaurants}</Text>
            </View>
            {savedRestaurants.length > 0 && (
              <Text style={[styles.sectionCount, { color: colors.primary, backgroundColor: colors.primaryLight }]}>{savedRestaurants.length}</Text>
            )}
          </View>

          {savedRestaurantsList.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Bookmark size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>{t.profile.noSavedRestaurants}</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {t.profile.saveRestaurants}
              </Text>
            </View>
          ) : (
            savedRestaurantsList.map((restaurant) => (
              <TouchableOpacity
                key={restaurant!.id}
                style={[styles.savedCard, { backgroundColor: colors.card }]}
                onPress={() =>
                  router.push(`/(home)/restaurant/${restaurant!.id}` as any)
                }
                activeOpacity={0.7}
              >
                <View style={styles.savedInfo}>
                  <Text style={[styles.savedName, { color: colors.text }]} numberOfLines={1}>
                    {restaurant!.name}
                  </Text>
                  <View style={styles.savedMeta}>
                    <Text style={[styles.savedCuisine, { color: colors.primary }]}>
                      {Array.isArray(restaurant!.cuisine) 
                        ? restaurant!.cuisine.map(c => t.cuisineTypes[c] || c).join(', ')
                        : (t.cuisineTypes[restaurant!.cuisine] || restaurant!.cuisine)}
                    </Text>
                    <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
                    <View style={styles.savedRating}>
                      <Star size={12} fill={colors.star} color={colors.star} />
                      <Text style={[styles.savedRatingText, { color: colors.text }]}>
                        {restaurant!.rating}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.restaurantButton, { backgroundColor: colors.card, borderColor: colors.primary }]}
            onPress={() => router.push('/restaurant/login' as any)}
            activeOpacity={0.7}
          >
            <Store size={20} color={colors.primary} />
            <Text style={[styles.restaurantButtonText, { color: colors.primary }]}>
              Restaurant Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleLogout}
            activeOpacity={0.7}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator color={colors.error} />
            ) : (
              <>
                <LogOut size={20} color={colors.error} />
                <Text style={[styles.logoutButtonText, { color: colors.error }]}>
                  Logout
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ReviewModal
        visible={selectedReview !== null}
        review={selectedReview}
        onClose={() => setSelectedReview(null)}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  joinedText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  sectionCount: {
    fontSize: 16,
    fontWeight: '600' as const,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  themeSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 8,
    borderWidth: 1,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  reviewCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  restaurantName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  reviewDate: {
    fontSize: 13,
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  savedCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  savedInfo: {
    gap: 6,
  },
  savedName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  savedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedCuisine: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
  },
  savedRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savedRatingText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  restaurantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  restaurantButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  photoBadgeContainer: {
    marginTop: 8,
  },
  photoBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  photoText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  bookingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingRestaurant: {
    fontSize: 16,
    fontWeight: '600' as const,
    flex: 1,
    marginRight: 8,
  },
  bookingStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bookingStatusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  bookingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingDetailText: {
    fontSize: 13,
  },
  confirmationBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  confirmationText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  cancelBookingButton: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBookingText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
