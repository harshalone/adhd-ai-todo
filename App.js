import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import AppNavigator from './navigations/AppNavigator';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { appMetadataService } from './services/appMetadataService';
import { todosService } from './services/todosService';
import { notificationService } from './services/notificationService';
import { revenueCatService } from './services/revenueCatService';
import Purchases from 'react-native-purchases';
import { REVENUECAT_PUBLIC_API_KEY } from './utils/constants';

// Configure RevenueCat IMMEDIATELY when app loads (before any component mounts)
// This must run synchronously at module load time
let revenueCatConfigured = false;

const configureRevenueCatSync = async () => {
  if (revenueCatConfigured) {
    console.log('🏪 Revenue Cat already configured');
    return;
  }

  try {
    console.log('🏪 Starting Revenue Cat configuration...');

    // Try to get keys from database
    await appMetadataService.fetchMetadata();
    const metadata = await appMetadataService.getMetadata();

    console.log('📊 Metadata loaded:', {
      hasPublicKey: !!metadata?.revenue_cat_public_api_key,
      platform: Platform.OS,
      metadataKeys: metadata ? Object.keys(metadata) : []
    });

    if (__DEV__) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }

    // Use the public API key (works for both iOS and Android)
    const apiKey = (metadata?.revenue_cat_public_api_key || REVENUECAT_PUBLIC_API_KEY)?.trim();

    if (!apiKey || apiKey.length === 0) {
      console.warn('⚠️ No Revenue Cat public API key found in database or constants');
      console.error('❌ Revenue Cat NOT configured - no API key available');
      return;
    }

    console.log('🔑 Configuring Revenue Cat:');
    console.log(`   Platform: ${Platform.OS}`);
    console.log(`   Key: ${apiKey}`);
    console.log(`   Key length: ${apiKey.length}`);
    console.log(`   Key starts with: ${apiKey.substring(0, 10)}...`);

    try {
      Purchases.configure({ apiKey });
      console.log(`\n✅✅✅ SUCCESS! Revenue Cat configured for ${Platform.OS}`);
      console.log(`✅ Using public API key\n`);
      revenueCatConfigured = true;

      // Mark the service as configured so it knows SDK is ready
      revenueCatService.markAsConfigured();
    } catch (configError) {
      // In Expo Go, RevenueCat may throw an error but still work in Browser Mode
      const isExpoGo = __DEV__ && configError.message.includes('Invalid API key');

      if (isExpoGo) {
        console.warn('⚠️ RevenueCat configuration error (expected in Expo Go Browser Mode)');
        console.log('✅ Continuing - RevenueCat will work in Browser Mode\n');
        revenueCatConfigured = true;

        // Mark as configured even in Expo Go Browser Mode
        revenueCatService.markAsConfigured();
      } else {
        console.error('❌ Error configuring Revenue Cat:', configError.message);
        console.error('❌ Revenue Cat NOT configured');
      }
    }
  } catch (error) {
    console.error('❌ Failed to configure Revenue Cat:', error);
  }
};

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
    const initializeApp = async () => {
      try {
        // Configure RevenueCat first (before context tries to use it)
        await configureRevenueCatSync();

        // Initialize notifications
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
  const [isRevenueCatReady, setIsRevenueCatReady] = useState(false);

  useEffect(() => {
    // Configure RevenueCat before rendering SubscriptionProvider
    const init = async () => {
      await configureRevenueCatSync();
      setIsRevenueCatReady(true);
    };
    init();
  }, []);

  // Wait for RevenueCat to be configured before rendering SubscriptionProvider
  if (!isRevenueCatReady) {
    return null; // Or a loading screen
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SubscriptionProvider>
          <AppContent />
        </SubscriptionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
