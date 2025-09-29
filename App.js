import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AppNavigator from './navigations/AppNavigator';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { appMetadataService } from './services/appMetadataService';
import { todosService } from './services/todosService';
import { notificationService } from './services/notificationService';

function AppContent() {
  const { isDark } = useTheme();
  const appState = useRef(AppState.currentState);
  const lastScheduleTime = useRef(Date.now());

  // Initialize notifications
  const initializeNotifications = async (reason = 'startup') => {
    try {
      console.log(`🔄 Initializing notifications (${reason})...`);

      // In development, be more conservative about re-scheduling
      if (__DEV__ && reason !== 'startup') {
        console.log('🚧 Development mode: Skipping notification re-initialization to avoid spam');
        return;
      }

      // Clean up any outdated notifications first
      await notificationService.validateAndCleanupNotifications();

      // Schedule notifications for all existing todos
      const notificationResult = await todosService.scheduleAllNotifications();
      if (notificationResult.error) {
        console.error('❌ Failed to schedule notifications:', notificationResult.error);
      } else {
        console.log(`✅ Scheduled notifications for ${notificationResult.scheduledCount} todos`);
        lastScheduleTime.current = Date.now();
      }

      // Log debug info in development
      if (__DEV__) {
        await notificationService.getNotificationDebugInfo();
      }
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
    }
  };

  useEffect(() => {
    // Load app metadata and initialize notifications on app start
    const initializeApp = async () => {
      try {
        console.log('📱 Loading app metadata...');
        await appMetadataService.fetchMetadata();
        console.log('✅ App metadata loaded successfully');

        await initializeNotifications('startup');
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      console.log(`📱 App state changed: ${appState.current} -> ${nextAppState}`);

      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App came to foreground');

        // Re-initialize notifications if it's been more than 30 minutes since last schedule
        const timeSinceLastSchedule = Date.now() - lastScheduleTime.current;
        if (timeSinceLastSchedule > 30 * 60 * 1000) { // 30 minutes
          console.log('⏰ Re-initializing notifications due to time gap');
          await initializeNotifications('foreground');
        } else {
          console.log(`⏭️ Skipping notification re-initialization (only ${Math.round(timeSinceLastSchedule / 60000)} minutes since last schedule)`);
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription?.remove();
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
