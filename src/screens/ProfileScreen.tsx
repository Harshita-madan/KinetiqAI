import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import { spacing, borderRadius, fontSize, fontWeight, useTheme, ThemeColors } from '../theme';
import { Avatar, Button } from '../components';
import { NotificationService } from '../services';
import { useAuthStore } from '../stores';

const PROFILE_STORAGE_KEY = '@kinetiqai_profile';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
  colors: ThemeColors;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showArrow = true,
  colors,
}) => (
  <TouchableOpacity
    style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress && !rightElement}
  >
    <View style={[styles.settingIconContainer, { backgroundColor: colors.primary + '15' }]}>
      <Ionicons name={icon} size={22} color={colors.primary} />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
    </View>
    {rightElement ? (
      rightElement
    ) : showArrow && onPress ? (
      <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
    ) : null}
  </TouchableOpacity>
);

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
  colors: ThemeColors;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, children, colors }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
    <View style={[styles.sectionContent, { backgroundColor: colors.cardBg }]}>{children}</View>
  </View>
);

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDarkMode, setDarkMode } = useTheme();
  const { user, profile: authProfile, signOut } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: authProfile?.full_name || 'User',
    email: authProfile?.email || user?.email || 'user@example.com',
    phone: authProfile?.phone || '',
    bio: authProfile?.bio || '',
  });

  // Load profile data and notification settings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadNotificationSettings();
    }, [])
  );

  const loadNotificationSettings = async () => {
    try {
      const isEnabled = await NotificationService.areNotificationsEnabled();
      setNotifications(isEnabled);
    } catch (error) {
      console.log('Error loading notification settings:', error);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    setNotifications(enabled);
    await NotificationService.setNotificationsEnabled(enabled);
    
    if (enabled) {
      // Request permissions and schedule notifications
      const hasPermission = await NotificationService.requestPermissions();
      if (hasPermission) {
        Alert.alert(
          'Notifications Enabled ✓',
          'You will receive gentle posture reminders and wellness tips throughout the day.',
          [{ text: 'Great!' }]
        );
      } else {
        Alert.alert(
          'Permission Needed',
          'Please allow notifications in your device settings to receive reminders.',
          [{ text: 'OK' }]
        );
        setNotifications(false);
      }
    }
  };

  const handleTestNotification = async () => {
    try {
      const hasPermission = await NotificationService.requestPermissions();
      console.log('Permission granted:', hasPermission);
      
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Schedule notification with proper trigger format for SDK 53+
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Posture Check! 🧘',
          body: 'Just a gentle reminder to check your posture and take a stretch break!',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      });
      
      console.log('Notification scheduled with ID:', notificationId);
      
      Alert.alert(
        'Test Notification Scheduled',
        'A notification will appear in 2 seconds! Minimize the app to see it.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.log('Error scheduling notification:', error);
      Alert.alert('Error', `Failed to schedule notification: ${error}`);
    }
  };

  const loadProfile = async () => {
    try {
      // Use auth profile data if available
      if (authProfile) {
        setProfile({
          name: authProfile.full_name || 'User',
          email: authProfile.email,
          phone: authProfile.phone || '',
          bio: authProfile.bio || '',
        });
      } else {
        // Fallback to AsyncStorage for backward compatibility
        const savedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        }
      }
      const savedImage = await AsyncStorage.getItem('@kinetiqai_profile_image');
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.log('Error loading profile:', error);
    }
  };

  const handleChangePhoto = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to change your profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show action sheet for photo options
      Alert.alert(
        'Change Profile Picture',
        'Choose an option',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraStatus.status !== 'granted') {
                Alert.alert('Permission Required', 'Camera access is needed to take photos.');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                setProfileImage(imageUri);
                await AsyncStorage.setItem('@kinetiqai_profile_image', imageUri);
              }
            },
          },
          {
            text: 'Choose from Library',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                setProfileImage(imageUri);
                await AsyncStorage.setItem('@kinetiqai_profile_image', imageUri);
              }
            },
          },
          profileImage ? {
            text: 'Remove Photo',
            style: 'destructive',
            onPress: async () => {
              setProfileImage(null);
              await AsyncStorage.removeItem('@kinetiqai_profile_image');
            },
          } : null,
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ].filter(Boolean) as any
      );
    } catch (error) {
      console.log('Error changing photo:', error);
      Alert.alert('Error', 'Failed to change profile picture. Please try again.');
    }
  };

  const handleHelpCenter = () => {
    Alert.alert(
      'Frequently Asked Questions',
      '\n❓ How do I start a workout?\nGo to Explore, select an exercise, and tap "Start Workout".\n\n❓ How accurate is pose detection?\nOur AI provides real-time feedback with high accuracy using your camera.\n\n❓ Can I track my progress?\nYes! Check the History section to view your workout logs and statistics.\n\n❓ What exercises are available?\nWe offer squats, push-ups, planks, and more. New exercises added regularly!\n\n❓ Do I need equipment?\nNo equipment needed! Just your device camera and some space.',
      [{ text: 'Got it!' }]
    );
  };

  const handleContactUs = () => {
    Alert.alert(
      'Contact Us',
      '\n📧 Email: support@kinetiqai.com\n\n💬 We typically respond within 24 hours\n\nFeel free to reach out for:\n• Technical support\n• Feature requests\n• Feedback and suggestions\n• General inquiries\n\nWe\'re here to help you on your fitness journey!',
      [{ text: 'Close' }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleChangePhoto}
          >
            <Avatar 
              name={profile.name || 'User'} 
              size="xl" 
              source={profileImage || undefined}
            />
            <View style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
              <Ionicons name="camera" size={14} color={colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.profileName, { color: colors.textPrimary }]}>{profile.name || 'User'}</Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{profile.email || 'user@example.com'}</Text>
          {profile.bio ? (
            <Text style={[styles.profileBio, { color: colors.textSecondary }]}>{profile.bio}</Text>
          ) : null}
        </View>

        {/* Account Settings */}
        <SettingSection title="Account" colors={colors}>
          <SettingItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => navigation.navigate('EditProfile')}
            colors={colors}
          />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy & Security"
            onPress={() => Alert.alert(
              'Privacy & Security',
              'Your data is protected with industry-standard encryption. We do not share your personal information with third parties. All workout data is stored securely on your device. You can delete your data at any time from the app settings.',
              [{ text: 'OK' }]
            )}
            colors={colors}
          />
          <SettingItem
            icon="log-out-outline"
            title="Sign Out"
            subtitle="Logout from your account"
            onPress={() => Alert.alert(
              'Sign Out',
              'Are you sure you want to sign out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Sign Out', 
                  style: 'destructive',
                  onPress: async () => {
                    await signOut();
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'SignIn' as never }],
                    });
                  }
                }
              ]
            )}
            colors={colors}
          />
          <SettingItem
            icon="card-outline"
            title="Subscription"
            subtitle="Free Plan"
            showArrow={false}
            colors={colors}
          />
        </SettingSection>

        {/* Preferences */}
        <SettingSection title="Preferences" colors={colors}>
          <SettingItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Posture reminders & wellness tips"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.gray300, true: colors.primaryLight }}
                thumbColor={notifications ? colors.primary : colors.gray100}
              />
            }
            showArrow={false}
            colors={colors}
          />
          <SettingItem
            icon="paper-plane-outline"
            title="Test Notification"
            subtitle="Send a test notification in 3 seconds"
            onPress={handleTestNotification}
            colors={colors}
          />
          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Use dark theme"
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.gray300, true: colors.primaryLight }}
                thumbColor={isDarkMode ? colors.primary : colors.gray100}
              />
            }
            showArrow={false}
            colors={colors}
          />
        </SettingSection>

        {/* Support */}
        <SettingSection title="Support" colors={colors}>
          <SettingItem
            icon="help-circle-outline"
            title="Help Center"
            subtitle="FAQs"
            onPress={handleHelpCenter}
            colors={colors}
          />
          <SettingItem
            icon="chatbox-outline"
            title="Contact Us"
            subtitle="Get in touch with support"
            onPress={handleContactUs}
            colors={colors}
          />
        </SettingSection>

        {/* App Info */}
        <SettingSection title="About" colors={colors}>
          <SettingItem
            icon="information-circle-outline"
            title="App Version"
            subtitle="1.0.0 (Build 1)"
            showArrow={false}
            colors={colors}
          />
        </SettingSection>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  profileName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  profileBio: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionContent: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  settingSubtitle: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  logoutContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
});
