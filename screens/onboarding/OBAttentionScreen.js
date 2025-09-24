import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, CheckCircle2, Star, Brain, Target, Bell, Sparkles, Focus, Trophy } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';
import BackButton from '../../components/BackButton';

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

export default function OBAttentionScreen({ navigation }) {
  const { theme } = useTheme();

  const features = [
    { icon: Brain, text: "Break tasks into chunks" },
    { icon: Target, text: "Visual progress tracking" },
    { icon: Bell, text: "Smart reminders" },
    { icon: Sparkles, text: "AI task planning" },
    { icon: Focus, text: "Focus mode" },
    { icon: Trophy, text: "Gamified rewards" }
  ];

  const reviews = [
    { name: "Sarah M.", text: "This app has completely transformed how I manage my ADHD. I can finally sustain attention on tasks!" },
    { name: "James K.", text: "The attention-focused features are a game changer. I've never been more productive in my life." },
    { name: "Emily R.", text: "I struggled with staying focused for years. This app's approach to breaking down tasks is brilliant." },
    { name: "Michael T.", text: "Finally an app that understands attention difficulties. The reminders are perfectly timed!" },
    { name: "Rachel L.", text: "My attention span has improved dramatically. The visual tracking really helps me stay on task." },
    { name: "David P.", text: "I was skeptical at first, but this app genuinely helps with sustained attention. Highly recommend!" },
    { name: "Lisa W.", text: "The AI planning feature takes the stress out of organizing tasks. My focus has never been better." },
    { name: "Chris B.", text: "This is the only productivity app that actually works for my ADHD brain. Absolutely life-changing!" },
    { name: "Amanda S.", text: "I can't believe how much my attention has improved. This app is exactly what I needed." },
    { name: "Tom H.", text: "The focus mode is incredible. I finally feel in control of my attention and productivity." }
  ];

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('OBAiAutomation');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Improve Attention</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Difficulty Sustaining{'\n'}
            <Text style={{ color: theme.colors.primary }}>Attention?</Text>
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text }]}>
            Here's how we help you improve
          </Text>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            <LaurelBranch style={styles.leftBranch} isRight={false} />
            <View style={styles.statsContent}>
              <Text style={[styles.statsNumber, { color: theme.colors.text }]}>9/10</Text>
              <Text style={[styles.statsLabel, { color: theme.colors.text }]}>Users Improved</Text>
            </View>
            <LaurelBranch style={styles.rightBranch} isRight={true} />
          </View>
          <Text style={[styles.statsSubtext, { color: theme.colors.text }]}>
            Successfully improved their ability to sustain attention
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Icon size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: theme.colors.text }]}>
                  {feature.text}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.reviewsSection}>
          <Text style={[styles.reviewsTitle, { color: theme.colors.text }]}>
            What our users say
          </Text>

          {reviews.map((review, index) => (
            <View key={index} style={[styles.reviewCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <View style={styles.reviewHeader}>
                <Text style={[styles.reviewName, { color: theme.colors.text }]}>{review.name}</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={14} color="#fac946" fill="#fac946" />
                  ))}
                </View>
              </View>
              <Text style={[styles.reviewText, { color: theme.colors.text }]}>
                "{review.text}"
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomCTA, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>
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
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  statsSection: {
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 80,
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
  statsContent: {
    alignItems: 'center',
    flex: 1,
  },
  statsNumber: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
  },
  statsSubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  titleSection: {
    paddingHorizontal: 32,
    marginBottom: 24,
    marginTop: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
  },
  featuresContainer: {
    paddingHorizontal: 32,
    marginBottom: 40,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    lineHeight: 22,
  },
  reviewsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  reviewsTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'left',
    marginBottom: 24,
  },
  reviewCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewName: {
    fontSize: 16,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
    fontStyle: 'italic',
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
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
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 16,
    padding: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});