import { Restaurant, Review } from './restaurant';
import { User } from './user';

export interface AdminUser {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: 'super_admin' | 'support' | 'sales' | 'developer';
  createdAt: string;
}

export interface UserActivity {
  reviewCount: number;
  pointsEarned: number;
  rewardsRedeemed: number;
  lastActive: string;
  flaggedContent: number;
}

export interface UserWithActivity extends User {
  activity: UserActivity;
  status: 'active' | 'suspended' | 'blocked';
  suspendedUntil?: string;
  suspensionReason?: string;
}

export interface RestaurantVerification {
  status: 'verified' | 'unverified' | 'pending';
  verifiedAt?: string;
  verifiedBy?: string;
  claimRequestedBy?: string;
  claimRequestedAt?: string;
}

export interface RestaurantWithMeta extends Restaurant {
  verification: RestaurantVerification;
  isFeatured: boolean;
  featuredUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewWithMeta extends Review {
  restaurantId: string;
  restaurantName: string;
  status: 'approved' | 'pending' | 'rejected';
  flagged: boolean;
  flagReason?: string;
  moderatedBy?: string;
  moderatedAt?: string;
}

export interface RewardRule {
  id: string;
  action: 'review' | 'photo_upload' | 'first_review' | 'daily_login';
  points: number;
  description: string;
  enabled: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  pointsRequired: number;
  value: number;
  currency: string;
  expiresAt: string;
  maxRedemptions: number;
  currentRedemptions: number;
  enabled: boolean;
  createdAt: string;
}

export interface RewardRedemption {
  id: string;
  userId: string;
  userName: string;
  couponId: string;
  couponCode: string;
  pointsSpent: number;
  status: 'pending' | 'approved' | 'rejected' | 'used';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
}

export interface AdCampaign {
  id: string;
  restaurantId: string;
  restaurantName: string;
  type: 'banner' | 'featured_listing' | 'category_spotlight' | 'popup';
  status: 'pending' | 'active' | 'paused' | 'completed' | 'rejected';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  createdAt: string;
  imageUrl?: string;
}

export interface AnalyticsOverview {
  userGrowth: {
    daily: number;
    weekly: number;
    monthly: number;
    total: number;
  };
  reviews: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    averageRating: number;
  };
  restaurants: {
    total: number;
    verified: number;
    pending: number;
  };
  rewards: {
    totalPointsIssued: number;
    totalRedemptions: number;
    activeUsers: number;
  };
}

export interface TopReviewer {
  userId: string;
  userName: string;
  reviewCount: number;
  totalPoints: number;
  avatar?: string;
}

export interface CategoryTrend {
  category: string;
  count: number;
  growth: number;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  targetAudience: 'all' | 'users' | 'restaurants';
  scheduledFor?: string;
  sentAt?: string;
  status: 'draft' | 'scheduled' | 'sent';
  recipientCount: number;
  openRate?: number;
}

export interface AppSettings {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'json';
  description: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CMSContent {
  id: string;
  type: 'faq' | 'blog' | 'announcement' | 'legal';
  title: string;
  content: string;
  slug: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  author: string;
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  type: 'bug' | 'feature_request' | 'complaint' | 'suggestion';
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}
