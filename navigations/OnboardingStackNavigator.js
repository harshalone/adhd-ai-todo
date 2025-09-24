import { createStackNavigator } from '@react-navigation/stack';
import OBLandingScreen from '../screens/onboarding/OBLandingScreen';
import OBAttentionScreen from '../screens/onboarding/OBAttentionScreen';
import OBAiAutomationScreen from '../screens/onboarding/OBAiAutomationScreen';
import OBSubscriptionsScreen from '../screens/onboarding/OBSubscriptionsScreen';
import OBAgeScreen from '../screens/onboarding/OBAgeScreen';
import OBVideoScreen from '../screens/onboarding/OBVideoScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createStackNavigator();

export default function OnboardingStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name="OBLanding"
        component={OBLandingScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OBAttention"
        component={OBAttentionScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OBAiAutomation"
        component={OBAiAutomationScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OBSubscriptions"
        component={OBSubscriptionsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OBAge"
        component={OBAgeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OBVideoScreen"
        component={OBVideoScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}