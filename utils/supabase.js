import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Replace with your Supabase project URL and anon key
// For development/testing, using placeholder values that won't cause errors
const supabaseUrl = 'https://wggiqxnxuyienczdpmlv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZ2lxeG54dXlpZW5jemRwbWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NTA5NjYsImV4cCI6MjA1MzIyNjk2Nn0.HQG38G7RBQ0En4saTB_v8hIY7L03Y0GpyTpO0Mp-9no';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable auto-refresh and session persistence for better UX
    autoRefreshToken: true,
    persistSession: true, // Allow Supabase to persist sessions
    detectSessionInUrl: false,
    storage: {
      // Use AsyncStorage for persistence
      getItem: async (key) => {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        return AsyncStorage.getItem(key);
      },
      setItem: async (key, value) => {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        return AsyncStorage.setItem(key, value);
      },
      removeItem: async (key) => {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        return AsyncStorage.removeItem(key);
      },
    },
  },
});

// Check if Supabase is properly configured
const isConfigured = () => {
  return supabaseUrl !== 'https://your-project.supabase.co' &&
         supabaseAnonKey !== 'your-anon-key-here';
};

// Auth helper functions
export const authHelpers = {
  // Send OTP to email
  async sendOTP(email, isRegistration = false) {
    try {
      if (!isConfigured()) {
        throw new Error('Supabase is not configured. Please update your credentials in utils/supabase.js');
      }

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: isRegistration,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Send OTP error:', error);
      return { data: null, error };
    }
  },

  // Verify OTP
  async verifyOTP(email, token) {
    try {
      if (!isConfigured()) {
        throw new Error('Supabase is not configured. Please update your credentials in utils/supabase.js');
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { data: null, error };
    }
  },

  // Get current session
  async getSession() {
    try {
      if (!isConfigured()) {
        return { data: null, error: null };
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get session error:', error);
      return { data: null, error };
    }
  },

  // Sign out
  async signOut() {
    try {
      if (!isConfigured()) {
        return { error: null };
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  },

  // Refresh session
  async refreshSession() {
    try {
      if (!isConfigured()) {
        return { data: null, error: null };
      }

      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Refresh session error:', error);
      return { data: null, error };
    }
  },

  // Restore session from stored tokens
  async setSession(accessToken, refreshToken) {
    try {
      if (!isConfigured()) {
        return { data: null, error: null };
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Set session error:', error);
      return { data: null, error };
    }
  },
};