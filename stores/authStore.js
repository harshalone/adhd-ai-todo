import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authHelpers, supabase } from '../utils/supabase';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Auth state
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: false,
      hasCompletedOnboarding: false,

      // Actions
      setLoading: (loading) => set({ loading }),

      setAuthenticated: (user, tokens) => {
        set({
          isAuthenticated: true,
          user,
          accessToken: tokens?.access_token || tokens?.accessToken,
          refreshToken: tokens?.refresh_token || tokens?.refreshToken,
          loading: false,
        });

        // Load user settings including country from database
        if (user?.id) {
          // Import settings store dynamically to avoid circular dependency
          import('../stores/settingsStore').then(({ default: useSettingsStore }) => {
            const { loadUserCountry } = useSettingsStore.getState();
            loadUserCountry(user.id);
          });
        }
      },

      completeOnboarding: () =>
        set({
          hasCompletedOnboarding: true,
        }),

      resetOnboarding: () =>
        set({
          hasCompletedOnboarding: false,
        }),

      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData }
        })),

      setTokens: (tokens) =>
        set({
          accessToken: tokens?.access_token || tokens?.accessToken,
          refreshToken: tokens?.refresh_token || tokens?.refreshToken,
        }),

      clearAuth: () =>
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          loading: false,
        }),

      logout: async () => {
        try {
          set({ loading: true });

          // Call Supabase signOut method
          const { error } = await authHelpers.signOut();

          if (error) {
            console.error('Logout error:', error);
          }

          // Clear auth state regardless of Supabase response
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            loading: false,
          });
        } catch (error) {
          console.error('Logout error:', error);
          // Still clear auth state even if logout fails
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            loading: false,
          });
        }
      },

      // Check if user has valid session
      checkAuthStatus: async () => {
        try {
          set({ loading: true });
          const state = get();

          // If we have stored tokens, try to restore the session first
          if (state.accessToken && state.refreshToken) {
            console.log('Found stored tokens, attempting to restore session...');
            const { data: sessionData, error: sessionError } = await authHelpers.setSession(
              state.accessToken,
              state.refreshToken
            );

            if (sessionData?.session && !sessionError) {
              console.log('Session restored successfully');
              set({
                loading: false,
                isAuthenticated: true,
                user: sessionData.session.user,
                accessToken: sessionData.session.access_token,
                refreshToken: sessionData.session.refresh_token,
              });

              // Load user settings including country from database
              if (sessionData.session.user?.id) {
                import('../stores/settingsStore').then(({ default: useSettingsStore }) => {
                  const { loadUserCountry } = useSettingsStore.getState();
                  loadUserCountry(sessionData.session.user.id);
                });
              }

              return true;
            } else {
              console.log('Failed to restore session, checking current session...');
            }
          }

          // Check current session with Supabase
          const { data, error } = await authHelpers.getSession();

          if (error || !data?.session) {
            // No valid session, clear stored data
            console.log('No valid session found, clearing auth state');
            set({
              loading: false,
              isAuthenticated: false,
              user: null,
              accessToken: null,
              refreshToken: null,
            });
            return false;
          }

          // Valid session found, update state
          console.log('Valid session found');
          set({
            loading: false,
            isAuthenticated: true,
            user: data.session.user,
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
          });

          // Load user settings including country from database
          if (data.session.user?.id) {
            import('../stores/settingsStore').then(({ default: useSettingsStore }) => {
              const { loadUserCountry } = useSettingsStore.getState();
              loadUserCountry(data.session.user.id);
            });
          }

          return true;
        } catch (error) {
          console.error('Auth check error:', error);
          set({
            loading: false,
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
          });
          return false;
        }
      },

      // Initialize auth on app startup
      initializeAuth: async () => {
        try {
          console.log('Initializing auth...');
          set({ loading: true });

          // Set up auth state listener
          supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);

            if (event === 'SIGNED_IN' && session) {
              console.log('User signed in via auth listener');
              set({
                isAuthenticated: true,
                user: session.user,
                accessToken: session.access_token,
                refreshToken: session.refresh_token,
                loading: false,
              });

              // Load user settings including country from database
              if (session.user?.id) {
                import('../stores/settingsStore').then(({ default: useSettingsStore }) => {
                  const { loadUserCountry } = useSettingsStore.getState();
                  loadUserCountry(session.user.id);
                });
              }
            } else if (event === 'SIGNED_OUT' || !session) {
              console.log('User signed out via auth listener');
              set({
                isAuthenticated: false,
                user: null,
                accessToken: null,
                refreshToken: null,
                loading: false,
                  });
            } else if (event === 'TOKEN_REFRESHED' && session) {
              console.log('Token refreshed via auth listener');
              set({
                accessToken: session.access_token,
                refreshToken: session.refresh_token,
              });
            }
          });

          const { checkAuthStatus } = get();

          // Check if user has a valid session
          const hasValidSession = await checkAuthStatus();

          if (hasValidSession) {
            console.log('User authenticated successfully on app startup');
          } else {
            console.log('No valid session found, user needs to log in');
          }

          set({ loading: false });
        } catch (error) {
          console.error('Initialize auth error:', error);
          set({
            loading: false,
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
          });
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);

export default useAuthStore;