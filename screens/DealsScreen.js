import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, TouchableWithoutFeedback, Keyboard, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { MapPin, Tag } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import useAuthStore from '../stores/authStore';
import useDealLocationStore from '../stores/dealLocationStore';
import { supabase } from '../utils/supabase';

export default function DealsScreen() {
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuthStore();
  const {
    country,
    stateRegion,
    city,
    hasLocationPreference,
    isLoading,
    setLoading,
    setLocation,
    getFormattedLocation
  } = useDealLocationStore();

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [tempCountry, setTempCountry] = useState('');
  const [tempStateRegion, setTempStateRegion] = useState('');
  const [tempCity, setTempCity] = useState('');

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserLocationPreferences();
    }
  }, [isAuthenticated, user]);

  const loadUserLocationPreferences = async () => {
    try {
      console.log('DealsScreen: Loading user location preferences for user ID:', user.id);

      const { data, error } = await supabase
        .from('accounts')
        .select('country, state, city')
        .eq('id', user.id)
        .single();

      if (error) {
        console.log('DealsScreen: Error loading location preferences:', error);
        return;
      }

      if (data && (data.country || data.state || data.city)) {
        console.log('DealsScreen: Found existing location preferences:', data);
        setLocation(data.country || '', data.state || '', data.city || '');
      }
    } catch (error) {
      console.log('DealsScreen: Exception loading location preferences:', error);
    }
  };

  const getTempStateRegionLabel = () => {
    if (!tempCountry) return 'State/Region';

    const countriesWithStates = ['United States', 'USA', 'US', 'Canada', 'Australia', 'India'];
    const isStateCountry = countriesWithStates.some(c =>
      tempCountry.toLowerCase().includes(c.toLowerCase())
    );

    return isStateCountry ? 'State' : 'Region';
  };

  const handleSaveLocationPreferences = async () => {
    if (!isAuthenticated || !user?.id) {
      Alert.alert('Error', 'Please log in to save your location preferences');
      return;
    }

    if (!tempCountry.trim() || !tempCity.trim()) {
      Alert.alert('Error', 'Please enter at least your country and city');
      return;
    }

    console.log('DealsScreen: Saving location preferences:', {
      country: tempCountry.trim(),
      state: tempStateRegion.trim(),
      city: tempCity.trim(),
      userId: user.id
    });

    setLoading(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          country: tempCountry.trim(),
          state: tempStateRegion.trim(),
          city: tempCity.trim()
        })
        .eq('id', user.id);

      if (error) {
        console.log('DealsScreen: Error saving location preferences:', error);
        Alert.alert('Error', 'Failed to save location preferences. Please try again.');
        return;
      }

      console.log('DealsScreen: Location preferences saved successfully');
      setLocation(tempCountry.trim(), tempStateRegion.trim(), tempCity.trim());
      setShowLocationModal(false);
      Alert.alert('Success', 'Your location preferences have been saved! We\'ll notify you when deals become available in your area.');
    } catch (error) {
      console.log('DealsScreen: Exception saving location preferences:', error);
      Alert.alert('Error', 'Failed to save location preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = () => {
    // Initialize temp values with current values
    setTempCountry(country);
    setTempStateRegion(stateRegion);
    setTempCity(city);
    setShowLocationModal(true);
  };

  const handlePinPress = () => {
    // Initialize temp values with current values
    setTempCountry(country);
    setTempStateRegion(stateRegion);
    setTempCity(city);
    setShowLocationModal(true);
  };


  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Deals</Text>
            <View style={[styles.pinButton, { backgroundColor: 'transparent' }]}>
              {/* Empty space for consistency */}
            </View>
          </View>
          <View style={styles.authPrompt}>
            <Text style={[styles.authText, { color: theme.colors.text }]}>
              Please log in to set your location preferences and receive local deal notifications.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Deals</Text>
            <TouchableOpacity
              style={[styles.pinButton, { backgroundColor: theme.colors.primary }]}
              onPress={handlePinPress}
            >
              <MapPin size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {hasLocationPreference ? (
            <View style={styles.noDealsContainer}>
              <View style={[styles.dealIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                <Tag size={64} color={theme.colors.primary} />
              </View>
              <Text style={[styles.noDealsText, { color: theme.colors.text }]}>
                No deals for you at the moment
              </Text>
              <Text style={[styles.dealsMessage, { color: theme.colors.text, textAlign: 'center' }]}>
                We'll show you deals available in your area here. If you have deals to offer in any city or town,
                please contact us - we encourage locals to submit deals for their communities!
              </Text>
            </View>
          ) : (
            <View style={styles.noLocationContainer}>
              <View style={styles.noDealsContainer}>
                <View style={[styles.dealIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                  <MapPin size={64} color={theme.colors.primary} />
                </View>
                <Text style={[styles.noDealsText, { color: theme.colors.text }]}>
                  Please select your location
                </Text>
                <Text style={[styles.dealsMessage, { color: theme.colors.text, textAlign: 'center' }]}>
                  Click on the location icon above to set your location and see deals available in your area.
                </Text>
              </View>
            </View>
          )}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>

      {/* Location Update Modal */}
      <Modal
        visible={showLocationModal}
        transparent={false}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <SafeAreaView style={[styles.fullscreenModal, { backgroundColor: theme.colors.background }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoidingView}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Update Location</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowLocationModal(false)}
              >
                <Text style={[styles.closeButtonText, { color: theme.colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Country</Text>
                <TextInput
                  style={[styles.input, {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text
                  }]}
                  value={tempCountry}
                  onChangeText={setTempCountry}
                  placeholder="Enter your country"
                  placeholderTextColor={theme.colors.textSecondary}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  {getTempStateRegionLabel()}
                </Text>
                <TextInput
                  style={[styles.input, {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text
                  }]}
                  value={tempStateRegion}
                  onChangeText={setTempStateRegion}
                  placeholder={`Enter your ${getTempStateRegionLabel().toLowerCase()}`}
                  placeholderTextColor={theme.colors.textSecondary}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>City</Text>
                <TextInput
                  style={[styles.input, {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text
                  }]}
                  value={tempCity}
                  onChangeText={setTempCity}
                  placeholder="Enter your city"
                  placeholderTextColor={theme.colors.textSecondary}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveLocationPreferences}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, {
                  backgroundColor: theme.colors.primary,
                  opacity: isLoading ? 0.7 : 1
                }]}
                onPress={handleSaveLocationPreferences}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Location</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
  },
  pinButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  authText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  locationDisplay: {
    marginTop: 10,
  },
  locationForm: {
    marginTop: 10,
  },
  noLocationContainer: {
    marginTop: 10,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 24,
    lineHeight: 22,
  },
  locationInfo: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
  updateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dealsMessage: {
    fontSize: 16,
    opacity: 0.7,
    lineHeight: 22,
  },
  noDealsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  dealIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  noDealsText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  // Fullscreen Modal Styles
  fullscreenModal: {
    flex: 1,
  },
  modalKeyboardAvoidingView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
});