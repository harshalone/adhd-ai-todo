import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Sun, Moon, Smartphone, ChevronRight, User, Globe, MessageCircle, Trash2, FileText, Shield, LogOut } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import useAuthStore from '../stores/authStore';
import useSettingsStore from '../stores/settingsStore';

export default function SettingsScreen({ navigation }) {
  const { theme, themeMode } = useTheme();
  const { logout } = useAuthStore();
  const { country } = useSettingsStore();

  const navigateToTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Theme');
  };

  const navigateToProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Profile');
  };

  const navigateToCountry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Country');
  };

  const navigateToContactUs = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ContactUs');
  };

  const navigateToDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate('DeleteAccount');
  };

  const navigateToTerms = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Terms');
  };

  const navigateToPrivacy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Privacy');
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light':
        return <Sun size={20} color={theme.colors.text} />;
      case 'dark':
        return <Moon size={20} color={theme.colors.text} />;
      default:
        return <Smartphone size={20} color={theme.colors.text} />;
    }
  };

  const getThemeText = () => {
    switch (themeMode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'Automatic';
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>

        <View style={styles.settingsSection}>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={navigateToProfile}
          >
            <View style={styles.settingLeft}>
              <User size={20} color={theme.colors.text} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Profile</Text>
            </View>
            <ChevronRight size={33} color={theme.colors.text} style={styles.chevron} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={navigateToTheme}
          >
            <View style={styles.settingLeft}>
              {getThemeIcon()}
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Appearance</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: theme.colors.text }]}>{getThemeText()}</Text>
              <ChevronRight size={33} color={theme.colors.text} style={styles.chevron} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={navigateToCountry}
          >
            <View style={styles.settingLeft}>
              <Globe size={20} color={theme.colors.text} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Country</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: theme.colors.text }]}>{country?.code || 'US'}</Text>
              <ChevronRight size={33} color={theme.colors.text} style={styles.chevron} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={navigateToContactUs}
          >
            <View style={styles.settingLeft}>
              <MessageCircle size={20} color={theme.colors.text} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Contact Us</Text>
            </View>
            <ChevronRight size={33} color={theme.colors.text} style={styles.chevron} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={navigateToTerms}
          >
            <View style={styles.settingLeft}>
              <FileText size={20} color={theme.colors.text} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Terms and Services</Text>
            </View>
            <ChevronRight size={33} color={theme.colors.text} style={styles.chevron} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={navigateToPrivacy}
          >
            <View style={styles.settingLeft}>
              <Shield size={20} color={theme.colors.text} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Privacy Policy</Text>
            </View>
            <ChevronRight size={33} color={theme.colors.text} style={styles.chevron} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={handleLogout}
          >
            <View style={styles.settingLeft}>
              <LogOut size={20} color={theme.colors.text} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Logout</Text>
            </View>
            <ChevronRight size={33} color={theme.colors.text} style={styles.chevron} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={navigateToDeleteAccount}
          >
            <View style={styles.settingLeft}>
              <Trash2 size={20} color="#FF3B30" />
              <Text style={[styles.settingLabel, { color: '#FF3B30' }]}>Delete Account</Text>
            </View>
            <View style={styles.settingRight}>
              <ChevronRight size={33} color="#FF3B30" style={styles.chevron} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 24,
  },
  settingsSection: {
    width: '100%',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 16,
    opacity: 0.7,
    marginRight: 8,
  },
  chevron: {
    opacity: 0.5,
    marginRight: -12,
  },
});