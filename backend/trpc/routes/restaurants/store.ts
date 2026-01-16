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

class RestaurantStore {
  private restaurants: Restaurant[] = [];
  private lastUpdate: number = 0;

  getAll(): Restaurant[] {
    console.log('RestaurantStore: Getting all restaurants. Count:', this.restaurants.length);
    return this.restaurants;
  }

  setAll(restaurants: Restaurant[]): void {
    const now = Date.now();
    console.log('RestaurantStore: Setting all restaurants. Incoming:', restaurants.length, 'Current:', this.restaurants.length);
    
    if (restaurants.length === 0 && this.restaurants.length === 0) {
      console.log('RestaurantStore: Both incoming and current data are empty, nothing to do');
      return;
    }
    
    if (restaurants.length > 0) {
      console.log('RestaurantStore: Merging incoming data with existing data');
      const mergedMap = new Map<string, Restaurant>();
      
      this.restaurants.forEach(r => mergedMap.set(r.id, r));
      restaurants.forEach(r => mergedMap.set(r.id, r));
      
      this.restaurants = Array.from(mergedMap.values());
      this.lastUpdate = now;
      console.log('RestaurantStore: Merge complete. Final count:', this.restaurants.length);
    } else {
      console.log('RestaurantStore: Empty sync request received, keeping existing backend data');
    }
  }

  add(restaurant: Restaurant): void {
    this.restaurants = [restaurant, ...this.restaurants];
    this.lastUpdate = Date.now();
  }

  update(id: string, updates: Partial<Restaurant>): void {
    this.restaurants = this.restaurants.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    this.lastUpdate = Date.now();
  }

  delete(id: string): void {
    this.restaurants = this.restaurants.filter((r) => r.id !== id);
    this.lastUpdate = Date.now();
  }
}

export const restaurantStore = new RestaurantStore();
