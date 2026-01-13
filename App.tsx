import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import { AppNavigator } from './src/navigation';
import { colors } from './src/theme';

export default function App() {
  const [tfReady, setTfReady] = useState(false);

  useEffect(() => {
    // Pre-initialize TensorFlow to avoid delays later
    const initTensorFlow = async () => {
      try {
        console.log('Pre-initializing TensorFlow...');
        console.log('Platform:', Platform.OS);
        
        // Force CPU backend for mobile
        if (Platform.OS !== 'web') {
          await tf.setBackend('cpu');
        }
        
        await tf.ready();
        console.log('TensorFlow ready with backend:', tf.getBackend());
        setTfReady(true);
      } catch (error) {
        console.error('Failed to initialize TensorFlow:', error);
        // Still allow app to load even if TF fails
        setTfReady(true);
      }
    };

    initTensorFlow();
  }, []);

  if (!tfReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Initializing AI...</Text>
      </View>
    );
  }

  return <AppNavigator />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
