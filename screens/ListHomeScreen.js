import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, List, UserStar, Rows3, Download } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../utils/supabase';
import useAuthStore from '../stores/authStore';

export default function ListHomeScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [shoppingLists, setShoppingLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importListId, setImportListId] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  const handleAddPress = () => {
    navigation.navigate('AddList');
  };

  const handleImportPress = () => {
    setImportModalVisible(true);
  };

  const handleImportSubmit = () => {
    if (importListId && importListId.trim()) {
      importShoppingList(importListId.trim());
    }
  };

  const closeImportModal = () => {
    setImportModalVisible(false);
    setImportListId('');
    setImportLoading(false);
  };

  const importShoppingList = async (listId) => {
    if (!user) return;

    try {
      setImportLoading(true);

      // First check if the list exists in the shopping_lists table
      const { data: listData, error: listError } = await supabase
        .from('shopping_lists')
        .select('id, list_name')
        .eq('list_uid', listId)
        .single();

      if (listError || !listData) {
        Alert.alert('Error', 'Shopping list not found. Please check the ID and try again.');
        return;
      }

      // Check if user already has this list
      const { data: existingList } = await supabase
        .from('users_shopping_lists')
        .select('id')
        .eq('user_uid', user.id)
        .eq('list_uid', listId)
        .single();

      if (existingList) {
        Alert.alert('Already Imported', 'You already have access to this shopping list.');
        return;
      }

      // Add the list to user's shopping lists
      const { error: insertError } = await supabase
        .from('users_shopping_lists')
        .insert({
          user_uid: user.id,
          list_uid: listId,
          list_name: listData.list_name,
          owner: false
        });

      if (insertError) {
        console.error('Error importing shopping list:', insertError);
        Alert.alert('Error', 'Failed to import shopping list. Please try again.');
      } else {
        Alert.alert('Success', `Shopping list "${listData.list_name}" has been imported!`);
        // Refresh the lists
        fetchShoppingLists();
        closeImportModal();
      }
    } catch (error) {
      console.error('Error importing shopping list:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setImportLoading(false);
    }
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
    <TouchableOpacity
      style={[styles.listItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={() => navigation.navigate('ListItems', { listId: item.id, listName: item.list_name })}
    >
      <View style={styles.listIcon}>
        <Rows3 size={22} color={theme.colors.textSecondary} />
      </View>
      <Text style={[styles.listName, { color: theme.colors.text }]}>{item.list_name}</Text>
      {item.owner && (
        <View style={styles.ownerIcon}>
          <UserStar size={20} color={theme.colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Lists</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.orange }]}
              onPress={handleImportPress}
            >
              <Download size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddPress}
            >
              <Plus size={24} color="#fff" />
            </TouchableOpacity>
          </View>
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

      {/* Import Modal */}
      <Modal
        visible={importModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImportModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Import Shopping List
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              Enter the list ID to import:
            </Text>

            <TextInput
              style={[styles.modalInput, {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }]}
              value={importListId}
              onChangeText={setImportListId}
              placeholder="List ID"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={closeImportModal}
                disabled={importLoading}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.importButton, { backgroundColor: theme.colors.orange }]}
                onPress={handleImportSubmit}
                disabled={importLoading || !importListId.trim()}
              >
                {importLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.importButtonText}>Import</Text>
                )}
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  listIcon: {
    marginRight: 12,
  },
  listName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  ownerIcon: {
    marginLeft: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  importButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});