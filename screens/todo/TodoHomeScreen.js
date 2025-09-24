import { StyleSheet, Text, View, TouchableOpacity, FlatList, RefreshControl, Dimensions, ScrollView } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, RefreshCw, Mic, ChevronDown, ChevronUp } from 'lucide-react-native';
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
  const [selectedDate, setSelectedDate] = useState(moment().startOf('day'));
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const [incompleteCollapsed, setIncompleteCollapsed] = useState(false);

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

  const getWeekDays = () => {
    const startOfWeek = selectedDate.clone().startOf('week');
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.clone().add(i, 'days'));
    }
    return days;
  };

  const filteredTodos = todos.filter(todo => {
    // Check if the todo has a start_date that matches the selected date
    if (todo.start_date) {
      return moment(todo.start_date, 'YYYY-MM-DD').isSame(selectedDate, 'day');
    }
    // Fall back to due_date if no start_date
    else if (todo.due_date) {
      return moment(todo.due_date, 'YYYY-MM-DD').isSame(selectedDate, 'day');
    }
    return false;
  });

  // Sort function to order todos by time (earliest first)
  const sortTodosByTime = (todos) => {
    return todos.sort((a, b) => {
      // Get time strings for comparison
      const timeA = a.start_time || a.end_time || null;
      const timeB = b.start_time || b.end_time || null;

      // Convert time strings to minutes for comparison
      const getMinutes = (timeStr) => {
        if (!timeStr) return 1440; // End of day for tasks without time

        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return 1440;

        return hours * 60 + minutes;
      };

      return getMinutes(timeA) - getMinutes(timeB);
    });
  };

  const completedTodos = sortTodosByTime(filteredTodos.filter(todo => todo.completed));
  const incompleteTodos = sortTodosByTime(filteredTodos.filter(todo => !todo.completed));

  const handleWeekChange = useCallback((direction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (direction === 'prev') {
      setSelectedDate(selectedDate.clone().subtract(1, 'week'));
    } else {
      setSelectedDate(selectedDate.clone().add(1, 'week'));
    }
  }, [selectedDate]);

  const renderWeeklyDatePicker = () => {
    const weekDays = getWeekDays();
    const dayAbbreviations = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const swipeGesture = Gesture.Pan()
      .onEnd((event) => {
        if (event.translationX > 50) {
          runOnJS(handleWeekChange)('prev');
        } else if (event.translationX < -50) {
          runOnJS(handleWeekChange)('next');
        }
      });

    return (
      <GestureDetector gesture={swipeGesture}>
        <View style={styles.weekContainer}>
          <View style={styles.weekScrollContainer}>
            {weekDays.map((day, index) => {
              const isSelected = day.isSame(selectedDate, 'day');
              const isToday = day.isSame(moment(), 'day');

              return (
                <TouchableOpacity
                  key={day.format('YYYY-MM-DD')}
                  style={[
                    styles.dayContainer,
                    isSelected && { backgroundColor: theme.colors.primary },
                    isToday && !isSelected && { borderColor: theme.colors.primary }
                  ]}
                  onPress={() => setSelectedDate(day)}
                >
                  <Text style={[
                    styles.dayAbbreviation,
                    { color: isSelected ? '#fff' : theme.colors.textSecondary }
                  ]}>
                    {dayAbbreviations[index]}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    { color: isSelected ? '#fff' : theme.colors.text }
                  ]}>
                    {day.format('D')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </GestureDetector>
    );
  };

  const renderCollapsibleSection = (title, todos, collapsed, setCollapsed) => {
    if (todos.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setCollapsed(!collapsed)}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {title} ({todos.length})
          </Text>
          {collapsed ? (
            <ChevronDown size={20} color={theme.colors.textSecondary} />
          ) : (
            <ChevronUp size={20} color={theme.colors.textSecondary} />
          )}
        </TouchableOpacity>
        {!collapsed && (
          <View style={styles.sectionContent}>
            {todos.map((todo) => (
              <TodoListItem
                key={todo.id}
                item={todo}
                onPress={handleTodoPress}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditTodo}
                showCheckbox={true}
              />
            ))}
          </View>
        )}
      </View>
    );
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
      {renderWeeklyDatePicker()}

      <View style={styles.content}>
        {filteredTodos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.surface }]}>
              <Plus size={48} color={theme.colors.primary} strokeWidth={2} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              All clear!
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              {selectedDate.isSame(moment(), 'day')
                ? "You have no tasks for today"
                : `No tasks for ${selectedDate.format('MMM D')}`}
            </Text>
            <View style={styles.emptyActions}>
              <TouchableOpacity
                style={[styles.primaryActionButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddTodo}
              >
                <Plus size={20} color="#fff" />
                <Text style={styles.primaryActionText}>Add Task</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryActionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={onRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={[styles.secondaryActionText, { color: theme.colors.primary }]}>
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.listContainer}>
              {renderCollapsibleSection('Incomplete', incompleteTodos, incompleteCollapsed, setIncompleteCollapsed)}
              {renderCollapsibleSection('Completed', completedTodos, completedCollapsed, setCompletedCollapsed)}
              <Text style={[styles.pullToRefreshText, { color: theme.colors.textSecondary }]}>
                pull to refresh
              </Text>
            </View>
          </ScrollView>
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
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 0,
    paddingHorizontal: 20,
  },
  pullToRefreshText: {
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.6,
  },
  weekContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  weekScrollContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginHorizontal: 2,
    borderRadius: 8,
    width: 40,
    height: 56,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayAbbreviation: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 12,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionContent: {
    paddingTop: 8,
  },
});