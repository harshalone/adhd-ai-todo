import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { notificationService } from '../services/notificationService';
import { Bell, AlertCircle, CheckCircle, RefreshCw, Bug, Trash2 } from 'lucide-react-native';

export default function NotificationDiagnostics({ visible, onClose }) {
  const { theme } = useTheme();
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadDebugInfo();
    }
  }, [visible]);

  const loadDebugInfo = async () => {
    setLoading(true);
    try {
      const result = await notificationService.getNotificationDebugInfo();
      if (result.debugInfo) {
        setDebugInfo(result.debugInfo);
      }
    } catch (error) {
      console.error('Error loading debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  const runTestNotification = async () => {
    setLoading(true);
    try {
      const result = await notificationService.sendTestNotification();
      if (result.success) {
        Alert.alert('✅ Success', 'Test notification sent! You should receive it in a few seconds.');
      } else {
        Alert.alert('❌ Error', result.error || 'Failed to send test notification');
      }
    } catch (error) {
      Alert.alert('❌ Error', 'Failed to send test notification');
    } finally {
      setLoading(false);
      setTimeout(loadDebugInfo, 2000); // Refresh after test
    }
  };

  const cleanupNotifications = async () => {
    Alert.alert(
      'Clean Up Notifications',
      'This will remove all outdated notifications. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean Up',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await notificationService.validateAndCleanupNotifications();
              Alert.alert('✅ Cleanup Complete', `Removed ${result.cleanedCount} outdated notifications.`);
              await loadDebugInfo();
            } catch (error) {
              Alert.alert('❌ Error', 'Failed to cleanup notifications');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const clearAllNotifications = async () => {
    Alert.alert(
      '⚠️ Clear All Notifications',
      'This will cancel ALL scheduled notifications. You will need to restart the app to reschedule them. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await notificationService.cancelAllNotifications();
              Alert.alert('✅ Cleared', 'All notifications have been cancelled.');
              await loadDebugInfo();
            } catch (error) {
              Alert.alert('❌ Error', 'Failed to clear notifications');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          <Bug size={20} color={theme.colors.primary} /> Notification Diagnostics
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={[styles.closeText, { color: theme.colors.primary }]}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Permission Status */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            <Bell size={16} color={theme.colors.primary} /> Permissions
          </Text>
          {debugInfo?.permissions ? (
            <View style={styles.statusRow}>
              {debugInfo.permissions.granted ? (
                <CheckCircle size={16} color="#22c55e" />
              ) : (
                <AlertCircle size={16} color="#ef4444" />
              )}
              <Text style={[styles.statusText, { color: theme.colors.text }]}>
                {debugInfo.permissions.granted ? 'Granted' : `Not Granted (${debugInfo.permissions.status})`}
              </Text>
            </View>
          ) : (
            <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>Loading...</Text>
          )}
        </View>

        {/* Scheduled Notifications */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Scheduled Notifications
          </Text>
          <Text style={[styles.countText, { color: theme.colors.primary }]}>
            {debugInfo?.scheduledCount || 0} notifications scheduled
          </Text>

          {debugInfo?.scheduledNotifications?.map((notification, index) => (
            <View key={index} style={[styles.notificationItem, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.notificationTitle, { color: theme.colors.text }]} numberOfLines={1}>
                {notification.title}
              </Text>
              <Text style={[styles.notificationTime, { color: theme.colors.textSecondary }]}>
                {notification.scheduledTime}
              </Text>
              <Text style={[styles.notificationMeta, { color: theme.colors.textSecondary }]}>
                Todo ID: {notification.todoId} • Alert: {notification.alertMinutes}min
              </Text>
            </View>
          ))}

          {debugInfo?.scheduledCount === 0 && (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No notifications are currently scheduled.
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={runTestNotification}
            disabled={loading}
          >
            <Bell size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Send Test Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={loadDebugInfo}
            disabled={loading}
          >
            <RefreshCw size={16} color={theme.colors.primary} />
            <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Refresh Info</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={cleanupNotifications}
            disabled={loading}
          >
            <Trash2 size={16} color="#f59e0b" />
            <Text style={[styles.actionButtonText, { color: '#f59e0b' }]}>Cleanup Old</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
            onPress={clearAllNotifications}
            disabled={loading}
          >
            <Trash2 size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Troubleshooting Tips */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            💡 Troubleshooting Tips
          </Text>
          <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
            • Make sure notifications are enabled in your device settings{'\n'}
            • Check that your todos have both dates and alert times set{'\n'}
            • Restart the app if notifications aren't working{'\n'}
            • On iOS, notifications may not appear if the app is in foreground{'\n'}
            • Past-due notifications are automatically cleaned up
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  notificationItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    marginBottom: 2,
  },
  notificationMeta: {
    fontSize: 11,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});