export interface DetailedRatings {
  food: number;
  service: number;
  ambience: number;
  value: number;
  cleanliness: number;
}

export interface UserReview {
  id: string;
  restaurantId: string;
  restaurantName: string;
  rating: number;
  comment: string;
  date: string;
  photos?: string[];
  userId?: string;
  userName?: string;
  userEmail?: string;
  detailedRatings?: DetailedRatings;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  joinDate: string;
}
