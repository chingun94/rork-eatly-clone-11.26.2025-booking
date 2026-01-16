import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, ChevronDown } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { CuisineType, ServiceStyle, Ambiance } from '@/types/restaurant';
import React, { useState, useMemo } from "react";
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { RestaurantCard } from '@/components/RestaurantCard';

interface CategoryCardProps {
  title: string;
  count: number;
  icon?: React.ReactNode;
  image?: string;
  onPress: () => void;
  color: string;
}

function CategoryCard({ title, count, icon, image, onPress, color }: CategoryCardProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  
  return (
    <TouchableOpacity style={[styles.categoryCard, { backgroundColor: colors.card }]} onPress={onPress} activeOpacity={0.7}>
      {image ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.categoryImage} />
        </View>
      ) : (
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
      )}
      <View style={styles.categoryInfo}>
        <Text style={[styles.categoryTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>{count} {t.explore.restaurants}</Text>
      </View>
    </TouchableOpacity>
  );
}

const CUISINE_IMAGES: Record<string, string> = {
  'Italian': 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=400',
  'Japanese': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
  'Mexican': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
  'French': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
  'American': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
  'Chinese': 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=400',
  'Thai': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400',
  'Indian': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
  'European': 'https://images.unsplash.com/photo-1535473895227-bdecb20fb157?w=400',
  'Turkish': 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400',
  'Vegetarian/Vegan': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
  'Hot-Pot': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400',
  'Mongolian': 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=400',
  'Asian': 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=400',
  'Ramen': 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400',
};

const SERVICE_IMAGES: Record<string, string> = {
  'Fine Dining': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
  'Casual Dining': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
  'Fast Casual': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
  'Cafe': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
  'Buffet': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
};

