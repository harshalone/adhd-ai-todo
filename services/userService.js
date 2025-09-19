import { supabase } from '../utils/supabase';

export const userService = {
  // Update user profile information in accounts table
  async updateUserProfile(userId, profileData) {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update(profileData)
        .eq('id', userId)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update user profile error:', error);
      return { data: null, error };
    }
  },

  // Update user's country
  async updateUserCountry(userId, countryName, countryCode) {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update({
          country: countryName,
          country_code: countryCode
        })
        .eq('id', userId)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update user country error:', error);
      return { data: null, error };
    }
  },

  // Get user profile from accounts table
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { data: null, error };
    }
  },

  // Create or update user account entry
  async upsertUserAccount(userId, accountData) {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .upsert({
          id: userId,
          ...accountData,
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Upsert user account error:', error);
      return { data: null, error };
    }
  }
};