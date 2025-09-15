import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useSearchStore = create(
  persist(
    (set, get) => ({
      // Search state
      searchHistory: [],
      maxHistoryItems: 10,

      // Actions
      addSearchTerm: (term) => {
        const trimmedTerm = term.trim();
        if (!trimmedTerm) return;

        set((state) => {
          // Remove existing instance of this term if it exists
          const filteredHistory = state.searchHistory.filter(
            item => item.toLowerCase() !== trimmedTerm.toLowerCase()
          );

          // Add new term to the beginning of the array
          const newHistory = [trimmedTerm, ...filteredHistory];

          // Keep only the max number of items
          return {
            searchHistory: newHistory.slice(0, state.maxHistoryItems)
          };
        });
      },

      removeSearchTerm: (term) => {
        set((state) => ({
          searchHistory: state.searchHistory.filter(
            item => item.toLowerCase() !== term.toLowerCase()
          )
        }));
      },

      clearSearchHistory: () => {
        set({ searchHistory: [] });
      },

      getRecentSearches: (limit = 5) => {
        const state = get();
        return state.searchHistory.slice(0, limit);
      },
    }),
    {
      name: 'search-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        searchHistory: state.searchHistory,
      }),
    }
  )
);

export default useSearchStore;