const VIBE_IMAGES: Record<string, string> = {
  'Romantic': 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400',
  'Family Friendly': 'https://images.unsplash.com/photo-1543007631-283050bb3e8c?w=400',
  'Trendy': 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400',
  'Cozy': 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=400',
  'Lively': 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=400',
  'Date Night': 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400',
};

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { restaurants, isWeekSpecialActive, isDiscountActive, isTop10Active } = useRestaurants();
  
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const weekSpecialRestaurants = useMemo(() => {
    return restaurants
      .filter(r => !r.parentRestaurantId && isWeekSpecialActive(r))
      .sort((a, b) => {
        const orderA = a.weekSpecialOrder ?? 999;
        const orderB = b.weekSpecialOrder ?? 999;
        return orderA - orderB;
      })
      .slice(0, 5);
  }, [restaurants, isWeekSpecialActive]);

  const discountRestaurants = useMemo(() => {
    return restaurants
      .filter(r => !r.parentRestaurantId && isDiscountActive(r))
      .sort((a, b) => {
        const orderA = a.discountOrder ?? 999;
        const orderB = b.discountOrder ?? 999;
        return orderA - orderB;
      })
      .slice(0, 5);
  }, [restaurants, isDiscountActive]);

  const top10Restaurants = useMemo(() => {
    return restaurants
      .filter(r => !r.parentRestaurantId && isTop10Active(r))
      .sort((a, b) => {
        const orderA = a.top10Order ?? 999;
        const orderB = b.top10Order ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.top10Rank || 999) - (b.top10Rank || 999);
      })
      .slice(0, 5);
  }, [restaurants, isTop10Active]);

  const cuisineTypes: CuisineType[] = [
    'Italian',
    'Japanese',
    'Mexican',
    'French',
    'American',
    'Chinese',
    'Thai',
    'Indian',
    'European',
    'Turkish',
    'Vegetarian/Vegan',
    'Hot-Pot',
    'Mongolian',
    'Asian',
    'Ramen',
  ];

  const serviceStyles: ServiceStyle[] = [
    'Fine Dining',
    'Casual Dining',
    'Fast Casual',
    'Cafe',
    'Buffet',
  ];

  const vibeCategories: Ambiance[] = [
    'Romantic',
    'Family Friendly',
    'Trendy',
    'Cozy',
    'Lively',
    'Date Night',
  ];

  const getCuisineCount = (cuisine: CuisineType) => {
    return restaurants.filter((r) => 
      !r.parentRestaurantId &&
      (Array.isArray(r.cuisine) 
        ? r.cuisine.includes(cuisine) 
        : r.cuisine === cuisine)
    ).length;
  };

  const getServiceCount = (service: ServiceStyle) => {
    return restaurants.filter((r) => !r.parentRestaurantId && r.serviceStyle === service).length;
  };

  const getVibeCount = (vibe: Ambiance) => {
    return restaurants.filter((r) => !r.parentRestaurantId && r.ambiance.includes(vibe)).length;
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.title, { color: colors.text }]}>{t.explore.title}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.explore.subtitle}</Text>
          </View>
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/h2zp1kdqeuw3ta2wxtb7f' }} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {weekSpecialRestaurants.length > 0 && (
          <View style={styles.featuredSection}>
            <View style={styles.featuredHeader}>
              <Text style={[styles.featuredTitle, { color: colors.text }]}>
                {language === 'mn' ? 'Энэ 7 хоногт онцлох' : "This Week's Special"}
              </Text>
              <TouchableOpacity 
                onPress={() => router.push({
                  pathname: '/explore/results',
                  params: { type: 'weekSpecial' },
                } as any)}
                style={styles.viewAllButton}
              >
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  {language === 'mn' ? 'Бүгдийг харах' : 'View All'}
                </Text>
                <ChevronRight size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {weekSpecialRestaurants.map((restaurant) => (
                <View key={restaurant.id} style={styles.horizontalCard}>
                  <RestaurantCard restaurant={restaurant} compact />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {discountRestaurants.length > 0 && (
          <View style={styles.featuredSection}>
            <View style={styles.featuredHeader}>
              <Text style={[styles.featuredTitle, { color: colors.text }]}>
                {language === 'mn' ? 'Хөнгөлөлттэй' : 'Discount'}
              </Text>
              <TouchableOpacity 
                onPress={() => router.push({
                  pathname: '/explore/results',
                  params: { type: 'discount' },
                } as any)}
                style={styles.viewAllButton}
              >
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  {language === 'mn' ? 'Бүгдийг харах' : 'View All'}
                </Text>
                <ChevronRight size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {discountRestaurants.map((restaurant) => (
                <View key={restaurant.id} style={styles.horizontalCard}>
                  <RestaurantCard restaurant={restaurant} compact />
                  {restaurant.discountAmount && (
                    <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.discountText}>{restaurant.discountAmount}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {top10Restaurants.length > 0 && (
          <View style={styles.featuredSection}>
            <View style={styles.featuredHeader}>
              <Text style={[styles.featuredTitle, { color: colors.text }]}>
                {language === 'mn' ? 'Eatly-н Топ 10' : "Eatly's Top 10 Restaurants"}
              </Text>
              <TouchableOpacity 
                onPress={() => router.push({
                  pathname: '/explore/results',
                  params: { type: 'top10' },
                } as any)}
                style={styles.viewAllButton}
              >
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  {language === 'mn' ? 'Бүгдийг харах' : 'View All'}
                </Text>
                <ChevronRight size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {top10Restaurants.map((restaurant) => (
                <View key={restaurant.id} style={styles.horizontalCard}>
                  <RestaurantCard restaurant={restaurant} compact />
                  {restaurant.top10Rank && (
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{restaurant.top10Rank}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.categoriesContainer, { backgroundColor: colors.card }]}>
          <TouchableOpacity 
            style={styles.collapsibleHeader}
            onPress={() => toggleSection('cuisine')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=100' }} 
                style={styles.sectionIcon}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.explore.cuisineTypes}</Text>
            </View>
            {expandedSection === 'cuisine' ? (
              <ChevronDown size={24} color={colors.text} />
            ) : (
              <ChevronRight size={24} color={colors.text} />
            )}
          </TouchableOpacity>
          
          {expandedSection === 'cuisine' && (
            <View style={styles.twoColumnGrid}>
              {cuisineTypes.map((cuisine) => (
                <View key={cuisine} style={styles.halfWidth}>
                  <CategoryCard
                    title={t.cuisineTypes[cuisine] || cuisine}
                    count={getCuisineCount(cuisine)}
                    image={CUISINE_IMAGES[cuisine]}
                    color={colors.primary}
                    onPress={() => {
                      router.push({
                        pathname: '/explore/results',
                        params: { type: 'cuisine', value: cuisine },
                      } as any);
                    }}
                  />
                </View>
              ))}
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity 
            style={styles.collapsibleHeader}
            onPress={() => toggleSection('service')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=100' }} 
                style={styles.sectionIcon}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.explore.serviceType}</Text>
            </View>
            {expandedSection === 'service' ? (
              <ChevronDown size={24} color={colors.text} />
            ) : (
              <ChevronRight size={24} color={colors.text} />
            )}
          </TouchableOpacity>
          
          {expandedSection === 'service' && (
            <View style={styles.twoColumnGrid}>
              {serviceStyles.map((service) => (
                <View key={service} style={styles.halfWidth}>
                  <CategoryCard
                    title={t.serviceTypes[service] || service}
                    count={getServiceCount(service)}
                    image={SERVICE_IMAGES[service]}
                    color="#D97706"
                    onPress={() => {
                      router.push({
                        pathname: '/explore/results',
                        params: { type: 'service', value: service },
                      } as any);
                    }}
                  />
                </View>
              ))}
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity 
            style={styles.collapsibleHeader}
            onPress={() => toggleSection('vibe')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=100' }} 
                style={styles.sectionIcon}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.explore.vibeAtmosphere}</Text>
            </View>
            {expandedSection === 'vibe' ? (
              <ChevronDown size={24} color={colors.text} />
            ) : (
              <ChevronRight size={24} color={colors.text} />
            )}
          </TouchableOpacity>
          
          {expandedSection === 'vibe' && (
            <View style={styles.twoColumnGrid}>
              {vibeCategories.map((vibe) => (
                <View key={vibe} style={styles.halfWidth}>
                  <CategoryCard
                    title={t.ambianceTypes[vibe] || vibe}
                    count={getVibeCount(vibe)}
                    image={VIBE_IMAGES[vibe]}
                    color="#DC2626"
                    onPress={() => {
                      router.push({
                        pathname: '/explore/results',
                        params: { type: 'ambiance', value: vibe },
                      } as any);
                    }}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
  },
  logoContainer: {
    width: 80,
    height: 40,
    marginLeft: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 28,
  },
  featuredSection: {
    gap: 16,
    marginBottom: 8,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  featuredTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  horizontalScroll: {
    gap: 12,
    paddingRight: 16,
  },
  horizontalCard: {
    width: 200,
    position: 'relative' as const,
  },
  discountBadge: {
    position: 'absolute' as const,
    top: 8,
    left: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 10,
  },
  discountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800' as const,
  },
  rankBadge: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rankText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700' as const,
  },
  categoriesContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  twoColumnGrid: {
    gap: 12,
    marginTop: 12,
  },
  halfWidth: {
    width: '100%',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  imageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden' as const,
    marginRight: 12,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center' as const,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 2,
    flexWrap: 'wrap' as const,
  },
  categoryCount: {
    fontSize: 11,
  },
});
