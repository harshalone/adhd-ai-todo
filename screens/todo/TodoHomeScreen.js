import { StyleSheet, Text, View, TouchableOpacity, FlatList, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, RefreshCw, Mic } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { todosService } from '../../services/todosService';
import { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import CheckVersion from '../../components/CheckVersion';
import TodoListItem from '../../components/TodoListItem';

export default function TodoHomeScreen({ navigation }) {
  const { theme } = useTheme();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  const fetchTodos = useCallback(async () => {
    try {
      const { data, error } = await todosService.getTodos();
      if (error) {
        console.error('Error fetching todos:', error);
      } else {
        setTodos(data || []);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTodos();
    setRefreshing(false);
  }, [fetchTodos]);

  useFocusEffect(
    useCallback(() => {
      fetchTodos();
    }, [fetchTodos])
  );

  useEffect(() => {
    fetchTodos();

    // Listen for orientation changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, [fetchTodos]);

  const handleAddTodo = () => {
    navigation.navigate('TodoAdd');
  };

  const handleVoiceInput = () => {
    navigation.navigate('AiTodoAdd');
  };

  const handleTodoPress = async (todo) => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // navigation.navigate('TodoDetail', { todo });
    console.log('Todo pressed:', todo.title);
  };

  const handleToggleComplete = async (todo) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await todosService.toggleTodoCompletion(todo.id, !todo.completed);
      fetchTodos(); // Refresh the list
    } catch (error) {
      console.error('Error toggling todo completion:', error);
    }
  };

  const handleEditTodo = (todo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('EditTodo', { todo });
  };


  const renderTodo = ({ item }) => {
    return (
      <TodoListItem
        item={item}
        onPress={handleTodoPress}
        onToggleComplete={handleToggleComplete}
        onEdit={handleEditTodo}
        showCheckbox={true}
      />
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Todos</Text>
        <View style={styles.headerRight}>
          <CheckVersion />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }]}
            onPress={handleVoiceInput}
          >
            <Mic size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddTodo}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.content}>
        {todos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No todos added yet. Tap the + button to add your first todo.
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
            data={todos}
            renderItem={renderTodo}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    paddingHorizontal: 10,
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