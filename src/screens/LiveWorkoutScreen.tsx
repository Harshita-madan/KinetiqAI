import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { storageService } from '../services/StorageService';
import { poseTrackerService } from '../services/PoseTrackerService';
import { colors, spacing, fontSize } from '../theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PoseTrackerWebView } from '../components/PoseTrackerWebView';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// PoseTracker API Key
const POSETRACKER_API_KEY = '218b867b-ee16-42b7-ac31-4fe0cb5fde84';

interface RouteParams {
  exercise: string;
  duration: number;
}

export const LiveWorkoutScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { exercise, duration } = route.params as RouteParams;

  const [isActive, setIsActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [repCount, setRepCount] = useState(0);
  const [detectionStatus, setDetectionStatus] = useState('Initializing PoseTracker...');
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Initialize PoseTracker service
  useEffect(() => {
    try {
      poseTrackerService.initialize({
        apiKey: POSETRACKER_API_KEY,
        difficulty: 'medium',
        enableSkeleton: true,
      });
      console.log('[LiveWorkout] PoseTracker service initialized');
    } catch (error) {
      console.error('[LiveWorkout] PoseTracker initialization error:', error);
      Alert.alert('Error', 'Failed to initialize PoseTracker');
    }

    return () => {
      cleanup();
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (isActive) {
      startTimer();
    } else {
      stopTimer();
    }
    return () => stopTimer();
  }, [isActive]);

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Handle rep count changes from PoseTracker
  const handleRepsChange = (reps: number) => {
    setRepCount(reps);
    if (reps > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Handle status updates from PoseTracker
  const handleStatusChange = (status: string) => {
    setDetectionStatus(status);
  };

  // Handle data received from PoseTracker
  const handlePoseTrackerData = (data: any) => {
    if (data.type === 'counter' && data.current_count !== undefined) {
      handleRepsChange(data.current_count);
    }
  };

  // Safe navigation back handler
  const handleSafeGoBack = () => {
    if (isActive) {
      Alert.alert(
        'End Workout?',
        'Are you sure you want to end the workout?',
        [
          { text: 'Cancel', onPress: () => {} },
          { text: 'End', onPress: () => finishWorkout() },
        ]
      );
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  };

  const handleStartStop = () => {
    if (isActive) {
      finishWorkout();
    } else {
      setIsActive(true);
      setTimeElapsed(0);
      setRepCount(0);
    }
  };

  const finishWorkout = async () => {
    setIsActive(false);
    stopTimer();

    const sessionData = {
      id: Date.now().toString(),
      exerciseName: exercise,
      date: new Date().toISOString(),
      duration: timeElapsed,
      averageScore: 0, // PoseTracker will handle scoring
      reps: repCount,
      mistakes: [],
      feedback: ['Workout completed using PoseTracker'],
      timestamp: Date.now(),
    };

    await storageService.saveSession(sessionData);

    navigation.navigate('SessionSummary', { session: sessionData });
  };

  const cleanup = () => {
    stopTimer();
    poseTrackerService.reset();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSafeGoBack} style={styles.backButton}>
          <Ionicons name="close" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.exerciseTitle}>{exercise}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.webViewContainer}>
        {isActive ? (
          <PoseTrackerWebView
            exercise={exercise}
            apiKey={POSETRACKER_API_KEY}
            onRepsChange={handleRepsChange}
            onStatusChange={handleStatusChange}
            onDataReceived={handlePoseTrackerData}
            difficulty="medium"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="camera" size={64} color={colors.primary} />
            <Text style={styles.placeholderText}>Press Play to Start Workout</Text>
            <Text style={styles.placeholderSubtext}>
              Using PoseTracker for real-time pose detection
            </Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={32} color={colors.primary} />
          <Text style={styles.timerText}>{formatTime(timeElapsed)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, isActive && styles.stopButton]}
          onPress={handleStartStop}
        >
          <Ionicons
            name={isActive ? 'stop' : 'play'}
            size={32}
            color={colors.white}
          />
        </TouchableOpacity>

        {isActive && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>Reps: {repCount}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  webViewContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.cardBg,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  placeholderText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    backgroundColor: colors.cardBg,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timerText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stopButton: {
    backgroundColor: '#E8569D',
  },
  statsContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statsText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
