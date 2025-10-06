import { createStackNavigator } from '@react-navigation/stack';
import TrackScreen from '../screens/TrackScreen';
import FocusScreen from '../screens/FocusScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import OTPRegistrationScreen from '../screens/auth/OTPRegistrationScreen';
import WebViewScreen from '../components/WebViewScreen';
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
      {/* Auth screens */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="OTPRegistration" component={OTPRegistrationScreen} />
      <Stack.Screen
        name="WebView"
        component={WebViewScreen}
        options={{
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}