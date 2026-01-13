import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { Platform } from 'react-native';
import '@tensorflow/tfjs-backend-cpu';
// @ts-ignore - base-64 doesn't have types
import { decode as atob } from 'base-64';
// @ts-ignore - jpeg-js types may not match
import * as jpeg from 'jpeg-js';

// Register custom HTTP handler for React Native
if (Platform.OS !== 'web') {
  // Override the platform's fetch for TensorFlow
  const originalPlatform = tf.ENV.platform;
  
  class ReactNativePlatform implements tf.Platform {
    fetch(path: string, init?: RequestInit): Promise<Response> {
      // Use global fetch that should be polyfilled
      if (typeof global.fetch !== 'function') {
        throw new Error('Fetch is not available. Make sure polyfills are loaded.');
      }
      return global.fetch(path, init);
    }
    now(): number {
      return Date.now();
    }
    encode(text: string, encoding?: string): Uint8Array {
      if (typeof global.TextEncoder !== 'undefined') {
        return new global.TextEncoder().encode(text);
      }
      // Fallback
      const utf8 = unescape(encodeURIComponent(text));
      const result = new Uint8Array(utf8.length);
      for (let i = 0; i < utf8.length; i++) {
        result[i] = utf8.charCodeAt(i);
      }
      return result;
    }
    decode(bytes: Uint8Array, encoding?: string): string {
      if (typeof global.TextDecoder !== 'undefined') {
        return new global.TextDecoder().decode(bytes);
      }
      // Fallback
      let result = '';
      for (let i = 0; i < bytes.length; i++) {
        result += String.fromCharCode(bytes[i]);
      }
      return decodeURIComponent(escape(result));
    }
    isTypedArray(a: unknown): a is Uint8Array | Float32Array | Int32Array | Uint8ClampedArray {
      return a instanceof Uint8Array || 
             a instanceof Float32Array || 
             a instanceof Int32Array || 
             a instanceof Uint8ClampedArray;
    }
    setTimeoutCustom?(functionRef: Function, delay: number): void {
      setTimeout(functionRef, delay);
    }
  }
  
  // Register the custom platform
  tf.env().setPlatform('react-native', new ReactNativePlatform());
}

export interface Keypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

export interface Pose {
  keypoints: Keypoint[];
  score?: number;
}

export interface PostureAnalysis {
  score: number;
  isCorrect: boolean;
  feedback: string[];
  mistakes: string[];
  color: 'green' | 'yellow' | 'red';
  personalizedInsights?: string[];
  poseClassification?: string;
}

export class PoseDetectionService {
  private detector: poseDetection.PoseDetector | null = null;
  private isInitialized = false;

  isReady(): boolean {
    return this.isInitialized && this.detector !== null;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Detector already initialized');
      return;
    }

