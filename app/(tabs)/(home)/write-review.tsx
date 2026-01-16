import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Star, Send, Camera, X } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { RESTAURANTS } from '@/mocks/restaurants';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { useRestaurants } from '@/contexts/RestaurantContext';

export default function WriteReviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { restaurantId, restaurantName } = useLocalSearchParams<{
    restaurantId: string;
    restaurantName: string;
  }>();
  const { addReview } = useUser();
  const { colors, isDark } = useTheme();
  const { updateRestaurantRatings } = useRestaurants();
  const { t } = useLanguage();

  const [foodRating, setFoodRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [ambienceRating, setAmbienceRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const restaurant = RESTAURANTS.find((r) => r.id === restaurantId);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map((asset) => asset.uri);
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (foodRating === 0 || serviceRating === 0 || ambienceRating === 0 || valueRating === 0 || cleanlinessRating === 0) {
      Alert.alert('Error', 'Please rate all categories');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Error', 'Please write a review');
      return;
    }

    const overallRating = Math.round((foodRating + serviceRating + ambienceRating + valueRating + cleanlinessRating) / 5);

    setIsSubmitting(true);
    try {
      console.log('WriteReview: Submitting review...');
      const reviewData: any = {
        restaurantId: restaurantId!,
        restaurantName: restaurantName || restaurant?.name || 'Unknown Restaurant',
        rating: overallRating,
        comment: comment.trim(),
        detailedRatings: {
          food: foodRating,
          service: serviceRating,
          ambience: ambienceRating,
          value: valueRating,
          cleanliness: cleanlinessRating,
        },
      };
      
      if (photos.length > 0) {
        reviewData.photos = photos;
      }
      
      console.log('WriteReview: Review data to submit:', reviewData);
      const newReview = await addReview(reviewData);

      console.log('WriteReview: Review submitted successfully:', newReview);
      
      console.log('WriteReview: Updating restaurant ratings...');
      await updateRestaurantRatings(restaurantId!);
      console.log('WriteReview: Restaurant ratings updated');
      
      console.log('WriteReview: Waiting for Firestore to propagate changes...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubmitting(false);
      
      router.back();
    } catch (error) {
      console.error('WriteReview: Error submitting review:', error);
      setIsSubmitting(false);
      Alert.alert('Error', `Failed to submit review: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Send size={22} color={isSubmitting ? colors.textTertiary : colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>
            Leave a review for {restaurantName || restaurant?.name || 'Unknown Restaurant'}
          </Text>

          <View style={styles.ratingsGrid}>
            <View style={styles.ratingRow}>
              <View style={styles.ratingItem}>
                <Text style={[styles.ratingLabel, { color: colors.text }]}>{t.reviewCategories.food}</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setFoodRating(star)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      style={styles.starButton}
                    >
                      <Star
                        size={28}
                        color="#FFB800"
                        fill={star <= foodRating ? '#FFB800' : (isDark ? '#374151' : '#E0E0E0')}
                        strokeWidth={0}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.ratingItem}>
                <Text style={[styles.ratingLabel, { color: colors.text }]}>{t.reviewCategories.service}</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setServiceRating(star)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      style={styles.starButton}
                    >
                      <Star
                        size={28}
                        color="#FFB800"
                        fill={star <= serviceRating ? '#FFB800' : (isDark ? '#374151' : '#E0E0E0')}
                        strokeWidth={0}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.ratingRow}>
              <View style={styles.ratingItem}>
                <Text style={[styles.ratingLabel, { color: colors.text }]}>{t.reviewCategories.ambience}</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setAmbienceRating(star)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      style={styles.starButton}
                    >
                      <Star
                        size={28}
                        color="#FFB800"
                        fill={star <= ambienceRating ? '#FFB800' : (isDark ? '#374151' : '#E0E0E0')}
                        strokeWidth={0}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.ratingItem}>
                <Text style={[styles.ratingLabel, { color: colors.text }]}>{t.reviewCategories.value}</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setValueRating(star)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      style={styles.starButton}
                    >
                      <Star
                        size={28}
                        color="#FFB800"
                        fill={star <= valueRating ? '#FFB800' : (isDark ? '#374151' : '#E0E0E0')}
                        strokeWidth={0}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.ratingRow}>
              <View style={styles.ratingItem}>
                <Text style={[styles.ratingLabel, { color: colors.text }]}>{t.reviewCategories.cleanliness}</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setCleanlinessRating(star)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      style={styles.starButton}
                    >
                      <Star
                        size={28}
                        color="#FFB800"
                        fill={star <= cleanlinessRating ? '#FFB800' : (isDark ? '#374151' : '#E0E0E0')}
                        strokeWidth={0}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.ratingItem} />
            </View>
          </View>

          <View style={styles.commentSection}>
            <Text style={[styles.commentTitle, { color: colors.text }]}>
              Tell us about your experience at {restaurantName || restaurant?.name || 'this restaurant'}
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              value={comment}
              onChangeText={setComment}
              placeholder={`Leave a review of your experience at ${restaurantName || restaurant?.name || 'this restaurant'}`}
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.photosSection}>
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                    activeOpacity={0.7}
                  >
                    <X size={16} color="#fff" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              ))}
              
              {photos.length < 5 && (
                <TouchableOpacity
                  style={[styles.addPhotoButton, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
                  onPress={pickImages}
                  activeOpacity={0.7}
                >
                  <Camera size={24} color={colors.primary} />
                  <Text style={[styles.addPhotoText, { color: colors.primary }]}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Your Review'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#6B4DB6',
    padding: 24,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 28,
    textAlign: 'center',
  },
  ratingsGrid: {
    marginBottom: 28,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  ratingItem: {
    flex: 1,
    marginHorizontal: 8,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
    flexWrap: 'wrap',
  },
  starButton: {
    marginHorizontal: 1,
  },
  commentSection: {
    marginBottom: 24,
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
  },
  photosSection: {
    marginBottom: 24,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#7C5CDB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F6FF',
  },
  addPhotoText: {
    fontSize: 11,
    color: '#7C5CDB',
    fontWeight: '600' as const,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#2B3B47',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
