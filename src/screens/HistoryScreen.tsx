import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize } from '../theme';
import { storageService, SessionData } from '../services/StorageService';

interface SessionCardProps {
  session: SessionData;
  onPress: () => void;
  onDelete: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onPress, onDelete }) => {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return colors.success;
    if (score >= 60) return '#E8C956';
    return '#E8569D';
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <TouchableOpacity style={styles.sessionCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[getScoreColor(session.averageScore) + '20', getScoreColor(session.averageScore) + '05']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.exerciseName}>{session.exerciseName}</Text>
            <Text style={styles.dateText}>{formatDate(session.date)}</Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(session.averageScore) + '30' }]}>
            <Text style={[styles.scoreText, { color: getScoreColor(session.averageScore) }]}>
              {session.averageScore}
            </Text>
          </View>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color={colors.gray400} />
            <Text style={styles.statText}>{formatDuration(session.duration)}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.gray400} />
            <Text style={styles.statText}>{session.mistakes.length} corrections</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#E8569D" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const HistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageScore: 0,
    bestScore: 0,
    totalDuration: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const [sessionsData, statsData] = await Promise.all([
        storageService.getAllSessions(),
        storageService.getSessionStats(),
      ]);
      setSessions(sessionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handleSessionPress = (session: SessionData) => {
    navigation.navigate('SessionSummary', { session });
  };

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await storageService.deleteSession(sessionId);
            loadHistory();
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to delete all sessions? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearAllSessions();
            loadHistory();
          },
        },
      ]
    );
  };

  const formatTotalDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Safe navigation back handler
  const handleSafeGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleSafeGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout History</Text>
        {sessions.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={22} color="#E8569D" />
          </TouchableOpacity>
        )}
        {sessions.length === 0 && <View style={{ width: 40 }} />}
      </View>

      {/* Stats Overview */}
      {stats.totalSessions > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="fitness" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="trending-up" size={24} color={colors.success} />
            <Text style={styles.statValue}>{Math.round(stats.averageScore)}</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="trophy" size={24} color="#E8C956" />
            <Text style={styles.statValue}>{stats.bestScore}</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="time" size={24} color="#E8569D" />
            <Text style={styles.statValue}>{formatTotalDuration(stats.totalDuration)}</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={64} color={colors.gray400} />
            <Text style={styles.emptyTitle}>No Sessions Yet</Text>
            <Text style={styles.emptyText}>
              Complete your first workout to see your progress here
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => navigation.navigate('ExerciseSelection')}
            >
              <Text style={styles.startButtonText}>Start a Workout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onPress={() => handleSessionPress(session)}
                onDelete={() => handleDeleteSession(session.id)}
              />
            ))}
          </>
        )}
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
  backButton: {
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
  statsContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.cardBg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.gray400,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sessionCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: colors.cardBg,
  },
  cardGradient: {
    padding: spacing.lg,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  exerciseName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.gray400,
  },
  scoreBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  cardStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: fontSize.sm,
    color: colors.gray400,
  },
  deleteButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.gray400,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  startButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  startButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.white,
  },
});
