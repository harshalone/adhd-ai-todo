import { createStackNavigator } from '@react-navigation/stack';
import TodoHomeScreen from '../screens/todo/TodoHomeScreen';
import TodoAddScreen from '../screens/todo/TodoAddScreen';
import NewAiTodoScreen from '../screens/todo/NewAiTodoScreen';
import EditTodoScreen from '../screens/todo/EditTodoScreen';
import ScheduledNotificationsScreen from '../screens/todo/ScheduledNotificationsScreen';
import PayWallScreen from '../screens/PayWallScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import OTPRegistrationScreen from '../screens/auth/OTPRegistrationScreen';
import WebViewScreen from '../components/WebViewScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createStackNavigator();

export default function TodoStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="TodoMain" component={TodoHomeScreen} />
      <Stack.Screen name="TodoAdd" component={TodoAddScreen} />
      <Stack.Screen name="AiTodoAdd" component={NewAiTodoScreen} />
      <Stack.Screen name="EditTodo" component={EditTodoScreen} />
      <Stack.Screen name="ScheduledNotifications" component={ScheduledNotificationsScreen} />
      <Stack.Screen
        name="PayWall"
        component={PayWallScreen}
        options={{
          presentation: 'modal',
        }}
      />
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