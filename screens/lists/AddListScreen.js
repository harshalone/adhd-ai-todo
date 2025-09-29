import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../utils/supabase';
import useAuthStore from '../../stores/authStore';

export default function AddListScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [listName, setListName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddList = async () => {
    if (!listName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('users_shopping_lists')
        .insert([
          {
            user_uid: user.id,
            list_name: listName.trim(),
            owner: true
          }
        ]);

      if (error) {
        console.error('Error adding shopping list:', error);
        Alert.alert('Error', 'Failed to create list');
      } else {
        Alert.alert('Success', 'List created successfully', [
          { text: 'OK', onPress: () => {
            navigation.goBack();
            // Trigger refresh on the previous screen
            navigation.navigate('ListHome', { refresh: Date.now() });
          }}
        ]);
      }
    } catch (error) {
      console.error('Error adding shopping list:', error);
      Alert.alert('Error', 'Failed to create list');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Add List</Text>

        <View style={styles.formContainer}>
          <Text style={[styles.label, { color: theme.colors.text }]}>List Name</Text>
          <TextInput
            style={[styles.input, {
              color: theme.colors.text,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface
            }]}
            value={listName}
            onChangeText={setListName}
            placeholder="Enter list name"
            placeholderTextColor={theme.colors.textSecondary}
            maxLength={100}
          />

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddList}
            disabled={loading}
          >
            <Text style={[styles.addButtonText, { color: '#fff' }]}>
              {loading ? 'Adding...' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>
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
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 30,
  },
  formContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  addButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});