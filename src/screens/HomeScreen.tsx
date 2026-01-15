import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, borderRadius, fontSize, fontWeight, useTheme, ThemeColors } from '../theme';
import StreakBadge from '../components/StreakBadge';
import { Card, Avatar, Button } from '../components';

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  color: string;
  onPress: () => void;
  colors: ThemeColors;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, title, color, onPress, colors }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>{title}</Text>
  </TouchableOpacity>
);

interface FeatureCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
  colors: ThemeColors;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color, onPress, colors }) => (
  <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.featureIconContainer, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <View style={styles.featureContent}>
      <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>{description}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
  </TouchableOpacity>
);

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const userName = 'User';

  // Streak state
  const [streakCount, setStreakCount] = React.useState<number>(0);

  React.useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const StreakManager = await import('../services/StreakManager');
      await StreakManager.default.init();
      const s = StreakManager.default.getState();
      setStreakCount(s.streakCount || 0);
      unsub = StreakManager.default.addListener((state: any) => {
        setStreakCount(state.streakCount || 0);
      });
    })();

    return () => { if (unsub) unsub(); };
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Hello,</Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{userName} 👋</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Streak badge */}
            {/* We lazy-load the component to avoid impacting startup */}
            <View style={{ marginRight: 8 }}><StreakBadge count={streakCount} /></View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Avatar name={userName} size="md" showBadge badgeColor={colors.success} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Card */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>AI Posture Coach</Text>
            <Text style={styles.heroSubtitle}>
              Perfect your form with real-time AI feedback and skeleton tracking
            </Text>
            <Button
              title="Start Training"
              onPress={() => navigation.navigate('ExerciseSelection')}
              variant="secondary"
              size="md"
              icon={<Ionicons name="fitness" size={18} color={colors.white} />}
              style={styles.heroButton}
            />
          </View>
          <View style={styles.heroIconContainer}>
            <Ionicons name="body" size={80} color="rgba(255,255,255,0.3)" />
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              icon="fitness"
              title="Workout"
              color={colors.primary}
              onPress={() => navigation.navigate('ExerciseSelection')}
              colors={colors}
            />
            <QuickAction
              icon="chatbubble-ellipses"
              title="AI Coach"
              color={colors.secondary}
              onPress={() => navigation.navigate('ChatbotCoach')}
              colors={colors}
            />
            <QuickAction
              icon="time"
              title="History"
              color={colors.accent}
              onPress={() => navigation.navigate('History')}
              colors={colors}
            />
            <QuickAction
              icon="analytics"
              title="Stats"
              color={colors.info}
              onPress={() => navigation.navigate('History')}
              colors={colors}
            />
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Features</Text>
          <View style={styles.featuresContainer}>
            <FeatureCard
              icon="camera"
              title="Live Posture Check"
              description="Real-time AI posture correction with skeleton overlay"
              color={colors.primary}
              onPress={() => navigation.navigate('ExerciseSelection')}
              colors={colors}
            />
            <FeatureCard
              icon="chatbubbles"
              title="AI Coaching"
              description="Get personalized fitness advice anytime"
              color={colors.secondary}
              onPress={() => navigation.navigate('ChatbotCoach')}
              colors={colors}
            />
            <FeatureCard
              icon="bar-chart"
              title="Session History"
              description="Track progress and view past workout sessions"
              color={colors.accent}
              onPress={() => navigation.navigate('History')}
              colors={colors}
            />
            <FeatureCard
              icon="shield-checkmark"
              title="Privacy First"
              description="No video storage - your data stays on device"
              color={colors.info}
              onPress={() => {}}
              colors={colors}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Get Started</Text>
          <Card variant="outlined">
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color={colors.primary} />
              <Text style={[styles.emptyStateText, { color: colors.textPrimary }]}>Ready to improve your form?</Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                Start your first workout with AI-powered posture correction
              </Text>
              <TouchableOpacity 
                style={[styles.startWorkoutButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('ExerciseSelection')}
              >
                <Text style={styles.startWorkoutButtonText}>Start Workout</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: fontSize.md,
  },
  userName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  heroContent: {
    flex: 1,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.md,
  },
  heroButton: {
    alignSelf: 'flex-start',
  },
  heroIconContainer: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.5,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  featuresContainer: {
    gap: spacing.sm,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: fontSize.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  startWorkoutButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  startWorkoutButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
  },
});
