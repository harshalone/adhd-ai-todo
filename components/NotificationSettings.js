import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { Bell, BellOff, TestTube, Clock, RefreshCw } from 'lucide-react-native';

export default function NotificationSettings() {
  const { theme } = useTheme();
  const {
    permissionGranted,
    isLoading,
    error,
    requestPermissions,
    sendTestNotification,
    getScheduledNotifications,
    cancelAllNotifications,
    scheduleDailyReminder,
    cancelDailyReminder
  } = useNotifications();

  const [scheduledCount, setScheduledCount] = useState(0);
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState({ hour: 9, minute: 0 });

  useEffect(() => {
    loadNotificationStatus();
  }, []);

  const loadNotificationStatus = async () => {
    const result = await getScheduledNotifications();
    if (result.success) {
      setScheduledCount(result.notifications.length);

      // Check if daily reminder is enabled
      const dailyReminder = result.notifications.find(
        n => n.content.data?.type === 'daily_reminder'
      );
      setDailyReminderEnabled(!!dailyReminder);
    }
  };

  const handleRequestPermissions = async () => {
    const result = await requestPermissions();
    if (result.success) {
      Alert.alert('Success', 'Notification permissions granted!');
    } else {
      Alert.alert('Error', result.error || 'Failed to get permissions');
    }
  };

  const handleTestNotification = async () => {
    const result = await sendTestNotification();
    if (result.success) {
      Alert.alert('Test Sent', 'Check your notifications in a few seconds!');
    } else {
      Alert.alert('Error', result.error || 'Failed to send test notification');
    }
  };

  const handleClearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'This will cancel all scheduled notifications. You can reschedule them by refreshing your todo list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const result = await cancelAllNotifications();
            if (result.success) {
              setScheduledCount(0);
              Alert.alert('Success', 'All notifications cleared');
            } else {
              Alert.alert('Error', result.error || 'Failed to clear notifications');
            }
          }
        }
      ]
    );
  };

  const handleDailyReminderToggle = async (enabled) => {
    if (enabled) {
      const result = await scheduleDailyReminder(reminderTime);
      if (result.success) {
        setDailyReminderEnabled(true);
        Alert.alert('Success', `Daily reminder set for ${reminderTime.hour}:${reminderTime.minute.toString().padStart(2, '0')}`);
      } else {
        Alert.alert('Error', result.error || 'Failed to schedule daily reminder');
      }
    } else {
      const result = await cancelDailyReminder();
      if (result.success) {
        setDailyReminderEnabled(false);
        Alert.alert('Success', 'Daily reminder cancelled');
      } else {
        Alert.alert('Error', result.error || 'Failed to cancel daily reminder');
      }
    }
  };

  const handleRefreshStatus = async () => {
    await loadNotificationStatus();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Permission Status */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              {permissionGranted ? (
                <Bell size={24} color={theme.colors.primary} />
              ) : (
                <BellOff size={24} color={theme.colors.textSecondary} />
              )}
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Notification Permissions
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                {permissionGranted ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>

          {!permissionGranted && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={handleRequestPermissions}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Grant Permissions</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notification Status */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Clock size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Scheduled Notifications
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                {scheduledCount} active notifications
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: theme.colors.background }]}
              onPress={handleRefreshStatus}
              disabled={isLoading}
            >
              <RefreshCw size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Reminder */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Clock size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Daily Reminder
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                Get reminded to check your todos
              </Text>
            </View>
            <Switch
              value={dailyReminderEnabled}
              onValueChange={handleDailyReminderToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={dailyReminderEnabled ? theme.colors.primary : theme.colors.textSecondary}
              disabled={!permissionGranted || isLoading}
            />
          </View>
        </View>

        {/* Test Notification */}
        {permissionGranted && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <TestTube size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Test Notification
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                  Send a test notification to check if everything works
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={handleTestNotification}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Send Test</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Clear All Notifications */}
        {permissionGranted && scheduledCount > 0 && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={[styles.dangerButton, { borderColor: '#FF6B6B' }]}
              onPress={handleClearAllNotifications}
              disabled={isLoading}
            >
              <Text style={[styles.dangerButtonText, { color: '#FF6B6B' }]}>
                Clear All Notifications
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: '#FFE5E5' }]}>
            <Text style={[styles.errorText, { color: '#D32F2F' }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Info */}
        <View style={[styles.infoContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
            How Notifications Work
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            • Notifications are automatically scheduled when you create todos with alert times{'\n'}
            • High priority todos show a red indicator 🔴{'\n'}
            • Medium priority todos show a yellow indicator 🟡{'\n'}
            • Low priority todos show a green indicator 🟢{'\n'}
            • Notifications include location and category if set{'\n'}
            • Completing or deleting todos automatically cancels their notifications
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  infoContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});