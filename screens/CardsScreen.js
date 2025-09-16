import { StyleSheet, Text, View, TouchableOpacity, FlatList, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { cardsService } from '../services/cardsService';
import { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import { getOptimalTextColor, getOptimalSecondaryTextColor } from '../utils/colorUtils';

export default function CardsScreen({ navigation }) {
  const { theme } = useTheme();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  const fetchCards = useCallback(async () => {
    try {
      const { data, error } = await cardsService.getLoyaltyCards();
      if (error) {
        console.error('Error fetching cards:', error);
      } else {
        setCards(data || []);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCards();
    setRefreshing(false);
  }, [fetchCards]);

  useEffect(() => {
    fetchCards();

    // Listen for orientation changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, [fetchCards]);

  const handleAddCard = () => {
    navigation.navigate('CardSelection');
  };

  const handleCardPress = async (card) => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Update last_used timestamp
    await cardsService.updateCardLastUsed(card.id);
    // Refresh the list to show updated order
    fetchCards();
    // Navigate to card details
    navigation.navigate('CardScreen', { card });
  };

  const renderCard = ({ item }) => {
    const cardWidth = (screenData.width - 48) / 2; // 20px padding on each side + 8px gap between cards
    const backgroundColor = item.bg_colour || theme.colors.surface;
    const textColor = getOptimalTextColor(backgroundColor);
    const secondaryTextColor = getOptimalSecondaryTextColor(backgroundColor, 0.7);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            width: cardWidth,
            backgroundColor: backgroundColor,
            borderColor: item.bg_colour ? 'transparent' : theme.colors.border,
          }
        ]}
        onPress={() => handleCardPress(item)}
      >
        <Text style={[styles.cardName, { color: textColor }]}>
          {item.name}
        </Text>
        {item.last_used && (
          <Text style={[styles.lastUsed, { color: secondaryTextColor }]}>
            {moment(item.last_used).diff(moment(), 'days') > -3
              ? (() => {
                  const timeAgo = moment(item.last_used).fromNow();
                  return timeAgo === 'a few seconds ago' ? 'just now' : timeAgo;
                })()
              : moment(item.last_used).format('DD MMM YYYY')
            }
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Cards</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddCard}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {cards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No cards added yet. Tap the + button to add your first card.
            </Text>
            <TouchableOpacity
              style={[styles.refreshButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                size={20}
                color={theme.colors.primary}
                style={refreshing ? { transform: [{ rotate: '45deg' }] } : {}}
              />
              <Text style={[styles.refreshButtonText, { color: theme.colors.primary }]}>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={cards}
            renderItem={renderCard}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
            key={screenData.width} // Force re-render on orientation change
            ListFooterComponent={() => (
              <Text style={[styles.pullToRefreshText, { color: theme.colors.textSecondary }]}>
                pull to refresh
              </Text>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    paddingBottom: 0,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 120,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 24,
  },
  lastUsed: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 'auto',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pullToRefreshText: {
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.6,
  },
});