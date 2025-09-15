import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import useAuthStore from '../stores/authStore';
import { supabase } from '../utils/supabase';

export default function DealsScreen() {
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuthStore();
  const [country, setCountry] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasLocationPreference, setHasLocationPreference] = useState(false);
  const scrollViewRef = useRef(null);
  const countryInputRef = useRef(null);
  const stateInputRef = useRef(null);
  const cityInputRef = useRef(null);

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
        setCountry(data.country || '');
        setStateRegion(data.state || '');
        setCity(data.city || '');
        setHasLocationPreference(true);
      }
    } catch (error) {
      console.log('DealsScreen: Exception loading location preferences:', error);
    }
  };

  const getStateRegionLabel = () => {
    if (!country) return 'State/Region';

    const countriesWithStates = ['United States', 'USA', 'US', 'Canada', 'Australia', 'India'];
    const isStateCountry = countriesWithStates.some(c =>
      country.toLowerCase().includes(c.toLowerCase())
    );

    return isStateCountry ? 'State' : 'Region';
  };

  const handleSaveLocationPreferences = async () => {
    if (!isAuthenticated || !user?.id) {
      Alert.alert('Error', 'Please log in to save your location preferences');
      return;
    }

    if (!country.trim() || !city.trim()) {
      Alert.alert('Error', 'Please enter at least your country and city');
      return;
    }

    console.log('DealsScreen: Saving location preferences:', {
      country: country.trim(),
      state: stateRegion.trim(),
      city: city.trim(),
      userId: user.id
    });

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update({
          country: country.trim(),
          state: stateRegion.trim(),
          city: city.trim()
        })
        .eq('id', user.id);

      if (error) {
        console.log('DealsScreen: Error saving location preferences:', error);
        Alert.alert('Error', 'Failed to save location preferences. Please try again.');
        return;
      }

      console.log('DealsScreen: Location preferences saved successfully');
      setHasLocationPreference(true);
      Alert.alert('Success', 'Your location preferences have been saved! We\'ll notify you when deals become available in your area.');
    } catch (error) {
      console.log('DealsScreen: Exception saving location preferences:', error);
      Alert.alert('Error', 'Failed to save location preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLocation = () => {
    setHasLocationPreference(false);
  };

  const scrollToInput = (inputRef) => {
    setTimeout(() => {
      inputRef.current?.measure((fx, fy, width, height, px, py) => {
        const scrollToY = py - 100; // Offset to show input near top
        scrollViewRef.current?.scrollTo({ y: Math.max(0, scrollToY), animated: true });
      });
    }, 100);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Deals</Text>
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView ref={scrollViewRef} style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Deals</Text>

          {hasLocationPreference ? (
            <View style={styles.locationDisplay}>
              <Text style={[styles.subtitle, { color: theme.colors.text }]}>
                Your Location Preferences
              </Text>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationText, { color: theme.colors.text }]}>
                  {city}, {stateRegion && `${stateRegion}, `}{country}
                </Text>
                <TouchableOpacity
                  style={[styles.updateButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleUpdateLocation}
                >
                  <Text style={styles.updateButtonText}>Update Location</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.dealsMessage, { color: theme.colors.text }]}>
                We'll show you deals available in your area here. If you have deals to offer in any city or town,
                please contact us - we encourage locals to submit deals for their communities!
              </Text>
            </View>
          ) : (
            <View style={styles.locationForm}>
              <Text style={[styles.subtitle, { color: theme.colors.text }]}>
                Set Your Location Preferences
              </Text>
              <Text style={[styles.description, { color: theme.colors.text }]}>
                Tell us where you're located and we'll show you deals available in your area.
                We encourage locals to contact us if you have deals for any city or town!
              </Text>

              <View style={styles.form}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Country</Text>
                <TextInput
                  ref={countryInputRef}
                  style={[styles.input, {
                    borderColor: theme.colors.border || '#ccc',
                    backgroundColor: theme.colors.card || '#fff',
                    color: theme.colors.text
                  }]}
                  value={country}
                  onChangeText={setCountry}
                  onFocus={() => scrollToInput(countryInputRef)}
                  placeholder="Enter your country"
                  placeholderTextColor={theme.colors.text + '80'}
                />

                <Text style={[styles.label, { color: theme.colors.text }]}>
                  {getStateRegionLabel()}
                </Text>
                <TextInput
                  ref={stateInputRef}
                  style={[styles.input, {
                    borderColor: theme.colors.border || '#ccc',
                    backgroundColor: theme.colors.card || '#fff',
                    color: theme.colors.text
                  }]}
                  value={stateRegion}
                  onChangeText={setStateRegion}
                  onFocus={() => scrollToInput(stateInputRef)}
                  placeholder={`Enter your ${getStateRegionLabel().toLowerCase()}`}
                  placeholderTextColor={theme.colors.text + '80'}
                />

                <Text style={[styles.label, { color: theme.colors.text }]}>City</Text>
                <TextInput
                  ref={cityInputRef}
                  style={[styles.input, {
                    borderColor: theme.colors.border || '#ccc',
                    backgroundColor: theme.colors.card || '#fff',
                    color: theme.colors.text
                  }]}
                  value={city}
                  onChangeText={setCity}
                  onFocus={() => scrollToInput(cityInputRef)}
                  placeholder="Enter your city"
                  placeholderTextColor={theme.colors.text + '80'}
                />

                <TouchableOpacity
                  style={[styles.saveButton, {
                    backgroundColor: theme.colors.primary || '#007AFF',
                    opacity: isLoading ? 0.7 : 1
                  }]}
                  onPress={handleSaveLocationPreferences}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Location Preferences</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
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
  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 20,
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
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});