import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, Svg } from 'react-native-svg';
import { Clock, Coffee, BookOpen, Dumbbell, Car, Home, MapPin, Calendar, CheckSquare, ChevronLeft, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { todosService } from '../services/todosService';
import TimePicker from '../components/TimePicker';
import IconPicker from '../components/IconPicker';
import { Confetti } from 'react-native-fast-confetti';
import * as Haptics from 'expo-haptics';
import moment from 'moment';

export default function FocusScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [todos, setTodos] = useState([]);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(() => {
    const end = new Date();
    end.setMinutes(end.getMinutes() + 25); // Default 25 minutes
    return end;
  });
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [customIcon, setCustomIcon] = useState(null);
  const [customIconComponent, setCustomIconComponent] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const intervalRef = useRef(null);

  const radius = 100;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const fetchTodosForToday = useCallback(async () => {
    try {
      const { data, error } = await todosService.getTodos();
      if (error) {
        console.error('Error fetching todos:', error);
      } else {
        const today = moment().startOf('day');
        const todayTodos = data.filter(todo => {
          if (todo.start_date) {
            return moment(todo.start_date, 'YYYY-MM-DD').isSame(today, 'day');
          }
          if (todo.due_date) {
            return moment(todo.due_date, 'YYYY-MM-DD').isSame(today, 'day');
          }
          return false;
        }).filter(todo => !todo.completed);
        setTodos(todayTodos);

        if (todayTodos.length > 0 && !selectedTodo) {
          setSelectedTodo(todayTodos[0]);
          calculateDefaultTimes(todayTodos[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  }, [selectedTodo]);

  const calculateDefaultTimes = (todo) => {
    const now = new Date();
    let start, end;

    if (todo.start_time) {
      const [hours, minutes] = todo.start_time.split(':').map(Number);
      start = new Date();
      start.setHours(hours, minutes, 0, 0);
    } else {
      start = now;
    }

    if (todo.end_time) {
      const [hours, minutes] = todo.end_time.split(':').map(Number);
      end = new Date();
      end.setHours(hours, minutes, 0, 0);
    } else if (todo.duration_minutes) {
      end = new Date(start.getTime() + todo.duration_minutes * 60000);
    } else {
      end = new Date(start.getTime() + 25 * 60000); // Default 25 minutes
    }

    setStartTime(start);
    setEndTime(end);
  };

  const getIconForTodo = (todo) => {
    console.log('getIconForTodo called:', {
      todoId: todo?.id,
      selectedTodoId: selectedTodo?.id,
      hasCustomIcon: !!customIconComponent,
      customIconKey: customIcon
    });

    // If user has selected a custom icon, use that
    if (customIconComponent && selectedTodo?.id === todo.id) {
      console.log('Using custom icon:', customIcon);
      const CustomIcon = customIconComponent;
      return <CustomIcon size={48} color={theme.colors.primary} fill={theme.colors.primary} />;
    }

    const title = todo.title.toLowerCase();
    const category = todo.category?.toLowerCase() || '';
    const tags = todo.tags?.join(' ').toLowerCase() || '';
    const searchText = `${title} ${category} ${tags}`;

    // Exercise/Fitness related
    if (searchText.includes('jog') || searchText.includes('run') || searchText.includes('gym') ||
        searchText.includes('workout') || searchText.includes('exercise') || searchText.includes('fitness')) {
      return <Dumbbell size={48} color={theme.colors.primary} />;
    }

    // Study/Work/Reading
    if (searchText.includes('study') || searchText.includes('read') || searchText.includes('book') ||
        searchText.includes('learn') || searchText.includes('homework')) {
      return <BookOpen size={48} color={theme.colors.primary} />;
    }

    // Meeting/Appointment
    if (searchText.includes('meeting') || searchText.includes('appointment') || searchText.includes('call')) {
      return <Calendar size={48} color={theme.colors.primary} />;
    }

    // Travel/Commute
    if (searchText.includes('drive') || searchText.includes('commute') || searchText.includes('travel') ||
        searchText.includes('trip')) {
      return <Car size={48} color={theme.colors.primary} />;
    }

    // Home/Chores
    if (searchText.includes('clean') || searchText.includes('chore') || searchText.includes('home') ||
        searchText.includes('house')) {
      return <Home size={48} color={theme.colors.primary} />;
    }

    // Break/Rest
    if (searchText.includes('break') || searchText.includes('rest') || searchText.includes('coffee') ||
        searchText.includes('lunch')) {
      return <Coffee size={48} color={theme.colors.primary} />;
    }

    // Location-based
    if (todo.location) {
      return <MapPin size={48} color={theme.colors.primary} />;
    }

    // Default clock icon
    return <Clock size={48} color={theme.colors.primary} />;
  };

  const handleIconSelect = (iconKey, IconComponent) => {
    console.log('Icon selected:', iconKey, IconComponent?.name);
    setCustomIcon(iconKey);
    setCustomIconComponent(() => IconComponent);
    console.log('Custom icon state updated:', { iconKey, hasComponent: !!IconComponent });
  };

  const resetCustomIcon = () => {
    setCustomIcon(null);
    setCustomIconComponent(null);
  };

  const startTimer = () => {
    const duration = endTime.getTime() - startTime.getTime();
    setRemainingTime(duration);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1000) {
          // Clear interval immediately to prevent multiple triggers
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setIsRunning(false);
          setProgress(100);
          // Focus session completed - celebrate with confetti!
          handleSessionComplete();
          return 0;
        }
        const newRemaining = prev - 1000;
        const newProgress = ((duration - newRemaining) / duration) * 100;
        setProgress(newProgress);
        return newRemaining;
      });
    }, 1000);
  };

  const stopTimer = () => {
    setShowStopConfirm(true);
  };

  const confirmStopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setProgress(0);
    setRemainingTime(0);
    setShowStopConfirm(false);
  };

  const cancelStopTimer = () => {
    setShowStopConfirm(false);
  };

  const handleSessionComplete = async () => {
    console.log(`Focus session completed: ${selectedTodo?.title || 'focus session'}!`);

    // Enhanced success haptic feedback - multiple vibrations for celebration feeling
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Add additional celebration vibrations with slight delays
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 200);

    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 400);

    // Show success popup and confetti simultaneously
    setShowSuccessPopup(true);
    setShowConfetti(true);

    // Stop confetti after 4 seconds (let it run a bit longer)
    setTimeout(() => {
      setShowConfetti(false);
    }, 4000);
  };

  const handleSuccessPopupOK = () => {
    setShowSuccessPopup(false);
    setShowConfetti(false); // Stop confetti when user dismisses popup
    setProgress(0);
    setRemainingTime(0);
  };

  const handleToggle = () => {
    if (isRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  };

  const formatTime = (date) => {
    return moment(date).format('HH:mm');
  };

  const formatDuration = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useFocusEffect(
    useCallback(() => {
      fetchTodosForToday();
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [])
  );

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={39} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Focus</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Task Selection Button */}
        <View style={styles.taskSection}>
          <TouchableOpacity
            style={[
              styles.taskSelectButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: isRunning ? 0.5 : 1
              }
            ]}
            onPress={() => !isRunning && setShowTaskModal(true)}
            disabled={isRunning}
          >
            <Text style={[styles.taskSelectValue, { color: theme.colors.text }]} numberOfLines={1}>
              {selectedTodo ? selectedTodo.title : 'Tap to select a task'}
            </Text>
            {selectedTodo?.start_time && (
              <Text style={[styles.taskSelectTime, { color: theme.colors.textSecondary }]}>
                {selectedTodo.start_time}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 2. Time Pickers Section */}
        <View style={styles.timerSection}>
          <View style={[styles.timePickersContainer, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={styles.timePicker}
              onPress={() => !isRunning && setShowStartTimePicker(true)}
              disabled={isRunning}
            >
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>Start</Text>
              <Text style={[styles.timeValue, { color: theme.colors.text, opacity: isRunning ? 0.5 : 1 }]}>
                {formatTime(startTime)}
              </Text>
            </TouchableOpacity>

            <View style={styles.timeSeparator}>
              <Text style={[styles.separatorText, { color: theme.colors.textSecondary }]}>to</Text>
            </View>

            <TouchableOpacity
              style={styles.timePicker}
              onPress={() => !isRunning && setShowEndTimePicker(true)}
              disabled={isRunning}
            >
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>End</Text>
              <Text style={[styles.timeValue, { color: theme.colors.text, opacity: isRunning ? 0.5 : 1 }]}>
                {formatTime(endTime)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Progress Circle Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressContainer}>
            <View style={styles.svgContainer} pointerEvents="none">
              <Svg width={radius * 2 + strokeWidth * 2} height={radius * 2 + strokeWidth * 2}>
                <Circle
                  cx={radius + strokeWidth}
                  cy={radius + strokeWidth}
                  r={radius}
                  stroke={theme.colors.border}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx={radius + strokeWidth}
                  cy={radius + strokeWidth}
                  r={radius}
                  stroke={theme.colors.primary}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
                />
              </Svg>
            </View>
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => {
                console.log('Center icon clicked!', { selectedTodo: !!selectedTodo, isRunning, showIconPicker });
                if (!isRunning) {
                  console.log('Opening icon picker with state:', {
                    selectedTodo: selectedTodo?.id,
                    customIcon,
                    hasCustomIconComponent: !!customIconComponent
                  });
                  setShowIconPicker(true);
                }
              }}
              activeOpacity={0.7}
            >
              {customIconComponent ? (
                (() => {
                  const CustomIcon = customIconComponent;
                  return <CustomIcon size={48} color={theme.colors.primary} />;
                })()
              ) : selectedTodo ? (
                getIconForTodo(selectedTodo)
              ) : (
                <CheckSquare size={48} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Timer Text - Always Present to Prevent Layout Shift */}
          <View style={styles.timerTextContainer}>
            <Text style={[styles.timerText, { color: theme.colors.text }]}>
              {isRunning && remainingTime > 0 ? formatDuration(remainingTime) : ' '}
            </Text>
          </View>
        </View>

        {/* 4. Start Button Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.alignedButton,
              {
                backgroundColor: theme.colors.primary,
              }
            ]}
            onPress={() => {
              console.log('Start button clicked!', { selectedTodo: !!selectedTodo, isRunning });
              handleToggle();
            }}
          >
            <Text style={styles.buttonText}>
              {isRunning ? 'Stop' : selectedTodo ? 'Start Focus' : 'Start Timer'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Time Picker Modals */}
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

      {/* Icon Picker Modal */}
      <IconPicker
        visible={showIconPicker}
        onClose={() => {
          console.log('Closing icon picker...');
          setShowIconPicker(false);
        }}
        onSelectIcon={handleIconSelect}
        selectedIcon={customIcon}
        theme={theme}
      />

      {/* Stop Confirmation Modal */}
      <Modal
        visible={showStopConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelStopTimer}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={[styles.confirmModal, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.confirmTitle, { color: theme.colors.text }]}>
              Stop Focus Session?
            </Text>
            <Text style={[styles.confirmMessage, { color: theme.colors.textSecondary }]}>
              Are you sure you want to stop your current focus session?
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                onPress={cancelStopTimer}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Continue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, styles.stopButton, { backgroundColor: '#ef4444' }]}
                onPress={confirmStopTimer}
              >
                <Text style={styles.stopButtonText}>Stop Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Popup Modal */}
      <Modal
        visible={showSuccessPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessPopupOK}
      >
        <View style={styles.successModalOverlay}>
          <View style={[styles.successModal, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.successIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
              {customIconComponent ? (
                (() => {
                  const CustomIcon = customIconComponent;
                  return <CustomIcon size={48} color={theme.colors.primary} />;
                })()
              ) : selectedTodo ? (
                getIconForTodo(selectedTodo)
              ) : (
                <CheckSquare size={48} color={theme.colors.primary} />
              )}
            </View>

            <Text style={[styles.successTitle, { color: theme.colors.text }]}>
              🎉 Focus Session Complete!
            </Text>

            <Text style={[styles.successMessage, { color: theme.colors.textSecondary }]}>
              Great job! You've successfully completed your focus session{selectedTodo ? ` for "${selectedTodo.title}"` : ''}.
            </Text>

            <TouchableOpacity
              style={[styles.successButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSuccessPopupOK}
            >
              <Text style={styles.successButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Task Selection Modal */}
      <Modal
        visible={showTaskModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTaskModal(false)}
      >
        <View style={styles.taskModalOverlay}>
          <View style={[styles.taskModal, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.taskModalHeader}>
              <TouchableOpacity onPress={() => setShowTaskModal(false)} style={styles.taskCloseButton}>
                <X size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.taskModalTitle, { color: theme.colors.text }]}>
                Select Today's Task
              </Text>
              <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                <Text style={[styles.taskModalDone, { color: theme.colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.taskModalContent}
              contentContainerStyle={styles.taskModalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {todos.length > 0 ? (
                todos.map((todo) => (
                  <TouchableOpacity
                    key={todo.id}
                    style={[
                      styles.taskModalItem,
                      {
                        backgroundColor: selectedTodo?.id === todo.id ? theme.colors.primary + '20' : 'transparent',
                        borderColor: selectedTodo?.id === todo.id ? theme.colors.primary : theme.colors.border
                      }
                    ]}
                    onPress={() => {
                      setSelectedTodo(todo);
                      calculateDefaultTimes(todo);
                      resetCustomIcon();
                      setShowTaskModal(false);
                    }}
                  >
                    <View style={styles.taskModalItemContent}>
                      <Text style={[
                        styles.taskModalItemTitle,
                        {
                          color: selectedTodo?.id === todo.id ? theme.colors.primary : theme.colors.text,
                          fontWeight: selectedTodo?.id === todo.id ? '600' : '400'
                        }
                      ]} numberOfLines={2}>
                        {todo.title}
                      </Text>
                      {todo.description && (
                        <Text style={[styles.taskModalItemDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                          {todo.description}
                        </Text>
                      )}
                      {todo.start_time && (
                        <Text style={[styles.taskModalItemTime, { color: theme.colors.textSecondary }]}>
                          {todo.start_time}
                        </Text>
                      )}
                    </View>
                    {selectedTodo?.id === todo.id && (
                      <CheckSquare size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noTasksContainer}>
                  <Text style={[styles.noTasksText, { color: theme.colors.textSecondary }]}>
                    No tasks scheduled for today
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Confetti Animation - Shows on top of everything when focus session completes */}
      {showConfetti && (
        <Confetti
          count={300}
          origin={{ x: -10, y: 0 }}
          explosionSpeed={350}
          fallSpeed={2300}
          fadeSpeed={5000}
          autoStart={true}
          autoStartDelay={0}
        />
      )}
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
  },
  headerSpacer: {
    width: 39,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  taskSection: {
    marginBottom: 16,
    marginTop: 20,
  },
  timerSection: {
    marginTop: 0,
    marginBottom: 32,
  },
  progressSection: {
    height: 250,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  topSection: {
    paddingTop: 20,
    marginBottom: 100,
  },
  middleSection: {
    alignItems: 'center',
    marginBottom: 100,
  },
  bottomSection: {
    alignItems: 'center',
  },
  timePickersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
    minWidth: 280,
    alignSelf: 'center',
  },
  timePicker: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  timeSeparator: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  separatorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  taskSelectButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'stretch',
    marginHorizontal: 20,
  },
  taskSelectValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'left',
  },
  taskSelectTime: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
    textAlign: 'left',
  },
  taskModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  taskModal: {
    borderRadius: 20,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 400,
    height: 500,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  taskModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  taskModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  taskModalDone: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskModalContent: {
    flex: 1,
  },
  taskModalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  taskModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    marginHorizontal: 0,
  },
  taskModalItemContent: {
    flex: 1,
  },
  taskModalItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskModalItemDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  taskModalItemTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  noTasksContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noTasksText: {
    fontSize: 16,
    textAlign: 'center',
  },
  progressContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  svgContainer: {
    position: 'absolute',
    zIndex: 1,
  },
  iconContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    zIndex: 2,
  },
  timerTextContainer: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    minHeight: 22,
  },
  button: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alignedButton: {
    minWidth: 280,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModal: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  stopButton: {
    // Red background set inline
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModal: {
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  successButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});