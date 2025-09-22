import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  // Request notification permissions
  async requestPermissions() {
    try {
      if (!Device.isDevice) {
        console.warn('Notifications only work on physical devices');
        return { granted: false, error: 'Physical device required' };
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return { granted: false, error: 'Permission not granted' };
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'ADHD Todo Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B6B',
          description: 'Notifications for your todo tasks and reminders',
        });
      }

      return { granted: true, error: null };
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return { granted: false, error: error.message };
    }
  },

  // Schedule notification for a todo based on alert_minutes
  async scheduleNotificationForTodo(todo) {
    try {
      const permission = await this.requestPermissions();
      if (!permission.granted) {
        throw new Error('Notification permissions not granted');
      }

      // Skip if no alert times or no due date
      if (!todo.alert_minutes || !Array.isArray(todo.alert_minutes) || !todo.due_date) {
        return { notificationIds: [], error: null };
      }

      const dueDate = new Date(todo.due_date);
      const now = new Date();
      const notificationIds = [];

      // Schedule notifications for each alert time
      for (const minutes of todo.alert_minutes) {
        const notificationTime = new Date(dueDate.getTime() - (minutes * 60 * 1000));

        // Only schedule if notification time is in the future
        if (notificationTime > now) {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: this.getNotificationTitle(todo, minutes),
              body: this.getNotificationBody(todo, minutes),
              data: {
                todoId: todo.id,
                alertMinutes: minutes,
                type: 'todo_reminder'
              },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
              date: notificationTime,
            },
          });

          notificationIds.push(notificationId);
          console.log(`Scheduled notification ${notificationId} for todo "${todo.title}" at ${notificationTime.toLocaleString()}`);
        }
      }

      return { notificationIds, error: null };
    } catch (error) {
      console.error('Error scheduling notification for todo:', error);
      return { notificationIds: [], error: error.message };
    }
  },

  // Schedule multiple notifications for todos
  async scheduleNotificationsForTodos(todos) {
    try {
      const results = [];

      for (const todo of todos) {
        if (!todo.completed) { // Only schedule for incomplete todos
          const result = await this.scheduleNotificationForTodo(todo);
          results.push({
            todoId: todo.id,
            ...result
          });
        }
      }

      return { results, error: null };
    } catch (error) {
      console.error('Error scheduling notifications for todos:', error);
      return { results: [], error: error.message };
    }
  },

  // Cancel all notifications for a specific todo
  async cancelNotificationsForTodo(todoId) {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const todoNotifications = scheduledNotifications.filter(
        notification => notification.content.data?.todoId === todoId
      );

      for (const notification of todoNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        console.log(`Cancelled notification ${notification.identifier} for todo ${todoId}`);
      }

      return { cancelledCount: todoNotifications.length, error: null };
    } catch (error) {
      console.error('Error cancelling notifications for todo:', error);
      return { cancelledCount: 0, error: error.message };
    }
  },

  // Cancel all scheduled notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all scheduled notifications');
      return { error: null };
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      return { error: error.message };
    }
  },

  // Get all scheduled notifications
  async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return { notifications, error: null };
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return { notifications: [], error: error.message };
    }
  },

  // Reschedule notifications for a todo (useful when updating)
  async rescheduleNotificationsForTodo(todo) {
    try {
      // First cancel existing notifications
      await this.cancelNotificationsForTodo(todo.id);

      // Then schedule new ones
      const result = await this.scheduleNotificationForTodo(todo);
      return result;
    } catch (error) {
      console.error('Error rescheduling notifications for todo:', error);
      return { notificationIds: [], error: error.message };
    }
  },

  // Get notification title based on alert timing
  getNotificationTitle(todo, alertMinutes) {
    const priorityEmoji = this.getPriorityEmoji(todo.priority);

    if (alertMinutes === 0) {
      return `${priorityEmoji} Todo Due Now!`;
    } else if (alertMinutes < 60) {
      return `${priorityEmoji} Todo Due in ${alertMinutes} minutes`;
    } else if (alertMinutes < 1440) {
      const hours = Math.floor(alertMinutes / 60);
      return `${priorityEmoji} Todo Due in ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(alertMinutes / 1440);
      return `${priorityEmoji} Todo Due in ${days} day${days > 1 ? 's' : ''}`;
    }
  },

  // Get notification body text
  getNotificationBody(todo, alertMinutes) {
    let body = `"${todo.title}"`;

    if (todo.location) {
      body += `\n📍 ${todo.location}`;
    }

    if (todo.category) {
      body += `\n🏷️ ${todo.category}`;
    }

    if (alertMinutes === 0) {
      body += '\n⏰ This task is due now!';
    }

    return body;
  },

  // Get emoji based on priority
  getPriorityEmoji(priority) {
    switch (priority) {
      case 2: return '🔴'; // High
      case 1: return '🟡'; // Medium
      case 0: return '🟢'; // Low
      default: return '📋';
    }
  },

  // Get notification listener that can be used in components
  getNotificationListener() {
    return Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Handle notification received while app is in foreground
    });
  },

  // Get response listener for when user taps on notification
  getNotificationResponseListener() {
    return Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      const { todoId, type } = response.notification.request.content.data || {};

      if (type === 'todo_reminder' && todoId) {
        // You can navigate to the specific todo or perform other actions
        console.log(`User tapped notification for todo: ${todoId}`);
      }
    });
  },

  // Test notification (useful for development)
  async sendTestNotification() {
    try {
      const permission = await this.requestPermissions();
      if (!permission.granted) {
        throw new Error('Notification permissions not granted');
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧠 ADHD Todo Test',
          body: 'Your notification system is working perfectly!',
          data: { type: 'test' },
        },
        trigger: { seconds: 1 },
      });

      return { success: true, error: null };
    } catch (error) {
      console.error('Error sending test notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Daily reminder for incomplete todos
  async scheduleDailyReminder(time = { hour: 9, minute: 0 }) {
    try {
      const permission = await this.requestPermissions();
      if (!permission.granted) {
        throw new Error('Notification permissions not granted');
      }

      // Cancel existing daily reminder
      await this.cancelDailyReminder();

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧠 Daily ADHD Todo Check-in',
          body: 'Ready to tackle your tasks today? Check your todo list!',
          data: { type: 'daily_reminder' },
        },
        trigger: {
          hour: time.hour,
          minute: time.minute,
          repeats: true,
        },
      });

      console.log(`Scheduled daily reminder at ${time.hour}:${time.minute.toString().padStart(2, '0')}`);
      return { notificationId, error: null };
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
      return { notificationId: null, error: error.message };
    }
  },

  // Cancel daily reminder
  async cancelDailyReminder() {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const dailyReminders = scheduledNotifications.filter(
        notification => notification.content.data?.type === 'daily_reminder'
      );

      for (const notification of dailyReminders) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      return { error: null };
    } catch (error) {
      console.error('Error cancelling daily reminder:', error);
      return { error: error.message };
    }
  }
};