import { createStackNavigator } from '@react-navigation/stack';
import { ChevronLeft } from 'lucide-react-native';
import ListHomeScreen from '../screens/ListHomeScreen';
import AddListScreen from '../screens/lists/AddListScreen';
import ListItemsScreen from '../screens/lists/ListItemsScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import OTPRegistrationScreen from '../screens/auth/OTPRegistrationScreen';
import WebViewScreen from '../components/WebViewScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createStackNavigator();

export default function ListStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ListHome"
        component={ListHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddList"
        component={AddListScreen}
        options={{
          title: '',
          headerTitle: '',
          headerBackTitle: '',
          headerBackTitleVisible: false,
          headerBackImage: () => (
            <ChevronLeft size={39} color={theme.colors.text} />
          ),
        }}
      />
      <Stack.Screen
        name="ListItems"
        component={ListItemsScreen}
        options={{ headerShown: false }}
      />
      {/* Auth screens */}
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OTP" component={OTPScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OTPRegistration" component={OTPRegistrationScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="WebView"
        component={WebViewScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}