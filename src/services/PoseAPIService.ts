/**
 * Pose Detection API Service
 * Communicates with the Python backend server for real-time pose detection
 */

import { Platform } from 'react-native';

// Configure the backend URL
// For development:
// - Web: localhost works directly
// - Mobile: use your computer's IP address (the server must be accessible)
const getBackendUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }
  // For mobile, use your computer's local IP
  // Replace with your actual IP address when testing on device
  // You can find it with `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
  return 'http://192.168.0.105:8000'; // Update this IP for your network
};

const BACKEND_URL = getBackendUrl();

export interface Keypoint {
  x: number;
  y: number;
  score: number;
  name: string;
}

export interface Pose {
  keypoints: Keypoint[];
  score: number;
}

export interface PostureAnalysis {
  score: number;
  isCorrect: boolean;
  feedback: string[];
  mistakes: string[];
  color: 'green' | 'yellow' | 'red';
  poseClassification?: string;
}

export interface DetectionResponse {
  success: boolean;
  poses: Pose[];
  analysis: PostureAnalysis;
  processingTime: number;
}

class PoseAPIService {
  private isServerAvailable: boolean = false;
  private lastCheckTime: number = 0;
  private checkInterval: number = 5000; // Check every 5 seconds

  /**
   * Check if the backend server is available
   */
  async checkServerHealth(): Promise<boolean> {
    const now = Date.now();
    
    // Don't check too frequently
    if (now - this.lastCheckTime < this.checkInterval && this.lastCheckTime > 0) {
      return this.isServerAvailable;
    }
    
    this.lastCheckTime = now;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      this.isServerAvailable = response.ok;
      console.log('Pose server status:', this.isServerAvailable ? 'available' : 'unavailable');
      return this.isServerAvailable;
    } catch (error) {
      console.log('Pose server not available:', error);
      this.isServerAvailable = false;
      return false;
    }
  }

  /**
   * Detect pose from base64 image
   */
  async detectPose(base64Image: string, exercise: string): Promise<DetectionResponse | null> {
    try {
      // Check server availability first
      if (!this.isServerAvailable) {
        const available = await this.checkServerHealth();
        if (!available) {
          return null;
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${BACKEND_URL}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          exercise: exercise,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Detection request failed:', response.status);
        return null;
      }

      const data: DetectionResponse = await response.json();
      console.log(`Pose detected in ${data.processingTime.toFixed(3)}s`);
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Detection request timed out');
      } else {
        console.error('Detection error:', error);
      }
      this.isServerAvailable = false;
      return null;
    }
  }

  /**
   * Get the backend URL for display
   */
  getBackendUrl(): string {
    return BACKEND_URL;
  }

  /**
   * Check if server is currently known to be available
   */
  isAvailable(): boolean {
    return this.isServerAvailable;
  }

  /**
   * Force recheck server availability
   */
  async forceCheck(): Promise<boolean> {
    this.lastCheckTime = 0;
    return this.checkServerHealth();
  }
}

export const poseAPIService = new PoseAPIService();
