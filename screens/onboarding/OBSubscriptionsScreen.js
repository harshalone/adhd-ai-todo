import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Check, Sparkles, Heart, Zap, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';
import BackButton from '../../components/BackButton';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';

export default function OBSubscriptionsScreen({ navigation }) {
  const { theme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState('year');
  const { completeOnboarding } = useAuthStore();

  const plans = [
    {
      id: 'year',
      name: 'Annual',
      price: '$29.99',
      period: '/year',
      pricePerDay: 'Just $0.08/day',
      popular: true,
      savings: 'Save 75%',
      badge: 'BEST VALUE',
    },
    {
      id: 'month',
      name: 'Monthly',
      price: '$3.99',
      period: '/month',
      pricePerDay: '$0.13/day',
      popular: false,
    },
    {
      id: 'week',
      name: 'Weekly',
      price: '$1.99',
      period: '/week',
      pricePerDay: '$0.28/day',
      popular: false,
    },
  ];

  const features = [
    { text: 'Unlimited AI-powered task organization', highlight: true },
    { text: 'Voice-to-task conversion', highlight: true },
    { text: 'Smart priority & time management', highlight: false },
    { text: 'ADHD-friendly focus mode', highlight: true },
    { text: 'Advanced reminders & notifications', highlight: false },
    { text: 'Multi-device sync', highlight: false },
    { text: 'Premium support', highlight: false },
  ];

  const handleSelectPlan = (planId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlan(planId);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Mark onboarding as complete
    completeOnboarding();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Mark onboarding as complete
    completeOnboarding();
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          onPress={handleClose}
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
          {plans.map((plan, index) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                {
                  backgroundColor: selectedPlan === plan.id ? theme.colors.primary + '10' : theme.colors.surface,
                  borderColor: selectedPlan === plan.id ? theme.colors.primary : theme.colors.border,
                  borderWidth: selectedPlan === plan.id ? 3 : 1,
                  transform: selectedPlan === plan.id ? [{ scale: 1.02 }] : [{ scale: 1 }],
                }
              ]}
              onPress={() => handleSelectPlan(plan.id)}
            >
              {plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: theme.colors.primary }]}>
                  <Sparkles size={12} color="#fff" />
                  <Text style={styles.popularText}>{plan.badge}</Text>
                </View>
              )}

              <View style={styles.planContent}>
                <View style={styles.planLeft}>
                  <Text style={[styles.planName, { color: theme.colors.text }]}>{plan.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.planPrice, { color: theme.colors.text }]}>{plan.price}</Text>
                    <Text style={[styles.planPeriod, { color: theme.colors.textSecondary }]}>{plan.period}</Text>
                  </View>
                  <Text style={[styles.pricePerDay, { color: theme.colors.textSecondary }]}>{plan.pricePerDay}</Text>
                  {plan.savings && (
                    <View style={[styles.savingsBadge, { backgroundColor: '#22C55E' }]}>
                      <Text style={styles.savingsText}>{plan.savings}</Text>
                    </View>
                  )}
                </View>

                <View style={[
                  styles.radioButton,
                  {
                    borderColor: selectedPlan === plan.id ? theme.colors.primary : theme.colors.border,
                    backgroundColor: selectedPlan === plan.id ? theme.colors.primary : 'transparent',
                  }
                ]}>
                  {selectedPlan === plan.id && <Check size={18} color="#fff" strokeWidth={3} />}
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
        <View style={styles.pricePreview}>
          <Text style={[styles.pricePreviewText, { color: theme.colors.textSecondary }]}>
            Free for 3 days, then {plans.find(p => p.id === selectedPlan)?.price}{plans.find(p => p.id === selectedPlan)?.period}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Begin Your Journey</Text>
          <ArrowRight size={20} color="#fff" />
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
});