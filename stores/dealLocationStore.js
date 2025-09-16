import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useDealLocationStore = create(
  persist(
    (set, get) => ({
      // Location state
      country: '',
      stateRegion: '',
      city: '',
      hasLocationPreference: false,
      isLoading: false,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),

      setLocation: (country, stateRegion, city) => {
        const hasLocation = !!(country?.trim() && city?.trim());
        set({
          country: country?.trim() || '',
          stateRegion: stateRegion?.trim() || '',
          city: city?.trim() || '',
          hasLocationPreference: hasLocation,
          isLoading: false,
        });
      },

      clearLocation: () =>
        set({
          country: '',
          stateRegion: '',
          city: '',
          hasLocationPreference: false,
          isLoading: false,
        }),

      // Helper to get formatted location string
      getFormattedLocation: () => {
        const state = get();
        if (!state.hasLocationPreference) return '';

        const parts = [state.city];
        if (state.stateRegion) {
          parts.push(state.stateRegion);
        }
        if (state.country) {
          parts.push(state.country);
        }
        return parts.join(', ');
      },

      // Helper to get state/region label based on country
      getStateRegionLabel: () => {
        const state = get();
        if (!state.country) return 'State/Region';

        const countriesWithStates = ['United States', 'USA', 'US', 'Canada', 'Australia', 'India'];
        const isStateCountry = countriesWithStates.some(c =>
          state.country.toLowerCase().includes(c.toLowerCase())
        );

        return isStateCountry ? 'State' : 'Region';
      },
    }),
    {
      name: 'deal-location-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        country: state.country,
        stateRegion: state.stateRegion,
        city: state.city,
        hasLocationPreference: state.hasLocationPreference,
      }),
    }
  )
);

export default useDealLocationStore;