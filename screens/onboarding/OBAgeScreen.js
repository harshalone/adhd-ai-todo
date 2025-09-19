import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Shield, AlertTriangle } from 'lucide-react-native';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import BackButton from '../../components/BackButton';
import * as Haptics from 'expo-haptics';

export default function OBAgeScreen({ navigation }) {
  const { theme } = useTheme();
  const [age, setAge] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAgeChange = (text) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    setAge(numericValue);
    setShowError(false);
    setErrorMessage('');
  };

  const validateAge = () => {
    const ageNum = parseInt(age);

    if (!age || isNaN(ageNum)) {
      setErrorMessage('Please enter your age');
      setShowError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }

    if (ageNum < 10 || ageNum > 108) {
      setErrorMessage('Please enter a valid age between 10 and 108');
      setShowError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }

    if (ageNum < 18) {
      // Show age restriction alert
      Alert.alert(
        'Age Restriction',
        'We are sorry, but you cannot use this app. It is meant to be used only by users above 18 years old.',
        [
          {
            text: 'OK',
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              navigation.goBack();
            }
          }
        ]
      );
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateAge()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate('OBVideoScreen');
    }
  };

  const isValidAge = age && parseInt(age) >= 18 && parseInt(age) <= 108;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.title, { color: theme.colors.text }]}>Age Verification</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Main Content */}
          <View style={styles.mainContent}>
            <Text style={[styles.heading, { color: theme.colors.text }]}>
              What is your age?
            </Text>

            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Please enter your age to continue. This is for verification purposes only.
            </Text>

            {/* Age Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.ageInput,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: showError ? '#FF3B30' : theme.colors.border,
                    color: theme.colors.text,
                  }
                ]}
                placeholder="Enter your age"
                placeholderTextColor={theme.colors.textSecondary}
                value={age}
                onChangeText={handleAgeChange}
                keyboardType="numeric"
                maxLength={3}
                autoFocus={true}
                textAlign="center"
              />

              {showError && (
                <View style={styles.errorContainer}>
                  <AlertTriangle size={16} color="#FF3B30" />
                  <Text style={[styles.errorText, { color: '#FF3B30' }]}>
                    {errorMessage}
                  </Text>
                </View>
              )}
 
            </View>

            {/* Privacy Notice */}
            <View style={[styles.privacyNotice, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.privacyHeader}>
                <Shield size={20} color={theme.colors.primary} />
                <Text style={[styles.privacyTitle, { color: theme.colors.text }]}>
                  Privacy Notice
                </Text>
              </View>
              <Text style={[styles.privacyText, { color: theme.colors.textSecondary }]}>
                We do not store this information. This verification is for compliance purposes only and helps us ensure our app is used appropriately.
              </Text>
            </View>
 
          </View>
        </ScrollView>

        {/* Bottom Next Button */}
        <View style={[styles.bottomCTA, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              {
                backgroundColor: isValidAge ? theme.colors.primary : theme.colors.border,
                opacity: isValidAge ? 1 : 0.6
              }
            ]}
            onPress={handleNext}
            disabled={!isValidAge}
          >
            <Text style={[
              styles.nextButtonText,
              { color: isValidAge ? '#fff' : theme.colors.textSecondary }
            ]}>
              Continue
            </Text>
            <ArrowRight size={20} color={isValidAge ? '#fff' : theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  mainContent: {
    alignItems: 'center',
    paddingTop: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  ageInput: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    gap: 6,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  privacyNotice: {
    width: '100%',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  privacyText: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
  requirementNotice: {
    width: '100%',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});