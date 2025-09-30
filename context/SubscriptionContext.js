import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { revenueCatService } from '../services/revenueCatService';

const SubscriptionContext = createContext();

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Update subscription state
  const updateSubscriptionState = useCallback((newCustomerInfo) => {
    console.log('📊 Updating subscription state in context');

    const subscribed = revenueCatService.isSubscribed();
    const info = revenueCatService.getFormattedSubscriptionInfo();
    const status = revenueCatService.getSubscriptionStatus();

    setIsSubscribed(subscribed);
    setSubscriptionInfo({ ...info, ...status });
    setCustomerInfo(newCustomerInfo);
    setLoading(false);

    console.log('📊 Subscription status updated:', { subscribed, info, status });
  }, []);

  // Initialize the context
  useEffect(() => {
    const initializeSubscriptionContext = async () => {
      console.log('🏪 Initializing subscription context...');

      // Purchases.configure() should already be called by now (in App.js)
      try {
        const initialized = await revenueCatService.initialize();
        if (!initialized) {
          console.log('⚠️ Revenue Cat initialization failed, subscription features will be limited');
          setLoading(false);
          setInitialized(true);
          return;
        }
      } catch (error) {
        console.error('❌ Failed to initialize RevenueCat service:', error);
        setLoading(false);
        setInitialized(true);
        return;
      }

      try {
        // Get initial customer info
        const customerInfo = revenueCatService.getCustomerInfo();
        updateSubscriptionState(customerInfo);

        // Load offerings - but only if they haven't been loaded yet
        // (they may have been loaded during RevenueCat initialization)
        let offerings = revenueCatService.getOfferings();
        if (!offerings) {
          try {
            offerings = await revenueCatService.loadOfferings();
          } catch (offeringsError) {
            console.warn('⚠️ Failed to load offerings, will retry later:', offeringsError.message);
            offerings = null;
          }
        }
        setOfferings(offerings);

        setInitialized(true);
        console.log('✅ Subscription context initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize subscription context:', error);
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeSubscriptionContext();
  }, [updateSubscriptionState]);

  // Subscribe to Revenue Cat updates
  useEffect(() => {
    if (!initialized) return;

    console.log('📊 Subscribing to Revenue Cat updates');
    const unsubscribe = revenueCatService.subscribe(updateSubscriptionState);

    return unsubscribe;
  }, [initialized, updateSubscriptionState]);

  // Refresh subscription info
  const refreshSubscription = useCallback(async () => {
    console.log('🔄 Refreshing subscription info...');
    setLoading(true);

    try {
      const customerInfo = await revenueCatService.refreshCustomerInfo();
      updateSubscriptionState(customerInfo);
    } catch (error) {
      console.error('❌ Failed to refresh subscription:', error);
      setLoading(false);
    }
  }, [updateSubscriptionState]);

  // Refresh offerings
  const refreshOfferings = useCallback(async () => {
    console.log('🛍️ Refreshing offerings...');

    try {
      const offerings = await revenueCatService.loadOfferings();
      setOfferings(offerings);
      return offerings;
    } catch (error) {
      console.error('❌ Failed to refresh offerings:', error);
      return null;
    }
  }, []);

  // Purchase a package
  const purchasePackage = useCallback(async (packageToPurchase) => {
    console.log('💳 Purchasing package via context:', packageToPurchase.identifier);

    try {
      const result = await revenueCatService.purchasePackage(packageToPurchase);

      if (result.success) {
        console.log('✅ Purchase successful, updating state');
        updateSubscriptionState(result.customerInfo);
      }

      return result;
    } catch (error) {
      console.error('❌ Purchase failed in context:', error);
      return { success: false, error: error.message };
    }
  }, [updateSubscriptionState]);

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    console.log('🔄 Restoring purchases via context...');

    try {
      const result = await revenueCatService.restorePurchases();

      if (result.success) {
        console.log('✅ Restore successful, updating state');
        updateSubscriptionState(result.customerInfo);
      }

      return result;
    } catch (error) {
      console.error('❌ Restore failed in context:', error);
      return { success: false, error: error.message };
    }
  }, [updateSubscriptionState]);

  // Check specific entitlement
  const hasEntitlement = useCallback((entitlementId) => {
    return revenueCatService.hasEntitlement(entitlementId);
  }, []);

  // Get active subscriptions
  const getActiveSubscriptions = useCallback(() => {
    return revenueCatService.getActiveSubscriptions();
  }, []);

  const value = {
    // State
    isSubscribed,
    subscriptionInfo,
    customerInfo,
    offerings,
    loading,
    initialized,

    // Actions
    refreshSubscription,
    refreshOfferings,
    purchasePackage,
    restorePurchases,

    // Utilities
    hasEntitlement,
    getActiveSubscriptions,

    // Revenue Cat service direct access for advanced usage
    revenueCatService
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};