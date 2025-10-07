import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Plus, Clock, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import useDailyScheduleStore from '../../stores/dailyScheduleStore';
import useAuthStore from '../../stores/authStore';
import BackButton from '../../components/BackButton';

export default function DailyScheduleScreen({ navigation }) {
  const { theme } = useTheme();
  const { deleteScheduleTask, getSortedScheduleTasks, loadScheduleFromDB } = useDailyScheduleStore();
  const { user } = useAuthStore();

  // Load schedule from database when screen loads
  useEffect(() => {
    if (user?.id) {
      loadScheduleFromDB(user.id);
    }
  }, [user?.id]);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadScheduleFromDB(user.id);
      }
    }, [user?.id])
  );

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('AddDailySchedule');
  };

  const handleTaskPress = (task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('EditDailySchedule', { task });
  };

  const handleDeleteTask = (id, title) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteScheduleTask(id, user?.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const formatTime = (time) => {
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderScheduleItem = ({ item }) => (
    <View style={[styles.scheduleItem, {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border
    }]}>
      <TouchableOpacity
        style={styles.scheduleItemContent}
        onPress={() => handleTaskPress(item)}
      >
        <View style={styles.timeContainer}>
          <Clock size={20} color={theme.colors.primary} />
          <Text style={[styles.timeText, { color: theme.colors.primary }]}>
            {formatTime(item.time)}
          </Text>
        </View>
        <Text style={[styles.taskTitle, { color: theme.colors.text }]}>
          {item.title}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteTask(item.id, item.title)}
      >
        <Trash2 size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  const sortedTasks = getSortedScheduleTasks();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BackButton onPress={() => navigation.goBack()} />
            <Text style={[styles.title, { color: theme.colors.text }]}>Daily Schedule</Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddPress}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <FlashList
          data={sortedTasks}
          renderItem={renderScheduleItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={80}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No schedule tasks yet. Tap the + button to add one!
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginLeft: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  scheduleItemContent: {
    flex: 1,
    gap: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
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
