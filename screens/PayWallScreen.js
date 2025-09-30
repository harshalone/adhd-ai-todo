import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useSubscriptionContext } from '../context/SubscriptionContext';
import { PurchaseButton, RestorePurchasesButton } from '../components/SubscriptionGate';
import { X, Sparkles, Zap, Clock, Brain, Check } from 'lucide-react-native';
import { useState } from 'react';
import { revenueCatService } from '../services/revenueCatService';

export default function PayWallScreen({ navigation, route }) {
  const { theme } = useTheme();
  const {
    offerings,
    loading,
    initialized,
    refreshSubscription,
  } = useSubscriptionContext();

  // Get the intended destination from route params
  const { destination = 'AiTodoAdd', params = {} } = route.params || {};

  // Get current offering packages
  const currentOffering = offerings?.current;
  const availablePackages = currentOffering?.availablePackages || [];

  // Track selected package
  const [selectedPackageId, setSelectedPackageId] = useState(availablePackages[0]?.identifier || null);
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!selectedPackageId || purchasing) return;

    const selectedPackage = availablePackages.find(pkg => pkg.identifier === selectedPackageId);
    if (!selectedPackage) return;

    setPurchasing(true);
    try {
      const result = await revenueCatService.purchasePackage(selectedPackage);

      // Only proceed if purchase was successful
      if (result && result.customerInfo) {
        // Refresh subscription status
        await refreshSubscription();

        // Show success message
        Alert.alert(
          'Welcome to Pro!',
          'Your subscription has been activated. Enjoy all premium features!',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to the intended destination
                navigation.replace(destination, params);
              }
            }
          ]
        );
      }
    } catch (error) {
      // Only show error alert for real errors, not cancellations
      if (error.message && !error.message.includes('cancelled')) {
        Alert.alert('Purchase Failed', error.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestoreComplete = async (result) => {
    if (result.hasActiveEntitlements) {
      await refreshSubscription();
      Alert.alert(
        'Success!',
        'Your purchases have been restored.',
        [
          {
            text: 'Continue',
            onPress: () => {
              navigation.replace(destination, params);
            }
          }
        ]
      );
    } else {
      Alert.alert('No Purchases Found', 'No active subscriptions were found to restore.');
    }
  };

  const handleRestoreError = (error) => {
    Alert.alert('Restore Failed', error || 'Failed to restore purchases. Please try again.');
  };

  const handleClose = () => {
    navigation.goBack();
  };

  if (!initialized || loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
      >
        <X size={24} color={theme.colors.text} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
            <Sparkles size={40} color={theme.colors.primary} />
          </View>
          <Text style={[styles.mainTitle, { color: theme.colors.text }]}>
            Unlock Pro Features
          </Text>
          <Text style={[styles.mainSubtitle, { color: theme.colors.textSecondary }]}>
            Get access to AI-powered todo creation and more
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <FeatureItem
            icon={<Brain size={24} color={theme.colors.primary} />}
            title="AI Todo Creation"
            description="Convert voice notes into organized tasks instantly"
            theme={theme}
          />
          <FeatureItem
            icon={<Zap size={24} color={theme.colors.primary} />}
            title="Smart Scheduling"
            description="AI automatically sets times and priorities"
            theme={theme}
          />
          <FeatureItem
            icon={<Clock size={24} color={theme.colors.primary} />}
            title="Time Management"
            description="Get intelligent reminders and time suggestions"
            theme={theme}
          />
        </View>

        {/* Subscription Plans */}
        {availablePackages.length > 0 ? (
          <View style={styles.plansSection}>
            <Text style={[styles.plansTitle, { color: theme.colors.text }]}>
              Choose Your Plan
            </Text>

            {availablePackages.map((pkg, index) => {
              // Generate simple title based on package type
              let simpleTitle = 'Pro';
              let billingPeriod = '';

              if (pkg.packageType === 'ANNUAL' || pkg.identifier.toLowerCase().includes('year')) {
                simpleTitle = 'Pro Yearly';
                billingPeriod = 'per year';
              } else if (pkg.packageType === 'MONTHLY' || pkg.identifier.toLowerCase().includes('month')) {
                simpleTitle = 'Pro Monthly';
                billingPeriod = 'per month';
              } else if (pkg.packageType === 'WEEKLY' || pkg.identifier.toLowerCase().includes('week')) {
                simpleTitle = 'Pro Weekly';
                billingPeriod = 'per week';
              }

              const isSelected = selectedPackageId === pkg.identifier;

              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    styles.packageCard,
                    {
                      backgroundColor: isSelected ? theme.colors.primary + '15' : theme.colors.surface,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    }
                  ]}
                  onPress={() => setSelectedPackageId(pkg.identifier)}
                  activeOpacity={0.7}
                >
                  <View style={styles.packageContent}>
                    <View style={styles.packageLeft}>
                      <Text style={[styles.packageTitle, { color: theme.colors.text }]}>
                        {simpleTitle}
                      </Text>
                      {billingPeriod && (
                        <Text style={[styles.billingPeriod, { color: theme.colors.textSecondary }]}>
                          {billingPeriod}
                        </Text>
                      )}
                    </View>
                    <View style={styles.packageRight}>
                      <Text style={[styles.packagePrice, { color: isSelected ? theme.colors.primary : theme.colors.text }]}>
                        {pkg.product.priceString}
                      </Text>
                      {isSelected && (
                        <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                          <Check size={16} color="#fff" strokeWidth={3} />
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Subscribe Button */}
            <TouchableOpacity
              style={[
                styles.subscribeButton,
                { backgroundColor: theme.colors.primary },
                purchasing && { opacity: 0.6 }
              ]}
              onPress={handlePurchase}
              disabled={purchasing || !selectedPackageId}
            >
              {purchasing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  Subscribe Now
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.plansSection}>
            <View style={[styles.noPlansCard, {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }]}>
              <Text style={[styles.noPlansText, { color: theme.colors.textSecondary }]}>
                No subscription plans are currently available. Please check back later.
              </Text>
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
            Already purchased? Restore your purchases to continue.
          </Text>
        </View>

        {/* Terms */}
        <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
          Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, title, description, theme }) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: theme.colors.primary + '15' }]}>
        {icon}
      </View>
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 10,
    padding: 8,
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
    paddingTop: 60,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  mainSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  featuresSection: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureText: {
    flex: 1,
    paddingTop: 4,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  plansSection: {
    marginBottom: 24,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  packageCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 10,
  },
  packageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageLeft: {
    flex: 1,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  billingPeriod: {
    fontSize: 12,
  },
  packageRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeButton: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  restoreSection: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  restoreHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },
  termsText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
    marginBottom: 20,
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
  },
});