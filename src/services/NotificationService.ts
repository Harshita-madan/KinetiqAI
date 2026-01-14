import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const NOTIFICATION_SETTINGS_KEY = '@kinetiqai_notifications';
const LAST_APP_OPEN_KEY = '@kinetiqai_last_open';
const APP_START_TIME_KEY = '@kinetiqai_app_start';

// Configure notification handler - LOCAL notifications work in Expo Go
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Gentle, non-medical reminder messages
const POSTURE_REMINDERS = {
  morning: [
    "Good morning! 🌅 A quick stretch can help you feel more energized.",
    "Rise and shine! ☀️ Take a moment to roll your shoulders back.",
    "Starting fresh today? A gentle stretch goes a long way! 🌸",
  ],
  afternoon: [
    "Hey there! 👋 Been sitting for a while? How about a quick stretch break?",
    "Time for a mini break from studying, working or cooking! 🧘 Do some exercise, adjust posture and relax.",
    "Halfway through the day! A little movement can boost your energy. ✨",
  ],
  evening: [
    "Evening wind-down time! 🌙 A gentle stretch can help you relax.",
    "Great job today! 🌟 Take a moment to release any tension.",
    "Winding down? A few stretches can help you feel more relaxed. 🍃",
  ],
};

const USAGE_REMINDERS = [
  "You've been focused for a while! 💪 Consider taking a quick stretch break.",
  "Great dedication! 🎯 A brief pause to stretch can help you stay comfortable.",
  "Time flies when you're working hard! ⏰ How about a mini movement break?",
];

const COMEBACK_MESSAGES = [
  "We miss you! 🌟 Your wellness journey is waiting whenever you're ready.",
  "Hey! 👋 Just a friendly reminder that your fitness goals are still here for you.",
  "It's been a while! 🌈 Small steps lead to big progress. Come say hi!",
  "Your body loves movement! 💚 Even a quick session can make a difference.",
];

export class NotificationService {
  private static usageCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Check if notifications are supported
   */
  static isSupported(): boolean {
    return Device.isDevice;
  }

