import { appMetadataService } from '../services/appMetadataService';

// Supabase Configuration (Static - Required for app initialization)
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZ2lxeG54dXlpZW5jemRwbWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NTA5NjYsImV4cCI6MjA1MzIyNjk2Nn0.HQG38G7RBQ0En4saTB_v8hIY7L03Y0GpyTpO0Mp-9no';

export const SUPABASE_PROJECT_URL = 'https://wggiqxnxuyienczdpmlv.supabase.co';

// Required Constants for app (Static - Required for database queries)
export const APP_DB_ID = 'STOCARD123';
export const APP_CURRENT_VERSION = '3.2.3';

// Dynamic Constants (Fetched from database on app load)
// These will be updated from app_meta_data table

// Default fallback values (used until database values are loaded)
export const DEFAULT_CONSTANTS = {
  CONTACT_US_API_URL: 'https://www.mobilecrm.org/api/email/esend',
  APP_STORE_ID: '6741738531',
  APP_STORE_URL: 'https://apps.apple.com/gb/app/stocard/id6741738531',
  TERMS_OF_SERVICE_URL: 'https://www.mobilecrm.org/p/terms',
  PRIVACY_POLICY_URL: 'https://www.mobilecrm.org/p/privacy',
  SERVER_URL: 'https://www.mobilecrm.org/',
  ONBOARDING_VIDEO_ID: 'CI0pwaRei74',
};

// Dynamic getters that fetch from database or return defaults
export const getDynamicConstant = async (key) => {
  try {
    const value = await appMetadataService.getValue(key);
    return value || DEFAULT_CONSTANTS[key];
  } catch (error) {
    console.warn(`Failed to get dynamic constant ${key}, using default:`, error);
    return DEFAULT_CONSTANTS[key];
  }
};

// Convenience functions for commonly used constants
export const getContactUsUrl = () => getDynamicConstant('contact_us_api');
export const getAppStoreId = () => getDynamicConstant('app_store_id');
export const getAppStoreUrl = () => getDynamicConstant('app_store_url');
export const getTermsOfServiceUrl = () => getDynamicConstant('terms_url');
export const getPrivacyPolicyUrl = () => getDynamicConstant('privacy_url');
export const getServerUrl = () => getDynamicConstant('SERVER_URL');
export const getOnboardingVideoId = () => getDynamicConstant('onboarding_video_youtube_id');

// Backward compatibility - these will be removed in future versions
// For now, they return the default values synchronously
export const CONTACT_US_API_URL = DEFAULT_CONSTANTS.CONTACT_US_API_URL;
export const APP_STORE_ID = DEFAULT_CONSTANTS.APP_STORE_ID;
export const APP_STORE_URL = DEFAULT_CONSTANTS.APP_STORE_URL;
export const termsOfService = DEFAULT_CONSTANTS.TERMS_OF_SERVICE_URL;
export const privacyPolicy = DEFAULT_CONSTANTS.PRIVACY_POLICY_URL;
export const ONBOARDING_VIDEO_ID = DEFAULT_CONSTANTS.ONBOARDING_VIDEO_ID;
