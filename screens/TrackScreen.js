import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { todosService } from '../services/todosService';
import { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Focus, LogIn } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAuthStore from '../stores/authStore';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TrackScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuthStore();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useFocusEffect(
    useCallback(() => {
      fetchTodos();
    }, [fetchTodos])
  );

  const getTasksForDate = (date) => {
    return todos.filter(todo => {
      const taskDate = todo.start_date || todo.due_date || todo.created_at;
      if (!taskDate) return false;
      return moment(taskDate).isSame(date, 'day');
    });
  };

  const getCompletionRate = (tasksForDate) => {
    if (tasksForDate.length === 0) return 0;
    const completedTasks = tasksForDate.filter(task => task.completed).length;
    return Math.round((completedTasks / tasksForDate.length) * 100);
  };

  const getDailyData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = moment().subtract(i, 'days');
      const tasksForDate = getTasksForDate(date);
      data.push({
        day: date.format('ddd'),
        rate: getCompletionRate(tasksForDate),
        total: tasksForDate.length,
        completed: tasksForDate.filter(task => task.completed).length
      });
    }
    return data;
  };

  const getWeeklyData = () => {
    const data = [];
    for (let i = 0; i < 8; i++) {
      const startOfWeek = moment().subtract(i, 'weeks').startOf('week');
      const endOfWeek = moment().subtract(i, 'weeks').endOf('week');

      const tasksForWeek = todos.filter(todo => {
        const taskDate = todo.start_date || todo.due_date || todo.created_at;
        if (!taskDate) return false;
        const taskMoment = moment(taskDate);
        return taskMoment.isBetween(startOfWeek, endOfWeek, null, '[]');
      });

      const weekLabel = i === 0 ? 'This Week' :
                      i === 1 ? 'Last Week' :
                      `${i + 1} Weeks Ago`;

      data.push({
        week: weekLabel,
        rate: getCompletionRate(tasksForWeek),
        total: tasksForWeek.length,
        completed: tasksForWeek.filter(task => task.completed).length
      });
    }
    return data;
  };

  const getMonthlyData = () => {
    const data = [];
    const currentYear = moment().year();

    MONTHS.forEach((month, index) => {
      const startOfMonth = moment().year(currentYear).month(index).startOf('month');
      const endOfMonth = moment().year(currentYear).month(index).endOf('month');

      const tasksForMonth = todos.filter(todo => {
        const taskDate = todo.start_date || todo.due_date || todo.created_at;
        if (!taskDate) return false;
        const taskMoment = moment(taskDate);
        return taskMoment.isBetween(startOfMonth, endOfMonth, null, '[]');
      });

      data.push({
        month,
        rate: getCompletionRate(tasksForMonth),
        total: tasksForMonth.length,
        completed: tasksForMonth.filter(task => task.completed).length,
        days: generateMonthDays(startOfMonth, endOfMonth)
      });
    });
    return data;
  };

  const generateMonthDays = (startOfMonth, endOfMonth) => {
    const days = [];
    const currentDate = startOfMonth.clone();

    while (currentDate.isSameOrBefore(endOfMonth)) {
      const tasksForDay = getTasksForDate(currentDate);
      const rate = getCompletionRate(tasksForDay);
      days.push({ date: currentDate.clone(), rate });
      currentDate.add(1, 'day');
    }

    // Group into weeks of 7 days each
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks.slice(0, 4); // Take first 4 weeks
  };

  const dailyData = getDailyData();
  const weeklyData = getWeeklyData();
  const monthlyData = getMonthlyData();

  const handleLoginPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Login');
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Track</Text>
        </View>

        <View style={styles.loginPromptContainer}>
          <View style={[styles.loginPromptIconContainer, { backgroundColor: theme.colors.surface }]}>
            <LogIn size={48} color={theme.colors.primary} strokeWidth={2} />
          </View>
          <Text style={[styles.loginPromptTitle, { color: theme.colors.text }]}>
            Login Required
          </Text>
          <Text style={[styles.loginPromptSubtitle, { color: theme.colors.textSecondary }]}>
            Please login to view your tracking data and progress
          </Text>
          <TouchableOpacity
            style={[styles.loginPromptButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleLoginPress}
          >
            <LogIn size={20} color="#fff" />
            <Text style={styles.loginPromptButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Track</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Focus')}
          style={styles.focusButton}
        >
          <Focus size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      {loading && (
        <View style={styles.loadingBarContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.trackContainer}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Last 7 Days</Text>
            <View style={styles.daysContainer}>
              {dailyData.map((data, index) => (
                <View key={index} style={styles.dayColumn}>
                  <View style={styles.barContainer}>
                    <View style={[styles.verticalBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                      <View style={[styles.verticalProgress, { backgroundColor: theme.colors.primary, height: `${data.rate}%` }]} />
                    </View>
                  </View>
                  <Text style={[styles.dayLabel, { color: theme.colors.textSecondary }]}>{data.day}</Text>
                  <Text style={[styles.statsLabel, { color: theme.colors.textSecondary }]}>{data.completed}/{data.total}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Last 8 Weeks</Text>
            {weeklyData.map((data, index) => (
              <View key={index} style={styles.weekRow}>
                <View style={styles.weekProgressContainer}>
                  <Text style={[styles.weekLabel, { color: theme.colors.textSecondary }]}>{data.week}</Text>
                  <View style={[styles.progressBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <View style={[styles.progress, { backgroundColor: theme.colors.primary, width: `${data.rate}%` }]} />
                  </View>
                </View>
                <Text style={[styles.statsText, { color: theme.colors.textSecondary }]}>{data.completed}/{data.total}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Whole Year</Text>
            <View style={styles.yearContainer}>
              {monthlyData.map((monthData, index) => (
                <View key={index} style={styles.monthContainer}>
                  <Text style={[styles.monthLabel, { color: theme.colors.textSecondary }]}>{monthData.month}</Text>
                  <Text style={[styles.monthStats, { color: theme.colors.textSecondary }]}>{monthData.completed}/{monthData.total}</Text>
                  <View style={styles.monthGrid}>
                    {monthData.days.map((week, rowIndex) => (
                      <View key={rowIndex} style={styles.monthRow}>
                        {week.map((day, dotIndex) => {
                          const intensity = day.rate / 100;
                          const backgroundColor = intensity > 0
                            ? `rgba(${theme.colors.primary.includes('#') ?
                                parseInt(theme.colors.primary.slice(1, 3), 16) : 0}, ${
                                theme.colors.primary.includes('#') ?
                                parseInt(theme.colors.primary.slice(3, 5), 16) : 0}, ${
                                theme.colors.primary.includes('#') ?
                                parseInt(theme.colors.primary.slice(5, 7), 16) : 0}, ${Math.max(0.1, intensity)})`
                            : theme.colors.border;

                          return (
                            <View
                              key={`${rowIndex}-${dotIndex}`}
                              style={[styles.dot, { backgroundColor }]}
                            />
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  focusButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 0,
  },
  trackContainer: {
    width: '100%',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 28,
  },
  loadingBarContainer: {
    height: 2,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    width: 60,
  },
  progressBar: {
    flex: 1,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 4,
  },
  yearContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthContainer: {
    width: '24.5%',
    marginBottom: 20,
  },
  monthLabel: {
    fontSize: 10,
    marginBottom: 8,
    fontWeight: '500',
    textAlign: 'left',
  },
  monthGrid: {
    flexDirection: 'column',
    gap: 2,
  },
  monthRow: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    gap: 8,
  },
  dayColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    height: 100,
    justifyContent: 'flex-end',
  },
  verticalBar: {
    width: 9,
    height: '100%',
    borderRadius: 4.5,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  verticalProgress: {
    width: '100%',
    borderRadius: 4,
  },
  dayLabel: {
    fontSize: 10,
    marginTop: 8,
    fontWeight: '500',
  },
  statsLabel: {
    fontSize: 8,
    marginTop: 2,
    fontWeight: '400',
  },
  statsText: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
    minWidth: 30,
  },
  monthStats: {
    fontSize: 8,
    marginBottom: 4,
    fontWeight: '400',
    textAlign: 'left',
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  weekProgressContainer: {
    flex: 1,
  },
  weekLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
  },
  loginPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loginPromptIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginPromptTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginPromptSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  loginPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  loginPromptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});