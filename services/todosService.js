import { supabase } from '../utils/supabase';
import { notificationService } from './notificationService';
import useNotificationStore from '../stores/notificationStore';

export const todosService = {
  // Fetch all todos for the current user, sorted by priority and due date
  async getTodos() {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .is('deleted_at', null)
        .order('completed', { ascending: true })
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get todos error:', error);
      return { data: null, error };
    }
  },

  // Get a specific todo by ID
  async getTodoById(todoId) {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('id', todoId)
        .is('deleted_at', null)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get todo by ID error:', error);
      return { data: null, error };
    }
  },

  // Add a new todo
  async addTodo(todoData) {
    try {
      // If no due_date is provided but start_date exists, use start_date as due_date
      // This ensures notifications can be scheduled properly
      const due_date = todoData.due_date || todoData.start_date || null;

      const { data, error } = await supabase
        .from('todos')
        .insert([{
          title: todoData.title,
          description: todoData.description || null,
          priority: todoData.priority || 0,
          due_date: due_date,
          start_date: todoData.start_date || null,
          start_time: todoData.start_time || null,
          end_time: todoData.end_time || null,
          all_day: todoData.all_day || false,
          duration_minutes: todoData.duration_minutes || null,
          location: todoData.location || null,
          notes: todoData.notes || null,
          alert_minutes: todoData.alert_minutes || null,
          recurrence_rule: todoData.recurrence_rule || null,
          category: todoData.category || null,
          tags: todoData.tags || null,
          calendar_event_id: todoData.calendar_event_id || null,
          sync_enabled: todoData.sync_enabled !== undefined ? todoData.sync_enabled : true,
        }])
        .select()
        .single();

      if (error) throw error;

      // Schedule notifications for the new todo if it has alerts and due date (or start date)
      if (data && data.alert_minutes && (data.due_date || data.start_date)) {
        try {
          await notificationService.scheduleNotificationForTodo(data);
          console.log(`Scheduled notifications for todo: ${data.title}`);
        } catch (notifError) {
          console.error('Error scheduling notifications for new todo:', notifError);
          // Don't fail todo creation if notification scheduling fails
        }
      }

      // Sync to notification store
      if (data) {
        const { syncNotificationFromTodo } = useNotificationStore.getState();
        syncNotificationFromTodo(data);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Add todo error:', error);
      return { data: null, error };
    }
  },

  // Update todo completion status
  async toggleTodoCompletion(todoId, completed) {
    try {
      const { data, error } = await supabase
        .from('todos')
        .update({
          completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', todoId)
        .select()
        .single();

      if (error) throw error;

      // Cancel notifications when todo is completed
      if (data && completed) {
        try {
          await notificationService.cancelNotificationsForTodo(todoId);
          console.log(`Cancelled notifications for completed todo: ${todoId}`);
        } catch (notifError) {
          console.error('Error cancelling notifications for completed todo:', notifError);
        }
      }

      // Update notification store
      if (data) {
        const { markNotificationCompleted } = useNotificationStore.getState();
        markNotificationCompleted(todoId, completed, data.uid);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Toggle todo completion error:', error);
      return { data: null, error };
    }
  },

  // Update todo details
  async updateTodo(todoId, updates) {
    try {
      const { data, error } = await supabase
        .from('todos')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', todoId)
        .select()
        .single();

      if (error) throw error;

      // Reschedule notifications if todo is updated with new timing or alerts
      if (data && (updates.alert_minutes !== undefined || updates.due_date !== undefined)) {
        try {
          await notificationService.rescheduleNotificationsForTodo(data);
          console.log(`Rescheduled notifications for updated todo: ${data.title}`);
        } catch (notifError) {
          console.error('Error rescheduling notifications for updated todo:', notifError);
        }
      }

      // Sync updated todo to notification store
      if (data) {
        const { syncNotificationFromTodo } = useNotificationStore.getState();
        syncNotificationFromTodo(data);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Update todo error:', error);
      return { data: null, error };
    }
  },

  // Soft delete a todo
  async deleteTodo(todoId) {
    try {
      // Get todo data first to access uid
      const { data: todoData } = await this.getTodoById(todoId);

      const { error } = await supabase
        .from('todos')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', todoId);

      if (error) throw error;

      const todoUid = todoData?.uid || todoId;

      // Cancel notifications when todo is deleted
      try {
        await notificationService.cancelNotificationsForTodo(todoId, todoUid);
        console.log(`Cancelled notifications for deleted todo: ${todoId} (uid: ${todoUid})`);
      } catch (notifError) {
        console.error('Error cancelling notifications for deleted todo:', notifError);
      }

      // Remove from notification store
      const { removeNotification } = useNotificationStore.getState();
      removeNotification(todoUid);

      return { error: null };
    } catch (error) {
      console.error('Delete todo error:', error);
      return { error };
    }
  },

  // Permanently delete a todo
  async permanentlyDeleteTodo(todoId) {
    try {
      // Get todo data first to access uid
      const { data: todoData } = await this.getTodoById(todoId);

      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId);

      if (error) throw error;

      const todoUid = todoData?.uid || todoId;

      // Cancel notifications when todo is permanently deleted
      try {
        await notificationService.cancelNotificationsForTodo(todoId, todoUid);
        console.log(`Cancelled notifications for permanently deleted todo: ${todoId} (uid: ${todoUid})`);
      } catch (notifError) {
        console.error('Error cancelling notifications for permanently deleted todo:', notifError);
      }

      // Remove from notification store
      const { removeNotification } = useNotificationStore.getState();
      removeNotification(todoUid);

      return { error: null };
    } catch (error) {
      console.error('Permanently delete todo error:', error);
      return { error };
    }
  },

  // Schedule notifications for all incomplete todos (useful for app startup)
  async scheduleAllNotifications() {
    try {
      const { data: todos, error } = await this.getTodos();
      if (error) throw error;

      if (todos && todos.length > 0) {
        // Filter for incomplete todos - only include TODAY's todos (not past, not tomorrow or later)
        const moment = require('moment');
        const today = moment().startOf('day');
        const tomorrow = moment().add(1, 'day').startOf('day');

        const incompleteTodos = todos.filter(todo => {
          if (todo.completed) return false;

          // Check both due_date and start_date with proper YYYY-MM-DD format parsing
          // Only include if the date is TODAY (not past, not tomorrow or later)
          if (todo.due_date) {
            const dueDate = moment(todo.due_date, 'YYYY-MM-DD', true); // strict parsing
            if (dueDate.isValid()) {
              if (dueDate.isBefore(today)) {
                console.log(`⏭️ Skipping todo "${todo.title}" - due_date ${todo.due_date} is in the past`);
                return false;
              }
              if (dueDate.isSameOrAfter(tomorrow)) {
                console.log(`⏭️ Skipping todo "${todo.title}" - due_date ${todo.due_date} is tomorrow or later`);
                return false;
              }
            }
          }

          if (todo.start_date) {
            const startDate = moment(todo.start_date, 'YYYY-MM-DD', true); // strict parsing
            if (startDate.isValid()) {
              if (startDate.isBefore(today)) {
                console.log(`⏭️ Skipping todo "${todo.title}" - start_date ${todo.start_date} is in the past`);
                return false;
              }
              if (startDate.isSameOrAfter(tomorrow)) {
                console.log(`⏭️ Skipping todo "${todo.title}" - start_date ${todo.start_date} is tomorrow or later`);
                return false;
              }
            }
          }

          return true;
        });

        console.log(`📋 Found ${incompleteTodos.length} incomplete todos for notification scheduling (out of ${todos.length} total)`);

        const result = await notificationService.scheduleNotificationsForTodos(incompleteTodos);

        if (result.error) {
          console.error('Error scheduling notifications for todos:', result.error);
          return { error: result.error };
        }

        // Count how many todos actually got notifications scheduled
        const scheduledCount = result.results ? result.results.filter(r => r.notificationIds && r.notificationIds.length > 0).length : 0;
        console.log(`✅ Successfully scheduled notifications for ${scheduledCount} todos`);
        return { scheduledCount, error: null };
      }

      return { scheduledCount: 0, error: null };
    } catch (error) {
      console.error('Error scheduling all notifications:', error);
      return { scheduledCount: 0, error };
    }
  },
};