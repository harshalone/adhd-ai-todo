import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from '../services/userService';
import { countriesService } from '../services/countriesService';

const useSettingsStore = create(
  persist(
    (set, get) => ({
      // Theme settings
      themeMode: 'light', // 'light', 'dark', 'automatic' - default to light until user changes

      // Profile settings
      profile: {
        firstName: '',
        lastName: '',
        email: 'user@example.com',
        avatar: null,
      },

      // Location settings
      country: {
        name: 'United States',
        code: 'US',
      },

      // Notification settings
      notifications: {
        push: true,
        email: true,
        sms: false,
      },

      // Privacy settings
      privacy: {
        dataSharing: false,
        analytics: true,
        locationTracking: false,
      },

      // App settings
      app: {
        language: 'en',
        currency: 'USD',
        biometricAuth: false,
      },

      // Brightness settings
      brightness: {
        originalBrightness: null,
      },

      // Actions
      setThemeMode: (mode) => set({ themeMode: mode }),

      updateProfile: (profileData) =>
        set((state) => ({
          profile: { ...state.profile, ...profileData }
        })),

      setCountry: (countryData) => set({ country: countryData }),

      // Load user country from database
      loadUserCountry: async (userId) => {
        try {
          const { data: userProfile, error } = await userService.getUserProfile(userId);

          if (error || !userProfile?.country_code) {
            console.log('No country_code found in user profile or error:', error);
            return;
          }

          // Get country details by code
          const { data: countryData, error: countryError } = await countriesService.getCountryByCode(userProfile.country_code);

          if (countryError || !countryData) {
            console.log('Error fetching country details:', countryError);
            return;
          }

          // Update store with country from database
          set({
            country: {
              name: countryData.name,
              code: countryData.country_code,
              country_uid: countryData.country_uid
            }
          });

          console.log('User country loaded from database:', countryData.name);
        } catch (error) {
          console.error('Error loading user country:', error);
        }
      },

      updateNotifications: (notificationSettings) =>
        set((state) => ({
          notifications: { ...state.notifications, ...notificationSettings }
        })),

      updatePrivacy: (privacySettings) =>
        set((state) => ({
          privacy: { ...state.privacy, ...privacySettings }
        })),

      updateApp: (appSettings) =>
        set((state) => ({
          app: { ...state.app, ...appSettings }
        })),

      // Brightness actions
      setOriginalBrightness: (brightness) =>
        set((state) => ({
          brightness: { ...state.brightness, originalBrightness: brightness }
        })),

      getOriginalBrightness: () => get().brightness.originalBrightness,

      // Reset all settings
      resetSettings: () => set({
        themeMode: 'light', // Default to light theme
        profile: { firstName: '', lastName: '', email: 'user@example.com', avatar: null },
        country: { name: 'United States', code: 'US' },
        notifications: { push: true, email: true, sms: false },
        privacy: { dataSharing: false, analytics: true, locationTracking: false },
        app: { language: 'en', currency: 'USD', biometricAuth: false },
        brightness: { originalBrightness: null },
      }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        profile: state.profile,
        country: state.country,
        notifications: state.notifications,
        privacy: state.privacy,
        app: state.app,
        brightness: state.brightness,
      }),
    }
  )
);

export default useSettingsStore;