export type CuisineType = 
  | 'Italian'
  | 'Japanese'
  | 'Mexican'
  | 'French'
  | 'American'
  | 'Chinese'
  | 'Thai'
  | 'Indian'
  | 'Mediterranean'
  | 'Korean'
  | 'European'
  | 'Turkish'
  | 'Vegetarian/Vegan'
  | 'Hot-Pot'
  | 'Mongolian'
  | 'Asian'
  | 'Ramen';

export type ServiceStyle = 
  | 'Fine Dining'
  | 'Casual Dining'
  | 'Fast Casual'
  | 'Cafe'
  | 'Buffet';

export type Ambiance = 
  | 'Romantic'
  | 'Business Lunch'
  | 'Family Friendly'
  | 'Date Night'
  | 'Trendy'
  | 'Cozy'
  | 'Lively'
  | 'Quiet'
  | 'Outdoor Seating'
  | 'Late Night'
  | 'VIP Room';

export interface DetailedRatings {
  food: number;
  service: number;
  ambience: number;
  value: number;
  cleanliness: number;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  photos?: string[];
  detailedRatings?: DetailedRatings;
}

export interface Location {
  latitude: number;
  longitude: number;
  city: string;
  neighborhood?: string;
}

export interface FeaturedTimeline {
  startDate: string;
  endDate: string;
  rank?: number;
}

export interface CategoryFeatured {
  cuisine?: FeaturedTimeline;
  serviceStyle?: FeaturedTimeline;
  ambiance?: Record<string, FeaturedTimeline>;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: CuisineType[];
  serviceStyle: ServiceStyle;
  ambiance: Ambiance[];
  rating: number;
  reviewCount: number;
  priceLevel: number;
  image: string;
  images?: string[];
  description: string;
  address: string;
  phone: string;
  hours: string;
  reviews: Review[];
  location: Location;
  isFeatured?: boolean;
  featuredTimeline?: FeaturedTimeline;
  categoryFeatured?: CategoryFeatured;
  isVerified?: boolean;
  hasOutdoorTerrace?: boolean;
  franchiseId?: string;
  isFranchiseParent?: boolean;
  parentRestaurantId?: string;
  isWeekSpecial?: boolean;
  weekSpecialTimeline?: FeaturedTimeline;
  hasDiscount?: boolean;
  discountTimeline?: FeaturedTimeline;
  discountAmount?: string;
  discountDescription?: string;
  isTop10?: boolean;
  top10Timeline?: FeaturedTimeline;
  top10Rank?: number;
  weekSpecialOrder?: number;
  discountOrder?: number;
  top10Order?: number;
}
