import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { X, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import useDailyScheduleStore from '../../stores/dailyScheduleStore';
import useAuthStore from '../../stores/authStore';
import TimePicker from '../../components/TimePicker';

export default function EditDailyScheduleScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { task } = route.params;
  const { updateScheduleTask } = useDailyScheduleStore();
  const { user } = useAuthStore();

  const [taskTitle, setTaskTitle] = useState(task.title);
  const [taskTime, setTaskTime] = useState(new Date(task.time));
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleUpdateTask = async () => {
    if (!taskTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    await updateScheduleTask(
      task.id,
      {
        title: taskTitle.trim(),
        time: taskTime.toISOString(),
      },
      user?.id
    );

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  const formatTime = (time) => {
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
              onPress={handleClose}
            >
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Edit Schedule Task
            </Text>
            <TouchableOpacity
              style={[styles.saveHeaderButton]}
              onPress={handleUpdateTask}
            >
              <Text style={[styles.saveHeaderButtonText, { color: theme.colors.primary }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Title</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }]}
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="e.g., Morning Workout"
                placeholderTextColor={theme.colors.textSecondary}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Time</Text>
              <TouchableOpacity
                style={[styles.timeButton, {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                }]}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowTimePicker(true);
                }}
              >
                <Clock size={20} color={theme.colors.primary} />
                <Text style={[styles.timeButtonText, { color: theme.colors.text }]}>
                  {formatTime(taskTime)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Update Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleUpdateTask}
            >
              <Text style={styles.saveButtonText}>Update Task</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Picker */}
        <TimePicker
          visible={showTimePicker}
          onClose={() => setShowTimePicker(false)}
          onConfirm={(time) => {
            setTaskTime(time);
            setShowTimePicker(false);
          }}
          initialTime={taskTime}
          theme={theme}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 24,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  saveHeaderButton: {
    width: 60,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  saveHeaderButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  timeButtonText: {
    fontSize: 16,
    flex: 1,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
