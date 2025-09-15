import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../utils/supabase';
import useAuthStore from '../../stores/authStore';

export default function ShoppingScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [shoppingLists, setShoppingLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleAddPress = () => {
    navigation.navigate('AddShoppingList');
  };

  const fetchShoppingLists = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users_shopping_lists')
        .select('*')
        .eq('user_uid', user.id)
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching shopping lists:', error);
      } else {
        setShoppingLists(data || []);
      }
    } catch (error) {
      console.error('Error fetching shopping lists:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchShoppingLists();
    setRefreshing(false);
  }, [fetchShoppingLists]);

  useEffect(() => {
    fetchShoppingLists();
  }, [fetchShoppingLists]);

  // Refresh the list when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchShoppingLists();
    }, [fetchShoppingLists])
  );

  const renderListItem = ({ item }) => (
    <View style={[styles.listItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.listName, { color: theme.colors.text }]}>{item.list_name}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Shopping</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddPress}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlashList
            data={shoppingLists}
            renderItem={renderListItem}
            keyExtractor={(item) => item.id.toString()}
            estimatedItemSize={70}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No shopping lists yet. Tap the + button to create one!
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
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
});