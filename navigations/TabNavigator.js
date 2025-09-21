import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LaptopMinimal, Settings } from 'lucide-react-native';

import TodoStackNavigator from './TodoStackNavigator';
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

          if (route.name === 'Todos') {
            IconComponent = LaptopMinimal;
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
          margin: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Todos" component={TodoStackNavigator} />
      <Tab.Screen name="Settings" component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
}