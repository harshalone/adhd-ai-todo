import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { revenueCatService } from '../services/revenueCatService';

const useSubscriptionStore = create(
  persist(
    (set, get) => ({
      // Subscription state
      isSubscribed: false,
      subscriptionInfo: null,
      customerInfo: null,
      offerings: null,
      loading: false,
      initialized: false,
      lastChecked: null, // Timestamp of last check

      // Actions
      setLoading: (loading) => set({ loading }),

      // Initialize RevenueCat (called lazily when needed)
      initializeIfNeeded: async () => {
        const state = get();

        // Skip if already initialized
        if (state.initialized) {
          console.log('📊 RevenueCat already initialized');
          return true;
        }

        try {
          console.log('🏪 Lazy initializing RevenueCat...');
          set({ loading: true });

          const initialized = await revenueCatService.initialize();

          if (!initialized) {
            console.log('⚠️ RevenueCat initialization failed');
            set({ loading: false, initialized: false });
            return false;
          }

          // Get initial subscription status
          const customerInfo = revenueCatService.getCustomerInfo();
          const isSubscribed = revenueCatService.isSubscribed();
          const subscriptionInfo = revenueCatService.getFormattedSubscriptionInfo();

          set({
            initialized: true,
            isSubscribed,
            subscriptionInfo,
            customerInfo,
            loading: false,
            lastChecked: Date.now(),
          });

          console.log('✅ RevenueCat lazy initialized successfully');
          return true;
        } catch (error) {
          console.error('❌ Failed to initialize RevenueCat:', error);
          set({ loading: false, initialized: false });
          return false;
        }
      },

      // Check subscription status (lazy load + cache)
      checkSubscription: async (forceRefresh = false) => {
        const state = get();

        // Use cache if available and not forcing refresh
        if (!forceRefresh && state.lastChecked) {
          const cacheAge = Date.now() - state.lastChecked;
          const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

          if (cacheAge < CACHE_DURATION) {
            console.log('📊 Using cached subscription status');
            return state.isSubscribed;
          }
        }

        try {
          console.log('🔄 Checking subscription status...');
          set({ loading: true });

          // Ensure RevenueCat is initialized
          await get().initializeIfNeeded();

          // Refresh customer info
          const customerInfo = await revenueCatService.refreshCustomerInfo();

          if (!customerInfo) {
            set({ loading: false });
            return state.isSubscribed; // Return cached value
          }

          const isSubscribed = revenueCatService.isSubscribed();
          const subscriptionInfo = revenueCatService.getFormattedSubscriptionInfo();

          set({
            isSubscribed,
            subscriptionInfo,
            customerInfo,
            loading: false,
            lastChecked: Date.now(),
          });

          console.log('✅ Subscription status checked:', isSubscribed);
          return isSubscribed;
        } catch (error) {
          console.error('❌ Failed to check subscription:', error);
          set({ loading: false });
          return state.isSubscribed; // Return cached value on error
        }
      },

      // Load offerings (lazy)
      loadOfferings: async () => {
        const state = get();

        // Return cached offerings if available
        if (state.offerings) {
          console.log('📦 Using cached offerings');
          return state.offerings;
        }

        try {
          console.log('🛍️ Loading offerings...');

          // Ensure RevenueCat is initialized
          await get().initializeIfNeeded();

          const offerings = await revenueCatService.loadOfferings();
          set({ offerings });

          console.log('✅ Offerings loaded');
          return offerings;
        } catch (error) {
          console.error('❌ Failed to load offerings:', error);
          return null;
        }
      },

      // Purchase a package
      purchasePackage: async (packageToPurchase) => {
        try {
          console.log('💳 Purchasing package...');
          set({ loading: true });

          const result = await revenueCatService.purchasePackage(packageToPurchase);

          if (result.success) {
            const isSubscribed = revenueCatService.isSubscribed();
            const subscriptionInfo = revenueCatService.getFormattedSubscriptionInfo();

            set({
              isSubscribed,
              subscriptionInfo,
              customerInfo: result.customerInfo,
              loading: false,
              lastChecked: Date.now(),
            });

            console.log('✅ Purchase successful');
          } else {
            set({ loading: false });
          }

          return result;
        } catch (error) {
          console.error('❌ Purchase failed:', error);
          set({ loading: false });
          return { success: false, error: error.message };
        }
      },

      // Restore purchases
      restorePurchases: async () => {
        try {
          console.log('🔄 Restoring purchases...');
          set({ loading: true });

          const result = await revenueCatService.restorePurchases();

          if (result.success) {
            const isSubscribed = revenueCatService.isSubscribed();
            const subscriptionInfo = revenueCatService.getFormattedSubscriptionInfo();

            set({
              isSubscribed,
              subscriptionInfo,
              customerInfo: result.customerInfo,
              loading: false,
              lastChecked: Date.now(),
            });

            console.log('✅ Restore successful');
          } else {
            set({ loading: false });
          }

          return result;
        } catch (error) {
          console.error('❌ Restore failed:', error);
          set({ loading: false });
          return { success: false, error: error.message };
        }
      },

      // Check if user has specific entitlement (uses cache)
      hasEntitlement: (entitlementId) => {
        const state = get();
        if (!state.customerInfo) return false;
        return revenueCatService.hasEntitlement(entitlementId);
      },

      // Clear cache and reset
      clearCache: () => {
        set({
          isSubscribed: false,
          subscriptionInfo: null,
          customerInfo: null,
          offerings: null,
          loading: false,
          initialized: false,
          lastChecked: null,
        });
      },
    }),
    {
      name: 'subscription-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist subscription status, not the full objects
        isSubscribed: state.isSubscribed,
        lastChecked: state.lastChecked,
      }),
    }
  )
);

export default useSubscriptionStore;
