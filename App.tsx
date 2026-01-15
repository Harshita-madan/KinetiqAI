import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { AppNavigator } from './src/navigation';
import { ThemeProvider } from './src/theme';
import { NotificationService } from './src/services';
import { useAuthStore } from './src/stores';

// Ignore the Expo Go notification warning (SDK 53+ limitation)
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'expo-notifications:',
]);



export default function App() {
  const initializeAuth = useAuthStore((state) => state.initialize);

  // Initialize auth and notification services on app start
  useEffect(() => {
    // Initialize auth immediately
    initializeAuth();

    // Delayed notification initialization to avoid blocking startup
    const timer = setTimeout(() => {
      NotificationService.initialize();
    }, 1000);
    
    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      NotificationService.stopUsageTracking();
    };
  }, [initializeAuth]);

  // Skip TensorFlow pre-initialization - let LiveWorkoutScreen load it only when needed
  // This optimization saves ~15 seconds startup time when backend is available
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
