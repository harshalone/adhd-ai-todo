import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CreditCard, ShoppingBag, Tag, Settings } from 'lucide-react-native';

import CardsStackNavigator from './CardsStackNavigator';
import ShoppingScreen from '../screens/ShoppingScreen';
import DealsScreen from '../screens/DealsScreen';
import SettingsStackNavigator from './SettingsStackNavigator';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;

          if (route.name === 'Cards') {
            IconComponent = CreditCard;
          } else if (route.name === 'Shopping') {
            IconComponent = ShoppingBag;
          } else if (route.name === 'Deals') {
            IconComponent = Tag;
          } else if (route.name === 'Settings') {
            IconComponent = Settings;
          }

          return <IconComponent size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground,
          borderTopColor: theme.colors.border,
          paddingTop: 0,
          paddingBottom: 0,
          margin: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Cards" component={CardsStackNavigator} />
      <Tab.Screen name="Shopping" component={ShoppingScreen} />
      <Tab.Screen name="Deals" component={DealsScreen} />
      <Tab.Screen name="Settings" component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
}