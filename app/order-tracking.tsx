import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { OrderStatus } from '@/types/delivery';
import { Phone, MessageCircle, Package, Truck, CheckCircle, Clock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapView, Marker } from '@/components/MapComponents';

const ORDER_STATUS_CONFIG = {
  pending: { label: 'Order Placed', icon: Package, color: '#6B7280' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: '#10B981' },
  preparing: { label: 'Preparing', icon: Clock, color: '#F59E0B' },
  ready: { label: 'Ready for Pickup', icon: Package, color: '#8B5CF6' },
  picked_up: { label: 'Picked Up', icon: Truck, color: '#3B82F6' },
  in_transit: { label: 'On the Way', icon: Truck, color: '#3B82F6' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: '#10B981' },
  cancelled: { label: 'Cancelled', icon: Package, color: '#EF4444' },
  rejected: { label: 'Rejected', icon: Package, color: '#EF4444' },
};

export default function OrderTrackingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  const orderQuery = trpc.orders.get.useQuery(
    { id: orderId! },
    {
      enabled: !!orderId,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) return false;
        if (['delivered', 'cancelled', 'rejected'].includes(data.status)) {
          return false;
        }
        return 3000;
      },
    }
  );

  const order = orderQuery.data;

  useEffect(() => {
    if (order?.driverLocation) {
      setMapRegion({
        latitude: order.driverLocation.latitude,
        longitude: order.driverLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }, [order?.driverLocation]);

  const getOrderProgress = (status: OrderStatus): number => {
    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered'];
    const index = statusOrder.indexOf(status);
    return ((index + 1) / statusOrder.length) * 100;
  };

  const handleCallDriver = () => {
    if (order?.driver?.phone) {
      Linking.openURL(`tel:${order.driver.phone}`);
    }
  };

  const handleCallRestaurant = () => {
    if (order?.contactPhone) {
      Linking.openURL(`tel:${order.contactPhone}`);
    }
  };

  if (orderQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status];
  const StatusIcon = statusConfig.icon;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: `Order ${order.orderNumber}` }} />

      <ScrollView style={styles.scrollView}>
        <View style={styles.statusCard}>
          <View style={[styles.statusIcon, { backgroundColor: `${statusConfig.color}20` }]}>
            <StatusIcon size={32} color={statusConfig.color} />
          </View>
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${getOrderProgress(order.status)}%`, backgroundColor: statusConfig.color },
              ]}
            />
          </View>
          {order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'rejected' && (
            <Text style={styles.estimatedTime}>
              Estimated delivery: {new Date(order.estimatedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>

        {order.driverLocation && order.status !== 'delivered' && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={mapRegion}
              showsUserLocation
            >
              <Marker
                coordinate={{
                  latitude: order.driverLocation.latitude,
                  longitude: order.driverLocation.longitude,
                }}
                title="Driver Location"
              />
              <Marker
                coordinate={{
                  latitude: order.deliveryAddress.latitude || 37.78825,
                  longitude: order.deliveryAddress.longitude || -122.4324,
                }}
                title="Delivery Address"
                pinColor="green"
              />
            </MapView>
          </View>
        )}

        {order.driver && (
          <View style={styles.driverCard}>
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverInitial}>{order.driver.name[0]}</Text>
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{order.driver.name}</Text>
                <Text style={styles.driverVehicle}>
                  {order.driver.vehicleType} • {order.driver.vehicleNumber}
                </Text>
                <View style={styles.driverRating}>
                  <Text style={styles.ratingText}>⭐ {order.driver.rating.toFixed(1)}</Text>
                  <Text style={styles.deliveryCount}>
                    {order.driver.totalDeliveries} deliveries
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.driverActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCallDriver}>
                <Phone size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MessageCircle size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.orderDetails}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Number</Text>
            <Text style={styles.detailValue}>{order.orderNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Restaurant</Text>
            <Text style={styles.detailValue}>{order.restaurantName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery Address</Text>
            <Text style={styles.detailValue}>{order.deliveryAddress.street}</Text>
          </View>
          {order.orderNotes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{order.orderNotes}</Text>
            </View>
          )}
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.item}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.customizations && item.customizations.length > 0 && (
                    <Text style={styles.itemCustomization}>
                      {item.customizations
                        .map((c) => c.selectedOptions.map((o) => o.name).join(', '))
                        .join(', ')}
                    </Text>
                  )}
                </View>
              </View>
              <Text style={styles.itemPrice}>${item.subtotal.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${order.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>${order.deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${order.tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.contactSection}>
          <TouchableOpacity style={styles.contactButton} onPress={handleCallRestaurant}>
            <Phone size={20} color="#FF6B35" />
            <Text style={styles.contactButtonText}>Call Restaurant</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#FFF',
    padding: 24,
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  estimatedTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  mapContainer: {
    height: 250,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  map: {
    flex: 1,
  },
  driverCard: {
    backgroundColor: '#FFF',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverInitial: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  driverVehicle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginRight: 8,
  },
  deliveryCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  driverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderDetails: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500' as const,
  },
  itemsSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  itemQuantity: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  itemName: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  itemCustomization: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  summarySection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FF6B35',
  },
  contactSection: {
    padding: 16,
    marginBottom: 24,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6B35',
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FF6B35',
  },
});
