import { createStackNavigator } from '@react-navigation/stack';
import SettingsScreen from '../screens/SettingsScreen';
import ThemeScreen from '../screens/settings/ThemeScreen';
import ProfileScreen from '../screens/settings/ProfileScreen';
import CountryScreen from '../screens/settings/CountryScreen';
import ContactUsScreen from '../screens/settings/ContactUsScreen';
import DeleteAccountScreen from '../screens/settings/DeleteAccountScreen';
import TermsScreen from '../screens/settings/TermsScreen';
import PrivacyScreen from '../screens/settings/PrivacyScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import SubscriptionsScreen from '../screens/SubscriptionsScreen';
import OnboardingStackNavigator from './OnboardingStackNavigator';
import { useTheme } from '../context/ThemeContext';

const Stack = createStackNavigator();

export default function SettingsStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
      <Stack.Screen name="Theme" component={ThemeScreen} />
      <Stack.Screen name="Country" component={CountryScreen} />
      <Stack.Screen name="ContactUs" component={ContactUsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      <Stack.Screen
        name="Onboarding"
        component={OnboardingStackNavigator}
        options={{
          presentation: 'fullScreenModal',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}