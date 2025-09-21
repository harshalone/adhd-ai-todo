import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, SkipForward } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import BackButton from '../../components/BackButton';
import useAuthStore from '../../stores/authStore';
import * as Haptics from 'expo-haptics';
import { getOnboardingVideoId } from '../../utils/constants';

const { width, height } = Dimensions.get('window');

export default function OBVideoScreen({ navigation }) {
  const { theme } = useTheme();
  const { completeOnboarding } = useAuthStore();
  const [videoError, setVideoError] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadVideoId = async () => {
      try {
        const videoId = await getOnboardingVideoId();
        const url = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&showinfo=0&rel=0&modestbranding=1`;
        setEmbedUrl(url);
      } catch (error) {
        console.error('Failed to load video ID:', error);
        // Fallback to default
        setEmbedUrl('https://www.youtube.com/embed/CI0pwaRei74?autoplay=0&controls=1&showinfo=0&rel=0&modestbranding=1');
      }
    };

    loadVideoId();
  }, []);


  const handleCompleteOnboarding = () => {
    // Mark onboarding as completed
    completeOnboarding();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleCompleteOnboarding();
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleCompleteOnboarding();
  };

  const handleVideoError = () => {
    setVideoError(true);
    Alert.alert(
      'Video Error',
      'Unable to load the video. You can skip this step and continue.',
      [
        {
          text: 'Skip',
          onPress: handleSkip
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Video Container - Full Screen 9:16 aspect ratio */}
      <View style={styles.videoContainer}>
        {!videoError && embedUrl ? (
          <WebView
            source={{ uri: embedUrl }}
            style={styles.video}
            onLoad={() => {}}
            onError={handleVideoError}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
          />
        ) : (
          <View style={styles.errorContainer}>
            <View style={styles.errorContent}>
              <View style={[styles.errorBox, { backgroundColor: theme.colors.surface }]}>
                {/* Error message placeholder */}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Back Button */}
      <View style={[styles.backButtonContainer, { top: insets.top + 10 }]}>
        <BackButton
          onPress={() => navigation.goBack()}
          style={styles.floatingBackButton}
        />
      </View>

      {/* Bottom Buttons */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.buttonContainer}>
          {/* Skip Button */}
          <TouchableOpacity
            style={[styles.skipButton, { borderColor: 'rgba(255, 255, 255, 0.3)' }]}
            onPress={handleSkip}
          >
            <SkipForward size={18} color="#fff" />
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <ArrowRight size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBox: {
    width: width * 0.8,
    height: (width * 0.8 * 16) / 9, // 9:16 aspect ratio for error state
    borderRadius: 12,
  },
  backButtonContainer: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
  },
  floatingBackButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 22,
    width: 44,
    height: 44,
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  continueButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});