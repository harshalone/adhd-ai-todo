import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import useSettingsStore from '../stores/settingsStore';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const lightTheme = {
  colors: {
    primary: '#007AFF',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#E5E5E7',
    notification: '#FF3B30',
    surface: '#F2F2F7',
    onSurface: '#000000',
    tabBarBackground: '#FFFFFF',
    tabBarInactive: '#8E8E93',
    orange: '#FF9500',
  },
};

const darkTheme = {
  colors: {
    primary: '#0A84FF',
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    notification: '#FF453A',
    surface: '#1C1C1E',
    onSurface: '#FFFFFF',
    tabBarBackground: '#1C1C1E',
    tabBarInactive: '#8E8E93',
    orange: '#FF9F0A',
  },
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const { themeMode, setThemeMode } = useSettingsStore();

  // Determine current theme
  const getCurrentTheme = () => {
    if (themeMode === 'light') return lightTheme;
    if (themeMode === 'dark') return darkTheme;
    // automatic mode
    return systemColorScheme === 'dark' ? darkTheme : lightTheme;
  };

  const theme = getCurrentTheme();

  const value = {
    theme,
    themeMode,
    setTheme: setThemeMode,
    isDark: theme === darkTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};