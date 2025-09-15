import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import useAuthStore from '../../stores/authStore';
import BackButton from '../../components/BackButton';

export default function ContactUsScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Pre-populate email from authenticated user
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async () => {
    console.log('ContactUs: Starting form submission');
    console.log('ContactUs: Form data:', {
      name: name.trim(),
      email: email.trim(),
      message: message.trim()
    });

    if (!name.trim() || !email.trim() || !message.trim()) {
      console.log('ContactUs: Validation failed - missing fields');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    console.log('ContactUs: Validation passed, starting API request');
    setIsLoading(true);

    try {
      const requestBody = {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      };

      console.log('ContactUs: Request body:', requestBody);
      console.log('ContactUs: Making API call to:', 'https://www.mobilecrm.org/api/email/esend');

      const response = await fetch('https://www.mobilecrm.org/api/email/esend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('ContactUs: Response status:', response.status);
      console.log('ContactUs: Response ok:', response.ok);
      console.log('ContactUs: Response headers:', Object.fromEntries(response.headers.entries()));

      let responseText;
      try {
        responseText = await response.text();
        console.log('ContactUs: Response text:', responseText);
      } catch (textError) {
        console.log('ContactUs: Error reading response text:', textError);
      }

      if (response.ok) {
        console.log('ContactUs: Message sent successfully');
        Alert.alert('Success', 'Your message has been sent successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        console.log('ContactUs: Server error - response not ok');
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.log('ContactUs: Network/fetch error:', error);
      console.log('ContactUs: Error message:', error.message);
      console.log('ContactUs: Error stack:', error.stack);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      console.log('ContactUs: Request completed, setting loading to false');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.title, { color: theme.colors.text }]}>Contact Us</Text>
      </View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.subtitle, { color: theme.colors.text }]}>Get in touch with our support team</Text>

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Full Name</Text>
            <TextInput
              style={[styles.input, {
                borderColor: theme.colors.border || '#ccc',
                backgroundColor: theme.colors.card || '#fff',
                color: theme.colors.text
              }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={theme.colors.text + '80'}
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>Email</Text>
            <TextInput
              style={[styles.input, {
                borderColor: theme.colors.border || '#ccc',
                backgroundColor: theme.colors.card || '#fff',
                color: theme.colors.text
              }]}
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter your email"
              placeholderTextColor={theme.colors.text + '80'}
              editable={false}
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>Message</Text>
            <TextInput
              style={[styles.textArea, {
                borderColor: theme.colors.border || '#ccc',
                backgroundColor: theme.colors.card || '#fff',
                color: theme.colors.text
              }]}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              placeholder="How can we help you?"
              placeholderTextColor={theme.colors.text + '80'}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, {
                backgroundColor: theme.colors.primary || '#007AFF',
                opacity: isLoading ? 0.7 : 1
              }]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Send Message</Text>
              )}
            </TouchableOpacity>
          </View>
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
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 120,
  },
  submitButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});