import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';
import { Mic, MicOff, Check, Clock, Calendar, Wand2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { apple } from '@react-native-ai/apple';
import { experimental_transcribe as transcribe, generateText } from 'ai';
import BackButton from '../../components/BackButton';
import { useTheme } from '../../context/ThemeContext';
import { todosService } from '../../services/todosService';

export default function NewAiTodoScreen({ navigation }) {
  const { theme } = useTheme();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [recordedURI, setRecordedURI] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedTasks, setParsedTasks] = useState([]);
  const [aiMessage, setAiMessage] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnim = useRef(new Animated.Value(1)).current;

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

  // Debug: Log when button should appear
  useEffect(() => {
    console.log('=== Button visibility check ===');
    console.log('transcribedText:', !!transcribedText);
    console.log('isTranscribing:', isTranscribing);
    console.log('parsedTasks.length:', parsedTasks.length);
    console.log('Should show button:', !!transcribedText && !isTranscribing && parsedTasks.length === 0);
  }, [transcribedText, isTranscribing, parsedTasks]);

  // Recording animation effect
  useEffect(() => {
    if (recorderState.isRecording) {
      // Start pulsing animation
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
      console.log('=== Starting recording ===');
      // Clear previous transcription and tasks
      setTranscribedText('');
      setTranscriptionError(null);
      setRecordedURI(null);
      setParsedTasks([]);
      setAiMessage('');

      await audioRecorder.prepareToRecordAsync();
      console.log('Audio recorder prepared');
      await audioRecorder.record();
      console.log('Recording started successfully');
    } catch (error) {
      console.error('=== Failed to start recording ===');
      console.error('Error message:', error.message);
      Alert.alert('Error', 'Failed to start recording: ' + error.message);
    }
  };

  const stopRecording = async () => {
    try {
      console.log('=== Stopping recording ===');
      await audioRecorder.stop();

      // Get the recording URI
      const uri = audioRecorder.uri;
      setRecordedURI(uri);
      console.log('Recording stopped and stored at:', uri);

      // Transcribe audio using Apple's on-device transcription
      if (uri) {
        await transcribeAudio(uri);
      } else {
        console.error('No URI available after recording stopped');
        Alert.alert('Error', 'Recording URI not available');
      }
    } catch (error) {
      console.error('=== Error stopping recording ===');
      console.error('Error message:', error.message);
      Alert.alert('Error', 'Failed to stop recording: ' + error.message);
    }
  };

  const transcribeAudio = async (uri) => {
    console.log('=== Starting transcription process ===');
    console.log('URI to transcribe:', uri);
    setIsTranscribing(true);
    setTranscriptionError(null);

    try {
      // Read the audio file as a buffer
      const response = await fetch(uri);
      const audioBuffer = await response.arrayBuffer();

      // Use @react-native-ai/apple for transcription
      const { text } = await transcribe({
        model: apple.transcriptionModel(),
        audio: audioBuffer
      });

      console.log('Transcription received:', text);
      setTranscribedText(text);
      console.log('Transcription state set, button should appear now');

      // Haptic feedback on success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (error) {
      console.error('=== Error transcribing audio ===');
      console.error('Error message:', error.message);
      setTranscriptionError('Failed to transcribe audio. Please try again.');
      Alert.alert('Transcription Error', 'Failed to transcribe audio: ' + error.message);

      // Haptic feedback on error
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsTranscribing(false);
      console.log('=== Transcription process ended ===');
    }
  };

  const clearRecording = () => {
    setRecordedURI(null);
    setTranscribedText('');
    setTranscriptionError(null);
    setParsedTasks([]);
    setAiMessage('');
  };

  const retryTranscription = async () => {
    if (recordedURI) {
      await transcribeAudio(recordedURI);
    }
  };

  const processWithAI = async () => {
    if (!transcribedText) {
      Alert.alert('Error', 'No transcription available to process');
      return;
    }

    console.log('=== Starting AI processing ===');
    setIsProcessing(true);
    setParsedTasks([]);
    setAiMessage('');

    try {
      // Get current time context
      const now = new Date();
      const currentTime = {
        iso: now.toISOString(),
        local: now.toLocaleString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: now.getTime()
      };

      // Build the prompt for Apple AI
      const systemPrompt = `You are an elite task management AI assistant with exceptional natural language understanding capabilities. Your primary function is to analyze user input and intelligently extract actionable tasks with precise timing and contextual details.

CORE CAPABILITIES:
- Parse complex, conversational text into structured actionable tasks
- Intelligently infer dates, times, priorities, and contexts from natural language
- Handle multiple tasks in a single input with sophisticated disambiguation
- Recognize implicit scheduling patterns and user intent
- Extract timing, duration, and reminder preferences from context

PARSING INTELLIGENCE:
1. DATE & TIME EXTRACTION:
   - Today, tomorrow, next week, this weekend, etc.
   - Specific dates: "March 15th", "next Monday", "in 2 weeks"
   - Time references: "morning", "afternoon", "evening", "9 AM", "after lunch"
   - Relative timing: "before the meeting", "after work", "by end of day"

2. SMART DEFAULTS & CONTEXT AWARENESS:
   - Use current time context to make intelligent scheduling decisions
   - If no specific time given, use appropriate defaults relative to current time
   - Business tasks default to business hours
   - Personal tasks can be scheduled flexibly
   - Meal-related timing: breakfast (6-9 AM), lunch (11 AM-2 PM), dinner (5-8 PM)
   - "Before meal" timing depends on current time of day
   - Current time: ${currentTime.local}

3. REMINDER LOGIC:
   - Default reminders: 15 minutes for meetings, 60 minutes for appointments
   - "Don't forget" = 30 minutes reminder
   - "Urgent" or "Important" = 60 minutes reminder
   - "ASAP" = 15 minutes reminder

4. PRIORITY DETECTION:
   - High priority (2): "urgent", "ASAP", "critical", "important", "priority", "emergency", "must do", "can't miss"
   - Medium priority (1): "should", "need to", "important", "reminder", "don't forget"
   - Low priority (0): "maybe", "when possible", "if time", "eventually", "sometime", default for routine tasks

RESPONSE FORMAT:
Return ONLY valid JSON in this exact structure:
{
  "message": "Brief confirmation of what was understood",
  "tasks": [
    {
      "title": "Clear, actionable task title",
      "start_time": "HH:MM",
      "due_time": "HH:MM",
      "date": "YYYY-MM-DD",
      "reminder": 15,
      "priority": 0
    }
  ]
}

CRITICAL RULES:
- NEVER include explanatory text outside the JSON
- ALL dates must be valid and realistic (not in the past unless specifically historical)
- Times must be in 24-hour format (HH:MM)
- Dates must be in YYYY-MM-DD format
- Prioritize user intent over literal interpretation
- If ambiguous, make reasonable assumptions based on context
- Minimum viable tasks - every task must be actionable
- Maximum 10 tasks per response to maintain quality
- If no specific time mentioned, estimate appropriate timing
- Reminder values should be realistic: 0, 15, 30, 60, or 1440 (24 hours)
- Priority values must be: 0 (low), 1 (medium), or 2 (high)`;

      const userPrompt = `Current time context: ${JSON.stringify(currentTime)}

User said: "${transcribedText}"

Parse this into actionable tasks following the format specified.`;

      console.log('Sending to Apple AI...');

      // Use Apple's on-device AI to process the text
      const { text } = await generateText({
        model: apple(),
        prompt: `${systemPrompt}\n\n${userPrompt}`
      });

      console.log('Raw AI response:', text);

      // Parse the JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      console.log('Parsed response:', parsedResponse);

      if (parsedResponse.tasks && parsedResponse.tasks.length > 0) {
        setParsedTasks(parsedResponse.tasks);
        setAiMessage(parsedResponse.message || 'Tasks parsed successfully');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('No Tasks', 'Could not extract any tasks from the transcription');
      }

    } catch (error) {
      console.error('=== Error processing with AI ===');
      console.error('Error message:', error.message);
      Alert.alert('Processing Error', 'Failed to process tasks: ' + error.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(false);
      console.log('=== AI processing ended ===');
    }
  };

  const saveTasks = async () => {
    if (parsedTasks.length === 0) {
      Alert.alert('Error', 'No tasks to save');
      return;
    }

    try {
      console.log('=== Saving tasks ===');

      for (const task of parsedTasks) {
        const todoData = {
          title: task.title,
          date: task.date,
          start_time: task.start_time,
          due_time: task.due_time,
          reminder: task.reminder,
          priority: task.priority,
          completed: false,
        };

        console.log('Adding todo:', todoData);
        await todosService.addTodo(todoData);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Success',
        `${parsedTasks.length} task(s) saved successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear everything
              clearRecording();
              // Navigate back
              navigation.goBack();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error saving tasks:', error);
      Alert.alert('Error', 'Failed to save tasks: ' + error.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>AI Todo (New)</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            This screen uses Apple's on-device AI for transcription
          </Text>
        </View>

        {/* Main Container */}
        <View style={[styles.mainContainer, {
          backgroundColor: theme.colors.primary,
          shadowColor: theme.colors.primary,
        }]}>
          <Text style={[styles.transcriptionLabel, { color: '#ffffff' }]}>
            Tell us what you want to do:
          </Text>

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
                Transcribing with Apple AI...
              </Text>
            </View>
          ) : transcribedText ? (
            <View style={[
              styles.transcriptionResultContainer,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border || theme.colors.textSecondary + '30'
              }
            ]}>
              <Text style={[styles.transcriptionResult, { color: theme.colors.text }]}>
                {transcribedText}
              </Text>
            </View>
          ) : (
            <View style={[
              styles.placeholderContainer,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border || theme.colors.textSecondary + '30'
              }
            ]}>
              <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                Your transcribed todo will appear here...
              </Text>
            </View>
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

        {/* Convert to Tasks Button - Outside Blue Container */}
        {transcribedText && !isTranscribing && parsedTasks.length === 0 && (
          <TouchableOpacity
            style={[styles.convertButton, { backgroundColor: '#22C55E' }]}
            onPress={processWithAI}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="white" />
                <Text style={[styles.convertButtonText, { marginLeft: 8, color: '#ffffff' }]}>Converting...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Wand2 size={20} color="white" />
                <Text style={[styles.convertButtonText, { marginLeft: 8, color: '#ffffff' }]}>Convert to tasks</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* AI Message */}
        {aiMessage && (
          <View style={[styles.aiMessageContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.aiMessageText, { color: theme.colors.text }]}>
              {aiMessage}
            </Text>
          </View>
        )}

        {/* Parsed Tasks */}
        {parsedTasks.length > 0 && (
          <View style={[styles.tasksContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.tasksHeader, { color: theme.colors.text }]}>
              Found {parsedTasks.length} task(s):
            </Text>

            {parsedTasks.map((task, index) => (
              <View key={index} style={[styles.taskCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <View style={styles.taskHeader}>
                  <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{task.title}</Text>
                  {task.priority === 2 && (
                    <View style={[styles.priorityBadge, { backgroundColor: '#FF3B30' }]}>
                      <Text style={styles.priorityText}>High</Text>
                    </View>
                  )}
                  {task.priority === 1 && (
                    <View style={[styles.priorityBadge, { backgroundColor: '#FF9500' }]}>
                      <Text style={styles.priorityText}>Med</Text>
                    </View>
                  )}
                </View>

                <View style={styles.taskDetails}>
                  <View style={styles.taskDetailRow}>
                    <Calendar size={14} color={theme.colors.textSecondary} />
                    <Text style={[styles.taskDetailText, { color: theme.colors.textSecondary }]}>
                      {task.date}
                    </Text>
                  </View>

                  <View style={styles.taskDetailRow}>
                    <Clock size={14} color={theme.colors.textSecondary} />
                    <Text style={[styles.taskDetailText, { color: theme.colors.textSecondary }]}>
                      {task.start_time} - {task.due_time}
                    </Text>
                  </View>

                  {task.reminder > 0 && (
                    <View style={styles.taskDetailRow}>
                      <Text style={[styles.taskDetailText, { color: theme.colors.textSecondary }]}>
                        🔔 {task.reminder} min reminder
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={saveTasks}
            >
              <Check size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>Save All Tasks</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Permission Status */}
        <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
          Microphone: {permissionGranted ? ' Granted' : ' Not granted'}
        </Text>
      </ScrollView>
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
  infoBanner: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  mainContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
  },
  transcriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
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
    borderWidth: 1,
  },
  transcribingText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  transcriptionResultContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    minHeight: 120,
    borderWidth: 1,
  },
  transcriptionResult: {
    fontSize: 16,
    lineHeight: 24,
  },
  placeholderContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    minHeight: 120,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
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
  },
  startButton: {},
  stopButton: {},
  disabledButton: {},
  recordingWrapper: {
    width: '100%',
    marginTop: 16,
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
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  convertButton: {
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
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
  convertButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 10,
  },
  processingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  aiMessageContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  aiMessageText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  tasksContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  tasksHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  taskCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  taskDetails: {
    gap: 6,
  },
  taskDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskDetailText: {
    fontSize: 14,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 8,
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});
