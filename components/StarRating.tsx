import { View, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';

interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
  gap?: number;
}

export function StarRating({ rating, size = 18, color = '#FFB800', gap = 4 }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 > 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={[styles.container, { gap }]}>
      {[...Array(fullStars)].map((_, index) => (
        <Star
          key={`full-${index}`}
          size={size}
          color={color}
          fill={color}
          strokeWidth={1.5}
        />
      ))}
      {hasHalfStar && (
        <View style={[styles.halfStarContainer, { width: size, height: size }]}>
          <Star
            size={size}
            color={color}
            fill="transparent"
            strokeWidth={1.5}
            style={{ position: 'absolute' as const }}
          />
          <View style={[styles.halfStarOverlay, { width: size * (rating % 1), height: size }]}>
            <Star
              size={size}
              color={color}
              fill={color}
              strokeWidth={1.5}
            />
          </View>
        </View>
      )}
      {[...Array(emptyStars)].map((_, index) => (
        <Star
          key={`empty-${index}`}
          size={size}
          color={color}
          fill="transparent"
          strokeWidth={1.5}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  halfStarContainer: {
    position: 'relative' as const,
  },
  halfStarOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
});
