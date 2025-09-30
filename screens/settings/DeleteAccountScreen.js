import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import useAuthStore from '../../stores/authStore';
import BackButton from '../../components/BackButton';
import { getServerUrl } from '../../utils/constants';

export default function DeleteAccountScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, logout, accessToken } = useAuthStore();
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    if (!accessToken) {
      Alert.alert('Error', 'Authentication token not found. Please try logging in again.');
      return;
    }

    setIsLoading(true);

    try {
      // Get server URL from constants
      const serverUrl = await getServerUrl();

      // Step 1: Delete user data from database
      console.log('========== DELETE ACCOUNT API REQUEST ==========');
      console.log('URL:', `${serverUrl}/api/user/delete`);
      console.log('Method: POST');
      console.log('Headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken.substring(0, 50)}...`,
      });
      console.log('Full Authorization Header:', `Bearer ${accessToken}`);
      console.log('User ID:', user?.id);
      console.log('User Email:', user?.email);
      console.log('===============================================');

      const deleteResponse = await fetch(`${serverUrl}/api/user/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      console.log('========== DELETE ACCOUNT API RESPONSE ==========');
      console.log('Status:', deleteResponse.status);
      console.log('Status Text:', deleteResponse.statusText);
      console.log('Headers:', JSON.stringify(Object.fromEntries(deleteResponse.headers.entries())));
      console.log('===============================================');

      const deleteResult = await deleteResponse.json();

      if (!deleteResponse.ok) {
        console.error('Delete API error:', deleteResult);
        Alert.alert('Error', deleteResult.error || 'Failed to delete user data. Please try again.');
        return;
      }

      console.log('User data deleted successfully:', deleteResult);

      // Step 2: Send notification email
      console.log('Step 2: Sending notification email...');
      const notifyResponse = await fetch(`${serverUrl}/api/email/notify-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.email || deleteResult.email,
        }),
      });

      const notifyResult = await notifyResponse.json();

      if (!notifyResponse.ok) {
        console.error('Email notification failed:', notifyResult);
        // Don't fail the entire process if email fails
        console.warn('Email notification failed, but user data was deleted successfully');
      } else {
        console.log('Notification email sent successfully:', notifyResult);
      }

      // Step 3: Automatically logout user
      await logout();
      Alert.alert('Account Deleted', 'Your account has been permanently deleted. Thank you for using our service.');

    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
});