import { useState, useEffect } from 'react';
import { Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { supabase } from '../utils/supabase';
import { APP_DB_ID, APP_CURRENT_VERSION, APP_STORE_URL } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';

export default function CheckVersion() {
  const { theme } = useTheme();
  const [currentVersion, setCurrentVersion] = useState('');
  const [isLatest, setIsLatest] = useState(true);

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      // Use the current app version from constants
      const appVersion = APP_CURRENT_VERSION;
      setCurrentVersion(appVersion);

      // Fetch latest version from Supabase
      const { data, error } = await supabase
        .from('app_meta_data')
        .select('version')
        .eq('app_id', APP_DB_ID)
        .single();

      if (error) {
        console.warn('Could not fetch version from database:', error);
        return;
      }

      if (data && data.version) {
        // Compare versions
        const latestVersion = data.version;
        const isCurrentLatest = compareVersions(appVersion, latestVersion) >= 0;
        setIsLatest(isCurrentLatest);
      }
    } catch (error) {
      console.warn('Error checking version:', error);
    }
  };

  // Simple version comparison function
  const compareVersions = (current, latest) => {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;

      if (currentPart > latestPart) return 1;
      if (currentPart < latestPart) return -1;
    }

    return 0;
  };

  const handleUpdatePress = () => {
    Linking.openURL(APP_STORE_URL);
  };

  if (!currentVersion) return null;

  return (
    <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
      v{currentVersion}
      {!isLatest && (
        <TouchableOpacity onPress={handleUpdatePress} style={styles.updateButton}>
          <Text style={[styles.updateText, { color: theme.colors.primary }]}>
            {' (update available)'}
          </Text>
        </TouchableOpacity>
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  versionText: {
    fontSize: 10,
    fontWeight: '400',
    opacity: 0.7,
  },
  updateButton: {
    display: 'inline',
  },
  updateText: {
    fontSize: 10,
    fontWeight: '400',
  },
});