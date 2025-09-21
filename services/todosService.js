import { supabase } from '../utils/supabase';

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

  // Add a new todo
  async addTodo(todoData) {
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([{
          title: todoData.title,
          description: todoData.description || null,
          priority: todoData.priority || 0,
          due_date: todoData.due_date || null,
          start_date: todoData.start_date || null,
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
      return { data, error: null };
    } catch (error) {
      console.error('Update todo error:', error);
      return { data: null, error };
    }
  },

  // Soft delete a todo
  async deleteTodo(todoId) {
    try {
      const { error } = await supabase
        .from('todos')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', todoId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Delete todo error:', error);
      return { error };
    }
  },

  // Permanently delete a todo
  async permanentlyDeleteTodo(todoId) {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Permanently delete todo error:', error);
      return { error };
    }
  },
};