import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import useAuthStore from '../../stores/authStore';
import BackButton from '../../components/BackButton';
import { CONTACT_US_API_URL } from '../../utils/constants';

export default function DeleteAccountScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, logout } = useAuthStore();
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const feedbackOptions = [
    "I don't use the app anymore",
    "I found a better alternative",
    "The app doesn't meet my needs",
    "Privacy concerns",
    "Too many notifications",
    "Other"
  ];

  const handleSelectFeedback = (option) => {
    setFeedback(option);
  };

  const handleDeleteAccount = async () => {
    if (!feedback.trim()) {
      Alert.alert('Required', 'Please tell us why you want to leave before proceeding.');
      return;
    }

    setIsLoading(true);

    try {
      const requestBody = {
        name: user?.name || user?.email || 'Unknown User',
        email: user?.email || '',
        message: `Account Deletion Request - Reason: ${feedback}`,
        type: 'account_deletion',
        user_id: user?.id || ''
      };

      const response = await fetch(CONTACT_US_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setShowConfirmation(true);
      } else {
        Alert.alert('Error', 'Failed to process deletion request. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLogout = async () => {
    try {
      await logout();
      Alert.alert('Account Deletion Requested', 'You have been logged out. Your account information will be deleted within 72 hours.', [
        { text: 'OK', onPress: () => navigation.navigate('Auth') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  if (showConfirmation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Account Deletion</Text>
        </View>
        <View style={styles.confirmationContent}>
          <Text style={[styles.confirmationTitle, { color: theme.colors.text }]}>
            Deletion Request Submitted
          </Text>
          <Text style={[styles.confirmationMessage, { color: theme.colors.text }]}>
            Your account deletion request has been submitted successfully.
          </Text>
          <Text style={[styles.warningText, { color: theme.colors.text }]}>
            All your information will be permanently deleted within the next 72 hours.
          </Text>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: '#f26e5f' }]}
            onPress={handleConfirmLogout}
          >
            <Text style={styles.logoutButtonText}>Logout Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.title, { color: theme.colors.text }]}>Delete Account</Text>
      </View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.subtitle, { color: theme.colors.text }]}>
            We're sorry to see you go. Before we proceed, could you help us understand why you want to delete your account?
          </Text>

          <View style={styles.feedbackSection}>
            <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>
              Why are you leaving?
            </Text>

            {feedbackOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.feedbackOption,
                  {
                    backgroundColor: feedback === option ? theme.colors.primary : theme.colors.card,
                    borderColor: feedback === option ? theme.colors.primary : theme.colors.border,
                  }
                ]}
                onPress={() => handleSelectFeedback(option)}
              >
                <Text style={[
                  styles.feedbackOptionText,
                  {
                    color: feedback === option ? '#fff' : theme.colors.text
                  }
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}

            {feedback === 'Other' && (
              <TextInput
                style={[
                  styles.customFeedbackInput,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.card,
                    color: theme.colors.text
                  }
                ]}
                placeholder="Please specify..."
                placeholderTextColor={theme.colors.text + '80'}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                onChangeText={(text) => setFeedback(`Other: ${text}`)}
                value={feedback.startsWith('Other: ') ? feedback.substring(7) : ''}
              />
            )}
          </View>

          <View style={styles.warningSection}>
            <Text style={[styles.warningTitle, { color: '#f26e5f' }]}>
              Warning: This action cannot be undone
            </Text>
            <Text style={[styles.warningText, { color: theme.colors.text }]}>
              • All your data will be permanently deleted
            </Text>
            <Text style={[styles.warningText, { color: theme.colors.text }]}>
              • Your cards and deals will be removed
            </Text>
            <Text style={[styles.warningText, { color: theme.colors.text }]}>
              • You will lose access to your account immediately
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              {
                backgroundColor: '#f26e5f',
                opacity: isLoading ? 0.7 : 1
              }
            ]}
            onPress={handleDeleteAccount}
            disabled={isLoading || !feedback.trim()}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete My Account</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
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
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  confirmationContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmationMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  feedbackSection: {
    marginBottom: 32,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  feedbackOption: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  feedbackOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  customFeedbackInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 80,
    marginTop: 12,
  },
  warningSection: {
    marginBottom: 32,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
    lineHeight: 20,
  },
  deleteButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    width: '80%',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});