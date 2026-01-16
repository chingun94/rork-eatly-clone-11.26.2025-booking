import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Search, Star, Plus, X, Edit2, Trash2, Check, ImagePlus, Upload, FileDown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { Restaurant, CuisineType, ServiceStyle, Ambiance, FeaturedTimeline, CategoryFeatured } from '@/types/restaurant';
import { MapPickerView } from '@/components/MapComponents';

const CUISINE_OPTIONS: CuisineType[] = [
  'Italian', 'Japanese', 'Mexican', 'French', 'American',
  'Chinese', 'Thai', 'Indian', 'Mediterranean', 'Korean',
  'European', 'Turkish', 'Vegetarian/Vegan', 'Hot-Pot', 'Mongolian', 'Asian', 'Ramen'
];

const SERVICE_OPTIONS: ServiceStyle[] = [
  'Fine Dining', 'Casual Dining', 'Fast Casual',
  'Cafe', 'Buffet'
];

const AMBIANCE_OPTIONS: Ambiance[] = [
  'Romantic', 'Business Lunch', 'Family Friendly', 'Date Night',
  'Trendy', 'Cozy', 'Lively', 'Quiet', 'Outdoor Seating', 'Late Night', 'VIP Room'
];

type DayHours = {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

type WeekHours = {
  Monday: DayHours;
  Tuesday: DayHours;
  Wednesday: DayHours;
  Thursday: DayHours;
  Friday: DayHours;
  Saturday: DayHours;
  Sunday: DayHours;
};

type FormData = {
  name: string;
  cuisine: CuisineType[];
  serviceStyle: ServiceStyle;
  ambiance: Ambiance[];
  address: string;
  phone: string;
  description: string;
  weekHours: WeekHours;
  city: string;
  neighborhood: string;
  latitude: string;
  longitude: string;
  priceLevel: string;
  images: string[];
  isVerified: boolean;
  hasOutdoorTerrace: boolean;
  featuredStartDate: string;
  featuredEndDate: string;
  isFeaturedHome: boolean;
  cuisineFeaturedStartDate: string;
  cuisineFeaturedEndDate: string;
  isCuisineFeatured: boolean;
  serviceStyleFeaturedStartDate: string;
  serviceStyleFeaturedEndDate: string;
  isServiceStyleFeatured: boolean;
  ambianceFeatured: Record<string, { startDate: string; endDate: string; enabled: boolean }>;
  isFranchiseParent: boolean;
  parentRestaurantId: string;
  weekSpecialStartDate: string;
  weekSpecialEndDate: string;
  isWeekSpecial: boolean;
  weekSpecialOrder: string;
  discountStartDate: string;
  discountEndDate: string;
  hasDiscount: boolean;
  discountAmount: string;
  discountDescription: string;
  discountOrder: string;
  top10StartDate: string;
  top10EndDate: string;
  isTop10: boolean;
  top10Rank: string;
  top10Order: string;
};

export default function RestaurantManagement() {
  const { restaurants, toggleFeatured, addRestaurant, updateRestaurant, deleteRestaurant, setFeaturedTimeline, setCategoryFeatured, setWeekSpecial, setDiscount, setTop10 } = useRestaurants();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const defaultDayHours: DayHours = { isOpen: true, openTime: '09:00', closeTime: '22:00' };
  const defaultWeekHours: WeekHours = {
    Monday: { ...defaultDayHours },
    Tuesday: { ...defaultDayHours },
    Wednesday: { ...defaultDayHours },
    Thursday: { ...defaultDayHours },
    Friday: { ...defaultDayHours },
    Saturday: { ...defaultDayHours },
    Sunday: { ...defaultDayHours },
  };

  const [formData, setFormData] = useState<FormData>({
    name: '',
    cuisine: [],
    serviceStyle: 'Casual Dining',
    ambiance: [],
    address: '',
    phone: '',
    description: '',
    weekHours: defaultWeekHours,
    city: '',
    neighborhood: '',
    latitude: '47.91845',
    longitude: '106.91745',
    priceLevel: '2',
    images: ['', '', '', '', ''],
    isVerified: false,
    hasOutdoorTerrace: false,
    featuredStartDate: '',
    featuredEndDate: '',
    isFeaturedHome: false,
    cuisineFeaturedStartDate: '',
    cuisineFeaturedEndDate: '',
    isCuisineFeatured: false,
    serviceStyleFeaturedStartDate: '',
    serviceStyleFeaturedEndDate: '',
    isServiceStyleFeatured: false,
    ambianceFeatured: {},
    isFranchiseParent: false,
    parentRestaurantId: '',
    weekSpecialStartDate: '',
    weekSpecialEndDate: '',
    isWeekSpecial: false,
    weekSpecialOrder: '',
    discountStartDate: '',
    discountEndDate: '',
    hasDiscount: false,
    discountAmount: '',
    discountDescription: '',
    discountOrder: '',
    top10StartDate: '',
    top10EndDate: '',
    isTop10: false,
    top10Rank: '',
    top10Order: '',
  });

  const filteredRestaurants = restaurants.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      cuisine: [],
      serviceStyle: 'Casual Dining',
      ambiance: [],
      address: '',
      phone: '',
      description: '',
      weekHours: defaultWeekHours,
      city: '',
      neighborhood: '',
      latitude: '47.91845',
      longitude: '106.91745',
      priceLevel: '2',
      images: ['', '', '', '', ''],
      isVerified: false,
      hasOutdoorTerrace: false,
      featuredStartDate: '',
      featuredEndDate: '',
      isFeaturedHome: false,
      cuisineFeaturedStartDate: '',
      cuisineFeaturedEndDate: '',
      isCuisineFeatured: false,
      serviceStyleFeaturedStartDate: '',
      serviceStyleFeaturedEndDate: '',
      isServiceStyleFeatured: false,
      ambianceFeatured: {},
      isFranchiseParent: false,
      parentRestaurantId: '',
      weekSpecialStartDate: '',
      weekSpecialEndDate: '',
      isWeekSpecial: false,
      weekSpecialOrder: '',
      discountStartDate: '',
      discountEndDate: '',
      hasDiscount: false,
      discountAmount: '',
      discountDescription: '',
      discountOrder: '',
      top10StartDate: '',
      top10EndDate: '',
      isTop10: false,
      top10Rank: '',
      top10Order: '',
    });
    setEditingId(null);
  };

  const parseHoursToWeekHours = (hoursString: string): WeekHours => {
    return defaultWeekHours;
  };

  const handleEdit = (restaurant: Restaurant) => {
    setEditingId(restaurant.id);
    
    const existingImages = restaurant.images || [];
    const images = ['', '', '', '', ''];
    existingImages.forEach((img, idx) => {
      if (idx < 5 && img && img.trim() !== '') {
        images[idx] = img;
      }
    });
    
    const ambianceFeatured: Record<string, { startDate: string; endDate: string; enabled: boolean }> = {};
    restaurant.ambiance.forEach((amb) => {
      const timeline = restaurant.categoryFeatured?.ambiance?.[amb];
      ambianceFeatured[amb] = {
        startDate: timeline?.startDate || '',
        endDate: timeline?.endDate || '',
        enabled: !!timeline,
      };
    });
    
    setFormData({
      name: restaurant.name,
      cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine : [restaurant.cuisine],
      serviceStyle: restaurant.serviceStyle,
      ambiance: restaurant.ambiance,
      address: restaurant.address,
      phone: restaurant.phone,
      description: restaurant.description,
      weekHours: parseHoursToWeekHours(restaurant.hours),
      city: restaurant.location.city,
      neighborhood: restaurant.location.neighborhood || '',
      latitude: restaurant.location.latitude.toString(),
      longitude: restaurant.location.longitude.toString(),
      priceLevel: restaurant.priceLevel.toString(),
      images,
      isVerified: restaurant.isVerified || false,
      hasOutdoorTerrace: restaurant.hasOutdoorTerrace || false,
      featuredStartDate: restaurant.featuredTimeline?.startDate || '',
      featuredEndDate: restaurant.featuredTimeline?.endDate || '',
      isFeaturedHome: !!(restaurant.featuredTimeline?.startDate),
      cuisineFeaturedStartDate: restaurant.categoryFeatured?.cuisine?.startDate || '',
      cuisineFeaturedEndDate: restaurant.categoryFeatured?.cuisine?.endDate || '',
      isCuisineFeatured: !!(restaurant.categoryFeatured?.cuisine),
      serviceStyleFeaturedStartDate: restaurant.categoryFeatured?.serviceStyle?.startDate || '',
      serviceStyleFeaturedEndDate: restaurant.categoryFeatured?.serviceStyle?.endDate || '',
      isServiceStyleFeatured: !!(restaurant.categoryFeatured?.serviceStyle),
      ambianceFeatured,
      isFranchiseParent: restaurant.isFranchiseParent || false,
      parentRestaurantId: restaurant.parentRestaurantId || '',
      weekSpecialStartDate: restaurant.weekSpecialTimeline?.startDate || '',
      weekSpecialEndDate: restaurant.weekSpecialTimeline?.endDate || '',
      isWeekSpecial: !!(restaurant.weekSpecialTimeline?.startDate),
      weekSpecialOrder: restaurant.weekSpecialOrder?.toString() || '',
      discountStartDate: restaurant.discountTimeline?.startDate || '',
      discountEndDate: restaurant.discountTimeline?.endDate || '',
      hasDiscount: !!(restaurant.discountTimeline?.startDate),
      discountAmount: restaurant.discountAmount || '',
      discountDescription: restaurant.discountDescription || '',
      discountOrder: restaurant.discountOrder?.toString() || '',
      top10StartDate: restaurant.top10Timeline?.startDate || '',
      top10EndDate: restaurant.top10Timeline?.endDate || '',
      isTop10: !!(restaurant.top10Timeline?.startDate),
      top10Rank: restaurant.top10Rank?.toString() || '',
      top10Order: restaurant.top10Order?.toString() || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Restaurant',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRestaurant(id);
            Alert.alert('Success', 'Restaurant deleted successfully');
          },
        },
      ]
    );
  };

  const toggleAmbiance = (amb: Ambiance) => {
    setFormData((prev) => {
      const isRemoving = prev.ambiance.includes(amb);
      const newAmbiance = isRemoving
        ? prev.ambiance.filter((a) => a !== amb)
        : [...prev.ambiance, amb];
      
      const newAmbianceFeatured = { ...prev.ambianceFeatured };
      if (!isRemoving && !newAmbianceFeatured[amb]) {
        newAmbianceFeatured[amb] = { startDate: '', endDate: '', enabled: false };
      }
      
      return {
        ...prev,
        ambiance: newAmbiance,
        ambianceFeatured: newAmbianceFeatured,
      };
    });
  };

  const pickImage = async (index: number) => {
    try {
      console.log('RestaurantManagement: Starting image picker for index:', index);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
        return;
      }

      setIsUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('RestaurantManagement: Image picked, original URI:', asset.uri);
        
        try {
          console.log('RestaurantManagement: Compressing and resizing image...');
          
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
            console.error('RestaurantManagement: Image manipulation did not return base64');
            Alert.alert('Error', 'Failed to process image. Please try again.');
            setIsUploadingImage(false);
            return;
          }
          
          const base64DataUrl = `data:image/jpeg;base64,${manipResult.base64}`;
          const sizeInKB = Math.round(base64DataUrl.length / 1024);
          
          console.log('RestaurantManagement: Image processed successfully');
          console.log('RestaurantManagement: Size after compression:', sizeInKB, 'KB');
          
          if (sizeInKB > 500) {
            console.warn('RestaurantManagement: Image is larger than recommended (500KB). Current size:', sizeInKB, 'KB');
            Alert.alert(
              'Image Size Warning',
              `Image size is ${sizeInKB}KB. For optimal performance, keep images under 500KB. Continue anyway?`,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => setIsUploadingImage(false) },
                { 
                  text: 'Continue', 
                  onPress: () => {
                    const newImages = [...formData.images];
                    newImages[index] = base64DataUrl;
                    setFormData({ ...formData, images: newImages });
                    console.log('RestaurantManagement: Image set successfully at index:', index);
                    setIsUploadingImage(false);
                  }
                },
              ]
            );
            return;
          }
          
          const newImages = [...formData.images];
          newImages[index] = base64DataUrl;
          setFormData({ ...formData, images: newImages });
          console.log('RestaurantManagement: Image set successfully at index:', index);
        } catch (conversionError) {
          console.error('RestaurantManagement: Error processing image:', conversionError);
          Alert.alert('Error', 'Failed to process image. Please try again with a different image.');
        }
      }
    } catch (error) {
      console.error('RestaurantManagement: Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    newImages[index] = '';
    setFormData({ ...formData, images: newImages });
  };

  const formatWeekHoursToString = (weekHours: WeekHours): string => {
    const days = Object.keys(weekHours) as Array<keyof WeekHours>;
    const openDays = days.filter((day) => weekHours[day].isOpen);
    
    if (openDays.length === 0) return 'Closed';
    
    if (openDays.length === 7) {
      const firstDay = weekHours[openDays[0]];
      const allSame = openDays.every(
        (day) =>
          weekHours[day].openTime === firstDay.openTime &&
          weekHours[day].closeTime === firstDay.closeTime
      );
      
      if (allSame) {
        return `Mon-Sun: ${firstDay.openTime} - ${firstDay.closeTime}`;
      }
    }
    
    return openDays
      .map((day) => `${day.slice(0, 3)}: ${weekHours[day].openTime} - ${weekHours[day].closeTime}`)
      .join(', ');
  };

  const handleBulkImport = async () => {
    if (!importText.trim()) {
      Alert.alert('Error', 'Please paste CSV data');
      return;
    }

    try {
      const rows = parseCSV(importText);
      
      if (rows.length < 2) {
        Alert.alert('Error', 'CSV must contain at least a header row and one data row');
        return;
      }

      const headers = rows[0].map(h => h.toLowerCase().trim());
      const dataRows = rows.slice(1);

      const requiredFields = ['name', 'cuisine', 'address', 'phone'];
      const missingFields = requiredFields.filter(field => 
        !headers.some(h => h.includes(field))
      );

      if (missingFields.length > 0) {
        Alert.alert('Error', `Missing required columns: ${missingFields.join(', ')}`);
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNum = i + 2;

        try {
          const getCell = (fieldName: string): string => {
            const index = headers.findIndex(h => h.includes(fieldName));
            return index >= 0 ? (row[index] || '').trim() : '';
          };

          const name = getCell('name');
          if (!name) {
            errors.push(`Row ${rowNum}: Missing name`);
            errorCount++;
            continue;
          }

          const cuisineText = getCell('cuisine');
          const cuisine = cuisineText.split('|').map(c => c.trim()).filter(c => c) as CuisineType[];
          if (cuisine.length === 0) {
            errors.push(`Row ${rowNum} (${name}): Missing cuisine`);
            errorCount++;
            continue;
          }

          const serviceStyleText = getCell('service') || 'Casual Dining';
          const serviceStyle = serviceStyleText as ServiceStyle;

          const vibesText = getCell('vibe');
          const ambiance = vibesText.split('|').map(v => v.trim()).filter(v => v) as Ambiance[];
          if (ambiance.length === 0) {
            ambiance.push('Family Friendly');
          }

          const address = getCell('address');
          const phone = getCell('phone');
          const description = getCell('description') || `Visit ${name} for great food!`;
          const city = getCell('city') || 'Ulaanbaatar';
          const neighborhood = getCell('neighborhood') || '';
          const latitude = parseFloat(getCell('latitude')) || 47.91845;
          const longitude = parseFloat(getCell('longitude')) || 106.91745;
          const priceLevel = parseInt(getCell('price')) || 2;

          const imageUrlsText = getCell('image');
          const imageUrls = imageUrlsText
            .split('|')
            .map(url => url.trim())
            .filter(url => url && (url.startsWith('http') || url.startsWith('data:')));
          
          const mainImage = imageUrls[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800';

          const verifiedText = getCell('verified').toLowerCase();
          const isVerified = verifiedText === 'yes' || verifiedText === 'true' || verifiedText === '1';

          const terraceText = getCell('terrace').toLowerCase();
          const hasOutdoorTerrace = terraceText === 'yes' || terraceText === 'true' || terraceText === '1';

          await addRestaurant({
            name,
            cuisine,
            serviceStyle,
            ambiance,
            rating: 4.0,
            reviewCount: 0,
            priceLevel,
            image: mainImage,
            images: imageUrls,
            description,
            address,
            phone,
            hours: 'Mon-Sun: 09:00 - 22:00',
            reviews: [],
            location: {
              latitude,
              longitude,
              city,
              neighborhood,
            },
            isFeatured: false,
            isVerified,
            hasOutdoorTerrace,
          });

          successCount++;
          console.log(`Imported: ${name}`);
        } catch (error: any) {
          console.error(`Error importing row ${rowNum}:`, error);
          errors.push(`Row ${rowNum}: ${error.message || 'Unknown error'}`);
          errorCount++;
        }
      }

      let message = `Successfully imported ${successCount} restaurant(s)`;
      if (errorCount > 0) {
        message += `\n\nFailed: ${errorCount} restaurant(s)`;
        if (errors.length > 0 && errors.length <= 5) {
          message += `\n\nErrors:\n${errors.join('\n')}`;
        }
      }

      Alert.alert(
        errorCount === 0 ? 'Success' : 'Partial Success',
        message,
        [
          {
            text: 'OK',
            onPress: () => {
              if (successCount > 0) {
                setShowImportModal(false);
                setImportText('');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Bulk import error:', error);
      Alert.alert('Error', `Failed to import: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSubmit = async () => {
    console.log('RestaurantManagement: Submit button pressed');
    if (!formData.name || !formData.address || !formData.phone || formData.ambiance.length === 0 || formData.cuisine.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields including at least one cuisine type and at least one vibe');
      return;
    }

    const filteredImages = formData.images.filter((img) => img.trim() !== '');
    const hoursString = formatWeekHoursToString(formData.weekHours);

    console.log('RestaurantManagement: Filtered images count:', filteredImages.length);
    console.log('RestaurantManagement: Hours string:', hoursString);

    try {
      if (editingId) {
        console.log('RestaurantManagement: Updating restaurant with ID:', editingId);
        
        const franchiseId = formData.parentRestaurantId || (formData.isFranchiseParent ? editingId : undefined);
        
        const updatePayload: Partial<Restaurant> = {
          name: formData.name,
          cuisine: formData.cuisine,
          serviceStyle: formData.serviceStyle,
          ambiance: formData.ambiance,
          priceLevel: parseInt(formData.priceLevel) || 2,
          image: filteredImages[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
          images: filteredImages,
          description: formData.description,
          address: formData.address,
          phone: formData.phone,
          hours: hoursString,
          location: {
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude),
            city: formData.city,
            neighborhood: formData.neighborhood,
          },
          isVerified: formData.isVerified,
          hasOutdoorTerrace: formData.hasOutdoorTerrace,
          isFranchiseParent: formData.isFranchiseParent,
        };
        
        if (formData.parentRestaurantId) {
          updatePayload.parentRestaurantId = formData.parentRestaurantId;
        }
        if (franchiseId) {
          updatePayload.franchiseId = franchiseId;
        }
        
        await updateRestaurant(editingId, updatePayload);
        
        if (formData.isFeaturedHome && formData.featuredStartDate && formData.featuredEndDate) {
          await setFeaturedTimeline(editingId, {
            startDate: formData.featuredStartDate,
            endDate: formData.featuredEndDate,
          });
        } else if (!formData.isFeaturedHome) {
          await setFeaturedTimeline(editingId, null);
        }
        
        const categoryFeatured: CategoryFeatured = {};
        if (formData.isCuisineFeatured && formData.cuisineFeaturedStartDate && formData.cuisineFeaturedEndDate) {
          categoryFeatured.cuisine = {
            startDate: formData.cuisineFeaturedStartDate,
            endDate: formData.cuisineFeaturedEndDate,
          };
        }
        if (formData.isServiceStyleFeatured && formData.serviceStyleFeaturedStartDate && formData.serviceStyleFeaturedEndDate) {
          categoryFeatured.serviceStyle = {
            startDate: formData.serviceStyleFeaturedStartDate,
            endDate: formData.serviceStyleFeaturedEndDate,
          };
        }
        
        const ambianceTimelines: Record<string, FeaturedTimeline> = {};
        Object.entries(formData.ambianceFeatured).forEach(([amb, data]) => {
          if (data.enabled && data.startDate && data.endDate) {
            ambianceTimelines[amb] = {
              startDate: data.startDate,
              endDate: data.endDate,
            };
          }
        });
        if (Object.keys(ambianceTimelines).length > 0) {
          categoryFeatured.ambiance = ambianceTimelines;
        }
        
        if (Object.keys(categoryFeatured).length > 0) {
          await setCategoryFeatured(editingId, categoryFeatured);
        }
        
        if (formData.isWeekSpecial && formData.weekSpecialStartDate && formData.weekSpecialEndDate) {
          await setWeekSpecial(editingId, {
            startDate: formData.weekSpecialStartDate,
            endDate: formData.weekSpecialEndDate,
          });
          await updateRestaurant(editingId, {
            weekSpecialOrder: formData.weekSpecialOrder ? parseInt(formData.weekSpecialOrder) : undefined,
          });
        } else if (!formData.isWeekSpecial) {
          await setWeekSpecial(editingId, null);
          await updateRestaurant(editingId, {
            weekSpecialOrder: undefined,
          });
        }
        
        if (formData.hasDiscount && formData.discountStartDate && formData.discountEndDate && formData.discountAmount) {
          await setDiscount(editingId, {
            startDate: formData.discountStartDate,
            endDate: formData.discountEndDate,
          });
          await updateRestaurant(editingId, {
            discountAmount: formData.discountAmount,
            discountDescription: formData.discountDescription,
            discountOrder: formData.discountOrder ? parseInt(formData.discountOrder) : undefined,
          });
        } else if (!formData.hasDiscount) {
          await setDiscount(editingId, null);
          await updateRestaurant(editingId, {
            discountAmount: '',
            discountDescription: '',
            discountOrder: undefined,
          });
        }
        
        if (formData.isTop10 && formData.top10StartDate && formData.top10EndDate && formData.top10Rank) {
          await setTop10(editingId, {
            startDate: formData.top10StartDate,
            endDate: formData.top10EndDate,
          });
          await updateRestaurant(editingId, {
            top10Rank: parseInt(formData.top10Rank) || 1,
            top10Order: formData.top10Order ? parseInt(formData.top10Order) : undefined,
          });
        } else if (!formData.isTop10) {
          await setTop10(editingId, null);
          await updateRestaurant(editingId, {
            top10Rank: undefined,
            top10Order: undefined,
          });
        }
        
        console.log('RestaurantManagement: Restaurant updated successfully');
        Alert.alert('Success', 'Restaurant updated successfully');
      } else {
        console.log('RestaurantManagement: Adding new restaurant:', formData.name);
        
        const addPayload: Omit<Restaurant, 'id'> = {
          name: formData.name,
          cuisine: formData.cuisine,
          serviceStyle: formData.serviceStyle,
          ambiance: formData.ambiance,
          rating: 4.0,
          reviewCount: 0,
          priceLevel: parseInt(formData.priceLevel) || 2,
          image: filteredImages[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
          images: filteredImages,
          description: formData.description,
          address: formData.address,
          phone: formData.phone,
          hours: hoursString,
          reviews: [],
          location: {
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude),
            city: formData.city,
            neighborhood: formData.neighborhood,
          },
          isFeatured: false,
          isVerified: formData.isVerified,
          hasOutdoorTerrace: formData.hasOutdoorTerrace,
          isFranchiseParent: formData.isFranchiseParent,
        };
        
        if (formData.parentRestaurantId) {
          addPayload.parentRestaurantId = formData.parentRestaurantId;
          addPayload.franchiseId = formData.parentRestaurantId;
        } else if (formData.isFranchiseParent) {
          addPayload.franchiseId = 'temp';
        }
        
        const newRestaurant = await addRestaurant(addPayload);
        
        if (formData.isFranchiseParent && newRestaurant && newRestaurant.id) {
          await updateRestaurant(newRestaurant.id, {
            franchiseId: newRestaurant.id,
          });
        }
        console.log('RestaurantManagement: Restaurant added successfully');
        Alert.alert('Success', 'Restaurant added successfully');
      }

      setShowModal(false);
      resetForm();
    } catch (error: any) {
      console.error('RestaurantManagement: Failed to save restaurant:', error);
      console.error('RestaurantManagement: Error code:', error?.code);
      console.error('RestaurantManagement: Error message:', error?.message);
      
      let errorMessage = 'Failed to save restaurant';
      if (error?.code === 'permission-denied') {
        errorMessage = 'Permission denied. Check your Firestore security rules.';
      } else if (error?.code === 'unavailable') {
        errorMessage = 'Network error. Check your internet connection.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{item.name}</Text>
            {item.isFeatured && (
              <View style={styles.featuredBadge}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
            {item.isVerified && (
              <View style={styles.verifiedBadge}>
                <Check size={12} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
            {item.isFranchiseParent && (
              <View style={styles.franchiseBadge}>
                <Text style={styles.franchiseText}>Franchise</Text>
              </View>
            )}
            {item.parentRestaurantId && (
              <View style={styles.branchBadge}>
                <Text style={styles.branchText}>Branch</Text>
              </View>
            )}
          </View>
          <Text style={styles.cuisine}>{Array.isArray(item.cuisine) ? item.cuisine.join(', ') : item.cuisine} • {item.serviceStyle}</Text>
          <Text style={styles.address}>{item.address}</Text>
          <Text style={styles.vibes}>Vibes: {item.ambiance.join(', ')}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Text style={styles.stat}>⭐ {item.rating.toFixed(1)} • {item.reviewCount} reviews • {'$'.repeat(item.priceLevel)}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            item.isFeatured ? styles.unfeatButton : styles.featButton,
          ]}
          onPress={() => {
            toggleFeatured(item.id);
            Alert.alert('Success', `${item.name} ${item.isFeatured ? 'unfeatured' : 'featured'}`);
          }}
        >
          <Star
            size={16}
            color={item.isFeatured ? '#999' : '#F59E0B'}
            fill={item.isFeatured ? 'transparent' : '#F59E0B'}
          />
          <Text style={[styles.actionText, { color: item.isFeatured ? '#999' : '#F59E0B' }]}>
            {item.isFeatured ? 'Unfeature' : 'Feature'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEdit(item)}
        >
          <Edit2 size={16} color="#3B82F6" />
          <Text style={[styles.actionText, { color: '#3B82F6' }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item.id, item.name)}
        >
          <Trash2 size={16} color="#EF4444" />
          <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.importButton}
          onPress={() => setShowImportModal(true)}
        >
          <Upload size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredRestaurants}
        renderItem={renderRestaurant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No restaurants found</Text>
        }
      />

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? 'Edit Restaurant' : 'Add New Restaurant'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowModal(false);
                resetForm();
              }}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Restaurant name"
                placeholderTextColor="#666"
              />

              <View style={styles.verifiedContainer}>
                <Text style={styles.inputLabel}>Is Franchise Parent?</Text>
                <Switch
                  value={formData.isFranchiseParent}
                  onValueChange={(value) => setFormData({ ...formData, isFranchiseParent: value, parentRestaurantId: value ? '' : formData.parentRestaurantId })}
                  trackColor={{ false: '#333', true: '#8B5CF660' }}
                  thumbColor={formData.isFranchiseParent ? '#8B5CF6' : '#999'}
                />
              </View>
              <Text style={styles.helpText}>Enable this if this restaurant is the main/parent location of a franchise with multiple branches</Text>

              {!formData.isFranchiseParent && (
                <>
                  <Text style={styles.inputLabel}>Parent Restaurant (Optional)</Text>
                  <Text style={styles.helpText}>Select a parent restaurant if this is a franchise branch</Text>
                  <View style={styles.optionsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.optionsScrollContent}>
                      <TouchableOpacity
                        style={[
                          styles.optionButton,
                          !formData.parentRestaurantId && styles.optionButtonActive,
                        ]}
                        onPress={() => setFormData({ ...formData, parentRestaurantId: '' })}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            !formData.parentRestaurantId && styles.optionTextActive,
                          ]}
                        >
                          None
                        </Text>
                      </TouchableOpacity>
                      {restaurants
                        .filter((r) => r.isFranchiseParent && r.id !== editingId)
                        .map((restaurant) => (
                          <TouchableOpacity
                            key={restaurant.id}
                            style={[
                              styles.optionButton,
                              formData.parentRestaurantId === restaurant.id && styles.optionButtonActive,
                            ]}
                            onPress={() => setFormData({ ...formData, parentRestaurantId: restaurant.id })}
                          >
                            <Text
                              style={[
                                styles.optionText,
                                formData.parentRestaurantId === restaurant.id && styles.optionTextActive,
                              ]}
                            >
                              {restaurant.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                  </View>
                </>
              )}

              <Text style={styles.inputLabel}>Cuisine Type * (Select at least one)</Text>
              <View style={styles.ambianceContainer}>
                <ScrollView style={styles.ambianceScrollView} nestedScrollEnabled>
                  <View style={styles.ambianceGrid}>
                    {CUISINE_OPTIONS.map((cuisine) => (
                      <TouchableOpacity
                        key={cuisine}
                        style={[
                          styles.ambianceButton,
                          formData.cuisine.includes(cuisine) && styles.ambianceButtonActive,
                        ]}
                        onPress={() => {
                          setFormData((prev) => {
                            const newCuisine = prev.cuisine.includes(cuisine)
                              ? prev.cuisine.filter((c) => c !== cuisine)
                              : [...prev.cuisine, cuisine];
                            return { ...prev, cuisine: newCuisine };
                          });
                        }}
                      >
                        <Text
                          style={[
                            styles.ambianceButtonText,
                            formData.cuisine.includes(cuisine) && styles.ambianceButtonTextActive,
                          ]}
                        >
                          {cuisine}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <Text style={styles.inputLabel}>Service Style *</Text>
              <View style={styles.optionsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.optionsScrollContent}>
                  {SERVICE_OPTIONS.map((service) => (
                    <TouchableOpacity
                      key={service}
                      style={[
                        styles.optionButton,
                        formData.serviceStyle === service && styles.optionButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, serviceStyle: service })}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          formData.serviceStyle === service && styles.optionTextActive,
                        ]}
                      >
                        {service}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.inputLabel}>Vibe & Atmosphere * (Select at least one)</Text>
              <View style={styles.ambianceContainer}>
                <ScrollView style={styles.ambianceScrollView} nestedScrollEnabled>
                  <View style={styles.ambianceGrid}>
                    {AMBIANCE_OPTIONS.map((amb) => (
                      <TouchableOpacity
                        key={amb}
                        style={[
                          styles.ambianceButton,
                          formData.ambiance.includes(amb) && styles.ambianceButtonActive,
                        ]}
                        onPress={() => toggleAmbiance(amb)}
                      >
                        <Text
                          style={[
                            styles.ambianceButtonText,
                            formData.ambiance.includes(amb) && styles.ambianceButtonTextActive,
                          ]}
                        >
                          {amb}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <Text style={styles.inputLabel}>Price Level (1-4)</Text>
              <View style={styles.priceLevelContainer}>
                {[1, 2, 3, 4].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.priceLevelButton,
                      formData.priceLevel === level.toString() && styles.priceLevelButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, priceLevel: level.toString() })}
                  >
                    <Text
                      style={[
                        styles.priceLevelText,
                        formData.priceLevel === level.toString() && styles.priceLevelTextActive,
                      ]}
                    >
                      {'$'.repeat(level)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.verifiedContainer}>
                <Text style={styles.inputLabel}>Verified Restaurant</Text>
                <Switch
                  value={formData.isVerified}
                  onValueChange={(value) => setFormData({ ...formData, isVerified: value })}
                  trackColor={{ false: '#333', true: '#10B98160' }}
                  thumbColor={formData.isVerified ? '#10B981' : '#999'}
                />
              </View>

              <Text style={styles.inputLabel}>Address *</Text>
              <TextInput
                style={styles.input}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="123 Main St"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Phone *</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="(555) 123-4567"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Tell us about the restaurant..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="New York"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Neighborhood</Text>
              <TextInput
                style={styles.input}
                value={formData.neighborhood}
                onChangeText={(text) => setFormData({ ...formData, neighborhood: text })}
                placeholder="Midtown"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Business Hours</Text>
              <Text style={styles.helpText}>Set opening hours for each day of the week</Text>
              {(Object.keys(formData.weekHours) as Array<keyof WeekHours>).map((day) => (
                <View key={day} style={styles.dayHoursContainer}>
                  <View style={styles.dayHoursHeader}>
                    <Text style={styles.dayLabel}>{day}</Text>
                    <Switch
                      value={formData.weekHours[day].isOpen}
                      onValueChange={(value) => {
                        setFormData({
                          ...formData,
                          weekHours: {
                            ...formData.weekHours,
                            [day]: { ...formData.weekHours[day], isOpen: value },
                          },
                        });
                      }}
                      trackColor={{ false: '#333', true: '#F59E0B60' }}
                      thumbColor={formData.weekHours[day].isOpen ? '#F59E0B' : '#999'}
                    />
                  </View>
                  {formData.weekHours[day].isOpen && (
                    <View style={styles.timeInputsContainer}>
                      <View style={styles.timeInputGroup}>
                        <Text style={styles.timeLabel}>Open</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={formData.weekHours[day].openTime}
                          onChangeText={(text) => {
                            setFormData({
                              ...formData,
                              weekHours: {
                                ...formData.weekHours,
                                [day]: { ...formData.weekHours[day], openTime: text },
                              },
                            });
                          }}
                          placeholder="09:00"
                          placeholderTextColor="#666"
                        />
                      </View>
                      <View style={styles.timeSeparatorContainer}>
                        <Text style={styles.timeSeparator}>-</Text>
                      </View>
                      <View style={styles.timeInputGroup}>
                        <Text style={styles.timeLabel}>Close</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={formData.weekHours[day].closeTime}
                          onChangeText={(text) => {
                            setFormData({
                              ...formData,
                              weekHours: {
                                ...formData.weekHours,
                                [day]: { ...formData.weekHours[day], closeTime: text },
                              },
                            });
                          }}
                          placeholder="22:00"
                          placeholderTextColor="#666"
                        />
                      </View>
                    </View>
                  )}
                </View>
              ))}

              <Text style={styles.inputLabel}>Restaurant Images</Text>
              <Text style={styles.helpText}>Add up to 5 images. Images will be compressed to ~300-500KB each. First image will be the main display.</Text>
              {formData.images.map((img, index) => (
                <View key={index} style={styles.imagePickerContainer}>
                  <View style={styles.imagePickerHeader}>
                    <Text style={styles.imageInputLabel}>Image {index + 1}</Text>
                    {img && (
                      <TouchableOpacity
                        onPress={() => removeImage(index)}
                        style={styles.removeImageButton}
                      >
                        <X size={16} color="#EF4444" />
                        <Text style={styles.removeImageText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {img ? (
                    <TouchableOpacity
                      style={styles.imagePreviewContainer}
                      onPress={() => pickImage(index)}
                    >
                      <Image
                        source={{ uri: img }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <View style={styles.changeImageOverlay}>
                        <ImagePlus size={20} color="#fff" />
                        <Text style={styles.changeImageText}>Change Image</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.imagePickerButton}
                      onPress={() => pickImage(index)}
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? (
                        <ActivityIndicator size="small" color="#F59E0B" />
                      ) : (
                        <>
                          <ImagePlus size={32} color="#666" />
                          <Text style={styles.imagePickerButtonText}>Tap to select image</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <Text style={styles.inputLabel}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={formData.latitude}
                onChangeText={(text) => setFormData({ ...formData, latitude: text })}
                placeholder="47.91845"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={formData.longitude}
                onChangeText={(text) => setFormData({ ...formData, longitude: text })}
                placeholder="106.91745"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Drop Pin on Map</Text>
              <Text style={styles.helpText}>Tap on the map to set restaurant location</Text>
              <MapPickerView
                latitude={parseFloat(formData.latitude) || 47.91845}
                longitude={parseFloat(formData.longitude) || 106.91745}
                onLocationSelect={(latitude: number, longitude: number) => {
                  setFormData({
                    ...formData,
                    latitude: latitude.toString(),
                    longitude: longitude.toString(),
                  });
                }}
              />

              <View style={styles.verifiedContainer}>
                <Text style={styles.inputLabel}>Outdoor Terrace</Text>
                <Switch
                  value={formData.hasOutdoorTerrace}
                  onValueChange={(value) => setFormData({ ...formData, hasOutdoorTerrace: value })}
                  trackColor={{ false: '#333', true: '#F59E0B60' }}
                  thumbColor={formData.hasOutdoorTerrace ? '#F59E0B' : '#999'}
                />
              </View>

              <Text style={styles.inputLabel}>Featured Options</Text>
              <Text style={styles.helpText}>Set restaurants as featured with specific date ranges</Text>
              
              <View style={styles.verifiedContainer}>
                <Text style={styles.inputLabel}>Featured on Home Page</Text>
                <Switch
                  value={formData.isFeaturedHome}
                  onValueChange={(value) => setFormData({ ...formData, isFeaturedHome: value })}
                  trackColor={{ false: '#333', true: '#F59E0B60' }}
                  thumbColor={formData.isFeaturedHome ? '#F59E0B' : '#999'}
                />
              </View>
              
              {formData.isFeaturedHome && (
                <View style={styles.dateRangeContainer}>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.featuredStartDate}
                      onChangeText={(text) => setFormData({ ...formData, featuredStartDate: text })}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#666"
                    />
                  </View>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>End Date</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.featuredEndDate}
                      onChangeText={(text) => setFormData({ ...formData, featuredEndDate: text })}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#666"
                    />
                  </View>
                </View>
              )}

              <View style={styles.verifiedContainer}>
                <Text style={styles.inputLabel}>Featured Cuisine: {Array.isArray(formData.cuisine) ? formData.cuisine.join(', ') : formData.cuisine}</Text>
                <Switch
                  value={formData.isCuisineFeatured}
                  onValueChange={(value) => setFormData({ ...formData, isCuisineFeatured: value })}
                  trackColor={{ false: '#333', true: '#10B98160' }}
                  thumbColor={formData.isCuisineFeatured ? '#10B981' : '#999'}
                />
              </View>
              
              {formData.isCuisineFeatured && (
                <View style={styles.dateRangeContainer}>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.cuisineFeaturedStartDate}
                      onChangeText={(text) => setFormData({ ...formData, cuisineFeaturedStartDate: text })}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#666"
                    />
                  </View>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>End Date</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.cuisineFeaturedEndDate}
                      onChangeText={(text) => setFormData({ ...formData, cuisineFeaturedEndDate: text })}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#666"
                    />
                  </View>
                </View>
              )}

              <View style={styles.verifiedContainer}>
                <Text style={styles.inputLabel}>Featured Service Style: {formData.serviceStyle}</Text>
                <Switch
                  value={formData.isServiceStyleFeatured}
                  onValueChange={(value) => setFormData({ ...formData, isServiceStyleFeatured: value })}
                  trackColor={{ false: '#333', true: '#3B82F660' }}
                  thumbColor={formData.isServiceStyleFeatured ? '#3B82F6' : '#999'}
                />
              </View>
              
              {formData.isServiceStyleFeatured && (
                <View style={styles.dateRangeContainer}>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.serviceStyleFeaturedStartDate}
                      onChangeText={(text) => setFormData({ ...formData, serviceStyleFeaturedStartDate: text })}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#666"
                    />
                  </View>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>End Date</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.serviceStyleFeaturedEndDate}
                      onChangeText={(text) => setFormData({ ...formData, serviceStyleFeaturedEndDate: text })}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#666"
                    />
                  </View>
                </View>
              )}

              {formData.ambiance.length > 0 && (
                <View>
                  <Text style={styles.inputLabel}>Featured Vibes</Text>
                  <Text style={styles.helpText}>Set individual vibes as featured</Text>
                  {formData.ambiance.map((amb) => (
                    <View key={amb}>
                      <View style={styles.verifiedContainer}>
                        <Text style={styles.inputLabel}>{amb}</Text>
                        <Switch
                          value={formData.ambianceFeatured[amb]?.enabled || false}
                          onValueChange={(value) => {
                            setFormData({
                              ...formData,
                              ambianceFeatured: {
                                ...formData.ambianceFeatured,
                                [amb]: {
                                  ...formData.ambianceFeatured[amb],
                                  enabled: value,
                                },
                              },
                            });
                          }}
                          trackColor={{ false: '#333', true: '#8B5CF660' }}
                          thumbColor={formData.ambianceFeatured[amb]?.enabled ? '#8B5CF6' : '#999'}
                        />
                      </View>
                      {formData.ambianceFeatured[amb]?.enabled && (
                        <View style={styles.dateRangeContainer}>
                          <View style={styles.dateInputContainer}>
                            <Text style={styles.dateLabel}>Start Date</Text>
                            <TextInput
                              style={styles.input}
                              value={formData.ambianceFeatured[amb]?.startDate || ''}
                              onChangeText={(text) => {
                                setFormData({
                                  ...formData,
                                  ambianceFeatured: {
                                    ...formData.ambianceFeatured,
                                    [amb]: {
                                      ...formData.ambianceFeatured[amb],
                                      startDate: text,
                                    },
                                  },
                                });
                              }}
                              placeholder="YYYY-MM-DD"
                              placeholderTextColor="#666"
                            />
                          </View>
                          <View style={styles.dateInputContainer}>
                            <Text style={styles.dateLabel}>End Date</Text>
                            <TextInput
                              style={styles.input}
                              value={formData.ambianceFeatured[amb]?.endDate || ''}
                              onChangeText={(text) => {
                                setFormData({
                                  ...formData,
                                  ambianceFeatured: {
                                    ...formData.ambianceFeatured,
                                    [amb]: {
                                      ...formData.ambianceFeatured[amb],
                                      endDate: text,
                                    },
                                  },
                                });
                              }}
                              placeholder="YYYY-MM-DD"
                              placeholderTextColor="#666"
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.inputLabel}>Explore Page Features</Text>
              <Text style={styles.helpText}>Set restaurant to appear in special sections on Explore page</Text>
              
              <View style={styles.verifiedContainer}>
                <Text style={styles.inputLabel}>This Week&apos;s Special</Text>
                <Switch
                  value={formData.isWeekSpecial}
                  onValueChange={(value) => setFormData({ ...formData, isWeekSpecial: value })}
                  trackColor={{ false: '#333', true: '#F59E0B60' }}
                  thumbColor={formData.isWeekSpecial ? '#F59E0B' : '#999'}
                />
              </View>
              
              {formData.isWeekSpecial && (
                <>
                  <Text style={styles.inputLabel}>Display Order (1-5)</Text>
                  <Text style={styles.helpText}>Lower numbers appear first. Leave empty to use default order.</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.weekSpecialOrder}
                    onChangeText={(text) => setFormData({ ...formData, weekSpecialOrder: text })}
                    placeholder="e.g. 1 for first position"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                  <View style={styles.dateRangeContainer}>
                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateLabel}>Start Date</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.weekSpecialStartDate}
                        onChangeText={(text) => setFormData({ ...formData, weekSpecialStartDate: text })}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#666"
                      />
                    </View>
                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateLabel}>End Date</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.weekSpecialEndDate}
                        onChangeText={(text) => setFormData({ ...formData, weekSpecialEndDate: text })}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#666"
                      />
                    </View>
                  </View>
                </>
              )}

              <View style={styles.verifiedContainer}>
                <Text style={styles.inputLabel}>Discount Offer</Text>
                <Switch
                  value={formData.hasDiscount}
                  onValueChange={(value) => setFormData({ ...formData, hasDiscount: value })}
                  trackColor={{ false: '#333', true: '#10B98160' }}
                  thumbColor={formData.hasDiscount ? '#10B981' : '#999'}
                />
              </View>
              
              {formData.hasDiscount && (
                <>
                  <Text style={styles.inputLabel}>Discount Amount</Text>
                  <Text style={styles.helpText}>e.g. &quot;20%&quot;, &quot;15% off&quot;, &quot;₮5000 off&quot;</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.discountAmount}
                    onChangeText={(text) => setFormData({ ...formData, discountAmount: text })}
                    placeholder="e.g. 20% off"
                    placeholderTextColor="#666"
                  />
                  <Text style={styles.inputLabel}>Discount Description</Text>
                  <Text style={styles.helpText}>Describe what the discount applies to (e.g. &quot;on your entire bill&quot;, &quot;on main courses&quot;, &quot;for groups of 4+&quot;)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.discountDescription}
                    onChangeText={(text) => setFormData({ ...formData, discountDescription: text })}
                    placeholder="e.g. on your entire bill"
                    placeholderTextColor="#666"
                  />
                  <Text style={styles.inputLabel}>Display Order (1-5)</Text>
                  <Text style={styles.helpText}>Lower numbers appear first. Leave empty to use default order.</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.discountOrder}
                    onChangeText={(text) => setFormData({ ...formData, discountOrder: text })}
                    placeholder="e.g. 1 for first position"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                  <View style={styles.dateRangeContainer}>
                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateLabel}>Start Date</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.discountStartDate}
                        onChangeText={(text) => setFormData({ ...formData, discountStartDate: text })}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#666"
                      />
                    </View>
                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateLabel}>End Date</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.discountEndDate}
                        onChangeText={(text) => setFormData({ ...formData, discountEndDate: text })}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#666"
                      />
                    </View>
                  </View>
                </>
              )}

              <View style={styles.verifiedContainer}>
                <Text style={styles.inputLabel}>Eatly&apos;s Top 10</Text>
                <Switch
                  value={formData.isTop10}
                  onValueChange={(value) => setFormData({ ...formData, isTop10: value })}
                  trackColor={{ false: '#333', true: '#3B82F660' }}
                  thumbColor={formData.isTop10 ? '#3B82F6' : '#999'}
                />
              </View>
              
              {formData.isTop10 && (
                <>
                  <Text style={styles.inputLabel}>Ranking (1-10)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.top10Rank}
                    onChangeText={(text) => setFormData({ ...formData, top10Rank: text })}
                    placeholder="e.g. 1 (for #1 ranking)"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                  <Text style={styles.inputLabel}>Display Order (1-5)</Text>
                  <Text style={styles.helpText}>Lower numbers appear first. Leave empty to sort by ranking.</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.top10Order}
                    onChangeText={(text) => setFormData({ ...formData, top10Order: text })}
                    placeholder="e.g. 1 for first position"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                  <View style={styles.dateRangeContainer}>
                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateLabel}>Start Date</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.top10StartDate}
                        onChangeText={(text) => setFormData({ ...formData, top10StartDate: text })}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#666"
                      />
                    </View>
                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateLabel}>End Date</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.top10EndDate}
                        onChangeText={(text) => setFormData({ ...formData, top10EndDate: text })}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#666"
                      />
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {editingId ? 'Update Restaurant' : 'Add Restaurant'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showImportModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowImportModal(false);
          setImportText('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bulk Import Restaurants</Text>
              <TouchableOpacity onPress={() => {
                setShowImportModal(false);
                setImportText('');
              }}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.importInstructions}>
                Import multiple restaurants at once using CSV format.
              </Text>
              
              <TouchableOpacity
                style={styles.downloadTemplateButton}
                onPress={() => {
                  const template = generateCSVTemplate();
                  Alert.alert(
                    'CSV Template',
                    'Copy this template and paste it into Google Sheets or Excel:\n\n' + template,
                    [
                      { text: 'OK', style: 'default' },
                    ]
                  );
                }}
              >
                <FileDown size={20} color="#10B981" />
                <Text style={styles.downloadTemplateButtonText}>View CSV Template</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Paste CSV Data</Text>
              <Text style={styles.helpText}>
                Copy cells from Google Sheets (or Excel) and paste here.
                Make sure to include the header row.
              </Text>
              <TextInput
                style={[styles.input, styles.importTextArea]}
                value={importText}
                onChangeText={setImportText}
                placeholder="Paste CSV data here...\n\nExample:\nName,Cuisine,Service Style,Vibes,Address,Phone,Description,City,Neighborhood,Latitude,Longitude,Price Level,Image URL\nRestaurant A,Italian,Fine Dining,Romantic|Date Night,123 Main St,(555) 123-4567,Description,New York,Midtown,40.7580,-73.9855,3,https://example.com/image.jpg"
                placeholderTextColor="#444"
                multiline
                numberOfLines={10}
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleBulkImport}
              >
                <Text style={styles.submitButtonText}>Import Restaurants</Text>
              </TouchableOpacity>

              <View style={styles.instructionsCard}>
                <Text style={styles.instructionsTitle}>Instructions:</Text>
                <Text style={styles.instructionsText}>1. Click &quot;View CSV Template&quot; to see the format</Text>
                <Text style={styles.instructionsText}>2. Create/Open Google Spreadsheet</Text>
                <Text style={styles.instructionsText}>3. Copy the template headers into row 1</Text>
                <Text style={styles.instructionsText}>4. Add your restaurant data in the rows below</Text>
                <Text style={styles.instructionsText}>5. Select all cells (including headers) and copy</Text>
                <Text style={styles.instructionsText}>6. Paste into the text box above</Text>
                <Text style={styles.instructionsText}>7. Click Import Restaurants</Text>
                <Text style={[styles.instructionsText, { marginTop: 12, fontStyle: 'italic' as const }]}>
                  Note: Separate multiple values with | (pipe). Example: Italian|French or Romantic|Cozy
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function generateCSVTemplate(): string {
  return 'Name,Cuisine,Service Style,Vibes,Address,Phone,Description,City,Neighborhood,Latitude,Longitude,Price Level,Image URLs,Verified,Outdoor Terrace\nExample Restaurant,Italian|Mediterranean,Fine Dining,Romantic|Date Night,123 Main Street,(555) 123-4567,A beautiful Italian restaurant,New York,Midtown,40.7580,-73.9855,3,https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800,Yes,No';
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === '\t') && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (char === '\n' && !inQuotes) {
      if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      }
    } else if (char === '\r') {
      continue;
    } else {
      currentCell += char;
    }
  }
  
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell)) {
      rows.push(currentRow);
    }
  }
  
  return rows;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    flexDirection: 'row' as const,
    padding: 16,
    gap: 12,
    alignItems: 'center' as const,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
  importButton: {
    width: 48,
    height: 48,
    backgroundColor: '#10B981',
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    marginBottom: 12,
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap' as const,
  },
  name: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
  },
  featuredBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#F59E0B',
  },
  verifiedBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: '#10B98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  franchiseBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: '#8B5CF620',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  franchiseText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#8B5CF6',
  },
  branchBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: '#3B82F620',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  branchText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  cuisine: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  vibes: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic' as const,
  },
  stats: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  stat: {
    fontSize: 14,
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
  featButton: {
    backgroundColor: '#F59E0B10',
    borderColor: '#F59E0B40',
  },
  unfeatButton: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  editButton: {
    backgroundColor: '#3B82F610',
    borderColor: '#3B82F640',
  },
  deleteButton: {
    backgroundColor: '#EF444410',
    borderColor: '#EF444440',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyText: {
    textAlign: 'center' as const,
    color: '#999',
    fontSize: 16,
    marginTop: 48,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ccc',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top' as const,
  },
  optionsContainer: {
    marginBottom: 8,
    maxHeight: 60,
  },
  optionsScrollContent: {
    paddingRight: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 8,
  },
  optionButtonActive: {
    backgroundColor: '#F59E0B20',
    borderColor: '#F59E0B',
  },
  optionText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500' as const,
  },
  optionTextActive: {
    color: '#F59E0B',
    fontWeight: '600' as const,
  },
  ambianceContainer: {
    maxHeight: 200,
    marginBottom: 8,
    backgroundColor: '#000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
  },
  ambianceScrollView: {
    flex: 1,
  },
  ambianceGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  ambianceButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
  },
  ambianceButtonActive: {
    backgroundColor: '#10B98120',
    borderColor: '#10B981',
  },
  ambianceButtonText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500' as const,
  },
  ambianceButtonTextActive: {
    color: '#10B981',
    fontWeight: '600' as const,
  },
  priceLevelContainer: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 8,
  },
  priceLevelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center' as const,
  },
  priceLevelButtonActive: {
    backgroundColor: '#3B82F620',
    borderColor: '#3B82F6',
  },
  priceLevelText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600' as const,
  },
  priceLevelTextActive: {
    color: '#3B82F6',
  },
  verifiedContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
  },
  imagePickerContainer: {
    marginBottom: 16,
  },
  imagePickerHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  imageInputLabel: {
    fontSize: 13,
    color: '#888',
  },
  removeImageButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EF444410',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF444440',
  },
  removeImageText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600' as const,
  },
  imagePickerButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: '#333',
    padding: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  imagePickerButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },
  imagePreviewContainer: {
    position: 'relative' as const,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    backgroundColor: '#000',
  },
  changeImageOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    opacity: 0.9,
  },
  changeImageText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600' as const,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic' as const,
  },
  submitButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    marginTop: 24,
    marginBottom: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  dayHoursContainer: {
    backgroundColor: '#000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
    marginBottom: 12,
  },
  dayHoursHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  timeInputsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
  },
  timeSeparatorContainer: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 18,
  },
  timeSeparator: {
    fontSize: 18,
    color: '#666',
  },
  dateRangeContainer: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 16,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  importTextArea: {
    height: 300,
    textAlignVertical: 'top' as const,
    fontFamily: 'monospace' as const,
    fontSize: 12,
  },
  importInstructions: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
    lineHeight: 20,
  },
  downloadTemplateButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: '#10B98120',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  downloadTemplateButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  instructionsCard: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 13,
    color: '#999',
    lineHeight: 20,
    marginBottom: 4,
  },
});
