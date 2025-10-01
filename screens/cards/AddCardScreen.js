import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../utils/supabase';
import useSettingsStore from '../../stores/settingsStore';

// Function to determine if a color is light or dark
const getTextColorForBackground = (backgroundColor) => {
  // Handle null/undefined and ensure we have a valid hex color
  if (!backgroundColor) {
    return '#FFFFFF'; // Default to white text for default background
  }

  // Remove # if present and ensure we have 6 characters
  const color = backgroundColor.replace('#', '');

  // Ensure we have a valid 6-character hex color
  if (color.length !== 6) {
    return '#FFFFFF'; // Default to white text for invalid colors
  }

  // Convert hex to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // Calculate relative luminance using the formula from WCAG
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return dark text for light backgrounds, light text for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function AddCardScreen({ navigation }) {
  const { theme } = useTheme();
  const { country } = useSettingsStore();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const fetchLoyaltyCards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('loyalty_cards')
        .select('*');

      if (error) {
        console.error('Error fetching loyalty cards:', error);
        Alert.alert('Error', 'Failed to load loyalty cards. Please try again.');
        return;
      }

      // Sort cards: user's country first (by rank), then other countries (by rank)
      const sortedCards = (data || []).sort((a, b) => {
        const userCountryName = country?.name || '';

        // Check if cards belong to user's country
        const aIsUserCountry = a.country === userCountryName;
        const bIsUserCountry = b.country === userCountryName;

        // If one is user's country and other is not, prioritize user's country
        if (aIsUserCountry && !bIsUserCountry) return -1;
        if (!aIsUserCountry && bIsUserCountry) return 1;

        // If both are in same country category, sort by rank (lower rank = higher priority)
        const aRank = a.rank || 999999;
        const bRank = b.rank || 999999;

        if (aRank !== bRank) {
          return aRank - bRank;
        }

        // If ranks are equal, sort by name
        return (a.name || '').localeCompare(b.name || '');
      });

      setCards(sortedCards);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoyaltyCards();
  }, [country]); // Re-fetch when user's country changes

  const filteredCards = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      // Return cards in their already sorted order (country + rank)
      return cards;
    }

    // Filter cards by search query but maintain country + rank ordering
    const searchResults = cards.filter(card =>
      card.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      card.country?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    // Add "Other" card option at the end when searching
    const otherCard = {
      id: 'other',
      name: 'Other',
      country: country?.name || 'Unknown',
      background_color: '#6B7280', // Gray color for Other card
      rank: 999999, // Ensure it appears last
      isOtherCard: true
    };

    return [...searchResults, otherCard];
  }, [cards, debouncedSearchQuery, country]);

  const renderCardItem = ({ item }) => {
    const backgroundColor = item.background_color || '#6366f1';
    const textColor = getTextColorForBackground(backgroundColor);
    const isOtherCard = item.isOtherCard;

    return (
      <TouchableOpacity
        style={[styles.cardItem, {
          backgroundColor: backgroundColor,
          borderStyle: isOtherCard ? 'dashed' : 'solid',
        }]}
        onPress={() => {
          if (isOtherCard) {
            navigation.navigate('ScanCard', { cardData: item });
          } else {
            navigation.navigate('ScanCard', { cardData: item });
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: textColor }]}>
              {item.name}
              {isOtherCard && ' 📝'}
            </Text>
            <Text style={[styles.cardCountry, { color: textColor }]}>
              {item.country}
            </Text>
          </View> 
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading cards...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={39} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={[styles.searchBox, {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }]}>
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search cards..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Search size={20} color={theme.colors.textSecondary} />
        </View>
      </View>

      <FlatList
        data={filteredCards}
        renderItem={renderCardItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
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
    paddingHorizontal: 8,
    paddingTop: 8,
    marginBottom: 12
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginRight: 12,
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  cardItem: {
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  cardCountry: {
    fontSize: 15,
    fontWeight: '400',
    opacity: 0.7,
    letterSpacing: -0.1,
  },
  cardChevron: {
    marginLeft: 12,
  },
  chevronText: {
    fontSize: 20,
    fontWeight: '300',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});