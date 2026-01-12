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
import { colors, spacing, borderRadius, fontSize } from '../theme';
import { SessionData } from '../services/StorageService';

interface MistakeItemProps {
  mistake: string;
  index: number;
}

const MistakeItem: React.FC<MistakeItemProps> = ({ mistake, index }) => (
  <View style={styles.mistakeItem}>
    <View style={styles.mistakeNumber}>
      <Text style={styles.mistakeNumberText}>{index + 1}</Text>
    </View>
    <Text style={styles.mistakeText}>{mistake}</Text>
  </View>
);

interface FeedbackItemProps {
  feedback: string;
  index: number;
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({ feedback, index }) => (
  <View style={styles.feedbackItem}>
    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
    <Text style={styles.feedbackText}>{feedback}</Text>
  </View>
);

export const SessionSummaryScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { session } = route.params as { session: SessionData };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return colors.success;
    if (score >= 60) return '#E8C956';
    return '#E8569D';
  };

  const getScoreGrade = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Work';
  };

  const generateAIExplanation = (): string => {
    const score = session.averageScore;
    const mistakes = session.mistakes;

    if (score >= 85 && mistakes.length === 0) {
      return "Outstanding performance! Your form was nearly perfect throughout the session. You've demonstrated excellent body awareness and control. Keep up this great work!";
    } else if (score >= 70) {
      return `Good effort! You maintained solid form for most of the session. ${
        mistakes.length > 0
          ? `Focus on improving: ${mistakes[0].toLowerCase()}. This will help you achieve even better results.`
          : 'Minor adjustments will take you to the next level.'
      }`;
    } else if (score >= 50) {
      return `You're making progress, but there's room for improvement. The main areas to work on are proper alignment and engaging the right muscle groups. ${
        mistakes.length > 0
          ? `Pay special attention to: ${mistakes[0].toLowerCase()}.`
          : ''
      } Practice makes perfect!`;
    } else {
      return `This exercise is challenging, and you're just getting started! Don't be discouraged by the low score. Focus on mastering the basics: proper positioning, controlled movements, and breathing. Consider starting with easier variations and gradually building up your strength and technique.`;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Summary</Text>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Ionicons name="list" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Card */}
        <LinearGradient
          colors={[getScoreColor(session.averageScore) + '30', getScoreColor(session.averageScore) + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scoreCard}
        >
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreValue, { color: getScoreColor(session.averageScore) }]}>
              {session.averageScore}
            </Text>
            <Text style={styles.scoreOutOf}>/100</Text>
          </View>
          <View style={styles.scoreDetails}>
            <Text style={styles.scoreGrade}>{getScoreGrade(session.averageScore)}</Text>
            <Text style={styles.exerciseName}>{session.exerciseName}</Text>
            <View style={styles.sessionMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={colors.gray400} />
                <Text style={styles.metaText}>{formatDuration(session.duration)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={16} color={colors.gray400} />
                <Text style={styles.metaText}>
                  {new Date(session.date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* AI Explanation */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>AI Coach Insights</Text>
          </View>
          <View style={styles.aiBox}>
            <Text style={styles.aiText}>{generateAIExplanation()}</Text>
          </View>
        </View>

        {/* Mistakes (if any) */}
        {session.mistakes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle-outline" size={24} color="#E8C956" />
              <Text style={styles.sectionTitle}>Areas to Improve</Text>
            </View>
            <View style={styles.mistakesList}>
              {session.mistakes.map((mistake, index) => (
                <MistakeItem key={index} mistake={mistake} index={index} />
              ))}
            </View>
          </View>
        )}

        {/* Positive Feedback */}
        {session.feedback.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy-outline" size={24} color={colors.success} />
              <Text style={styles.sectionTitle}>What You Did Well</Text>
            </View>
            <View style={styles.feedbackList}>
              {session.feedback
                .filter((f) => !f.toLowerCase().includes('focus') && !f.toLowerCase().includes('mistake'))
                .map((feedback, index) => (
                  <FeedbackItem key={index} feedback={feedback} index={index} />
                ))}
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={28} color={colors.primary} />
            <Text style={styles.statValue}>{session.averageScore}%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={28} color="#E8569D" />
            <Text style={styles.statValue}>{formatDuration(session.duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="fitness" size={28} color={colors.success} />
            <Text style={styles.statValue}>{session.mistakes.length}</Text>
            <Text style={styles.statLabel}>Corrections</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('ExerciseSelection')}
          >
            <Ionicons name="refresh" size={20} color={colors.white} />
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('ChatbotCoach', { session })}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Ask AI Coach</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  scoreCard: {
    flexDirection: 'row',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  scoreOutOf: {
    fontSize: fontSize.sm,
    color: colors.gray400,
  },
  scoreDetails: {
    flex: 1,
  },
  scoreGrade: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  exerciseName: {
    fontSize: fontSize.lg,
    color: colors.gray400,
    marginBottom: spacing.md,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.gray400,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  aiBox: {
    backgroundColor: colors.cardBg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  aiText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  mistakesList: {
    gap: spacing.sm,
  },
  mistakeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.md,
  },
  mistakeNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8C956' + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mistakeNumberText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: '#E8C956',
  },
  mistakeText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  feedbackList: {
    gap: spacing.sm,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.md,
  },
  feedbackText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardBg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.gray400,
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  primaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cardBg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  secondaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
});
