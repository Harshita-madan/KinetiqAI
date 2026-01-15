// Jest globals for TypeScript (avoid requiring @types/jest installation in the dev environment)
declare const jest: any;
declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;
declare function beforeEach(fn: () => void): void;
declare function expect(val: any): any;

import streakManager from '../StreakManager';
import { storageService } from '../StorageService';

jest.mock('../StorageService', () => ({
  storageService: {
    getUserPreferences: jest.fn(),
    saveUserPreference: jest.fn(),
  }
}));

beforeEach(() => {
  jest.resetAllMocks();
});

describe('StreakManager', () => {
  test('initializes with defaults when no prefs', async () => {
    (storageService.getUserPreferences as any).mockResolvedValue({});
    await streakManager.init();
    const s = streakManager.getState();
    expect(s.streakCount).toBe(0);
    expect(s.lastWorkoutDate).toBeNull();
  });

  test('onWorkoutCompleted increments when last was yesterday', async () => {
    // set today to 2026-01-15
    jest.useFakeTimers('modern').setSystemTime(new Date('2026-01-15T12:00:00'));
    (storageService.getUserPreferences as any).mockResolvedValue({ streakCount: 3, lastWorkoutDate: '2026-01-14' });
    await streakManager.init();

    const res = await streakManager.onWorkoutCompleted();
    expect(res.didIncrement).toBe(true);
    expect(res.streak).toBe(4);

    // persisted
    expect(storageService.saveUserPreference).toHaveBeenCalledWith('streakCount', 4);
    expect(storageService.saveUserPreference).toHaveBeenCalledWith('lastWorkoutDate', '2026-01-15');
    jest.useRealTimers();
  });

  test('onWorkoutCompleted resets when last was older than yesterday', async () => {
    jest.useFakeTimers('modern').setSystemTime(new Date('2026-01-15T12:00:00'));
    (storageService.getUserPreferences as any).mockResolvedValue({ streakCount: 5, lastWorkoutDate: '2026-01-10' });
    await streakManager.init();

    const res = await streakManager.onWorkoutCompleted();
    expect(res.didIncrement).toBe(true);
    expect(res.streak).toBe(1);

    expect(storageService.saveUserPreference).toHaveBeenCalledWith('streakCount', 1);
    expect(storageService.saveUserPreference).toHaveBeenCalledWith('lastWorkoutDate', '2026-01-15');
    jest.useRealTimers();
  });

  test('onWorkoutCompleted does not increment twice same day', async () => {
    jest.useFakeTimers('modern').setSystemTime(new Date('2026-01-15T12:00:00'));
    (storageService.getUserPreferences as any).mockResolvedValue({ streakCount: 2, lastWorkoutDate: '2026-01-15' });
    await streakManager.init();

    const res = await streakManager.onWorkoutCompleted();
    expect(res.didIncrement).toBe(false);
    expect(res.streak).toBe(2);
    jest.useRealTimers();
  });
});
