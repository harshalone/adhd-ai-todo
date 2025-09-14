import { createStackNavigator } from '@react-navigation/stack';
import CardsScreen from '../screens/CardsScreen';
import AddCardScreen from '../screens/cards/AddCardScreen';
import ScanCardScreen from '../screens/cards/ScanCardScreen';
import CardScreen from '../screens/cards/CardScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createStackNavigator();

export default function CardsStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="CardsMain" component={CardsScreen} />
      <Stack.Screen name="CardSelection" component={AddCardScreen} />
      <Stack.Screen name="ScanCard" component={ScanCardScreen} />
      <Stack.Screen name="CardScreen" component={CardScreen} />
    </Stack.Navigator>
  );
}