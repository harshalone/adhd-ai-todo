import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSubscriptionContext } from '../context/SubscriptionContext';
import { useTheme } from '../context/ThemeContext';

// Component that gates content behind subscription
export const SubscriptionGate = ({
  children,
  fallback,
  entitlementId = null,
  showLoader = true
}) => {
  const { isSubscribed, hasEntitlement, loading, checkSubscription } = useSubscriptionContext();
  const { theme } = useTheme();
  const [checking, setChecking] = React.useState(false);

  // Lazy check subscription when component mounts
  React.useEffect(() => {
    const checkIfNeeded = async () => {
      setChecking(true);
      await checkSubscription(); // Will use cache if available
      setChecking(false);
    };
    checkIfNeeded();
  }, [checkSubscription]);

  if ((loading || checking) && showLoader) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Checking subscription status...
        </Text>
      </View>
    );
  }

  // Check specific entitlement if provided, otherwise check general subscription
  const hasAccess = entitlementId ? hasEntitlement(entitlementId) : isSubscribed;

  if (hasAccess) {
    return children;
  }

  // Show fallback component or default upgrade prompt
  if (fallback) {
    return fallback;
  }

  return (
    <View style={[styles.gateContainer, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.gateTitle, { color: theme.colors.text }]}>
        Premium Feature
      </Text>
      <Text style={[styles.gateMessage, { color: theme.colors.textSecondary }]}>
        This feature requires an active subscription to access.
      </Text>
    </View>
  );
};

// Component that shows subscription status
export const SubscriptionStatus = ({ showDetails = true }) => {
  const { isSubscribed, subscriptionInfo, loading, checkSubscription } = useSubscriptionContext();
  const { theme } = useTheme();
  const [checking, setChecking] = React.useState(false);

  // Lazy check subscription when component mounts
  React.useEffect(() => {
    const checkIfNeeded = async () => {
      setChecking(true);
      await checkSubscription();
      setChecking(false);
    };
    checkIfNeeded();
  }, [checkSubscription]);

  if (loading || checking) {
    return (
      <View style={styles.statusContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  if (!isSubscribed) {
    return (
      <View style={[styles.statusContainer, { backgroundColor: theme.colors.error + '20' }]}>
        <Text style={[styles.statusText, { color: theme.colors.error }]}>
          No Active Subscription
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.statusContainer, { backgroundColor: theme.colors.success + '20' }]}>
      <Text style={[styles.statusText, { color: theme.colors.success }]}>
        Active Subscription
      </Text>
      {showDetails && subscriptionInfo && (
        <Text style={[styles.statusDetails, { color: theme.colors.textSecondary }]}>
          {subscriptionInfo.displayText}
        </Text>
      )}
    </View>
  );
};

// Component for purchase buttons
export const PurchaseButton = ({
  package: packageToPurchase,
  title,
  subtitle,
  style,
  onPurchaseStart,
  onPurchaseComplete,
  onPurchaseError,
  disabled = false
}) => {
  const { purchasePackage } = useSubscriptionContext();
  const { theme } = useTheme();
  const [purchasing, setPurchasing] = React.useState(false);

  const handlePurchase = async () => {
    if (purchasing || disabled) return;

    setPurchasing(true);
    onPurchaseStart?.();

    try {
      const result = await purchasePackage(packageToPurchase);

      if (result.success) {
        onPurchaseComplete?.(result);
      } else {
        onPurchaseError?.(result.error);
      }
    } catch (error) {
      onPurchaseError?.(error.message);
    } finally {
      setPurchasing(false);
    }
  };

  const displayTitle = title || packageToPurchase?.product?.title || 'Subscribe';
  // Only show subtitle if explicitly provided
  const displaySubtitle = subtitle;

  return (
    <TouchableOpacity
      style={[
        styles.purchaseButton,
        { backgroundColor: theme.colors.primary },
        disabled && { opacity: 0.5 },
        style
      ]}
      onPress={handlePurchase}
      disabled={purchasing || disabled}
    >
      {purchasing ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          <Text style={styles.purchaseButtonTitle}>
            {displayTitle}
          </Text>
          {displaySubtitle && (
            <Text style={styles.purchaseButtonSubtitle}>
              {displaySubtitle}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

// Component for restore purchases button
export const RestorePurchasesButton = ({
  title = "Restore Purchases",
  style,
  onRestoreStart,
  onRestoreComplete,
  onRestoreError
}) => {
  const { restorePurchases } = useSubscriptionContext();
  const { theme } = useTheme();
  const [restoring, setRestoring] = React.useState(false);

  const handleRestore = async () => {
    if (restoring) return;

    setRestoring(true);
    onRestoreStart?.();

    try {
      const result = await restorePurchases();

      if (result.success) {
        onRestoreComplete?.(result);
      } else {
        onRestoreError?.(result.error);
      }
    } catch (error) {
      onRestoreError?.(error.message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.restoreButton,
        { borderColor: theme.colors.primary },
        style
      ]}
      onPress={handleRestore}
      disabled={restoring}
    >
      {restoring ? (
        <ActivityIndicator size="small" color={theme.colors.primary} />
      ) : (
        <Text style={[styles.restoreButtonText, { color: theme.colors.primary }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  gateContainer: {
    padding: 20,
    borderRadius: 12,
    margin: 20,
    alignItems: 'center',
  },
  gateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  gateMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  statusContainer: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusDetails: {
    fontSize: 12,
    marginTop: 4,
  },
  purchaseButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  purchaseButtonTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  purchaseButtonSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 4,
    opacity: 0.9,
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});