  /**
   * Request notification permissions (LOCAL notifications only - no push tokens)
   */
  static async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Notifications require a physical device');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Configure Android channel for local notifications
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'KinetiqAI Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366F1',
        });
      }

      return true;
    } catch (error) {
      console.log('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  static async areNotificationsEnabled(): Promise<boolean> {
    try {
      const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      return settings !== 'disabled';
    } catch {
      return true;
    }
  }

  /**
   * Enable/disable notifications
   */
  static async setNotificationsEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, enabled ? 'enabled' : 'disabled');
      
      if (enabled) {
        const hasPermission = await this.requestPermissions();
        if (hasPermission) {
          await this.scheduleTimeBasedReminders();
          await this.scheduleInactivityReminder();
          this.startUsageTracking();
        }
      } else {
        await this.cancelAllNotifications();
        this.stopUsageTracking();
      }
    } catch (error) {
      console.log('Error setting notification preference:', error);
    }
  }

  /**
   * Schedule a local notification
   */
  static async scheduleNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    try {
      const isEnabled = await this.areNotificationsEnabled();
      if (!isEnabled) return null;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger,
      });
      return id;
    } catch (error) {
      console.log('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Get a random message from an array
   */
  private static getRandomMessage(messages: string[]): string {
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get time of day category
   */
  private static getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * Schedule time-based posture reminders
   */
  static async scheduleTimeBasedReminders(): Promise<void> {
    try {
      // Cancel existing time-based reminders first
      await this.cancelNotificationsByIdentifier('time-reminder');

      const isEnabled = await this.areNotificationsEnabled();
      if (!isEnabled) return;

      // Schedule morning reminder (9 AM)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Good Morning! 🌅',
          body: this.getRandomMessage(POSTURE_REMINDERS.morning),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 9,
          minute: 0,
        },
        identifier: 'time-reminder-morning',
      });

      // Schedule afternoon reminder (2 PM)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Afternoon Check-in! ☀️',
          body: this.getRandomMessage(POSTURE_REMINDERS.afternoon),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 14,
          minute: 0,
        },
        identifier: 'time-reminder-afternoon',
      });

      // Schedule evening reminder (7 PM)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Evening Wellness 🌙',
          body: this.getRandomMessage(POSTURE_REMINDERS.evening),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 19,
          minute: 0,
        },
        identifier: 'time-reminder-evening',
      });

      console.log('Time-based reminders scheduled');
    } catch (error) {
      console.log('Error scheduling time-based reminders:', error);
    }
  }

  /**
   * Schedule 24-hour inactivity reminder
   */
  static async scheduleInactivityReminder(): Promise<void> {
    try {
      // Cancel existing inactivity reminder
      await this.cancelNotificationsByIdentifier('inactivity');

      const isEnabled = await this.areNotificationsEnabled();
      if (!isEnabled) return;

      // Schedule notification for 24 hours from now
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'We Miss You! 💚',
          body: this.getRandomMessage(COMEBACK_MESSAGES),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 24 * 60 * 60, // 24 hours
        },
        identifier: 'inactivity-reminder',
      });

      console.log('Inactivity reminder scheduled for 24 hours');
    } catch (error) {
      console.log('Error scheduling inactivity reminder:', error);
    }
  }

  /**
   * Record app open and reschedule inactivity reminder
   */
  static async recordAppOpen(): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_APP_OPEN_KEY, Date.now().toString());
      await AsyncStorage.setItem(APP_START_TIME_KEY, Date.now().toString());
      
      // Reschedule the 24-hour inactivity reminder
      await this.scheduleInactivityReminder();
    } catch (error) {
      console.log('Error recording app open:', error);
    }
  }

  /**
   * Start tracking app usage for 30-minute reminder
   */
  static startUsageTracking(): void {
    // Clear any existing interval
    this.stopUsageTracking();

    // Check every 5 minutes if user has been using app for 30 minutes
    this.usageCheckInterval = setInterval(async () => {
      try {
        const isEnabled = await this.areNotificationsEnabled();
        if (!isEnabled) return;

        const startTime = await AsyncStorage.getItem(APP_START_TIME_KEY);
        if (startTime) {
          const elapsed = Date.now() - parseInt(startTime, 10);
          const thirtyMinutes = 30 * 60 * 1000;

          if (elapsed >= thirtyMinutes) {
            // Send posture reminder
            await this.sendUsageReminder();
            // Reset the start time
            await AsyncStorage.setItem(APP_START_TIME_KEY, Date.now().toString());
          }
        }
      } catch (error) {
        console.log('Error checking usage:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Stop usage tracking
   */
  static stopUsageTracking(): void {
    if (this.usageCheckInterval) {
      clearInterval(this.usageCheckInterval);
      this.usageCheckInterval = null;
    }
  }

  /**
   * Send a usage-based reminder notification
   */
  private static async sendUsageReminder(): Promise<void> {
    const timeOfDay = this.getTimeOfDay();
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Quick Stretch Break! 🧘',
        body: this.getRandomMessage(USAGE_REMINDERS),
        sound: true,
      },
      trigger: null, // Send immediately
    });
  }

  /**
   * Cancel notifications by identifier prefix
   */
  private static async cancelNotificationsByIdentifier(prefix: string): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of scheduled) {
        if (notification.identifier.startsWith(prefix)) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.log('Error canceling notifications:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.log('Error canceling notifications:', error);
    }
  }

  /**
   * Initialize notification service (call on app start)
   */
  static async initialize(): Promise<void> {
    try {
      const isEnabled = await this.areNotificationsEnabled();
      
      if (isEnabled) {
        const hasPermission = await this.requestPermissions();
        if (hasPermission) {
          await this.recordAppOpen();
          await this.scheduleTimeBasedReminders();
          this.startUsageTracking();
          console.log('Notification service initialized successfully');
        }
      }
    } catch (error) {
      console.log('Error initializing notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications (for debugging)
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.log('Error getting scheduled notifications:', error);
      return [];
    }
  }
}

export default NotificationService;
