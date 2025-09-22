import { useState, useEffect, useRef } from 'react';
import { notificationService } from '../services/notificationService';

export const useNotifications = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Initialize notification permissions and listeners
  useEffect(() => {
    initializeNotifications();

    // Set up notification listeners
    notificationListener.current = notificationService.getNotificationListener();
    responseListener.current = notificationService.getNotificationResponseListener();

    // Cleanup listeners on unmount
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const initializeNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await notificationService.requestPermissions();
      setPermissionGranted(result.granted);

      if (!result.granted) {
        setError(result.error || 'Notification permissions not granted');
      }
    } catch (err) {
      setError(err.message);
      setPermissionGranted(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Schedule notifications for a single todo
  const scheduleNotificationForTodo = async (todo) => {
    if (!permissionGranted) {
      const result = await notificationService.requestPermissions();
      if (!result.granted) {
        setError('Notification permissions required');
        return { success: false, error: 'Permissions not granted' };
      }
      setPermissionGranted(true);
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await notificationService.scheduleNotificationForTodo(todo);

      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return {
        success: true,
        notificationIds: result.notificationIds,
        error: null
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Schedule notifications for multiple todos
  const scheduleNotificationsForTodos = async (todos) => {
    if (!permissionGranted) {
      const result = await notificationService.requestPermissions();
      if (!result.granted) {
        setError('Notification permissions required');
        return { success: false, error: 'Permissions not granted' };
      }
      setPermissionGranted(true);
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await notificationService.scheduleNotificationsForTodos(todos);

      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return {
        success: true,
        results: result.results,
        error: null
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel notifications for a todo
  const cancelNotificationsForTodo = async (todoId) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await notificationService.cancelNotificationsForTodo(todoId);

      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return {
        success: true,
        cancelledCount: result.cancelledCount,
        error: null
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Reschedule notifications for a todo (when updating)
  const rescheduleNotificationsForTodo = async (todo) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await notificationService.rescheduleNotificationsForTodo(todo);

      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return {
        success: true,
        notificationIds: result.notificationIds,
        error: null
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel all notifications
  const cancelAllNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await notificationService.cancelAllNotifications();

      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return { success: true, error: null };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Get scheduled notifications
  const getScheduledNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await notificationService.getScheduledNotifications();

      if (result.error) {
        setError(result.error);
        return { success: false, notifications: [], error: result.error };
      }

      return {
        success: true,
        notifications: result.notifications,
        error: null
      };
    } catch (err) {
      setError(err.message);
      return { success: false, notifications: [], error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Schedule daily reminder
  const scheduleDailyReminder = async (time = { hour: 9, minute: 0 }) => {
    if (!permissionGranted) {
      const result = await notificationService.requestPermissions();
      if (!result.granted) {
        setError('Notification permissions required');
        return { success: false, error: 'Permissions not granted' };
      }
      setPermissionGranted(true);
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await notificationService.scheduleDailyReminder(time);

      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return {
        success: true,
        notificationId: result.notificationId,
        error: null
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel daily reminder
  const cancelDailyReminder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await notificationService.cancelDailyReminder();

      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return { success: true, error: null };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    if (!permissionGranted) {
      const result = await notificationService.requestPermissions();
      if (!result.granted) {
        setError('Notification permissions required');
        return { success: false, error: 'Permissions not granted' };
      }
      setPermissionGranted(true);
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await notificationService.sendTestNotification();

      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return { success: true, error: null };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Request permissions manually
  const requestPermissions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await notificationService.requestPermissions();
      setPermissionGranted(result.granted);

      if (!result.granted) {
        setError(result.error || 'Notification permissions not granted');
      }

      return { success: result.granted, error: result.error };
    } catch (err) {
      setError(err.message);
      setPermissionGranted(false);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    permissionGranted,
    isLoading,
    error,

    // Methods
    scheduleNotificationForTodo,
    scheduleNotificationsForTodos,
    cancelNotificationsForTodo,
    rescheduleNotificationsForTodo,
    cancelAllNotifications,
    getScheduledNotifications,
    scheduleDailyReminder,
    cancelDailyReminder,
    sendTestNotification,
    requestPermissions,
  };
};