import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Pressable,
  Modal,
  Animated,
  FlatList,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Search,
  SlidersHorizontal,
  Navigation,
  X,
  Clock,
} from "lucide-react-native";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import * as Location from "expo-location";
import { useRouter, useFocusEffect } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import { RestaurantCard } from "@/components/RestaurantCard";
import { Restaurant, CuisineType, ServiceStyle, Ambiance } from "@/types/restaurant";
import { useRestaurants } from "@/contexts/RestaurantContext";
import { calculateDistance } from "@/utils/distance";
import { isRestaurantOpen } from "@/utils/isRestaurantOpen";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAds } from "@/contexts/AdContext";

const CUISINE_IMAGES: Record<string, string> = {
  'Italian': 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=200',
  'Japanese': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200',
  'Mexican': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
  'French': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200',
  'American': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200',
  'Chinese': 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=200',
  'Thai': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=200',
  'Indian': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200',
  'Mediterranean': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200',
  'Korean': 'https://images.unsplash.com/photo-1580742795190-061a8e1e2f21?w=200',
  'European': 'https://images.unsplash.com/photo-1535473895227-bdecb20fb157?w=200',
  'Turkish': 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=200',
  'Vegetarian/Vegan': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200',
  'Hot-Pot': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=200',
  'Mongolian': 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=200',
  'Asian': 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=200',
  'Ramen': 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=200',
};

const SERVICE_IMAGES: Record<string, string> = {
  'Fine Dining': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200',
  'Casual Dining': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200',
  'Fast Casual': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200',
  'Cafe': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200',
};

const VIBE_IMAGES: Record<string, string> = {
  'Romantic': 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=200',
  'Business Lunch': 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=200',
  'Family Friendly': 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=200',
  'Date Night': 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=200',
  'Trendy': 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200',
  'Cozy': 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=200',
  'Lively': 'https://images.unsplash.com/photo-1543007631-283050bb3e8c?w=200',
  'Quiet': 'https://images.unsplash.com/photo-1533777324565-a040eb52facd?w=200',
  'Outdoor Seating': 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200',
  'Late Night': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200',
  'VIP Room': 'https://images.unsplash.com/photo-1558053279-249e9f31a8c3?w=200',
};

type FilterCategory = "all" | "cuisine" | "service" | "ambiance";
type SortOption = "rating" | "distance" | "reviews";

