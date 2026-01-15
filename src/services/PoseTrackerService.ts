/**
 * PoseTracker Integration Service
 * Handles all PoseTracker API communication and data management
 */

export interface PoseTrackerConfig {
  apiKey: string;
  baseUrl?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  enableSkeleton?: boolean;
}

export interface PoseTrackerMessage {
  type?: string;
  current_count?: number;
  ready?: boolean;
  postureDirection?: string;
  score?: number;
  confidence?: number;
  feedback?: string;
  [key: string]: any;
}

export interface ExerciseReps {
  exercise: string;
  reps: number;
  score: number;
  feedback: string;
}

class PoseTrackerService {
  private config: PoseTrackerConfig;
  private isInitialized = false;
  private messageHandler: ((message: PoseTrackerMessage) => void) | null = null;

  constructor() {
    this.config = {
      apiKey: '',
      baseUrl: 'https://app.posetracker.com/pose_tracker/tracking',
      difficulty: 'medium',
      enableSkeleton: true,
    };
  }

  /**
   * Initialize the PoseTracker service with API configuration
   */
  initialize(config: Partial<PoseTrackerConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (!this.config.apiKey) {
      throw new Error('PoseTracker API key is required');
    }

    this.isInitialized = true;
    console.log('[PoseTracker Service] Initialized with exercise tracking enabled');
  }

  /**
   * Get the PoseTracker tracking URL with all parameters
   */
  getTrackingUrl(exercise: string, width: number, height: number, isMobile: boolean): string {
    if (!this.isInitialized || !this.config.apiKey) {
      throw new Error('PoseTracker service not initialized');
    }

    const params = new URLSearchParams({
      token: this.config.apiKey,
      exercise: exercise,
      difficulty: this.config.difficulty || 'medium',
      width: width.toString(),
      height: height.toString(),
      isMobile: isMobile.toString(),
      skeleton: this.config.enableSkeleton ? 'true' : 'false',
    });

    return `${this.config.baseUrl}?${params.toString()}`;
  }

  /**
   * Build a WebView bridge JavaScript for PoseTracker communication
   */
  getJavaScriptBridge(): string {
    return `
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
  }

  /**
   * Parse and process a message from PoseTracker WebView
   */
  processMessage(message: PoseTrackerMessage): void {
    console.log('[PoseTracker Service] Processing message:', message);

    if (this.messageHandler) {
      this.messageHandler(message);
    }
  }

  /**
   * Register a handler for PoseTracker messages
   */
  onMessage(handler: (message: PoseTrackerMessage) => void): void {
    this.messageHandler = handler;
  }

  /**
   * Extract exercise data from PoseTracker message
   */
  extractExerciseData(message: PoseTrackerMessage): Partial<ExerciseReps> | null {
    const data: Partial<ExerciseReps> = {};

    if (message.current_count !== undefined) {
      data.reps = message.current_count;
    }

    if (message.score !== undefined) {
      data.score = message.score;
    }

    if (message.feedback) {
      data.feedback = message.feedback;
    }

    return Object.keys(data).length > 0 ? data : null;
  }

  /**
   * Check if positioning is ready for exercise
   */
  isPositioningReady(message: PoseTrackerMessage): boolean {
    return message.ready === true;
  }

  /**
   * Get positioning instruction from message
   */
  getPositioningInstruction(message: PoseTrackerMessage): string | null {
    if (!message.ready && message.postureDirection) {
      return `Move ${message.postureDirection}`;
    }
    return null;
  }

  /**
   * Get confidence level of current detection
   */
  getConfidenceLevel(message: PoseTrackerMessage): number {
    return message.confidence ?? 0;
  }

  /**
   * Get current API key
   */
  getApiKey(): string {
    return this.config.apiKey;
  }

  /**
   * Update difficulty level
   */
  setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.config.difficulty = difficulty;
    console.log(`[PoseTracker Service] Difficulty set to: ${difficulty}`);
  }

  /**
   * Enable/disable skeleton rendering
   */
  setSkeleton(enabled: boolean): void {
    this.config.enableSkeleton = enabled;
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset the service
   */
  reset(): void {
    this.isInitialized = false;
    this.messageHandler = null;
    this.config = {
      apiKey: '',
      baseUrl: 'https://app.posetracker.com/pose_tracker/tracking',
      difficulty: 'medium',
      enableSkeleton: true,
    };
  }
}

// Export singleton instance
export const poseTrackerService = new PoseTrackerService();
