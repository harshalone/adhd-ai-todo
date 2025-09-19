import { StyleSheet, Text, View, TouchableOpacity, Alert, Dimensions, Animated, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import * as Brightness from 'expo-brightness';
import * as Clipboard from 'expo-clipboard';
import { getOptimalTextColor } from '../../utils/colorUtils';
import { useBarcodeGenerator } from '../../hooks/useBarcodeGenerator';
import { reviewService } from '../../services/reviewService';
import { cardsService } from '../../services/cardsService';
import { ChevronLeft, Trash2, Copy, Sun } from 'lucide-react-native';
import SkeletonLoader from '../../components/SkeletonLoader';

const lightTheme = {
  colors: {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    primary: '#007AFF',
    text: '#000000',
    textSecondary: '#6B7280',
    border: '#E5E7EB'
  }
};

const BARCODE_TYPES = [
  { id: 'BARCODE', label: 'Barcode', format: 'barcode' },
  { id: 'QR', label: 'QR', format: 'qr' },
  { id: 'PDF417', label: 'PDF417', format: 'pdf417' },
  { id: 'AZTEC', label: 'Aztec', format: 'aztec' },
];

export default function CardScreen({ route, navigation }) {
  const { card } = route.params;
  const { theme } = useTheme();
  const { generateBarcode, loading: barcodeLoading } = useBarcodeGenerator();
  const [activeTab, setActiveTab] = useState('BARCODE');
  const [generatedBarcode, setGeneratedBarcode] = useState(null);
  const [originalBrightness, setOriginalBrightness] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Set screen to full brightness when component mounts
    const setBrightness = async () => {
      try {
        // First, request permissions
        const { status } = await Brightness.requestPermissionsAsync();
        console.log('CardScreen: Permission status:', status);

        if (status !== 'granted') {
          console.warn('CardScreen: Brightness permission not granted');
          return;
        }

        // Check if auto-brightness is enabled (this might help diagnose)
        try {
          const isUsingSystemBrightness = await Brightness.isUsingSystemBrightnessAsync();
          console.log('CardScreen: Is using system brightness (auto-brightness):', isUsingSystemBrightness);
        } catch (e) {
          console.log('CardScreen: Could not check auto-brightness status');
        }

        const initialBrightness = await Brightness.getBrightnessAsync();
        console.log('CardScreen: Current brightness before setting:', initialBrightness);

        setOriginalBrightness(initialBrightness);

        // Try system brightness first
        await Brightness.setSystemBrightnessAsync(1.0);
        console.log('CardScreen: System brightness set to 1.0');

        // Small delay to let system process the change
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check brightness after setting
        const newBrightness = await Brightness.getBrightnessAsync();
        console.log('CardScreen: Brightness after setting system brightness:', newBrightness);

        if (newBrightness < 0.9) {
          console.warn('CardScreen: System brightness failed, trying regular setBrightness');
          // Fallback to regular brightness setting
          await Brightness.setBrightnessAsync(1.0);

          // Check again after fallback
          const fallbackBrightness = await Brightness.getBrightnessAsync();
          console.log('CardScreen: Brightness after fallback method:', fallbackBrightness);

          if (fallbackBrightness < 0.9) {
            console.warn('CardScreen: Both methods failed - likely auto-brightness is enabled');
          }
        } else {
          console.log('CardScreen: Brightness successfully set to full');
        }
      } catch (error) {
        console.warn('Could not set brightness:', error);
        console.error('Brightness error details:', error);
      }
    };

    // Track card usage for review flow
    const trackUsage = async () => {
      try {
        await reviewService.trackCardUsage();
      } catch (error) {
        console.warn('Failed to track card usage:', error);
      }
    };

    setBrightness();
    trackUsage();

    // Restore original brightness when component unmounts
    return () => {
      if (originalBrightness !== null) {
        Brightness.setBrightnessAsync(originalBrightness).catch(console.warn);
      }
    };
  }, []); // Fixed: empty dependency array instead of [originalBrightness]

  const generateBarcodeImage = async () => {
    if (!card.number) return;

    try {
      const activeType = BARCODE_TYPES.find(type => type.id === activeTab);

      if (activeType) {
        // Higher quality settings for 2D codes (QR, PDF417, Aztec)
        const is2DCode = ['qr', 'pdf417', 'aztec'].includes(activeType.format);

        const barcodeImage = await generateBarcode(card.number, {
          type: activeType.format,
          scale: is2DCode ? 4 : 2, // Higher scale for 2D codes
          includetext: activeType.format === 'barcode', // Only include text for 1D barcode
        });

        // Check if it's a string or if we need to extract a property
        const imageUri = typeof barcodeImage === 'string' ? barcodeImage : barcodeImage?.uri || barcodeImage?.data || barcodeImage;

        setGeneratedBarcode(imageUri);
      }
    } catch (error) {
      setGeneratedBarcode(null);
    }
  };

  const handleTabSelect = (type, index) => {
    setActiveTab(type);

    // Animate tab indicator
    Animated.timing(tabIndicatorAnim, {
      toValue: index,
      duration: 200,
      useNativeDriver: false,
    }).start();

    if (card.number) {
      generateBarcodeImage();
    }
  };

  useEffect(() => {
    if (card.number && activeTab) {
      generateBarcodeImage();
    }
  }, [activeTab, card.number]);

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(card.number);
      Alert.alert('Copied!', 'Card number copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy card number');
    }
  };

  const handleDeleteCard = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteCard = async () => {
    try {
      console.log('Attempting to delete card:', { id: card.id, name: card.name });

      // Call the cardsService to delete the card
      const { error } = await cardsService.deleteLoyaltyCard(card.id);

      if (error) {
        console.error('Error deleting card from database:', error);
        Alert.alert('Error', 'Failed to delete card. Please try again.');
        return;
      }

      console.log('Card deleted successfully from database');
      setShowDeleteModal(false);

      // Show success message and navigate back
      Alert.alert('Success', 'Card deleted successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Unexpected error during card deletion:', error);
      Alert.alert('Error', 'Something went wrong while deleting the card.');
    }
  };

  const handleBrightnessIncrease = async () => {
    try {
      await Brightness.setBrightnessAsync(1.0);
      console.log('Manual brightness set to full');

      // Verify it worked
      const newBrightness = await Brightness.getBrightnessAsync();
      if (newBrightness > 0.9) {
        Alert.alert('Success', 'Brightness increased to maximum');
      } else {
        Alert.alert('Note', 'Please manually adjust your device brightness for better barcode visibility');
      }
    } catch (error) {
      console.warn('Could not set brightness manually:', error);
      Alert.alert('Error', 'Could not adjust brightness. Please manually increase it in your device settings.');
    }
  };

  const handleBackPress = async () => {
    try {
      // Handle review flow before going back
      await reviewService.handleReviewFlow();
    } catch (error) {
      console.warn('Review flow error:', error);
    } finally {
      // Always go back regardless of review flow result
      navigation.goBack();
    }
  };

  const renderBarcode = () => {
    // Dynamic sizing based on barcode type
    const screenWidth = Dimensions.get('window').width;
    const is1DBarcode = activeTab === 'BARCODE';

    const imageStyle = {
      ...styles.barcodeImage,
      width: screenWidth * 0.85,
      height: is1DBarcode ? 120 : screenWidth * 0.85, // 1D codes are shorter
    };

    return (
      <View style={styles.barcodeContainer}>
        {barcodeLoading ? (
          <SkeletonLoader count={1} type={is1DBarcode ? 'barcode' : 'qr'} />
        ) : generatedBarcode ? (
          <Image
            source={{ uri: generatedBarcode }}
            style={imageStyle}
            resizeMode="contain"
          />
        ) : (
          <Text style={[styles.errorText, { color: lightTheme.colors.textSecondary }]}>
            Failed to generate barcode
          </Text>
        )}
      </View>
    );
  };

  const cardBackgroundColor = card.bg_colour || theme.colors.surface;
  const cardTextColor = getOptimalTextColor(cardBackgroundColor);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: lightTheme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.headerButton}>
          <ChevronLeft size={39} color={lightTheme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleBrightnessIncrease}
            style={styles.headerButton}
          >
            <Sun size={22} color={lightTheme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteCard} style={styles.headerButton}>
            <Trash2 size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabSection}>
        <View style={styles.tabContainer}>
          {BARCODE_TYPES.map((type, index) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.tab,
                activeTab === type.id && styles.selectedTab
              ]}
              onPress={() => handleTabSelect(type.id, index)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === type.id && styles.selectedTabText
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>


      {/* Barcode Display */}
      <View style={styles.barcodeSection}>
        {renderBarcode()}
      </View>

      {/* Card Info */}
      <View style={styles.cardWrapper}>
        <View style={[styles.cardInfo, { backgroundColor: cardBackgroundColor }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardName, { color: cardTextColor }]}>
              {card.name}
            </Text>
            <TouchableOpacity onPress={copyToClipboard} style={[styles.copyButton, { borderColor: cardTextColor }]}>
              <Copy size={10} color={cardTextColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.numberSection}>
            <Text style={[styles.cardNumber, { color: cardTextColor, fontSize: card.number.length > 16 ? 16 : card.number.length > 12 ? 18 : 20 }]}>
              {card.number}
            </Text>
          </View>
        </View>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Card</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{card.name}"? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDeleteCard}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 4,
    marginLeft: 8,
  },
  tabSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  selectedTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  selectedTabText: {
    color: '#000000',
    fontWeight: '600',
  },
  barcodeSection: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140, // Space for the fixed card at bottom
  },
  barcodeContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  svg: {
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  barcodeImage: {
    width: Dimensions.get('window').width * 0.8,
    height: Dimensions.get('window').width * 0.8, // Square for QR, will be overridden for 1D codes
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  cardWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cardInfo: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
    flex: 1,
  },
  numberSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    width: '100%',
  },
  cardNumber: {
    fontFamily: 'monospace',
    fontWeight: '500',
    letterSpacing: 1,
    textAlign: 'center',
    width: '100%',
  },
  copyButton: {
    padding: 6,
    borderRadius: 3,
    borderWidth: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 40,
    maxWidth: 300,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});