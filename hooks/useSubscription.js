import { useState, useEffect, useCallback } from 'react';
import { revenueCatService } from '../services/revenueCatService';

// Hook for subscription status and info
export const useSubscription = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateSubscriptionState = useCallback((newCustomerInfo) => {
    const subscribed = revenueCatService.isSubscribed();
    const info = revenueCatService.getFormattedSubscriptionInfo();
    const status = revenueCatService.getSubscriptionStatus();

    setIsSubscribed(subscribed);
    setSubscriptionInfo({ ...info, ...status });
    setCustomerInfo(newCustomerInfo);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial load
    const customerInfo = revenueCatService.getCustomerInfo();
    updateSubscriptionState(customerInfo);

    // Subscribe to updates
    const unsubscribe = revenueCatService.subscribe(updateSubscriptionState);

    return unsubscribe;
  }, [updateSubscriptionState]);

  const refreshSubscription = useCallback(async () => {
    setLoading(true);
    const customerInfo = await revenueCatService.refreshCustomerInfo();
    updateSubscriptionState(customerInfo);
  }, [updateSubscriptionState]);

  return {
    isSubscribed,
    subscriptionInfo,
    customerInfo,
    loading,
    refreshSubscription
  };
};

// Hook for purchasing
export const usePurchasing = () => {
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);

  const purchasePackage = useCallback(async (packageToPurchase) => {
    setPurchasing(true);
    setPurchaseError(null);

    try {
      const result = await revenueCatService.purchasePackage(packageToPurchase);

      if (!result.success) {
        setPurchaseError(result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Purchase failed';
      setPurchaseError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setPurchasing(false);
    }
  }, []);

  const purchaseProduct = useCallback(async (productIdentifier) => {
    setPurchasing(true);
    setPurchaseError(null);

    try {
      const result = await revenueCatService.purchaseProduct(productIdentifier);

      if (!result.success) {
        setPurchaseError(result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Purchase failed';
      setPurchaseError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setPurchasing(false);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    setPurchasing(true);
    setPurchaseError(null);

    try {
      const result = await revenueCatService.restorePurchases();

      if (!result.success) {
        setPurchaseError(result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to restore purchases';
      setPurchaseError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setPurchasing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setPurchaseError(null);
  }, []);

  return {
    purchasing,
    purchaseError,
    purchasePackage,
    purchaseProduct,
    restorePurchases,
    clearError
  };
};

// Hook for offerings
export const useOfferings = () => {
  const [offerings, setOfferings] = useState(null);
  const [currentOffering, setCurrentOffering] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOfferings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const offerings = await revenueCatService.loadOfferings();

      if (offerings) {
        setOfferings(offerings);
        setCurrentOffering(offerings.current);
      } else {
        setError('Failed to load offerings');
      }
    } catch (err) {
      setError(err.message || 'Failed to load offerings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if offerings are already loaded
    const existingOfferings = revenueCatService.getOfferings();

    if (existingOfferings) {
      setOfferings(existingOfferings);
      setCurrentOffering(existingOfferings.current);
      setLoading(false);
    } else {
      loadOfferings();
    }
  }, [loadOfferings]);

  return {
    offerings,
    currentOffering,
    loading,
    error,
    refreshOfferings: loadOfferings
  };
};

// Hook for checking specific entitlements
export const useEntitlement = (entitlementId) => {
  const [hasEntitlement, setHasEntitlement] = useState(false);
  const [loading, setLoading] = useState(true);

  const updateEntitlementState = useCallback((customerInfo) => {
    const hasAccess = revenueCatService.hasEntitlement(entitlementId);
    setHasEntitlement(hasAccess);
    setLoading(false);
  }, [entitlementId]);

  useEffect(() => {
    // Initial check
    const customerInfo = revenueCatService.getCustomerInfo();
    updateEntitlementState(customerInfo);

    // Subscribe to updates
    const unsubscribe = revenueCatService.subscribe(updateEntitlementState);

    return unsubscribe;
  }, [updateEntitlementState]);

  return {
    hasEntitlement,
    loading
  };
};