import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { Avatar, Card } from '../components';
import { spacing, borderRadius, fontSize, useTheme } from '../theme';
import { Profile, WorkoutSession, PatientProgram } from '../types/database';

interface PatientDetailParams {
  patientId: string;
}

interface SessionWithExercise extends Omit<WorkoutSession, 'exercise'> {
  exercise?: {
    name: string;
    category: string;
  };
  average_score: number;
  started_at: string;
  calories_burned?: number;
}

export const PatientDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { patientId } = route.params as PatientDetailParams;
  const [patient, setPatient] = useState<Profile | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionWithExercise[]>([]);
  const [programs, setPrograms] = useState<PatientProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    avgScore: 0,
    weeklyAvg: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setLoading(true);

      // Load patient profile
      const { data: patientData, error: patientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      // Load recent sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          exercise:exercise_id(name, category)
        `)
        .eq('patient_id', patientId)
        .order('started_at', { ascending: false })
        .limit(10);

      if (sessionsError) throw sessionsError;
      setRecentSessions((sessionsData as SessionWithExercise[]) || []);

      // Load patient programs
      const { data: programsData, error: programsError } = await supabase
        .from('patient_programs')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (programsError) throw programsError;
      setPrograms(programsData || []);

      // Calculate stats
      const { count: totalCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId);

      const { data: allSessions } = await supabase
        .from('workout_sessions')
        .select('average_score, started_at')
        .eq('patient_id', patientId);

      const avgScore = allSessions && allSessions.length > 0
        ? allSessions.reduce((sum, s) => sum + (s.average_score || 0), 0) / allSessions.length
        : 0;

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { count: weeklyCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .gte('started_at', oneWeekAgo.toISOString());

      setStats({
        totalSessions: totalCount || 0,
        avgScore: Math.round(avgScore),
        weeklyAvg: weeklyCount || 0,
        currentStreak: 0, // TODO: Calculate streak
      });
    } catch (error) {
      console.error('Error loading patient data:', error);
      Alert.alert('Error', 'Failed to load patient details');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignProgram = () => {
    navigation.navigate('AssignProgram', { patientId });
  };

  const handleViewSession = (session: SessionWithExercise) => {
    navigation.navigate('SessionSummary', { session });
  };

  const renderStatCard = (icon: string, value: string | number, label: string, color: string) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );

  const renderSessionCard = (session: SessionWithExercise) => {
    const scoreColor =
      session.average_score >= 80
        ? '#4CAF50'
        : session.average_score >= 60
        ? '#FF9800'
        : '#F44336';

    return (
      <TouchableOpacity
        key={session.id}
        onPress={() => handleViewSession(session)}
      >
        <Card style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <View style={styles.sessionInfo}>
              <Text style={[styles.sessionExercise, { color: colors.textPrimary }]}>
                {session.exercise?.name || 'Unknown Exercise'}
              </Text>
              <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
                {new Date(session.started_at).toLocaleDateString()} •{' '}
                {Math.floor(session.duration_seconds / 60)}min
              </Text>
            </View>
            <View style={[styles.scoreCircle, { backgroundColor: `${scoreColor}20` }]}>
              <Text style={[styles.scoreText, { color: scoreColor }]}>
                {session.average_score}
              </Text>
            </View>
          </View>

          {session.completed_reps && (
            <View style={styles.sessionStats}>
              <View style={styles.sessionStatItem}>
                <Ionicons name="repeat-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.sessionStatText, { color: colors.textSecondary }]}>
                  {session.completed_reps} reps
                </Text>
              </View>
              {session.calories_burned && (
                <View style={styles.sessionStatItem}>
                  <Ionicons name="flame-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.sessionStatText, { color: colors.textSecondary }]}>
                    {session.calories_burned} cal
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderProgramCard = (program: PatientProgram) => {
    const statusColor =
      program.status === 'active'
        ? '#4CAF50'
        : program.status === 'paused'
        ? '#FF9800'
        : '#2196F3';

    return (
      <Card key={program.id} style={styles.programCard}>
        <View style={styles.programHeader}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.programStatus, { color: colors.textPrimary }]}>
            {program.status.charAt(0).toUpperCase() + program.status.slice(1)} Program
          </Text>
        </View>
        <View style={styles.programDetail}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.programText, { color: colors.textSecondary }]}>
            {new Date(program.start_date).toLocaleDateString()} -{' '}
            {program.end_date ? new Date(program.end_date).toLocaleDateString() : 'Ongoing'}
          </Text>
        </View>
        {program.frequency_per_week && (
          <View style={styles.programDetail}>
            <Ionicons name="fitness-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.programText, { color: colors.textSecondary }]}>
              {program.frequency_per_week}x per week
            </Text>
          </View>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading patient details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>Patient not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Patient Details</Text>
        <TouchableOpacity onPress={handleAssignProgram} style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient Profile */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar name={patient.full_name || 'Patient'} size="xl" />
            <View style={styles.profileInfo}>
              <Text style={[styles.patientName, { color: colors.textPrimary }]}>
                {patient.full_name || 'Unnamed Patient'}
              </Text>
              <View style={styles.profileDetail}>
                <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.profileDetailText, { color: colors.textSecondary }]}>
                  {patient.email}
                </Text>
              </View>
              {patient.phone && (
                <View style={styles.profileDetail}>
                  <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.profileDetailText, { color: colors.textSecondary }]}>
                    {patient.phone}
                  </Text>
                </View>
              )}
            </View>
          </View>
          {patient.bio && (
            <Text style={[styles.bio, { color: colors.textSecondary }]}>{patient.bio}</Text>
          )}
        </Card>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {renderStatCard('barbell-outline', stats.totalSessions, 'Total Sessions', colors.primary)}
          {renderStatCard('trophy-outline', `${stats.avgScore}%`, 'Avg Score', '#4CAF50')}
          {renderStatCard('calendar-outline', stats.weeklyAvg, 'This Week', '#FF9800')}
          {renderStatCard('flame-outline', stats.currentStreak, 'Day Streak', '#F44336')}
        </View>

        {/* Programs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Programs</Text>
            <TouchableOpacity onPress={handleAssignProgram}>
              <Text style={[styles.sectionAction, { color: colors.primary }]}>Assign New</Text>
            </TouchableOpacity>
          </View>
          {programs.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No programs assigned yet
              </Text>
            </Card>
          ) : (
            programs.map(renderProgramCard)
          )}
        </View>

        {/* Recent Sessions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Recent Sessions
          </Text>
          {recentSessions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No workout sessions yet
              </Text>
            </Card>
          ) : (
            recentSessions.map(renderSessionCard)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  profileCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  profileInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  patientName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  profileDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  profileDetailText: {
    fontSize: fontSize.sm,
  },
  bio: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: fontSize.xs,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  sectionAction: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
  },
  programCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  programStatus: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  programDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  programText: {
    fontSize: fontSize.sm,
  },
  sessionCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  sessionExercise: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  sessionDate: {
    fontSize: fontSize.sm,
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  sessionStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sessionStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sessionStatText: {
    fontSize: fontSize.sm,
  },
});
