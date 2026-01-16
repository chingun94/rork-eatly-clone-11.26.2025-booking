import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { useCart } from '@/contexts/CartContext';
import { MenuItem, CartItemCustomization } from '@/types/delivery';
import { ShoppingCart, Search, Plus, Minus, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MenuScreen() {
  const { restaurantId, restaurantName } = useLocalSearchParams<{
    restaurantId: string;
    restaurantName: string;
  }>();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customizations, setCustomizations] = useState<CartItemCustomization[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const { addToCart, getCartItemCount } = useCart();

  const menuQuery = trpc.menu.getAll.useQuery(
    { restaurantId: restaurantId!, availableOnly: true },
    { enabled: !!restaurantId }
  );

  const categoriesQuery = trpc.menu.categories.useQuery(
    { restaurantId: restaurantId! },
    { enabled: !!restaurantId }
  );

  const filteredItems = useMemo(() => {
    if (!menuQuery.data) return [];

    let items: MenuItem[] = menuQuery.data;

    if (selectedCategory) {
      items = items.filter((item: MenuItem) => item.category === selectedCategory);
    }

    if (searchQuery) {
      items = items.filter(
        (item: MenuItem) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  }, [menuQuery.data, selectedCategory, searchQuery]);

  const handleAddToCart = () => {
    if (!selectedItem) return;

    try {
      addToCart(selectedItem, quantity, customizations, specialInstructions);
      setSelectedItem(null);
      setCustomizations([]);
      setSpecialInstructions('');
      setQuantity(1);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCustomizationChange = (
    customizationId: string,
    customizationName: string,
    optionId: string,
    optionName: string,
    optionPrice: number,
    multiSelect: boolean
  ) => {
    setCustomizations((prev) => {
      const existingIndex = prev.findIndex((c) => c.customizationId === customizationId);

      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const optionExists = existing.selectedOptions.some((o) => o.id === optionId);

        if (multiSelect) {
          const newOptions = optionExists
            ? existing.selectedOptions.filter((o) => o.id !== optionId)
            : [...existing.selectedOptions, { id: optionId, name: optionName, price: optionPrice }];

          const newCustomizations = [...prev];
          newCustomizations[existingIndex] = {
            ...existing,
            selectedOptions: newOptions,
          };
          return newCustomizations;
        } else {
          const newCustomizations = [...prev];
          newCustomizations[existingIndex] = {
            ...existing,
            selectedOptions: [{ id: optionId, name: optionName, price: optionPrice }],
          };
          return newCustomizations;
        }
      } else {
        return [
          ...prev,
          {
            customizationId,
            customizationName,
            selectedOptions: [{ id: optionId, name: optionName, price: optionPrice }],
          },
        ];
      }
    });
  };

  const calculateTotalPrice = () => {
    if (!selectedItem) return 0;

    const customizationPrice = customizations.reduce(
      (sum, c) => sum + c.selectedOptions.reduce((s, o) => s + o.price, 0),
      0
    );

    return (selectedItem.price + customizationPrice) * quantity;
  };

  const cartItemCount = getCartItemCount();

  if (menuQuery.isLoading || categoriesQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: restaurantName || 'Menu',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/cart' as any)}
              style={styles.cartButton}
            >
              <ShoppingCart size={24} color="#000" />
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.searchContainer}>
        <Search size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search menu..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {categoriesQuery.data?.map((category: string) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.menuList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setSelectedItem(item);
              setQuantity(1);
              setCustomizations([]);
              setSpecialInstructions('');
            }}
          >
            {item.image && (
              <Image source={{ uri: item.image }} style={styles.menuItemImage} />
            )}
            <View style={styles.menuItemInfo}>
              <Text style={styles.menuItemName}>{item.name}</Text>
              <Text style={styles.menuItemDescription} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.menuItemFooter}>
                <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
                <Text style={styles.menuItemTime}>{item.preparationTime} min</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        }
      />

      <Modal
        visible={!!selectedItem}
        animationType="slide"
        onRequestClose={() => setSelectedItem(null)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedItem?.name}</Text>
            <TouchableOpacity onPress={() => setSelectedItem(null)}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedItem?.image && (
              <Image source={{ uri: selectedItem.image }} style={styles.modalImage} />
            )}

            <View style={styles.modalSection}>
              <Text style={styles.modalDescription}>{selectedItem?.description}</Text>
              <Text style={styles.modalPrice}>${selectedItem?.price.toFixed(2)}</Text>
            </View>

            {selectedItem?.customizations?.map((customization) => (
              <View key={customization.id} style={styles.customizationSection}>
                <Text style={styles.customizationTitle}>
                  {customization.name}
                  {customization.required && <Text style={styles.required}> *</Text>}
                </Text>
                {customization.options.map((option) => {
                  const isSelected = customizations
                    .find((c) => c.customizationId === customization.id)
                    ?.selectedOptions.some((o) => o.id === option.id);

                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                      onPress={() =>
                        handleCustomizationChange(
                          customization.id,
                          customization.name,
                          option.id,
                          option.name,
                          option.price,
                          customization.multiSelect
                        )
                      }
                    >
                      <View style={styles.optionLeft}>
                        <View
                          style={[
                            customization.multiSelect
                              ? styles.checkbox
                              : styles.radio,
                            isSelected &&
                              (customization.multiSelect
                                ? styles.checkboxSelected
                                : styles.radioSelected),
                          ]}
                        />
                        <Text style={styles.optionName}>{option.name}</Text>
                      </View>
                      {option.price > 0 && (
                        <Text style={styles.optionPrice}>+${option.price.toFixed(2)}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            <View style={styles.instructionsSection}>
              <Text style={styles.instructionsTitle}>Special Instructions</Text>
              <TextInput
                style={styles.instructionsInput}
                placeholder="Any special requests?"
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={20} color="#FF6B35" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Plus size={20} color="#FF6B35" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
              <Text style={styles.addButtonText}>
                Add to Cart - ${calculateTotalPrice().toFixed(2)}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#000',
  },
  categoryScroll: {
    maxHeight: 50,
    marginBottom: 8,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  menuList: {
    padding: 16,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItemImage: {
    width: 120,
    height: 120,
  },
  menuItemInfo: {
    flex: 1,
    padding: 12,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FF6B35',
  },
  menuItemTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  cartButton: {
    marginRight: 16,
    position: 'relative' as const,
  },
  cartBadge: {
    position: 'absolute' as const,
    top: -8,
    right: -8,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 250,
  },
  modalSection: {
    padding: 16,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 22,
  },
  modalPrice: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FF6B35',
  },
  customizationSection: {
    padding: 16,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  customizationTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 12,
  },
  required: {
    color: '#EF4444',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  optionItemSelected: {
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
  },
  radioSelected: {
    borderColor: '#FF6B35',
    borderWidth: 6,
  },
  optionName: {
    fontSize: 15,
    color: '#1F2937',
  },
  optionPrice: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  instructionsSection: {
    padding: 16,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  instructionsTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 12,
  },
  instructionsInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginHorizontal: 24,
  },
  addButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFF',
  },
});
