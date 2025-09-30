import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useSubscriptionContext } from '../context/SubscriptionContext';
import BackButton from '../components/BackButton';
import { SubscriptionStatus, PurchaseButton, RestorePurchasesButton } from '../components/SubscriptionGate';
import { Check, RefreshCw } from 'lucide-react-native';
import Purchases from 'react-native-purchases';
import { revenueCatService } from '../services/revenueCatService';
import { appMetadataService } from '../services/appMetadataService';
import { REVENUECAT_APPLE_API_KEY, REVENUECAT_GOOGLE_API_KEY } from '../utils/constants';

export default function SubscriptionsScreen({ navigation }) {
  const { theme } = useTheme();
  const {
    isSubscribed,
    subscriptionInfo,
    offerings,
    loading,
    initialized,
    checkSubscription,
    refreshSubscription,
    refreshOfferings,
    getActiveSubscriptions
  } = useSubscriptionContext();

  // Lazy load subscription and offerings when screen opens
  React.useEffect(() => {
    const loadData = async () => {
      await checkSubscription(); // Check subscription status
      await refreshOfferings(); // Load offerings
    };
    loadData();
  }, [checkSubscription, refreshOfferings]);

  // Get active subscriptions
  const activeSubscriptions = getActiveSubscriptions();

  // Get current offering packages
  const currentOffering = offerings?.current;
  const availablePackages = currentOffering?.availablePackages || [];

  // Console log offerings data for debugging
  console.log('=== RevenueCat Offerings Data ===');
  console.log('Full offerings object:', JSON.stringify(offerings, null, 2));
  console.log('Current offering:', currentOffering);
  console.log('Available packages count:', availablePackages.length);

  if (availablePackages.length > 0) {
    availablePackages.forEach((pkg, index) => {
      console.log(`\n--- Package ${index + 1} ---`);
      console.log('Identifier:', pkg.identifier);
      console.log('Package type:', pkg.packageType);
      console.log('Product:', {
        identifier: pkg.product.identifier,
        title: pkg.product.title,
        description: pkg.product.description,
        price: pkg.product.price,
        priceString: pkg.product.priceString,
        currencyCode: pkg.product.currencyCode,
      });
      console.log('Full package object:', pkg);
    });
  } else {
    console.log('⚠️ No packages available');
  }

  console.log('\nActive subscriptions:', activeSubscriptions);
  console.log('Is subscribed:', isSubscribed);
  console.log('Subscription info:', subscriptionInfo);
  console.log('=== End Offerings Data ===\n');

  const handlePurchaseComplete = (result) => {
    Alert.alert(
      'Success!',
      'Your subscription has been activated.',
      [{ text: 'OK', onPress: () => refreshSubscription() }]
    );
  };

  const handlePurchaseError = (error) => {
    if (error !== 'Purchase was cancelled') {
      Alert.alert('Purchase Failed', error || 'Something went wrong. Please try again.');
    }
  };

  const handleRestoreComplete = (result) => {
    if (result.hasActiveEntitlements) {
      Alert.alert('Success!', 'Your purchases have been restored.');
    } else {
      Alert.alert('No Purchases Found', 'No active subscriptions were found to restore.');
    }
  };

  const handleRestoreError = (error) => {
    Alert.alert('Restore Failed', error || 'Failed to restore purchases. Please try again.');
  };

  const handleRetry = async () => {
    try {
      // Check if RevenueCat is configured
      if (!revenueCatService.isSDKConfigured()) {
        console.log('⚠️ RevenueCat not configured - this should have been done in App.js');
        Alert.alert('Configuration Error', 'RevenueCat is not properly initialized. Please restart the app.');
        return;
      }

      // Refresh subscription data
      await refreshSubscription();
    } catch (error) {
      console.error('❌ Retry failed:', error);
      Alert.alert('Error', 'Failed to load subscription data. Please try again later.');
    }
  };

  if (!initialized || loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Subscription</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading subscription info...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.title, { color: theme.colors.text }]}>Subscription</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRetry}
        >
          <RefreshCw size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Subscription Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Current Status
          </Text>
          <SubscriptionStatus showDetails={true} />

          {isSubscribed && activeSubscriptions.length > 0 && (
            <View style={[styles.activeSubscriptionCard, {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.primary + '30',
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 3,
            }]}>
              {activeSubscriptions.map((entitlement, index) => {
                // Debug log the entitlement data
                console.log('Entitlement data:', {
                  productIdentifier: entitlement.productIdentifier,
                  expirationDate: entitlement.expirationDate,
                  latestPurchaseDate: entitlement.latestPurchaseDate,
                  originalPurchaseDate: entitlement.originalPurchaseDate,
                  willRenew: entitlement.willRenew,
                  periodType: entitlement.periodType
                });

                // Generate simple title based on product identifier
                const productId = entitlement.productIdentifier.toLowerCase();
                let simpleTitle = 'Pro';
                if (productId.includes('year') || productId.includes('annual')) {
                  simpleTitle = 'Pro Yearly';
                } else if (productId.includes('month')) {
                  simpleTitle = 'Pro Monthly';
                } else if (productId.includes('week')) {
                  simpleTitle = 'Pro Weekly';
                }

                return (
                  <View key={index} style={styles.subscriptionDetail}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.subscriptionLabel, { color: theme.colors.textSecondary }]}>
                        Product
                      </Text>
                      <Text style={[styles.subscriptionValue, { color: theme.colors.text }]}>
                        {simpleTitle}
                      </Text>
                    </View>

                    {entitlement.expirationDate && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.subscriptionLabel, { color: theme.colors.textSecondary }]}>
                          {entitlement.willRenew ? 'Renews On' : 'Expires On'}
                        </Text>
                        <Text style={[styles.subscriptionValue, { color: theme.colors.text }]}>
                          {new Date(entitlement.expirationDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Available Subscription Plans */}
        {availablePackages.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {isSubscribed ? 'Upgrade Options' : 'Available Plans'}
            </Text>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              {isSubscribed
                ? 'Switch to a different plan'
                : 'Choose a plan that works best for you'}
            </Text>

            {availablePackages.map((pkg, index) => {
              // Generate simple title based on package type
              let simpleTitle = 'Pro';
              if (pkg.packageType === 'ANNUAL' || pkg.identifier.toLowerCase().includes('year')) {
                simpleTitle = 'Pro Yearly';
              } else if (pkg.packageType === 'MONTHLY' || pkg.identifier.toLowerCase().includes('month')) {
                simpleTitle = 'Pro Monthly';
              } else if (pkg.packageType === 'WEEKLY' || pkg.identifier.toLowerCase().includes('week')) {
                simpleTitle = 'Pro Weekly';
              }

              return (
                <View
                  key={pkg.identifier}
                  style={[
                    styles.packageCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.primary + '30',
                      shadowColor: theme.colors.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 6,
                      elevation: 3,
                    }
                  ]}
                >
                  <View style={styles.packageRow}>
                    <Text style={[styles.packageTitle, { color: theme.colors.text }]}>
                      {simpleTitle}
                    </Text>
                    <Text style={[styles.packagePrice, { color: theme.colors.primary }]}>
                      {pkg.product.priceString}
                    </Text>
                  </View>

                  <PurchaseButton
                    package={pkg}
                    title="Subscribe"
                    onPurchaseComplete={handlePurchaseComplete}
                    onPurchaseError={handlePurchaseError}
                    style={styles.purchaseButton}
                  />
                </View>
              );
            })}
          </View>
        ) : !isSubscribed && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Available Plans
            </Text>
            <View style={[styles.noPlansCard, {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }]}>
              <Text style={[styles.noPlansText, { color: theme.colors.textSecondary }]}>
                No subscription plans are currently available. Please check back later or contact support.
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleRetry}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Restore Purchases */}
        <View style={styles.restoreSection}>
          <RestorePurchasesButton
            onRestoreComplete={handleRestoreComplete}
            onRestoreError={handleRestoreError}
          />
          <Text style={[styles.restoreHint, { color: theme.colors.textSecondary }]}>
            Already purchased? Restore your purchases to regain access.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 0,
    paddingRight: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    flex: 1,
  },
  refreshButton: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  activeSubscriptionCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  subscriptionDetail: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subscriptionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  packageCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  packageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  packageTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  purchaseButton: {
    marginTop: 0,
  },
  restoreSection: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  restoreHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },
  noPlansCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  noPlansText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});