import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useShoppingStore = create(
  persist(
    (set, get) => ({
      // Shopping preferences state
      sortOption: 'default',
      lastOpenedList: null,

      // Actions
      setSortOption: (option) => {
        console.log('ShoppingStore: Setting sort option to:', option);
        set({ sortOption: option });
      },

      getSortOption: () => {
        const state = get();
        return state.sortOption;
      },

      setLastOpenedList: (listData) => {
        console.log('ShoppingStore: Setting last opened list:', listData);
        set({
          lastOpenedList: {
            listId: listData.listId,
            listName: listData.listName,
            timestamp: new Date().toISOString()
          }
        });
      },

      getLastOpenedList: () => {
        const state = get();
        return state.lastOpenedList;
      },

      clearLastOpenedList: () => {
        console.log('ShoppingStore: Clearing last opened list');
        set({ lastOpenedList: null });
      },

      // Check if the last opened list is still recent (within 7 days)
      isLastOpenedListRecent: () => {
        const state = get();
        if (!state.lastOpenedList?.timestamp) return false;

        const lastOpened = new Date(state.lastOpenedList.timestamp);
        const now = new Date();
        const daysDifference = (now - lastOpened) / (1000 * 60 * 60 * 24);

        return daysDifference <= 7; // Consider recent if within 7 days
      },

      // Reset all shopping preferences
      resetShoppingPreferences: () => {
        console.log('ShoppingStore: Resetting all shopping preferences');
        set({
          sortOption: 'default',
          lastOpenedList: null
        });
      },
    }),
    {
      name: 'shopping-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sortOption: state.sortOption,
        lastOpenedList: state.lastOpenedList,
      }),
    }
  )
);

export default useShoppingStore;