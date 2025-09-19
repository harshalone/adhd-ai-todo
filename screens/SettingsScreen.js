import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Sun, Moon, Smartphone, ChevronRight, User, Globe, MessageCircle, Trash2, FileText, Shield, LogOut, Share as ShareIcon } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import useAuthStore from '../stores/authStore';
import useSettingsStore from '../stores/settingsStore';
import { APP_STORE_URL } from '../utils/constants';

export default function SettingsScreen({ navigation }) {
  const { theme, themeMode } = useTheme();
  const { logout } = useAuthStore();
  const { country } = useSettingsStore();
  const [showShareModal, setShowShareModal] = useState(false);

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

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowShareModal(true);
  };


  const shareApp = async () => {
    try {
      const result = await Share.share({
        message: `Check out this awesome loyalty card app!\n\nDownload: ${APP_STORE_URL}`,
        title: 'Stocard - Digital Loyalty Cards'
      });

      if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share the app');
    }
  };

  const copyAppUrl = async () => {
    try {
      await Clipboard.setStringAsync(APP_STORE_URL);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Copied!', 'App store URL copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy URL');
    }
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            onPress={handleShare}
          >
            <View style={styles.settingLeft}>
              <ShareIcon size={20} color={theme.colors.text} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Share</Text>
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
      </ScrollView>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <TouchableOpacity
          style={styles.shareOverlay}
          activeOpacity={1}
          onPress={() => setShowShareModal(false)}
        >
          <TouchableOpacity
            style={[styles.shareContent, { backgroundColor: theme.colors.background }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.shareHeader}>
              <TouchableOpacity
                style={styles.shareCloseButton}
                onPress={() => setShowShareModal(false)}
              >
                <Text style={[styles.shareCloseText, { color: theme.colors.text }]}>Close</Text>
              </TouchableOpacity>
              <Text style={[styles.shareTitle, { color: theme.colors.text }]}>Share App</Text>
              <View style={styles.shareHeaderSpacer} />
            </View>

            {/* Description */}
            <Text style={[styles.shareDescription, { color: theme.colors.text }]}>
              Share this app with friends and family
            </Text>

            {/* App URL Container */}
            <View style={styles.shareInfoSection}>
              <Text style={[styles.shareInfoLabel, { color: theme.colors.textSecondary }]}>
                App Store URL:
              </Text>
              <View style={[styles.shareInfoContainer, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }]}>
                <Text style={[styles.shareInfoText, { color: theme.colors.text }]} numberOfLines={2}>
                  {APP_STORE_URL}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.shareButtons}>
              <TouchableOpacity
                style={[styles.shareButton, styles.copyButton, {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                }]}
                onPress={copyAppUrl}
              >
                <Text style={[styles.shareButtonText, { color: theme.colors.text }]}>Copy URL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shareButton, styles.shareActionButton, {
                  backgroundColor: theme.colors.primary,
                }]}
                onPress={shareApp}
              >
                <Text style={[styles.shareButtonText, { color: '#fff' }]}>Share</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
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
  // Share Modal Styles
  shareOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  shareContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 300,
  },
  shareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 24,
  },
  shareCloseButton: {
    width: 60,
  },
  shareCloseText: {
    fontSize: 16,
    fontWeight: '500',
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  shareHeaderSpacer: {
    width: 60,
  },
  shareDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  shareInfoSection: {
    marginBottom: 32,
  },
  shareInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  shareInfoContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  shareInfoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  copyButton: {
    borderWidth: 1,
  },
  shareActionButton: {
    // Primary button styles already applied via backgroundColor
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});