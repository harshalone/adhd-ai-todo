import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert, ScrollView, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Check, ChevronLeft, Search, Share as ShareIcon, Plus, ArrowUpDown, CheckCircle2, Circle, Trash2, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../utils/supabase';
import useAuthStore from '../../stores/authStore';
import useSearchStore from '../../stores/searchStore';
import useShoppingStore from '../../stores/shoppingStore';

export default function ShoppingListItemsScreen({ route, navigation }) {
  const { listId, listName } = route.params;
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { addSearchTerm, removeSearchTerm, getRecentSearches, clearSearchHistory } = useSearchStore();
  const { getSortOption, setSortOption, setLastOpenedList } = useShoppingStore();
  const [shoppingItems, setShoppingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortOption, setLocalSortOption] = useState(getSortOption());
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [tempSortOptions, setTempSortOptions] = useState({ primary: 'default', secondary: 'none' });
  const [showShareModal, setShowShareModal] = useState(false);
  const [listUuid, setListUuid] = useState(null);
  const [copyNotification, setCopyNotification] = useState(false);
  const [sortedItems, setSortedItems] = useState([]);
  const [shouldResort, setShouldResort] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const fetchShoppingItems = useCallback(async () => {
    if (!user) return;

    try {
      // First, get the list UUID and ownership info from users_shopping_lists table
      const { data: listData, error: listError } = await supabase
        .from('users_shopping_lists')
        .select('list_uid, user_uid')
        .eq('id', listId)
        .single();

      if (listError) {
        console.error('Error fetching list data:', listError);
        return;
      }

      // Store the list UUID for sharing and check ownership
      setListUuid(listData.list_uid);
      setIsOwner(listData.user_uid === user.id);

      // Then fetch shopping items using the UUID
      const { data, error } = await supabase
        .from('shopping_list')
        .select('*')
        .eq('list_uid', listData.list_uid)
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching shopping items:', error);
      } else {
        setShoppingItems(data || []);
        setShouldResort(true);
      }
    } catch (error) {
      console.error('Error fetching shopping items:', error);
    } finally {
      setLoading(false);
    }
  }, [user, listId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setShouldResort(true);
    await fetchShoppingItems();
    setRefreshing(false);
  }, [fetchShoppingItems]);

  const toggleItemStatus = useCallback(async (itemId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    // Haptic feedback - different for completion vs unchecking
    if (newStatus === 'completed') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const { error } = await supabase
        .from('shopping_list')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating item status:', error);
      } else {
        // Update both shoppingItems and sortedItems in-place without resorting
        setShoppingItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId ? { ...item, status: newStatus } : item
          )
        );
        setSortedItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId ? { ...item, status: newStatus } : item
          )
        );
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  }, []);

  const deleteItem = useCallback(async (itemId) => {
    try {
      const { error } = await supabase
        .from('shopping_list')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting item:', error);
        Alert.alert('Error', 'Failed to delete item');
      } else {
        // Remove item from both state arrays
        setShoppingItems(prevItems =>
          prevItems.filter(item => item.id !== itemId)
        );
        setSortedItems(prevItems =>
          prevItems.filter(item => item.id !== itemId)
        );
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item');
    }
  }, []);

  const confirmDeleteItem = useCallback((itemId, itemName) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${itemName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteItem(itemId),
        },
      ]
    );
  }, [deleteItem]);


  const handleAddItem = useCallback(async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    setAddingItem(true);

    try {
      // First get the list UUID
      const { data: listData, error: listError } = await supabase
        .from('users_shopping_lists')
        .select('list_uid')
        .eq('id', listId)
        .eq('user_uid', user.id)
        .single();

      if (listError) {
        console.error('Error fetching list UUID:', listError);
        Alert.alert('Error', 'Failed to add item');
        return;
      }

      // Add the new item
      const { data: newItem, error } = await supabase
        .from('shopping_list')
        .insert([{
          user_uid: user.id,
          name: newItemName.trim(),
          status: 'pending',
          list_uid: listData.list_uid
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding item:', error);
        Alert.alert('Error', 'Failed to add item');
      } else {
        // Add the new item to the current state immediately
        setShoppingItems(prevItems => [newItem, ...prevItems]);
        setShouldResort(true);
        setNewItemName('');
        setShowAddModal(false);
        // Also refresh from the database to ensure consistency
        await fetchShoppingItems();
      }
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item');
    } finally {
      setAddingItem(false);
    }
  }, [newItemName, listId, user, fetchShoppingItems]);

  const handleShare = useCallback(() => {
    setShowShareModal(true);
  }, []);

  const appUrl = 'https://apps.apple.com/gb/app/stocard/id6741738531';

  const shareList = useCallback(async () => {
    if (!listUuid) return;

    try {
      const shareMessage = `Check out my shopping list!\n\nDownload App: ${appUrl}\n\nList ID: ${listUuid}`;
      const result = await Share.share({
        message: shareMessage,
        title: 'Shopping List'
      });

      if (result.action === Share.dismissedAction) {
        // User dismissed the share dialog
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share the list');
    }
  }, [listUuid]);

  const copyToClipboard = useCallback(async () => {
    if (!listUuid) return;

    try {
      const copyText = `Download App: ${appUrl}\n\nList ID: ${listUuid}`;
      await Clipboard.setStringAsync(copyText);
      setCopyNotification(true);
      setTimeout(() => setCopyNotification(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  }, [listUuid]);

  const handleSortOptionSelect = useCallback((category, option) => {
    setTempSortOptions(prev => ({
      ...prev,
      [category]: prev[category] === option ? 'none' : option
    }));
  }, []);

  const applySortOptions = useCallback(() => {
    const { primary, secondary } = tempSortOptions;
    let combinedOption = primary;

    if (secondary !== 'none') {
      combinedOption = `${primary}+${secondary}`;
    }

    console.log('ShoppingListItems: Applying sort option:', combinedOption);
    setLocalSortOption(combinedOption);
    setSortOption(combinedOption); // Persist to store
    setShouldResort(true);
    setShowSortModal(false);
  }, [tempSortOptions, setSortOption]);

  const openSortModal = useCallback(() => {
    // Initialize temp options based on current sort
    const currentParts = sortOption.split('+');
    setTempSortOptions({
      primary: currentParts[0] || 'default',
      secondary: currentParts[1] || 'none'
    });
    setShowSortModal(true);
  }, [sortOption]);

  const openSearchModal = useCallback(() => {
    setTempSearchQuery(searchQuery);
    setShowSearchModal(true);
  }, [searchQuery]);

  const applySearch = useCallback(() => {
    if (tempSearchQuery.trim()) {
      addSearchTerm(tempSearchQuery.trim());
      setSearchQuery(tempSearchQuery.trim());
    }
    setShouldResort(true);
    setShowSearchModal(false);
  }, [tempSearchQuery, addSearchTerm]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setTempSearchQuery('');
    setShouldResort(true);
    setShowSearchModal(false);
  }, []);

  const selectRecentSearch = useCallback((term) => {
    setTempSearchQuery(term);
    addSearchTerm(term);
    setSearchQuery(term);
    setShouldResort(true);
    setShowSearchModal(false);
  }, [addSearchTerm]);

  useEffect(() => {
    fetchShoppingItems();

    // Track this list as the last opened
    setLastOpenedList({
      listId: listId,
      listName: listName
    });
  }, [fetchShoppingItems, listId, listName, setLastOpenedList]);

  // Effect to load persisted sort option on component mount
  useEffect(() => {
    const persistedSortOption = getSortOption();
    console.log('ShoppingListItems: Loading persisted sort option:', persistedSortOption);
    setLocalSortOption(persistedSortOption);
    setShouldResort(true);
  }, [getSortOption]);

  // Effect to apply sorting when needed
  useEffect(() => {
    if (shouldResort || (sortedItems.length === 0 && shoppingItems.length > 0)) {
      console.log('Applying sort with option:', sortOption, 'items count:', shoppingItems.length);
      const sortedData = applySorting(shoppingItems, sortOption);
      console.log('Sorted data count:', sortedData.length);
      setSortedItems(sortedData);
      setShouldResort(false);
    }
  }, [shoppingItems, sortOption, shouldResort]);

  // Function to apply sorting logic
  const applySorting = useCallback((items, currentSortOption) => {
    const sortParts = currentSortOption.split('+');
    const primarySort = sortParts[0];
    const secondarySort = sortParts[1];

    let sorted = [...items];

    switch (primarySort) {
      case 'alphabetical-asc':
        sorted.sort((a, b) =>
          (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase())
        );
        break;
      case 'alphabetical-desc':
        sorted.sort((a, b) =>
          (b.name || '').toLowerCase().localeCompare((a.name || '').toLowerCase())
        );
        break;
      case 'status-pending':
        sorted.sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          return 0;
        });
        break;
      case 'status-completed':
        sorted.sort((a, b) => {
          if (a.status === 'completed' && b.status !== 'completed') return -1;
          if (a.status !== 'completed' && b.status === 'completed') return 1;
          return 0;
        });
        break;
      case 'default':
      default:
        // Keep original order (newest first from database)
        break;
    }

    // Apply secondary sorting if specified
    if (secondarySort) {
      switch (secondarySort) {
        case 'alphabetical-asc':
          sorted.sort((a, b) => {
            if (primarySort === 'status-pending' || primarySort === 'status-completed') {
              if (a.status === b.status) {
                return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
              }
            }
            return 0;
          });
          break;
        case 'alphabetical-desc':
          sorted.sort((a, b) => {
            if (primarySort === 'status-pending' || primarySort === 'status-completed') {
              if (a.status === b.status) {
                return (b.name || '').toLowerCase().localeCompare((a.name || '').toLowerCase());
              }
            }
            return 0;
          });
          break;
      }
    }

    return sorted;
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchShoppingItems();
    }, [fetchShoppingItems])
  );

  const filteredItems = useMemo(() => {
    // Always prioritize showing items: use sortedItems if it has content,
    // otherwise fallback to shoppingItems to ensure we never show empty list
    // when there are actually items available
    let items;
    if (sortedItems.length > 0) {
      items = sortedItems;
    } else if (shoppingItems.length > 0) {
      // If sortedItems is empty but we have shopping items, use shopping items directly
      items = shoppingItems;
    } else {
      // Both are empty, so show empty array
      items = [];
    }

    // Debug log to track the issue
    console.log('FilteredItems - sortedItems.length:', sortedItems.length, 'shoppingItems.length:', shoppingItems.length, 'items.length:', items.length, 'searchQuery:', searchQuery);

    // Apply search filter
    if (searchQuery.trim()) {
      items = items.filter(item =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  }, [sortedItems, shoppingItems, searchQuery]);

  const renderShoppingItem = ({ item }) => (
    <View style={styles.itemWrapper}>
      <TouchableOpacity
        style={[styles.itemContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={() => toggleItemStatus(item.id, item.status)}
      >
        <View style={styles.checkboxContainer}>
          {item.status === 'completed' ? (
            <View style={[styles.checkbox, styles.checkedBox, { backgroundColor: theme.colors.primary }]}>
              <Check size={16} color="#fff" />
            </View>
          ) : (
            <View style={[styles.checkbox, { borderColor: theme.colors.border }]} />
          )}
        </View>
        <Text
          style={[
            styles.itemName,
            { color: theme.colors.text },
            item.status === 'completed' && styles.completedText
          ]}
        >
          {item.name}
        </Text>
        {isOwner && (
          <TouchableOpacity
            style={styles.trashIconContainer}
            onPress={() => confirmDeleteItem(item.id, item.name)}
          >
            <Trash2 size={18} color="#999" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={39} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.searchBox, {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }]}
            onPress={openSearchModal}
          >
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search items..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              editable={false}
              pointerEvents="none"
            />
            {searchQuery.trim() ? (
              <TouchableOpacity onPress={clearSearch}>
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ) : (
              <Search size={20} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerButton]}
            onPress={openSortModal}
          >
            <ArrowUpDown size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerButton]}
            onPress={handleShare}
          >
            <ShareIcon size={24} color={theme.colors.text} />
          </TouchableOpacity>

          {isOwner && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlashList
            data={filteredItems}
            renderItem={renderShoppingItem}
            keyExtractor={(item) => item.id.toString()}
            estimatedItemSize={60}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  {searchQuery.trim() ? 'No items found matching your search.' : 'No items in this shopping list yet.'}
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add New Item</Text>

            <TextInput
              style={[styles.modalInput, {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background
              }]}
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Enter item name"
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus={true}
              onSubmitEditing={handleAddItem}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewItemName('');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.addItemButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddItem}
                disabled={addingItem}
              >
                <Text style={[styles.addItemButtonText, { color: '#fff' }]}>
                  {addingItem ? 'Adding...' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
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
        <View style={styles.fullscreenSortOverlay}>
          <View style={[styles.fullscreenSortContent, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.fullscreenSortHeader}>
              <TouchableOpacity
                style={styles.sortCloseButton}
                onPress={() => setShowSortModal(false)}
              >
                <Text style={[styles.sortCloseText, { color: theme.colors.text }]}>Close</Text>
              </TouchableOpacity>
              <Text style={[styles.fullscreenSortTitle, { color: theme.colors.text }]}>Sort Items</Text>
              <View style={styles.sortHeaderSpacer} />
            </View>

            {/* Primary Sort Section */}
            <View style={styles.fullscreenSortSection}>
              <Text style={[styles.fullscreenSortSectionTitle, { color: theme.colors.text }]}>Primary Sort</Text>
              <View style={styles.fullscreenSortOptions}>
                {[
                  { key: 'status-pending', label: 'Pending First' },
                  { key: 'status-completed', label: 'Completed First' },
                  { key: 'default', label: 'Recently Added First' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.fullscreenSortOption,
                      {
                        backgroundColor: tempSortOptions.primary === option.key ? theme.colors.primary + '15' : theme.colors.surface,
                        borderColor: tempSortOptions.primary === option.key ? theme.colors.primary : theme.colors.border,
                      }
                    ]}
                    onPress={() => handleSortOptionSelect('primary', option.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.fullscreenSortOptionText,
                      { color: tempSortOptions.primary === option.key ? theme.colors.primary : theme.colors.text }
                    ]}>
                      {option.label}
                    </Text>
                    {tempSortOptions.primary === option.key && (
                      <CheckCircle2 size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Secondary Sort Section */}
            <View style={styles.fullscreenSortSection}>
              <Text style={[styles.fullscreenSortSectionTitle, { color: theme.colors.text }]}>Secondary Sort</Text>
              <View style={styles.fullscreenSortOptions}>
                {[
                  { key: 'alphabetical-asc', label: 'A to Z' },
                  { key: 'alphabetical-desc', label: 'Z to A' },
                  { key: 'none', label: 'None' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.fullscreenSortOption,
                      {
                        backgroundColor: tempSortOptions.secondary === option.key ? theme.colors.primary + '15' : theme.colors.surface,
                        borderColor: tempSortOptions.secondary === option.key ? theme.colors.primary : theme.colors.border,
                      }
                    ]}
                    onPress={() => handleSortOptionSelect('secondary', option.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.fullscreenSortOptionText,
                      { color: tempSortOptions.secondary === option.key ? theme.colors.primary : theme.colors.text }
                    ]}>
                      {option.label}
                    </Text>
                    {tempSortOptions.secondary === option.key && (
                      <CheckCircle2 size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.fullscreenSortButtons}>
              <TouchableOpacity
                style={[styles.fullscreenSortButton, styles.fullscreenCancelButton, { borderColor: theme.colors.border }]}
                onPress={() => setShowSortModal(false)}
              >
                <Text style={[styles.fullscreenCancelButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.fullscreenSortButton, styles.fullscreenApplyButton, { backgroundColor: theme.colors.primary }]}
                onPress={applySortOptions}
              >
                <Text style={[styles.fullscreenApplyButtonText, { color: '#fff' }]}>Apply Sort</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.searchModalOverlay}>
          <View style={[styles.searchModalContent, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.searchModalHeader}>
              <TouchableOpacity
                style={styles.searchModalClose}
                onPress={() => setShowSearchModal(false)}
              >
                <Text style={[styles.searchModalCloseText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.searchModalTitle, { color: theme.colors.text }]}>Search Items</Text>
              <TouchableOpacity
                style={styles.searchModalAction}
                onPress={clearSearch}
              >
                <Text style={[styles.searchModalActionText, { color: theme.colors.primary }]}>Clear</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={[styles.searchModalInputContainer, {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }]}>
              <Search size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.searchModalInput, { color: theme.colors.text }]}
                placeholder="Type to search your items..."
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

            {/* Search Button */}
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

            {/* Recent Searches */}
            {getRecentSearches().length > 0 && (
              <View style={styles.recentSearchesContainer}>
                <View style={styles.recentSearchesHeader}>
                  <Text style={[styles.recentSearchesTitle, { color: theme.colors.text }]}>
                    Recent Searches
                  </Text>
                  <TouchableOpacity onPress={clearSearchHistory}>
                    <Text style={[styles.clearHistoryText, { color: theme.colors.primary }]}>
                      Clear All
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.recentSearchesList}>
                  {getRecentSearches().map((term, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.recentSearchItem, {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      }]}
                      onPress={() => selectRecentSearch(term)}
                    >
                      <Search size={16} color={theme.colors.textSecondary} />
                      <Text style={[styles.recentSearchText, { color: theme.colors.text }]}>
                        {term}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeSearchTerm(term)}
                        style={styles.removeSearchButton}
                      >
                        <Text style={[styles.removeSearchText, { color: theme.colors.textSecondary }]}>✕</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Current search indicator */}
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

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.fullscreenShareOverlay}>
          <View style={[styles.fullscreenShareContent, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.fullscreenShareHeader}>
              <TouchableOpacity
                style={styles.shareCloseButton}
                onPress={() => setShowShareModal(false)}
              >
                <Text style={[styles.shareCloseText, { color: theme.colors.text }]}>Close</Text>
              </TouchableOpacity>
              <Text style={[styles.fullscreenShareTitle, { color: theme.colors.text }]}>Share List</Text>
              <View style={styles.shareHeaderSpacer} />
            </View>

            {/* Description */}
            <Text style={[styles.shareDescription, { color: theme.colors.text }]}>
              Share this list with others
            </Text>

            {/* App URL Container */}
            <View style={styles.shareInfoSection}>
              <Text style={[styles.shareInfoLabel, { color: theme.colors.textSecondary }]}>
                Download App:
              </Text>
              <View style={[styles.shareInfoContainer, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }]}>
                <Text style={[styles.shareInfoText, { color: theme.colors.text }]} numberOfLines={2}>
                  {appUrl}
                </Text>
              </View>
            </View>

            {/* List ID Container */}
            <View style={styles.shareInfoSection}>
              <Text style={[styles.shareInfoLabel, { color: theme.colors.textSecondary }]}>
                List ID:
              </Text>
              <View style={[styles.shareInfoContainer, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }]}>
                <Text style={[styles.shareInfoText, { color: theme.colors.text }]} numberOfLines={1}>
                  {listUuid}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.fullscreenShareButtons}>
              <TouchableOpacity
                style={[styles.fullscreenShareButton, styles.fullscreenCopyButton, {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                }]}
                onPress={copyToClipboard}
              >
                <Text style={[styles.fullscreenCopyButtonText, { color: theme.colors.text }]}>Copy Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.fullscreenShareButton, styles.fullscreenShareActionButton, {
                  backgroundColor: theme.colors.primary,
                }]}
                onPress={shareList}
              >
                <Text style={[styles.fullscreenShareButtonText, { color: '#fff' }]}>Share</Text>
              </TouchableOpacity>
            </View>

            {/* Copy Notification */}
            {copyNotification && (
              <View style={[styles.fullscreenCopyNotification, {
                backgroundColor: theme.colors.primary,
              }]}>
                <Text style={styles.fullscreenCopyNotificationText}>✓ Copied to clipboard!</Text>
              </View>
            )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 8,
    marginBottom: 12
  },
  backButton: {
    marginRight: 0,
    marginLeft: -10
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
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemWrapper: {
    marginBottom: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    borderWidth: 0,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  trashIconContainer: {
    padding: 8,
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
    paddingTop: 100,
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  addItemButton: {
    // backgroundColor set dynamically
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addItemButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Fullscreen Sort Modal Styles
  fullscreenSortOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullscreenSortContent: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  fullscreenSortHeader: {
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
  fullscreenSortTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  sortHeaderSpacer: {
    width: 60,
  },
  fullscreenSortSection: {
    marginBottom: 32,
  },
  fullscreenSortSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  fullscreenSortOptions: {
    gap: 12,
  },
  fullscreenSortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  fullscreenSortOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  fullscreenSortButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  fullscreenSortButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  fullscreenCancelButton: {
    borderWidth: 1,
  },
  fullscreenApplyButton: {
    // backgroundColor set dynamically
  },
  fullscreenCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fullscreenApplyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sortModalHeader: {
    marginBottom: 16,
  },
  sortModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  sortOptionsContainer: {
    gap: 4,
  },
  modernSortOption: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  compactSortOption: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 6,
  },
  sortOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortOptionTexts: {
    flex: 1,
  },
  sortOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  sortOptionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  compactSortLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 1,
  },
  compactSortSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  sortScrollContainer: {
    flex: 1,
    marginBottom: 16,
  },
  sortSectionContainer: {
    marginBottom: 20,
  },
  sortSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  sortModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  applyButton: {
    // backgroundColor set dynamically
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  recentSearchesContainer: {
    marginBottom: 20,
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearHistoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recentSearchesList: {
    gap: 8,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  recentSearchText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  removeSearchButton: {
    padding: 4,
  },
  removeSearchText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Fullscreen Share Modal Styles
  fullscreenShareOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullscreenShareContent: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  fullscreenShareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 32,
  },
  shareCloseButton: {
    width: 60,
  },
  shareCloseText: {
    fontSize: 16,
    fontWeight: '500',
  },
  fullscreenShareTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  shareHeaderSpacer: {
    width: 60,
  },
  shareDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 24,
  },
  shareInfoSection: {
    marginBottom: 20,
  },
  shareInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  shareInfoContainer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  shareInfoText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  fullscreenShareButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  fullscreenShareButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  fullscreenCopyButton: {
    borderWidth: 1,
  },
  fullscreenShareActionButton: {
    // backgroundColor set dynamically
  },
  fullscreenCopyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fullscreenShareButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fullscreenCopyNotification: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  fullscreenCopyNotificationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});