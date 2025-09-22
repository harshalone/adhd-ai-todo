import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AppNavigator from './navigations/AppNavigator';
import { useEffect } from 'react';
import { appMetadataService } from './services/appMetadataService';
import { todosService } from './services/todosService';

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    // Load app metadata and initialize notifications on app start
    const initializeApp = async () => {
      try {
        console.log('Loading app metadata...');
        await appMetadataService.fetchMetadata();
        console.log('App metadata loaded successfully');

        // Schedule notifications for all existing todos
        console.log('Scheduling notifications for existing todos...');
        const notificationResult = await todosService.scheduleAllNotifications();
        if (notificationResult.error) {
          console.error('Failed to schedule notifications:', notificationResult.error);
        } else {
          console.log(`Scheduled notifications for ${notificationResult.scheduledCount} todos`);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
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
