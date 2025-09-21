import { View, StyleSheet, Image } from 'react-native';

export default function Logo({ size = 80 }) {
  const borderRadius = size * 0.225; // iOS app icon ratio (22.5% of size)

  return (
    <View style={[
      styles.container,
      {
        width: size,
        height: size,
        borderRadius,
        shadowRadius: size * 0.15,
        shadowOffset: { width: 0, height: size * 0.05 }
      }
    ]}>
      <Image
        source={require('../assets/logo.png')}
        style={[
          styles.image,
          {
            width: size * 0.9,
            height: size * 0.9,
            borderRadius: borderRadius * 0.9
          }
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  image: {
    backgroundColor: 'transparent',
  },
});