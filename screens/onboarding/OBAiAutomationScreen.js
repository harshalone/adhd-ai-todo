import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Sparkles, Circle, Star, Mic } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';
import BackButton from '../../components/BackButton';
import { Confetti } from 'react-native-fast-confetti';
import { useRef, useEffect, useState } from 'react';
import Svg, { Path } from 'react-native-svg';

const TalkingFace = ({ size = 50 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" preserveAspectRatio="xMidYMid meet">
    <Path
      fill="#FA743E"
      d="M35.838 23.159a.997.997 0 0 1-.998 1.003l-5 .013a.998.998 0 0 1-1-.997a.998.998 0 0 1 .995-1.004l5-.013a1 1 0 0 1 1.003.998zm-1.587-5.489a1 1 0 0 1-.475 1.333l-4.517 2.145a1 1 0 0 1-.856-1.809l4.516-2.144a1 1 0 0 1 1.332.475zm.027 10.987a1 1 0 0 0-.48-1.33l-4.527-2.122a1 1 0 1 0-.848 1.81l4.526 2.123a1 1 0 0 0 1.329-.481z"
    />
    <Path
      fill="#269"
      d="M27.979 14.875c-1.42-.419-2.693-1.547-3.136-2.25c-.76-1.208.157-1.521-.153-4.889C24.405 4.653 20.16 1.337 15 1c-2.346-.153-4.786.326-7.286 1.693c-6.42 3.511-8.964 10.932-4.006 18.099c4.47 6.46.276 9.379.276 9.379s.166 1.36 2.914 3.188c2.749 1.827 6.121.588 6.121.588s1.112-3.954 4.748-3.59c2.606.384 6.266-.129 7.191-1.024c.865-.837-.151-1.886.539-4.224c-2.365-.232-3.665-1.359-3.79-2.948c2.625.255 3.708-.578 4.458-1.495c-.021-.54-.075-1.686-.127-2.454c2.322-.672 3.212-2.962 1.941-3.337z"
    />
  </Svg>
);

export default function OBAiAutomationScreen({ navigation }) {
  const { theme } = useTheme();
  const confettiRef = useRef(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [visibleTasks, setVisibleTasks] = useState([]);
  const [showRecording, setShowRecording] = useState(true);
  const [showParagraph, setShowParagraph] = useState(false);
  const taskAnimations = useRef([]);
  const recordingScale = useRef(new Animated.Value(1)).current;
  const recordingOpacity = useRef(new Animated.Value(1)).current;
  const word1Opacity = useRef(new Animated.Value(0)).current;
  const word2Opacity = useRef(new Animated.Value(0)).current;
  const word3Opacity = useRef(new Animated.Value(0)).current;

  const paragraph = "Schedule team meeting for tomorrow at 3pm, buy groceries after work, finish the project report by Friday, call dentist to reschedule appointment, review contract documents, and prepare presentation slides";
  const tasks = [
    { title: "Schedule team meeting for tomorrow at 3pm", priority: 2, time: "3:00 PM" },
    { title: "Buy groceries after work", priority: 0, time: "6:00 PM" },
    { title: "Finish the project report by Friday", priority: 2, time: "5:00 PM" },
    { title: "Call dentist to reschedule appointment", priority: 1, time: "2:00 PM" },
    { title: "Review contract documents", priority: 1, time: "4:00 PM" },
    { title: "Prepare presentation slides", priority: 2, time: "Tomorrow" }
  ];

  useEffect(() => {
    taskAnimations.current = tasks.map(() => new Animated.Value(0));

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(recordingScale, {
          toValue: 1.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(recordingScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    const wordsSequence = Animated.stagger(300, [
      Animated.timing(word1Opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(word2Opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(word3Opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);

    setTimeout(() => wordsSequence.start(), 400);

    setTimeout(() => {
      pulseAnimation.stop();
      Animated.timing(recordingOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowRecording(false);
        setShowParagraph(true);
      });
    }, 2000);

    const animateTasksSequentially = async () => {
      await new Promise(resolve => setTimeout(resolve, 2500));

      for (let i = 0; i < tasks.length; i++) {
        await new Promise(resolve => setTimeout(resolve, i === 0 ? 800 : 600));

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setVisibleTasks(prev => [...prev, i]);

        Animated.spring(taskAnimations.current[i], {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7
        }).start();
      }

      setTimeout(() => {
        setShowConfetti(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setShowConfetti(false), 3000);
      }, 400);
    };

    animateTasksSequentially();
  }, []);

  const countryStats = [
    { country: "USA", percentage: 89, users: "2400K" },
    { country: "UAE", percentage: 90, users: "890K" },
    { country: "China", percentage: 79, users: "3100K" },
    { country: "UK", percentage: 68, users: "1200K" }
  ];

  const reviews = [
    { name: "Sarah M.", rating: 5, text: "This AI organization changed my life! I'm so much more productive now." },
    { name: "Ahmed K.", rating: 5, text: "Finally an app that understands how I think. The AI is incredibly smart!" },
    { name: "Emma L.", rating: 4, text: "Great app for managing daily tasks. The AI suggestions are very helpful." },
    { name: "Li Wei", rating: 5, text: "Best productivity app I've ever used. Highly recommend to everyone!" },
    { name: "Marcus T.", rating: 5, text: "Game changer! I never miss deadlines anymore thanks to the AI assistant." },
    { name: "Priya S.", rating: 4, text: "Love how it organizes my chaotic thoughts into clear actionable tasks." },
    { name: "Carlos R.", rating: 5, text: "Simple, powerful, and incredibly intuitive. Worth every penny!" }
  ];

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('OBSubscriptions');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Time Management</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: theme.colors.primary }]}>Issues?</Text>
        </View>

        <View style={styles.aiDemoSection}>
          <View style={styles.aiTitleRow}>
            <Sparkles size={20} color={theme.colors.primary} />
            <Text style={[styles.aiDemoTitle, { color: theme.colors.text }]}>Let AI do it for you</Text>
          </View>

          <View style={styles.aiDemoContent}>
            {showRecording && (
              <Animated.View
                style={[
                  styles.recordingContainer,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    opacity: recordingOpacity
                  }
                ]}
              >
                <View style={styles.recordingContent}>
                  <View style={styles.faceContainer}>
                    <TalkingFace size={50} />
                    <View style={styles.wordsContainer}>
                      <Animated.View style={[styles.wordBubble, { opacity: word1Opacity, backgroundColor: theme.colors.primary + '40' }]}>
                        <Text style={[styles.wordText, { color: theme.colors.text }]}>meeting</Text>
                      </Animated.View>
                      <Animated.View style={[styles.wordBubble, { opacity: word2Opacity, backgroundColor: theme.colors.primary + '40' }]}>
                        <Text style={[styles.wordText, { color: theme.colors.text }]}>groceries</Text>
                      </Animated.View>
                      <Animated.View style={[styles.wordBubble, { opacity: word3Opacity, backgroundColor: theme.colors.primary + '40' }]}>
                        <Text style={[styles.wordText, { color: theme.colors.text }]}>report</Text>
                      </Animated.View>
                    </View>
                  </View>

                  <Animated.View style={[styles.micContainer, { transform: [{ scale: recordingScale }] }]}>
                    <Mic size={28} color="#fff" />
                  </Animated.View>
                </View>
              </Animated.View>
            )}

            {showParagraph && (
              <View style={[styles.paragraphContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <Text style={[styles.paragraphText, { color: theme.colors.textSecondary }]}>
                  "{paragraph}"
                </Text>
              </View>
            )}

            <View style={styles.arrowDownContainer}>
              <Text style={[styles.arrowText, { color: theme.colors.primary }]}>↓</Text>
            </View>

            <View style={styles.tasksContainer}>
              {tasks.map((task, index) => {
                const isVisible = visibleTasks.includes(index);
                const animation = taskAnimations.current[index];

                const getPriorityColor = (priority) => {
                  switch (priority) {
                    case 2:
                      return '#FF6B6B';
                    case 1:
                      return '#FFB84D';
                    default:
                      return theme.colors.textSecondary;
                  }
                };

                const getPriorityText = (priority) => {
                  switch (priority) {
                    case 2:
                      return 'H';
                    case 1:
                      return 'M';
                    default:
                      return 'L';
                  }
                };

                return isVisible ? (
                  <Animated.View
                    key={index}
                    style={[
                      styles.taskItem,
                      {
                        backgroundColor: theme.colors.surface,
                        opacity: animation,
                        transform: [
                          {
                            translateY: animation?.interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 0]
                            })
                          },
                          {
                            scale: animation?.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.9, 1]
                            })
                          }
                        ]
                      }
                    ]}
                  >
                    <View style={styles.taskLeftSection}>
                      <Circle size={18} color={theme.colors.textSecondary} strokeWidth={2} />
                      <View style={[styles.taskPriorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                        <Text style={styles.taskPriorityText}>{getPriorityText(task.priority)}</Text>
                      </View>
                    </View>
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskText, { color: theme.colors.text }]} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text style={[styles.taskTime, { color: theme.colors.textSecondary }]}>
                        {task.time}
                      </Text>
                    </View>
                  </Animated.View>
                ) : null;
              })}
            </View>

          </View>

          <View style={styles.confettiContainer}>
            <Confetti
              ref={confettiRef}
              autoplay={showConfetti}
              loop={false}
              duration={3000}
              particleCount={100}
              spread={360}
              startVelocity={35}
              colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#A8E6CF', '#FFB6C1', '#98D8E8']}
              emissionRate={40}
              explosiveness={0.8}
              gravity={0.8}
              decay={0.94}
            />
          </View>
        </View>

        <View style={styles.countryStatsSection}>
          <View style={styles.statsHeader}>
            <Text style={[styles.countryStatsTitle, { color: theme.colors.text }]}>
              Global Success Stories
            </Text>
            <Text style={[styles.statsSubtitle, { color: theme.colors.textSecondary }]}>
              Join millions of productive users worldwide
            </Text>
          </View>

          <View style={[styles.statsGrid, { backgroundColor: theme.colors.surface }]}>
            {countryStats.map((stat, index) => (
              <View key={index} style={styles.countryStatCard}>
                <View style={styles.countryStatTop}>
                  <Text style={[styles.countryName, { color: theme.colors.text }]}>
                    {stat.country}
                  </Text>
                  <Text style={[styles.userCount, { color: theme.colors.textSecondary }]}>
                    {stat.users} users
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarBackground, { backgroundColor: theme.colors.border }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: theme.colors.primary,
                          width: `${stat.percentage}%`
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.percentageText, { color: theme.colors.primary }]}>
                    {stat.percentage}% improved
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.reviewsSection}>
          <Text style={[styles.reviewsTitle, { color: theme.colors.text }]}>
            What Our Users Say
          </Text>

          {reviews.map((review, index) => (
            <View key={index} style={[styles.reviewCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  <Text style={[styles.reviewerName, { color: theme.colors.text }]}>
                    {review.name}
                  </Text>
                  <View style={styles.starsContainer}>
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={14} fill="#FFB84D" color="#FFB84D" />
                    ))}
                  </View>
                </View>
              </View>
              <Text style={[styles.reviewText, { color: theme.colors.textSecondary }]}>
                "{review.text}"
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomCTA, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  leftBranch: {
    marginRight: 8,
  },
  rightBranch: {
    marginLeft: 8,
  },
  statsContent: {
    alignItems: 'center',
    flex: 1,
  },
  statsNumber: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
  },
  statsSubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  aiDemoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    position: 'relative',
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  aiDemoTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  aiDemoContent: {
    width: '100%',
  },
  paragraphContainer: {
    borderRadius: 12,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    marginBottom: 8,
  },
  paragraphText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  recordingContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
    minHeight: 100,
  },
  recordingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  micContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  faceContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wordsContainer: {
    flex: 1,
    gap: 6,
  },
  wordBubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  wordText: {
    fontSize: 13,
    fontWeight: '500',
  },
  arrowDownContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: '700',
  },
  tasksContainer: {
    width: '100%',
    gap: 6,
    marginTop: 6,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  taskLeftSection: {
    alignItems: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  taskPriorityBadge: {
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  taskPriorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 17,
  },
  taskTime: {
    fontSize: 11,
    marginTop: 1,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  countryStatsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsHeader: {
    marginBottom: 12,
  },
  countryStatsTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  statsSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  statsGrid: {
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  countryStatCard: {
    marginBottom: 12,
  },
  countryStatTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userCount: {
    fontSize: 12,
  },
  progressBarContainer: {
    gap: 6,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '700',
  },
  reviewsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  reviewCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  reviewHeader: {
    marginBottom: 6,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 16,
    padding: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});