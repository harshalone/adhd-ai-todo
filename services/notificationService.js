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

      // Skip if no alert times
      if (!todo.alert_minutes || !Array.isArray(todo.alert_minutes)) {
        return { notificationIds: [], error: null };
      }

      // Get the proper due date and time combination
      const dueDateTime = this.getTodoDateTime(todo);
      if (!dueDateTime) {
        console.log(`Skipping notification for todo "${todo.title}" - no valid date found`);
        return { notificationIds: [], error: null };
      }

      const now = new Date();
      const notificationIds = [];

      // Enhanced date validation - ensure we're not scheduling for past dates
      const moment = require('moment');
      const today = moment().startOf('day');

      // Extract the date part from dueDateTime and compare properly
      const dueDateOnly = moment(dueDateTime).startOf('day');

      // Skip scheduling if the due DATE is before today (not just datetime)
      if (dueDateOnly.isBefore(today)) {
        console.log(`🚫 Skipping notification for todo "${todo.title}" - due date ${dueDateOnly.format('YYYY-MM-DD')} is before today ${today.format('YYYY-MM-DD')}`);
        return { notificationIds: [], error: null };
      }

      // Also skip if the specific due datetime is in the past
      if (dueDateTime <= now) {
        console.log(`⏰ Skipping notification for todo "${todo.title}" - due date/time is in the past (${dueDateTime.toLocaleString()})`);
        return { notificationIds: [], error: null };
      }

      // Check if notifications are already scheduled for this todo to avoid duplicates
      const existingNotifications = await this.getExistingNotificationsForTodo(todo.id);
      if (existingNotifications.length > 0) {
        console.log(`🔄 Found ${existingNotifications.length} existing notifications for todo "${todo.title}" - skipping duplicate scheduling`);
        return { notificationIds: existingNotifications.map(n => n.identifier), error: null };
      }

      // Schedule notifications for each alert time
      for (const minutes of todo.alert_minutes) {
        const notificationTime = new Date(dueDateTime.getTime() - (minutes * 60 * 1000));

        // Only schedule if notification time is in the future
        if (notificationTime > now) {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: this.getNotificationTitle(todo, minutes),
              body: this.getNotificationBody(todo, minutes),
              data: {
                todoId: todo.id,
                alertMinutes: minutes,
                type: 'todo_reminder',
                scheduledAt: new Date().toISOString(),
                dueDateTime: dueDateTime.toISOString(),
              },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              badge: 1,
            },
            trigger: {
              date: notificationTime,
            },
          });

          notificationIds.push(notificationId);
          console.log(`✅ Scheduled notification ${notificationId} for todo "${todo.title}" at ${notificationTime.toLocaleString()} (${minutes} min before due time)`);
        } else {
          console.log(`⏭️ Skipped notification for todo "${todo.title}" - ${minutes} min alert time (${notificationTime.toLocaleString()}) is in the past`);
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

  // Get existing notifications for a specific todo
  async getExistingNotificationsForTodo(todoId) {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      return scheduledNotifications.filter(
        notification => notification.content.data?.todoId === todoId
      );
    } catch (error) {
      console.error('Error getting existing notifications for todo:', error);
      return [];
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
    const timeContext = this.getTimeContext(todo);

    if (alertMinutes === 0) {
      return `${priorityEmoji} ${timeContext} Now!`;
    } else if (alertMinutes < 60) {
      return `${priorityEmoji} ${timeContext} in ${alertMinutes} min`;
    } else if (alertMinutes < 1440) {
      const hours = Math.floor(alertMinutes / 60);
      const remainingMinutes = alertMinutes % 60;
      const timeStr = remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
      return `${priorityEmoji} ${timeContext} in ${timeStr}`;
    } else {
      const days = Math.floor(alertMinutes / 1440);
      const remainingHours = Math.floor((alertMinutes % 1440) / 60);
      const timeStr = remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
      return `${priorityEmoji} ${timeContext} in ${timeStr}`;
    }
  },

  // Get contextual time-based title
  getTimeContext(todo) {
    if (todo.start_time || todo.due_time) {
      return 'Task Starting';
    }
    return 'Task Due';
  },

  // Get notification body text
  getNotificationBody(todo, alertMinutes) {
    let body = `"${todo.title}"`;

    // Add time information if available
    const timeInfo = this.getTimeInfo(todo);
    if (timeInfo) {
      body += `\n⏰ ${timeInfo}`;
    }

    // Add location with smart context
    if (todo.location) {
      const locationEmoji = this.getLocationEmoji(todo.location);
      body += `\n${locationEmoji} ${todo.location}`;
    }

    // Add category with appropriate emoji
    if (todo.category) {
      const categoryEmoji = this.getCategoryEmoji(todo.category);
      body += `\n${categoryEmoji} ${todo.category}`;
    }

    // Add urgency context for immediate notifications
    if (alertMinutes === 0) {
      body += '\n🚨 Action needed now!';
    } else if (alertMinutes <= 15) {
      body += '\n⚡ Time to prepare!';
    }

    // Add estimated duration if available
    if (todo.duration_minutes) {
      const duration = this.formatDuration(todo.duration_minutes);
      body += `\n⌛ Estimated: ${duration}`;
    }

    return body;
  },

  // Get formatted time information
  getTimeInfo(todo) {
    const moment = require('moment');

    if (todo.start_time && todo.end_time) {
      return `${todo.start_time} - ${todo.end_time}`;
    } else if (todo.start_time) {
      return `Starts at ${todo.start_time}`;
    } else if (todo.due_time) {
      return `Due at ${todo.due_time}`;
    }
    return null;
  },

  // Get smart emoji for locations
  getLocationEmoji(location) {
    const loc = location.toLowerCase();
    if (loc.includes('gym') || loc.includes('fitness')) return '🏋️';
    if (loc.includes('office') || loc.includes('work')) return '🏢';
    if (loc.includes('home')) return '🏠';
    if (loc.includes('store') || loc.includes('shop')) return '🛒';
    if (loc.includes('school') || loc.includes('university')) return '🎓';
    if (loc.includes('hospital') || loc.includes('doctor')) return '🏥';
    if (loc.includes('restaurant') || loc.includes('cafe')) return '🍽️';
    if (loc.includes('bank')) return '🏦';
    if (loc.includes('park')) return '🌳';
    return '📍';
  },

  // Get smart emoji for categories
  getCategoryEmoji(category) {
    const cat = category.toLowerCase();
    if (cat.includes('work') || cat.includes('job')) return '💼';
    if (cat.includes('health') || cat.includes('medical')) return '⚕️';
    if (cat.includes('exercise') || cat.includes('fitness')) return '🏋️';
    if (cat.includes('study') || cat.includes('education')) return '📚';
    if (cat.includes('family') || cat.includes('personal')) return '👨‍👩‍👧‍👦';
    if (cat.includes('shopping')) return '🛒';
    if (cat.includes('finance') || cat.includes('money')) return '💰';
    if (cat.includes('travel')) return '✈️';
    if (cat.includes('home') || cat.includes('house')) return '🏠';
    return '🏷️';
  },

  // Format duration in a human-readable way
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes}min`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
  },

  // Get the proper date/time for a todo by checking various combinations
  getTodoDateTime(todo) {
    const moment = require('moment');

    // Priority order for date/time combinations:
    // 1. start_date + start_time
    // 2. due_date + start_time
    // 3. start_date + due_time (from AI todos)
    // 4. due_date + due_time (from AI todos)
    // 5. due_date only (set to end of day for notifications)
    // 6. start_date only (set to end of day for notifications)

    // Add debug logging to understand what data we're working with
    console.log(`📅 Processing todo "${todo.title}":`, {
      start_date: todo.start_date,
      due_date: todo.due_date,
      start_time: todo.start_time,
      due_time: todo.due_time,
      end_time: todo.end_time
    });

    if (todo.start_date && todo.start_time) {
      const dateTime = moment(`${todo.start_date} ${todo.start_time}`, 'YYYY-MM-DD HH:mm', true); // strict parsing
      if (dateTime.isValid()) {
        console.log(`✅ Using start_date + start_time: ${dateTime.format()} from database date ${todo.start_date} time ${todo.start_time}`);
        return dateTime.toDate();
      } else {
        console.log(`❌ Invalid start_date + start_time format: ${todo.start_date} ${todo.start_time}`);
      }
    }

    if (todo.due_date && todo.start_time) {
      const dateTime = moment(`${todo.due_date} ${todo.start_time}`, 'YYYY-MM-DD HH:mm', true); // strict parsing
      if (dateTime.isValid()) {
        console.log(`✅ Using due_date + start_time: ${dateTime.format()} from database date ${todo.due_date} time ${todo.start_time}`);
        return dateTime.toDate();
      } else {
        console.log(`❌ Invalid due_date + start_time format: ${todo.due_date} ${todo.start_time}`);
      }
    }

    // Handle AI-generated todos that might have due_time
    if (todo.start_date && todo.due_time) {
      const dateTime = moment(`${todo.start_date} ${todo.due_time}`, 'YYYY-MM-DD HH:mm', true); // strict parsing
      if (dateTime.isValid()) {
        console.log(`✅ Using start_date + due_time: ${dateTime.format()} from database date ${todo.start_date} time ${todo.due_time}`);
        return dateTime.toDate();
      } else {
        console.log(`❌ Invalid start_date + due_time format: ${todo.start_date} ${todo.due_time}`);
      }
    }

    if (todo.due_date && todo.due_time) {
      const dateTime = moment(`${todo.due_date} ${todo.due_time}`, 'YYYY-MM-DD HH:mm', true); // strict parsing
      if (dateTime.isValid()) {
        console.log(`✅ Using due_date + due_time: ${dateTime.format()} from database date ${todo.due_date} time ${todo.due_time}`);
        return dateTime.toDate();
      } else {
        console.log(`❌ Invalid due_date + due_time format: ${todo.due_date} ${todo.due_time}`);
      }
    }

    // Fall back to just date - set to a reasonable time (9 PM) for notifications
    if (todo.due_date) {
      const dateTime = moment(todo.due_date, 'YYYY-MM-DD', true).hour(21).minute(0).second(0); // strict parsing
      if (dateTime.isValid()) {
        console.log(`✅ Using due_date only (9 PM): ${dateTime.format()} from database date ${todo.due_date}`);
        return dateTime.toDate();
      } else {
        console.log(`❌ Invalid due_date format: ${todo.due_date}`);
      }
    }

    if (todo.start_date) {
      const dateTime = moment(todo.start_date, 'YYYY-MM-DD', true).hour(21).minute(0).second(0); // strict parsing
      if (dateTime.isValid()) {
        console.log(`✅ Using start_date only (9 PM): ${dateTime.format()} from database date ${todo.start_date}`);
        return dateTime.toDate();
      } else {
        console.log(`❌ Invalid start_date format: ${todo.start_date}`);
      }
    }

    console.log(`❌ No valid date/time found for todo "${todo.title}"`);
    return null;
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

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧠 ADHD Todo Test',
          body: 'Your notification system is working perfectly!',
          data: { type: 'test' },
        },
        trigger: { seconds: 1 },
      });

      console.log(`✅ Test notification scheduled with ID: ${notificationId}`);
      return { success: true, notificationId, error: null };
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Debug: Get detailed notification status
  async getNotificationDebugInfo() {
    try {
      const permissions = await Notifications.getPermissionsAsync();
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();

      const debugInfo = {
        permissions: {
          status: permissions.status,
          canAskAgain: permissions.canAskAgain,
          granted: permissions.granted,
        },
        scheduledCount: scheduled.length,
        scheduledNotifications: scheduled.map(notification => ({
          id: notification.identifier,
          title: notification.content.title,
          body: notification.content.body,
          scheduledTime: notification.trigger.date ? new Date(notification.trigger.date).toLocaleString() : 'Unknown',
          todoId: notification.content.data?.todoId,
          alertMinutes: notification.content.data?.alertMinutes,
          type: notification.content.data?.type,
        })),
        groupedByTodo: this.groupNotificationsByTodo(scheduled),
      };

      console.log('📊 Notification Debug Info:', JSON.stringify(debugInfo, null, 2));
      return { debugInfo, error: null };
    } catch (error) {
      console.error('❌ Error getting debug info:', error);
      return { debugInfo: null, error: error.message };
    }
  },

  // Group notifications by todo for easier debugging
  groupNotificationsByTodo(notifications) {
    const grouped = {};
    notifications.forEach(notification => {
      const todoId = notification.content.data?.todoId;
      if (todoId) {
        if (!grouped[todoId]) {
          grouped[todoId] = [];
        }
        grouped[todoId].push({
          id: notification.identifier,
          alertMinutes: notification.content.data?.alertMinutes,
          scheduledTime: notification.trigger.date ? new Date(notification.trigger.date).toLocaleString() : 'Unknown',
        });
      }
    });
    return grouped;
  },

  // Validate and clean up orphaned notifications
  async validateAndCleanupNotifications() {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const now = new Date();
      let cleanedCount = 0;

      console.log(`🔍 Validating ${scheduled.length} scheduled notifications...`);

      for (const notification of scheduled) {
        // Remove notifications scheduled in the past (shouldn't happen but safety net)
        if (notification.trigger.date && new Date(notification.trigger.date) <= now) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          cleanedCount++;
          console.log(`🗑️ Removed past notification: ${notification.identifier}`);
        }
      }

      console.log(`✅ Cleanup complete. Removed ${cleanedCount} outdated notifications.`);
      return { cleanedCount, error: null };
    } catch (error) {
      console.error('❌ Error during notification cleanup:', error);
      return { cleanedCount: 0, error: error.message };
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
  },

  // Smart suggestion for notification times based on todo context
  getSuggestedNotificationTimes(todo) {
    const suggestions = [];

    // Get category-based suggestions
    if (todo.category) {
      const cat = todo.category.toLowerCase();

      if (cat.includes('work') || cat.includes('meeting')) {
        // Work tasks: 15 min, 1 hour before
        suggestions.push(15, 60);
      } else if (cat.includes('exercise') || cat.includes('gym')) {
        // Exercise: 30 min, 2 hours before (time to prepare/change)
        suggestions.push(30, 120);
      } else if (cat.includes('appointment') || cat.includes('doctor')) {
        // Appointments: 30 min, 24 hours before
        suggestions.push(30, 1440);
      } else if (cat.includes('travel') || cat.includes('trip')) {
        // Travel: 1 hour, 1 day before
        suggestions.push(60, 1440);
      } else if (cat.includes('shopping')) {
        // Shopping: 1 hour before
        suggestions.push(60);
      }
    }

    // Get location-based suggestions
    if (todo.location) {
      const loc = todo.location.toLowerCase();

      if (loc.includes('gym') || loc.includes('fitness')) {
        if (!suggestions.includes(30)) suggestions.push(30);
        if (!suggestions.includes(120)) suggestions.push(120);
      } else if (loc.includes('office') || loc.includes('work')) {
        if (!suggestions.includes(15)) suggestions.push(15);
        if (!suggestions.includes(60)) suggestions.push(60);
      }
    }

    // Get priority-based suggestions
    if (todo.priority === 2) { // High priority
      if (!suggestions.includes(15)) suggestions.push(15);
      if (!suggestions.includes(60)) suggestions.push(60);
      if (!suggestions.includes(1440)) suggestions.push(1440);
    } else if (todo.priority === 1) { // Medium priority
      if (!suggestions.includes(30)) suggestions.push(30);
      if (!suggestions.includes(60)) suggestions.push(60);
    } else { // Low priority
      if (!suggestions.includes(60)) suggestions.push(60);
    }

    // Default suggestions if none were added
    if (suggestions.length === 0) {
      suggestions.push(15, 60); // 15 min and 1 hour before
    }

    return suggestions.sort((a, b) => a - b); // Sort ascending
  }
};