import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import { appMetadataService } from './appMetadataService';

class RevenueCatService {
  constructor() {
    this.isInitialized = false;
    this.isConfigured = false; // Track if Purchases.configure() was called
    this.customerInfo = null;
    this.offerings = null;
    this.listeners = new Set();
    this.configuring = false; // Prevent concurrent configuration attempts
  }

  // Configure SDK lazily (only when first needed)
  async ensureConfigured() {
    if (this.isConfigured) {
      return true;
    }

    // Prevent concurrent configuration
    if (this.configuring) {
      console.log('⏳ SDK configuration already in progress...');
      // Wait for configuration to complete
      while (this.configuring) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.isConfigured;
    }

    this.configuring = true;

    try {
      console.log('🏪 Lazy configuring RevenueCat SDK...');

      // Import what we need
      const { Platform } = require('react-native');
      const Purchases = require('react-native-purchases').default;
      const { appMetadataService } = require('./appMetadataService');

      // Get API key from metadata
      await appMetadataService.fetchMetadata();
      const metadata = await appMetadataService.getMetadata();

      const apiKey = metadata?.revenue_cat_public_api_key?.trim();

      if (!apiKey || apiKey.length === 0) {
        console.error('❌ No Revenue Cat API key available');
        this.configuring = false;
        return false;
      }

      console.log('🔑 Configuring RevenueCat SDK for', Platform.OS);

      // Configure SDK with minimal logging (no debug in production)
      if (__DEV__) {
        // Even in dev, use INFO instead of DEBUG to reduce noise
        Purchases.setLogLevel(Purchases.LOG_LEVEL.INFO);
      }

      Purchases.configure({ apiKey });

      this.isConfigured = true;
      console.log('✅ RevenueCat SDK configured successfully');

      this.configuring = false;
      return true;

    } catch (error) {
      console.error('❌ Failed to configure RevenueCat SDK:', error);
      this.configuring = false;
      return false;
    }
  }

  // Mark SDK as configured (backward compatibility)
  markAsConfigured() {
    this.isConfigured = true;
    console.log('✅ RevenueCat service marked as configured');
  }

