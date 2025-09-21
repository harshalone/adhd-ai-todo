import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AppNavigator from './navigations/AppNavigator';
import { useEffect } from 'react';
import { appMetadataService } from './services/appMetadataService';

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    // Load app metadata on app start
    const loadMetadata = async () => {
      try {
        console.log('Loading app metadata...');
        await appMetadataService.fetchMetadata();
        console.log('App metadata loaded successfully');
      } catch (error) {
        console.error('Failed to load app metadata:', error);
      }
    };

    loadMetadata();
  }, []);

  return (
    <>
      <AppNavigator />
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
