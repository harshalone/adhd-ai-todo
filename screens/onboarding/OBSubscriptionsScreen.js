import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Check, Sparkles, Heart, Zap, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';
import BackButton from '../../components/BackButton';
import { useState, useEffect } from 'react';
import useAuthStore from '../../stores/authStore';
import { useSubscriptionContext } from '../../context/SubscriptionContext';
import { revenueCatService } from '../../services/revenueCatService';

export default function OBSubscriptionsScreen({ navigation }) {
  const { theme } = useTheme();
  const { completeOnboarding } = useAuthStore();
  const {
    offerings,
    loading,
    refreshSubscription,
    refreshOfferings,
  } = useSubscriptionContext();

  // Lazy load offerings when screen opens
  useEffect(() => {
    const loadData = async () => {
      console.log('🛍️ OBSubscriptionsScreen: Loading offerings...');
      await refreshOfferings();
    };
    loadData();
  }, [refreshOfferings]);

  // Get current offering packages
  const currentOffering = offerings?.current;
  const availablePackages = currentOffering?.availablePackages || [];

  // Track selected package - default to first package (usually annual)
  const [selectedPackageId, setSelectedPackageId] = useState(availablePackages[0]?.identifier || null);
  const [purchasing, setPurchasing] = useState(false);

  // Update selected package when packages load
  useEffect(() => {
    if (availablePackages.length > 0 && !selectedPackageId) {
      setSelectedPackageId(availablePackages[0].identifier);
    }
  }, [availablePackages, selectedPackageId]);

  const features = [
    { text: 'Unlimited AI-powered task organization', highlight: true },
    { text: 'Voice-to-task conversion', highlight: true },
    { text: 'Smart priority & time management', highlight: false },
    { text: 'ADHD-friendly focus mode', highlight: true },
    { text: 'Advanced reminders & notifications', highlight: false },
    { text: 'Multi-device sync', highlight: false },
    { text: 'Premium support', highlight: false },
  ];

  const handleSelectPlan = (packageId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPackageId(packageId);
  };

  const handlePurchase = async () => {
    if (!selectedPackageId || purchasing) return;

    const selectedPackage = availablePackages.find(pkg => pkg.identifier === selectedPackageId);
    if (!selectedPackage) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchasing(true);

    try {
      const result = await revenueCatService.purchasePackage(selectedPackage);

      // Only proceed if purchase was successful
      if (result && result.customerInfo) {
        // Refresh subscription status
        await refreshSubscription();

        // Show success message and complete onboarding
        Alert.alert(
          'Welcome to Pro!',
          'Your subscription has been activated. Enjoy all premium features!',
          [
            {
              text: 'Get Started',
              onPress: () => {
                completeOnboarding();
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

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Mark onboarding as complete without purchasing
    completeOnboarding();
  };

  // Show loading state while loading offerings
  if (loading && !offerings) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading subscription options...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <X size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Heart size={40} color={theme.colors.primary} fill={theme.colors.primary + '30'} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
            Take Control of Your ADHD
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
            Join thousands who've transformed chaos into clarity
          </Text>
        </View>

        <View style={styles.trialBanner}>
          <Zap size={20} color={theme.colors.primary} />
          <Text style={[styles.trialText, { color: theme.colors.text }]}>
            Start your <Text style={[styles.trialHighlight, { color: theme.colors.primary }]}>3-day free trial</Text> • Cancel anytime
          </Text>
        </View>

        <View style={styles.plansContainer}>
          {availablePackages.length > 0 ? (
            availablePackages.map((pkg) => {
              // Generate simple title based on package type
              let simpleTitle = 'Pro';
              let billingPeriod = '';
              let isPopular = false;

              if (pkg.packageType === 'LIFETIME' || pkg.identifier.toLowerCase().includes('lifetime')) {
                simpleTitle = 'Lifetime Pro';
                billingPeriod = '';
                isPopular = true; // Lifetime is the best value
              } else if (pkg.packageType === 'ANNUAL' || pkg.identifier.toLowerCase().includes('year')) {
                simpleTitle = 'Annual';
                billingPeriod = '/year';
                isPopular = false;
              } else if (pkg.packageType === 'MONTHLY' || pkg.identifier.toLowerCase().includes('month')) {
                simpleTitle = 'Monthly';
                billingPeriod = '/month';
              } else if (pkg.packageType === 'WEEKLY' || pkg.identifier.toLowerCase().includes('week')) {
                simpleTitle = 'Weekly';
                billingPeriod = '/week';
              }

              const isSelected = selectedPackageId === pkg.identifier;

              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: isSelected ? theme.colors.primary + '10' : theme.colors.surface,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      borderWidth: isSelected ? 3 : 1,
                      transform: isSelected ? [{ scale: 1.02 }] : [{ scale: 1 }],
                    }
                  ]}
                  onPress={() => handleSelectPlan(pkg.identifier)}
                >
                  {isPopular && (
                    <View style={[styles.popularBadge, { backgroundColor: theme.colors.primary }]}>
                      <Sparkles size={12} color="#fff" />
                      <Text style={styles.popularText}>BEST VALUE</Text>
                    </View>
                  )}

                  <View style={styles.planContent}>
                    <View style={styles.planLeft}>
                      <Text style={[styles.planName, { color: theme.colors.text }]}>{simpleTitle}</Text>
                      <View style={styles.priceRow}>
                        <Text style={[styles.planPrice, { color: theme.colors.text }]}>{pkg.product.priceString}</Text>
                        <Text style={[styles.planPeriod, { color: theme.colors.textSecondary }]}>{billingPeriod}</Text>
                      </View>
                    </View>

                    <View style={[
                      styles.radioButton,
                      {
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                      }
                    ]}>
                      {isSelected && <Check size={18} color="#fff" strokeWidth={3} />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={[styles.noPlansCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.noPlansText, { color: theme.colors.textSecondary }]}>
                No subscription plans are currently available. Please check back later.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.featuresSection}>
          <Text style={[styles.featuresTitle, { color: theme.colors.text }]}>Everything You Need</Text>
          <View style={styles.featuresList}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.checkContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Check size={16} color={theme.colors.primary} strokeWidth={3} />
                </View>
                <Text style={[
                  styles.featureText,
                  {
                    color: theme.colors.text,
                    fontWeight: feature.highlight ? '600' : '400'
                  }
                ]}>{feature.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.guaranteeSection, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.guaranteeTitle, { color: theme.colors.text }]}>💯 100% Risk-Free</Text>
          <Text style={[styles.guaranteeText, { color: theme.colors.textSecondary }]}>
            Try it free for 3 days. If you don't feel more organized and focused, cancel with one tap—no questions asked.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomCTA, {
        backgroundColor: theme.colors.background,
        borderTopColor: theme.colors.border,
        borderTopWidth: 1,
      }]}>
        {availablePackages.length > 0 && selectedPackageId && (
          <View style={styles.pricePreview}>
            <Text style={[styles.pricePreviewText, { color: theme.colors.textSecondary }]}>
              {availablePackages.find(p => p.identifier === selectedPackageId)?.product.priceString || ''}
              {(() => {
                const selectedPkg = availablePackages.find(p => p.identifier === selectedPackageId);
                if (selectedPkg?.packageType === 'LIFETIME' || selectedPkg?.identifier.toLowerCase().includes('lifetime')) {
                  return '';
                } else if (selectedPkg?.packageType === 'ANNUAL') {
                  return '/year';
                } else if (selectedPkg?.packageType === 'MONTHLY') {
                  return '/month';
                } else if (selectedPkg?.packageType === 'WEEKLY') {
                  return '/week';
                }
                return '';
              })()}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: theme.colors.primary },
            purchasing && { opacity: 0.6 }
          ]}
          onPress={handlePurchase}
          activeOpacity={0.8}
          disabled={purchasing || !selectedPackageId}
        >
          {purchasing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Begin Your Journey</Text>
              <ArrowRight size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
        <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
          By continuing, you agree to our{' '}
          <Text style={{ textDecorationLine: 'underline' }}>Terms</Text> &{' '}
          <Text style={{ textDecorationLine: 'underline' }}>Privacy Policy</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerSpacer: {
    flex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 200,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 38,
  },
  heroSubtitle: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  trialText: {
    fontSize: 15,
    fontWeight: '500',
  },
  trialHighlight: {
    fontWeight: '700',
  },
  plansContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 14,
  },
  planCard: {
    borderRadius: 20,
    padding: 18,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  popularText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  planContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLeft: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  planPeriod: {
    fontSize: 18,
    marginLeft: 4,
    fontWeight: '500',
  },
  pricePerDay: {
    fontSize: 14,
    marginBottom: 8,
  },
  radioButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingsBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  savingsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  featuresList: {
    gap: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  guaranteeSection: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  guaranteeTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  guaranteeText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  pricePreview: {
    marginBottom: 12,
  },
  pricePreviewText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 16,
    padding: 18,
    gap: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  termsText: {
    fontSize: 11,
    textAlign: 'center',
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
  },
});