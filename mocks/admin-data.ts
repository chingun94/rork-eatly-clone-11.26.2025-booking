import {
  UserWithActivity,
  RestaurantWithMeta,
  ReviewWithMeta,
  RewardRule,
  Coupon,
  RewardRedemption,
  AdCampaign,
  AnalyticsOverview,
  TopReviewer,
  CategoryTrend,
  PushNotification,
  AppSettings,
  CMSContent,
  Feedback,
} from '@/types/admin';

export const mockUsersWithActivity: UserWithActivity[] = [
  {
    id: 'user_1',
    name: 'John Doe',
    email: 'john@example.com',
    joinDate: '2024-01-15',
    status: 'active',
    activity: {
      reviewCount: 15,
      pointsEarned: 750,
      rewardsRedeemed: 2,
      lastActive: '2024-03-01',
      flaggedContent: 0,
    },
  },
  {
    id: 'user_2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    joinDate: '2024-02-20',
    status: 'active',
    activity: {
      reviewCount: 8,
      pointsEarned: 400,
      rewardsRedeemed: 1,
      lastActive: '2024-02-28',
      flaggedContent: 0,
    },
  },
  {
    id: 'user_3',
    name: 'Спамер Алерт',
    email: 'spammer@example.com',
    joinDate: '2024-03-01',
    status: 'suspended',
    suspendedUntil: '2024-04-01',
    suspensionReason: 'Posting spam reviews',
    activity: {
      reviewCount: 3,
      pointsEarned: 0,
      rewardsRedeemed: 0,
      lastActive: '2024-03-01',
      flaggedContent: 5,
    },
  },
];

export const mockReviewsWithMeta: ReviewWithMeta[] = [
  {
    id: 'review_1',
    restaurantId: '1',
    restaurantName: 'La Bella Vita',
    author: 'John Doe',
    rating: 5,
    date: '2024-03-01',
    comment: 'Amazing Italian food!',
    status: 'approved',
    flagged: false,
  },
  {
    id: 'review_2',
    restaurantId: '2',
    restaurantName: 'Sushi Paradise',
    author: 'Jane Smith',
    rating: 1,
    date: '2024-03-02',
    comment: 'Terrible service and bad food!',
    status: 'pending',
    flagged: true,
    flagReason: 'Potentially fake negative review',
  },
];

export const mockRewardRules: RewardRule[] = [
  {
    id: 'rule_1',
    action: 'review',
    points: 50,
    description: 'Write a review',
    enabled: true,
  },
  {
    id: 'rule_2',
    action: 'photo_upload',
    points: 25,
    description: 'Upload a photo with review',
    enabled: true,
  },
  {
    id: 'rule_3',
    action: 'first_review',
    points: 100,
    description: 'Write your first review',
    enabled: true,
  },
  {
    id: 'rule_4',
    action: 'daily_login',
    points: 5,
    description: 'Daily login bonus',
    enabled: false,
  },
];

export const mockCoupons: Coupon[] = [
  {
    id: 'coupon_1',
    code: 'EATLY500',
    title: '₮5,000 Discount',
    description: 'Get ₮5,000 off your next meal',
    pointsRequired: 500,
    value: 5000,
    currency: 'MNT',
    expiresAt: '2024-12-31',
    maxRedemptions: 100,
    currentRedemptions: 25,
    enabled: true,
    createdAt: '2024-01-01',
  },
  {
    id: 'coupon_2',
    code: 'EATLY1000',
    title: '₮10,000 Discount',
    description: 'Get ₮10,000 off your next meal',
    pointsRequired: 1000,
    value: 10000,
    currency: 'MNT',
    expiresAt: '2024-12-31',
    maxRedemptions: 50,
    currentRedemptions: 8,
    enabled: true,
    createdAt: '2024-01-01',
  },
];

export const mockRedemptions: RewardRedemption[] = [
  {
    id: 'redemption_1',
    userId: 'user_1',
    userName: 'John Doe',
    couponId: 'coupon_1',
    couponCode: 'EATLY500',
    pointsSpent: 500,
    status: 'pending',
    requestedAt: '2024-03-01',
  },
  {
    id: 'redemption_2',
    userId: 'user_2',
    userName: 'Jane Smith',
    couponId: 'coupon_1',
    couponCode: 'EATLY500',
    pointsSpent: 500,
    status: 'approved',
    requestedAt: '2024-02-28',
    processedAt: '2024-02-28',
    processedBy: 'admin_1',
  },
];

