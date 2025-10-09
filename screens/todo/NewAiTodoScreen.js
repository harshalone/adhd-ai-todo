import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Animated, Modal, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';
import { Mic, Sparkles, Check, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { apple } from '@react-native-ai/apple';
import { experimental_transcribe as transcribe, generateText } from 'ai';
import BackButton from '../../components/BackButton';
import { useTheme } from '../../context/ThemeContext';
import { todosService } from '../../services/todosService';
import { Confetti } from 'react-native-fast-confetti';
import TodoListItem from '../../components/TodoListItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TRANSCRIPTION_MESSAGES = [
  "Recording complete! Let me transcribe this for you...",
  "Converting your voice into text...",
  "Almost there, processing your words...",
  "Making sense of what you said...",
  "Finalizing your transcription...",
  "Just a moment, wrapping up..."
];

// Waveform Bar Component
const WaveformBar = ({ height, theme, index }) => {
  const animatedHeight = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedHeight, {
          toValue: Math.random() * 60 + 20,
          duration: 300 + Math.random() * 200,
          useNativeDriver: false,
        }),
        Animated.timing(animatedHeight, {
          toValue: Math.random() * 60 + 20,
          duration: 300 + Math.random() * 200,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.waveformBar,
        {
          height: animatedHeight,
          backgroundColor: theme.colors.primary,
        },
      ]}
    />
  );
};


