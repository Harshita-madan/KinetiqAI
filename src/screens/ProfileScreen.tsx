import React, { useState } from 'react';
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
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme';
import { Avatar, Button } from '../components';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showArrow = true,
}) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress && !rightElement}
  >
    <View style={styles.settingIconContainer}>
      <Ionicons name={icon} size={22} color={colors.primary} />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
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
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [haptics, setHaptics] = useState(true);
  const [voiceAssist, setVoiceAssist] = useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => {} },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatarContainer}>
            <Avatar name="User" size="xl" />
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color={colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>User</Text>
          <Text style={styles.profileEmail}>user@example.com</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>48</Text>
              <Text style={styles.statLabel}>Queries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3h</Text>
              <Text style={styles.statLabel}>Time Saved</Text>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <SettingSection title="Account">
          <SettingItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => {}}
          />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy & Security"
            subtitle="Manage your data and permissions"
            onPress={() => {}}
          />
          <SettingItem
            icon="card-outline"
            title="Subscription"
            subtitle="Free Plan"
            onPress={() => {}}
          />
        </SettingSection>

        {/* Preferences */}
        <SettingSection title="Preferences">
          <SettingItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Receive push notifications"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.gray300, true: colors.primaryLight }}
                thumbColor={notifications ? colors.primary : colors.gray100}
              />
            }
            showArrow={false}
          />
          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Use dark theme"
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.gray300, true: colors.primaryLight }}
                thumbColor={darkMode ? colors.primary : colors.gray100}
              />
            }
            showArrow={false}
          />
          <SettingItem
            icon="phone-portrait-outline"
            title="Haptic Feedback"
            subtitle="Vibration on interactions"
            rightElement={
              <Switch
                value={haptics}
                onValueChange={setHaptics}
                trackColor={{ false: colors.gray300, true: colors.primaryLight }}
                thumbColor={haptics ? colors.primary : colors.gray100}
              />
            }
            showArrow={false}
          />
        </SettingSection>

        {/* Accessibility */}
        <SettingSection title="Accessibility">
          <SettingItem
            icon="mic-outline"
            title="Voice Assistant"
            subtitle="Enable voice commands"
            rightElement={
              <Switch
                value={voiceAssist}
                onValueChange={setVoiceAssist}
                trackColor={{ false: colors.gray300, true: colors.primaryLight }}
                thumbColor={voiceAssist ? colors.primary : colors.gray100}
              />
            }
            showArrow={false}
          />
          <SettingItem
            icon="text-outline"
            title="Text Size"
            subtitle="Adjust font size"
            onPress={() => {}}
          />
          <SettingItem
            icon="contrast-outline"
            title="High Contrast"
            subtitle="Increase color contrast"
            onPress={() => {}}
          />
        </SettingSection>

        {/* Support */}
        <SettingSection title="Support">
          <SettingItem
            icon="help-circle-outline"
            title="Help Center"
            subtitle="FAQs and tutorials"
            onPress={() => {}}
          />
          <SettingItem
            icon="chatbox-outline"
            title="Contact Us"
            subtitle="Get in touch with support"
            onPress={() => {}}
          />
          <SettingItem
            icon="document-text-outline"
            title="Terms of Service"
            onPress={() => {}}
          />
          <SettingItem
            icon="lock-closed-outline"
            title="Privacy Policy"
            onPress={() => {}}
          />
        </SettingSection>

        {/* App Info */}
        <SettingSection title="About">
          <SettingItem
            icon="information-circle-outline"
            title="App Version"
            subtitle="1.0.0 (Build 1)"
            showArrow={false}
          />
          <SettingItem
            icon="star-outline"
            title="Rate App"
            subtitle="Leave a review"
            onPress={() => {}}
          />
        </SettingSection>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            icon={<Ionicons name="log-out-outline" size={20} color={colors.error} />}
            textStyle={{ color: colors.error }}
            style={{ borderColor: colors.error }}
          />
        </View>

        <Text style={styles.footer}>
          Made with ❤️ for BrainWave DTU Hackathon
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  profileName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '10',
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
    color: colors.textPrimary,
  },
  settingSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  logoutContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
  footer: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
});
