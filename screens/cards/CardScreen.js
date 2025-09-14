import { StyleSheet, Text, View, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect } from 'react';
import * as Brightness from 'expo-brightness';
import * as Clipboard from 'expo-clipboard';
import { getOptimalTextColor } from '../../utils/colorUtils';
import Svg, { Path, Rect } from 'react-native-svg';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

const BARCODE_TYPES = [
  { id: 'QR', label: 'QR Code', format: 'qr' },
  { id: 'CODE128', label: 'Code 128', format: 'code128' },
  { id: 'CODE39', label: 'Code 39', format: 'code39' },
  { id: 'EAN13', label: 'EAN-13', format: 'ean13' },
  { id: 'EAN8', label: 'EAN-8', format: 'ean8' },
  { id: 'ITF', label: 'ITF', format: 'itf' },
];

export default function CardScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { card } = route.params;
  const [activeTab, setActiveTab] = useState('QR');
  const [barcodeData, setBarcodeData] = useState(null);
  const [originalBrightness, setOriginalBrightness] = useState(null);
  const [screenData] = useState(Dimensions.get('window'));
  useEffect(() => {
    // Set screen to full brightness when component mounts
    const setBrightness = async () => {
      try {
        const currentBrightness = await Brightness.getBrightnessAsync();
        setOriginalBrightness(currentBrightness);
        await Brightness.setBrightnessAsync(1.0);
      } catch (error) {
        console.warn('Could not set brightness:', error);
      }
    };

    setBrightness();

    // Restore original brightness when component unmounts
    return () => {
      if (originalBrightness !== null) {
        Brightness.setBrightnessAsync(originalBrightness).catch(console.warn);
      }
    };
  }, [originalBrightness]);

  const generateBarcode = async (format, value) => {
    try {
      if (format === 'qr') {
        // Generate QR Code using qrcode library
        const qrString = await QRCode.toString(value, {
          type: 'svg',
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setBarcodeData({ type: 'qr', data: qrString });
      } else {
        // Generate other barcodes using jsbarcode
        const canvas = {
          width: 0,
          height: 0,
          rects: []
        };

        // Mock canvas for jsbarcode with all required methods
        const mockCanvas = {
          getContext: () => ({
            fillRect: (x, y, width, height) => {
              canvas.rects.push({ x, y, width, height });
              canvas.width = Math.max(canvas.width, x + width);
              canvas.height = Math.max(canvas.height, y + height);
            },
            fillText: () => {},
            measureText: () => ({ width: 0 }),
            translate: () => {},
            scale: () => {},
            save: () => {},
            restore: () => {},
            strokeRect: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            stroke: () => {},
            fill: () => {},
            arc: () => {},
            rect: () => {},
            closePath: () => {}
          })
        };

        const formatMap = {
          'code128': 'CODE128',
          'code39': 'CODE39',
          'ean13': 'EAN13',
          'ean8': 'EAN8',
          'itf': 'ITF'
        };

        JsBarcode(mockCanvas, value, {
          format: formatMap[format] || 'CODE128',
          width: 2,
          height: 80,
          displayValue: false
        });

        setBarcodeData({
          type: 'rects',
          data: canvas.rects,
          width: Math.max(canvas.width, 200),
          height: Math.max(canvas.height, 80)
        });
      }
    } catch (error) {
      console.error('Error generating barcode:', error);
      setBarcodeData(null);
    }
  };

  useEffect(() => {
    if (card.number && activeTab) {
      const activeType = BARCODE_TYPES.find(type => type.id === activeTab);
      if (activeType) {
        generateBarcode(activeType.format, card.number);
      }
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

  const renderBarcode = () => {
    if (!barcodeData) {
      return (
        <View style={styles.barcodeContainer}>
          <Text style={styles.loadingText}>Generating barcode...</Text>
        </View>
      );
    }

    if (barcodeData.type === 'qr') {
      // For QR codes, show a placeholder since SVG parsing is complex
      return (
        <View style={styles.barcodeContainer}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrText}>QR Code</Text>
            <Text style={styles.qrSubtext}>Generated for: {card.number}</Text>
          </View>
        </View>
      );
    } else if (barcodeData.type === 'rects') {
      // Render barcode from rectangles
      return (
        <View style={styles.barcodeContainer}>
          <Svg width={barcodeData.width} height={barcodeData.height} style={styles.svg}>
            {barcodeData.data.map((rect, index) => (
              <Rect
                key={index}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                fill="black"
              />
            ))}
          </Svg>
        </View>
      );
    }

    return null;
  };

  const cardBackgroundColor = card.bg_colour || theme.colors.surface;
  const cardTextColor = getOptimalTextColor(cardBackgroundColor);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {BARCODE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === type.id ? theme.colors.primary : 'transparent',
                borderColor: theme.colors.primary,
              }
            ]}
            onPress={() => setActiveTab(type.id)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === type.id ? '#FFFFFF' : theme.colors.primary,
                  fontWeight: activeTab === type.id ? '600' : '400',
                }
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Barcode Display */}
      <View style={styles.barcodeSection}>
        {renderBarcode()}
      </View>

      {/* Card Info */}
      <View style={[styles.cardInfo, { backgroundColor: cardBackgroundColor }]}>
        <Text style={[styles.cardName, { color: cardTextColor }]}>
          {card.name}
        </Text>
        <TouchableOpacity onPress={copyToClipboard} style={styles.numberContainer}>
          <Text style={[styles.cardNumber, { color: cardTextColor }]}>
            {card.number}
          </Text>
          <Text style={[styles.copyHint, { color: cardTextColor, opacity: 0.7 }]}>
            Tap to copy
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    textAlign: 'center',
  },
  barcodeSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  barcodeContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  svg: {
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  qrText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  qrSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  cardInfo: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  cardName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  numberContainer: {
    alignItems: 'center',
  },
  cardNumber: {
    fontSize: 20,
    fontFamily: 'monospace',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  copyHint: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});