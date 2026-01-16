import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Phone, Star, Navigation, Clock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { Restaurant } from '@/types/restaurant';
import { useState, useMemo, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { calculateDistance } from '@/utils/distance';
import { isRestaurantOpen } from '@/utils/isRestaurantOpen';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export default function BranchesScreen() {
  const router = useRouter();
  const { franchiseId, franchiseName } = useLocalSearchParams<{ franchiseId: string; franchiseName: string }>();
  const { colors } = useTheme();
  const { restaurants, getFranchiseBranches } = useRestaurants();
  
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isNearbyEnabled, setIsNearbyEnabled] = useState(true);
  const [isOpenNowEnabled, setIsOpenNowEnabled] = useState(false);
  
  const parentRestaurant = restaurants.find((r) => r.id === franchiseId);
  const branches = getFranchiseBranches(franchiseId || '');
  const allLocations = parentRestaurant ? [parentRestaurant, ...branches] : branches;

  const getUserLocation = useCallback(async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('BranchesScreen: Location permission denied');
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
      console.log('BranchesScreen: User location obtained:', location.coords);
    } catch (error) {
      console.error('BranchesScreen: Error getting location:', error);
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  const filteredAndSortedLocations = useMemo(() => {
    let filtered: (Restaurant & { distance?: number })[] = [...allLocations];

    if (isOpenNowEnabled) {
      filtered = filtered.filter((restaurant) => {
        if (!restaurant.hours) return false;
        return isRestaurantOpen(restaurant.hours);
      });
    }

    if (userLocation) {
      filtered = filtered.map((restaurant) => ({
        ...restaurant,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          restaurant.location.latitude,
          restaurant.location.longitude
        ),
      }));

      if (isNearbyEnabled) {
        filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
    }

    return filtered;
  }, [allLocations, userLocation, isNearbyEnabled, isOpenNowEnabled]);

  const toggleNearby = () => {
    setIsNearbyEnabled(!isNearbyEnabled);
  };

  const toggleOpenNow = () => {
    setIsOpenNowEnabled(!isOpenNowEnabled);
  };

  const handleCallPress = (phone: string) => {
    const phoneNumber = phone.replace(/[^0-9]/g, '');
    const phoneUrl = Platform.OS === 'ios' ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl).catch(() => {
      console.log('Could not open phone dialer');
    });
  };

  const handleDirectionsPress = (restaurant: Restaurant) => {
    const { latitude, longitude } = restaurant.location;
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(restaurant.name)})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    });
    
    if (url) {
      Linking.openURL(url).catch(() => {
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        Linking.openURL(fallbackUrl);
      });
    }
  };

  const renderLocationCard = (restaurant: Restaurant & { distance?: number }) => {
    const isParent = restaurant.id === franchiseId;
    
    return (
      <TouchableOpacity
        key={restaurant.id}
        style={[styles.locationCard, { backgroundColor: colors.card, shadowColor: colors.shadow, borderColor: isParent ? colors.primary : 'transparent' }]}
        onPress={() => router.push(`/(tabs)/(home)/restaurant/${restaurant.id}` as any)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: restaurant.image, cache: 'force-cache' }}
          style={styles.locationImage}
          resizeMode="cover"
        />
        
        <View style={styles.locationInfo}>
          <View style={styles.locationHeader}>
            <Text style={[styles.locationName, { color: colors.text }]}>
              {restaurant.name}
            </Text>
            {isParent && (
              <View style={[styles.mainBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <Text style={[styles.mainBadgeText, { color: colors.primary }]}>Main</Text>
              </View>
            )}
          </View>
          
          <View style={styles.locationMeta}>
            <View style={[styles.ratingBadge, { backgroundColor: colors.starBg }]}>
              <Star size={12} fill="#FFB800" color="#FFB800" />
              <Text style={[styles.ratingText, { color: colors.text }]}>{restaurant.rating.toFixed(1)}</Text>
            </View>
            <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
            <Text style={[styles.priceText, { color: colors.textSecondary }]}>
              {'$'.repeat(restaurant.priceLevel)}
            </Text>
            <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
            <Text style={[styles.reviewCountText, { color: colors.textSecondary }]}>
              {restaurant.reviewCount} reviews
            </Text>
          </View>

          <View style={styles.addressRow}>
            <MapPin size={16} color={colors.textTertiary} />
            <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>
              {restaurant.address}
            </Text>
          </View>

          {restaurant.distance !== undefined && (
            <View style={styles.distanceRow}>
              <Navigation size={14} color={colors.primary} />
              <Text style={[styles.distanceText, { color: colors.primary }]}>
                {restaurant.distance.toFixed(1)} km away
              </Text>
            </View>
          )}

          {restaurant.location.neighborhood && (
            <Text style={[styles.neighborhood, { color: colors.textTertiary }]}>
              {restaurant.location.neighborhood}, {restaurant.location.city}
            </Text>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => handleCallPress(restaurant.phone)}
              activeOpacity={0.7}
            >
              <Phone size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.directionsButton, { borderColor: colors.primary }]}
              onPress={() => handleDirectionsPress(restaurant)}
              activeOpacity={0.7}
            >
              <Navigation size={16} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: `${franchiseName || 'Restaurant'} Locations`,
          headerTintColor: colors.text,
          headerStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>All Locations</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {filteredAndSortedLocations.length} location{filteredAndSortedLocations.length !== 1 ? 's' : ''} available
          </Text>
        </View>

        <View style={styles.filterSection}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              isNearbyEnabled && { backgroundColor: colors.primary },
              !isNearbyEnabled && { borderColor: colors.border, borderWidth: 1, backgroundColor: colors.card },
            ]}
            onPress={toggleNearby}
            activeOpacity={0.7}
            disabled={loadingLocation || !userLocation}
          >
            <MapPin size={16} color={isNearbyEnabled ? '#fff' : colors.textSecondary} />
            <Text
              style={[
                styles.filterButtonText,
                isNearbyEnabled ? { color: '#fff' } : { color: colors.textSecondary },
              ]}
            >
              Nearby
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              isOpenNowEnabled && { backgroundColor: colors.primary },
              !isOpenNowEnabled && { borderColor: colors.border, borderWidth: 1, backgroundColor: colors.card },
            ]}
            onPress={toggleOpenNow}
            activeOpacity={0.7}
          >
            <Clock size={16} color={isOpenNowEnabled ? '#fff' : colors.textSecondary} />
            <Text
              style={[
                styles.filterButtonText,
                isOpenNowEnabled ? { color: '#fff' } : { color: colors.textSecondary },
              ]}
            >
              Open Now
            </Text>
          </TouchableOpacity>
        </View>

        {filteredAndSortedLocations.map(renderLocationCard)}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
  },
  filterSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#2D6A4F',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden' as const,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  locationImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  locationInfo: {
    padding: 16,
    gap: 10,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    flex: 1,
  },
  mainBadge: {
    backgroundColor: '#E8F5F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D6A4F',
  },
  mainBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#2D6A4F',
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#999',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  reviewCountText: {
    fontSize: 13,
    color: '#666',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  address: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  neighborhood: {
    fontSize: 13,
    color: '#999',
    marginTop: -4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  directionsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#2D6A4F',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
