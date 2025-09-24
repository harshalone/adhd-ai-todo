import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput, ActivityIndicator, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';
import { Mic, MicOff, ChevronDown, ChevronUp, Wand2, Plus } from 'lucide-react-native';
import { Confetti, ConfettiMethods } from 'react-native-fast-confetti';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import BackButton from '../../components/BackButton';
import TodoListItem from '../../components/TodoListItem';
import { useTheme } from '../../context/ThemeContext';
import { getServerUrl } from '../../utils/constants';
import { todosService } from '../../services/todosService';

export default function AiTodoAddScreen({ navigation }) {
  const { theme } = useTheme();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [recordedURI, setRecordedURI] = useState(null);
  const [audioFileSize, setAudioFileSize] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(null);
  const [parsedTasks, setParsedTasks] = useState([]);
  const [isProcessingTasks, setIsProcessingTasks] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [isSavingTasks, setIsSavingTasks] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isBlueContainerCollapsed, setIsBlueContainerCollapsed] = useState(false);
  const [isParsedTasksCollapsed, setIsParsedTasksCollapsed] = useState(false);
  const [savingTaskIndex, setSavingTaskIndex] = useState(-1);
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnim = useRef(new Animated.Value(1)).current;
  const taskSaveAnims = useRef([]).current;
  const confettiRef = useRef(null);
  

  useEffect(() => {
    const setupAudio = async () => {
      try {
        // Request recording permissions
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (status.granted) {
          setPermissionGranted(true);
          console.log('Recording permission granted');
        } else {
          Alert.alert('Permission Denied', 'Permission to access microphone was denied');
        }

        // Set audio mode for recording
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      } catch (error) {
        console.error('Error setting up audio:', error);
        Alert.alert('Error', 'Failed to setup audio: ' + error.message);
      }
    };

    setupAudio();
  }, []);

  // Recording animation effect
  useEffect(() => {
    if (recorderState.isRecording) {
      // Start pulsing animation - keeping it within button bounds
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      // Start dot blinking animation
      const dotAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
      dotAnimation.start();

      return () => {
        pulseAnimation.stop();
        dotAnimation.stop();
      };
    } else {
      // Reset animations when not recording
      pulseAnim.setValue(1);
      dotAnim.setValue(1);
    }
  }, [recorderState.isRecording, pulseAnim, dotAnim]);

  const startRecording = async () => {
    if (!permissionGranted) {
      Alert.alert('Permission Required', 'Microphone permission is required to record audio');
      return;
    }

    try {
      console.log('Starting recording...');
      // Clear previous transcription
      setTranscribedText('');
      setTranscriptionError(null);
      
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record();
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording: ' + error.message);
    }
  };

  const stopRecording = async () => {
    try {
      console.log('Stopping recording...');
      await audioRecorder.stop();
      
      // Get the recording URI
      const uri = audioRecorder.uri;
      setRecordedURI(uri);
      console.log('Recording stopped and stored at:', uri);

      // Get file size and transcribe audio
      if (uri) {
        await getAudioFileSize(uri);
        await transcribeAudio(uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording: ' + error.message);
    }
  };

  const getAudioFileSize = async (uri) => {
    try {
      // Get file size for display
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        const sizeInMB = (fileInfo.size / (1024 * 1024)).toFixed(1);
        setAudioFileSize(`${sizeInMB} MB`);
      }
      console.log('Audio file size:', audioFileSize);
    } catch (error) {
      console.error('Error getting file size:', error);
    }
  };

  const startTypingAnimation = () => {
    const message = "Hang on, we are writing this down for you…";
    let index = 0;
    setTypingText('');

    const typeInterval = setInterval(() => {
      setTypingText(message.slice(0, index + 1));
      index++;

      if (index >= message.length) {
        clearInterval(typeInterval);
      }
    }, 50); // 50ms delay between characters

    return typeInterval;
  };

  const transcribeAudio = async (uri) => {
    setIsTranscribing(true);
    setTranscriptionError(null);

    // Start typing animation
    const typingInterval = startTypingAnimation();

    try {
      const transcription = await callTranscriptionAPI(uri);
      setTranscribedText(transcription);

    } catch (error) {
      console.error('Error transcribing audio:', error);
      setTranscriptionError('Failed to transcribe audio. Please try again.');
      Alert.alert('Transcription Error', 'Failed to transcribe audio: ' + error.message);
    } finally {
      clearInterval(typingInterval);
      setIsTranscribing(false);
    }
  };

  // Call your backend transcription API
  const callTranscriptionAPI = async (audioFileUri) => {
    try {
      const SERVER_URL = await getServerUrl();

      const transcription_url = SERVER_URL + 'api/ai/voice/transcriptions/v2';
      console.log("transcription_url :", transcription_url);

      // Create FormData to send the audio file directly
      const formData = new FormData();
      formData.append('file', {
        uri: audioFileUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      });

      const response = await fetch(transcription_url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // API returns the transcription in the 'text' field
      return result.text || '';
      
    } catch (error) {
      console.error('Transcription API error:', error);
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  };

  const processTasksWithAI = async () => {
    if (!transcribedText.trim()) {
      Alert.alert('No Text', 'Please record and transcribe some text first.');
      return;
    }

    setIsProcessingTasks(true);
    setProcessingError(null);
    setParsedTasks([]);
    setIsBlueContainerCollapsed(true);

    try {
      const SERVER_URL = await getServerUrl();
      const todoUrl = SERVER_URL + 'api/ai/todo';

      // Get current time from user's phone
      const currentTime = new Date();
      const currentTimeISO = currentTime.toISOString();
      const currentTimeLocal = currentTime.toLocaleString();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const response = await fetch(todoUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: transcribedText,
          currentTime: {
            iso: currentTimeISO,
            local: currentTimeLocal,
            timezone: timezone,
            timestamp: currentTime.getTime()
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.tasks && Array.isArray(result.tasks)) {
        // Sort tasks by time - early morning first, late day last
        const sortedTasks = result.tasks.sort((a, b) => {
          // Get time strings for comparison, checking all possible time fields
          const timeA = a.start_time || a.due_time || a.time || null;
          const timeB = b.start_time || b.due_time || b.time || null;

          // Convert time strings (HH:mm) to minutes for easy comparison
          const getMinutes = (timeStr) => {
            if (!timeStr) return 1440; // End of day (24:00) for tasks without time

            // Handle different time formats that might come from AI
            let normalizedTime = timeStr;
            if (timeStr.includes('AM') || timeStr.includes('PM')) {
              // Convert 12-hour format to 24-hour format
              const time12h = timeStr.replace(/\s/g, '');
              const [time, period] = time12h.split(/(AM|PM)/i);
              let [hours, minutes = '0'] = time.split(':').map(Number);

              if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
              if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;

              normalizedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }

            // Parse HH:mm format
            const [hours, minutes] = normalizedTime.split(':').map(Number);
            if (isNaN(hours) || isNaN(minutes)) return 1440;

            return hours * 60 + minutes;
          };

          const minutesA = getMinutes(timeA);
          const minutesB = getMinutes(timeB);

          // Ascending order: earlier times first (smaller minutes first)
          return minutesA - minutesB;
        });

        setParsedTasks(sortedTasks);
        // Store the AI message for later display
        if (result.message) {
          setAiMessage(result.message);
        }
      } else {
        throw new Error('Invalid response format: tasks not found');
      }

    } catch (error) {
      console.error('AI processing error:', error);
      setProcessingError('Failed to process tasks. Please try again.');
      Alert.alert('Processing Error', 'Failed to process tasks: ' + error.message);
    } finally {
      setIsProcessingTasks(false);
    }
  };

  const saveAllTasks = async () => {
    if (parsedTasks.length === 0) {
      Alert.alert('No Tasks', 'No tasks to save.');
      return;
    }

    setIsSavingTasks(true);

    try {
      // Initialize task animations
      taskSaveAnims.length = 0;
      parsedTasks.forEach((_, index) => {
        taskSaveAnims[index] = new Animated.Value(1);
      });

      // Save tasks one by one with animation
      for (let i = 0; i < parsedTasks.length; i++) {
        setSavingTaskIndex(i);

        // Haptic feedback for each task
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Animate task being processed
        Animated.sequence([
          Animated.timing(taskSaveAnims[i], {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(taskSaveAnims[i], {
            toValue: 0.95,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(taskSaveAnims[i], {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();

        const task = parsedTasks[i];

        const todoData = {
          title: task.title,
          priority: task.priority !== undefined ? task.priority : 0, // Use AI priority or default to 0
          // Store date and time separately as the database expects
          due_date: task.date || null,
          start_date: task.date || null,
          start_time: task.start_time || task.due_time || null, // Use start_time or fall back to due_time
          end_time: task.end_time || null,
          // Convert single reminder to array format if it exists
          alert_minutes: task.reminder ? [task.reminder] : null,
        };

        const result = await todosService.addTodo(todoData);

        if (result.error) {
          throw new Error(`Failed to save task: ${task.title}`);
        }

        // Small delay between tasks for better UX
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show popup and trigger confetti simultaneously
      setShowSuccessPopup(true);
      setTriggerConfetti(true);

      // Stop confetti after 3 seconds (popup stays until user clicks OK)
      setTimeout(() => {
        setTriggerConfetti(false);
      }, 3000);

    } catch (error) {
      console.error('Save tasks error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Save Error', 'Failed to save some tasks: ' + error.message);
    } finally {
      setIsSavingTasks(false);
      setSavingTaskIndex(-1);
    }
  };





  const clearRecording = () => {
    setRecordedURI(null);
    setAudioFileSize(null);
    setTranscribedText('');
    setTranscriptionError(null);
    setParsedTasks([]);
    setProcessingError(null);
    setTypingText('');
    setAiMessage('');
  };

  const retryTranscription = async () => {
    if (recordedURI) {
      await transcribeAudio(recordedURI);
    }
  };

  const handleSuccessPopupOK = () => {
    setShowSuccessPopup(false);
    clearRecording();
    setParsedTasks([]);
    setAiMessage('');
    // Navigate to TodoMain (the main todo list screen)
    navigation.navigate('TodoMain');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>AI Todo</Text>
        <View style={{ width: 44 }} />
      </View>
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, styles.topAligned]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Blue Container - Collapsible */}
        {isBlueContainerCollapsed ? (
          <TouchableOpacity
            style={[styles.collapsedContainer, { backgroundColor: theme.colors.primary }]}
            onPress={() => setIsBlueContainerCollapsed(false)}
          >
            <View style={styles.collapsedContent}>
              <Text style={[styles.collapsedText, { color: '#ffffff' }]}>
                Tell us what you want to do
              </Text>
              <Text style={[styles.expandHint, { color: 'rgba(255,255,255,0.7)' }]}>
                Tap to expand
              </Text>
            </View>
            <ChevronDown size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
            <TouchableOpacity
              style={styles.mainHeaderContainer}
              onPress={() => setIsBlueContainerCollapsed(true)}
            >
              <Text style={[styles.transcriptionLabel, { color: '#ffffff' }]}>
                Tell us what you want to do:
              </Text>
              <ChevronUp size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>

            {isTranscribing ? (
              <View style={[
                styles.transcribingContainer,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border || theme.colors.textSecondary + '30'
                }
              ]}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.transcribingText, { color: theme.colors.textSecondary }]}>
                  {typingText}
                </Text>
              </View>
            ) : (
              <TextInput
                style={[
                  styles.transcriptionInput,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border || theme.colors.textSecondary + '30'
                  }
                ]}
                multiline
                numberOfLines={6}
                value={transcribedText}
                onChangeText={setTranscribedText}
                placeholder="Your transcribed todo will appear here..."
                placeholderTextColor={theme.colors.textSecondary}
                textAlignVertical="top"
              />
            )}

            {transcriptionError && (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: '#ffffff' }]}>
                  {transcriptionError}
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                  onPress={retryTranscription}
                >
                  <Text style={[styles.retryButtonText, { color: '#ffffff' }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}


            {processingError && (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: '#ffffff' }]}>
                  {processingError}
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                  onPress={processTasksWithAI}
                >
                  <Text style={[styles.retryButtonText, { color: '#ffffff' }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Recording Controls */}
            <View style={styles.recordingWrapper}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  recorderState.isRecording
                    ? [styles.stopButton, { backgroundColor: '#ff4444' }]
                    : [styles.startButton, { backgroundColor: 'rgba(255,255,255,0.2)' }],
                  !permissionGranted && [styles.disabledButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]
                ]}
                onPress={recorderState.isRecording ? stopRecording : startRecording}
                disabled={!permissionGranted}
              >
                <Animated.View
                  style={[
                    styles.micContainer,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  {recorderState.isRecording ? (
                    <>
                      <MicOff size={36} color="white" />
                      <Animated.View
                        style={[
                          styles.recordingDot,
                          { opacity: dotAnim }
                        ]}
                      />
                    </>
                  ) : (
                    <Mic size={36} color="white" />
                  )}
                </Animated.View>
              </TouchableOpacity>

              {recorderState.isRecording && (
                <Text style={[styles.recordingText, { color: '#ffffff' }]}>
                  Click again to stop
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Convert to Tasks Button - Outside Blue Rectangle */}
        {transcribedText && !isTranscribing && (
          <TouchableOpacity
            style={[styles.convertButton, { backgroundColor: '#22C55E' }]}
            onPress={processTasksWithAI}
            disabled={isProcessingTasks}
          >
            {isProcessingTasks ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="white" />
                <Text style={[styles.buttonText, { marginLeft: 8, color: '#ffffff' }]}>Converting...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Wand2 size={20} color="white" />
                <Text style={[styles.buttonText, { marginLeft: 8, color: '#ffffff' }]}>Convert to tasks</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Parsed Tasks Display */}
        {parsedTasks.length > 0 && (
          <View style={[styles.tasksContainer, { backgroundColor: '#ffffff' }]}>
            <TouchableOpacity
              style={styles.tasksHeaderContainer}
              onPress={() => setIsParsedTasksCollapsed(!isParsedTasksCollapsed)}
            >
              <Text style={[styles.tasksHeader, { color: theme.colors.text }]}>
                Parsed Tasks ({parsedTasks.length})
              </Text>
              {isParsedTasksCollapsed ? (
                <ChevronDown size={20} color={theme.colors.text} />
              ) : (
                <ChevronUp size={20} color={theme.colors.text} />
              )}
            </TouchableOpacity>

            {!isParsedTasksCollapsed && (
              <>
                {parsedTasks.map((task, index) => (
                  <Animated.View
                    key={index}
                    style={{
                      transform: [{ scale: taskSaveAnims[index] || 1 }],
                      opacity: savingTaskIndex === index ? 0.7 : 1,
                    }}
                  >
                    <TodoListItem
                      item={{
                        ...task,
                        priority: task.priority !== undefined ? task.priority : 0, // Use AI priority
                        completed: false, // Never show tasks as completed during preview/saving
                        // Transform AI response fields to match TodoListItem expectations
                        start_date: task.date || task.start_date || null,
                        due_date: task.date || task.due_date || null,
                        start_time: task.start_time || task.due_time || null,
                      }}
                      showCheckbox={true}
                      onToggleComplete={() => {}} // No-op for parsed tasks
                    />
                    {savingTaskIndex === index && (
                      <View style={styles.savingOverlay}>
                        <ActivityIndicator size="small" color="#22C55E" />
                        <Text style={[styles.savingText, { color: '#22C55E' }]}>Saving...</Text>
                      </View>
                    )}
                  </Animated.View>
                ))}

                <TouchableOpacity
                  style={[styles.saveAllButton, { backgroundColor: '#22C55E' }]}
                  onPress={saveAllTasks}
                  disabled={isSavingTasks}
                >
                  {isSavingTasks ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator size="small" color="white" />
                      <Text style={[styles.buttonText, { marginLeft: 8 }]}>Saving...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Plus size={20} color="white" />
                      <Text style={[styles.buttonText, { marginLeft: 8 }]}>Add all tasks to your todo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Audio Player and Results */}
        {recordedURI && (
          <View style={[styles.resultContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.recordingInfo}>
              <Text style={[styles.resultText, { color: theme.colors.primary }]}>Recording Complete</Text>
              {audioFileSize && (
                <Text style={[styles.fileSizeText, { color: theme.colors.textSecondary }]}>
                  {audioFileSize}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: theme.colors.danger || '#f44336' }]}
              onPress={clearRecording}
            >
              <Text style={styles.buttonText}>Clear Recording</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Permission Status */}
        <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
          Microphone: {permissionGranted ? '✓ Granted' : '✗ Not granted'}
        </Text>
      </ScrollView>


      {/* Confetti Component */}
      <Confetti
        ref={confettiRef}
        autoplay={triggerConfetti}
        loop={false}
        duration={3000}
        particleCount={150}
        spread={360}
        startVelocity={45}
        colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#A8E6CF', '#FFB6C1', '#98D8E8']}
        emissionRate={50}
        explosiveness={0.8}
        gravity={0.8}
        decay={0.94}
      />

      {/* Custom Success Popup Modal */}
      <Modal
        visible={showSuccessPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessPopupOK}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            <Text style={styles.popupEmoji}>🎉</Text>
            <Text style={styles.popupTitle}>Success!</Text>
            <Text style={styles.popupMessage}>
              {aiMessage || 'Tasks have been added successfully!'}
            </Text>
            <TouchableOpacity
              style={styles.popupButton}
              onPress={handleSuccessPopupOK}
            >
              <Text style={styles.popupButtonText}>OK</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  topAligned: {
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  mainContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  mainHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transcriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  transcriptionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
    marginBottom: 16,
  },
  transcribingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 12,
    gap: 10,
    borderRadius: 8,
    marginBottom: 16,
    minHeight: 120,
    maxHeight: 200,
    borderWidth: 1,
  },
  transcribingText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  errorContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  recordButton: {
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    maxHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    overflow: 'hidden',
  },
  startButton: {},
  stopButton: {},
  disabledButton: {},
  recordingWrapper: {
    width: '100%',
    marginTop: 16,
  },
  recordingGlow: {
    shadowColor: '#ff4444',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  micContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
    opacity: 0.9,
  },
  resultContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  recordingInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  fileSizeText: {
    fontSize: 12,
    textAlign: 'center',
  },
  playerContainer: {
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  playerLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  playerControls: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 10,
  },
  playerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerStatus: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  durationText: {
    fontSize: 12,
    textAlign: 'center',
  },
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  permissionText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  processButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  convertButton: {
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    maxHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tasksContainer: {
    marginTop: 20,
    paddingVertical: 20,
    borderRadius: 12,
  },
  tasksHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  tasksHeader: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  saveAllButton: {
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    maxHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  collapsedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  collapsedContent: {
    flex: 1,
  },
  collapsedText: {
    fontSize: 16,
    fontWeight: '600',
  },
  expandHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    gap: 8,
  },
  savingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  popupContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    minWidth: 280,
    maxWidth: '90%',
  },
  popupEmoji: {
    fontSize: 50,
    marginBottom: 16,
  },
  popupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22C55E',
    textAlign: 'center',
    marginBottom: 12,
  },
  popupMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  popupButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  popupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});