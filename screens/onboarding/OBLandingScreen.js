import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, ShoppingCart, Tag, Share2, Cloud, Smartphone, Users, Gift, Star, Brain, CheckSquare, Mic, Bell, Heart } from 'lucide-react-native';
import Svg, { Path, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

// Beautiful Golden Laurel Branch inspired by the provided image
const LaurelBranch = ({ style, isRight = false }) => {
  return (
    <Image
      source={require('../../assets/leaf.png')}
      style={[
        {
          width: 40,
          height: 250,
          resizeMode: 'contain',
          transform: isRight ? [{ scaleX: -1 }] : undefined,
        },
        style
      ]}
    />
  );
};

export default function OBLandingScreen({ navigation }) {
  const { theme } = useTheme();

  const features = [
    {
      icon: Brain,
      title: "AI-powered task planning"
    },
    {
      icon: CheckSquare,
      title: "Smart todo management"
    },
    {
      icon: Mic,
      title: "Voice-to-task conversion"
    },
    {
      icon: Bell,
      title: "Intelligent reminders"
    },
    {
      icon: Cloud,
      title: "Sync across devices"
    },
    {
      icon: Heart,
      title: "ADHD-friendly design"
    }
  ];


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Welcome to <Text style={{ color: theme.colors.primary }}>AI: Planner</Text>
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text }]}>
            <Text style={styles.highlightedNumber}> 1.2M </Text> Satisfied Users
          </Text>
        </View>

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <View style={styles.ratingContainer}>
            <LaurelBranch style={styles.leftBranch} color="#FFD700" isRight={false} />
            <View style={styles.ratingContent}>

              <Text style={[styles.ratingNumber, { color: theme.colors.text }]}>4.8</Text>

                <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={16} color="#fac946" fill="#fac946" />
                    ))}
                </View>
                <Text style={[styles.ratingLabel, { color: theme.colors.text }]}>Average Rating</Text>
            </View>
            <LaurelBranch style={styles.rightBranch} color="#FFD700" isRight={true} />
          </View>
          <Text style={[styles.ratingSubtext, { color: theme.colors.text }]}>
            Based on thousands of reviews worldwide
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={[styles.featuresTitle, { color: theme.colors.text }]}>
            What will <Text style={{ color: theme.colors.primary }}>you get?</Text>
          </Text>

          <View style={styles.featuresList}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <feature.icon size={18} color="#007AFF" style={styles.featureIcon} />
                <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
                  {feature.title}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Design Award Section */}
        <View style={styles.awardSection}>
          <View style={styles.awardContainer}>
            <LaurelBranch style={styles.leftBranch} color="#FFD700" isRight={false} />
            <View style={styles.awardContent}>
              <Text style={[styles.awardYear, { color: theme.colors.text }]}>2025</Text>
              <Text style={[styles.awardTitle, { color: theme.colors.text }]}>Design Awards</Text>
            </View>
            <LaurelBranch style={styles.rightBranch} color="#FFD700" isRight={true} />
          </View>
          <Text style={[styles.awardSubtext, { color: theme.colors.text }]}>
            Excellence in User Experience Design
          </Text>
        </View>

        {/* Social Proof */}
        <View style={styles.socialProof}>
          <Text style={[styles.socialText, { color: theme.colors.text }]}>
            Join thousands of users who have transformed their productivity with AI-powered planning
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomCTA, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          style={[styles.getStartedButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('OBAttention')}
        >
          <Text style={styles.getStartedText}>GET STARTED</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 32,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    fontWeight: '400',
  },
  highlightedNumber: {
    backgroundColor: '#ff0000',
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '700',

  },
  featuresContainer: {
    paddingHorizontal: 32,
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  socialProof: {
    paddingHorizontal: 32,
    marginBottom: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingVertical: 24,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  socialText: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 26,
    fontWeight: '500',
  },
  ratingSection: {
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 20,
    minHeight: 70,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  leftBranch: {
    marginRight: 8,
  },
  rightBranch: {
    marginLeft: 8,
  },
  ratingContent: {
    alignItems: 'center',
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 2,
  },
  ratingNumber: {
    fontSize: 30,
    fontWeight: '700',
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
    marginBottom: 6,
    marginTop: 6
  },
  ratingSubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  awardSection: {
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  awardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 70,
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  awardContent: {
    alignItems: 'center',
    flex: 1,
  },
  awardYear: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  awardTitle: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
  },
  awardSubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingVertical: 24,
    paddingBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  getStartedButton: {
    width: '100%',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  getStartedText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  freeText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});