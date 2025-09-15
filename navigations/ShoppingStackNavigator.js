import { createStackNavigator } from '@react-navigation/stack';
import { ChevronLeft } from 'lucide-react-native';
import ShoppingScreen from '../screens/shopping/ShoppingScreen';
import AddShoppingListScreen from '../screens/shopping/AddShoppingListScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createStackNavigator();

export default function ShoppingStackNavigator() {
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
        name="ShoppingList"
        component={ShoppingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddShoppingList"
        component={AddShoppingListScreen}
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
    </Stack.Navigator>
  );
}