import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { AppNavigator } from './src/navigation';
import { ThemeProvider } from './src/theme';
import { NotificationService } from './src/services';
import { initializeOnDemandChatbot } from './src/services/OnDemandChatbotService';

// Ignore the Expo Go notification warning (SDK 53+ limitation)
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'expo-notifications:',
]);

// TODO: Add your OnDemand API key here
// Get it from: https://app.on-demand.io/ -> API Keys Management
const ONDEMAND_API_KEY: string = 'IDhwtqWIap55xKVs4ncupNkALIOD80Gw';

export default function App() {
  // Initialize services on app start
  useEffect(() => {
    // Initialize OnDemand Chatbot if API key is available
    if (ONDEMAND_API_KEY && ONDEMAND_API_KEY !== 'YOUR_API_KEY_HERE') {
      try {
        initializeOnDemandChatbot(ONDEMAND_API_KEY);
        console.log('OnDemand Chatbot initialized successfully');
      } catch (error) {
        console.error('Failed to initialize OnDemand Chatbot:', error);
      }
    } else {
      console.warn('OnDemand API key not configured. Chat features will be limited.');
    }

    // Initialize notification service
    const timer = setTimeout(() => {
      NotificationService.initialize();
    }, 1000);
    
    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      NotificationService.stopUsageTracking();
    };
  }, []);

  // Skip TensorFlow pre-initialization - let LiveWorkoutScreen load it only when needed
  // This optimization saves ~15 seconds startup time when backend is available
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
