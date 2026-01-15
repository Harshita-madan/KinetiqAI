import { storageService } from './StorageService';

export type StreakState = {
  streakCount: number;
  lastWorkoutDate: string | null; // local date YYYY-MM-DD
};

export type StreakEvent = (state: StreakState, didIncrement: boolean) => void;

function localISODate(date = new Date()): string {
  // Local calendar date in YYYY-MM-DD (not UTC)
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

class StreakManager {
  private state: StreakState = { streakCount: 0, lastWorkoutDate: null };
  private listeners = new Set<StreakEvent>();

  async init() {
    try {
      const prefs = await storageService.getUserPreferences();
      const streakCount = typeof prefs.streakCount === 'number' ? prefs.streakCount : 0;
      const lastWorkoutDate = typeof prefs.lastWorkoutDate === 'string' ? prefs.lastWorkoutDate : null;
      this.state = { streakCount, lastWorkoutDate };
    } catch (e) {
      // ignore - keep defaults
    }
  }

  getState() {
    return { ...this.state };
  }

  addListener(cb: StreakEvent) {
    this.listeners.add(cb);
    // immediate call
    cb(this.getState(), false);
    return () => this.listeners.delete(cb);
  }

  private emit(didIncrement: boolean) {
    for (const cb of Array.from(this.listeners)) {
      try { cb(this.getState(), didIncrement); } catch(e) { /* ignore listener errors */ }
    }
  }

  async onWorkoutCompleted(): Promise<{ streak: number; didIncrement: boolean }> {
    const today = localISODate(new Date());
    const last = this.state.lastWorkoutDate; // may be null

    if (last === today) {
      // Already counted today
      return { streak: this.state.streakCount, didIncrement: false };
    }

    // See if last was yesterday
    const lastDate = last ? new Date(last + 'T00:00:00') : null;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = localISODate(yesterday);

    let didIncrement = true;
    if (last === yesterdayStr) {
      // continuous streak
      this.state.streakCount = (this.state.streakCount || 0) + 1;
    } else {
      // missed one or more days, reset to 0 then count today as day 1
      this.state.streakCount = 1;
    }

    this.state.lastWorkoutDate = today;

    // persist (non-blocking)
    try {
      await storageService.saveUserPreference('streakCount', this.state.streakCount);
      await storageService.saveUserPreference('lastWorkoutDate', this.state.lastWorkoutDate);
    } catch (e) {
      // ignore
    }

    this.emit(didIncrement);

    return { streak: this.state.streakCount, didIncrement };
  }
}

const streakManager = new StreakManager();
export default streakManager;