    // Longer timeout for mobile devices (30s) vs web (15s)
    const timeoutDuration = Platform.OS !== 'web' ? 30000 : 15000;
    const initPromise = this.performInitialization();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Initialization timeout - model loading took too long. Please check your internet connection.')), timeoutDuration)
    );

    try {
      await Promise.race([initPromise, timeoutPromise]);
      console.log('✅ Pose detection initialized successfully');
    } catch (error) {
      this.isInitialized = false;
      this.detector = null;
      console.error('❌ Failed to initialize pose detection:', error);
      throw error;
    }
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('Step 1: Setting up TensorFlow backend...');
      console.log('Platform detected:', Platform.OS);
      
      // Always use CPU backend for React Native (iOS/Android)
      // Only use WebGL for web platform
      if (Platform.OS === 'web') {
        console.log('Web platform - attempting WebGL backend');
        try {
          await tf.setBackend('webgl');
        } catch (webglError) {
          console.warn('WebGL failed, falling back to CPU:', webglError);
          await tf.setBackend('cpu');
        }
      } else {
        console.log('Mobile device (iOS/Android) - using CPU backend');
        // Ensure CPU backend is properly set for mobile
        try {
          await tf.setBackend('cpu');
        } catch (cpuError) {
          console.error('CPU backend setup error:', cpuError);
          throw new Error('Failed to initialize TensorFlow backend on mobile');
        }
      }
      
      await tf.ready();
      console.log('✅ TensorFlow backend ready:', tf.getBackend());

      console.log('Step 2: Loading MoveNet model (this may take a moment)...');
      const model = poseDetection.SupportedModels.MoveNet;
      
      // Use lighter model for mobile devices with optimized settings
      const detectorConfig: poseDetection.MoveNetModelConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING, // Always use lightning for speed
        enableSmoothing: true,
        minPoseScore: 0.15, // Lower threshold for better detection on mobile
        multiPoseMaxDimension: 192, // Smaller for faster processing
      };

      this.detector = await poseDetection.createDetector(model, detectorConfig);
      this.isInitialized = true;
      console.log('✅ MoveNet model loaded successfully');
    } catch (error) {
      console.error('Initialization failed at step:', error);
      
      // Provide more detailed error information
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      throw error;
    }
  }

  async detectPose(imageData: any): Promise<Pose[]> {
    if (!this.detector) {
      throw new Error('Detector not initialized');
    }

    try {
      let inputTensor: tf.Tensor3D | null = null;
      
      if (Platform.OS !== 'web') {
        // React Native: Convert base64 image to tensor
        if (typeof imageData === 'string') {
          console.log('Processing base64 image, length:', imageData.length);
          
          // Handle base64 encoded image
          let base64Data = imageData;
          
          // Remove data URL prefix if present
          if (base64Data.startsWith('data:')) {
            base64Data = base64Data.split(',')[1];
          }
          
          try {
            // Decode base64 to binary
            console.log('Decoding base64...');
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            console.log('Binary data size:', bytes.length);
            
            // Decode JPEG to raw pixel data
            console.log('Decoding JPEG...');
            const rawImageData = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
            console.log('Image dimensions:', rawImageData.width, 'x', rawImageData.height);
            
            // Resize image for faster processing on mobile (max 256x256)
            let { width, height, data } = rawImageData;
            const maxDim = 256;
            let resizedData = data;
            let newWidth = width;
            let newHeight = height;
            
            if (width > maxDim || height > maxDim) {
              const scale = Math.min(maxDim / width, maxDim / height);
              newWidth = Math.floor(width * scale);
              newHeight = Math.floor(height * scale);
              console.log(`Resizing from ${width}x${height} to ${newWidth}x${newHeight}`);
              
              // Simple nearest-neighbor resize for speed
              resizedData = new Uint8Array(newWidth * newHeight * 4);
              for (let y = 0; y < newHeight; y++) {
                for (let x = 0; x < newWidth; x++) {
                  const srcX = Math.floor(x / scale);
                  const srcY = Math.floor(y / scale);
                  const srcIdx = (srcY * width + srcX) * 4;
                  const dstIdx = (y * newWidth + x) * 4;
                  resizedData[dstIdx] = data[srcIdx];
                  resizedData[dstIdx + 1] = data[srcIdx + 1];
                  resizedData[dstIdx + 2] = data[srcIdx + 2];
                  resizedData[dstIdx + 3] = data[srcIdx + 3];
                }
              }
              width = newWidth;
              height = newHeight;
              data = resizedData;
            }
            
            // Convert RGBA to RGB and create tensor
            const rgbData = new Uint8Array(width * height * 3);
            
            for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
              rgbData[j] = data[i];       // R
              rgbData[j + 1] = data[i + 1]; // G
              rgbData[j + 2] = data[i + 2]; // B
            }
            
            console.log('Creating tensor...');
            inputTensor = tf.tensor3d(Array.from(rgbData), [height, width, 3], 'int32');
            console.log('Tensor created successfully');
            
          } catch (decodeError) {
            console.error('Failed to decode image:', decodeError);
            return [];
          }
        } else {
          // If it's already a tensor, use it directly
          console.log('Using existing tensor');
          inputTensor = imageData as tf.Tensor3D;
        }
      } else {
        // Web platform: Use standard browser APIs
        if (typeof imageData === 'string') {
          const img = new (globalThis as any).Image();
          img.crossOrigin = 'anonymous';
          img.src = imageData;
          await new Promise((resolve, reject) => { 
            img.onload = resolve; 
            img.onerror = reject;
          });
          inputTensor = tf.browser.fromPixels(img);
        } else if (imageData instanceof HTMLImageElement || imageData instanceof HTMLVideoElement) {
          inputTensor = tf.browser.fromPixels(imageData);
        } else if (imageData instanceof tf.Tensor) {
          inputTensor = imageData as tf.Tensor3D;
        }
      }
      
      if (!inputTensor) {
        console.error('Failed to create input tensor');
        return [];
      }

      // Run pose detection with timeout for mobile
      const detectionPromise = this.detector.estimatePoses(inputTensor);
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => {
          console.warn('Pose estimation timeout');
          resolve(null);
        }, Platform.OS !== 'web' ? 3000 : 5000)
      );
      
      const poses = await Promise.race([detectionPromise, timeoutPromise]);
      
      // Log detected poses for debugging
      if (poses && poses.length > 0) {
        console.log('Detected pose with', poses[0].keypoints.length, 'keypoints');
      }
      
      // Clean up tensor to prevent memory leaks
      if (inputTensor && inputTensor.dispose) {
        inputTensor.dispose();
      }
      
      return poses || [];
    } catch (error) {
      console.error('Pose detection error:', error);
      return [];
    }
  }

  // Generate simulated pose keypoints for fallback - exercise specific
  generateSimulatedPose(exerciseType?: string): Pose {
    const variation = () => (Math.random() - 0.5) * 0.08;
    const exercise = exerciseType?.toLowerCase() || '';
    
    let keypoints: Keypoint[];
    
    if (exercise.includes('plank')) {
      // Plank position - horizontal body
      keypoints = [
        { name: 'nose', x: 0.2 + variation(), y: 0.35 + variation(), score: 0.9 },
        { name: 'left_eye', x: 0.18 + variation(), y: 0.33 + variation(), score: 0.9 },
        { name: 'right_eye', x: 0.22 + variation(), y: 0.33 + variation(), score: 0.9 },
        { name: 'left_ear', x: 0.15 + variation(), y: 0.34 + variation(), score: 0.8 },
        { name: 'right_ear', x: 0.25 + variation(), y: 0.34 + variation(), score: 0.8 },
        { name: 'left_shoulder', x: 0.3 + variation(), y: 0.4 + variation(), score: 0.9 },
        { name: 'right_shoulder', x: 0.3 + variation(), y: 0.35 + variation(), score: 0.9 },
        { name: 'left_elbow', x: 0.28 + variation(), y: 0.55 + variation(), score: 0.85 },
        { name: 'right_elbow', x: 0.28 + variation(), y: 0.5 + variation(), score: 0.85 },
        { name: 'left_wrist', x: 0.26 + variation(), y: 0.65 + variation(), score: 0.8 },
        { name: 'right_wrist', x: 0.26 + variation(), y: 0.6 + variation(), score: 0.8 },
        { name: 'left_hip', x: 0.55 + variation(), y: 0.42 + variation(), score: 0.9 },
        { name: 'right_hip', x: 0.55 + variation(), y: 0.38 + variation(), score: 0.9 },
        { name: 'left_knee', x: 0.7 + variation(), y: 0.45 + variation(), score: 0.85 },
        { name: 'right_knee', x: 0.7 + variation(), y: 0.4 + variation(), score: 0.85 },
        { name: 'left_ankle', x: 0.85 + variation(), y: 0.48 + variation(), score: 0.8 },
        { name: 'right_ankle', x: 0.85 + variation(), y: 0.43 + variation(), score: 0.8 },
      ];
    } else if (exercise.includes('squat')) {
      // Squat position - bent knees
      keypoints = [
        { name: 'nose', x: 0.5 + variation(), y: 0.2 + variation(), score: 0.9 },
        { name: 'left_eye', x: 0.48 + variation(), y: 0.18 + variation(), score: 0.9 },
        { name: 'right_eye', x: 0.52 + variation(), y: 0.18 + variation(), score: 0.9 },
        { name: 'left_ear', x: 0.45 + variation(), y: 0.19 + variation(), score: 0.8 },
        { name: 'right_ear', x: 0.55 + variation(), y: 0.19 + variation(), score: 0.8 },
        { name: 'left_shoulder', x: 0.4 + variation(), y: 0.3 + variation(), score: 0.9 },
        { name: 'right_shoulder', x: 0.6 + variation(), y: 0.3 + variation(), score: 0.9 },
        { name: 'left_elbow', x: 0.35 + variation(), y: 0.4 + variation(), score: 0.85 },
        { name: 'right_elbow', x: 0.65 + variation(), y: 0.4 + variation(), score: 0.85 },
        { name: 'left_wrist', x: 0.45 + variation(), y: 0.45 + variation(), score: 0.8 },
        { name: 'right_wrist', x: 0.55 + variation(), y: 0.45 + variation(), score: 0.8 },
        { name: 'left_hip', x: 0.43 + variation(), y: 0.55 + variation(), score: 0.9 },
        { name: 'right_hip', x: 0.57 + variation(), y: 0.55 + variation(), score: 0.9 },
        { name: 'left_knee', x: 0.38 + variation(), y: 0.72 + variation(), score: 0.85 },
        { name: 'right_knee', x: 0.62 + variation(), y: 0.72 + variation(), score: 0.85 },
        { name: 'left_ankle', x: 0.4 + variation(), y: 0.92 + variation(), score: 0.8 },
        { name: 'right_ankle', x: 0.6 + variation(), y: 0.92 + variation(), score: 0.8 },
      ];
    } else if (exercise.includes('push')) {
      // Push-up position
      keypoints = [
        { name: 'nose', x: 0.25 + variation(), y: 0.3 + variation(), score: 0.9 },
        { name: 'left_eye', x: 0.23 + variation(), y: 0.28 + variation(), score: 0.9 },
        { name: 'right_eye', x: 0.27 + variation(), y: 0.28 + variation(), score: 0.9 },
        { name: 'left_ear', x: 0.2 + variation(), y: 0.29 + variation(), score: 0.8 },
        { name: 'right_ear', x: 0.3 + variation(), y: 0.29 + variation(), score: 0.8 },
        { name: 'left_shoulder', x: 0.35 + variation(), y: 0.4 + variation(), score: 0.9 },
        { name: 'right_shoulder', x: 0.35 + variation(), y: 0.35 + variation(), score: 0.9 },
        { name: 'left_elbow', x: 0.32 + variation(), y: 0.55 + variation(), score: 0.85 },
        { name: 'right_elbow', x: 0.32 + variation(), y: 0.5 + variation(), score: 0.85 },
        { name: 'left_wrist', x: 0.3 + variation(), y: 0.68 + variation(), score: 0.8 },
        { name: 'right_wrist', x: 0.3 + variation(), y: 0.63 + variation(), score: 0.8 },
        { name: 'left_hip', x: 0.6 + variation(), y: 0.42 + variation(), score: 0.9 },
        { name: 'right_hip', x: 0.6 + variation(), y: 0.38 + variation(), score: 0.9 },
        { name: 'left_knee', x: 0.75 + variation(), y: 0.45 + variation(), score: 0.85 },
        { name: 'right_knee', x: 0.75 + variation(), y: 0.4 + variation(), score: 0.85 },
        { name: 'left_ankle', x: 0.9 + variation(), y: 0.48 + variation(), score: 0.8 },
        { name: 'right_ankle', x: 0.9 + variation(), y: 0.43 + variation(), score: 0.8 },
      ];
    } else {
      // Default standing pose
      keypoints = [
        { name: 'nose', x: 0.5 + variation(), y: 0.12 + variation(), score: 0.9 },
        { name: 'left_eye', x: 0.48 + variation(), y: 0.1 + variation(), score: 0.9 },
        { name: 'right_eye', x: 0.52 + variation(), y: 0.1 + variation(), score: 0.9 },
        { name: 'left_ear', x: 0.45 + variation(), y: 0.11 + variation(), score: 0.8 },
        { name: 'right_ear', x: 0.55 + variation(), y: 0.11 + variation(), score: 0.8 },
        { name: 'left_shoulder', x: 0.4 + variation(), y: 0.22 + variation(), score: 0.9 },
        { name: 'right_shoulder', x: 0.6 + variation(), y: 0.22 + variation(), score: 0.9 },
        { name: 'left_elbow', x: 0.35 + variation(), y: 0.38 + variation(), score: 0.85 },
        { name: 'right_elbow', x: 0.65 + variation(), y: 0.38 + variation(), score: 0.85 },
        { name: 'left_wrist', x: 0.32 + variation(), y: 0.52 + variation(), score: 0.8 },
        { name: 'right_wrist', x: 0.68 + variation(), y: 0.52 + variation(), score: 0.8 },
        { name: 'left_hip', x: 0.45 + variation(), y: 0.52 + variation(), score: 0.9 },
        { name: 'right_hip', x: 0.55 + variation(), y: 0.52 + variation(), score: 0.9 },
        { name: 'left_knee', x: 0.44 + variation(), y: 0.72 + variation(), score: 0.85 },
        { name: 'right_knee', x: 0.56 + variation(), y: 0.72 + variation(), score: 0.85 },
        { name: 'left_ankle', x: 0.43 + variation(), y: 0.92 + variation(), score: 0.8 },
        { name: 'right_ankle', x: 0.57 + variation(), y: 0.92 + variation(), score: 0.8 },
      ];
    }

    return {
      keypoints,
      score: 0.85 + (Math.random() * 0.1)
    };
  }

  // Helper function to get keypoint by name (MoveNet uses specific keypoint names)
  private getKeypoint(keypoints: Keypoint[], name: string): Keypoint | undefined {
    // MoveNet keypoint names mapping
    const keypointIndex: { [key: string]: number } = {
      'nose': 0,
      'left_eye': 1,
      'right_eye': 2,
      'left_ear': 3,
      'right_ear': 4,
      'left_shoulder': 5,
      'right_shoulder': 6,
      'left_elbow': 7,
      'right_elbow': 8,
      'left_wrist': 9,
      'right_wrist': 10,
      'left_hip': 11,
      'right_hip': 12,
      'left_knee': 13,
      'right_knee': 14,
      'left_ankle': 15,
      'right_ankle': 16
    };

    const index = keypointIndex[name];
    if (index !== undefined && keypoints[index]) {
      return keypoints[index];
    }

    // Fallback: search by name property
    return keypoints.find(kp => kp.name === name);
  }

  analyzePlank(pose: Pose, exerciseName: string): PostureAnalysis {
    const keypoints = pose.keypoints;
    const mistakes: string[] = [];
    let score = 100;

    // Get key body points
    const leftShoulder = this.getKeypoint(keypoints, 'left_shoulder');
    const rightShoulder = this.getKeypoint(keypoints, 'right_shoulder');
    const leftHip = this.getKeypoint(keypoints, 'left_hip');
    const rightHip = this.getKeypoint(keypoints, 'right_hip');
    const leftAnkle = this.getKeypoint(keypoints, 'left_ankle');
    const rightAnkle = this.getKeypoint(keypoints, 'right_ankle');
    const leftElbow = this.getKeypoint(keypoints, 'left_elbow');
    const rightElbow = this.getKeypoint(keypoints, 'right_elbow');

    const minConfidence = 0.2;
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip ||
        (leftShoulder.score && leftShoulder.score < minConfidence) ||
        (rightShoulder.score && rightShoulder.score < minConfidence)) {
      return {
        score: 60,
        isCorrect: false,
        feedback: ['Position yourself so your full body is visible'],
        mistakes: ['Body not fully visible to camera'],
        color: 'yellow',
      };
    }

    // 1. Check body alignment (shoulder-hip-ankle should form straight line)
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipMidY = (leftHip.y + rightHip.y) / 2;
    const ankleMidY = leftAnkle && rightAnkle ? (leftAnkle.y + rightAnkle.y) / 2 : null;

    // Calculate if hips are sagging (hips lower than expected)
    const hipSag = hipMidY - shoulderMidY;
    if (hipSag > 50) {
      mistakes.push('🔴 Hips are sagging - engage your core!');
      score -= 25;
    } else if (hipSag > 30) {
      mistakes.push('🟡 Slight hip sag - tighten your core');
      score -= 15;
    }

    // 2. Check if hips are too high
    if (hipSag < -30) {
      mistakes.push('🔴 Hips too high - lower them to align with shoulders');
      score -= 20;
    } else if (hipSag < -15) {
      mistakes.push('🟡 Hips slightly elevated');
      score -= 10;
    }

    // 3. Check elbow position (should be under shoulders)
    if (leftElbow && rightElbow) {
      const elbowMidX = (leftElbow.x + rightElbow.x) / 2;
      const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
      const elbowAlignment = Math.abs(elbowMidX - shoulderMidX);
      
      if (elbowAlignment > 40) {
        mistakes.push('🔴 Elbows not under shoulders - reposition');
        score -= 15;
      } else if (elbowAlignment > 25) {
        mistakes.push('🟡 Adjust elbows closer to shoulders');
        score -= 8;
      }
    }

    // 4. Check head position (neutral spine)
    const nose = this.getKeypoint(keypoints, 'nose');
    if (nose && shoulderMidY) {
      const headDrop = nose.y - shoulderMidY;
      if (headDrop > 60) {
        mistakes.push('🟡 Head dropping - look slightly ahead');
        score -= 10;
      } else if (headDrop < -20) {
        mistakes.push('🟡 Keep neck neutral - don\'t look up');
        score -= 8;
      }
    }

    // 5. Check shoulder stability
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    if (shoulderWidth < 80) {
      mistakes.push('🟡 Widen your hand placement');
      score -= 5;
    }

    const isCorrect = score >= 75;
    const color: 'green' | 'yellow' | 'red' = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';

    const feedback: string[] = [];
    if (score >= 90) {
      feedback.push('💪 Perfect plank form!');
      feedback.push('✓ Body aligned beautifully');
      feedback.push('✓ Core engaged properly');
    } else if (score >= 75) {
      feedback.push('✓ Great form!');
      feedback.push('✓ Maintain this position');
      if (mistakes.length > 0) feedback.push(mistakes[0]);
    } else if (score >= 60) {
      feedback.push('Good effort - minor adjustments:');
      feedback.push(...mistakes.slice(0, 2));
    } else {
      feedback.push('Focus on these corrections:');
      feedback.push(...mistakes.slice(0, 3));
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      isCorrect,
      feedback,
      mistakes,
      color,
    };
  }

  analyzeSquat(pose: Pose): PostureAnalysis {
    const keypoints = pose.keypoints;
    const mistakes: string[] = [];
    let score = 100;

    const leftHip = this.getKeypoint(keypoints, 'left_hip');
    const rightHip = this.getKeypoint(keypoints, 'right_hip');
    const leftKnee = this.getKeypoint(keypoints, 'left_knee');
    const rightKnee = this.getKeypoint(keypoints, 'right_knee');
    const leftAnkle = this.getKeypoint(keypoints, 'left_ankle');
    const rightAnkle = this.getKeypoint(keypoints, 'right_ankle');
    const leftShoulder = this.getKeypoint(keypoints, 'left_shoulder');
    const rightShoulder = this.getKeypoint(keypoints, 'right_shoulder');

    const minConfidence = 0.2;
    if (!leftHip || !leftKnee || !leftAnkle ||
        (leftHip.score && leftHip.score < minConfidence)) {
      return {
        score: 60,
        isCorrect: false,
        feedback: ['Position yourself so your full body is visible'],
        mistakes: ['Body not fully visible'],
        color: 'yellow',
      };
    }

    // 1. Check squat depth (hip should be at or below knee level)
    const hipKneeDepth = leftHip.y - leftKnee.y;
    if (hipKneeDepth > 40) {
      mistakes.push('🔴 Not deep enough - squat lower!');
      score -= 30;
    } else if (hipKneeDepth > 20) {
      mistakes.push('🟡 Go a bit deeper for full range');
      score -= 15;
    } else if (hipKneeDepth < -10) {
      mistakes.push('✓ Excellent depth!');
    }

    // 2. Check knee alignment (knees shouldn't go too far past toes)
    const kneeAnkleAlignment = leftKnee.x - leftAnkle.x;
    if (kneeAnkleAlignment > 50) {
      mistakes.push('🔴 Knees too far forward - sit back more!');
      score -= 25;
    } else if (kneeAnkleAlignment > 30) {
      mistakes.push('🟡 Sit back slightly more');
      score -= 12;
    }

    // 3. Check if knees are caving in (tracking over toes)
    if (leftKnee && rightKnee && leftHip && rightHip) {
      const kneeWidth = Math.abs(leftKnee.x - rightKnee.x);
      const hipWidth = Math.abs(leftHip.x - rightHip.x);
      if (kneeWidth < hipWidth * 0.7) {
        mistakes.push('🔴 Knees caving in - push knees out!');
        score -= 20;
      } else if (kneeWidth < hipWidth * 0.85) {
        mistakes.push('🟡 Keep knees tracking over toes');
        score -= 10;
      }
    }

    // 4. Check chest position (should stay upright)
    if (leftShoulder && leftHip) {
      const chestAngle = leftShoulder.x - leftHip.x;
      if (Math.abs(chestAngle) > 80) {
        mistakes.push('🔴 Keep chest up - avoid excessive forward lean');
        score -= 18;
      } else if (Math.abs(chestAngle) > 50) {
        mistakes.push('🟡 Maintain upright chest position');
        score -= 10;
      }
    }

    // 5. Check weight distribution (heels should be on ground)
    const heelAnkleDistance = Math.abs(leftAnkle.y - (leftKnee.y + 100));
    if (heelAnkleDistance > 40) {
      mistakes.push('🟡 Keep weight in heels');
      score -= 8;
    }

    const isCorrect = score >= 75;
    const color: 'green' | 'yellow' | 'red' = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';

    const feedback: string[] = [];
    if (score >= 90) {
      feedback.push('💪 Textbook perfect squat!');
      feedback.push('✓ Excellent depth and form');
      feedback.push('✓ Knees tracking perfectly');
    } else if (score >= 75) {
      feedback.push('✓ Great squat form!');
      feedback.push('✓ Good depth and positioning');
      if (mistakes.length > 0 && !mistakes[0].includes('✓')) {
        feedback.push(mistakes[0]);
      }
    } else if (score >= 60) {
      feedback.push('Good effort - focus on:');
      feedback.push(...mistakes.filter(m => !m.includes('✓')).slice(0, 2));
    } else {
      feedback.push('Key corrections needed:');
      feedback.push(...mistakes.filter(m => !m.includes('✓')).slice(0, 3));
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      isCorrect,
      feedback,
      mistakes: mistakes.filter(m => !m.includes('✓')),
      color,
    };
  }

  analyzePosture(pose: Pose, exerciseName: string): PostureAnalysis {
    // Route to specific exercise analysis
    switch (exerciseName.toLowerCase()) {
      case 'plank':
      case 'forearm plank':
        return this.analyzePlank(pose, exerciseName);
      case 'squat':
      case 'bodyweight squat':
        return this.analyzeSquat(pose);
      case 'push-up':
        return this.analyzePushUp(pose);
      case 'lunge':
        return this.analyzeLunge(pose);
      case 'shoulder raise':
      case 'lateral raise':
        return this.analyzeLateralRaise(pose);
      case 'front arm raise':
        return this.analyzeFrontRaise(pose);
      case 'overhead press':
        return this.analyzeOverheadPress(pose);
      default:
        return this.analyzeGenericPosture(pose);
    }
  }

  private analyzePushUp(pose: Pose): PostureAnalysis {
    const mistakes: string[] = [];
    let score = 100;

    const leftShoulder = this.getKeypoint(pose.keypoints, 'left_shoulder');
    const leftElbow = this.getKeypoint(pose.keypoints, 'left_elbow');
    const leftHip = this.getKeypoint(pose.keypoints, 'left_hip');
    const leftWrist = this.getKeypoint(pose.keypoints, 'left_wrist');
    const leftAnkle = this.getKeypoint(pose.keypoints, 'left_ankle');

    const minConfidence = 0.2;
    if (!leftShoulder || !leftElbow || !leftHip ||
        (leftShoulder.score && leftShoulder.score < minConfidence)) {
      return {
        score: 60,
        isCorrect: false,
        feedback: ['Position yourself so your full body is visible from the side'],
        mistakes: ['Body not fully visible'],
        color: 'yellow',
      };
    }

    // 1. Check body alignment (straight line from shoulders to ankles)
    if (leftAnkle) {
      const shoulderAnkleDiff = Math.abs((leftShoulder.y - leftHip.y) - (leftHip.y - leftAnkle.y));
      if (shoulderAnkleDiff > 40) {
        mistakes.push('🔴 Hips sagging - engage your core!');
        score -= 25;
      } else if (shoulderAnkleDiff > 25) {
        mistakes.push('🟡 Keep core tight for straight body line');
        score -= 12;
      }
    }

    // 2. Check elbow depth (should bend to ~90 degrees)
    const elbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
    if (elbowAngle) {
      if (elbowAngle > 140) {
        mistakes.push('🔴 Go lower - bend elbows more!');
        score -= 30;
      } else if (elbowAngle > 110) {
        mistakes.push('🟡 Try to go a bit lower');
        score -= 15;
      } else if (elbowAngle < 70) {
        mistakes.push('🟡 Don\'t go too low');
        score -= 10;
      }
    }

    // 3. Check elbow width (should be ~45 degrees from body)
    const rightElbow = this.getKeypoint(pose.keypoints, 'right_elbow');
    if (rightElbow) {
      const elbowWidth = Math.abs(leftElbow.x - rightElbow.x);
      const shoulderWidth = Math.abs(leftShoulder.x - this.getKeypoint(pose.keypoints, 'right_shoulder')!.x);
      if (elbowWidth < shoulderWidth * 0.6) {
        mistakes.push('🟡 Widen elbows slightly');
        score -= 8;
      }
    }

    const isCorrect = score >= 75;
    const color: 'green' | 'yellow' | 'red' = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';

    const feedback: string[] = [];
    if (score >= 90) {
      feedback.push('💪 Perfect push-up form!');
      feedback.push('✓ Excellent body control');
    } else if (score >= 75) {
      feedback.push('✓ Great push-up!');
      if (mistakes.length > 0 && !mistakes[0].includes('✓')) feedback.push(mistakes[0]);
    } else {
      feedback.push('Focus on:');
      feedback.push(...mistakes.filter(m => !m.includes('✓')).slice(0, 2));
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      isCorrect,
      feedback,
      mistakes: mistakes.filter(m => !m.includes('✓')),
      color,
    };
  }

  private analyzeLunge(pose: Pose): PostureAnalysis {
    const mistakes: string[] = [];
    let score = 100;

    const leftKnee = this.getKeypoint(pose.keypoints, 'left_knee');
    const leftAnkle = this.getKeypoint(pose.keypoints, 'left_ankle');
    const rightKnee = this.getKeypoint(pose.keypoints, 'right_knee');

    const minConfidence = 0.2;
    if (!leftKnee || !leftAnkle ||
        (leftKnee.score && leftKnee.score < minConfidence)) {
      return {
        score: 50,
        isCorrect: false,
        feedback: ['Adjust position - show your body from the side'],
        mistakes: ['Position needs adjustment'],
        color: 'yellow',
      };
    }

    // Check front knee alignment
    if (leftKnee.x > leftAnkle.x + 30) {
      mistakes.push('Front knee shouldn\'t go past toes');
      score -= 30;
    }

    // Check depth
    if (leftKnee.y < leftAnkle.y - 30) {
      mistakes.push('Go deeper - aim for 90-degree angle');
      score -= 25;
    }

    const isCorrect = score >= 80;
    const color: 'green' | 'yellow' | 'red' = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';

    return {
      score: Math.max(0, score),
      isCorrect,
      feedback: isCorrect ? ['Perfect lunge!'] : mistakes,
      mistakes,
      color,
    };
  }

  private analyzeLateralRaise(pose: Pose): PostureAnalysis {
    const mistakes: string[] = [];
    let score = 100;

    const leftShoulder = this.getKeypoint(pose.keypoints, 'left_shoulder');
    const rightShoulder = this.getKeypoint(pose.keypoints, 'right_shoulder');
    const leftElbow = this.getKeypoint(pose.keypoints, 'left_elbow');
    const rightElbow = this.getKeypoint(pose.keypoints, 'right_elbow');
    const leftWrist = this.getKeypoint(pose.keypoints, 'left_wrist');
    const rightWrist = this.getKeypoint(pose.keypoints, 'right_wrist');

    const minConfidence = 0.2;
    if (!leftShoulder || !rightShoulder || !leftElbow || !rightElbow ||
        (leftShoulder.score && leftShoulder.score < minConfidence)) {
      return {
        score: 50,
        isCorrect: false,
        feedback: ['Face the camera directly', 'Ensure upper body is visible'],
        mistakes: ['Body positioning issue'],
        color: 'yellow',
      };
    }

    // Check if arms are raised to shoulder level
    if (leftWrist && leftWrist.y > leftShoulder.y - 20) {
      mistakes.push('Raise your left arm higher to shoulder level');
      score -= 30;
    }
    if (rightWrist && rightWrist.y > rightShoulder.y - 20) {
      mistakes.push('Raise your right arm higher to shoulder level');
      score -= 30;
    }

    // Check if arms are extended laterally (not forward)
    const leftArmExtension = leftElbow && leftShoulder ? Math.abs(leftElbow.x - leftShoulder.x) : 0;
    const rightArmExtension = rightElbow && rightShoulder ? Math.abs(rightElbow.x - rightShoulder.x) : 0;
    
    if (leftArmExtension < 50) {
      mistakes.push('Extend your left arm out to the side');
      score -= 20;
    }
    if (rightArmExtension < 50) {
      mistakes.push('Extend your right arm out to the side');
      score -= 20;
    }

    const isCorrect = score >= 80;
    const color: 'green' | 'yellow' | 'red' = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';

    return {
      score: Math.max(0, score),
      isCorrect,
      feedback: isCorrect ? ['Perfect lateral raise!', 'Arms at shoulder height'] : mistakes,
      mistakes,
      color,
    };
  }

  private analyzeFrontRaise(pose: Pose): PostureAnalysis {
    const mistakes: string[] = [];
    let score = 100;

    const leftShoulder = this.getKeypoint(pose.keypoints, 'left_shoulder');
    const leftWrist = this.getKeypoint(pose.keypoints, 'left_wrist');
    const rightShoulder = this.getKeypoint(pose.keypoints, 'right_shoulder');
    const rightWrist = this.getKeypoint(pose.keypoints, 'right_wrist');
    const nose = this.getKeypoint(pose.keypoints, 'nose');

    const minConfidence = 0.2;
    if (!leftShoulder || !rightShoulder ||
        (leftShoulder.score && leftShoulder.score < minConfidence)) {
      return {
        score: 50,
        isCorrect: false,
        feedback: ['Stand facing the camera', 'Keep upper body visible'],
        mistakes: ['Position issue'],
        color: 'yellow',
      };
    }

    // Check if arms are raised to shoulder height in front
    if (leftWrist && leftWrist.y > leftShoulder.y - 20) {
      mistakes.push('Raise arms higher to shoulder level');
      score -= 35;
    }

    // Check arms are in front (closer to camera/nose)
    if (nose && leftWrist && Math.abs(leftWrist.x - nose.x) > 100) {
      mistakes.push('Keep arms in front of your body');
      score -= 25;
    }

    const isCorrect = score >= 80;
    const color: 'green' | 'yellow' | 'red' = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';

    return {
      score: Math.max(0, score),
      isCorrect,
      feedback: isCorrect ? ['Excellent front raise!'] : mistakes,
      mistakes,
      color,
    };
  }

  private analyzeOverheadPress(pose: Pose): PostureAnalysis {
    const mistakes: string[] = [];
    let score = 100;

    const leftShoulder = this.getKeypoint(pose.keypoints, 'left_shoulder');
    const rightShoulder = this.getKeypoint(pose.keypoints, 'right_shoulder');
    const leftWrist = this.getKeypoint(pose.keypoints, 'left_wrist');
    const rightWrist = this.getKeypoint(pose.keypoints, 'right_wrist');
    const leftEar = this.getKeypoint(pose.keypoints, 'left_ear');

    const minConfidence = 0.2;
    if (!leftShoulder || !rightShoulder ||
        (leftShoulder.score && leftShoulder.score < minConfidence)) {
      return {
        score: 50,
        isCorrect: false,
        feedback: ['Face the camera', 'Show upper body clearly'],
        mistakes: ['Positioning error'],
        color: 'yellow',
      };
    }

    // Check if arms are fully extended overhead
    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    if (leftWrist && leftWrist.y > avgShoulderY - 80) {
      mistakes.push('Extend arms fully overhead');
      score -= 40;
    }

    // Check for proper overhead position (above head/ears)
    if (leftEar && leftWrist && leftWrist.y > leftEar.y) {
      mistakes.push('Press arms higher above your head');
      score -= 30;
    }

    const isCorrect = score >= 80;
    const color: 'green' | 'yellow' | 'red' = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';

    return {
      score: Math.max(0, score),
      isCorrect,
      feedback: isCorrect ? ['Perfect overhead press!', 'Full arm extension'] : mistakes,
      mistakes,
      color,
    };
  }

  private analyzeGenericPosture(pose: Pose): PostureAnalysis {
    // Generic posture analysis for exercises we don't have specific rules for
    // More generous scoring with MoveNet confidence
    const baseScore = pose.score ? Math.min(pose.score * 120, 95) : 80;
    const score = Math.max(75, baseScore); // Minimum 75 for detected pose
    const isCorrect = score >= 70;

    return {
      score,
      isCorrect,
      feedback: isCorrect 
        ? ['✓ Excellent form!', '💪 Keep it up!', 'Looking strong!'] 
        : ['Good work!', 'Keep your body visible to camera'],
      mistakes: isCorrect ? [] : ['Slight adjustment may help'],
      color: isCorrect ? 'green' : 'yellow',
    };
  }

  private calculateAngle(p1?: Keypoint, p2?: Keypoint, p3?: Keypoint): number | null {
    if (!p1 || !p2 || !p3) return null;

    const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);

    if (angle > 180.0) {
      angle = 360 - angle;
    }

    return angle;
  }

  // Personal Image Classifier (PIC) Analysis
  // Analyzes pose patterns and provides personalized insights
  analyzePersonalPosePattern(pose: Pose, exerciseName: string, historicalScores: number[]): string[] {
    const insights: string[] = [];
    
    // Calculate pose symmetry
    const symmetry = this.calculatePoseSymmetry(pose);
    if (symmetry < 0.8) {
      insights.push('💡 Your body alignment shows asymmetry - focus on balanced positioning');
    }
    
    // Analyze confidence levels
    const avgConfidence = pose.keypoints.reduce((sum, kp) => sum + (kp.score || 0), 0) / pose.keypoints.length;
    if (avgConfidence < 0.5) {
      insights.push('📸 Improve lighting and camera angle for better pose detection');
    }
    
    // Historical performance analysis
    if (historicalScores.length > 5) {
      const recentAvg = historicalScores.slice(-5).reduce((a, b) => a + b, 0) / 5;
      const overallAvg = historicalScores.reduce((a, b) => a + b, 0) / historicalScores.length;
      
      if (recentAvg > overallAvg + 5) {
        insights.push('📈 Great progress! Your form is improving consistently');
      } else if (recentAvg < overallAvg - 5) {
        insights.push('⚠️ Your performance is declining - take a break or review form basics');
      }
    }
    
    // Exercise-specific personalized tips
    const classification = this.classifyPosePattern(pose, exerciseName);
    if (classification) {
      insights.push(classification);
    }
    
    return insights;
  }
  
  private calculatePoseSymmetry(pose: Pose): number {
    const leftShoulder = this.getKeypoint(pose.keypoints, 'left_shoulder');
    const rightShoulder = this.getKeypoint(pose.keypoints, 'right_shoulder');
    const leftHip = this.getKeypoint(pose.keypoints, 'left_hip');
    const rightHip = this.getKeypoint(pose.keypoints, 'right_hip');
    
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0.5;
    
    // Check if both sides of the body are at similar heights
    const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    const hipDiff = Math.abs(leftHip.y - rightHip.y);
    
    // Lower difference means better symmetry (max score is 1.0)
    const symmetryScore = 1.0 - Math.min((shoulderDiff + hipDiff) / 100, 0.5);
    return symmetryScore;
  }
  
  private classifyPosePattern(pose: Pose, exerciseName: string): string {
    const nose = this.getKeypoint(pose.keypoints, 'nose');
    const leftWrist = this.getKeypoint(pose.keypoints, 'left_wrist');
    const rightWrist = this.getKeypoint(pose.keypoints, 'right_wrist');
    const leftShoulder = this.getKeypoint(pose.keypoints, 'left_shoulder');
    const rightShoulder = this.getKeypoint(pose.keypoints, 'right_shoulder');
    
    // Classify based on hand positions relative to body
    if (leftWrist && rightWrist && nose) {
      const avgWristY = (leftWrist.y + rightWrist.y) / 2;
      const noseY = nose.y;
      
      if (avgWristY < noseY - 50) {
        return '🎯 Arms overhead detected - excellent for overhead exercises';
      } else if (leftShoulder && rightShoulder && avgWristY < (leftShoulder.y + rightShoulder.y) / 2) {
        return '🎯 Arms raised position - good for shoulder exercises';
      }
    }
    
    return '';
  }

  dispose(): void {
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
      this.isInitialized = false;
    }
  }
}

export const poseDetectionService = new PoseDetectionService();
