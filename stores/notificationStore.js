import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useNotificationStore = create(
  persist(
    (set, get) => ({
      // Notifications state - stored as an object with todo_id as key
      notifications: {},

      // Add or update a notification
      setNotification: (todoId, notificationData) => {
        set((state) => ({
          notifications: {
            ...state.notifications,
            [todoId]: {
              ...notificationData,
              todoId,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      // Remove a notification
      removeNotification: (todoId) => {
        set((state) => {
          const { [todoId]: removed, ...rest } = state.notifications;
          return { notifications: rest };
        });
      },

      // Update notification when todo is completed
      markNotificationCompleted: (todoId, completed, todoUid = null) => {
        set((state) => {
          const identifier = todoUid || todoId;
          const notification = state.notifications[identifier];
          if (!notification) return state;

          return {
            notifications: {
              ...state.notifications,
              [identifier]: {
                ...notification,
                completed,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      // Get all notifications sorted by scheduled time (ascending from current time)
      getSortedNotifications: () => {
        const { notifications } = get();
        const now = new Date();

        return Object.values(notifications)
          .filter((notification) => {
            // Only show notifications with a scheduled time
            if (!notification.scheduledTime) return false;

            // Optionally filter out completed ones or past notifications
            const scheduledTime = new Date(notification.scheduledTime);
            return scheduledTime >= now; // Only future notifications
          })
          .sort((a, b) => {
            const timeA = new Date(a.scheduledTime);
            const timeB = new Date(b.scheduledTime);
            return timeA - timeB;
          });
      },

      // Get all notifications including past and completed
      getAllNotifications: () => {
        const { notifications } = get();
        return Object.values(notifications).sort((a, b) => {
          const timeA = new Date(a.scheduledTime || 0);
          const timeB = new Date(b.scheduledTime || 0);
          return timeA - timeB;
        });
      },

      // Clear all notifications
      clearAllNotifications: () => {
        set({ notifications: {} });
      },

      // Sync notification from todo data
      syncNotificationFromTodo: (todo) => {
        if (!todo) return;

        const { setNotification, removeNotification } = get();
        const todoIdentifier = todo.uid || todo.id;

        // If todo has no notification time, remove it
        if (!todo.notification_time && !todo.start_time) {
          removeNotification(todoIdentifier);
          return;
        }

        // Calculate scheduled time based on todo data
        let scheduledTime = null;

        if (todo.notification_time) {
          // Use notification_time if available
          const [hours, minutes] = todo.notification_time.split(':');
          const date = new Date(todo.start_date || todo.due_date);
          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          scheduledTime = date.toISOString();
        } else if (todo.start_time && todo.start_date) {
          // Fallback to start_time
          const [hours, minutes] = todo.start_time.split(':');
          const date = new Date(todo.start_date);
          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          scheduledTime = date.toISOString();
        }

        if (scheduledTime) {
          setNotification(todoIdentifier, {
            title: todo.title,
            description: todo.description,
            scheduledTime,
            completed: todo.completed || false,
            todoId: todo.id,
            todoUid: todoIdentifier,
            startTime: todo.start_time,
            endTime: todo.end_time,
            startDate: todo.start_date,
            dueDate: todo.due_date,
          });
        }
      },
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
      }),
    }
  )
);

export default useNotificationStore;