interface UserLocation {
  latitude: number;
  longitude: number;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { restaurants, isFeaturedActive, isCategoryFeaturedActive, sessionSeed, getFranchiseBranches, isDiscountActive } =
    useRestaurants();
  const {
    ads,
    getActivePopupAd,
    incrementImpressions,
    incrementClicks,
    markPopupAsShownInSession,
    isLoading: adsLoading,
  } = useAds();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedCuisines, setSelectedCuisines] = useState<CuisineType[]>([]);
  const [selectedServices, setSelectedServices] = useState<ServiceStyle[]>([]);
  const [selectedAmbiances, setSelectedAmbiances] = useState<Ambiance[]>([]);
  const [activeFilterTab, setActiveFilterTab] = useState<FilterCategory>("cuisine");
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isNearbyEnabled, setIsNearbyEnabled] = useState(false);
  const [isOpenNowEnabled, setIsOpenNowEnabled] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressCount = useRef(0);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      if (scrollThrottleTimer.current) {
        clearTimeout(scrollThrottleTimer.current);
        scrollThrottleTimer.current = null;
      }
    };
  }, []);


  const [showAdModal, setShowAdModal] = useState(false);
  const [allActiveAds, setAllActiveAds] = useState<any[]>([]);
  const [initialAdIndex, setInitialAdIndex] = useState(0);
  const [showSort, setShowSort] = useState(true);
  const [showLocationSearch, setShowLocationSearch] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollYRef = useRef(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollThrottleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cuisineTypes: CuisineType[] = [
    "Italian",
    "Japanese",
    "Mexican",
    "French",
    "American",
    "Chinese",
    "Thai",
    "Indian",
    "Mediterranean",
    "Korean",
    "European",
    "Turkish",
    "Vegetarian/Vegan",
    "Hot-Pot",
    "Mongolian",
    "Asian",
    "Ramen",
  ];

  const serviceStyles: ServiceStyle[] = [
    "Fine Dining",
    "Casual Dining",
    "Fast Casual",
    "Cafe",
  ];

  const ambianceTypes: Ambiance[] = [
    "Romantic",
    "Business Lunch",
    "Family Friendly",
    "Date Night",
    "Trendy",
    "Cozy",
    "Lively",
    "Quiet",
    "Outdoor Seating",
    "Late Night",
    "VIP Room",
  ];

  useFocusEffect(
    useCallback(() => {
      console.log("====== HomeScreen: Screen focused ======");
      console.log("HomeScreen: Ads loading:", adsLoading);
      console.log("HomeScreen: Platform.OS:", Platform.OS);

      if (adsLoading) {
        console.log(
          "HomeScreen: Still loading ads, will retry after 2 seconds"
        );
        const retryTimer = setTimeout(() => {
          console.log("HomeScreen: Retry checking for ads");
          const ad = getActivePopupAd();
          if (ad) {
            console.log("HomeScreen: Found ad on retry:", ad.id);
            const now = new Date();
            const activePopupAds = ads.filter((adItem) => {
              const isPopup = adItem.type === 'popup';
              const isActive = adItem.status === 'active';
              const startDate = new Date(adItem.startDate);
              const endDate = new Date(adItem.endDate);
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(23, 59, 59, 999);
              const isInDateRange = startDate <= now && endDate >= now;
              return isPopup && isActive && isInDateRange;
            });
            
            const randomIndex = Math.floor(Math.random() * activePopupAds.length);
            setAllActiveAds(activePopupAds.length > 0 ? activePopupAds : [ad]);
            setInitialAdIndex(randomIndex);
            const selectedAd = activePopupAds[randomIndex] || ad;
            
            setTimeout(() => {
              console.log("HomeScreen: Setting showAdModal to true (retry)");
              setShowAdModal(true);
            }, 100);
            incrementImpressions(selectedAd.id);
            markPopupAsShownInSession(selectedAd.id);
          }
        }, 2000);

        return () => {
          clearTimeout(retryTimer);
        };
      }

      const checkTimer = setTimeout(() => {
        console.log("HomeScreen: Checking for active ads");
        const ad = getActivePopupAd();
        console.log(
          "HomeScreen: Active popup ad result:",
          ad ? `${ad.id} (${ad.restaurantName})` : "null"
        );
        if (ad) {
          const now = new Date();
          const activePopupAds = ads.filter((adItem) => {
            const isPopup = adItem.type === 'popup';
            const isActive = adItem.status === 'active';
            const startDate = new Date(adItem.startDate);
            const endDate = new Date(adItem.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            const isInDateRange = startDate <= now && endDate >= now;
            return isPopup && isActive && isInDateRange;
          });
          
          console.log("HomeScreen: Found", activePopupAds.length, "active popup ads");
          
          const randomIndex = Math.floor(Math.random() * activePopupAds.length);
          const selectedAd = activePopupAds[randomIndex] || ad;
          
          setAllActiveAds(activePopupAds.length > 0 ? activePopupAds : [ad]);
          setInitialAdIndex(randomIndex);
          
          setTimeout(() => {
            console.log("HomeScreen: Setting showAdModal to true");
            setShowAdModal(true);
          }, 100);
          incrementImpressions(selectedAd.id);
          markPopupAsShownInSession(selectedAd.id);
          console.log("HomeScreen: ✅ Ad modal should now be visible");
        } else {
          console.log("HomeScreen: ❌ No active popup ad to show");
        }
      }, 500);

      return () => {
        clearTimeout(checkTimer);
      };
    }, [
      adsLoading,
      ads,
      getActivePopupAd,
      incrementImpressions,
      markPopupAsShownInSession,
    ])
  );

  const handleAdClick = (ad: any) => {
    if (ad) {
      incrementClicks(ad.id);
      setShowAdModal(false);
      router.push(`/(home)/restaurant/${ad.restaurantId}` as any);
    }
  };

  const handleCloseAd = () => {
    console.log("HomeScreen: Closing ad");
    setShowAdModal(false);
  };

  const toggleNearby = async () => {
    if (isNearbyEnabled) {
      setIsNearbyEnabled(false);
      setSortBy("rating");
      console.log("Nearby disabled");
      return;
    }

    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(t.home.permissionDenied, t.home.permissionMessage);
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
      setSortBy("distance");
      console.log("User location set:", location.coords);
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(t.home.error, t.home.locationError);
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
      const matchesSearch =
        searchQuery === "" ||
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.some((c: CuisineType) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
        restaurant.location.city
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        restaurant.location.neighborhood
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        restaurant.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCuisine =
        selectedCuisines.length === 0 ||
        restaurant.cuisine.some((c: CuisineType) => selectedCuisines.includes(c));

      const matchesService =
        selectedServices.length === 0 ||
        selectedServices.includes(restaurant.serviceStyle);

      const matchesAmbiance =
        selectedAmbiances.length === 0 ||
        selectedAmbiances.some((amb) => restaurant.ambiance.includes(amb));

      return (
        matchesSearch &&
        matchesCuisine &&
        matchesService &&
        matchesAmbiance
      );
    });

    const getRandomValue = (id: string) => {
      let hash = 0;
      const seed = sessionSeed.toString() + id;
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(Math.sin(hash) * 10000);
    };

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
      return { ...restaurant, distance, randomValue: getRandomValue(restaurant.id) };
    });

    restaurantsWithDistance.sort((a, b) => {
      const aFeaturedHome = isFeaturedActive(a);
      const bFeaturedHome = isFeaturedActive(b);

      if (aFeaturedHome && !bFeaturedHome) return -1;
      if (!aFeaturedHome && bFeaturedHome) return 1;
      
      if (aFeaturedHome && bFeaturedHome) {
        const aRank = a.featuredTimeline?.rank || 999;
        const bRank = b.featuredTimeline?.rank || 999;
        if (aRank !== bRank) return aRank - bRank;
      }

      const aFeaturedCuisine =
        selectedCuisines.length > 0 && a.cuisine.some((c: CuisineType) => selectedCuisines.includes(c))
          ? isCategoryFeaturedActive(a, "cuisine")
          : false;
      const bFeaturedCuisine =
        selectedCuisines.length > 0 && b.cuisine.some((c: CuisineType) => selectedCuisines.includes(c))
          ? isCategoryFeaturedActive(b, "cuisine")
          : false;

      if (aFeaturedCuisine && !bFeaturedCuisine) return -1;
      if (!aFeaturedCuisine && bFeaturedCuisine) return 1;
      
      if (aFeaturedCuisine && bFeaturedCuisine) {
        const aRank = a.categoryFeatured?.cuisine?.rank || 999;
        const bRank = b.categoryFeatured?.cuisine?.rank || 999;
        if (aRank !== bRank) return aRank - bRank;
      }

      const aFeaturedService =
        selectedServices.length > 0 && selectedServices.includes(a.serviceStyle)
          ? isCategoryFeaturedActive(a, "serviceStyle")
          : false;
      const bFeaturedService =
        selectedServices.length > 0 && selectedServices.includes(b.serviceStyle)
          ? isCategoryFeaturedActive(b, "serviceStyle")
          : false;

      if (aFeaturedService && !bFeaturedService) return -1;
      if (!aFeaturedService && bFeaturedService) return 1;
      
      if (aFeaturedService && bFeaturedService) {
        const aRank = a.categoryFeatured?.serviceStyle?.rank || 999;
        const bRank = b.categoryFeatured?.serviceStyle?.rank || 999;
        if (aRank !== bRank) return aRank - bRank;
      }

      let aFeaturedAmbiance = false;
      let bFeaturedAmbiance = false;
      let aAmbianceRank = 999;
      let bAmbianceRank = 999;
      if (selectedAmbiances.length > 0) {
        for (const amb of selectedAmbiances) {
          if (a.ambiance.includes(amb) && isCategoryFeaturedActive(a, "ambiance", amb)) {
            aFeaturedAmbiance = true;
            aAmbianceRank = Math.min(aAmbianceRank, a.categoryFeatured?.ambiance?.[amb]?.rank || 999);
          }
          if (b.ambiance.includes(amb) && isCategoryFeaturedActive(b, "ambiance", amb)) {
            bFeaturedAmbiance = true;
            bAmbianceRank = Math.min(bAmbianceRank, b.categoryFeatured?.ambiance?.[amb]?.rank || 999);
          }
        }
      }

      if (aFeaturedAmbiance && !bFeaturedAmbiance) return -1;
      if (!aFeaturedAmbiance && bFeaturedAmbiance) return 1;
      
      if (aFeaturedAmbiance && bFeaturedAmbiance) {
        if (aAmbianceRank !== bAmbianceRank) return aAmbianceRank - bAmbianceRank;
      }

      switch (sortBy) {
        case "distance":
          if (a.distance === b.distance) {
            return a.randomValue - b.randomValue;
          }
          return a.distance - b.distance;
        case "reviews":
          if (b.reviewCount === a.reviewCount) {
            return a.randomValue - b.randomValue;
          }
          return b.reviewCount - a.reviewCount;
        case "rating":
        default:
          if (b.rating === a.rating) {
            return a.randomValue - b.randomValue;
          }
          return b.rating - a.rating;
      }
    });

    return restaurantsWithDistance;
  }, [
    restaurants,
    searchQuery,
    selectedCuisines,
    selectedServices,
    selectedAmbiances,
    sortBy,
    userLocation,
    isFeaturedActive,
    isCategoryFeaturedActive,
    sessionSeed,
    getFranchiseBranches,
    isOpenNowEnabled,
  ]);

  const toggleCuisine = (cuisine: CuisineType) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const toggleService = (service: ServiceStyle) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const toggleAmbiance = (ambiance: Ambiance) => {
    setSelectedAmbiances((prev) =>
      prev.includes(ambiance)
        ? prev.filter((a) => a !== ambiance)
        : [...prev, ambiance]
    );
  };

  const clearFilters = () => {
    setSelectedCuisines([]);
    setSelectedServices([]);
    setSelectedAmbiances([]);
  };

  const activeFilterCount =
    selectedCuisines.length +
    selectedServices.length +
    selectedAmbiances.length;

  const handleLogoPress = () => {
    pressCount.current += 1;

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    if (pressCount.current >= 5) {
      pressCount.current = 0;
      router.push("/admin/login" as any);
      return;
    }

    longPressTimer.current = setTimeout(() => {
      pressCount.current = 0;
    }, 2000);
  };



  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const contentHeight = event.nativeEvent.contentSize.height;
        const layoutHeight = event.nativeEvent.layoutMeasurement.height;
        
        const hasEnoughContent = contentHeight > layoutHeight + 100;
        
        if (!hasEnoughContent) {
          if (!showSort) setShowSort(true);
          if (!showLocationSearch) setShowLocationSearch(true);
          if (!showFilters) setShowFilters(true);
          if (isScrolled) setIsScrolled(false);
        } else {
          if (currentScrollY > 20) {
            if (!isScrolled) setIsScrolled(true);
          } else {
            if (isScrolled) setIsScrolled(false);
          }
          
          if (currentScrollY > 10) {
            if (showSort) setShowSort(false);
            if (showLocationSearch) setShowLocationSearch(false);
            if (showFilters) setShowFilters(false);
          } else {
            if (!showSort) setShowSort(true);
            if (!showLocationSearch) setShowLocationSearch(true);
            if (!showFilters) setShowFilters(true);
          }
        }

        scrollYRef.current = currentScrollY;
      },
    }
  );

  return (
    <>
      <Modal
        visible={showAdModal && allActiveAds.length > 0}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseAd}
        statusBarTranslucent={true}
        hardwareAccelerated={true}
      >
        {allActiveAds.length > 0 && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseAd}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentOffset={{ x: initialAdIndex * (Platform.OS === 'web' ? 340 : 360), y: 0 }}
                onMomentumScrollEnd={(e) => {
                  const offsetX = e.nativeEvent.contentOffset.x;
                  const adWidth = Platform.OS === 'web' ? 340 : 360;
                  const currentIndex = Math.round(offsetX / adWidth);
                  const visibleAd = allActiveAds[currentIndex];
                  if (visibleAd) {
                    incrementImpressions(visibleAd.id);
                  }
                }}
                decelerationRate="fast"
                snapToInterval={Platform.OS === 'web' ? 340 : 360}
                snapToAlignment="center"
              >
                {allActiveAds.map((ad) => (
                  <Pressable 
                    key={ad.id}
                    style={[styles.adContainer, { width: Platform.OS === 'web' ? 340 : 360 }]} 
                    onPress={() => handleAdClick(ad)}
                  >
                    {ad.imageUrl && ad.imageUrl.length > 0 ? (
                      <ExpoImage
                        source={{ uri: ad.imageUrl }}
                        style={styles.adImage}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        recyclingKey={ad.id}
                        onError={(error) => {
                          console.error("HomeScreen: Image load error:", error);
                        }}
                        onLoad={() => {
                          console.log(
                            "HomeScreen: Image loaded successfully for ad:",
                            ad.id
                          );
                        }}
                      />
                    ) : (
                      <View style={styles.adImagePlaceholder}>
                        <Text style={styles.adImagePlaceholderText}>
                          No Image Available
                        </Text>
                        <Text style={styles.adImagePlaceholderSubtext}>
                          Image URL: {ad.imageUrl ? "Empty" : "Missing"}
                        </Text>
                      </View>
                    )}
                    <View style={styles.adTextContainer}>
                      <Text style={styles.adTitle}>{ad.restaurantName}</Text>
                      <Text style={styles.adSubtitle}>Tap to view restaurant</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
              {allActiveAds.length > 1 && (
                <View style={styles.adPaginationContainer}>
                  {allActiveAds.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.adPaginationDot,
                        index === initialAdIndex && styles.adPaginationDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </Modal>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 12,
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>
                {t.home.title}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t.home.subtitle}
              </Text>
            </View>
            <Pressable onPress={handleLogoPress} style={styles.logoButton}>
              <ExpoImage
                source={{
                  uri: isDark
                    ? "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/rj8rhq3cq5fhczw355tif"
                    : "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zrgyajwj110agye9169ly",
                }}
                style={styles.logoImage}
                contentFit="contain"
              />
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.card },
            isScrolled && styles.searchContainerScrolled
          ]}
        >
          <View
            style={[
              styles.searchInputContainer,
              { backgroundColor: colors.input },
            ]}
          >
            <Search size={20} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search restaurants, cuisines, or locations"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textTertiary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearSearchButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: colors.input },
              activeFilterCount > 0 && { backgroundColor: colors.primary },
              scrollYRef.current > 50 && (showSort || showFilters) && { backgroundColor: colors.primary },
            ]}
            onPress={() => {
              if (scrollYRef.current > 50) {
                const newState = !showSort;
                setShowSort(newState);
                setShowLocationSearch(newState);
                setShowFilters(newState);
              } else {
                setShowFilters(!showFilters);
              }
            }}
          >
            <SlidersHorizontal
              size={20}
              color={activeFilterCount > 0 || (scrollYRef.current > 50 && (showSort || showFilters)) ? "#fff" : colors.text}
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.locationSearchContainer,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
            !showLocationSearch && {
              maxHeight: 0,
              opacity: 0,
            },
            showLocationSearch && scrollYRef.current <= 10 && {
              maxHeight: scrollY.interpolate({
                inputRange: [0, 100],
                outputRange: [60, 0],
                extrapolate: 'clamp',
              }),
              opacity: scrollY.interpolate({
                inputRange: [0, 80],
                outputRange: [1, 0],
                extrapolate: 'clamp',
              }),
              transform: [{
                translateY: scrollY.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, -60],
                  extrapolate: 'clamp',
                }),
              }],
            },
            showLocationSearch && scrollYRef.current > 10 && {
              maxHeight: 60,
              opacity: 1,
            },
          ]}
          pointerEvents={showLocationSearch ? "auto" : "none"}
        >
          <View style={styles.filterButtonsRow}>
            <TouchableOpacity
              style={[
                styles.nearbyButton,
                {
                  backgroundColor: isNearbyEnabled ? colors.primary : colors.input,
                  borderColor: isNearbyEnabled ? colors.primary : colors.border,
                },
              ]}
              onPress={toggleNearby}
              disabled={loadingLocation}
            >
              <Navigation
                size={18}
                color={isNearbyEnabled ? "#fff" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.nearbyButtonText,
                  { color: isNearbyEnabled ? "#fff" : colors.textSecondary },
                ]}
              >
                {loadingLocation ? t.common.loading : t.home.nearby}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.openNowButton,
                {
                  backgroundColor: isOpenNowEnabled ? colors.primary : colors.input,
                  borderColor: isOpenNowEnabled ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setIsOpenNowEnabled(!isOpenNowEnabled)}
            >
              <Clock
                size={18}
                color={isOpenNowEnabled ? "#fff" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.openNowButtonText,
                  { color: isOpenNowEnabled ? "#fff" : colors.textSecondary },
                ]}
              >
                {t.home.openNow}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.sortContainer,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
            !showSort && {
              maxHeight: 0,
              opacity: 0,
            },
            showSort && scrollYRef.current <= 10 && {
              maxHeight: scrollY.interpolate({
                inputRange: [0, 100],
                outputRange: [100, 0],
                extrapolate: 'clamp',
              }),
              opacity: scrollY.interpolate({
                inputRange: [0, 80],
                outputRange: [1, 0],
                extrapolate: 'clamp',
              }),
              transform: [{
                translateY: scrollY.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, -100],
                  extrapolate: 'clamp',
                }),
              }],
            },
            showSort && scrollYRef.current > 10 && {
              maxHeight: 100,
              opacity: 1,
            },
          ]}
          pointerEvents={showSort ? "auto" : "none"}
        >
          <Text style={[styles.sortLabel, { color: colors.text }]}>
            {t.home.sortBy}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortOptions}
          >
            <TouchableOpacity
              style={[
                styles.sortChip,
                { backgroundColor: colors.tag },
                sortBy === "rating" && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSortBy("rating")}
            >
              <Text
                style={[
                  styles.sortChipText,
                  { color: colors.textSecondary },
                  sortBy === "rating" && styles.sortChipTextActive,
                ]}
              >
                {t.home.rating}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortChip,
                { backgroundColor: colors.tag },
                sortBy === "distance" && { backgroundColor: colors.primary },
                !isNearbyEnabled && styles.sortChipDisabled,
              ]}
              onPress={() => isNearbyEnabled && setSortBy("distance")}
              disabled={!isNearbyEnabled}
            >
              <Text
                style={[
                  styles.sortChipText,
                  { color: colors.textSecondary },
                  sortBy === "distance" && styles.sortChipTextActive,
                  !isNearbyEnabled && { color: colors.textTertiary },
                ]}
              >
                {t.home.distance}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortChip,
                { backgroundColor: colors.tag },
                sortBy === "reviews" && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSortBy("reviews")}
            >
              <Text
                style={[
                  styles.sortChipText,
                  { color: colors.textSecondary },
                  sortBy === "reviews" && styles.sortChipTextActive,
                ]}
              >
                {t.home.mostReviewed}
              </Text>
            </TouchableOpacity>
            {sortBy !== "rating" && (
              <TouchableOpacity
                style={[
                  styles.clearSortChip,
                  { borderColor: colors.primary },
                ]}
                onPress={() => setSortBy("rating")}
              >
                <X size={14} color={colors.primary} />
                <Text
                  style={[
                    styles.clearSortChipText,
                    { color: colors.primary },
                  ]}
                >
                  Clear
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>

        <Animated.View
          style={[
            styles.filtersPanel,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
            },
            !showFilters && {
              maxHeight: 0,
              opacity: 0,
            },
            showFilters && scrollYRef.current <= 10 && {
              maxHeight: scrollY.interpolate({
                inputRange: [0, 100],
                outputRange: [220, 0],
                extrapolate: 'clamp',
              }),
              opacity: scrollY.interpolate({
                inputRange: [0, 80],
                outputRange: [1, 0],
                extrapolate: 'clamp',
              }),
              transform: [{
                translateY: scrollY.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, -220],
                  extrapolate: 'clamp',
                }),
              }],
            },
            showFilters && scrollYRef.current > 10 && {
              maxHeight: 220,
              opacity: 1,
            },
          ]}
          pointerEvents={showFilters ? "auto" : "none"}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterTabs}
              contentContainerStyle={styles.filterTabsContent}
            >
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  { backgroundColor: colors.tag },
                  activeFilterTab === "cuisine" && {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => setActiveFilterTab("cuisine")}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: colors.textSecondary },
                    activeFilterTab === "cuisine" && styles.filterTabTextActive,
                  ]}
                >
                  {t.home.cuisine}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  { backgroundColor: colors.tag },
                  activeFilterTab === "service" && {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => setActiveFilterTab("service")}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: colors.textSecondary },
                    activeFilterTab === "service" && styles.filterTabTextActive,
                  ]}
                >
                  {t.home.service}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  { backgroundColor: colors.tag },
                  activeFilterTab === "ambiance" && {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => setActiveFilterTab("ambiance")}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: colors.textSecondary },
                    activeFilterTab === "ambiance" &&
                      styles.filterTabTextActive,
                  ]}
                >
                  {t.home.vibe}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterOptions}
              contentContainerStyle={styles.filterOptionsContent}
            >
              {activeFilterTab === "cuisine" &&
                cuisineTypes.map((cuisine) => (
                  <TouchableOpacity
                    key={cuisine}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: colors.tag,
                        borderColor: colors.borderSecondary,
                      },
                      selectedCuisines.includes(cuisine) && {
                        backgroundColor: colors.accentLight,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => toggleCuisine(cuisine)}
                  >
                    {CUISINE_IMAGES[cuisine] && (
                      <ExpoImage
                        source={{ uri: CUISINE_IMAGES[cuisine] }}
                        style={styles.filterChipImage}
                        contentFit="cover"
                      />
                    )}
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: colors.textSecondary },
                        selectedCuisines.includes(cuisine) && {
                          color: colors.primary,
                          fontWeight: "600" as const,
                        },
                      ]}
                    >
                      {t.cuisineTypes[cuisine] || cuisine}
                    </Text>
                  </TouchableOpacity>
                ))}

              {activeFilterTab === "service" &&
                serviceStyles.map((service) => (
                  <TouchableOpacity
                    key={service}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: colors.tag,
                        borderColor: colors.borderSecondary,
                      },
                      selectedServices.includes(service) && {
                        backgroundColor: colors.accentLight,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => toggleService(service)}
                  >
                    {SERVICE_IMAGES[service] && (
                      <ExpoImage
                        source={{ uri: SERVICE_IMAGES[service] }}
                        style={styles.filterChipImage}
                        contentFit="cover"
                      />
                    )}
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: colors.textSecondary },
                        selectedServices.includes(service) && {
                          color: colors.primary,
                          fontWeight: "600" as const,
                        },
                      ]}
                    >
                      {t.serviceTypes[service] || service}
                    </Text>
                  </TouchableOpacity>
                ))}

              {activeFilterTab === "ambiance" &&
                ambianceTypes.map((ambiance) => (
                  <TouchableOpacity
                    key={ambiance}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: colors.tag,
                        borderColor: colors.borderSecondary,
                      },
                      selectedAmbiances.includes(ambiance) && {
                        backgroundColor: colors.accentLight,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => toggleAmbiance(ambiance)}
                  >
                    {VIBE_IMAGES[ambiance] && (
                      <ExpoImage
                        source={{ uri: VIBE_IMAGES[ambiance] }}
                        style={styles.filterChipImage}
                        contentFit="cover"
                      />
                    )}
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: colors.textSecondary },
                        selectedAmbiances.includes(ambiance) && {
                          color: colors.primary,
                          fontWeight: "600" as const,
                        },
                      ]}
                    >
                      {t.ambianceTypes[ambiance] || ambiance}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            {activeFilterCount > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text
                  style={[styles.clearButtonText, { color: colors.primary }]}
                >
                  {t.home.clearAllFilters}
                </Text>
              </TouchableOpacity>
            )}
        </Animated.View>

        <FlatList
          ref={flatListRef}
          data={filteredAndSortedRestaurants}
          keyExtractor={(item) => item.id}
          renderItem={useCallback(({ item: restaurant, index }: { item: Restaurant & { distance: number; randomValue: number }; index: number }) => (
            <RestaurantCard 
              restaurant={restaurant} 
              distance={restaurant.distance}
              showDistance={isNearbyEnabled}
              isFirstCard={index === 0}
              isScrolled={isScrolled}
              showDiscount={isDiscountActive(restaurant)}
            />
          ), [isNearbyEnabled, isScrolled, isDiscountActive])}
          ListHeaderComponent={
            <Text style={[
              styles.resultsText, 
              { color: colors.textSecondary },
              isScrolled && styles.resultsTextScrolled
            ]}>
              {filteredAndSortedRestaurants.length}{" "}
              {filteredAndSortedRestaurants.length === 1
                ? t.home.restaurant
                : t.home.restaurants}
              {isNearbyEnabled &&
                sortBy === "distance" &&
                ` ${t.home.sortedByDistance}`}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                {t.home.noRestaurantsFound}
              </Text>
              <Text
                style={[styles.emptyStateText, { color: colors.textSecondary }]}
              >
                {t.home.adjustFilters}
              </Text>
            </View>
          }
          contentContainerStyle={[styles.scrollContent, isScrolled && styles.scrollContentScrolled]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={3}
          updateCellsBatchingPeriod={50}
          initialNumToRender={4}
          windowSize={5}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#1a1a1a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  logoButton: {
    width: 56,
    height: 56,
  },
  logoImage: {
    width: 56,
    height: 56,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  searchContainerScrolled: {
    paddingBottom: 4,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
  },
  clearSearchButton: {
    padding: 4,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative" as const,
  },
  filterBadge: {
    position: "absolute" as const,
    top: -4,
    right: -4,
    backgroundColor: "#FF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700" as const,
  },
  locationSearchContainer: {
    flexDirection: "column",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
    borderBottomWidth: 1,
    overflow: "hidden" as const,
  },
  filterButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  nearbyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  nearbyButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  nearbyButtonTextActive: {
    color: "#fff",
  },
  openNowButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  openNowButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
    overflow: "hidden" as const,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  sortOptions: {
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sortChipDisabled: {
    opacity: 0.5,
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  sortChipTextActive: {
    color: "#fff",
    fontWeight: "600" as const,
  },
  sortChipTextDisabled: {
    color: "#999",
  },
  clearSortChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  clearSortChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  filtersPanel: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterTabs: {
    maxHeight: 44,
    marginBottom: 12,
  },
  filterTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  filterTabTextActive: {
    color: "#fff",
  },
  filterOptions: {
    maxHeight: 44,
  },
  filterOptionsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  clearButton: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 0,
  },
  scrollContentScrolled: {
    paddingTop: 4,
  },
  resultsText: {
    fontSize: 14,
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 12,
    fontWeight: "500" as const,
  },
  resultsTextScrolled: {
    marginTop: 0,
    marginBottom: 4,
  },
  distanceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginTop: -12,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  distanceText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 20,
  },
  modalContent: {
    width: Platform.OS === 'web' ? 340 : 360,
    alignSelf: "center" as const,
    position: "relative" as const,
  },
  closeButton: {
    position: "absolute" as const,
    top: -40,
    right: 0,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  adContainer: {
    borderRadius: 20,
    overflow: "hidden" as const,
    backgroundColor: "#fff",
    alignSelf: "center" as const,
  },
  adImage: {
    width: Platform.OS === 'web' ? 340 : 360,
    height: 400,
    backgroundColor: "#f0f0f0",
  },
  adImagePlaceholder: {
    width: Platform.OS === 'web' ? 340 : 360,
    height: 400,
    backgroundColor: "#f0f0f0",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  adImagePlaceholderText: {
    fontSize: 16,
    color: "#999",
    fontWeight: "600" as const,
  },
  adImagePlaceholderSubtext: {
    fontSize: 12,
    color: "#aaa",
  },
  adTextContainer: {
    padding: 20,
    backgroundColor: "#fff",
  },
  adTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#1a1a1a",
    marginBottom: 8,
  },
  adSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  adPaginationContainer: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
    marginTop: 16,
  },
  adPaginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  adPaginationDotActive: {
    backgroundColor: "#fff",
    width: 24,
  },
});
