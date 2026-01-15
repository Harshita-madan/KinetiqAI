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
import { useAuthStore } from '../stores';
import { Card } from '../components';
import { spacing, borderRadius, fontSize, useTheme } from '../theme';
import { PatientProgram } from '../types/database';

interface ProgramWithDetails extends Omit<PatientProgram, 'program' | 'assigned_by_profile'> {
  program?: {
    name: string;
    description: string | null;
    goal: string | null;
    difficulty: string | null;
    estimated_weeks: number | null;
  };
  assigned_by_profile?: {
    full_name: string | null;
  };
}

export const MyProgramScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const [programs, setPrograms] = useState<ProgramWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('patient_programs')
        .select(`
          *,
          exercise:exercise_id(name, description, category, difficulty, duration_minutes),
          physiotherapist:physiotherapist_id(full_name)
        `)
        .eq('patient_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPrograms((data as ProgramWithDetails[]) || []);
    } catch (error) {
      console.error('Error loading programs:', error);
      Alert.alert('Error', 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'paused': return '#FF9800';
      case 'completed': return '#2196F3';
      default: return colors.gray400;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return colors.gray400;
    }
  };

  const handleViewProgram = (program: ProgramWithDetails) => {
    // Navigate to program details (to be implemented)
    Alert.alert('Program Details', `View details for ${program.program?.name}`);
  };

  const renderProgramCard = (program: ProgramWithDetails) => {
    const statusColor = getStatusColor(program.status);
    const difficultyColor = program.program?.difficulty 
      ? getDifficultyColor(program.program.difficulty) 
      : colors.gray400;

    const startDate = new Date(program.start_date).toLocaleDateString();
    const endDate = program.end_date 
      ? new Date(program.end_date).toLocaleDateString() 
      : 'Ongoing';

    return (
      <Card key={program.id} style={styles.programCard}>
        <View style={styles.programHeader}>
          <View style={styles.programTitleContainer}>
            <Text style={[styles.programName, { color: colors.textPrimary }]}>
              {program.program?.name || 'Unnamed Program'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
              </Text>
            </View>
          </View>

          {program.program?.difficulty && (
            <View style={[styles.difficultyBadge, { backgroundColor: `${difficultyColor}20` }]}>
              <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                {program.program.difficulty}
              </Text>
            </View>
          )}
        </View>

        {program.program?.description && (
          <Text style={[styles.programDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {program.program.description}
          </Text>
        )}

        <View style={styles.programDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Assigned by: {program.assigned_by_profile?.full_name || 'Unknown'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {startDate} - {endDate}
            </Text>
          </View>

          {program.frequency_per_week && (
            <View style={styles.detailRow}>
              <Ionicons name="fitness-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {program.frequency_per_week}x per week
              </Text>
            </View>
          )}

          {program.program?.goal && (
            <View style={styles.detailRow}>
              <Ionicons name="trophy-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                Goal: {program.program.goal}
              </Text>
            </View>
          )}
        </View>

        {program.custom_notes && (
          <View style={[styles.notesContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="document-text-outline" size={16} color={colors.primary} />
            <Text style={[styles.notesText, { color: colors.primary }]} numberOfLines={2}>
              {program.custom_notes}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.viewButton, { backgroundColor: colors.primary }]}
          onPress={() => handleViewProgram(program)}
        >
          <Text style={styles.viewButtonText}>View Program</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.white} />
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Programs</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your programs...
          </Text>
        </View>
      ) : programs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="fitness-outline" size={64} color={colors.gray400} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No Programs Yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Your physiotherapist will assign exercise programs for you
          </Text>
          <TouchableOpacity
            style={[styles.findButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('FindPhysio')}
          >
            <Ionicons name="search-outline" size={20} color={colors.white} />
            <Text style={styles.findButtonText}>Find a Physiotherapist</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {programs.filter(p => p.status === 'active').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statNumber, { color: '#FF9800' }]}>
                {programs.filter(p => p.status === 'paused').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Paused</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                {programs.filter(p => p.status === 'completed').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            All Programs
          </Text>
          {programs.map(renderProgramCard)}
        </ScrollView>
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  findButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  findButtonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  programCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  programHeader: {
    gap: spacing.sm,
  },
  programTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  difficultyText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  programDescription: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  programDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.sm,
  },
  notesContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  notesText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
