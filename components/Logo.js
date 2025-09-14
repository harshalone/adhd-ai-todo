import { View, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';

export default function Logo({ size = 80 }) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.stripe, styles.orange]} />
      <View style={[styles.stripe, styles.green]} />
      <View style={[styles.stripe, styles.blue]} />
      <View style={[styles.stripe, styles.red]} />
      <View style={styles.starContainer}>
        <Star size={24} color="#FFFFFF" fill="#FFFFFF" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  stripe: {
    height: '25%',
    width: '100%',
  },
  orange: {
    backgroundColor: '#f8ae00',
  },
  green: {
    backgroundColor: '#50be3d',
  },
  blue: {
    backgroundColor: '#3295c8',
  },
  red: {
    backgroundColor: '#f26e5f',
  },
  starContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});