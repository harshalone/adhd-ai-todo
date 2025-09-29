import { createStackNavigator } from '@react-navigation/stack';
import { ChevronLeft } from 'lucide-react-native';
import ListHomeScreen from '../screens/ListHomeScreen';
import AddListScreen from '../screens/lists/AddListScreen';
import ListItemsScreen from '../screens/lists/ListItemsScreen';
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
    </Stack.Navigator>
  );
}