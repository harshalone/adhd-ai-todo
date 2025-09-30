// Development flag
export const IS_DEVELOPMENT = false; // Set to false for production

// Supabase Configuration (Static - Required for app initialization)
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZ2lxeG54dXlpZW5jemRwbWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NTA5NjYsImV4cCI6MjA1MzIyNjk2Nn0.HQG38G7RBQ0En4saTB_v8hIY7L03Y0GpyTpO0Mp-9no';

export const SUPABASE_PROJECT_URL = 'https://wggiqxnxuyienczdpmlv.supabase.co';

// RevenueCat Configuration (Static - Fallback if database doesn't have the key)
export const REVENUECAT_PUBLIC_API_KEY = ''; // Fallback public API key

// Required Constants for app (Static - Required for database queries)
export const APP_DB_ID = 'LIST123456';
export const APP_CURRENT_VERSION = '1.1.0';

// Default fallback values (used until database values are loaded)
export const DEFAULT_CONSTANTS = {
  CONTACT_US_API_URL: IS_DEVELOPMENT
    ? 'http://192.168.0.53:3000/api/email/esend'
    : 'https://www.mobilecrm.org/api/email/esend',
  APP_STORE_ID: '6741738531',
  APP_STORE_URL: 'https://apps.apple.com/gb/app/stocard/id6741738531',
  TERMS_OF_SERVICE_URL: 'https://www.mobilecrm.org/p/terms',
  PRIVACY_POLICY_URL: 'https://www.mobilecrm.org/p/privacy',
  SERVER_URL: IS_DEVELOPMENT
    ? 'http://192.168.0.53:3000'
    : 'https://www.mobilecrm.org',
  ONBOARDING_VIDEO_ID: 'CI0pwaRei74',
};

// Backward compatibility - these will be removed in future versions
// For now, they return the default values synchronously
export const CONTACT_US_API_URL = DEFAULT_CONSTANTS.CONTACT_US_API_URL;
export const APP_STORE_ID = DEFAULT_CONSTANTS.APP_STORE_ID;
export const APP_STORE_URL = DEFAULT_CONSTANTS.APP_STORE_URL;
export const termsOfService = DEFAULT_CONSTANTS.TERMS_OF_SERVICE_URL;
export const privacyPolicy = DEFAULT_CONSTANTS.PRIVACY_POLICY_URL;
export const ONBOARDING_VIDEO_ID = DEFAULT_CONSTANTS.ONBOARDING_VIDEO_ID;

// Function to get server URL - returns the default server URL
export const getServerUrl = async () => {
  // In the future, this could load from database or async storage
  // For now, return the default
  return DEFAULT_CONSTANTS.SERVER_URL;
};
