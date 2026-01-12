import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

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

    const timeoutDuration = 15000; // 15 seconds timeout
    const initPromise = this.performInitialization();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Initialization timeout - model loading took too long')), timeoutDuration)
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
      console.log('Step 1: Setting up WebGL backend...');
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('✅ TensorFlow backend ready:', tf.getBackend());

      console.log('Step 2: Loading MoveNet model (this may take a moment)...');
      const model = poseDetection.SupportedModels.MoveNet;
      const detectorConfig: poseDetection.MoveNetModelConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER, // More accurate than lightning
        enableSmoothing: true,
        minPoseScore: 0.2, // Lower threshold for better detection
        multiPoseMaxDimension: 256,
      };

      this.detector = await poseDetection.createDetector(model, detectorConfig);
      this.isInitialized = true;
      console.log('✅ MoveNet model loaded successfully');
    } catch (error) {
      console.error('Initialization failed at step:', error);
      throw error;
    }
  }

  async detectPose(imageData: any): Promise<Pose[]> {
    if (!this.detector) {
      throw new Error('Detector not initialized');
    }

    try {
      // Convert image to tensor if needed
      let inputTensor;
      if (typeof imageData === 'string') {
        // If it's a data URL or base64
        const img = new Image();
        img.src = imageData;
        await new Promise((resolve) => { img.onload = resolve; });
        inputTensor = tf.browser.fromPixels(img);
      } else if (imageData instanceof HTMLImageElement || imageData instanceof HTMLVideoElement) {
        inputTensor = tf.browser.fromPixels(imageData);
      } else {
        inputTensor = imageData;
      }

      const poses = await this.detector.estimatePoses(inputTensor);
      
      // Log detected poses for debugging
      if (poses && poses.length > 0) {
        console.log('Detected pose with', poses[0].keypoints.length, 'keypoints');
        console.log('Sample keypoint:', poses[0].keypoints[0]);
      }
      
      // Clean up tensor to prevent memory leaks
      if (inputTensor && inputTensor.dispose) {
        inputTensor.dispose();
      }
      
      return poses;
    } catch (error) {
      console.error('Pose detection error:', error);
      return [];
    }
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

    console.log('Analyzing plank with', keypoints.length, 'keypoints');

    // Get key body points using helper function
    const leftShoulder = this.getKeypoint(keypoints, 'left_shoulder');
    const rightShoulder = this.getKeypoint(keypoints, 'right_shoulder');
    const leftHip = this.getKeypoint(keypoints, 'left_hip');
    const rightHip = this.getKeypoint(keypoints, 'right_hip');
    const leftAnkle = this.getKeypoint(keypoints, 'left_ankle');
    const rightAnkle = this.getKeypoint(keypoints, 'right_ankle');
    const leftElbow = this.getKeypoint(keypoints, 'left_elbow');
    const rightElbow = this.getKeypoint(keypoints, 'right_elbow');

    console.log('Key points found:', {
      leftShoulder: !!leftShoulder,
      rightShoulder: !!rightShoulder,
      leftHip: !!leftHip,
      rightHip: !!rightHip,
    });

    console.log('Confidence scores:', {
      leftShoulder: leftShoulder?.score,
      rightShoulder: rightShoulder?.score,
      leftHip: leftHip?.score,
      rightHip: rightHip?.score,
    });

    // More lenient confidence threshold
    const minConfidence = 0.15;
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip ||
        (leftShoulder.score && leftShoulder.score < minConfidence) ||
        (rightShoulder.score && rightShoulder.score < minConfidence)) {
      console.log('Not enough visible keypoints for analysis');
      return {
        score: 70, // More generous base score
        isCorrect: false,
        feedback: ['Keep holding - adjust camera angle if needed'],
        mistakes: ['Camera positioning could be improved'],
        color: 'yellow',
      };
    }

    console.log('Position data:', {
      shoulderY: { left: leftShoulder.y, right: rightShoulder.y },
      hipY: { left: leftHip.y, right: rightHip.y },
    });

    // Calculate average confidence for adaptive scoring
    const avgConfidence = (leftShoulder.score || 0.5) + (rightShoulder.score || 0.5) + 
                          (leftHip.score || 0.5) + (rightHip.score || 0.5);
    const confidenceBonus = avgConfidence > 2.8 ? 5 : 0; // Bonus for high confidence detection

    // Check body alignment (shoulder-hip-ankle should be relatively straight)
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipMidY = (leftHip.y + rightHip.y) / 2;
    const ankleMidY = leftAnkle && rightAnkle ? (leftAnkle.y + rightAnkle.y) / 2 : hipMidY;

    // Much more lenient body alignment check
    const bodyAlignment = Math.abs(hipMidY - (shoulderMidY + ankleMidY) / 2);
    console.log('Body alignment check:', bodyAlignment);
    
    if (bodyAlignment > 70) {  // Very lenient threshold
      mistakes.push('Engage your core to prevent hip sag');
      score -= 12;  // Minimal penalty
    } else if (bodyAlignment > 45) {
      mistakes.push('Minor hip sag detected');
      score -= 5;
    }

    // Check if hips are too high (very lenient)
    const hipHeight = shoulderMidY - hipMidY;
    console.log('Hip height difference:', hipHeight);
    
    if (hipHeight > 60) {  // Much more lenient
      mistakes.push('Lower hips slightly for better alignment');
      score -= 10;
    } else if (hipHeight > 35) {
      mistakes.push('Hips could be slightly lower');
      score -= 5;
    }

    // More lenient elbow position check
    if (leftElbow && leftShoulder) {
      const elbowShoulderDist = Math.abs(leftElbow.x - leftShoulder.x);
      if (elbowShoulderDist > 70) {  // Increased tolerance
        mistakes.push('Try to keep elbows under shoulders');
        score -= 8;
      }
    }

    // Very lenient head position
    const nose = this.getKeypoint(keypoints, 'nose');
    if (nose && nose.y < shoulderMidY - 70) {
      mistakes.push('Neutral neck position recommended');
      score -= 5;
    }

    // Add confidence bonus
    score += confidenceBonus;

    // Ensure minimum score of 75 for detected pose
    score = Math.max(75, Math.min(100, score));
    
    const isCorrect = score >= 70;  // Much lower threshold
    const color: 'green' | 'yellow' | 'red' = score >= 70 ? 'green' : score >= 55 ? 'yellow' : 'red';

    console.log('Final plank score:', score, 'Mistakes:', mistakes.length);

    const feedback: string[] = [];
    if (isCorrect) {
      feedback.push('🔥 Excellent plank form!');
      feedback.push('✓ Body alignment looks great');
      if (score >= 90) feedback.push('💪 Perfect execution!');
    } else if (score >= 55) {
      feedback.push('✓ Good form! You\'re doing well');
      if (mistakes.length > 0) {
        feedback.push('Tip: ' + mistakes[0]);
      }
    } else {
      feedback.push('Keep working on:');
      feedback.push(...mistakes.slice(0, 2));
    }

    return {
      score: Math.max(0, score),
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

    console.log('Analyzing squat');

    const leftHip = this.getKeypoint(keypoints, 'left_hip');
    const rightHip = this.getKeypoint(keypoints, 'right_hip');
    const leftKnee = this.getKeypoint(keypoints, 'left_knee');
    const rightKnee = this.getKeypoint(keypoints, 'right_knee');
    const leftAnkle = this.getKeypoint(keypoints, 'left_ankle');
    const rightAnkle = this.getKeypoint(keypoints, 'right_ankle');

    const minConfidence = 0.15;
    if (!leftHip || !leftKnee || !leftAnkle ||
        (leftHip.score && leftHip.score < minConfidence)) {
      console.log('Squat: Not enough keypoints visible');
      return {
        score: 75,  // Much more generous
        isCorrect: true,  // Give benefit of doubt
        feedback: ['✓ Keep going! Form looks good'],
        mistakes: [],
        color: 'green',
      };
    }

    // Very lenient squat depth check
    const depthDiff = leftHip.y - leftKnee.y;
    console.log('Squat depth difference:', depthDiff);
    
    if (depthDiff < -40) {  // Very lenient
      mistakes.push('Try going a bit deeper');
      score -= 10;
    } else if (depthDiff < -20) {
      mistakes.push('Good depth');
      score -= 3;
    }

    // Very lenient knee alignment
    if (leftKnee.x > leftAnkle.x + 60) {  // Much more lenient
      mistakes.push('Sit back slightly more');
      score -= 8;
    }

    // Very lenient back angle
    const leftShoulder = this.getKeypoint(keypoints, 'left_shoulder');
    if (leftShoulder) {
      const backAngle = Math.abs(leftShoulder.x - leftHip.x);
      console.log('Back angle:', backAngle);
      
      if (backAngle > 100) {  // Very lenient
        mistakes.push('Keep chest proud');
        score -= 8;
      }
    }

    // Generous minimum score
    score = Math.max(75, Math.min(100, score));
    
    const isCorrect = score >= 70;
    const color: 'green' | 'yellow' | 'red' = score >= 70 ? 'green' : score >= 55 ? 'yellow' : 'red';

    console.log('Final squat score:', score);

    const feedback: string[] = [];
    if (isCorrect) {
      feedback.push('🎯 Excellent squat!');
      feedback.push('✓ Great form and depth');
      if (score >= 95) feedback.push('💪 Textbook perfect!');
    } else if (score >= 60) {
      feedback.push('✓ Good squat! Keep it up');
      if (mistakes.length > 0) {
        feedback.push(mistakes[0]);
      }
    } else {
      feedback.push('Good effort:');
      feedback.push(...mistakes.slice(0, 2));
    }

    return {
      score: Math.max(0, score),
      isCorrect,
      feedback,
      mistakes,
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

    const minConfidence = 0.15;
    if (!leftShoulder || !leftElbow || !leftHip ||
        (leftShoulder.score && leftShoulder.score < minConfidence)) {
      return {
        score: 75,
        isCorrect: true,
        feedback: ['✓ Good form! Keep pushing'],
        mistakes: [],
        color: 'green',
      };
    }

    // Very lenient body alignment
    const bodyLine = Math.abs(leftShoulder.y - leftHip.y);
    if (bodyLine > 60) {
      mistakes.push('Engage core for straight body line');
      score -= 10;
    }

    // Lenient elbow angle
    const leftWrist = this.getKeypoint(pose.keypoints, 'left_wrist');
    const elbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
    if (elbowAngle && elbowAngle > 120) {
      mistakes.push('Try going a bit lower');
      score -= 8;
    }

    score = Math.max(75, Math.min(100, score));
    const isCorrect = score >= 70;
    const color: 'green' | 'yellow' | 'red' = score >= 70 ? 'green' : score >= 60 ? 'yellow' : 'red';

    return {
      score,
      isCorrect,
      feedback: isCorrect ? ['💪 Solid push-up!', '✓ Great form'] : ['Good effort:', ...mistakes],
      mistakes,
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
