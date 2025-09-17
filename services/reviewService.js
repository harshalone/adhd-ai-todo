import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import { APP_STORE_ID, APP_STORE_URL } from '../utils/constants';

const STORAGE_KEYS = {
  REVIEW_REQUESTED: 'app_review_requested',
  CARD_USAGE_COUNT: 'card_usage_count',
  LAST_REVIEW_REQUEST: 'last_review_request'
};

const REVIEW_CONFIG = {
  MIN_CARD_USAGE: 3, // Minimum number of card usages before showing review
  DAYS_BETWEEN_REQUESTS: 7, // Days to wait before showing review again if declined
};

export const reviewService = {
  // Track when user uses a card (called from CardScreen)
  async trackCardUsage() {
    try {
      const currentCount = await this.getCardUsageCount();
      await AsyncStorage.setItem(STORAGE_KEYS.CARD_USAGE_COUNT, (currentCount + 1).toString());
    } catch (error) {
      console.warn('Failed to track card usage:', error);
    }
  },

  // Get current card usage count
  async getCardUsageCount() {
    try {
      const count = await AsyncStorage.getItem(STORAGE_KEYS.CARD_USAGE_COUNT);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.warn('Failed to get card usage count:', error);
      return 0;
    }
  },

  // Check if user has already been asked to review
  async hasBeenAskedToReview() {
    try {
      const requested = await AsyncStorage.getItem(STORAGE_KEYS.REVIEW_REQUESTED);
      return requested === 'true';
    } catch (error) {
      console.warn('Failed to check review status:', error);
      return false;
    }
  },

  // Check if enough time has passed since last review request
  async canShowReviewAgain() {
    try {
      const lastRequest = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REVIEW_REQUEST);
      if (!lastRequest) return true;

      const lastRequestDate = new Date(lastRequest);
      const now = new Date();
      const daysSinceLastRequest = (now - lastRequestDate) / (1000 * 60 * 60 * 24);

      return daysSinceLastRequest >= REVIEW_CONFIG.DAYS_BETWEEN_REQUESTS;
    } catch (error) {
      console.warn('Failed to check review timing:', error);
      return true;
    }
  },

  // Check if we should show review prompt
  async shouldShowReview() {
    try {
      const usageCount = await this.getCardUsageCount();
      const hasBeenAsked = await this.hasBeenAskedToReview();
      const canShowAgain = await this.canShowReviewAgain();

      // Show review if:
      // 1. User has used cards enough times AND
      // 2. Either hasn't been asked before OR enough time has passed
      return usageCount >= REVIEW_CONFIG.MIN_CARD_USAGE && (!hasBeenAsked || canShowAgain);
    } catch (error) {
      console.warn('Failed to determine if review should show:', error);
      return false;
    }
  },

  // Show native review prompt (preferred method)
  async showNativeReview() {
    try {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        await StoreReview.requestReview();
        await this.markReviewRequested();
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to show native review:', error);
      return false;
    }
  },

  // Show custom review dialog with App Store link
  async showCustomReviewDialog() {
    return new Promise((resolve) => {
      Alert.alert(
        'Enjoying Stocard?',
        'If you\'re finding Stocard helpful for managing your loyalty cards, would you mind leaving us a review on the App Store? It really helps!',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => {
              this.markReviewDeclined();
              resolve(false);
            }
          },
          {
            text: 'Leave Review',
            onPress: async () => {
              await this.openAppStore();
              await this.markReviewRequested();
              resolve(true);
            }
          }
        ]
      );
    });
  },

  // Open App Store for review
  async openAppStore() {
    try {
      const url = `itms-apps://itunes.apple.com/app/viewContentsUserReviews/id${APP_STORE_ID}?action=write-review`;
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web URL
        await Linking.openURL(APP_STORE_URL);
      }
    } catch (error) {
      console.warn('Failed to open App Store:', error);
      // Try web fallback
      try {
        await Linking.openURL(APP_STORE_URL);
      } catch (fallbackError) {
        console.warn('Failed to open App Store web URL:', fallbackError);
      }
    }
  },

  // Mark that review has been requested
  async markReviewRequested() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REVIEW_REQUESTED, 'true');
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_REVIEW_REQUEST, new Date().toISOString());
    } catch (error) {
      console.warn('Failed to mark review as requested:', error);
    }
  },

  // Mark that review was declined (to show again later)
  async markReviewDeclined() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_REVIEW_REQUEST, new Date().toISOString());
    } catch (error) {
      console.warn('Failed to mark review as declined:', error);
    }
  },

  // Main method to handle review flow
  async handleReviewFlow() {
    try {
      const shouldShow = await this.shouldShowReview();
      if (!shouldShow) return false;

      // Try native review first
      const nativeSuccess = await this.showNativeReview();
      if (nativeSuccess) return true;

      // Fallback to custom dialog
      return await this.showCustomReviewDialog();
    } catch (error) {
      console.warn('Failed to handle review flow:', error);
      return false;
    }
  },

  // Reset review data (for testing purposes)
  async resetReviewData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.REVIEW_REQUESTED,
        STORAGE_KEYS.CARD_USAGE_COUNT,
        STORAGE_KEYS.LAST_REVIEW_REQUEST
      ]);
    } catch (error) {
      console.warn('Failed to reset review data:', error);
    }
  }
};