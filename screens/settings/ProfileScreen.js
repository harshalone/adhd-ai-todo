import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import useSettingsStore from '../../stores/settingsStore';
import useAuthStore from '../../stores/authStore';
import BackButton from '../../components/BackButton';
import TimePicker from '../../components/TimePicker';
import { Clock } from 'lucide-react-native';

export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const { profile, updateProfile } = useSettingsStore();
  const { user } = useAuthStore();

  const [firstName, setFirstName] = useState(profile.firstName || '');
  const [lastName, setLastName] = useState(profile.lastName || '');
  const [email, setEmail] = useState('');
  const [wakeUpTime, setWakeUpTime] = useState(profile.wakeUpTime ? new Date(profile.wakeUpTime) : null);
  const [breakfastTime, setBreakfastTime] = useState(profile.breakfastTime ? new Date(profile.breakfastTime) : null);
  const [skipBreakfast, setSkipBreakfast] = useState(profile.skipBreakfast || false);
  const [lunchTime, setLunchTime] = useState(profile.lunchTime ? new Date(profile.lunchTime) : null);
  const [skipLunch, setSkipLunch] = useState(profile.skipLunch || false);
  const [dinnerTime, setDinnerTime] = useState(profile.dinnerTime ? new Date(profile.dinnerTime) : null);
  const [skipDinner, setSkipDinner] = useState(profile.skipDinner || false);
  const [bedTime, setBedTime] = useState(profile.bedTime ? new Date(profile.bedTime) : null);
  const [gymTime, setGymTime] = useState(profile.gymTime ? new Date(profile.gymTime) : null);
  const [skipGym, setSkipGym] = useState(profile.skipGym || false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState(null);

  useEffect(() => {
    // Set email from Supabase user or fallback to profile email
    const userEmail = user?.email || profile.email || '';
    setEmail(userEmail);
  }, [user, profile.email]);

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter both first name and last name');
      return;
    }

    updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email,
      wakeUpTime: wakeUpTime?.toISOString(),
      breakfastTime: breakfastTime?.toISOString(),
      skipBreakfast,
      lunchTime: lunchTime?.toISOString(),
      skipLunch,
      dinnerTime: dinnerTime?.toISOString(),
      skipDinner,
      bedTime: bedTime?.toISOString(),
      gymTime: gymTime?.toISOString(),
      skipGym,
    });

    Alert.alert('Success', 'Profile updated successfully!');
  };

  const openTimePicker = (field) => {
    setActiveTimeField(field);
    setShowTimePicker(true);
  };

  const handleTimeConfirm = (time) => {
    switch (activeTimeField) {
      case 'wakeUp':
        setWakeUpTime(time);
        break;
      case 'breakfast':
        setBreakfastTime(time);
        break;
      case 'lunch':
        setLunchTime(time);
        break;
      case 'dinner':
        setDinnerTime(time);
        break;
      case 'bed':
        setBedTime(time);
        break;
      case 'gym':
        setGymTime(time);
        break;
    }
    setShowTimePicker(false);
  };

  const formatTime = (time) => {
    if (!time) return 'Set time';
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.title, { color: theme.colors.text }]}>Profile</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.subtitle, { color: theme.colors.text }]}>Manage your profile information</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>First Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }
              ]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor={theme.colors.text + '60'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Last Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }
              ]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor={theme.colors.text + '60'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                styles.disabledInput,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  opacity: 0.6,
                }
              ]}
              value={email}
              editable={false}
              placeholder="Enter email address"
              placeholderTextColor={theme.colors.text + '60'}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Daily Schedule</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Wake Up Time</Text>
              <TouchableOpacity
                style={[
                  styles.timeButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => openTimePicker('wakeUp')}
              >
                <Clock size={20} color={theme.colors.primary} />
                <Text style={[styles.timeText, {
                  color: wakeUpTime ? theme.colors.text : theme.colors.text + '60'
                }]}>
                  {formatTime(wakeUpTime)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Breakfast Time</Text>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => setSkipBreakfast(!skipBreakfast)}
                >
                  <Text style={[styles.skipButtonText, {
                    color: skipBreakfast ? theme.colors.primary : theme.colors.text + '80'
                  }]}>
                    {skipBreakfast ? 'Skipping' : 'Skip?'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[
                  styles.timeButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    opacity: skipBreakfast ? 0.5 : 1,
                  }
                ]}
                onPress={() => !skipBreakfast && openTimePicker('breakfast')}
                disabled={skipBreakfast}
              >
                <Clock size={20} color={theme.colors.primary} />
                <Text style={[styles.timeText, {
                  color: breakfastTime ? theme.colors.text : theme.colors.text + '60'
                }]}>
                  {formatTime(breakfastTime)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Lunch Time</Text>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => setSkipLunch(!skipLunch)}
                >
                  <Text style={[styles.skipButtonText, {
                    color: skipLunch ? theme.colors.primary : theme.colors.text + '80'
                  }]}>
                    {skipLunch ? 'Skipping' : 'Skip?'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[
                  styles.timeButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    opacity: skipLunch ? 0.5 : 1,
                  }
                ]}
                onPress={() => !skipLunch && openTimePicker('lunch')}
                disabled={skipLunch}
              >
                <Clock size={20} color={theme.colors.primary} />
                <Text style={[styles.timeText, {
                  color: lunchTime ? theme.colors.text : theme.colors.text + '60'
                }]}>
                  {formatTime(lunchTime)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Dinner Time</Text>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => setSkipDinner(!skipDinner)}
                >
                  <Text style={[styles.skipButtonText, {
                    color: skipDinner ? theme.colors.primary : theme.colors.text + '80'
                  }]}>
                    {skipDinner ? 'Skipping' : 'Skip?'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[
                  styles.timeButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    opacity: skipDinner ? 0.5 : 1,
                  }
                ]}
                onPress={() => !skipDinner && openTimePicker('dinner')}
                disabled={skipDinner}
              >
                <Clock size={20} color={theme.colors.primary} />
                <Text style={[styles.timeText, {
                  color: dinnerTime ? theme.colors.text : theme.colors.text + '60'
                }]}>
                  {formatTime(dinnerTime)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Bed Time</Text>
              <TouchableOpacity
                style={[
                  styles.timeButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => openTimePicker('bed')}
              >
                <Clock size={20} color={theme.colors.primary} />
                <Text style={[styles.timeText, {
                  color: bedTime ? theme.colors.text : theme.colors.text + '60'
                }]}>
                  {formatTime(bedTime)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Gym Time</Text>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => setSkipGym(!skipGym)}
                >
                  <Text style={[styles.skipButtonText, {
                    color: skipGym ? theme.colors.primary : theme.colors.text + '80'
                  }]}>
                    {skipGym ? 'Not Going' : 'Skip?'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[
                  styles.timeButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    opacity: skipGym ? 0.5 : 1,
                  }
                ]}
                onPress={() => !skipGym && openTimePicker('gym')}
                disabled={skipGym}
              >
                <Clock size={20} color={theme.colors.primary} />
                <Text style={[styles.timeText, {
                  color: gymTime ? theme.colors.text : theme.colors.text + '60'
                }]}>
                  {formatTime(gymTime)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TimePicker
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onConfirm={handleTimeConfirm}
        initialTime={activeTimeField === 'wakeUp' ? wakeUpTime :
                     activeTimeField === 'breakfast' ? breakfastTime :
                     activeTimeField === 'lunch' ? lunchTime :
                     activeTimeField === 'dinner' ? dinnerTime :
                     activeTimeField === 'bed' ? bedTime :
                     activeTimeField === 'gym' ? gymTime : null}
        theme={theme}
      />
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
  },
  scrollContent: {
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
    marginBottom: 32,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  disabledInput: {
    opacity: 0.6,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    gap: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  timeText: {
    fontSize: 16,
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});