export const mockAdCampaigns: AdCampaign[] = [
  {
    id: 'ad_1',
    restaurantId: '1',
    restaurantName: 'La Bella Vita',
    type: 'featured_listing',
    status: 'active',
    startDate: '2024-03-01',
    endDate: '2024-03-31',
    budget: 500000,
    spent: 125000,
    impressions: 12500,
    clicks: 350,
    conversions: 45,
    createdAt: '2024-02-25',
  },
  {
    id: 'ad_2',
    restaurantId: '2',
    restaurantName: 'Sushi Paradise',
    type: 'banner',
    status: 'pending',
    startDate: '2024-03-15',
    endDate: '2024-04-15',
    budget: 300000,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    createdAt: '2024-03-01',
  },
];

export const mockAnalytics: AnalyticsOverview = {
  userGrowth: {
    daily: 12,
    weekly: 85,
    monthly: 342,
    total: 1250,
  },
  reviews: {
    total: 3420,
    thisWeek: 56,
    thisMonth: 234,
    averageRating: 4.2,
  },
  restaurants: {
    total: 156,
    verified: 98,
    pending: 12,
  },
  rewards: {
    totalPointsIssued: 125000,
    totalRedemptions: 234,
    activeUsers: 856,
  },
};

export const mockTopReviewers: TopReviewer[] = [
  {
    userId: 'user_1',
    userName: 'John Doe',
    reviewCount: 45,
    totalPoints: 2250,
  },
  {
    userId: 'user_4',
    userName: 'Mike Johnson',
    reviewCount: 38,
    totalPoints: 1900,
  },
  {
    userId: 'user_5',
    userName: 'Sarah Williams',
    reviewCount: 32,
    totalPoints: 1600,
  },
];

export const mockCategoryTrends: CategoryTrend[] = [
  { category: 'Korean', count: 145, growth: 25 },
  { category: 'Japanese', count: 132, growth: 18 },
  { category: 'Italian', count: 98, growth: 12 },
  { category: 'BBQ', count: 87, growth: 35 },
  { category: 'Cafes', count: 76, growth: 22 },
];

export const mockNotifications: PushNotification[] = [
  {
    id: 'notif_1',
    title: 'New Feature Alert',
    body: 'Check out our new rewards program!',
    targetAudience: 'all',
    status: 'sent',
    sentAt: '2024-03-01T10:00:00Z',
    recipientCount: 1250,
    openRate: 45.2,
  },
  {
    id: 'notif_2',
    title: 'Weekend Special',
    body: 'Get 20% off at featured restaurants this weekend',
    targetAudience: 'users',
    status: 'scheduled',
    scheduledFor: '2024-03-08T09:00:00Z',
    recipientCount: 856,
  },
];

export const mockSettings: AppSettings[] = [
  {
    id: 'setting_1',
    key: 'points_per_review',
    value: '50',
    type: 'number',
    description: 'Points awarded per review',
    updatedAt: '2024-03-01',
    updatedBy: 'admin_1',
  },
  {
    id: 'setting_2',
    key: 'max_reviews_per_day',
    value: '5',
    type: 'number',
    description: 'Maximum reviews a user can post per day',
    updatedAt: '2024-02-15',
    updatedBy: 'admin_1',
  },
  {
    id: 'setting_3',
    key: 'auto_approve_reviews',
    value: 'false',
    type: 'boolean',
    description: 'Automatically approve new reviews',
    updatedAt: '2024-01-01',
    updatedBy: 'admin_1',
  },
];

export const mockCMSContent: CMSContent[] = [
  {
    id: 'cms_1',
    type: 'faq',
    title: 'How do I earn points?',
    content: 'You can earn points by writing reviews, uploading photos, and daily check-ins.',
    slug: 'how-earn-points',
    published: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    author: 'Admin',
  },
  {
    id: 'cms_2',
    type: 'legal',
    title: 'Terms of Service',
    content: 'By using Eatly, you agree to our terms...',
    slug: 'terms-of-service',
    published: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-02-01',
    author: 'Admin',
  },
];

export const mockFeedback: Feedback[] = [
  {
    id: 'feedback_1',
    userId: 'user_1',
    userName: 'John Doe',
    type: 'bug',
    subject: 'App crashes on review submission',
    message: 'The app crashes when I try to submit a review with multiple photos.',
    status: 'new',
    priority: 'high',
    createdAt: '2024-03-01',
  },
  {
    id: 'feedback_2',
    userId: 'user_2',
    userName: 'Jane Smith',
    type: 'feature_request',
    subject: 'Add filter by price range',
    message: 'Would be great to filter restaurants by price range.',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2024-02-28',
  },
];
