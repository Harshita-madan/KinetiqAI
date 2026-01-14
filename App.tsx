import React, { useEffect } from 'react';
import { AppNavigator } from './src/navigation';
import { initializeOnDemandChatbot } from './src/services';

// OnDemand API Key
const ONDEMAND_API_KEY = 'IDhwtqWIap55xKVs4ncupNkALIOD80Gw';

export default function App() {
  useEffect(() => {
    // Initialize OnDemand Chatbot when app starts
    try {
      initializeOnDemandChatbot(ONDEMAND_API_KEY);
      console.log('OnDemand Chatbot initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OnDemand Chatbot:', error);
    }
  }, []);

  // Skip TensorFlow pre-initialization - let LiveWorkoutScreen load it only when needed
  // This optimization saves ~15 seconds startup time when backend is available
  return <AppNavigator />;
}
