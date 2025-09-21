import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sun, Moon, Smartphone, Check, RotateCcw } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import useSettingsStore from '../../stores/settingsStore';
import useAuthStore from '../../stores/authStore';
import BackButton from '../../components/BackButton';

export default function ThemeScreen({ navigation }) {
  const { theme } = useTheme();
  const { themeMode, setThemeMode } = useSettingsStore();
  const { hasCompletedOnboarding, resetOnboarding } = useAuthStore();

  const themeOptions = [
    {
      id: 'automatic',
      title: 'Automatic',
      subtitle: 'Match system appearance',
      icon: Smartphone,
    },
    {
      id: 'light',
      title: 'Light',
      subtitle: 'Always use light theme',
      icon: Sun,
    },
    {
      id: 'dark',
      title: 'Dark',
      subtitle: 'Always use dark theme',
      icon: Moon,
    },
  ];

  const handleThemeChange = (selectedTheme) => {
    setThemeMode(selectedTheme);
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will reset the onboarding flow. You will see the onboarding screens again the next time you use the app. Do you want to continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetOnboarding();
            Alert.alert(
              'Onboarding Reset',
              'The onboarding flow has been reset. You will see the onboarding screens next time you restart the app.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.title, { color: theme.colors.text }]}>Appearance</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: theme.colors.text }]}>Choose how the app looks</Text>

        <View style={styles.optionsContainer}>
          {themeOptions.map((option) => {
            const IconComponent = option.icon;
            const isSelected = themeMode === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.option,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => handleThemeChange(option.id)}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionLeft}>
                    <IconComponent size={24} color={theme.colors.text} />
                    <View style={styles.optionText}>
                      <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                        {option.title}
                      </Text>
                      <Text style={[styles.optionSubtitle, { color: theme.colors.text }]}>
                        {option.subtitle}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Check size={20} color={theme.colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {hasCompletedOnboarding && (
          <View style={styles.resetSection}>
            <TouchableOpacity
              style={[
                styles.resetButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={handleResetOnboarding}
            >
              <View style={styles.resetContent}>
                <RotateCcw size={20} color={theme.colors.text} />
                <Text style={[styles.resetText, { color: theme.colors.text }]}>
                  Reset Onboarding
                </Text>
              </View>
              <Text style={[styles.resetSubtext, { color: theme.colors.text }]}>
                Go through the welcome flow again
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    borderRadius: 12,
    padding: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: 16,
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  resetSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  resetButton: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  resetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resetText: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 12,
  },
  resetSubtext: {
    fontSize: 14,
    opacity: 0.7,
    marginLeft: 32,
  },
});