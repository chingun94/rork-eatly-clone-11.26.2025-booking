import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect } from 'react';
import { CartItem, MenuItem, CartItemCustomization } from '@/types/delivery';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = 'delivery_cart';

export const [CartContext, useCart] = createContextHook(() => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setCart(data.cart || []);
        setRestaurantId(data.restaurantId || null);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCart = async (newCart: CartItem[], newRestaurantId: string | null) => {
    try {
      await AsyncStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({ cart: newCart, restaurantId: newRestaurantId })
      );
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  };

  const addToCart = useCallback(
    (
      menuItem: MenuItem,
      quantity: number = 1,
      customizations?: CartItemCustomization[],
      specialInstructions?: string
    ) => {
      if (restaurantId && restaurantId !== menuItem.restaurantId) {
        throw new Error('Cannot add items from different restaurants');
      }

      const customizationPrice = customizations
        ? customizations.reduce(
            (sum, c) => sum + c.selectedOptions.reduce((s, o) => s + o.price, 0),
            0
          )
        : 0;
      const totalPrice = (menuItem.price + customizationPrice) * quantity;

      const existingItemIndex = cart.findIndex(
        (item) =>
          item.menuItem.id === menuItem.id &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations) &&
          item.specialInstructions === specialInstructions
      );

      let newCart: CartItem[];
      if (existingItemIndex >= 0) {
        newCart = [...cart];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + quantity,
          totalPrice: newCart[existingItemIndex].totalPrice + totalPrice,
        };
      } else {
        newCart = [
          ...cart,
          {
            menuItem,
            quantity,
            customizations,
            specialInstructions,
            totalPrice,
          },
        ];
      }

      setCart(newCart);
      setRestaurantId(menuItem.restaurantId);
      saveCart(newCart, menuItem.restaurantId);
    },
    [cart, restaurantId]
  );

  const removeFromCart = useCallback(
    (index: number) => {
      const newCart = cart.filter((_, i) => i !== index);
      setCart(newCart);
      
      if (newCart.length === 0) {
        setRestaurantId(null);
        saveCart([], null);
      } else {
        saveCart(newCart, restaurantId);
      }
    },
    [cart, restaurantId]
  );

  const updateQuantity = useCallback(
    (index: number, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(index);
        return;
      }

      const newCart = [...cart];
      const item = newCart[index];
      const customizationPrice = item.customizations
        ? item.customizations.reduce(
            (sum, c) => sum + c.selectedOptions.reduce((s, o) => s + o.price, 0),
            0
          )
        : 0;
      const pricePerItem = item.menuItem.price + customizationPrice;

      newCart[index] = {
        ...item,
        quantity,
        totalPrice: pricePerItem * quantity,
      };

      setCart(newCart);
      saveCart(newCart, restaurantId);
    },
    [cart, restaurantId, removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCart([]);
    setRestaurantId(null);
    saveCart([], null);
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  const getCartItemCount = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  return {
    cart,
    restaurantId,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
  };
});
