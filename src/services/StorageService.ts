import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SessionData {
  id: string;
  exerciseName: string;
  date: string;
  duration: number; // in seconds
  averageScore: number;
  mistakes: string[];
  feedback: string[];
  timestamp: number;
}

export class StorageService {
  private readonly SESSIONS_KEY = '@kinetiq_sessions';
  private readonly USER_PREFS_KEY = '@kinetiq_prefs';

  async saveSession(session: SessionData): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      sessions.unshift(session); // Add to beginning

      // Keep only last 50 sessions
      const limitedSessions = sessions.slice(0, 50);

      await AsyncStorage.setItem(this.SESSIONS_KEY, JSON.stringify(limitedSessions));
      console.log('Session saved successfully');
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  }

  async getAllSessions(): Promise<SessionData[]> {
    try {
      const data = await AsyncStorage.getItem(this.SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve sessions:', error);
      return [];
    }
  }

  async getSessionById(id: string): Promise<SessionData | null> {
    try {
      const sessions = await this.getAllSessions();
      return sessions.find(s => s.id === id) || null;
    } catch (error) {
      console.error('Failed to retrieve session:', error);
      return null;
    }
  }

  async deleteSession(id: string): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const filtered = sessions.filter(s => s.id !== id);
      await AsyncStorage.setItem(this.SESSIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }

  async clearAllSessions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SESSIONS_KEY);
    } catch (error) {
      console.error('Failed to clear sessions:', error);
      throw error;
    }
  }

  async getSessionStats(): Promise<{
    totalSessions: number;
    averageScore: number;
    bestScore: number;
    totalDuration: number;
  }> {
    const sessions = await this.getAllSessions();

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageScore: 0,
        bestScore: 0,
        totalDuration: 0,
      };
    }

    const totalScore = sessions.reduce((sum, s) => sum + s.averageScore, 0);
    const bestScore = Math.max(...sessions.map(s => s.averageScore));
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);

    return {
      totalSessions: sessions.length,
      averageScore: totalScore / sessions.length,
      bestScore,
      totalDuration,
    };
  }

  // User preferences
  async saveUserPreference(key: string, value: any): Promise<void> {
    try {
      const prefs = await this.getUserPreferences();
      prefs[key] = value;
      await AsyncStorage.setItem(this.USER_PREFS_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Failed to save user preference:', error);
    }
  }

  async getUserPreferences(): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(this.USER_PREFS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to retrieve user preferences:', error);
      return {};
    }
  }
}

export const storageService = new StorageService();
