import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, Camera } from 'expo-camera';
import { ChevronLeft, Camera as CameraIcon, Palette } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { cardsService } from '../../services/cardsService';

const { width: screenWidth } = Dimensions.get('window');

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#6b7280', // Gray
  '#1f2937', // Dark Gray
  '#3b82f6', // Blue
  '#f97316', // Orange
];

export default function ScanCardScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { cardData } = route.params || {};

  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [cardName, setCardName] = useState(cardData?.name || '');
  const [cardNumber, setCardNumber] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scannedData, setScannedData] = useState('');
  const [selectedColor, setSelectedColor] = useState(cardData?.background_color || '#6366f1');
  const [showColorModal, setShowColorModal] = useState(false);

  const cameraHeightAnim = useRef(new Animated.Value(1)).current;

  const truncateCardName = (name) => {
    if (!name) return 'Card';
    return name.length > 20 ? `${name.substring(0, 20)}...` : name;
  };

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const animateToInputMode = () => {
    setIsInputFocused(true);
    Animated.timing(cameraHeightAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const animateToScanMode = () => {
    setIsInputFocused(false);
    Keyboard.dismiss();
    Animated.timing(cameraHeightAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleOutsideTap = () => {
    Keyboard.dismiss();
  };

  const handleBarcodeScanned = ({ type, data }) => {
    if (!scanned && !showScanModal) {
      setScanned(true);
      setScannedData(data);
      setShowScanModal(true);
    }
  };

  const handleScanModalConfirm = () => {
    setCardNumber(scannedData);
    setShowScanModal(false);
    animateToInputMode();
  };

  const handleScanModalRescan = () => {
    setShowScanModal(false);
    setScanned(false);
    setScannedData('');
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setShowColorModal(false);
  };

  const handleSave = async () => {
    try {
      console.log('Save card:', { cardName, cardNumber });

      const cardToSave = {
        name: cardName.trim(),
        number: cardNumber.trim(),
        bg_colour: selectedColor,
      };

      const { data, error } = await cardsService.addLoyaltyCard(cardToSave);

      if (error) {
        console.error('Error saving card:', error);
        Alert.alert('Error', 'Failed to save card. Please try again.');
        return;
      }

      console.log('Card saved successfully:', data);
      Alert.alert('Success', 'Card saved successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving card:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <Text style={[styles.messageText, { color: theme.colors.text }]}>
            Requesting camera permission...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Scan Card
          </Text>
        </View>

        <View style={styles.centerContainer}>
          <CameraIcon size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.messageText, { color: theme.colors.text }]}>
            Camera permission is required to scan barcodes
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
            onPress={async () => {
              const { status } = await Camera.requestCameraPermissionsAsync();
              setHasPermission(status === 'granted');
            }}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={handleOutsideTap}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={39} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {truncateCardName(cardData?.name)}
          </Text>
          {isInputFocused && (
            <TouchableOpacity
              style={styles.cameraIconButton}
              onPress={animateToScanMode}
            >
              <CameraIcon size={24} color={theme.colors.text} />
            </TouchableOpacity>
          )}
        </View>

        <Animated.View style={[styles.cameraContainer, {
          flex: cameraHeightAnim,
        }]}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: [
                'qr',
                'ean13',
                'ean8',
                'code128',
                'code39',
                'code93',
                'codabar',
                'upc_e',
                'pdf417',
                'aztec',
                'datamatrix'
              ],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          />
          {!isInputFocused && (
            <View style={styles.scanOverlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanInstructions}>
                Position the barcode within the frame
              </Text>
            </View>
          )}

          {scanned && !isInputFocused && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.rescanButtonText}>Tap to Scan Again</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <ScrollView
          style={[styles.formContainer, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              Card Name
            </Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.input, styles.inputWithRightIcon, {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }]}
                value={cardName}
                onChangeText={setCardName}
                placeholder="Enter card name"
                placeholderTextColor={theme.colors.textSecondary}
                onFocus={animateToInputMode}
              />
              <TouchableOpacity
                style={[styles.colorPickerIcon, { backgroundColor: selectedColor }]}
                onPress={() => setShowColorModal(true)}
              >
                <Palette size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              Card Number
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }]}
              value={cardNumber}
              onChangeText={setCardNumber}
              placeholder="Scan or enter card number"
              placeholderTextColor={theme.colors.textSecondary}
              onFocus={animateToInputMode}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, {
              backgroundColor: theme.colors.primary,
              opacity: (cardName.trim() && cardNumber.trim()) ? 1 : 0.5,
            }]}
            onPress={handleSave}
            disabled={!cardName.trim() || !cardNumber.trim()}
          >
            <Text style={styles.saveButtonText}>Save Card</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Custom Scan Modal */}
        <Modal
          visible={showScanModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowScanModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Barcode Scanned!
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                Card Number:
              </Text>
              <Text style={[styles.modalCardNumber, { color: theme.colors.text }]}>
                {scannedData}
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: theme.colors.border }]}
                  onPress={handleScanModalRescan}
                >
                  <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                    Scan Again
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: theme.colors.primary }]}
                  onPress={handleScanModalConfirm}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                    Use This
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Color Picker Modal */}
        <Modal
          visible={showColorModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowColorModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.colorModalContainer, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Choose Card Color
              </Text>

              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorModalOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.selectedColorModalOption
                    ]}
                    onPress={() => handleColorSelect(color)}
                  >
                    {selectedColor === color && (
                      <View style={styles.colorModalCheck} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.colorModalClose, { backgroundColor: theme.colors.border }]}
                onPress={() => setShowColorModal(false)}
              >
                <Text style={[styles.colorModalCloseText, { color: theme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 6,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    flex: 1,
  },
  cameraIconButton: {
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  messageText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: screenWidth * 0.8,
    height: 120,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  scanInstructions: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rescanButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  rescanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    flexGrow: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    letterSpacing: -0.1,
  },
  inputWithIcon: {
    position: 'relative',
  },
  inputWithRightIcon: {
    paddingRight: 50,
  },
  colorPickerIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    marginHorizontal: 24,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    minWidth: screenWidth * 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  modalCardNumber: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    letterSpacing: 0.5,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    borderWidth: 1,
  },
  modalButtonPrimary: {
    // backgroundColor will be set dynamically
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  colorModalContainer: {
    marginHorizontal: 24,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    minWidth: screenWidth * 0.8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 24,
  },
  colorModalOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  selectedColorModalOption: {
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  colorModalCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  colorModalClose: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  colorModalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});