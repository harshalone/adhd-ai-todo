import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { authHelpers } from '../../utils/supabase';
import { termsOfService, privacyPolicy } from '../../utils/constants';
import Logo from '../../components/Logo';

export default function RegisterScreen({ navigation }) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await authHelpers.sendOTP(email.trim(), true);

      if (error) {
        Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
        return;
      }

      // Navigate to OTP Registration screen for onboarding flow
      navigation.navigate('OTPRegistration', { email: email.trim() });
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={39} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.logoSection}>
            <Logo size={80} />
          </View>

          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Enter your email to create a new account
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: '#f26e5f' },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <View style={styles.legalLinks}>
              <View style={styles.linksRow}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('WebView', {
                    url: termsOfService
                  })}
                >
                  <Text style={[styles.legalLinkText, { color: theme.colors.link }]}>Terms & Conditions</Text>
                </TouchableOpacity>
                <Text style={[styles.linkSeparator, { color: theme.colors.textSecondary }]}> • </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('WebView', {
                    url: privacyPolicy
                  })}
                >
                  <Text style={[styles.legalLinkText, { color: theme.colors.link }]}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.agreementText, { color: theme.colors.textSecondary }]}>
                By clicking on the button above you agree to the Terms and Conditions and Privacy Policy of the app.
              </Text>
            </View>
          </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  legalLinks: {
    marginTop: 24,
    alignItems: 'center',
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legalLinkText: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  linkSeparator: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  agreementText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});