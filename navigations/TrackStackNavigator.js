import { createStackNavigator } from '@react-navigation/stack';
import TrackScreen from '../screens/TrackScreen';
import FocusScreen from '../screens/FocusScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createStackNavigator();

export default function TrackStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="TrackMain" component={TrackScreen} />
      <Stack.Screen name="Focus" component={FocusScreen} />
    </Stack.Navigator>
  );
}