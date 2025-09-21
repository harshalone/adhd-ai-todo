import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';
import { Mic, MicOff } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy'; 
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
  const [base64Audio, setBase64Audio] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(null);
  const [parsedTasks, setParsedTasks] = useState([]);
  const [isProcessingTasks, setIsProcessingTasks] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [isSavingTasks, setIsSavingTasks] = useState(false);
  const [typingText, setTypingText] = useState('');
  

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

      // Convert to base64 and transcribe
      if (uri) {
        await convertToBase64(uri);
        await transcribeAudio(uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording: ' + error.message);
    }
  };

  const convertToBase64 = async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setBase64Audio(base64);
      console.log('Audio converted to base64, length:', base64.length);
    } catch (error) {
      console.error('Error converting to base64:', error);
      Alert.alert('Error', 'Failed to convert audio to base64: ' + error.message);
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
      const base64Data = base64Audio || await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const transcription = await callTranscriptionAPI(base64Data);
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
  const callTranscriptionAPI = async (base64Audio) => {
    try {
        //  '192.168.0.53:3000/api/ai/voice/transcriptions'; 
      const SERVER_URL = await getServerUrl();

      const transcription_url = SERVER_URL + 'api/ai/voice/transcriptions';
      console.log("transcription_url :", transcription_url);
      
      const response = await fetch(transcription_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add any authentication headers if needed
          // 'Authorization': `Bearer ${yourAuthToken}`,
        },
        body: JSON.stringify({
          audioData: base64Audio,
        }),
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

    try {
      const SERVER_URL = await getServerUrl();
      const todoUrl = SERVER_URL + 'api/ai/todo';

      const response = await fetch(todoUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: transcribedText,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.tasks && Array.isArray(result.tasks)) {
        setParsedTasks(result.tasks);
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
      const savePromises = parsedTasks.map(async (task) => {
        // Convert AI task format to our database format
        const todoData = {
          title: task.title,
          priority: 0, // Default priority
          due_date: task.date && task.due_time
            ? `${task.date}T${task.due_time}:00`
            : null,
          start_date: task.date && task.start_time
            ? `${task.date}T${task.start_time}:00`
            : null,
          // Convert single reminder to array format if it exists
          alert_minutes: task.reminder ? [task.reminder] : null,
        };

        return todosService.addTodo(todoData);
      });

      const results = await Promise.all(savePromises);

      // Check if any failed
      const failures = results.filter(result => result.error);
      if (failures.length > 0) {
        throw new Error(`Failed to save ${failures.length} tasks`);
      }

      Alert.alert(
        'Success!',
        `Successfully added ${parsedTasks.length} tasks to your todo list.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear everything and go back
              clearRecording();
              setParsedTasks([]);
              navigation.goBack();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Save tasks error:', error);
      Alert.alert('Save Error', 'Failed to save some tasks: ' + error.message);
    } finally {
      setIsSavingTasks(false);
    }
  };




  const clearRecording = () => {
    setRecordedURI(null);
    setBase64Audio(null);
    setTranscribedText('');
    setTranscriptionError(null);
    setParsedTasks([]);
    setProcessingError(null);
    setTypingText('');
  };

  const retryTranscription = async () => {
    if (recordedURI) {
      await transcribeAudio(recordedURI);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>AI Todo Recorder</Text>
        <View style={{ width: 44 }} />
      </View>
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, styles.topAligned]}
        showsVerticalScrollIndicator={false}
      >
        {/* Transcription Text Area */}
        <View style={[styles.transcriptionContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.transcriptionLabel, { color: theme.colors.text }]}>
            Tell us what you want to do:
          </Text>
          
          {isTranscribing ? (
            <View style={styles.transcribingContainer}>
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
              <Text style={[styles.errorText, { color: theme.colors.danger || '#f44336' }]}>
                {transcriptionError}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                onPress={retryTranscription}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Convert to Tasks Button */}
          {transcribedText && !isTranscribing && parsedTasks.length === 0 && (
            <TouchableOpacity
              style={[styles.processButton, { backgroundColor: theme.colors.primary }]}
              onPress={processTasksWithAI}
              disabled={isProcessingTasks}
            >
              {isProcessingTasks ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={[styles.buttonText, { marginLeft: 8 }]}>Converting...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Convert to tasks</Text>
              )}
            </TouchableOpacity>
          )}

          {processingError && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.colors.danger || '#f44336' }]}>
                {processingError}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                onPress={processTasksWithAI}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recording Controls */}
        <View style={styles.recordingSection}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              recorderState.isRecording
                ? [styles.stopButton, { backgroundColor: '#f44336' }]
                : [styles.startButton, { backgroundColor: '#f44336' }],
              !permissionGranted && [styles.disabledButton, { backgroundColor: theme.colors.surface }]
            ]}
            onPress={recorderState.isRecording ? stopRecording : startRecording}
            disabled={!permissionGranted}
          >
            {recorderState.isRecording ? (
              <MicOff size={28} color="white" />
            ) : (
              <Mic size={28} color="white" />
            )}
          </TouchableOpacity>

          <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
            Status: {recorderState.isRecording ? 'Recording...' : 'Idle'}
          </Text>
        </View>

        {/* Parsed Tasks Display */}
        {parsedTasks.length > 0 && (
          <View style={[styles.tasksContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.tasksHeader, { color: theme.colors.text }]}>
              Parsed Tasks ({parsedTasks.length})
            </Text>

            {parsedTasks.map((task, index) => (
              <TodoListItem
                key={index}
                item={task}
                showCheckbox={false}
              />
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
                <Text style={styles.buttonText}>Add all tasks to your todo</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Audio Player and Results */}
        {recordedURI && (
          <View style={[styles.resultContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.resultText, { color: theme.colors.primary }]}>Recording Complete!</Text>


            {/* Base64 Debug Info (Collapsible) */}
            {base64Audio && (
              <View style={styles.base64Container}>
                <Text style={[styles.base64Label, { color: theme.colors.text }]}>Audio Data:</Text>
                <Text style={[styles.base64Text, { color: theme.colors.textSecondary }]}>
                  Base64 length: {base64Audio.length} characters
                </Text>
              </View>
            )}

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
    padding: 20,
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
  transcriptionContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  transcriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  transcriptionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
  },
  transcribingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
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
  recordingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
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
  recordButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
  },
  resultContainer: {
    padding: 20,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
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
  base64Container: {
    width: '100%',
    marginBottom: 15,
    alignItems: 'center',
  },
  base64Label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  base64Text: {
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tasksContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  tasksHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  saveAllButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});