  // Subscribe to customer info updates
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners when customer info updates
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.customerInfo));
  }

  // Initialize Revenue Cat data (lazy - configures SDK if needed)
  async initialize() {
    try {
      if (this.isInitialized) {
        console.log('🏪 Revenue Cat already initialized');
        return true;
      }

      // Ensure SDK is configured first (lazy configuration)
      const configured = await this.ensureConfigured();
      if (!configured) {
        console.log('⏭️ SDK configuration failed, skipping initialization');
        return false;
      }

      console.log('🏪 Initializing Revenue Cat data...');

      // Get initial customer info
      await this.refreshCustomerInfo();

      // Load available offerings (but don't fail if this doesn't work)
      await this.loadOfferings();

      this.isInitialized = true;
      console.log('✅ Revenue Cat initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize Revenue Cat:', error);
      return false;
    }
  }

  // Check if Purchases SDK is configured
  isSDKConfigured() {
    // Use our internal flag first (more reliable, especially in Expo Go)
    if (this.isConfigured) {
      return true;
    }

    // Fallback to checking the SDK directly
    try {
      Purchases.getSharedInstance();
      this.isConfigured = true;
      return true;
    } catch (error) {
      console.log('⚠️ SDK check via getSharedInstance failed:', error.message);
      return false;
    }
  }

  // Refresh customer info from Revenue Cat
  async refreshCustomerInfo() {
    try {
      // Ensure SDK is configured
      const configured = await this.ensureConfigured();
      if (!configured) {
        console.log('⏭️ SDK not configured, skipping customer info refresh');
        return null;
      }

      console.log('🔄 Refreshing customer info...');
      const customerInfo = await Purchases.getCustomerInfo();
      this.customerInfo = customerInfo;
      this.notifyListeners();
      console.log('✅ Customer info refreshed');
      return customerInfo;
    } catch (error) {
      console.error('❌ Failed to refresh customer info:', error.message);
      return null;
    }
  }

  // Load available offerings from Revenue Cat
  async loadOfferings() {
    try {
      // Ensure SDK is configured
      const configured = await this.ensureConfigured();
      if (!configured) {
        console.log('⏭️ SDK not configured, skipping offerings load');
        return null;
      }

      console.log('🛍️ Loading offerings...');
      const offerings = await Purchases.getOfferings();
      this.offerings = offerings;

      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        console.log('✅ Loaded offerings successfully with', offerings.current.availablePackages.length, 'packages');
      } else {
        console.log('⚠️ No offerings configured in RevenueCat dashboard');
      }

      return offerings;
    } catch (error) {
      console.error('❌ Failed to load offerings:', error.message);
      return null;
    }
  }

  // Get current offerings
  getOfferings() {
    return this.offerings;
  }

  // Get current offering (usually the default one)
  getCurrentOffering() {
    return this.offerings?.current;
  }

  // Check if user has active subscription
  isSubscribed() {
    if (!this.customerInfo) return false;

    const activeEntitlements = this.customerInfo.entitlements.active;
    return Object.keys(activeEntitlements).length > 0;
  }

  // Check if user has specific entitlement
  hasEntitlement(entitlementId) {
    if (!this.customerInfo) return false;

    const entitlement = this.customerInfo.entitlements.active[entitlementId];
    return entitlement && entitlement.isActive;
  }

  // Get active subscriptions
  getActiveSubscriptions() {
    if (!this.customerInfo) return [];

    return Object.values(this.customerInfo.entitlements.active);
  }

  // Purchase a package
  async purchasePackage(packageToPurchase) {
    try {
      console.log('💳 Attempting to purchase package:', packageToPurchase.identifier);

      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);

      console.log('✅ Purchase successful:', {
        productIdentifier,
        entitlements: Object.keys(customerInfo.entitlements.active)
      });

      this.customerInfo = customerInfo;
      this.notifyListeners();

      return {
        success: true,
        customerInfo,
        productIdentifier
      };
    } catch (error) {
      console.error('❌ Purchase failed:', error);

      // Handle specific error cases
      if (error.code === 'PURCHASE_CANCELLED') {
        return {
          success: false,
          error: 'Purchase was cancelled',
          code: 'CANCELLED'
        };
      } else if (error.code === 'PURCHASE_NOT_ALLOWED') {
        return {
          success: false,
          error: 'Purchase not allowed',
          code: 'NOT_ALLOWED'
        };
      } else if (error.code === 'PAYMENT_PENDING') {
        return {
          success: false,
          error: 'Payment is pending',
          code: 'PENDING'
        };
      }

      return {
        success: false,
        error: error.message || 'Purchase failed',
        code: error.code || 'UNKNOWN'
      };
    }
  }

  // Purchase a product directly by identifier
  async purchaseProduct(productIdentifier) {
    try {
      console.log('💳 Attempting to purchase product:', productIdentifier);

      const { customerInfo } = await Purchases.purchaseProduct(productIdentifier);

      console.log('✅ Product purchase successful');

      this.customerInfo = customerInfo;
      this.notifyListeners();

      return {
        success: true,
        customerInfo
      };
    } catch (error) {
      console.error('❌ Product purchase failed:', error);
      return {
        success: false,
        error: error.message || 'Product purchase failed',
        code: error.code || 'UNKNOWN'
      };
    }
  }

  // Restore purchases
  async restorePurchases() {
    try {
      console.log('🔄 Restoring purchases...');

      const customerInfo = await Purchases.restorePurchases();

      console.log('✅ Purchases restored successfully');

      this.customerInfo = customerInfo;
      this.notifyListeners();

      return {
        success: true,
        customerInfo,
        hasActiveEntitlements: Object.keys(customerInfo.entitlements.active).length > 0
      };
    } catch (error) {
      console.error('❌ Failed to restore purchases:', error);
      return {
        success: false,
        error: error.message || 'Failed to restore purchases'
      };
    }
  }

  // Set user ID for Revenue Cat
  async setUserId(userId) {
    try {
      console.log('👤 Setting user ID:', userId);
      await Purchases.logIn(userId);
      await this.refreshCustomerInfo();
      return true;
    } catch (error) {
      console.error('❌ Failed to set user ID:', error);
      return false;
    }
  }

  // Clear user ID (logout)
  async clearUserId() {
    try {
      console.log('👤 Clearing user ID...');
      await Purchases.logOut();
      await this.refreshCustomerInfo();
      return true;
    } catch (error) {
      console.error('❌ Failed to clear user ID:', error);
      return false;
    }
  }

  // Get customer info
  getCustomerInfo() {
    return this.customerInfo;
  }

  // Check if initialized
  getInitializationStatus() {
    return this.isInitialized;
  }

  // Get subscription status for display
  getSubscriptionStatus() {
    if (!this.customerInfo) {
      return {
        isSubscribed: false,
        status: 'unknown',
        expirationDate: null,
        productIdentifier: null
      };
    }

    const activeEntitlements = this.customerInfo.entitlements.active;
    const isSubscribed = Object.keys(activeEntitlements).length > 0;

    if (!isSubscribed) {
      return {
        isSubscribed: false,
        status: 'inactive',
        expirationDate: null,
        productIdentifier: null
      };
    }

    // Get the first active entitlement (assuming one subscription model)
    const firstEntitlement = Object.values(activeEntitlements)[0];

    return {
      isSubscribed: true,
      status: 'active',
      expirationDate: firstEntitlement.expirationDate,
      productIdentifier: firstEntitlement.productIdentifier,
      willRenew: firstEntitlement.willRenew,
      periodType: firstEntitlement.periodType
    };
  }

  // Utility method to format subscription info for UI
  getFormattedSubscriptionInfo() {
    const status = this.getSubscriptionStatus();

    if (!status.isSubscribed) {
      return {
        displayText: 'No Active Subscription',
        isActive: false
      };
    }

    const expirationDate = status.expirationDate ? new Date(status.expirationDate) : null;
    const formattedDate = expirationDate ? expirationDate.toLocaleDateString() : 'Unknown';

    return {
      displayText: status.willRenew
        ? `Active - Renews ${formattedDate}`
        : `Active - Expires ${formattedDate}`,
      isActive: true,
      expirationDate: formattedDate,
      willRenew: status.willRenew
    };
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService();
export default revenueCatService;