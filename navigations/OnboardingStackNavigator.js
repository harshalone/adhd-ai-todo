import { createStackNavigator } from '@react-navigation/stack';
import OBLandingScreen from '../screens/onboarding/OBLandingScreen';
import OBSelectCountry from '../screens/onboarding/OBSelectCountry';
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
        name="OBSelectCountry"
        component={OBSelectCountry}
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