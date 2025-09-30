import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ListChecks, Settings, Calendar, Rows3 } from 'lucide-react-native';

import TodoStackNavigator from './TodoStackNavigator';
import SettingsStackNavigator from './SettingsStackNavigator';
import TrackStackNavigator from './TrackStackNavigator';
import ListStackNavigator from './ListStackNavigator';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;

          if (route.name === 'List') {
            IconComponent = Rows3;
          } else if (route.name === 'Todos') {
            IconComponent = ListChecks;
          } else if (route.name === 'Track') {
            IconComponent = Calendar;
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
      <Tab.Screen name="List" component={ListStackNavigator} />
      <Tab.Screen name="Track" component={TrackStackNavigator} />
      <Tab.Screen name="Settings" component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
}