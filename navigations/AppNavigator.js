import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import useAuthStore from '../stores/authStore';
import AuthStackNavigator from './AuthStackNavigator';
import OnboardingStackNavigator from './OnboardingStackNavigator';
import TabNavigator from './TabNavigator';
import { useTheme } from '../context/ThemeContext';

export default function AppNavigator() {
  const { theme } = useTheme();
  const { isAuthenticated, hasCompletedOnboarding, loading, initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize auth when app starts
    initializeAuth();
  }, [initializeAuth]);

  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStackNavigator />
      ) : !hasCompletedOnboarding ? (
        <OnboardingStackNavigator />
      ) : (
        <TabNavigator />
      )}
    </NavigationContainer>
  );
}