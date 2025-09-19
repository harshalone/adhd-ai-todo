import { supabase } from '../utils/supabase';

export const countriesService = {
  // Fetch all countries from the database
  async getAllCountries() {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get all countries error:', error);
      return { data: null, error };
    }
  },

  // Search countries by name with case-insensitive matching
  async searchCountries(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Search countries error:', error);
      return { data: null, error };
    }
  },

  // Get country by country code
  async getCountryByCode(countryCode) {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('country_code', countryCode)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get country by code error:', error);
      return { data: null, error };
    }
  },
};