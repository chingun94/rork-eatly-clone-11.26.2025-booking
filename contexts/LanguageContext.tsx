import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'mn';

export interface Translations {
  common: {
    loading: string;
    search: string;
    cancel: string;
    delete: string;
    save: string;
    edit: string;
    confirm: string;
    yes: string;
    no: string;
    sort: string;
  };
  home: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    locationPlaceholder: string;
    nearby: string;
    openNow: string;
    sortBy: string;
    rating: string;
    distance: string;
    mostReviewed: string;
    restaurants: string;
    restaurant: string;
    sortedByDistance: string;
    noRestaurantsFound: string;
    adjustFilters: string;
    clearAllFilters: string;
    all: string;
    cuisine: string;
    service: string;
    vibe: string;
    permissionDenied: string;
    permissionMessage: string;
    error: string;
    locationError: string;
    kmAway: string;
  };
  explore: {
    title: string;
    subtitle: string;
    cuisineTypes: string;
    serviceStyle: string;
    serviceType: string;
    vibeOccasion: string;
    vibeAtmosphere: string;
    restaurants: string;
    locations: string;
    nearby: string;
    openNow: string;
    mostReviewed: string;
    highestRated: string;
  };
  profile: {
    title: string;
    editProfile: string;
    theme: string;
    light: string;
    dark: string;
    auto: string;
    language: string;
    reviews: string;
    saved: string;
    memberSince: string;
    myReviews: string;
    savedRestaurants: string;
    noReviewsYet: string;
    startReviewing: string;
    noSavedRestaurants: string;
    saveRestaurants: string;
    deleteReview: string;
    deleteReviewConfirm: string;
  };
  review: {
    writeReview: string;
    rating: string;
    yourReview: string;
    reviewPlaceholder: string;
    addPhotos: string;
    submit: string;
    selectRestaurant: string;
    pickFromGallery: string;
    permissionDenied: string;
    permissionMessage: string;
    fillAllFields: string;
    reviewSubmitted: string;
  };
  reviewCategories: {
    food: string;
    service: string;
    ambience: string;
    value: string;
    cleanliness: string;
  };
  editProfile: {
    title: string;
    name: string;
    email: string;
    saveChanges: string;
    fillAllFields: string;
    profileUpdated: string;
  };
  restaurant: {
    reviews: string;
    writeReview: string;
    overview: string;
    cuisineType: string;
    serviceStyle: string;
    priceLevel: string;
    location: string;
    openingHours: string;
    phone: string;
    website: string;
    vibes: string;
    noReviewsYet: string;
    beFirst: string;
  };
  serviceTypes: Record<string, string>;
  ambianceTypes: Record<string, string>;
  cuisineTypes: Record<string, string>;
  dayNames: {
    full: Record<string, string>;
    short: Record<string, string>;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    common: {
      loading: 'Loading...',
      search: 'Search',
      cancel: 'Cancel',
      delete: 'Delete',
      save: 'Save',
      edit: 'Edit',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      sort: 'Sort',
    },
    home: {
      title: 'Discover',
      subtitle: 'Таны хүссэн ресторан Eatly-д',
      searchPlaceholder: 'Search restaurants or cuisine...',
      locationPlaceholder: 'Search by city or neighborhood...',
      nearby: 'Nearby',
      openNow: 'Open Now',
      sortBy: 'Sort by:',
      rating: 'Rating',
      distance: 'Distance',
      mostReviewed: 'Most Reviewed',
      restaurants: 'restaurants',
      restaurant: 'restaurant',
      sortedByDistance: 'sorted by distance',
      noRestaurantsFound: 'No restaurants found',
      adjustFilters: 'Try adjusting your filters or search query',
      clearAllFilters: 'Clear all filters',
      all: 'All',
      cuisine: 'Cuisine',
      service: 'Service',
      vibe: 'Vibe',
      permissionDenied: 'Permission Denied',
      permissionMessage: 'Location permission is required to find nearby restaurants.',
      error: 'Error',
      locationError: 'Unable to get your location. Please try again.',
      kmAway: 'km away',
    },
    explore: {
      title: 'Explore',
      subtitle: 'Browse by category',
      cuisineTypes: 'Cuisine Types',
      serviceStyle: 'Service Style',
      serviceType: 'Service Type',
      vibeOccasion: 'Vibe & Occasion',
      vibeAtmosphere: 'Vibe & Atmosphere',
      restaurants: 'restaurants',
      locations: 'Locations',
      nearby: 'Nearby',
      openNow: 'Open Now',
      mostReviewed: 'Most Reviewed',
      highestRated: 'Highest Rated',
    },
    profile: {
      title: 'Profile',
      editProfile: 'Edit Profile',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      auto: 'Auto',
      language: 'Language',
      reviews: 'Reviews',
      saved: 'Saved',
      memberSince: 'Member Since',
      myReviews: 'My Reviews',
      savedRestaurants: 'Saved Restaurants',
      noReviewsYet: 'No reviews yet',
      startReviewing: 'Start reviewing restaurants to share your experiences',
      noSavedRestaurants: 'No saved restaurants',
      saveRestaurants: 'Save restaurants to easily find them later',
      deleteReview: 'Delete Review',
      deleteReviewConfirm: 'Are you sure you want to delete this review?',
    },
    review: {
      writeReview: 'Write a Review',
      rating: 'Rating',
      yourReview: 'Your Review',
      reviewPlaceholder: 'Share your experience...',
      addPhotos: 'Add Photos',
      submit: 'Submit Review',
      selectRestaurant: 'Select a Restaurant',
      pickFromGallery: 'Pick from gallery',
      permissionDenied: 'Permission Denied',
      permissionMessage: 'Gallery permission is required to add photos.',
      fillAllFields: 'Please fill in all required fields',
      reviewSubmitted: 'Review submitted successfully!',
    },
    reviewCategories: {
      food: 'Food',
      service: 'Service',
      ambience: 'Ambience',
      value: 'Value for money',
      cleanliness: 'Cleanliness',
    },
    editProfile: {
      title: 'Edit Profile',
      name: 'Name',
      email: 'Email',
      saveChanges: 'Save Changes',
      fillAllFields: 'Please fill in all fields',
      profileUpdated: 'Profile updated successfully!',
    },
    restaurant: {
      reviews: 'Reviews',
      writeReview: 'Write Review',
      overview: 'Overview',
      cuisineType: 'Cuisine Type',
      serviceStyle: 'Service Type',
      priceLevel: 'Price Level',
      location: 'Location',
      openingHours: 'Opening Hours',
      phone: 'Phone',
      website: 'Website',
      vibes: 'Vibe & Atmosphere',
      noReviewsYet: 'No reviews yet',
      beFirst: 'Be the first to review!',
    },
    serviceTypes: {
      'Fine Dining': 'Fine Dining',
      'Casual Dining': 'Casual Dining',
      'Fast Casual': 'Fast Casual',
      'Cafe': 'Cafe',
      'Buffet': 'Buffet',
      'Food Truck': 'Food Truck',
      'Counter Service': 'Counter Service',
    },
    ambianceTypes: {
      'Romantic': 'Romantic',
      'Business Lunch': 'Business Lunch',
      'Family Friendly': 'Family Friendly',
      'Date Night': 'Date Night',
      'Trendy': 'Trendy',
      'Cozy': 'Cozy',
      'Lively': 'Lively',
      'Quiet': 'Quiet',
      'Outdoor Seating': 'Outdoor Seating',
      'Late Night': 'Late Night',
      'VIP Room': 'VIP Room',
    },
    cuisineTypes: {
      'Italian': 'Italian',
      'Japanese': 'Japanese',
      'Mexican': 'Mexican',
      'French': 'French',
      'American': 'American',
      'Chinese': 'Chinese',
      'Thai': 'Thai',
      'Indian': 'Indian',
      'Mediterranean': 'Mediterranean',
      'Korean': 'Korean',
      'European': 'European',
      'Turkish': 'Turkish',
      'Vegetarian/Vegan': 'Vegetarian/Vegan',
      'Hot-Pot': 'Hot-Pot',
      'Mongolian': 'Mongolian',
      'Asian': 'Asian',
      'Ramen': 'Ramen',
    },
    dayNames: {
      full: {
        'Monday': 'Monday',
        'Tuesday': 'Tuesday',
        'Wednesday': 'Wednesday',
        'Thursday': 'Thursday',
        'Friday': 'Friday',
        'Saturday': 'Saturday',
        'Sunday': 'Sunday',
      },
      short: {
        'Monday': 'Mon',
        'Tuesday': 'Tue',
        'Wednesday': 'Wed',
        'Thursday': 'Thu',
        'Friday': 'Fri',
        'Saturday': 'Sat',
        'Sunday': 'Sun',
      },
    },
  },
  mn: {
    common: {
      loading: 'Ачааллаж байна...',
      search: 'Хайх',
      cancel: 'Болих',
      delete: 'Устгах',
      save: 'Хадгалах',
      edit: 'Засах',
      confirm: 'Баталгаажуулах',
      yes: 'Тийм',
      no: 'Үгүй',
      sort: 'Эрэмбэлэх',
    },
    home: {
      title: 'Хайх',
      subtitle: 'Таны хүссэн ресторан Eatly-д',
      searchPlaceholder: 'Ресторан эсвэл хоолны төрөл хайх...',
      locationPlaceholder: 'Хот эсвэл дүүргээр хайх...',
      nearby: 'Ойролцоо',
      openNow: 'Нээлттэй',
      sortBy: 'Эрэмбэлэх:',
      rating: 'Үнэлгээ Өндөр',
      distance: 'Зай',
      mostReviewed: 'Их сэтгэгдэлтэй',
      restaurants: 'ресторан',
      restaurant: 'ресторан',
      sortedByDistance: 'зайгаар эрэмбэлсэн',
      noRestaurantsFound: 'Ресторан олдсонгүй',
      adjustFilters: 'Шүүлтүүр эсвэл хайлтаа өөрчилнө үү',
      clearAllFilters: 'Бүх шүүлтүүрийг арилгах',
      all: 'Бүгд',
      cuisine: 'Хоолны төрөл',
      service: 'Үйлчилгээ',
      vibe: 'Уур амьсгал',
      permissionDenied: 'Зөвшөөрөл татгалзсан',
      permissionMessage: 'Ойролцоох ресторануудыг олохын тулд байршлын зөвшөөрөл шаардлагатай.',
      error: 'Алдаа',
      locationError: 'Таны байршлыг олж чадсангүй. Дахин оролдоно уу.',
      kmAway: 'км',
    },
    explore: {
      title: 'Төрлүүд',
      subtitle: 'Ангилал дагуу үзэх',
      cuisineTypes: 'Хоолны төрөл',
      serviceStyle: 'Үйлчилгээний хэв маяг',
      serviceType: 'Төрөл',
      vibeOccasion: 'Уур амьсгал ба үйл явдал',
      vibeAtmosphere: 'Уур амьсгал/Орчин',
      restaurants: 'ресторан',
      locations: 'Бүртгэлтэй салбар',
      nearby: 'Ойролцоо',
      openNow: 'Нээлттэй',
      mostReviewed: 'Их сэтгэгдэлтэй',
      highestRated: 'Үнэлгээ Өндөр',
    },
    profile: {
      title: 'Профайл',
      editProfile: 'Профайл засах',
      theme: 'Загвар',
      light: 'Цайвар',
      dark: 'Харанхуй',
      auto: 'Автомат',
      language: 'Хэл',
      reviews: 'Үнэлгээ',
      saved: 'Хадгалсан',
      memberSince: 'Гишүүнээс хойш',
      myReviews: 'Миний үнэлгээнүүд',
      savedRestaurants: 'Хадгалсан ресторанууд',
      noReviewsYet: 'Үнэлгээ хараахан байхгүй',
      startReviewing: 'Өөрийн туршлагаа хуваалцахын тулд ресторан үнэлж эхлээрэй',
      noSavedRestaurants: 'Хадгалсан ресторан байхгүй',
      saveRestaurants: 'Хожим олоход хялбар байхын тулд рестораныг хадгална уу',
      deleteReview: 'Үнэлгээ устгах',
      deleteReviewConfirm: 'Та үнэхээр энэ үнэлгээг устгахыг хүсч байна уу?',
    },
    review: {
      writeReview: 'Үнэлгээ бичих',
      rating: 'Үнэлгээ',
      yourReview: 'Таны үнэлгээ',
      reviewPlaceholder: 'Туршлагаа хуваалцаарай...',
      addPhotos: 'Зураг нэмэх',
      submit: 'Үнэлгээ илгээх',
      selectRestaurant: 'Ресторан сонгох',
      pickFromGallery: 'Галерейгаас сонгох',
      permissionDenied: 'Зөвшөөрөл татгалзсан',
      permissionMessage: 'Зураг нэмэхийн тулд галерейн зөвшөөрөл шаардлагатай.',
      fillAllFields: 'Шаардлагатай бүх талбарыг бөглөнө үү',
      reviewSubmitted: 'Үнэлгээ амжилттай илгээгдлээ!',
    },
    reviewCategories: {
      food: 'Хоол',
      service: 'Үйлчилгээ',
      ambience: 'Орчин',
      value: 'Үнэ/чанар',
      cleanliness: 'Цэвэр',
    },
    editProfile: {
      title: 'Профайл засах',
      name: 'Нэр',
      email: 'И-мэйл',
      saveChanges: 'Өөрчлөлт хадгалах',
      fillAllFields: 'Бүх талбарыг бөглөнө үү',
      profileUpdated: 'Профайл амжилттай шинэчлэгдлээ!',
    },
    restaurant: {
      reviews: 'Үнэлгээнүүд',
      writeReview: 'Үнэлгээ бичих',
      overview: 'Тойм',
      cuisineType: 'Хоолны төрөл',
      serviceStyle: 'Төрөл',
      priceLevel: 'Үнийн түвшин',
      location: 'Байршил',
      openingHours: 'Нээлттэй цагууд',
      phone: 'Утас',
      website: 'Вэбсайт',
      vibes: 'Уур амьсгал/Орчин',
      noReviewsYet: 'Үнэлгээ хараахан байхгүй',
      beFirst: 'Анхны үнэлгээ өгөгч болоорой!',
    },
    serviceTypes: {
      'Fine Dining': 'Тансаг зоог',
      'Casual Dining': 'Энгийн ресторан',
      'Fast Casual': 'Түргэн хоол',
      'Cafe': 'Кофе шоп',
      'Buffet': 'Буфет',
      'Food Truck': 'Food Truck',
      'Counter Service': 'Counter Service',
    },
    ambianceTypes: {
      'Romantic': 'Романтик',
      'Business Lunch': 'Бизнес уулзалт',
      'Family Friendly': 'Гэр бүлийн',
      'Date Night': 'Болзооны',
      'Trendy': 'Загварлаг/Орчин үеийн',
      'Cozy': 'Тухтай',
      'Lively': 'Lounge',
      'Quiet': 'Нам гүм',
      'Outdoor Seating': 'Гадна суудал (Террасс)',
      'Late Night': 'Шөнийн цагаар',
      'VIP Room': 'VIP өрөө',
    },
    cuisineTypes: {
      'Italian': 'Итали',
      'Japanese': 'Япон',
      'Mexican': 'Мексик',
      'French': 'Франц',
      'American': 'Америк',
      'Chinese': 'Хятад',
      'Thai': 'Тай',
      'Indian': 'Энэтхэг',
      'Mediterranean': 'Mediterranean',
      'Korean': 'Солонгос',
      'European': 'Европ',
      'Turkish': 'Турк',
      'Vegetarian/Vegan': 'Веган хоол',
      'Hot-Pot': 'Hot-Pot',
      'Mongolian': 'Монгол',
      'Asian': 'Ази',
      'Ramen': 'Рамен',
    },
    dayNames: {
      full: {
        'Monday': 'Даваа',
        'Tuesday': 'Мягмар',
        'Wednesday': 'Лхагва',
        'Thursday': 'Пүрэв',
        'Friday': 'Баасан',
        'Saturday': 'Бямба',
        'Sunday': 'Ням',
      },
      short: {
        'Monday': 'Да',
        'Tuesday': 'Мя',
        'Wednesday': 'Лх',
        'Thursday': 'Пү',
        'Friday': 'Ба',
        'Saturday': 'Бя',
        'Sunday': 'Ня',
      },
    },
  },
};

const LANGUAGE_STORAGE_KEY = '@app_language';

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguage] = useState<Language>('mn');
  const [isLoading, setIsLoading] = useState(false);

  const loadLanguage = useCallback(async () => {
    try {
      const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLanguage === 'en' || storedLanguage === 'mn') {
        setLanguage(storedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      loadLanguage();
    }, 0);
  }, [loadLanguage]);

  const changeLanguage = useCallback(async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      setLanguage(newLanguage);
      console.log('Language changed to:', newLanguage);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }, []);

  const t = translations[language];

  return useMemo(() => ({
    language,
    changeLanguage,
    t,
    isLoading,
  }), [language, changeLanguage, t, isLoading]);
});
