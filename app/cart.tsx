import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/contexts/UserContext';
import { trpc } from '@/lib/trpc';
import { Trash2, Plus, Minus, MapPin } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CartScreen() {
  const { cart, restaurantId, removeFromCart, updateQuantity, clearCart, getCartTotal } =
    useCart();
  const { user } = useUser();
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>(user?.phone || '');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const restaurantQuery = trpc.restaurants.getAll.useQuery(undefined, {
    enabled: !!restaurantId,
  });

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (order) => {
      clearCart();
      router.push(`/order-tracking?orderId=${order.id}` as any);
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
      setIsProcessing(false);
    },
  });

  const restaurant = restaurantQuery.data?.find((r) => r.id === restaurantId);

  const subtotal = getCartTotal();
  const deliveryFee = 5.99;
  const tax = subtotal * 0.1;
  const total = subtotal + deliveryFee + tax;

  const handleCheckout = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to place an order');
      router.push('/auth' as any);
      return;
    }

    if (!deliveryAddress.trim()) {
      Alert.alert('Address Required', 'Please enter your delivery address');
      return;
    }

    if (!contactPhone.trim()) {
      Alert.alert('Phone Required', 'Please enter your contact phone number');
      return;
    }

    if (!restaurant) {
      Alert.alert('Error', 'Restaurant not found');
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        userId: user.id,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantAddress: restaurant.address,
        items: cart.map((item) => ({
          menuItemId: item.menuItem.id,
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.menuItem.price,
          customizations: item.customizations,
          specialInstructions: item.specialInstructions,
          subtotal: item.totalPrice,
        })),
        subtotal,
        deliveryFee,
        tax,
        tip: 0,
        total,
        deliveryAddress: {
          id: `ADDR${Date.now()}`,
          userId: user.id,
          label: 'Home',
          street: deliveryAddress,
          city: 'City',
          state: 'State',
          zipCode: '00000',
          latitude: 0,
          longitude: 0,
          isDefault: true,
        },
        contactPhone,
        orderNotes,
        estimatedPreparationTime: 30,
        estimatedDeliveryTime: Date.now() + 45 * 60 * 1000,
      };

      await createOrderMutation.mutateAsync(orderData);
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ title: 'Cart' }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add items to get started</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.back()}
          >
            <Text style={styles.browseButtonText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Cart',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Clear Cart', 'Remove all items from cart?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: clearCart },
                ]);
              }}
            >
              <Text style={styles.clearButton}>Clear</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{restaurant?.name}</Text>
          <Text style={styles.restaurantAddress}>{restaurant?.address}</Text>
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Items</Text>
          {cart.map((item, index) => (
            <View key={index} style={styles.cartItem}>
              {item.menuItem.image && (
                <Image
                  source={{ uri: item.menuItem.image }}
                  style={styles.itemImage}
                />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.menuItem.name}</Text>
                {item.customizations && item.customizations.length > 0 && (
                  <View style={styles.customizations}>
                    {item.customizations.map((customization, idx) => (
                      <Text key={idx} style={styles.customizationText}>
                        {customization.selectedOptions
                          .map((opt) => opt.name)
                          .join(', ')}
                      </Text>
                    ))}
                  </View>
                )}
                {item.specialInstructions && (
                  <Text style={styles.specialInstructions}>
                    Note: {item.specialInstructions}
                  </Text>
                )}
                <View style={styles.itemFooter}>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(index, item.quantity - 1)}
                    >
                      <Minus size={16} color="#FF6B35" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(index, item.quantity + 1)}
                    >
                      <Plus size={16} color="#FF6B35" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.itemPrice}>${item.totalPrice.toFixed(2)}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromCart(index)}
              >
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.deliverySection}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Delivery Address"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholderTextColor="#9CA3AF"
              multiline
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Contact Phone"
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Order Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Any special instructions for the restaurant?"
            value={orderNotes}
            onChangeText={setOrderNotes}
            multiline
            numberOfLines={3}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.checkoutButton, isProcessing && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.checkoutButtonText}>
              Place Order - ${total.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  clearButton: {
    fontSize: 16,
    color: '#EF4444',
    marginRight: 16,
    fontWeight: '600' as const,
  },
  restaurantInfo: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemsSection: {
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
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  customizations: {
    marginBottom: 4,
  },
  customizationText: {
    fontSize: 13,
    color: '#6B7280',
  },
  specialInstructions: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic' as const,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginHorizontal: 12,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FF6B35',
  },
  removeButton: {
    padding: 8,
  },
  deliverySection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#1F2937',
  },
  notesSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summarySection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 100,
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
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  checkoutButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFF',
  },
});
