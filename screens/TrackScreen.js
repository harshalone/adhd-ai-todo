import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TrackScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>Track</Text>

        <View style={styles.trackContainer}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Last 7 Days</Text>
            <View style={styles.daysContainer}>
              {DAYS.map((day, index) => (
                <View key={index} style={styles.dayColumn}>
                  <View style={styles.barContainer}>
                    <View style={[styles.verticalBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                      <View style={[styles.verticalProgress, { backgroundColor: theme.colors.primary, height: `${Math.random() * 100}%` }]} />
                    </View>
                  </View>
                  <Text style={[styles.dayLabel, { color: theme.colors.textSecondary }]}>{day}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Last 8 Weeks</Text>
            {[...Array(8)].map((_, index) => (
              <View key={index} style={styles.row}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Week {index + 1}</Text>
                <View style={[styles.progressBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={[styles.progress, { backgroundColor: theme.colors.primary, width: `${Math.random() * 100}%` }]} />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Whole Year</Text>
            <View style={styles.yearContainer}>
              {MONTHS.map((month, index) => (
                <View key={index} style={styles.monthContainer}>
                  <Text style={[styles.monthLabel, { color: theme.colors.textSecondary }]}>{month}</Text>
                  <View style={styles.monthGrid}>
                    {[...Array(4)].map((_, rowIndex) => (
                      <View key={rowIndex} style={styles.monthRow}>
                        {[...Array(7)].map((_, dotIndex) => (
                          <View key={dotIndex} style={[styles.dot, { backgroundColor: theme.colors.border }]} />
                        ))}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 24,
  },
  trackContainer: {
    width: '100%',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    width: 60,
  },
  progressBar: {
    flex: 1,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 4,
  },
  yearContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthContainer: {
    width: '24.5%',
    marginBottom: 20,
  },
  monthLabel: {
    fontSize: 10,
    marginBottom: 8,
    fontWeight: '500',
    textAlign: 'left',
  },
  monthGrid: {
    flexDirection: 'column',
    gap: 2,
  },
  monthRow: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    gap: 8,
  },
  dayColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    height: 100,
    justifyContent: 'flex-end',
  },
  verticalBar: {
    width: 9,
    height: '100%',
    borderRadius: 4.5,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  verticalProgress: {
    width: '100%',
    borderRadius: 4,
  },
  dayLabel: {
    fontSize: 10,
    marginTop: 8,
    fontWeight: '500',
  },
});