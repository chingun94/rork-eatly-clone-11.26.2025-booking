import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { mockAnalytics, mockTopReviewers, mockCategoryTrends } from '@/mocks/admin-data';

export default function Analytics() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{mockAnalytics.userGrowth.total}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
            <Text style={styles.statChange}>+{mockAnalytics.userGrowth.monthly} this month</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{mockAnalytics.reviews.total}</Text>
            <Text style={styles.statLabel}>Total Reviews</Text>
            <Text style={styles.statChange}>+{mockAnalytics.reviews.thisMonth} this month</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{mockAnalytics.restaurants.verified}</Text>
            <Text style={styles.statLabel}>Verified Restaurants</Text>
            <Text style={styles.statChange}>{mockAnalytics.restaurants.pending} pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>⭐ {mockAnalytics.reviews.averageRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Average Rating</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Reviewers</Text>
        {mockTopReviewers.map((reviewer, index) => (
          <View key={reviewer.userId} style={styles.reviewerCard}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <View style={styles.reviewerInfo}>
              <Text style={styles.reviewerName}>{reviewer.userName}</Text>
              <Text style={styles.reviewerStats}>{reviewer.reviewCount} reviews • {reviewer.totalPoints} points</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category Trends</Text>
        {mockCategoryTrends.map((trend) => (
          <View key={trend.category} style={styles.trendCard}>
            <Text style={styles.trendCategory}>{trend.category}</Text>
            <View style={styles.trendStats}>
              <Text style={styles.trendCount}>{trend.count} restaurants</Text>
              <Text style={[styles.trendGrowth, { color: '#10B981' }]}>+{trend.growth}%</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700' as const, color: '#fff', marginBottom: 16 },
  statsGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 12 },
  statCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#333', width: '48%' },
  statValue: { fontSize: 28, fontWeight: '700' as const, color: '#fff', marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#999', marginBottom: 4 },
  statChange: { fontSize: 12, color: '#10B981' },
  reviewerCard: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#333' },
  rank: { fontSize: 24, fontWeight: '700' as const, color: '#FF6B35', marginRight: 16, width: 40 },
  reviewerInfo: { flex: 1 },
  reviewerName: { fontSize: 16, fontWeight: '600' as const, color: '#fff', marginBottom: 4 },
  reviewerStats: { fontSize: 14, color: '#999' },
  trendCard: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#333' },
  trendCategory: { fontSize: 16, fontWeight: '600' as const, color: '#fff' },
  trendStats: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
  trendCount: { fontSize: 14, color: '#999' },
  trendGrowth: { fontSize: 14, fontWeight: '600' as const },
  footer: { height: 32 },
});
