import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Alert, Switch, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { todosService } from '../../services/todosService';
import useAuthStore from '../../stores/authStore';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../utils/supabase';
import { ChevronDown, ChevronUp, ChevronLeft, Calendar, Clock, MapPin, Bell, Tag, Plus, X, Save, Trash2 } from 'lucide-react-native';
import TimePicker from '../../components/TimePicker';

export default function EditTodoScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { todo } = route.params || {};

  // Basic fields
  const [title, setTitle] = useState(todo?.title || '');
  const [description, setDescription] = useState(todo?.description || '');
  const [loading, setLoading] = useState(false);

  // Priority and dates
  const [priority, setPriority] = useState(todo?.priority || 0); // 0: Low, 1: Medium, 2: High
  const [dueDate, setDueDate] = useState(todo?.due_date ? new Date(todo.due_date) : null);
  const [startDate, setStartDate] = useState(null);
  const [allDay, setAllDay] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDay, setTempDay] = useState(new Date().getDate());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempYear, setTempYear] = useState(new Date().getFullYear().toString());
  const dayScrollRef = useRef(null);
  const monthScrollRef = useRef(null);

  const [dueTime, setDueTime] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Start and end times
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Location and notes
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Alerts and recurrence
  const [alertMinutes, setAlertMinutes] = useState([]);
  const [recurrenceRule, setRecurrenceRule] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Category and tags
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  // Sync settings
  const [syncEnabled, setSyncEnabled] = useState(true);

  // UI state for collapsible section
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Helper functions and constants
  const priorityOptions = [
    { value: 0, label: 'Low', shortLabel: 'L', color: '#6B7280' },
    { value: 1, label: 'Medium', shortLabel: 'M', color: '#FFB84D' },
    { value: 2, label: 'High', shortLabel: 'H', color: '#FF6B6B' }
  ];

  const categoryOptions = [
    'Personal', 'Work', 'Health', 'Shopping', 'Learning',
    'Family', 'Finance', 'Travel', 'Hobbies', 'Other'
  ];

  const alertOptions = [
    { label: 'None', value: [] },
    { label: '5 min', value: [5] },
    { label: '15 min', value: [15] },
    { label: '30 min', value: [30] },
    { label: '1 hr', value: [60] },
    { label: '1 day', value: [1440] }
  ];

  const recurrenceOptions = [
    { label: 'Never', value: '' },
    { label: 'Daily', value: 'FREQ=DAILY;INTERVAL=1' },
    { label: 'Weekly', value: 'FREQ=WEEKLY;INTERVAL=1' },
    { label: 'Monthly', value: 'FREQ=MONTHLY;INTERVAL=1' }
  ];

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Todo',
      'Are you sure you want to delete this todo? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await todosService.deleteTodo(todo.id);
              if (error) {
                Alert.alert('Error', 'Failed to delete todo. Please try again.');
                console.error('Error deleting todo:', error);
              } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete todo. Please try again.');
              console.error('Error deleting todo:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your todo');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to update todos');
      return;
    }

    if (!todo?.id) {
      Alert.alert('Error', 'Todo ID is missing');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Ensure Supabase has the current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        Alert.alert('Session Error', 'Please log in again to update todos');
        return;
      }

      const updates = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate ? dueDate.toISOString() : null,
        start_date: startDate ? startDate.toISOString() : null,
        all_day: allDay,
        duration_minutes: durationMinutes,
        location: location.trim() || null,
        notes: notes.trim() || null,
        alert_minutes: alertMinutes.length > 0 ? alertMinutes : null,
        recurrence_rule: recurrenceRule || null,
        category: category || null,
        tags: tags.length > 0 ? tags : null,
        sync_enabled: syncEnabled,
        start_time: startTime ? startTime.toISOString() : null,
        end_time: endTime ? endTime.toISOString() : null,
      };

      const { error } = await todosService.updateTodo(todo.id, updates);

      if (error) {
        Alert.alert('Error', 'Failed to update todo. Please try again.');
        console.error('Error updating todo:', error);
      } else {
        // Add haptic feedback for successful update
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update todo. Please try again.');
      console.error('Error updating todo:', error);
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

  // Load full todo data from database
  useEffect(() => {
    const loadTodoData = async () => {
      if (!todo?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch complete todo data from database
        const { data: fullTodo, error } = await todosService.getTodoById(todo.id);

        if (error) {
          console.error('Error loading todo:', error);
          Alert.alert('Error', 'Failed to load todo data');
          setIsLoading(false);
          return;
        }

        if (fullTodo) {
          // Populate all fields with database data
          setTitle(fullTodo.title || '');
          setDescription(fullTodo.description || '');
          setPriority(fullTodo.priority || 0);
          setDueDate(fullTodo.due_date ? new Date(fullTodo.due_date) : null);
          setStartDate(fullTodo.start_date ? new Date(fullTodo.start_date) : null);
          setLocation(fullTodo.location || '');
          setNotes(fullTodo.notes || '');
          setCategory(fullTodo.category || '');
          setRecurrenceRule(fullTodo.recurrence_rule || '');

          // Handle alert_minutes - it can be an array or a single value
          if (fullTodo.alert_minutes) {
            if (Array.isArray(fullTodo.alert_minutes)) {
              setAlertMinutes(fullTodo.alert_minutes);
            } else {
              // If it's a single value, convert to array
              setAlertMinutes([fullTodo.alert_minutes]);
            }
          } else {
            setAlertMinutes([]);
          }

          // Handle tags if they exist
          if (fullTodo.tags && Array.isArray(fullTodo.tags)) {
            setTags(fullTodo.tags);
          }

          // Handle other boolean/settings fields
          setAllDay(fullTodo.all_day || false);
          setDurationMinutes(fullTodo.duration_minutes || 60);
          setSyncEnabled(fullTodo.sync_enabled !== false); // Default to true

          // Handle start and end times
          setStartTime(fullTodo.start_time ? new Date(fullTodo.start_time) : null);
          setEndTime(fullTodo.end_time ? new Date(fullTodo.end_time) : null);
        }
      } catch (error) {
        console.error('Error loading todo:', error);
        Alert.alert('Error', 'Failed to load todo data');
      } finally {
        setIsLoading(false);
      }
    };

    loadTodoData();
  }, [todo?.id]);

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={39} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Edit Todo</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.deleteButton, {
              backgroundColor: theme.colors.surface,
              opacity: loading ? 0.7 : 1
            }]}
            onPress={handleDelete}
            disabled={loading}
          >
            <Trash2 size={20} color="#FF6B6B" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, {
              backgroundColor: title.trim() ? theme.colors.primary : theme.colors.surface,
              opacity: loading ? 0.7 : 1
            }]}
            onPress={handleSave}
            disabled={loading || !title.trim()}
          >
            <Save size={20} color={title.trim() ? '#fff' : theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading todo...
            </Text>
          </View>
        ) : (
          <View style={styles.form}>
          {/* Title and Priority */}
          <View style={styles.inputGroup}>
            <View style={styles.titlePriorityRow}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Title</Text>
              <View style={styles.compactPriorityContainer}>
                {priorityOptions.map((option) => {
                  const isSelected = priority === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.compactPriorityOption, {
                        backgroundColor: isSelected ? '#ffffff' : 'transparent',
                      }]}
                      onPress={() => setPriority(option.value)}
                    >
                      <Text style={[styles.compactPriorityText, {
                        color: option.color,
                        fontWeight: isSelected ? '700' : '600',
                      }]}>
                        {option.shortLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
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
            />
          </View>

          {/* Due Date */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Due Date</Text>
            <TouchableOpacity
              style={[styles.dateButton, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }]}
              onPress={() => {
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

          {/* Start and End Times */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Time</Text>
            <View style={styles.timeRow}>
              {/* Start Time */}
              <View style={styles.timeColumn}>
                <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>Start</Text>
                <TouchableOpacity
                  style={[styles.timeButton, {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border
                  }]}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Clock size={18} color={theme.colors.primary} />
                  <Text style={[styles.timeText, {
                    color: startTime ? theme.colors.text : theme.colors.textSecondary
                  }]}>
                    {startTime ? startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Set time'}
                  </Text>
                  {startTime && (
                    <TouchableOpacity
                      style={styles.clearTimeButton}
                      onPress={() => setStartTime(null)}
                    >
                      <X size={14} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>

              {/* End Time */}
              <View style={styles.timeColumn}>
                <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>End</Text>
                <TouchableOpacity
                  style={[styles.timeButton, {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border
                  }]}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Clock size={18} color={theme.colors.primary} />
                  <Text style={[styles.timeText, {
                    color: endTime ? theme.colors.text : theme.colors.textSecondary
                  }]}>
                    {endTime ? endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Set time'}
                  </Text>
                  {endTime && (
                    <TouchableOpacity
                      style={styles.clearTimeButton}
                      onPress={() => setEndTime(null)}
                    >
                      <X size={14} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Alerts */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Alerts</Text>
            <View style={styles.chipContainer}>
              {alertOptions.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.chip, {
                    backgroundColor: JSON.stringify(alertMinutes) === JSON.stringify(option.value) ? theme.colors.primary : theme.colors.background,
                    borderColor: theme.colors.border
                  }]}
                  onPress={() => setAlertMinutes(option.value)}
                >
                  <Text style={[styles.chipText, {
                    color: JSON.stringify(alertMinutes) === JSON.stringify(option.value) ? '#fff' : theme.colors.text
                  }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Advanced Options - Single Collapsible Section */}
          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={[styles.sectionHeader, { backgroundColor: '#ffffff' }]}
              onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Advanced Options</Text>
              {showAdvancedOptions ? (
                <ChevronUp size={20} color={theme.colors.textSecondary} />
              ) : (
                <ChevronDown size={20} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>

            {showAdvancedOptions && (
              <View style={[styles.sectionContent, { backgroundColor: '#ffffff', paddingHorizontal: 0 }]}>
                {/* Tags */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Tags</Text>
                  <View style={styles.tagInputContainer}>
                    <TextInput
                      style={[styles.tagInput, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                      }]}
                      value={newTag}
                      onChangeText={setNewTag}
                      placeholder="Add tag"
                      placeholderTextColor={theme.colors.textSecondary}
                      onSubmitEditing={addTag}
                      returnKeyType="done"
                    />
                    <TouchableOpacity
                      style={[styles.addTagButton, { backgroundColor: theme.colors.primary }]}
                      onPress={addTag}
                    >
                      <Plus size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {tags.map((tag) => (
                        <View key={tag} style={[styles.tagChip, { backgroundColor: theme.colors.primary }]}>
                          <Text style={styles.tagChipText}>{tag}</Text>
                          <TouchableOpacity onPress={() => removeTag(tag)}>
                            <X size={12} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Description */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Description</Text>
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

                {/* All Day Toggle */}
                <View style={styles.fieldGroup}>
                  <View style={styles.toggleRow}>
                    <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>All Day</Text>
                    <Switch
                      value={allDay}
                      onValueChange={setAllDay}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                      thumbColor={allDay ? theme.colors.primary : theme.colors.textSecondary}
                    />
                  </View>
                </View>

                {/* Duration */}
                {!allDay && (
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Duration (minutes)</Text>
                    <TextInput
                      style={[styles.fieldInput, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                      }]}
                      value={durationMinutes.toString()}
                      onChangeText={(text) => setDurationMinutes(parseInt(text) || 60)}
                      placeholder="60"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>
                )}

                {/* Location */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Location</Text>
                  <TextInput
                    style={[styles.fieldInput, {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }]}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Add location"
                    placeholderTextColor={theme.colors.textSecondary}
                    maxLength={500}
                  />
                </View>

                {/* Additional Notes */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Additional Notes</Text>
                  <TextInput
                    style={[styles.fieldTextArea, {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add extra notes"
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                    maxLength={1000}
                    textAlignVertical="top"
                  />
                </View>

                {/* Recurrence */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Recurrence</Text>
                  <View style={styles.chipContainer}>
                    {recurrenceOptions.map((option) => (
                      <TouchableOpacity
                        key={option.label}
                        style={[styles.chip, {
                          backgroundColor: recurrenceRule === option.value ? theme.colors.primary : theme.colors.background,
                          borderColor: theme.colors.border
                        }]}
                        onPress={() => setRecurrenceRule(option.value)}
                      >
                        <Text style={[styles.chipText, {
                          color: recurrenceRule === option.value ? '#fff' : theme.colors.text
                        }]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Category */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Category</Text>
                  <View style={styles.chipContainer}>
                    {categoryOptions.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.chip, {
                          backgroundColor: category === cat ? theme.colors.primary : theme.colors.background,
                          borderColor: theme.colors.border
                        }]}
                        onPress={() => setCategory(category === cat ? '' : cat)}
                      >
                        <Text style={[styles.chipText, {
                          color: category === cat ? '#fff' : theme.colors.text
                        }]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Calendar Sync */}
                <View style={styles.fieldGroup}>
                  <View style={styles.toggleRow}>
                    <View style={styles.toggleContent}>
                      <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Calendar Sync</Text>
                      <Text style={[styles.fieldDescription, { color: theme.colors.textSecondary }]}>
                        Sync this todo with your calendar app
                      </Text>
                    </View>
                    <Switch
                      value={syncEnabled}
                      onValueChange={setSyncEnabled}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                      thumbColor={syncEnabled ? theme.colors.primary : theme.colors.textSecondary}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

        </View>
        )}
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
              <TouchableOpacity onPress={handleDateCancel} style={styles.closeButton}>
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

      <TimePicker
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onConfirm={(time) => {
          setDueTime(time);
          setShowTimePicker(false);
        }}
        initialTime={dueTime}
        theme={theme}
      />

      <TimePicker
        visible={showStartTimePicker}
        onClose={() => setShowStartTimePicker(false)}
        onConfirm={(time) => {
          setStartTime(time);
          setShowStartTimePicker(false);
        }}
        initialTime={startTime}
        theme={theme}
      />

      <TimePicker
        visible={showEndTimePicker}
        onClose={() => setShowEndTimePicker(false)}
        onConfirm={(time) => {
          setEndTime(time);
          setShowEndTimePicker(false);
        }}
        initialTime={endTime}
        theme={theme}
      />
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
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  titlePriorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactPriorityContainer: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  compactPriorityOption: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactPriorityText: {
    fontSize: 10,
    fontWeight: '700',
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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

  // Collapsible sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sectionContent: {
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },

  // Field styles
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 8,
    minHeight: 44,
  },
  fieldText: {
    fontSize: 14,
    flex: 1,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 44,
  },
  fieldTextArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    maxHeight: 120,
  },
  fieldDescription: {
    fontSize: 12,
    lineHeight: 16,
  },

  // Toggle styles
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleContent: {
    flex: 1,
    gap: 4,
  },

  // Chip styles
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Tag styles
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 40,
  },
  addTagButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  tagChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },

  // Time row styles
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeColumn: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    minHeight: 48,
  },
  timeText: {
    fontSize: 13,
    flex: 1,
  },
  clearTimeButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});