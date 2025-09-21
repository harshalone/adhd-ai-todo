import { supabase } from '../utils/supabase';
import { APP_DB_ID } from '../utils/constants';

class AppMetadataService {
  constructor() {
    this.metadata = null;
    this.loading = false;
    this.listeners = new Set();
  }

  // Add listener for metadata updates
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners when metadata updates
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.metadata));
  }

  // Fetch app metadata from database
  async fetchMetadata() {
    if (this.loading) return this.metadata;

    try {
      this.loading = true;
      console.log('Fetching app metadata from database...');

      const { data, error } = await supabase
        .from('app_meta_data')
        .select('*')
        .eq('app_id', APP_DB_ID)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching app metadata:', error);
        return this.getDefaultMetadata();
      }

      if (data) {
        this.metadata = {
          CONTACT_US_API_URL: data.contact_us_api,
          APP_STORE_ID: data.app_store_id,
          APP_STORE_URL: data.app_store_url,
          TERMS_OF_SERVICE_URL: data.terms_url,
          PRIVACY_POLICY_URL: data.privacy_url,
          SERVER_URL: data.server_url,
          ONBOARDING_VIDEO_ID: data.onboarding_video_youtube_id,
          VERSION: data.version,
          UPDATED_AT: data.updated_at,
        };

        console.log('App metadata loaded successfully:', this.metadata);
        this.notifyListeners();
        return this.metadata;
      }

      return this.getDefaultMetadata();
    } catch (error) {
      console.error('Failed to fetch app metadata:', error);
      return this.getDefaultMetadata();
    } finally {
      this.loading = false;
    }
  }

  // Get current metadata (fetch if not loaded)
  async getMetadata() {
    if (!this.metadata) {
      await this.fetchMetadata();
    }
    return this.metadata;
  }

  // Get specific metadata value
  async getValue(key) {
    const metadata = await this.getMetadata();
    return metadata?.[key];
  }

  // Get default metadata (fallback values)
  getDefaultMetadata() {
    return {
      CONTACT_US_API_URL: 'https://www.mobilecrm.org/api/email/esend',
      APP_STORE_ID: '6741738531',
      APP_STORE_URL: 'https://apps.apple.com/gb/app/stocard/id6741738531',
      TERMS_OF_SERVICE_URL: 'https://www.mobilecrm.org/p/terms',
      PRIVACY_POLICY_URL: 'https://www.mobilecrm.org/p/privacy',
      SERVER_URL: 'https://www.mobilecrm.org',
      ONBOARDING_VIDEO_ID: 'CI0pwaRei74',
      VERSION: '3.2.3',
      UPDATED_AT: null,
    };
  }

  // Check if metadata is loaded
  isLoaded() {
    return this.metadata !== null;
  }

  // Refresh metadata from database
  async refresh() {
    this.metadata = null;
    return await this.fetchMetadata();
  }
}

// Export singleton instance
export const appMetadataService = new AppMetadataService();
export default appMetadataService;