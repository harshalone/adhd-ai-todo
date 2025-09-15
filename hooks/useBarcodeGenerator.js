import { useState, useCallback } from 'react';
import { PixelRatio } from 'react-native';
import bwipjs from '@bwip-js/react-native';

export const useBarcodeGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateBarcode = useCallback(async (text, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const {
        type = 'qrcode',
        scale = PixelRatio.get(),
        includetext = true,
        textxalign = 'center',
        backgroundcolor = 'FFFFFF',
        color = '000000'
      } = options;

      // Only support 4 barcode types
      const typeMapping = {
        'barcode': 'code128',    // Default 1D barcode
        'qr': 'qrcode',
        'pdf417': 'pdf417',
        'aztec': 'azteccode'
      };

      const bcid = typeMapping[type.toLowerCase()];
      if (!bcid) {
        throw new Error(`Unsupported barcode type: ${type}. Supported types: barcode, qr, pdf417, aztec`);
      }

      const barcodeOptions = {
        bcid,
        text,
        scale,
        includetext,
        textxalign,
        backgroundcolor,
        color
      };

      // Add height for 1D barcode (code128)
      if (bcid === 'code128') {
        barcodeOptions.height = 10;
      }

      const result = await bwipjs.toDataURL(barcodeOptions);
      return result;

    } catch (err) {
      const errorMessage = err.message || 'Failed to generate barcode';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSupportedTypes = useCallback(() => {
    return {
      barcode: {
        name: 'Code 128 Barcode',
        description: '1D linear barcode for general use'
      },
      qr: {
        name: 'QR Code',
        description: '2D barcode for URLs, text, and data'
      },
      pdf417: {
        name: 'PDF417',
        description: '2D barcode for ID cards and documents'
      },
      aztec: {
        name: 'Aztec Code',
        description: '2D barcode for tickets and passes'
      }
    };
  }, []);

  return {
    generateBarcode,
    getSupportedTypes,
    loading,
    error
  };
};