export default function NewAiTodoScreen({ navigation }) {
  const { theme, isDark } = useTheme();
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
  const [typewriterText, setTypewriterText] = useState('');
  const [savingTaskIndex, setSavingTaskIndex] = useState(-1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedTasksCount, setSavedTasksCount] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: '', description: '' });
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef(null);

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

  // Recording timer
  useEffect(() => {
    if (recorderState.isRecording) {
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [recorderState.isRecording]);

  // Format recording time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

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
      // Don't advance progress bar yet - wait for successful task creation

      if (uri) {
        await transcribeAudio(uri);
      } else {
        setErrorMessage({
          title: 'Recording Failed',
          description: 'Recording not available. Please try recording again.'
        });
        setShowErrorModal(true);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Error stopping recording:', error.message);
      setErrorMessage({
        title: 'Recording Error',
        description: 'Failed to stop recording. Please try again.'
      });
      setShowErrorModal(true);
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

      // Normalize transcription: replace periods with commas for better task parsing
      // This helps the AI parser identify separate time-task pairs
      const normalizedText = text
        .replace(/\.\s+/g, ', ')  // Replace ". " with ", "
        .replace(/,\s*,/g, ',')   // Remove duplicate commas
        .trim();

      console.log('Transcribed text (original):', text);
      console.log('Transcribed text (normalized):', normalizedText);
      setTranscribedText(normalizedText);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (autoProcess && normalizedText) {
        setTimeout(() => processWithAI(normalizedText), 500);
      }

    } catch (error) {
      console.error('Error transcribing audio:', error.message);
      setErrorMessage({
        title: 'Transcription Failed',
        description: 'Could not transcribe your audio. Please ensure you spoke clearly and try recording again.'
      });
      setShowErrorModal(true);
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

    // Start typewriter animation
    setTypewriterText('');
    let currentIndex = 0;
    let typewriterInterval = setInterval(() => {
      if (currentIndex <= text.length) {
        setTypewriterText(text.substring(0, currentIndex));
        currentIndex++;
      }
    }, 30); // Add character every 30ms

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
- Understand conversational flow where times may be stated before or after tasks

CRITICAL PARSING RULES FOR CONVERSATIONAL INPUT:

STEP-BY-STEP PARSING APPROACH:
1. First, read through the ENTIRE input and identify ALL time markers (6 AM, 830, 9, 1130, 12, 2 PM, etc.)
2. Then, read through again and identify ALL tasks/activities mentioned
3. Match each task to its associated time by analyzing the exact position and sentence structure
4. Build the task list by going through the text sequentially, ensuring every time marker is used

TIME-TASK MATCHING RULES:
1. IDENTIFY TIME MARKERS (recognize ALL formats):
   NUMERIC formats:
   - "6 AM", "8:30", "9 AM", "1130", "12", "2 PM"
   - Bare numbers: 830, 9, 1130, 12 are times, not quantities

   WORD formats (transcription often converts numbers to words):
   - "six AM", "six", "six o'clock" = 6:00
   - "eight thirty", "eight 30" = 8:30
   - "nine", "nine AM", "nine o'clock" = 9:00
   - "eleven thirty", "eleven 30", "1130" = 11:30
   - "twelve", "twelve noon", "noon" = 12:00
   - "two PM", "two", "two o'clock" = 14:00 (if afternoon context)

   MIXED formats:
   - "6 AM" or "six AM" = same time
   - "830" or "eight thirty" or "eight 30" = same time
   - Be flexible with spacing and formatting

   - Count ALL time markers (numeric OR word-based) - you must create a task for each one

2. MATCH TIME TO TASK:
   - Read each sentence/clause carefully
   - A time and task in the SAME sentence/clause belong together

   Example 1 (numeric): "running at 6 AM, then 8:30, I want breakfast, 9 AM call with Paul, 1130 lunch"
     Parse as:
     * "running at 6 AM" → Running = 6:00 AM
     * "then 8:30, I want breakfast" → Breakfast = 8:30 AM
     * "9 AM call with Paul" → Call with Paul = 9:00 AM
     * "1130 lunch" → Lunch = 11:30 AM

   Example 2 (word-based): "running at six AM, then eight thirty, I want breakfast, nine AM call with Paul"
     Parse as:
     * "running at six AM" → Running = 6:00 AM
     * "then eight thirty, I want breakfast" → Breakfast = 8:30 AM
     * "nine AM call with Paul" → Call with Paul = 9:00 AM

   - If you see time (word or number) followed by task, that's the time for that task
   - If you see task followed by time (word or number), that time applies to that task
   - Commas and periods separate different time-task pairs
   - Words like "six", "nine", "eleven" in context with tasks are TIMES not quantities

3. COMMON PATTERNS:
   - "at X, do Y" = task Y at time X
   - "do Y at X" = task Y at time X
   - "X, do Y" = task Y at time X
   - "do Y, X" = task Y at time X
   - "do Y. X do Z" = Z at time X (Y inferred earlier)
   - Position matters: match time with the NEAREST task description

4. VALIDATION:
   - Count time markers in input
   - Count tasks in output
   - These should match (or tasks slightly more if some have inferred times)
   - DO NOT skip any explicitly mentioned times

4. DATE & TIME EXTRACTION:
   - Today, tomorrow, next week, this weekend, etc.
   - Specific dates: "March 15th", "next Monday", "in 2 weeks"
   - Time references: "morning", "afternoon", "evening", "9 AM", "after lunch"
   - Relative timing: "before the meeting", "after work", "by end of day"
   - Bare numbers followed by context: "830" or "8 30" likely means 8:30

5. SMART DEFAULTS & CONTEXT AWARENESS:
   - Use current time context to make intelligent scheduling decisions
   - If no specific time given, use appropriate defaults relative to current time
   - Business tasks default to business hours
   - Personal tasks can be scheduled flexibly
   - Meal-related timing: breakfast (6-9 AM), lunch (11 AM-2 PM), dinner (5-8 PM)
   - "Before meal" timing depends on current time of day
   - Current time: ${currentTime.local}

6. REMINDER LOGIC:
   - Default reminders: 15 minutes for meetings, 60 minutes for appointments
   - "Don't forget" = 30 minutes reminder
   - "Urgent" or "Important" = 60 minutes reminder
   - "ASAP" = 15 minutes reminder

7. PRIORITY DETECTION:
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
- Carefully match each task with its correct time - this is CRITICAL
- If ambiguous, make reasonable assumptions based on context
- Minimum viable tasks - every task must be actionable
- Maximum 10 tasks per response to maintain quality
- If no specific time mentioned, estimate appropriate timing
- Reminder values should be realistic: 0, 15, 30, 60, or 1440 (24 hours)
- Priority values must be: 0 (low), 1 (medium), or 2 (high)`;

      const userPrompt = `Current time context: ${JSON.stringify(currentTime)}

User said: "${text}"

IMPORTANT: Analyze the input step by step:
1. List all time markers found: [identify each time mentioned]
2. List all tasks/activities found: [identify each task]
3. Match each task to its time based on sentence structure
4. Ensure EVERY time marker has a corresponding task

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
      console.log('Parsed tasks JSON:', JSON.stringify(parsedResponse, null, 2));

      if (parsedResponse.tasks && parsedResponse.tasks.length > 0) {
        // Stop typewriter animation immediately when tasks are ready
        clearInterval(typewriterInterval);
        setTypewriterText(text); // Show full text immediately

        // Add light haptic for each task created
        for (let i = 0; i < parsedResponse.tasks.length; i++) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        setParsedTasks(parsedResponse.tasks);
        // Advance to Review step only when tasks are successfully created
        setCurrentStep(1);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // No tasks found, show error modal
        setErrorMessage({
          title: 'No Tasks Found',
          description: 'Your recording didn\'t contain any actionable tasks. Please try again with specific instructions like "Remind me to call John tomorrow at 3 PM".'
        });
        setShowErrorModal(true);
        setCurrentStep(0);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

    } catch (error) {
      console.error('Error processing with AI:', error.message);
      setErrorMessage({
        title: 'Task Creation Failed',
        description: 'Could not create tasks from your recording. Please ensure you provide clear task instructions and try again.'
      });
      setShowErrorModal(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Reset to record step on error
      setCurrentStep(0);
    } finally {
      clearInterval(typewriterInterval);
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
          due_date: task.date,
          start_date: task.date,
          start_time: task.start_time,
          end_time: task.due_time,
          alert_minutes: task.reminder ? [task.reminder] : null,
          priority: task.priority !== undefined ? task.priority : 0,
          completed: false,
        };

        const result = await todosService.addTodo(todoData);

        // Check if save was successful
        if (result.error) {
          throw new Error(result.error.message || 'Failed to save task');
        }

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
      setErrorMessage({
        title: 'Save Failed',
        description: `Failed to save tasks: ${error.message || 'Unknown error'}. Please try again.`
      });
      setShowErrorModal(true);
      setSavingTaskIndex(-1);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleSuccessModalClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSuccessModal(false);
    setParsedTasks([]);
    setTranscribedText('');
    setCurrentStep(0);
  };

  const handleErrorModalClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowErrorModal(false);
    setTranscribedText('');
    setParsedTasks([]);
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
          <View style={styles.headerRight}>
            <Sparkles size={20} color={theme.colors.primary} strokeWidth={2} />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              AI Planner
            </Text>
          </View>
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

              {/* Recording Timer Panel (inspired by the app screenshot) */}
              {recorderState.isRecording && (
                <View style={[
                  styles.timerPanel,
                  {
                    backgroundColor: theme.colors.primary,
                  }
                ]}>
                  <View style={styles.timerTopRow}>
                    <View style={styles.recDot}>
                      <View style={styles.recDotInner} />
                    </View>
                    <Text style={styles.timerText}>
                      00.{formatTime(recordingTime).split(':')[0]}<Text style={styles.timerMinutes}>m</Text> {formatTime(recordingTime).split(':')[1]}<Text style={styles.timerSeconds}>s</Text>
                    </Text>
                  </View>
                </View>
              )}

              {/* Waveform Visualization */}
              {recorderState.isRecording && (
                <View style={[styles.waveformContainer, { backgroundColor: theme.colors.surface }]}>
                  <View style={styles.waveformBars}>
                    {[...Array(40)].map((_, i) => (
                      <WaveformBar key={i} height={Math.random() * 60 + 20} theme={theme} index={i} />
                    ))}
                  </View>
                  <View style={styles.waveformTimeAxis}>
                    <Text style={[styles.waveformTimeText, { color: theme.colors.textSecondary }]}>0:00</Text>
                    <Text style={[styles.waveformTimeText, { color: theme.colors.textSecondary }]}>{formatTime(recordingTime)}</Text>
                  </View>
                </View>
              )}

              {/* Title when not recording */}
              {!recorderState.isRecording && (
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
              )}

              {/* Embossed Button Panel */}
              <View style={[
                styles.buttonPanel,
                {
                  backgroundColor: theme.colors.card,
                  shadowColor: isDark ? '#FFFFFF' : '#000000',
                }
              ]}>
                <View style={[
                  styles.buttonPanelInner,
                  {
                    backgroundColor: theme.colors.surface,
                  }
                ]}>
                  {/* Main Recording Button */}
                  <TouchableOpacity
                    style={styles.mainButtonContainer}
                    onPress={recorderState.isRecording ? stopRecording : startRecording}
                    disabled={!permissionGranted}
                    activeOpacity={0.85}
                  >
                    <Animated.View
                      style={[
                        styles.mainRecordButton,
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
                        <View style={styles.stopIcon} />
                      ) : (
                        <Mic size={48} color="white" strokeWidth={2.5} />
                      )}
                    </Animated.View>
                  </TouchableOpacity>

                  <Text style={[styles.buttonInstruction, { color: theme.colors.textSecondary }]}>
                    {recorderState.isRecording ? 'Tap to finish recording' : 'Tap to start recording'}
                  </Text>
                </View>
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

          {/* Processing State - only show when isProcessing is true AND no tasks yet */}
          {isProcessing && parsedTasks.length === 0 && (
            <View style={styles.processingContainer}>
              <View style={styles.processingHeader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.processingTitle, { color: theme.colors.text }]}>
                  Creating Tasks...
                </Text>
              </View>
              <Text style={[styles.processingText, { color: theme.colors.textSecondary }]}>
                {typewriterText}
              </Text>
            </View>
          )}

          {/* Parsed Tasks */}
          {parsedTasks.length > 0 && (
            <View style={styles.tasksSection}>
              <View style={styles.tasksList}>
                {parsedTasks.map((task, index) => (
                  <View
                    key={index}
                    style={[
                      styles.taskItemContainer,
                      { backgroundColor: theme.colors.surface }
                    ]}
                  >
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
                          <Trash2 size={16} color={theme.colors.textSecondary} strokeWidth={2} />
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
          <View style={[
            styles.modalContainer,
            styles.modalEmbossed,
            {
              backgroundColor: theme.colors.background,
              shadowColor: isDark ? '#FFFFFF' : '#000000',
            }
          ]}>
            <View style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
              }
            ]}>
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
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleErrorModalClose}
      >
        <View style={styles.errorModalOverlay}>
          <View style={[
            styles.errorModalContainer,
            styles.modalEmbossed,
            {
              backgroundColor: theme.colors.background,
              shadowColor: isDark ? '#FFFFFF' : '#000000',
            }
          ]}>
            <View style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
              }
            ]}>
              <Text style={styles.errorEmoji}>⚠️</Text>
              <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
                {errorMessage.title}
              </Text>
              <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
                {errorMessage.description}
              </Text>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleErrorModalClose}
              >
                <Text style={styles.modalButtonText}>Try Again</Text>
              </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
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
  // Recording Timer Panel
  timerPanel: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  timerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  timerText: {
    fontSize: 42,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  timerMinutes: {
    fontSize: 28,
    fontWeight: '400',
  },
  timerSeconds: {
    fontSize: 28,
    fontWeight: '400',
  },
  // Waveform
  waveformContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 80,
    marginBottom: 8,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
  },
  waveformTimeAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  waveformTimeText: {
    fontSize: 12,
    fontWeight: '500',
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
  // Embossed Button Panel
  buttonPanel: {
    borderRadius: 24,
    padding: 6,
    width: '100%',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPanelInner: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  mainButtonContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainRecordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  stopIcon: {
    width: 32,
    height: 32,
    backgroundColor: 'white',
    borderRadius: 6,
  },
  buttonInstruction: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  heroButtonDisabled: {
    opacity: 0.4,
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
  typewriterText: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.2,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  processingContainer: {
    width: '100%',
    paddingHorizontal: 4,
    paddingVertical: 20,
    gap: 16,
  },
  processingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  processingText: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.2,
    lineHeight: 24,
    textAlign: 'left',
  },
  tasksSection: {
    gap: 16,
  },
  tasksList: {
    gap: 8,
  },
  taskItemContainer: {
    position: 'relative',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  taskItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  taskItemContent: {
    flex: 1,
    marginLeft: -12,
  },
  deleteTaskButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80,
    padding: 20,
  },
  modalContainer: {
    borderRadius: 24,
    minWidth: 280,
    maxWidth: '90%',
  },
  errorModalContainer: {
    borderRadius: 24,
    minWidth: 280,
    maxWidth: '90%',
  },
  modalEmbossed: {
    padding: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalContent: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
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
  errorEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 12,
    textAlign: 'center',
  },
});
