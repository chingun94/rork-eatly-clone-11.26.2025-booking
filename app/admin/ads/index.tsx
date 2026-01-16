import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Image, Alert, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import { Plus, X, Upload, Trash2, Edit, Eye, Check, Calendar, Search } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAds } from '@/contexts/AdContext';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { AdCampaign } from '@/types/admin';

export default function AdvertisingManagement() {
  const { ads, addAd, updateAd, deleteAd } = useAds();
  const { restaurants } = useRestaurants();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAd, setEditingAd] = useState<AdCampaign | null>(null);
  const [imageUri, setImageUri] = useState('');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [showRestaurantPicker, setShowRestaurantPicker] = useState(false);
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const popupAds = ads.filter(ad => ad.type === 'popup');
  const otherAds = ads.filter(ad => ad.type !== 'popup');

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need permission to access your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('AdManagement: Image picked, original URI:', asset.uri);
        
        console.log('AdManagement: Compressing and resizing image...');
        
        const manipResult = await manipulateAsync(
          asset.uri,
          [
            { resize: { width: 1200 } }
          ],
          { 
            compress: 0.7, 
            format: SaveFormat.JPEG,
            base64: true
          }
        );
        
        if (!manipResult.base64) {
          console.error('AdManagement: Image manipulation did not return base64');
          Alert.alert('Error', 'Failed to process image. Please try again.');
          return;
        }
        
        const base64DataUrl = `data:image/jpeg;base64,${manipResult.base64}`;
        const sizeInKB = Math.round(base64DataUrl.length / 1024);
        
        console.log('AdManagement: Image processed successfully');
        console.log('AdManagement: Size after compression:', sizeInKB, 'KB');
        
        if (sizeInKB > 500) {
          console.warn('AdManagement: Image is larger than recommended (500KB). Current size:', sizeInKB, 'KB');
          Alert.alert(
            'Image Size Warning',
            `Image size is ${sizeInKB}KB. For best performance with multiple popup ads, keep images under 500KB. Continue anyway?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Continue', onPress: () => setImageUri(base64DataUrl) },
            ]
          );
          return;
        }
        
        setImageUri(base64DataUrl);
      }
    } catch (error) {
      console.error('AdManagement: Error picking/processing image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    }
  };

  const handleAddOrUpdateAd = async () => {
    if (!imageUri || !selectedRestaurantId) {
      Alert.alert('Missing Information', 'Please fill all fields and select an image.');
      return;
    }

    const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);
    if (!selectedRestaurant) {
      Alert.alert('Error', 'Restaurant not found.');
      return;
    }

    const adData: Omit<AdCampaign, 'id'> = {
      restaurantId: selectedRestaurantId,
      restaurantName: selectedRestaurant.name,
      type: 'popup',
      status: 'active',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      budget: 0,
      spent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      createdAt: new Date().toISOString(),
      imageUrl: imageUri,
    };

    try {
      if (editingAd) {
        await updateAd(editingAd.id, adData);
      } else {
        await addAd(adData);
      }
      resetForm();
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving ad:', error);
      Alert.alert('Error', 'Failed to save advertisement.');
    }
  };

  const handleEdit = (ad: AdCampaign) => {
    setEditingAd(ad);
    setImageUri(ad.imageUrl || '');
    setSelectedRestaurantId(ad.restaurantId);
    setStartDate(new Date(ad.startDate));
    setEndDate(new Date(ad.endDate));
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Advertisement',
      'Are you sure you want to delete this ad?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteAd(id) },
      ]
    );
  };

  const handleToggleStatus = async (ad: AdCampaign) => {
    const newStatus = ad.status === 'active' ? 'paused' : 'active';
    await updateAd(ad.id, { status: newStatus });
  };

  const resetForm = () => {
    setEditingAd(null);
    setImageUri('');
    setSelectedRestaurantId('');
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    setRestaurantSearch('');
  };

  const filteredRestaurants = useMemo(() => {
    if (!restaurantSearch.trim()) return restaurants;
    const searchLower = restaurantSearch.toLowerCase();
    return restaurants.filter(r => 
      r.name.toLowerCase().includes(searchLower) ||
      r.cuisine.some(c => c.toLowerCase().includes(searchLower)) ||
      r.address.toLowerCase().includes(searchLower)
    );
  }, [restaurants, restaurantSearch]);

  const renderPopupAd = ({ item }: { item: AdCampaign }) => (
    <View style={styles.popupCard}>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.adImage} resizeMode="cover" />
      )}
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.restaurantName}</Text>
        <Text style={styles.dates}>
          {item.startDate} - {item.endDate}
        </Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>👁 {item.impressions}</Text>
          <Text style={styles.stat}>🖱 {item.clicks}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#10B98120' : '#F59E0B20' }]}>
          <Text style={[styles.statusText, { color: item.status === 'active' ? '#10B981' : '#F59E0B' }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => handleToggleStatus(item)} style={styles.actionButton}>
          {item.status === 'active' ? (
            <Eye size={20} color="#F59E0B" />
          ) : (
            <Check size={20} color="#10B981" />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
          <Edit size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
          <Trash2 size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOtherAd = ({ item }: { item: AdCampaign }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.restaurantName}</Text>
      <Text style={styles.type}>{item.type.replace('_', ' ')}</Text>
      <View style={styles.stats}>
        <Text style={styles.stat}>💰 ₮{item.spent.toLocaleString()} / ₮{item.budget.toLocaleString()}</Text>
        <Text style={styles.stat}>👁 {item.impressions} impressions</Text>
        <Text style={styles.stat}>🖱 {item.clicks} clicks</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#10B98120' : '#F59E0B20' }]}>
        <Text style={[styles.statusText, { color: item.status === 'active' ? '#10B981' : '#F59E0B' }]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container} testID="advertising-management">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Popup Ads Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Popup Ad</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionTitle}>Popup Ads ({popupAds.length})</Text>
        {popupAds.map(item => (
          <View key={item.id}>
            {renderPopupAd({ item })}
          </View>
        ))}

        {popupAds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No popup ads yet</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Other Campaigns ({otherAds.length})</Text>
        <FlatList
          data={otherAds}
          renderItem={renderOtherAd}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAd ? 'Edit Popup Ad' : 'Add Popup Ad'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Ad Image * (Recommended: Under 500KB)</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Upload size={40} color="#666" />
                    <Text style={styles.uploadText}>Tap to select image</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Restaurant *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowRestaurantPicker(!showRestaurantPicker)}
              >
                <Text style={styles.pickerButtonText}>
                  {selectedRestaurantId
                    ? restaurants.find(r => r.id === selectedRestaurantId)?.name
                    : 'Select Restaurant'}
                </Text>
              </TouchableOpacity>

              {showRestaurantPicker && (
                <View style={styles.pickerContainer}>
                  <View style={styles.searchInputContainer}>
                    <Search size={18} color="#666" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search restaurants..."
                      value={restaurantSearch}
                      onChangeText={setRestaurantSearch}
                      placeholderTextColor="#666"
                    />
                  </View>
                  <ScrollView style={styles.pickerList}>
                    {filteredRestaurants.length > 0 ? (
                      filteredRestaurants.map((restaurant) => (
                        <TouchableOpacity
                          key={restaurant.id}
                          style={styles.pickerItem}
                          onPress={() => {
                            setSelectedRestaurantId(restaurant.id);
                            setShowRestaurantPicker(false);
                            setRestaurantSearch('');
                          }}
                        >
                          <Text style={styles.pickerItemText}>{restaurant.name}</Text>
                          <Text style={styles.pickerItemSubtext}>{restaurant.cuisine} • {restaurant.location.city}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.noResults}>
                        <Text style={styles.noResultsText}>No restaurants found</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.label}>Start Date *</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Calendar size={20} color="#fff" />
                <Text style={styles.datePickerButtonText}>
                  {startDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>

              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowStartDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setStartDate(selectedDate);
                    }
                  }}
                  themeVariant="dark"
                />
              )}

              <Text style={styles.label}>End Date *</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Calendar size={20} color="#fff" />
                <Text style={styles.datePickerButtonText}>
                  {endDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>

              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowEndDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setEndDate(selectedDate);
                    }
                  }}
                  minimumDate={startDate}
                  themeVariant="dark"
                />
              )}

              <TouchableOpacity style={styles.saveButton} onPress={handleAddOrUpdateAd}>
                <Text style={styles.saveButtonText}>
                  {editingAd ? 'Update Ad' : 'Create Ad'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, padding: 16, backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#333' },
  headerTitle: { fontSize: 20, fontWeight: '700' as const, color: '#fff' },
  addButton: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' as const },
  scrollView: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '600' as const, color: '#fff', padding: 16, paddingBottom: 8 },
  popupCard: { backgroundColor: '#1a1a1a', borderRadius: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: '#333', overflow: 'hidden' as const },
  adImage: { width: '100%', height: 200 },
  cardContent: { padding: 16 },
  cardActions: { flexDirection: 'row' as const, justifyContent: 'flex-end' as const, padding: 12, gap: 12, borderTopWidth: 1, borderTopColor: '#333' },
  actionButton: { padding: 8 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  name: { fontSize: 18, fontWeight: '600' as const, color: '#fff', marginBottom: 4 },
  dates: { fontSize: 13, color: '#999', marginBottom: 8 },
  type: { fontSize: 14, color: '#999', marginBottom: 12, textTransform: 'capitalize' as const },
  stats: { flexDirection: 'row' as const, gap: 12, marginBottom: 12 },
  stat: { fontSize: 14, color: '#ccc' },
  statusBadge: { alignSelf: 'flex-start' as const, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' as const, textTransform: 'capitalize' as const },
  emptyState: { padding: 40, alignItems: 'center' as const },
  emptyText: { fontSize: 14, color: '#666' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' as const },
  modalContent: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, padding: 20, borderBottomWidth: 1, borderBottomColor: '#333' },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, color: '#fff' },
  modalBody: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600' as const, color: '#fff', marginBottom: 8, marginTop: 16 },
  imagePickerButton: { backgroundColor: '#2a2a2a', borderRadius: 12, overflow: 'hidden' as const, borderWidth: 2, borderColor: '#333', borderStyle: 'dashed' as const },
  previewImage: { width: '100%', height: 200 },
  uploadPlaceholder: { height: 200, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8 },
  uploadText: { fontSize: 14, color: '#666' },
  pickerButton: { backgroundColor: '#2a2a2a', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#333' },
  pickerButtonText: { fontSize: 15, color: '#fff' },
  pickerContainer: { marginTop: 8 },
  searchInputContainer: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: '#2a2a2a', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#333', gap: 8, marginBottom: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: '#fff' },
  pickerList: { backgroundColor: '#2a2a2a', borderRadius: 12, borderWidth: 1, borderColor: '#333', maxHeight: 200 },
  pickerItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  pickerItemText: { fontSize: 15, color: '#fff', marginBottom: 4 },
  pickerItemSubtext: { fontSize: 13, color: '#999' },
  noResults: { padding: 20, alignItems: 'center' as const },
  noResultsText: { fontSize: 14, color: '#666' },
  input: { backgroundColor: '#2a2a2a', borderRadius: 12, padding: 16, fontSize: 15, color: '#fff', borderWidth: 1, borderColor: '#333' },
  datePickerButton: { backgroundColor: '#2a2a2a', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#333', flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
  datePickerButtonText: { fontSize: 15, color: '#fff', flex: 1 },
  saveButton: { backgroundColor: '#10B981', borderRadius: 12, padding: 16, alignItems: 'center' as const, marginTop: 24, marginBottom: 40 },
  saveButtonText: { fontSize: 16, fontWeight: '600' as const, color: '#fff' },
});
