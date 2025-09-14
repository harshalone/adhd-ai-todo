import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import useSettingsStore from '../../stores/settingsStore';
import BackButton from '../../components/BackButton';

export default function CountryScreen({ navigation }) {
  const { theme } = useTheme();
  const { country, setCountry } = useSettingsStore();

  const countries = [
    { name: "United States", code: "US" },
    { name: "China", code: "CN" },
    { name: "Japan", code: "JP" },
    { name: "India", code: "IN" },
    { name: "United Kingdom", code: "GB" },
    { name: "Germany", code: "DE" },
    { name: "Canada", code: "CA" },
    { name: "France", code: "FR" },
    { name: "Australia", code: "AU" },
    { name: "Brazil", code: "BR" },
  ];

  const handleCountrySelect = (selectedCountry) => {
    setCountry(selectedCountry);
  };

  const isCountrySelected = country && country.name && country.code;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.title, { color: theme.colors.text }]}>Country</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {!isCountrySelected && (
          <Text style={[styles.subtitle, { color: theme.colors.text }]}>Please select one</Text>
        )}
        {isCountrySelected && (
          <Text style={[styles.subtitle, { color: theme.colors.text }]}>
            Current: {country.name}
          </Text>
        )}

        <View style={styles.countriesContainer}>
          {countries.map((countryItem) => {
            const isSelected = country?.code === countryItem.code;

            return (
              <TouchableOpacity
                key={countryItem.code}
                style={[
                  styles.countryItem,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => handleCountrySelect(countryItem)}
              >
                <View style={styles.countryContent}>
                  <Text style={[styles.countryName, { color: theme.colors.text }]}>
                    {countryItem.name}
                  </Text>
                  {isSelected && (
                    <Check size={20} color={theme.colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.noticeContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.noticeText, { color: theme.colors.text }]}>
            If you do not find your country, please contact us and we will add it on your request.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 0,
    paddingRight: 16,
    paddingBottom: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 24,
  },
  countriesContainer: {
    gap: 12,
  },
  countryItem: {
    borderRadius: 12,
    padding: 16,
  },
  countryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countryName: {
    fontSize: 17,
    fontWeight: '500',
  },
  noticeContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.8,
  },
});