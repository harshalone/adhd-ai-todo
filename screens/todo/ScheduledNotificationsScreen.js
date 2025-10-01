import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, Clock, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import useNotificationStore from '../../stores/notificationStore';
import { notificationService } from '../../services/notificationService';
import moment from 'moment';

export default function ScheduledNotificationsScreen({ navigation }) {
  const { theme } = useTheme();
  const { getSortedNotifications, removeNotification } = useNotificationStore();
  const notifications = getSortedNotifications();

  const handleDeleteNotification = async (item) => {
    try {
      // Cancel native device notification
      await notificationService.cancelNotificationsForTodo(item.todoId, item.todoUid);

      // Remove from store
      removeNotification(item.todoUid || item.todoId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const renderNotification = ({ item }) => {
    const scheduledTime = moment(item.scheduledTime);
    const isToday = scheduledTime.isSame(moment(), 'day');
    const isTomorrow = scheduledTime.isSame(moment().add(1, 'day'), 'day');

    let dateLabel = scheduledTime.format('MMM D, YYYY');
    if (isToday) dateLabel = 'Today';
    else if (isTomorrow) dateLabel = 'Tomorrow';

    const timeLabel = scheduledTime.format('h:mm A');

    return (
      <View style={[styles.notificationCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={styles.notificationHeader}>
          <View style={[styles.bellIcon, { backgroundColor: '#FF6B6B' }]}>
            <Bell size={16} color="#fff" />
          </View>
          <View style={styles.notificationInfo}>
            <Text style={[styles.notificationTitle, { color: theme.colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={[styles.notificationDescription, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteNotification(item)}
            style={styles.deleteButton}
          >
            <Trash2 size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
        <View style={styles.notificationFooter}>
          <View style={styles.timeContainer}>
            <Clock size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
              {dateLabel} at {timeLabel}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.surface }]}>
        <Bell size={48} color={theme.colors.textSecondary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No Upcoming Notifications
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Your scheduled notifications will appear here
      </Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={39} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Notifications</Text>
      </View>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.todoUid || item.todoId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  notificationCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bellIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  notificationInfo: {
    flex: 1,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
