import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useSettingsStore = create(
  persist(
    (set, get) => ({
      // Theme settings
      themeMode: 'automatic', // 'light', 'dark', 'automatic'

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
        themeMode: 'automatic',
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