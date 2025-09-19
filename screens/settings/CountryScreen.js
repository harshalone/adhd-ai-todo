import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Search, ArrowUpDown, CheckCircle2 } from 'lucide-react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import useSettingsStore from '../../stores/settingsStore';
import BackButton from '../../components/BackButton';
import { countriesService } from '../../services/countriesService';
import useDebounce from '../../hooks/useDebounce';

export default function CountryScreen({ navigation }) {
  const { theme } = useTheme();
  const { country, setCountry } = useSettingsStore();

  // State management
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [showSortModal, setShowSortModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [tempSortOrder, setTempSortOrder] = useState('asc');

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch countries from database
  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await countriesService.getAllCountries();

      if (error) {
        console.error('Error fetching countries:', error);
        return;
      }

      if (data) {
        // Map database fields to expected format
        const mappedCountries = data.map(item => ({
          name: item.name,
          code: item.country_code,
          country_uid: item.country_uid
        }));
        setCountries(mappedCountries);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load countries on component mount
  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const handleCountrySelect = (selectedCountry) => {
    setCountry(selectedCountry);
  };

  const isCountrySelected = country && country.name && country.code;

  // Filter and sort countries
  const filteredAndSortedCountries = useMemo(() => {
    let filtered = countries;

    // Apply search filter
    if (debouncedSearchQuery.trim()) {
      filtered = countries.filter(countryItem =>
        countryItem.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [countries, debouncedSearchQuery, sortOrder]);

  // Search modal handlers
  const openSearchModal = useCallback(() => {
    setTempSearchQuery(searchQuery);
    setShowSearchModal(true);
  }, [searchQuery]);

  const applySearch = useCallback(() => {
    setSearchQuery(tempSearchQuery.trim());
    setShowSearchModal(false);
  }, [tempSearchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setTempSearchQuery('');
    setShowSearchModal(false);
  }, []);

  // Sort modal handlers
  const openSortModal = useCallback(() => {
    setTempSortOrder(sortOrder);
    setShowSortModal(true);
  }, [sortOrder]);

  const applySortOrder = useCallback(() => {
    setSortOrder(tempSortOrder);
    setShowSortModal(false);
  }, [tempSortOrder]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with search and sort */}
      <View style={styles.headerRow}>
        <BackButton onPress={() => navigation.goBack()} />

        <TouchableOpacity
          style={[styles.searchBox, {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }]}
          onPress={openSearchModal}
        >
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search countries..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            editable={false}
            pointerEvents="none"
          />
          <Search size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={openSortModal}
        >
          <ArrowUpDown size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View> 

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Current selection display */}
        {isCountrySelected && (
          <View style={[styles.currentSelectionContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.currentSelectionLabel, { color: theme.colors.textSecondary }]}>Current:</Text>
            <Text style={[styles.currentSelectionValue, { color: theme.colors.text }]}>{country.name}</Text>
          </View>
        )}

        {!isCountrySelected && (
          <Text style={[styles.subtitle, { color: theme.colors.text }]}>Please select one</Text>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading countries...</Text>
          </View>
        ) : (
          <View style={styles.countriesContainer}>
            {filteredAndSortedCountries.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  {searchQuery.trim() ? 'No countries found matching your search.' : 'No countries available.'}
                </Text>
              </View>
            ) : (
              filteredAndSortedCountries.map((countryItem) => {
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
              })
            )}
          </View>
        )}

        <View style={[styles.noticeContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.noticeText, { color: theme.colors.text }]}>
            If you do not find your country, please contact us and we will add it on your request.
          </Text>
        </View>
      </ScrollView>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.searchModalOverlay}>
          <View style={[styles.searchModalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.searchModalHeader}>
              <TouchableOpacity
                style={styles.searchModalClose}
                onPress={() => setShowSearchModal(false)}
              >
                <Text style={[styles.searchModalCloseText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.searchModalTitle, { color: theme.colors.text }]}>Search Countries</Text>
              <TouchableOpacity
                style={styles.searchModalAction}
                onPress={clearSearch}
              >
                <Text style={[styles.searchModalActionText, { color: theme.colors.primary }]}>Clear</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.searchModalInputContainer, {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }]}>
              <Search size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.searchModalInput, { color: theme.colors.text }]}
                placeholder="Type to search countries..."
                placeholderTextColor={theme.colors.textSecondary}
                value={tempSearchQuery}
                onChangeText={setTempSearchQuery}
                autoFocus={true}
                onSubmitEditing={applySearch}
                returnKeyType="search"
              />
              {tempSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setTempSearchQuery('')}>
                  <Text style={[styles.clearInputText, { color: theme.colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.searchButton, {
                backgroundColor: tempSearchQuery.trim() ? theme.colors.primary : theme.colors.border
              }]}
              onPress={applySearch}
              disabled={!tempSearchQuery.trim()}
            >
              <Text style={[styles.searchButtonText, {
                color: tempSearchQuery.trim() ? '#fff' : theme.colors.textSecondary
              }]}>
                Search
              </Text>
            </TouchableOpacity>

            {searchQuery.length > 0 && (
              <View style={styles.currentSearchContainer}>
                <Text style={[styles.currentSearchLabel, { color: theme.colors.textSecondary }]}>
                  Currently searching for:
                </Text>
                <Text style={[styles.currentSearchValue, { color: theme.colors.text }]}>
                  "{searchQuery}"
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.sortModalOverlay}>
          <View style={[styles.sortModalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.sortModalHeader}>
              <TouchableOpacity
                style={styles.sortCloseButton}
                onPress={() => setShowSortModal(false)}
              >
                <Text style={[styles.sortCloseText, { color: theme.colors.text }]}>Close</Text>
              </TouchableOpacity>
              <Text style={[styles.sortModalTitle, { color: theme.colors.text }]}>Sort Countries</Text>
              <View style={styles.sortHeaderSpacer} />
            </View>

            <View style={styles.sortSection}>
              <Text style={[styles.sortSectionTitle, { color: theme.colors.text }]}>Order</Text>
              <View style={styles.sortOptions}>
                {[
                  { key: 'asc', label: 'A to Z' },
                  { key: 'desc', label: 'Z to A' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      {
                        backgroundColor: tempSortOrder === option.key ? theme.colors.primary + '15' : theme.colors.surface,
                        borderColor: tempSortOrder === option.key ? theme.colors.primary : theme.colors.border,
                      }
                    ]}
                    onPress={() => setTempSortOrder(option.key)}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      { color: tempSortOrder === option.key ? theme.colors.primary : theme.colors.text }
                    ]}>
                      {option.label}
                    </Text>
                    {tempSortOrder === option.key && (
                      <CheckCircle2 size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[styles.sortButton, styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={() => setShowSortModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortButton, styles.applyButton, { backgroundColor: theme.colors.primary }]}
                onPress={applySortOrder}
              >
                <Text style={[styles.applyButtonText, { color: '#fff' }]}>Apply Sort</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 8,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 3,
  },
  searchInput: {
    flex: 1,
    marginRight: 12,
    fontSize: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 24,
  },
  currentSelectionContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  currentSelectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  currentSelectionValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
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
  // Search Modal Styles
  searchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  searchModalContent: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 24,
  },
  searchModalClose: {
    width: 60,
  },
  searchModalCloseText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  searchModalAction: {
    width: 60,
    alignItems: 'flex-end',
  },
  searchModalActionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchModalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  searchModalInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  clearInputText: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  searchButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentSearchContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  currentSearchLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  currentSearchValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Sort Modal Styles
  sortModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sortModalContent: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  sortModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 32,
  },
  sortCloseButton: {
    width: 60,
  },
  sortCloseText: {
    fontSize: 16,
    fontWeight: '500',
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  sortHeaderSpacer: {
    width: 60,
  },
  sortSection: {
    marginBottom: 32,
  },
  sortSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sortOptions: {
    gap: 12,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sortOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  applyButton: {
    // backgroundColor set dynamically
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});