import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Gift, Ticket, CheckCircle, XCircle } from 'lucide-react-native';
import {
  mockRewardRules,
  mockCoupons,
  mockRedemptions,
} from '@/mocks/admin-data';
import { Coupon, RewardRedemption } from '@/types/admin';

export default function RewardsManagement() {
  const [coupons] = useState<Coupon[]>(mockCoupons);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>(mockRedemptions);

  const handleApproveRedemption = (redemption: RewardRedemption) => {
    setRedemptions((prev) =>
      prev.map((r) =>
        r.id === redemption.id
          ? {
              ...r,
              status: 'approved' as const,
              processedAt: new Date().toISOString(),
              processedBy: 'admin_1',
            }
          : r
      )
    );
    Alert.alert('Success', 'Redemption approved');
  };

  const handleRejectRedemption = (redemption: RewardRedemption) => {
    Alert.alert(
      'Reject Redemption',
      'Are you sure you want to reject this redemption?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            setRedemptions((prev) =>
              prev.map((r) =>
                r.id === redemption.id
                  ? {
                      ...r,
                      status: 'rejected' as const,
                      processedAt: new Date().toISOString(),
                      processedBy: 'admin_1',
                    }
                  : r
              )
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reward Rules</Text>
        {mockRewardRules.map((rule) => (
          <View key={rule.id} style={styles.card}>
            <View style={styles.ruleHeader}>
              <View style={styles.ruleInfo}>
                <Text style={styles.ruleAction}>{rule.action.replace('_', ' ')}</Text>
                <Text style={styles.ruleDescription}>{rule.description}</Text>
              </View>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>{rule.points} pts</Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: rule.enabled ? '#10B98120' : '#99999920',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: rule.enabled ? '#10B981' : '#999' },
                ]}
              >
                {rule.enabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Coupons</Text>
        {coupons.map((coupon) => (
          <View key={coupon.id} style={styles.card}>
            <View style={styles.couponHeader}>
              <Ticket size={24} color="#8B5CF6" />
              <View style={styles.couponInfo}>
                <Text style={styles.couponTitle}>{coupon.title}</Text>
                <Text style={styles.couponCode}>Code: {coupon.code}</Text>
                <Text style={styles.couponDesc}>{coupon.description}</Text>
              </View>
            </View>
            <View style={styles.couponStats}>
              <Text style={styles.couponStat}>
                {coupon.pointsRequired} points required
              </Text>
              <Text style={styles.couponStat}>
                {coupon.currentRedemptions}/{coupon.maxRedemptions} redeemed
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Redemptions</Text>
        {redemptions
          .filter((r) => r.status === 'pending')
          .map((redemption) => (
            <View key={redemption.id} style={styles.card}>
              <View style={styles.redemptionHeader}>
                <View style={styles.redemptionInfo}>
                  <Text style={styles.redemptionUser}>{redemption.userName}</Text>
                  <Text style={styles.redemptionCoupon}>
                    {redemption.couponCode}
                  </Text>
                  <Text style={styles.redemptionPoints}>
                    {redemption.pointsSpent} points
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApproveRedemption(redemption)}
                >
                  <CheckCircle size={16} color="#10B981" />
                  <Text style={[styles.actionText, { color: '#10B981' }]}>
                    Approve
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRejectRedemption(redemption)}
                >
                  <XCircle size={16} color="#EF4444" />
                  <Text style={[styles.actionText, { color: '#EF4444' }]}>
                    Reject
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  ruleHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  ruleInfo: {
    flex: 1,
  },
  ruleAction: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    textTransform: 'capitalize' as const,
    marginBottom: 4,
  },
  ruleDescription: {
    fontSize: 14,
    color: '#999',
  },
  pointsBadge: {
    backgroundColor: '#8B5CF620',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    height: 32,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#8B5CF6',
  },
  statusBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  couponHeader: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 12,
  },
  couponInfo: {
    flex: 1,
  },
  couponTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  couponCode: {
    fontSize: 13,
    color: '#8B5CF6',
    marginBottom: 4,
  },
  couponDesc: {
    fontSize: 14,
    color: '#999',
  },
  couponStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#333',
  },
  couponStat: {
    fontSize: 13,
    color: '#666',
  },
  redemptionHeader: {
    marginBottom: 12,
  },
  redemptionInfo: {
    gap: 4,
  },
  redemptionUser: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  redemptionCoupon: {
    fontSize: 14,
    color: '#8B5CF6',
  },
  redemptionPoints: {
    fontSize: 13,
    color: '#999',
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  approveButton: {
    backgroundColor: '#10B98110',
    borderColor: '#10B98140',
  },
  rejectButton: {
    backgroundColor: '#EF444410',
    borderColor: '#EF444440',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  footer: {
    height: 32,
  },
});
