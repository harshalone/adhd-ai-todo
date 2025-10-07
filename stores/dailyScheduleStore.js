import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from '../services/userService';

const useDailyScheduleStore = create(
  persist(
    (set, get) => ({
      // Daily schedule tasks
      scheduleTasks: [],
      loading: false,

      // Load schedule from database
      loadScheduleFromDB: async (userId) => {
        try {
          set({ loading: true });
          const { data, error } = await userService.getUserProfile(userId);

          if (error) {
            console.error('Error loading schedule:', error);
            return;
          }

          if (data?.daily_schedule) {
            set({ scheduleTasks: data.daily_schedule });
          }
        } catch (error) {
          console.error('Error loading schedule:', error);
        } finally {
          set({ loading: false });
        }
      },

      // Save schedule to database
      saveScheduleToDB: async (userId) => {
        try {
          const tasks = get().scheduleTasks;
          const { error } = await userService.updateUserProfile(userId, {
            daily_schedule: tasks
          });

          if (error) {
            console.error('Error saving schedule:', error);
            return { error };
          }

          return { error: null };
        } catch (error) {
          console.error('Error saving schedule:', error);
          return { error };
        }
      },

      // Actions
      addScheduleTask: async (task, userId) => {
        const newTask = {
          id: Date.now().toString(),
          title: task.title,
          time: task.time, // ISO string
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          scheduleTasks: [...state.scheduleTasks, newTask]
        }));

        // Save to database if userId provided
        if (userId) {
          await get().saveScheduleToDB(userId);
        }

        return newTask;
      },

      updateScheduleTask: async (id, updates, userId) => {
        set((state) => ({
          scheduleTasks: state.scheduleTasks.map(task =>
            task.id === id ? { ...task, ...updates } : task
          )
        }));

        // Save to database if userId provided
        if (userId) {
          await get().saveScheduleToDB(userId);
        }
      },

      deleteScheduleTask: async (id, userId) => {
        set((state) => ({
          scheduleTasks: state.scheduleTasks.filter(task => task.id !== id)
        }));

        // Save to database if userId provided
        if (userId) {
          await get().saveScheduleToDB(userId);
        }
      },

      // Get tasks sorted by time
      getSortedScheduleTasks: () => {
        const tasks = get().scheduleTasks;
        return [...tasks].sort((a, b) => {
          const timeA = new Date(a.time).getTime();
          const timeB = new Date(b.time).getTime();
          return timeA - timeB;
        });
      },

      // Set schedule tasks (used when loading from DB)
      setScheduleTasks: (tasks) => set({ scheduleTasks: tasks }),

      // Clear all schedule tasks
      clearScheduleTasks: () => set({ scheduleTasks: [] }),
    }),
    {
      name: 'daily-schedule-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        scheduleTasks: state.scheduleTasks,
      }),
    }
  )
);

export default useDailyScheduleStore;
