import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line } from 'react-native-svg';
import { poseDetectionService, Pose, PostureAnalysis } from '../services/PoseDetectionService';
import { storageService } from '../services/StorageService';
import { colors, spacing, fontSize } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RouteParams {
  exercise: string;
  duration: number;
}

export const LiveWorkoutScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { exercise, duration } = route.params as RouteParams;

  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentPose, setCurrentPose] = useState<Pose | null>(null);
  const [postureAnalysis, setPostureAnalysis] = useState<PostureAnalysis | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [skeletonImages, setSkeletonImages] = useState<string[]>([]);
  const [isDetectorReady, setIsDetectorReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const poseIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only request camera permission on mount
    if (!permission) {
      requestPermission();
    }
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isActive) {
      startTimer();
      startPoseDetection();
    } else {
      stopTimer();
      stopPoseDetection();
    }
  }, [isActive]);

  const initializeDetector = async (): Promise<boolean> => {
    if (isDetectorReady) return true;
    
    setIsInitializing(true);
    
    try {
      console.log('Initializing pose detection...');
      
      // 10-second timeout for initialization
      const initTimeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Initialization timeout')), 10000)
      );
      
      await Promise.race([
        poseDetectionService.initialize(),
        initTimeout
      ]);
      
      const ready = poseDetectionService.isReady();
      console.log('Detector ready:', ready);
      setIsDetectorReady(ready);
      setIsInitializing(false);
      return ready;
      
    } catch (error) {
      console.error('Initialization failed:', error);
      setIsInitializing(false);
      setIsDetectorReady(false);
      
      Alert.alert(
        'Initialization Error', 
        'Failed to load pose detection. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      
      return false;
    }
  };

  const initializeCamera = async () => {
    try {
      if (!permission?.granted) {
        await requestPermission();
      }
    } catch (error) {
      console.error('Camera permission error:', error);
      Alert.alert('Error', 'Camera permission required for pose detection');
    }
  };

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

  const startPoseDetection = () => {
    // Only start if detector is ready
    if (!isDetectorReady || !poseDetectionService.isReady()) {
      console.error('Cannot start pose detection - detector not ready');
      Alert.alert('Error', 'Pose detector not ready. Please wait...');
      setIsActive(false);
      return;
    }
    
    poseIntervalRef.current = setInterval(async () => {
      await detectPose();
    }, 200); // Detect every 200ms for smooth real-time feedback
  };

  const stopPoseDetection = () => {
    if (poseIntervalRef.current) {
      clearInterval(poseIntervalRef.current);
      poseIntervalRef.current = null;
    }
  };

  const detectPose = async () => {
    if (!cameraRef.current || !isActive) return;

    try {
      // Ensure detector is initialized before attempting detection
      if (!poseDetectionService.isReady()) {
        console.warn('Detector not ready during active session, stopping...');
        setIsActive(false);
        Alert.alert('Error', 'Pose detection lost. Please restart the workout.');
        return;
      }

      // Take a snapshot from the camera
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: false,
        skipProcessing: true,
      });

      if (!photo) return;

      // Create image element for TensorFlow
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = async () => {
        try {
          // Detect poses using MoveNet
          const poses = await poseDetectionService.detectPose(img);
          
          if (poses && poses.length > 0) {
            const pose = poses[0];
            
            // MoveNet returns normalized coordinates (0-1), scale to screen dimensions
            const imageWidth = img.width || SCREEN_WIDTH;
            const imageHeight = img.height || (SCREEN_HEIGHT * 0.6);
            
            const scaledPose: Pose = {
              ...pose,
              keypoints: pose.keypoints.map(kp => {
                // MoveNet returns [y, x] normalized coordinates
                const x = kp.x * imageWidth;
                const y = kp.y * imageHeight;
                
                return {
                  ...kp,
                  x: (x / imageWidth) * SCREEN_WIDTH,
                  y: (y / imageHeight) * (SCREEN_HEIGHT * 0.6),
                };
              }),
            };

            setCurrentPose(scaledPose);

            // Analyze posture with basic form analysis
            const analysis = poseDetectionService.analyzePosture(scaledPose, exercise);
            
            // Apply Personal Image Classifier (PIC) Analysis
            const personalInsights = poseDetectionService.analyzePersonalPosePattern(
              scaledPose, 
              exercise, 
              scores
            );
            
            const enhancedAnalysis = {
              ...analysis,
              personalizedInsights: personalInsights,
            };
            
            setPostureAnalysis(enhancedAnalysis);

            // Track scores
            if (isActive) {
              setScores((prev) => [...prev, analysis.score]);
            }
          }
        } catch (error) {
          console.error('Pose analysis error:', error);
        }
      };

      img.src = photo.uri;
    } catch (error) {
      console.error('Pose detection error:', error);
    }
  };

  const handleStartStop = async () => {
    if (isActive) {
      // Stop and show summary
      finishWorkout();
    } else {
      // Initialize detector on first play (lazy loading)
      if (!isDetectorReady) {
        const initialized = await initializeDetector();
        if (!initialized) {
          return; // Initialization failed, don't start workout
        }
      }
      
      // Start workout
      setIsActive(true);
      setTimeElapsed(0);
      setScores([]);
    }
  };

  const finishWorkout = async () => {
    setIsActive(false);

    const averageScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    const sessionData = {
      id: Date.now().toString(),
      exerciseName: exercise,
      date: new Date().toISOString(),
      duration: timeElapsed,
      averageScore: Math.round(averageScore),
      mistakes: postureAnalysis?.mistakes || [],
      feedback: [...(postureAnalysis?.feedback || []), ...(postureAnalysis?.personalizedInsights || [])],
      timestamp: Date.now(),
    };

    await storageService.saveSession(sessionData);

    navigation.navigate('SessionSummary', { session: sessionData });
  };

  const cleanup = () => {
    stopTimer();
    stopPoseDetection();
    poseDetectionService.dispose();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderSkeleton = () => {
    if (!currentPose) return null;

    const connections = [
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_hip', 'left_knee'],
      ['left_knee', 'left_ankle'],
      ['right_hip', 'right_knee'],
      ['right_knee', 'right_ankle'],
    ];

    const getKeypoint = (name: string) =>
      currentPose.keypoints.find((kp) => kp.name === name);

    const lineColor = postureAnalysis?.color === 'green' 
      ? '#56E8A0' 
      : postureAnalysis?.color === 'yellow' 
      ? '#E8C956' 
      : '#E8569D';

    return (
      <Svg style={styles.skeletonOverlay} width={SCREEN_WIDTH} height={SCREEN_HEIGHT * 0.6}>
        {connections.map(([start, end], index) => {
          const startKp = getKeypoint(start);
          const endKp = getKeypoint(end);
          if (!startKp || !endKp || !startKp.score || !endKp.score) return null;
          if (startKp.score < 0.3 || endKp.score < 0.3) return null;

          return (
            <Line
              key={index}
              x1={startKp.x}
              y1={startKp.y}
              x2={endKp.x}
              y2={endKp.y}
              stroke={lineColor}
              strokeWidth={4}
              opacity={0.8}
            />
          );
        })}
        {currentPose.keypoints.map((kp, index) => {
          if (!kp.score || kp.score < 0.3) return null;
          return (
            <Circle
              key={index}
              cx={kp.x}
              cy={kp.y}
              r={8}
              fill={lineColor}
              opacity={0.9}
            />
          );
        })}
      </Svg>
    );
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={64} color={colors.gray400} />
        <Text style={styles.errorText}>Camera permission required</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeCamera}>
          <Text style={styles.retryButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.exerciseTitle}>{exercise}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
        >
          {renderSkeleton()}
        </CameraView>

        {/* Score Indicator */}
        {postureAnalysis && (
          <View
            accessible={true}
            accessibilityLabel={`Form score: ${Math.round(postureAnalysis.score)} out of 100`}
            style={[
              styles.scoreIndicator,
              {
                backgroundColor:
                  postureAnalysis.color === 'green'
                    ? '#56E8A050'
                    : postureAnalysis.color === 'yellow'
                    ? '#E8C95650'
                    : '#E8569D50',
              },
            ]}
          >
            <Text style={styles.scoreText}>{Math.round(postureAnalysis.score)}</Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
        )}

        {/* Feedback Box */}
        {postureAnalysis && isActive && (
          <View 
            style={styles.feedbackBox}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {postureAnalysis.isCorrect ? (
              <View style={styles.feedbackRow}>
                <Ionicons name="checkmark-circle" size={24} color="#56E8A0" />
                <Text style={styles.feedbackTextGood}>Perfect Form!</Text>
              </View>
            ) : (
              <View>
                {postureAnalysis.mistakes.slice(0, 2).map((mistake, index) => (
                  <View key={index} style={styles.feedbackRow}>
                    <Ionicons name="alert-circle" size={20} color="#E8C956" />
                    <Text style={styles.feedbackTextWarning}>{mistake}</Text>
                  </View>
                ))}
              </View>
            )}
            {/* Show PIC personalized insights */}
            {postureAnalysis.personalizedInsights && postureAnalysis.personalizedInsights.length > 0 && (
              <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#ffffff20' }}>
                {postureAnalysis.personalizedInsights.slice(0, 1).map((insight, index) => (
                  <View key={index} style={styles.feedbackRow}>
                    <Text style={[styles.feedbackTextWarning, { fontSize: 11 }]}>{insight}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={32} color={colors.primary} />
          <Text style={styles.timerText}>{formatTime(timeElapsed)}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton, 
            isActive && styles.stopButton,
            isInitializing && styles.initializingButton
          ]}
          onPress={handleStartStop}
          disabled={isInitializing}
        >
          {isInitializing ? (
            <ActivityIndicator size={32} color={colors.white} />
          ) : (
            <Ionicons
              name={isActive ? 'stop' : 'play'}
              size={32}
              color={colors.white}
            />
          )}
        </TouchableOpacity>

        {isActive && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              Avg: {scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0}
            </Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
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
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.cardBg,
    margin: spacing.lg,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  skeletonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scoreIndicator: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    padding: spacing.md,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 80,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
  },
  scoreLabel: {
    fontSize: fontSize.sm,
    color: colors.white,
    opacity: 0.9,
  },
  feedbackBox: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: spacing.md,
    borderRadius: 15,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: 4,
  },
  feedbackTextGood: {
    fontSize: fontSize.md,
    color: '#56E8A0',
    fontWeight: '600',
    flex: 1,
  },
  feedbackTextWarning: {
    fontSize: fontSize.sm,
    color: '#E8C956',
    flex: 1,
  },
  controls: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  stopButton: {
    backgroundColor: '#E8569D',
  },
  initializingButton: {
    backgroundColor: '#7556E8',
    opacity: 0.8,
  },
  disabledButton: {
    backgroundColor: colors.gray400,
    opacity: 0.6,
  },
  initializingText: {
    fontSize: 10,
    color: colors.white,
    marginTop: 4,
    fontWeight: '600',
  },
  statsContainer: {
    padding: spacing.md,
    backgroundColor: colors.cardBg,
    borderRadius: 15,
  },
  statsText: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: fontSize.md,
    color: colors.gray400,
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.gray400,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    marginTop: spacing.lg,
    fontSize: fontSize.lg,
    color: colors.gray400,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: 25,
  },
  retryButtonText: {
    fontSize: fontSize.md,
    color: colors.white,
    fontWeight: '600',
  },
});
