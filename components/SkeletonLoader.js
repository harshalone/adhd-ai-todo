import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useEffect, useRef } from 'react';

const { width: screenWidth } = Dimensions.get('window');

export default function SkeletonLoader({ count = 1, type = 'barcode' }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const renderSkeletonCard = (index) => {
    const isBarcode = type === 'barcode';

    return (
      <View key={index} style={styles.skeletonCard}>
        {/* Skeleton for barcode/QR area */}
        <Animated.View
          style={[
            styles.skeletonBarcode,
            isBarcode ? styles.skeletonBarcodeRect : styles.skeletonBarcodeSquare,
            { opacity: shimmerOpacity }
          ]}
        />

        {/* Skeleton for card info section */}
        <View style={styles.skeletonCardInfo}>
          {/* Skeleton for card name */}
          <Animated.View
            style={[styles.skeletonCardName, { opacity: shimmerOpacity }]}
          />

          {/* Skeleton for card number */}
          <Animated.View
            style={[styles.skeletonCardNumber, { opacity: shimmerOpacity }]}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => renderSkeletonCard(index))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  skeletonCard: {
    width: screenWidth * 0.85,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  skeletonBarcode: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 16,
  },
  skeletonBarcodeRect: {
    height: 120, // For 1D barcodes
  },
  skeletonBarcodeSquare: {
    height: screenWidth * 0.85 - 32, // For QR codes (square, minus padding)
  },
  skeletonCardInfo: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  skeletonCardName: {
    height: 20,
    backgroundColor: '#D1D5DB',
    borderRadius: 4,
    marginBottom: 12,
    width: '60%',
  },
  skeletonCardNumber: {
    height: 18,
    backgroundColor: '#D1D5DB',
    borderRadius: 4,
    width: '80%',
    alignSelf: 'center',
  },
});