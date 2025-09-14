import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sun, Moon, Smartphone, Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import useSettingsStore from '../../stores/settingsStore';
import BackButton from '../../components/BackButton';

export default function ThemeScreen({ navigation }) {
  const { theme } = useTheme();
  const { themeMode, setThemeMode } = useSettingsStore();

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
});