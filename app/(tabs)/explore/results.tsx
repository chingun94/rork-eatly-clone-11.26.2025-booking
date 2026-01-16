import { View, StyleSheet, Text, TouchableOpacity, Alert, Animated } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { RestaurantCard } from '@/components/RestaurantCard';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { CuisineType, ServiceStyle, Ambiance } from '@/types/restaurant';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useMemo, useRef } from 'react';
import { Navigation, Clock, Star, MessageSquare } from 'lucide-react-native';
import * as Location from 'expo-location';
import { calculateDistance } from '@/utils/distance';
import { isRestaurantOpen } from '@/utils/isRestaurantOpen';
import { useLanguage } from '@/contexts/LanguageContext';

type SortOption = 'rating' | 'distance' | 'reviews' | 'default';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export default function FilteredResultsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { restaurants, getFranchiseBranches, isWeekSpecialActive, isDiscountActive, isTop10Active } = useRestaurants();
  const params = useLocalSearchParams<{
    type: 'cuisine' | 'service' | 'ambiance' | 'weekSpecial' | 'discount' | 'top10';
    value?: string;
  }>();
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [isNearbyEnabled, setIsNearbyEnabled] = useState(false);
  const [isOpenNowEnabled, setIsOpenNowEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const filterTranslateY = useRef(new Animated.Value(0)).current;
  const contentPaddingTop = useRef(new Animated.Value(130)).current;
  const isFilterVisible = useRef(true);
  const lastScrollY = useRef(0);



  const toggleNearby = async () => {
    if (isNearbyEnabled) {
      setIsNearbyEnabled(false);
      setSortBy('default');
      return;
    }

    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to find nearby restaurants.');
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setIsNearbyEnabled(true);
      setSortBy('distance');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const filteredAndSortedRestaurants = useMemo(() => {
    let filtered = restaurants.filter((restaurant) => {
      if (restaurant.parentRestaurantId) {
        return false;
      }

      if (isOpenNowEnabled) {
        const isOpen = isRestaurantOpen(restaurant.hours);
        if (!isOpen) {
          return false;
        }
      }
      
      if (params.type === 'weekSpecial') {
        return isWeekSpecialActive(restaurant);
      } else if (params.type === 'discount') {
        return isDiscountActive(restaurant);
      } else if (params.type === 'top10') {
        return isTop10Active(restaurant);
      } else if (params.type === 'cuisine') {
        return Array.isArray(restaurant.cuisine) 
          ? restaurant.cuisine.includes(params.value as CuisineType)
          : restaurant.cuisine === params.value as CuisineType;
      } else if (params.type === 'service') {
        return restaurant.serviceStyle === params.value as ServiceStyle;
      } else if (params.type === 'ambiance') {
        return restaurant.ambiance.includes(params.value as Ambiance);
      }
      return false;
    });

    const restaurantsWithDistance = filtered.map((restaurant) => {
      let distance = 0;
      if (userLocation) {
        if (restaurant.isFranchiseParent) {
          const branches = getFranchiseBranches(restaurant.id);
          if (branches.length > 0) {
            const branchDistances = branches.map(branch => 
              calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                branch.location.latitude,
                branch.location.longitude
              )
            );
            distance = Math.min(...branchDistances);
          } else {
            distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              restaurant.location.latitude,
              restaurant.location.longitude
            );
          }
        } else {
          distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            restaurant.location.latitude,
            restaurant.location.longitude
          );
        }
      }
      return { ...restaurant, distance };
    });

    restaurantsWithDistance.sort((a, b) => {
      if (params.type === 'top10') {
        return (a.top10Rank || 999) - (b.top10Rank || 999);
      }
      
      switch (sortBy) {
        case 'distance':
          return a.distance - b.distance;
        case 'reviews':
          return b.reviewCount - a.reviewCount;
        case 'rating':
          return b.rating - a.rating;
        case 'default':
        default:
          return 0;
      }
    });

    return restaurantsWithDistance;
  }, [restaurants, params, sortBy, userLocation, isOpenNowEnabled, getFranchiseBranches, isWeekSpecialActive, isDiscountActive, isTop10Active]);

  const shouldEnableFilterAnimation = filteredAndSortedRestaurants.length > 2;

  return (
    <>
      <Stack.Screen
        options={{
          title: params.type === 'weekSpecial' ? "This Week's Special" :
                 params.type === 'discount' ? 'Discount' :
                 params.type === 'top10' ? "Top 10 Restaurants" :
                 params.value || 'Results',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Animated.View
          style={[
            styles.filterContainer,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
              transform: [
                {
                  translateY: filterTranslateY,
                },
              ],
              zIndex: 1000,
            },
          ]}

        >
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                {
                  backgroundColor: isNearbyEnabled ? colors.primary : colors.input,
                  borderColor: isNearbyEnabled ? colors.primary : colors.border,
                },
              ]}
              onPress={toggleNearby}
              disabled={loadingLocation}
            >
              <Navigation
                size={16}
                color={isNearbyEnabled ? '#fff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  { color: isNearbyEnabled ? '#fff' : colors.textSecondary },
                ]}
              >
                {loadingLocation ? t.common.loading : t.explore.nearby}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                {
                  backgroundColor: isOpenNowEnabled ? colors.primary : colors.input,
                  borderColor: isOpenNowEnabled ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setIsOpenNowEnabled(!isOpenNowEnabled)}
            >
              <Clock
                size={16}
                color={isOpenNowEnabled ? '#fff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  { color: isOpenNowEnabled ? '#fff' : colors.textSecondary },
                ]}
              >
                {t.explore.openNow}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                {
                  backgroundColor: sortBy === 'reviews' ? colors.primary : colors.input,
                  borderColor: sortBy === 'reviews' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSortBy(sortBy === 'reviews' ? 'default' : 'reviews')}
            >
              <MessageSquare
                size={16}
                color={sortBy === 'reviews' ? '#fff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  { color: sortBy === 'reviews' ? '#fff' : colors.textSecondary },
                ]}
              >
                {t.explore.mostReviewed}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                {
                  backgroundColor: sortBy === 'rating' ? colors.primary : colors.input,
                  borderColor: sortBy === 'rating' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSortBy(sortBy === 'rating' ? 'default' : 'rating')}
            >
              <Star
                size={16}
                color={sortBy === 'rating' ? '#fff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  { color: sortBy === 'rating' ? '#fff' : colors.textSecondary },
                ]}
              >
                {t.explore.highestRated}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.FlatList
          data={filteredAndSortedRestaurants}
          keyExtractor={(item) => item.id}
          renderItem={({ item: restaurant }) => (
            <RestaurantCard 
              restaurant={restaurant} 
              distance={restaurant.distance}
              showDistance={isNearbyEnabled}
              showDiscount={params.type === 'discount'}
            />
          )}
          ListHeaderComponent={
            <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
              {filteredAndSortedRestaurants.length} {filteredAndSortedRestaurants.length === 1 ? 'restaurant' : 'restaurants'}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                No Restaurants Found
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                No restaurants match this filter yet.
              </Text>
            </View>
          }
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: contentPaddingTop },
          ]as any}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            {
              useNativeDriver: false,
              listener: (event: any) => {
                if (!shouldEnableFilterAnimation) {
                  return;
                }
                
                const offsetY = event.nativeEvent.contentOffset.y;
                const scrollingDown = offsetY > lastScrollY.current;
                const scrollingUp = offsetY < lastScrollY.current;
                
                if (scrollingDown && offsetY > 20 && isFilterVisible.current) {
                  isFilterVisible.current = false;
                  Animated.parallel([
                    Animated.timing(filterTranslateY, {
                      toValue: -150,
                      duration: 250,
                      useNativeDriver: true,
                    }),
                    Animated.timing(contentPaddingTop, {
                      toValue: 20,
                      duration: 250,
                      useNativeDriver: false,
                    }),
                  ]).start();
                } else if ((scrollingUp || offsetY <= 5) && !isFilterVisible.current) {
                  isFilterVisible.current = true;
                  Animated.parallel([
                    Animated.timing(filterTranslateY, {
                      toValue: 0,
                      duration: 250,
                      useNativeDriver: true,
                    }),
                    Animated.timing(contentPaddingTop, {
                      toValue: 130,
                      duration: 250,
                      useNativeDriver: false,
                    }),
                  ]).start();
                }
                
                lastScrollY.current = offsetY;
              },
            },
          )}
          scrollEventThrottle={16}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  resultsText: {
    fontSize: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: 'center' as const,
  },
});
