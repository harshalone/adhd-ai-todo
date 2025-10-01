import { createStackNavigator } from '@react-navigation/stack';
import TodoHomeScreen from '../screens/todo/TodoHomeScreen';
import TodoAddScreen from '../screens/todo/TodoAddScreen';
import AiTodoAddScreen from '../screens/todo/AiTodoAddScreen';
import EditTodoScreen from '../screens/todo/EditTodoScreen';
import ScheduledNotificationsScreen from '../screens/todo/ScheduledNotificationsScreen';
import PayWallScreen from '../screens/PayWallScreen';
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
      <Stack.Screen name="AiTodoAdd" component={AiTodoAddScreen} />
      <Stack.Screen name="EditTodo" component={EditTodoScreen} />
      <Stack.Screen name="ScheduledNotifications" component={ScheduledNotificationsScreen} />
      <Stack.Screen
        name="PayWall"
        component={PayWallScreen}
        options={{
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}