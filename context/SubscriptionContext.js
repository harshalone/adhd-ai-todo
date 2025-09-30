import React, { createContext, useContext, useCallback } from 'react';
import useSubscriptionStore from '../stores/subscriptionStore';

const SubscriptionContext = createContext();

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  // Get state and actions from Zustand store
  const {
    isSubscribed,
    subscriptionInfo,
    customerInfo,
    offerings,
    loading,
    initialized,
    checkSubscription,
    loadOfferings,
    purchasePackage: storePurchasePackage,
    restorePurchases: storeRestorePurchases,
    hasEntitlement: storeHasEntitlement,
    clearCache,
  } = useSubscriptionStore();

  // Refresh subscription info (force refresh from API)
  const refreshSubscription = useCallback(async () => {
    return await checkSubscription(true);
  }, [checkSubscription]);

  // Refresh offerings
  const refreshOfferings = useCallback(async () => {
    return await loadOfferings();
  }, [loadOfferings]);

  // Purchase a package
  const purchasePackage = useCallback(async (packageToPurchase) => {
    return await storePurchasePackage(packageToPurchase);
  }, [storePurchasePackage]);

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    return await storeRestorePurchases();
  }, [storeRestorePurchases]);

  // Check specific entitlement
  const hasEntitlement = useCallback((entitlementId) => {
    return storeHasEntitlement(entitlementId);
  }, [storeHasEntitlement]);

  // Get active subscriptions (legacy support)
  const getActiveSubscriptions = useCallback(() => {
    if (!customerInfo) return [];
    return Object.values(customerInfo.entitlements?.active || {});
  }, [customerInfo]);

  const value = {
    // State
    isSubscribed,
    hasActiveSubscription: isSubscribed, // Alias for backwards compatibility
    subscriptionInfo,
    customerInfo,
    offerings,
    loading,
    initialized,

    // Actions
    checkSubscription, // New: explicitly check subscription (lazy)
    refreshSubscription, // Force refresh
    refreshOfferings,
    purchasePackage,
    restorePurchases,

    // Utilities
    hasEntitlement,
    getActiveSubscriptions,
    clearCache, // New: clear cache if needed
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};