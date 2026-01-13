import React from 'react';
import { AppNavigator } from './src/navigation';

export default function App() {
  // Skip TensorFlow pre-initialization - let LiveWorkoutScreen load it only when needed
  // This optimization saves ~15 seconds startup time when backend is available
  return <AppNavigator />;
}
