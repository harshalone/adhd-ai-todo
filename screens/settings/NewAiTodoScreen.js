import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';
import { Mic, MicOff, Sparkles, Check, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { apple } from '@react-native-ai/apple';
import { experimental_transcribe as transcribe, generateText } from 'ai';
import BackButton from '../../components/BackButton';
import { useTheme } from '../../context/ThemeContext';
import { todosService } from '../../services/todosService';
import { Confetti } from 'react-native-fast-confetti';
import TodoListItem from '../../components/TodoListItem';

const TRANSCRIPTION_MESSAGES = [
  "Recording complete! Let me transcribe this for you...",
  "Converting your voice into text...",
  "Almost there, processing your words...",
  "Making sense of what you said...",
  "Finalizing your transcription...",
  "Just a moment, wrapping up..."
];

const AI_PROCESSING_MESSAGES = [
  "Analyzing your tasks with AI...",
  "Understanding what needs to be done...",
  "Breaking down your todos...",
  "Creating actionable items...",
  "Adding smart scheduling...",
  "Almost ready with your tasks..."
];

export default function NewAiTodoScreen({ navigation }) {
  const { theme } = useTheme();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedTasks, setParsedTasks] = useState([]);
  const [autoProcess, setAutoProcess] = useState(true);
  const [transcriptionMessage, setTranscriptionMessage] = useState('');
  const [processingMessage, setProcessingMessage] = useState('');
  const [savingTaskIndex, setSavingTaskIndex] = useState(-1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedTasksCount, setSavedTasksCount] = useState(0);

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef(null);

  // Current step tracking (0: record, 1: review, 2: save)
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (status.granted) {
          setPermissionGranted(true);
        } else {
          Alert.alert('Permission Denied', 'Permission to access microphone was denied');
        }

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

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 10,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Progress bar animation
  useEffect(() => {
    const targetWidth = (currentStep / 2) * 100;
    Animated.timing(progressWidth, {
      toValue: targetWidth,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Glow animation when idle
  useEffect(() => {
    if (!recorderState.isRecording && !isTranscribing && !isProcessing) {
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      glowAnimation.start();
      return () => glowAnimation.stop();
    }
  }, [recorderState.isRecording, isTranscribing, isProcessing]);

  // Recording pulse animation
  useEffect(() => {
    if (recorderState.isRecording) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => {
        pulseAnimation.stop();
        pulseAnim.setValue(1);
      };
    }
  }, [recorderState.isRecording]);

  const startRecording = async () => {
    if (!permissionGranted) {
      Alert.alert('Permission Required', 'Microphone permission is required to record audio');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      setTranscribedText('');
      setTranscriptionError(null);
      setParsedTasks([]);
      setCurrentStep(0);

      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record();
    } catch (error) {
      console.error('Failed to start recording:', error.message);
      Alert.alert('Error', 'Failed to start recording: ' + error.message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const stopRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await audioRecorder.stop();

      const uri = audioRecorder.uri;
      setCurrentStep(1);

      if (uri) {
        await transcribeAudio(uri);
      } else {
        Alert.alert('Error', 'Recording URI not available');
      }
    } catch (error) {
      console.error('Error stopping recording:', error.message);
      Alert.alert('Error', 'Failed to stop recording: ' + error.message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const transcribeAudio = async (uri) => {
    setIsTranscribing(true);
    setTranscriptionError(null);

    // Start cycling through transcription messages
    let messageIndex = 0;
    setTranscriptionMessage(TRANSCRIPTION_MESSAGES[0]);

    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % TRANSCRIPTION_MESSAGES.length;
      setTranscriptionMessage(TRANSCRIPTION_MESSAGES[messageIndex]);
    }, 2000); // Change message every 2 seconds

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const response = await fetch(uri);
      const audioBuffer = await response.arrayBuffer();

      const { text } = await transcribe({
        model: apple.transcriptionModel(),
        audio: audioBuffer
      });

      setTranscribedText(text);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (autoProcess && text) {
        setTimeout(() => processWithAI(text), 500);
      }

    } catch (error) {
      console.error('Error transcribing audio:', error.message);
      setTranscriptionError('Failed to transcribe audio. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      clearInterval(messageInterval);
      setIsTranscribing(false);
    }
  };

  const processWithAI = async (textToProcess = null) => {
    const text = textToProcess || transcribedText;
    if (!text) {
      return;
    }

    setIsProcessing(true);
    setParsedTasks([]);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Start cycling through AI processing messages
    let messageIndex = 0;
    setProcessingMessage(AI_PROCESSING_MESSAGES[0]);

    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % AI_PROCESSING_MESSAGES.length;
      setProcessingMessage(AI_PROCESSING_MESSAGES[messageIndex]);
    }, 2000); // Change message every 2 seconds

    try {
      const now = new Date();
      const currentTime = {
        iso: now.toISOString(),
        local: now.toLocaleString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: now.getTime()
      };

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

User said: "${text}"

Parse this into actionable tasks following the format specified.`;

      const { text: aiResponse } = await generateText({
        model: apple(),
        prompt: `${systemPrompt}\n\n${userPrompt}`
      });

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);

      if (parsedResponse.tasks && parsedResponse.tasks.length > 0) {
        setParsedTasks(parsedResponse.tasks);
        // Keep at step 1 (Review) until user saves
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // No tasks found, stay at review step
      }

    } catch (error) {
      console.error('Error processing with AI:', error.message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      clearInterval(messageInterval);
      setIsProcessing(false);
    }
  };

  const saveTasks = async () => {
    if (parsedTasks.length === 0) {
      return;
    }

    try {
      // Save tasks one by one with animation
      for (let i = 0; i < parsedTasks.length; i++) {
        setSavingTaskIndex(i);

        // Haptic feedback for each task
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const task = parsedTasks[i];
        const todoData = {
          title: task.title,
          date: task.date,
          start_time: task.start_time,
          due_time: task.due_time,
          reminder: task.reminder,
          priority: task.priority,
          completed: false,
        };

        await todosService.addTodo(todoData);

        // Small delay between tasks for better UX
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      setSavingTaskIndex(-1);
      setSavedTasksCount(parsedTasks.length);

      // Move progress to Save (step 2)
      setCurrentStep(2);

      // Success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Trigger confetti
      if (confettiRef.current) {
        confettiRef.current.restart();
      }

      // Show success modal after a brief delay
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 500);

    } catch (error) {
      console.error('Error saving tasks:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setParsedTasks([]);
    setTranscribedText('');
    setCurrentStep(0);
  };

  const deleteTask = async (index) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newTasks = parsedTasks.filter((_, i) => i !== index);
    setParsedTasks(newTasks);

    // If no tasks left, go back to step 0
    if (newTasks.length === 0) {
      setCurrentStep(0);
      setTranscribedText('');
    }
  };

  const getHeroButtonOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1],
  });

  const getHeroButtonScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  const progressWidthInterpolated = progressWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Convert parsed tasks to TodoListItem format
  const convertToTodoFormat = (task) => ({
    title: task.title,
    start_date: task.date,
    start_time: task.start_time,
    due_date: task.date,
    priority: task.priority,
    alert_minutes: task.reminder,
    completed: false,
  });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Confetti
        ref={confettiRef}
        count={200}
        autoplay={false}
        fadeOutOnEnd={true}
      />

      {/* Header with thin progress bar */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.headerCenter} />
          <View style={styles.headerRight} />
        </View>

        {/* Thin progress bar */}
        <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.border + '30' }]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: theme.colors.primary,
                width: progressWidthInterpolated
              }
            ]}
          />
        </View>

        {/* Progress labels */}
        <View style={styles.progressLabels}>
          <Text style={[
            styles.progressLabel,
            currentStep === 0 && [styles.progressLabelActive, { color: theme.colors.primary }],
            currentStep !== 0 && { color: theme.colors.textSecondary }
          ]}>
            Record
          </Text>
          <Text style={[
            styles.progressLabel,
            currentStep === 1 && [styles.progressLabelActive, { color: theme.colors.primary }],
            currentStep !== 1 && { color: theme.colors.textSecondary }
          ]}>
            Review
          </Text>
          <Text style={[
            styles.progressLabel,
            currentStep === 2 && [styles.progressLabelActive, { color: theme.colors.primary }],
            currentStep !== 2 && { color: theme.colors.textSecondary }
          ]}>
            Save
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }}>

          {/* Main Hero Section */}
          {!transcribedText && !isTranscribing && parsedTasks.length === 0 && (
            <View style={styles.heroSection}>
              <View style={styles.heroTextContainer}>
                <View style={styles.heroTitleRow}> 
                  <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
                    What's on your mind?
                  </Text>
                </View>
                <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
                  Tap the button below and speak naturally
                </Text>
              </View>

              {/* Giant Hero Button */}
              <View style={styles.heroButtonWrapper}>
                <TouchableOpacity
                  style={styles.heroButtonContainer}
                  onPress={recorderState.isRecording ? stopRecording : startRecording}
                  disabled={!permissionGranted}
                  activeOpacity={0.85}
                >
                  <Animated.View
                    style={[
                      styles.heroButton,
                      recorderState.isRecording
                        ? { backgroundColor: '#FF3B30' }
                        : { backgroundColor: theme.colors.primary },
                      !permissionGranted && styles.heroButtonDisabled,
                      {
                        transform: [
                          { scale: recorderState.isRecording ? pulseAnim : getHeroButtonScale },
                        ],
                        opacity: recorderState.isRecording ? 1 : getHeroButtonOpacity,
                      },
                    ]}
                  >
                    {recorderState.isRecording ? (
                      <MicOff size={64} color="white" strokeWidth={2.5} />
                    ) : (
                      <Mic size={64} color="white" strokeWidth={2.5} />
                    )}
                  </Animated.View>
                </TouchableOpacity>

                <Text style={[styles.heroInstruction, { color: theme.colors.textSecondary }]}>
                  {recorderState.isRecording ? 'Tap to finish' : 'Tap to start'}
                </Text>
              </View>
            </View>
          )}

          {/* Transcribing State */}
          {isTranscribing && (
            <View style={styles.statusCard}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
                Processing...
              </Text>
              <Text style={[styles.statusSubtitle, { color: theme.colors.textSecondary }]}>
                {transcriptionMessage}
              </Text>
            </View>
          )}

          {/* Processing State */}
          {isProcessing && (
            <View style={styles.statusCard}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
                Creating Tasks...
              </Text>
              <Text style={[styles.statusSubtitle, { color: theme.colors.textSecondary }]}>
                {processingMessage}
              </Text>
            </View>
          )}

          {/* Parsed Tasks */}
          {parsedTasks.length > 0 && (
            <View style={styles.tasksSection}>
              <View style={styles.tasksList}>
                {parsedTasks.map((task, index) => (
                  <View key={index} style={styles.taskItemContainer}>
                    <View style={styles.taskItemWrapper}>
                      <View style={styles.taskItemContent}>
                        <TodoListItem
                          item={convertToTodoFormat(task)}
                          showCheckbox={false}
                        />
                      </View>
                      {savingTaskIndex < 0 && (
                        <TouchableOpacity
                          style={styles.deleteTaskButton}
                          onPress={() => deleteTask(index)}
                        >
                          <View style={[styles.deleteIconContainer, { backgroundColor: '#FF3B30' }]}>
                            <Trash2 size={18} color="white" strokeWidth={2.5} />
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                    {savingTaskIndex === index && (
                      <View style={styles.checkOverlay}>
                        <View style={[styles.checkCircle, { backgroundColor: '#22C55E' }]}>
                          <Check size={24} color="white" strokeWidth={3} />
                        </View>
                      </View>
                    )}
                    {savingTaskIndex > index && (
                      <View style={styles.savedIndicator}>
                        <View style={[styles.smallCheckCircle, { backgroundColor: '#22C55E' }]}>
                          <Check size={16} color="white" strokeWidth={3} />
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: theme.colors.primary },
                  savingTaskIndex >= 0 && styles.saveButtonDisabled
                ]}
                onPress={saveTasks}
                disabled={savingTaskIndex >= 0}
              >
                <Text style={styles.saveButtonText}>
                  {savingTaskIndex >= 0
                    ? `Saving ${savingTaskIndex + 1}/${parsedTasks.length}...`
                    : `Save ${parsedTasks.length} Task${parsedTasks.length > 1 ? 's' : ''}`
                  }
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Success!
            </Text>
            <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
              {savedTasksCount} task{savedTasksCount > 1 ? 's have' : ' has'} been added to your todo list!
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSuccessModalClose}
            >
              <Text style={styles.modalButtonText}>OK</Text>
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
  headerContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000010',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerCenter: {
    flex: 1,
  },
  headerRight: {
    width: 44,
  },
  progressBarContainer: {
    height: 3,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: 1.5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  progressLabelActive: {
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingBottom: 40,
    width: '100%',
  },
  heroTextContainer: {
    alignItems: 'flex-start',
    marginBottom: 40,
    gap: 12,
    width: '100%',
    paddingHorizontal: 4,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    flex: 1,
  },
  heroSubtitle: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.2,
    paddingLeft: 0,
  },
  heroButtonWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  heroButtonContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  heroButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  heroButtonDisabled: {
    opacity: 0.4,
  },
  heroInstruction: {
    fontSize: 17,
    fontWeight: '500',
    marginTop: 16,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  statusCard: {
    padding: 60,
    alignItems: 'center',
    gap: 16,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: -0.3,
  },
  statusSubtitle: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  tasksSection: {
    gap: 16,
  },
  tasksList: {
    gap: 8,
  },
  taskItemContainer: {
    position: 'relative',
  },
  taskItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskItemContent: {
    flex: 1,
  },
  deleteTaskButton: {
    padding: 4,
  },
  deleteIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteIcon: {
    fontSize: 18,
  },
  checkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  savedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  smallCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    minWidth: 280,
    maxWidth: '90%',
  },
  modalEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  modalMessage: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    letterSpacing: -0.2,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});
