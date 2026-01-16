import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '../theme';
import { voiceManager } from '../services/VoiceFeedbackManager';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PoseTrackerWebViewProps {
  exercise: string;
  apiKey: string;
  onRepsChange?: (reps: number) => void;
  onStatusChange?: (status: string) => void;
  onDataReceived?: (data: any) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  voiceEnabled?: boolean;
}

interface PoseTrackerData {
  type?: string;
  current_count?: number;
  ready?: boolean;
  postureDirection?: string;
  score?: number;
  confidence?: number;
  [key: string]: any;
}

export const PoseTrackerWebView: React.FC<PoseTrackerWebViewProps> = ({
  exercise,
  apiKey,
  onRepsChange,
  onStatusChange,
  onDataReceived,
  difficulty = 'medium',
  voiceEnabled = true,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repsCount, setRepsCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [postureMessage, setPostureMessage] = useState<string>('');
  const [detectionStatus, setDetectionStatus] = useState<string>('Initializing...');
  const webViewRef = useRef<WebView>(null);

  // Update voice manager enabled state
  React.useEffect(() => {
    voiceManager.setEnabled(voiceEnabled);
  }, [voiceEnabled]);

  // Build PoseTracker URL with all required parameters
  const poseTrackerUrl = `https://app.posetracker.com/pose_tracker/tracking?token=${apiKey}&exercise=${exercise}&difficulty=${difficulty}&width=${SCREEN_WIDTH}&height=${SCREEN_HEIGHT}&isMobile=${Platform.OS === 'ios' || Platform.OS === 'android'}&skeleton=true`;

  // JavaScript bridge for communication between WebView and React Native
  const jsBridge = `
    window.addEventListener('message', function(event) {
      window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
    });

    window.webViewCallback = function(data) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    };

    const originalPostMessage = window.postMessage;
    window.postMessage = function(data) {
      window.ReactNativeWebView.postMessage(typeof data === 'string' ? data : JSON.stringify(data));
    };

    true;
  `;

  // Handle data received from PoseTracker
  const handlePoseTrackerData = useCallback((data: PoseTrackerData) => {
    console.log('[PoseTracker] Received data:', data);

    // Handle rep counter updates
    if (data.type === 'counter' && data.current_count !== undefined) {
      setRepsCount(data.current_count);
      onRepsChange?.(data.current_count);
      console.log(`[PoseTracker] Rep count: ${data.current_count}`);
    }

    // Handle positioning/readiness
    if (data.ready !== undefined) {
      setIsReady(data.ready);
      if (!data.ready && data.postureDirection) {
        const message = `Move ${data.postureDirection}`;
        setPostureMessage(message);
        setDetectionStatus(`Position: ${message}`);
        // Speak positioning instruction
        voiceManager.speakText(message, 1);
      } else if (data.ready) {
        const message = 'Ready to start!';
        setPostureMessage(message);
        setDetectionStatus('Ready - Start exercising!');
        // Speak readiness confirmation
        voiceManager.speakText(message, 0);
      }
    }

    // Handle form score
    if (data.score !== undefined) {
      console.log(`[PoseTracker] Form score: ${data.score}`);
      // Provide voice feedback based on score
      if (data.score >= 85) {
        voiceManager.speakText('Good form, keep going.', 0);
      } else if (data.score >= 60) {
        voiceManager.speakText('Adjust your form slightly.', 1);
      } else {
        voiceManager.speakText('Check your posture.', 2);
      }
    }

    // Emit general data received callback
    onDataReceived?.(data);
    onStatusChange?.(detectionStatus);
  }, [onRepsChange, onDataReceived, onStatusChange, detectionStatus]);

  // Handle messages from WebView
  const handleMessage = useCallback((event: any) => {
    try {
      let parsedData: PoseTrackerData;

      if (typeof event.nativeEvent.data === 'string') {
        parsedData = JSON.parse(event.nativeEvent.data);
      } else {
        parsedData = event.nativeEvent.data;
      }

      handlePoseTrackerData(parsedData);
    } catch (error) {
      console.error('[PoseTracker] Error parsing WebView message:', error);
      console.log('[PoseTracker] Raw data:', event.nativeEvent.data);
    }
  }, [handlePoseTrackerData]);

  // Handle WebView load start
  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
    setDetectionStatus('Loading PoseTracker...');
    onStatusChange?.('Loading PoseTracker...');
  };

  // Handle WebView load end
  const handleLoadEnd = () => {
    setIsLoading(false);
    setDetectionStatus('Initializing pose detection...');
    onStatusChange?.('Initializing pose detection...');
  };

  // Handle WebView errors
  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[PoseTracker] WebView error:', nativeEvent);
    const errorMsg = nativeEvent.description || 'Failed to load PoseTracker';
    setError(errorMsg);
    setDetectionStatus(`Error: ${errorMsg}`);
    onStatusChange?.(`Error: ${errorMsg}`);
  };

  // Retry loading
  const handleRetry = () => {
    setError(null);
    webViewRef.current?.reload();
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>PoseTracker Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.errorUrl}>URL: {poseTrackerUrl}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{detectionStatus}</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: poseTrackerUrl }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        injectedJavaScript={jsBridge}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleWebViewError}
        userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36"
      />

      {/* Status Overlay */}
      <View style={styles.statusOverlay}>
        {/* Reps Counter */}
        {repsCount > 0 && (
          <View style={styles.repsBox}>
            <Text style={styles.repsLabel}>REPS</Text>
            <Text style={styles.repsValue}>{repsCount}</Text>
          </View>
        )}

        {/* Readiness Indicator */}
        {!isReady && (
          <View style={styles.positionBox}>
            <Ionicons name="alert-circle" size={16} color={colors.warning} />
            <Text style={styles.positionText}>{postureMessage}</Text>
          </View>
        )}

        {isReady && repsCount === 0 && (
          <View style={styles.readyBox}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.readyText}>Ready to Start!</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  webView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: spacing.lg,
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  statusOverlay: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 100,
  },
  repsBox: {
    backgroundColor: 'rgba(245, 117, 16, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
    marginBottom: spacing.md,
  },
  repsLabel: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  repsValue: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  positionBox: {
    backgroundColor: 'rgba(232, 201, 86, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  positionText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '500',
    flex: 1,
  },
  readyBox: {
    backgroundColor: 'rgba(86, 232, 160, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  readyText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  errorMessage: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  errorUrl: {
    fontSize: fontSize.sm,
    color: colors.gray400,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
});
