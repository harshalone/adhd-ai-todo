import { useState, useRef, useEffect } from 'react';
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
import useAuthStore from '../../stores/authStore';

export default function OTPScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { email, isRegistration = false } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const { setAuthenticated } = useAuthStore();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerifyOTP = async () => {
    if (otp.trim().length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await authHelpers.verifyOTP(email, otp.trim());

      if (error) {
        Alert.alert('Error', error.message || 'Invalid OTP. Please try again.');
        return;
      }

      if (data?.session && data?.user) {
        // Store authentication data
        setAuthenticated(data.user, data.session);

        // Navigation will be handled by the main app based on auth state
        console.log('Authentication successful for:', email);
      } else {
        Alert.alert('Error', 'Authentication failed. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
      console.error('OTP verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const { data, error } = await authHelpers.sendOTP(email, isRegistration);

      if (error) {
        Alert.alert('Error', error.message || 'Failed to resend OTP. Please try again.');
        return;
      }

      setResendTimer(30);
      Alert.alert('Success', 'OTP sent successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
      console.error('Resend OTP error:', error);
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
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Verify Your Email
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                We've sent a 6-digit code to
              </Text>
              <Text style={[styles.email, { color: theme.colors.primary }]}>
                {email}
              </Text>
            </View>

        <View style={styles.otpContainer}>
          <TextInput
            style={[
              styles.otpInput,
              {
                backgroundColor: theme.colors.surface,
                borderColor: otp.length > 0 ? theme.colors.primary : theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor={theme.colors.textSecondary}
            autoFocus={true}
            textAlign="center"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.colors.primary },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleVerifyOTP}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Didn't receive the code?{' '}
          </Text>
          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={resendTimer > 0}
          >
            <Text
              style={[
                styles.linkText,
                {
                  color: resendTimer > 0 ? theme.colors.textSecondary : theme.colors.link,
                },
              ]}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backText, { color: theme.colors.textSecondary }]}>
            Change Email
          </Text>
            </TouchableOpacity>
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
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  otpContainer: {
    marginBottom: 32,
  },
  otpInput: {
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 20,
    fontWeight: '600',
    paddingHorizontal: 16,
    letterSpacing: 4,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  backButton: {
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
});