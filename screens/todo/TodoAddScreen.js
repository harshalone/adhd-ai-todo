import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Save, ChevronDown, X, ChevronUp, Circle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { todosService } from '../../services/todosService';
import * as Haptics from 'expo-haptics';
import BackButton from '../../components/BackButton';
import useAuthStore from '../../stores/authStore';
import { supabase } from '../../utils/supabase';

export default function TodoAddScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(0); // 0: Low, 1: Medium, 2: High
  const [dueDate, setDueDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempDay, setTempDay] = useState(new Date().getDate());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempYear, setTempYear] = useState(new Date().getFullYear().toString());
  const dayScrollRef = useRef(null);
  const monthScrollRef = useRef(null);

  const priorityOptions = [
    { value: 0, label: 'Low', color: '#6B7280', icon: ChevronDown },
    { value: 1, label: 'Medium', color: '#FFB84D', icon: Circle },
    { value: 2, label: 'High', color: '#FF6B6B', icon: ChevronUp }
  ];

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your todo');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to create todos');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Ensure Supabase has the current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        Alert.alert('Session Error', 'Please log in again to create todos');
        return;
      }

      const todoData = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate ? dueDate.toISOString() : null,
        completed: false,
        user_id: user.id
      };

      const { error } = await todosService.addTodo(todoData);

      if (error) {
        Alert.alert('Error', 'Failed to create todo. Please try again.');
        console.error('Error creating todo:', error);
      } else {
        // Add haptic feedback for successful creation
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create todo. Please try again.');
      console.error('Error creating todo:', error);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handleDateConfirm = () => {
    const year = parseInt(tempYear);
    if (isNaN(year) || year < 1900 || year > 3000) {
      Alert.alert('Invalid Year', 'Please enter a valid year between 1900 and 3000');
      return;
    }

    const maxDays = getDaysInMonth(tempMonth, year);
    const day = tempDay > maxDays ? maxDays : tempDay;

    const selectedDate = new Date(year, tempMonth, day);
    setDueDate(selectedDate);
    setShowDatePicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDateCancel = () => {
    if (dueDate) {
      setTempDay(dueDate.getDate());
      setTempMonth(dueDate.getMonth());
      setTempYear(dueDate.getFullYear().toString());
    } else {
      setTempDay(new Date().getDate());
      setTempMonth(new Date().getMonth());
      setTempYear(new Date().getFullYear().toString());
    }
    setShowDatePicker(false);
  };

  const scrollToSelectedValues = () => {
    // Small delay to ensure the ScrollViews are rendered
    setTimeout(() => {
      // Scroll to selected day (item height: 44px + 4px margin = 48px)
      const dayIndex = tempDay - 1;
      dayScrollRef.current?.scrollTo({
        y: dayIndex * 48,
        animated: true
      });

      // Scroll to selected month (item height: 44px + 4px margin = 48px)
      monthScrollRef.current?.scrollTo({
        y: tempMonth * 48,
        animated: true
      });
    }, 100);
  };

  useEffect(() => {
    if (showDatePicker) {
      scrollToSelectedValues();
    }
  }, [showDatePicker, tempDay, tempMonth]);

  const formatDate = (date) => {
    if (!date) return 'Set due date';

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const clearDueDate = () => {
    setDueDate(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.title, { color: theme.colors.text }]}>New Todo</Text>
        <TouchableOpacity
          style={[styles.saveButton, {
            backgroundColor: title.trim() ? theme.colors.primary : theme.colors.surface,
            opacity: title.trim() ? 1 : 0.5
          }]}
          onPress={handleSave}
          disabled={loading || !title.trim()}
        >
          <Save size={20} color={title.trim() ? '#fff' : theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Title</Text>
            <TextInput
              style={[styles.titleInput, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }]}
              value={title}
              onChangeText={setTitle}
              placeholder="What needs to be done?"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              maxLength={100}
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Description</Text>
            <TextInput
              style={[styles.descriptionInput, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add more details (optional)"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Priority</Text>
            <View style={styles.priorityContainer}>
              {priorityOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = priority === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.priorityOption, {
                      backgroundColor: isSelected ? '#ffffff' : 'transparent',
                      shadowColor: isSelected ? '#000' : 'transparent',
                      shadowOffset: isSelected ? { width: 0, height: 1 } : { width: 0, height: 0 },
                      shadowOpacity: isSelected ? 0.1 : 0,
                      shadowRadius: isSelected ? 2 : 0,
                      elevation: isSelected ? 2 : 0,
                    }]}
                    onPress={() => {
                      setPriority(option.value);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <View style={styles.priorityContent}>
                      {IconComponent && <IconComponent
                        size={14}
                        color={option.color}
                        fill={option.color}
                      />}
                      <Text style={[styles.priorityText, {
                        color: isSelected ? '#000000' : '#666666',
                        fontWeight: isSelected ? '600' : '500'
                      }]}>
                        {option.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Due Date</Text>
            <TouchableOpacity
              style={[styles.dateButton, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }]}
              onPress={() => {
                // Initialize with current date if no due date is set
                if (!dueDate) {
                  const today = new Date();
                  setTempDay(today.getDate());
                  setTempMonth(today.getMonth());
                  setTempYear(today.getFullYear().toString());
                } else {
                  setTempDay(dueDate.getDate());
                  setTempMonth(dueDate.getMonth());
                  setTempYear(dueDate.getFullYear().toString());
                }
                setShowDatePicker(true);
              }}
            >
              <Calendar size={20} color={theme.colors.primary} />
              <Text style={[styles.dateText, {
                color: dueDate ? theme.colors.text : theme.colors.textSecondary
              }]}>
                {formatDate(dueDate)}
              </Text>
              {dueDate && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={clearDueDate}
                >
                  <X size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={handleDateCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.datePickerModal, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleDateCancel}>
                <X size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Date</Text>
              <TouchableOpacity onPress={handleDateConfirm}>
                <Text style={[styles.confirmButton, { color: theme.colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.datePickerContent}>
              <View style={styles.pickerSection}>
                <Text style={[styles.pickerLabel, { color: theme.colors.text }]}>Day</Text>
                <ScrollView
                  ref={dayScrollRef}
                  style={[styles.picker, { backgroundColor: theme.colors.background }]}
                  showsVerticalScrollIndicator={false}
                >
                  {Array.from({ length: getDaysInMonth(tempMonth, parseInt(tempYear) || new Date().getFullYear()) }, (_, i) => i + 1).map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.pickerItem, {
                        backgroundColor: tempDay === day ? theme.colors.primary + '20' : 'transparent'
                      }]}
                      onPress={() => {
                        setTempDay(day);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={[styles.pickerItemText, {
                        color: tempDay === day ? theme.colors.primary : theme.colors.text,
                        fontWeight: tempDay === day ? '600' : '400'
                      }]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerSection}>
                <Text style={[styles.pickerLabel, { color: theme.colors.text }]}>Month</Text>
                <ScrollView
                  ref={monthScrollRef}
                  style={[styles.picker, { backgroundColor: theme.colors.background }]}
                  showsVerticalScrollIndicator={false}
                >
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[styles.pickerItem, {
                        backgroundColor: tempMonth === index ? theme.colors.primary + '20' : 'transparent'
                      }]}
                      onPress={() => {
                        setTempMonth(index);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={[styles.pickerItemText, {
                        color: tempMonth === index ? theme.colors.primary : theme.colors.text,
                        fontWeight: tempMonth === index ? '600' : '400'
                      }]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerSection}>
                <Text style={[styles.pickerLabel, { color: theme.colors.text }]}>Year</Text>
                <TextInput
                  style={[styles.yearInput, {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }]}
                  value={tempYear}
                  onChangeText={setTempYear}
                  placeholder="2025"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
    marginBottom: 4,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 56,
    maxHeight: 100,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    maxHeight: 150,
  },
  priorityContainer: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 25,
    padding: 4,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  priorityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    minHeight: 56,
  },
  dateText: {
    fontSize: 13,
    flex: 1,
  },
  clearDateButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  datePickerModal: {
    borderRadius: 20,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  confirmButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  pickerSection: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  picker: {
    height: 200,
    width: '100%',
    borderRadius: 12,
    paddingVertical: 8,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: 8,
    height: 44,
    justifyContent: 'center',
  },
  pickerItemText: {
    fontSize: 16,
  },
  yearInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    textAlign: 'center',
    width: '100%',
  },
});