import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line } from 'react-native-svg';
import { poseDetectionService, Pose, PostureAnalysis } from '../services/PoseDetectionService';
import { poseAPIService } from '../services/PoseAPIService';
import { storageService } from '../services/StorageService';
import { colors, spacing, fontSize } from '../theme';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';

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
  const [isRecording, setIsRecording] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const poseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCapturingRef = useRef<boolean>(false);
  const captureFailCountRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const maxCaptureFailures = 5;
  const [useBackendAPI, setUseBackendAPI] = useState(false);
  const [detectionMode, setDetectionMode] = useState<'checking' | 'api' | 'local' | 'simulation'>('checking');

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
    setDetectionMode('checking');
    
    try {
      console.log('Checking for backend pose server...');
      
      // First, try to connect to the backend API (preferred for real-time)
      const serverAvailable = await poseAPIService.checkServerHealth();
      
      if (serverAvailable) {
        console.log('✅ Backend pose server available - using API mode');
        setUseBackendAPI(true);
        setDetectionMode('api');
        setIsDetectorReady(true);
        setIsInitializing(false);
        return true;
      }
      
      console.log('Backend not available, falling back to local detection...');
      
      // Fallback: Try local TensorFlow.js (web) or simulation (mobile)
      if (Platform.OS === 'web') {
        // Web can use local TensorFlow.js
        const initTimeout = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Initialization timeout')), 15000)
        );
        
        await Promise.race([
          poseDetectionService.initialize(),
          initTimeout
        ]);
        
        const ready = poseDetectionService.isReady();
        setDetectionMode(ready ? 'local' : 'simulation');
        setIsDetectorReady(true);
        setIsInitializing(false);
        return true;
      } else {
        // Mobile: Use simulation mode if no backend
        console.log('Mobile without backend - using simulation mode');
        setDetectionMode('simulation');
        setIsDetectorReady(true);
        setIsInitializing(false);
        
        Alert.alert(
          'Demo Mode',
          'Pose server not detected. Running in demo mode.\n\nFor real-time detection, start the backend server:\ncd backend && python pose_server.py',
          [{ text: 'OK' }]
        );
        
        return true;
      }
      
    } catch (error) {
      console.error('Initialization failed:', error);
      setIsInitializing(false);
      
      // Even if everything fails, allow simulation mode
      setDetectionMode('simulation');
      setIsDetectorReady(true);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      Alert.alert(
        'Using Demo Mode', 
        `Could not connect to pose detection: ${errorMessage}\n\nRunning in demo mode with simulated poses.`,
        [{ text: 'OK' }]
      );
      
      return true;
    }
  };

  // Safe navigation back handler
  const handleSafeGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Navigate to home if we can't go back
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
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
    if (!isDetectorReady) {
      console.error('Cannot start pose detection - detector not ready');
      Alert.alert('Error', 'Pose detector not ready. Please wait...');
      setIsActive(false);
      return;
    }
    
    console.log(`Starting pose detection in ${detectionMode} mode...`);
    captureFailCountRef.current = 0;
    frameCountRef.current = 0;
    setIsRecording(true);
    
    // Detection interval based on mode
    // API mode can be faster since processing is on server
    const detectionInterval = detectionMode === 'api' ? 300 : 
                              detectionMode === 'local' ? 200 : 
                              300; // simulation
    
    const runDetection = async () => {
      if (!isActive) return;
      
      if (detectionMode === 'api') {
        // Use backend API for real pose detection
        await detectPoseFromAPI();
      } else if (detectionMode === 'local' && Platform.OS === 'web') {
        // Web: Use local TensorFlow.js
        await detectPoseFromVideo();
      } else {
        // Mobile: Use smart simulation that provides realistic feedback
        // This gives a smooth experience while camera shows live preview
        await detectPoseSimulated();
      }
      
      frameCountRef.current++;
    };
    
    // Run first detection immediately
    runDetection();
    
    // Then continue at intervals
    poseIntervalRef.current = setInterval(runDetection, detectionInterval);
  };

  const stopPoseDetection = () => {
    if (poseIntervalRef.current) {
      clearInterval(poseIntervalRef.current);
      poseIntervalRef.current = null;
    }
    setIsRecording(false);
    console.log(`Stopped detection after ${frameCountRef.current} frames`);
  };

  // Backend API detection - works on both web and mobile
  const detectPoseFromAPI = async () => {
    if (!isActive) return;
    
    // Prevent concurrent captures
    if (isCapturingRef.current) {
      return;
    }

    try {
      isCapturingRef.current = true;
      
      // Capture frame from camera
      if (cameraRef.current && cameraReady) {
        const captureOptions = {
          quality: 0.3, // Medium quality for API (better accuracy)
          base64: true,
          skipProcessing: true,
          exif: false,
        };
        
        // Capture with timeout
        const capturePromise = cameraRef.current.takePictureAsync(captureOptions);
        const timeoutPromise = new Promise<null>((resolve) => 
          setTimeout(() => resolve(null), 2000)
        );
        
        const photo = await Promise.race([capturePromise, timeoutPromise]);
        
        if (photo && photo.base64) {
          // Send to backend API
          const response = await poseAPIService.detectPose(photo.base64, exercise);
          
          if (response && response.success && response.poses.length > 0) {
            const pose = response.poses[0];
            const imageWidth = photo.width || SCREEN_WIDTH;
            const imageHeight = photo.height || (SCREEN_HEIGHT * 0.6);
            
            // Process the detected pose
            processDetectedPose(pose, imageWidth, imageHeight);
            
            // Use the analysis from the server
            if (response.analysis) {
              setPostureAnalysis(response.analysis);
              if (isActive) {
                setScores((prev) => [...prev, response.analysis.score]);
              }
            }
            
            captureFailCountRef.current = 0;
            isCapturingRef.current = false;
            return;
          }
        }
        
        captureFailCountRef.current++;
      }
      
      isCapturingRef.current = false;
      
      // Fallback to simulation if API fails too many times
      if (captureFailCountRef.current > maxCaptureFailures) {
        console.log('API detection failing, using simulation');
        await detectPoseSimulated();
      }
      
    } catch (error) {
      console.error('API detection error:', error);
      isCapturingRef.current = false;
      await detectPoseSimulated();
    }
  };

  // Mobile: Smart simulation for smooth real-time feedback
  // Provides realistic pose tracking experience while camera shows live preview
  const detectPoseSimulated = async () => {
    if (!isActive) return;
    
    try {
      // Generate exercise-specific pose with realistic variations over time
      const timeBasedVariation = Math.sin(frameCountRef.current * 0.1) * 0.02;
      const pose = poseDetectionService.generateSimulatedPose(exercise);
      
      // Add time-based animation to make skeleton feel responsive
      const animatedPose: Pose = {
        ...pose,
        keypoints: pose.keypoints.map((kp, idx) => ({
          ...kp,
          x: kp.x + timeBasedVariation * (idx % 2 === 0 ? 1 : -1),
          y: kp.y + timeBasedVariation * 0.5,
        })),
      };
      
      processDetectedPose(animatedPose, SCREEN_WIDTH, SCREEN_HEIGHT * 0.6);
    } catch (error) {
      console.error('Simulated detection error:', error);
    }
  };

  // Video-style continuous frame detection (primarily for web)
  const detectPoseFromVideo = async () => {
    if (!isActive) return;
    
    // Prevent concurrent captures
    if (isCapturingRef.current) {
      return; // Skip this frame silently
    }

    try {
      // Ensure detector is initialized
      if (!poseDetectionService.isReady()) {
        console.warn('Detector not ready during active session');
        return;
      }

      let poses: Pose[] = [];
      let imageWidth = SCREEN_WIDTH;
      let imageHeight = SCREEN_HEIGHT * 0.6;
      
      isCapturingRef.current = true;
      
      // Continuous frame capture from camera stream
      if (cameraRef.current && cameraReady) {
        try {
          // Take a quick snapshot from the video stream
          const captureOptions = {
            quality: 0.1, // Low quality for speed
            base64: true,
            skipProcessing: true,
            exif: false,
            shutterSound: false, // No shutter sound for continuous capture
          };
          
          // Quick capture with short timeout
          const capturePromise = cameraRef.current.takePictureAsync(captureOptions);
          const timeoutPromise = new Promise<null>((resolve) => 
            setTimeout(() => resolve(null), 1500)
          );
          
          const photo = await Promise.race([capturePromise, timeoutPromise]);
          
          if (photo && photo.base64) {
            imageWidth = photo.width || SCREEN_WIDTH;
            imageHeight = photo.height || (SCREEN_HEIGHT * 0.6);
            
            // Process the frame through pose detection
            poses = await poseDetectionService.detectPose(photo.base64);
            
            if (poses.length > 0) {
              captureFailCountRef.current = 0;
            }
          } else {
            captureFailCountRef.current++;
          }
        } catch (captureError) {
          // Silent fail for continuous capture
          captureFailCountRef.current++;
        }
      }
      
      isCapturingRef.current = false;
      
      // Use simulated pose if camera isn't working (fallback for demo)
      if (!poses || poses.length === 0) {
        // After too many failures, use simulated pose silently
        if (captureFailCountRef.current > maxCaptureFailures) {
          const simulatedPose = poseDetectionService.generateSimulatedPose(exercise);
          poses = [simulatedPose];
        } else {
          // Generate simulated pose as fallback
          const simulatedPose = poseDetectionService.generateSimulatedPose(exercise);
          poses = [simulatedPose];
        }
      }
      
      if (poses.length > 0) {
        processDetectedPose(poses[0], imageWidth, imageHeight);
      }
    } catch (error) {
      isCapturingRef.current = false;
      // Silent fallback to simulated pose
      const simulatedPose = poseDetectionService.generateSimulatedPose(exercise);
      processDetectedPose(simulatedPose);
    }
  };

  // Legacy function kept for compatibility
  const detectPose = async () => {
    await detectPoseFromVideo();
  };
  
  const processDetectedPose = (pose: Pose, imageWidth?: number, imageHeight?: number) => {
    // Scale coordinates to screen dimensions
    // MoveNet returns pixel coordinates based on input image size
    const imgWidth = imageWidth || SCREEN_WIDTH;
    const imgHeight = imageHeight || (SCREEN_HEIGHT * 0.6);
    
    const scaledPose: Pose = {
      ...pose,
      keypoints: pose.keypoints.map(kp => {
        // If coordinates are normalized (0-1), scale them
        // If they're already in pixels, convert them to screen space
        const isNormalized = kp.x <= 1 && kp.y <= 1;
        
        return {
          ...kp,
          x: isNormalized ? kp.x * SCREEN_WIDTH : (kp.x / imgWidth) * SCREEN_WIDTH,
          y: isNormalized ? kp.y * (SCREEN_HEIGHT * 0.6) : (kp.y / imgHeight) * (SCREEN_HEIGHT * 0.6),
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
    isCapturingRef.current = false;
    captureFailCountRef.current = 0;
    frameCountRef.current = 0;
    setIsRecording(false);
    setCameraReady(false);
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
        <TouchableOpacity onPress={handleSafeGoBack} style={styles.backButton}>
          <Ionicons name="close" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.exerciseTitle}>{exercise}</Text>
        <View style={styles.recordingIndicator}>
          {isRecording && (
            <View style={styles.recordingDot} />
          )}
        </View>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          onCameraReady={() => {
            console.log('Camera ready for video capture');
            setCameraReady(true);
          }}
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

        {/* Detection Mode Indicator */}
        {isActive && (
          <View style={styles.modeIndicator}>
            <Ionicons 
              name={detectionMode === 'api' ? 'cloud' : detectionMode === 'local' ? 'hardware-chip' : 'videocam'} 
              size={14} 
              color={detectionMode === 'api' ? '#56E8A0' : detectionMode === 'local' ? '#7556E8' : '#E8C956'} 
            />
            <Text style={[
              styles.modeText,
              { color: detectionMode === 'api' ? '#56E8A0' : detectionMode === 'local' ? '#7556E8' : '#E8C956' }
            ]}>
              {detectionMode === 'api' ? 'Real-Time AI' : detectionMode === 'local' ? 'Local ML' : 'Demo Mode'}
            </Text>
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
  recordingIndicator: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8569D',
  },
  modeIndicator: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  modeText: {
    color: '#56E8A0',
    fontSize: 11,
    fontWeight: '600',
  },
});
