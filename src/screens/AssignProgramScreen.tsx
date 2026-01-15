import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../stores';
import { Button, Card } from '../components';
import { spacing, borderRadius, fontSize, useTheme } from '../theme';
import type { Database } from '../types/database';  // ✅ use Database type

type Exercise = Database['public']['Tables']['exercises']['Row']; // ✅ derive Exercise type

interface AssignProgramParams {
  patientId: string;
}

interface SelectedExercise extends Exercise {
  sets: number;
  reps: number;
  duration: number;
}

export const AssignProgramScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { patientId } = route.params as AssignProgramParams;

  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [programGoal, setProgramGoal] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [frequencyPerWeek, setFrequencyPerWeek] = useState('3');
  const [estimatedWeeks, setEstimatedWeeks] = useState('4');
  const [customNotes, setCustomNotes] = useState('');

  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      setAvailableExercises((data as Exercise[]) || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
      Alert.alert('Error', 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = (exercise: Exercise) => {
    const isAlreadyAdded = selectedExercises.some(e => e.id === exercise.id);

    if (isAlreadyAdded) {
      Alert.alert('Already Added', 'This exercise is already in the program');
      return;
    }

    const newExercise: SelectedExercise = {
      ...exercise,
      sets: 3,
      reps: 10,
      duration: 5,
    };

    setSelectedExercises([...selectedExercises, newExercise]);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises(selectedExercises.filter(e => e.id !== exerciseId));
  };

  const handleUpdateExercise = (exerciseId: string, field: 'sets' | 'reps' | 'duration', value: number) => {
    setSelectedExercises(selectedExercises.map(e =>
      e.id === exerciseId ? { ...e, [field]: value } : e
    ));
  };

  const handleAssignProgram = async () => {
    if (!programName.trim()) {
      Alert.alert('Required', 'Please enter a program name');
      return;
    }

    if (selectedExercises.length === 0) {
      Alert.alert('Required', 'Please add at least one exercise');
      return;
    }

    try {
      setSaving(true);

      // Create program
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .insert({
          name: programName.trim(),
          description: programDescription.trim() || null,
          goal: programGoal.trim() || null,
          difficulty,
          estimated_weeks: parseInt(estimatedWeeks) || null,
          exercises: selectedExercises.map((ex, index) => ({
            exercise_id: ex.id,
            sets: ex.sets,
            reps: ex.reps,
            duration: ex.duration,
            order: index + 1,
            notes: null,
          })),
          is_template: false,
          created_by: user?.id,
        })
        .select()
        .single();

      if (programError) throw programError;

      // Get connection ID
      const { data: connectionData } = await supabase
        .from('connections')
        .select('id')
        .eq('patient_id', patientId)
        .eq('physiotherapist_id', user?.id)
        .eq('status', 'active')
        .single();

      // Assign program to patient
      const { error: assignError } = await supabase
        .from('patient_programs')
        .insert({
          patient_id: patientId,
          program_id: programData.id,
          assigned_by: user?.id,
          connection_id: connectionData?.id || null,
          start_date: new Date().toISOString(),
          frequency_per_week: parseInt(frequencyPerWeek),
          custom_notes: customNotes.trim() || null,
          status: 'active',
        });

      if (assignError) throw assignError;

      Alert.alert('Success', 'Program assigned successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error assigning program:', error);
      Alert.alert('Error', error.message || 'Failed to assign program');
    } finally {
      setSaving(false);
    }
  };

  const difficultyOptions = [
    { value: 'beginner', label: 'Beginner', color: '#4CAF50' },
    { value: 'intermediate', label: 'Intermediate', color: '#FF9800' },
    { value: 'advanced', label: 'Advanced', color: '#F44336' },
  ];

  const renderExerciseCard = (exercise: Exercise) => {
    const isSelected = selectedExercises.some(e => e.id === exercise.id);

    return (
      <TouchableOpacity
        key={exercise.id}
        onPress={() => !isSelected && handleAddExercise(exercise)}
        disabled={isSelected}
      >
        <Card style={[styles.exerciseCard, isSelected ? styles.exerciseCardSelected : null]}>
          <View style={styles.exerciseHeader}>
            <View style={styles.exerciseInfo}>
              <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>
                {exercise.name}
              </Text>
              <View style={styles.exerciseMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.categoryText, { color: colors.primary }]}>
                    {exercise.category}
                  </Text>
                </View>
                <Text style={[styles.difficultyText, { color: colors.textSecondary }]}>
                  {exercise.difficulty}
                </Text>
              </View>
            </View>
            {isSelected ? (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            ) : (
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            )}
          </View>
          {exercise.description && (
            <Text style={[styles.exerciseDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {exercise.description}
            </Text>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderSelectedExercise = (exercise: SelectedExercise, index: number) => (
    <Card key={exercise.id} style={styles.selectedExerciseCard}>
      <View style={styles.selectedHeader}>
        <Text style={[styles.selectedName, { color: colors.textPrimary }]}>
          {index + 1}. {exercise.name}
        </Text>
        <TouchableOpacity onPress={() => handleRemoveExercise(exercise.id)}>
          <Ionicons name="close-circle" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.selectedControls}>
        <View style={styles.controlGroup}>
          <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Sets</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity
              style={[styles.counterButton, { borderColor: colors.border }]}
              onPress={() => handleUpdateExercise(exercise.id, 'sets', Math.max(1, exercise.sets - 1))}
            >
              <Ionicons name="remove" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.counterValue, { color: colors.textPrimary }]}>{exercise.sets}</Text>
            <TouchableOpacity
              style={[styles.counterButton, { borderColor: colors.border }]}
              onPress={() => handleUpdateExercise(exercise.id, 'sets', exercise.sets + 1)}
            >
              <Ionicons name="add" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Reps</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity
              style={[styles.counterButton, { borderColor: colors.border }]}
              onPress={() => handleUpdateExercise(exercise.id, 'reps', Math.max(1, exercise.reps - 1))}
            >
              <Ionicons name="remove" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.counterValue, { color: colors.textPrimary }]}>{exercise.reps}</Text>
            <TouchableOpacity
              style={[styles.counterButton, { borderColor: colors.border }]}
              onPress={() => handleUpdateExercise(exercise.id, 'reps', exercise.reps + 1)}
            >
              <Ionicons name="add" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Min</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity
              style={[styles.counterButton, { borderColor: colors.border }]}
              onPress={() => handleUpdateExercise(exercise.id, 'duration', Math.max(1, exercise.duration - 1))}
            >
              <Ionicons name="remove" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.counterValue, { color: colors.textPrimary }]}>{exercise.duration}</Text>
            <TouchableOpacity
              style={[styles.counterButton, { borderColor: colors.border }]}
              onPress={() => handleUpdateExercise(exercise.id, 'duration', exercise.duration + 1)}
            >
              <Ionicons name="add" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading exercises...
          </Text>
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
        <Text style={[styles.title, { color: colors.textPrimary }]}>Assign Program</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Program Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Program Details</Text>

          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
            placeholder="Program Name *"
            placeholderTextColor={colors.gray400}
            value={programName}
            onChangeText={setProgramName}
          />

          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.textPrimary }]}
            placeholder="Description"
            placeholderTextColor={colors.gray400}
            value={programDescription}
            onChangeText={setProgramDescription}
            multiline
            numberOfLines={3}
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
            placeholder="Goal (e.g., Improve mobility, Build strength)"
            placeholderTextColor={colors.gray400}
            value={programGoal}
            onChangeText={setProgramGoal}
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Frequency/Week</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
                placeholder="3"
                placeholderTextColor={colors.gray400}
                value={frequencyPerWeek}
                onChangeText={setFrequencyPerWeek}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Est. Weeks</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
                placeholder="4"
                placeholderTextColor={colors.gray400}
                value={estimatedWeeks}
                onChangeText={setEstimatedWeeks}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Difficulty Level</Text>
          <View style={styles.difficultyRow}>
            {difficultyOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.difficultyButton,
                  { borderColor: difficulty === option.value ? option.color : colors.border },
                  difficulty === option.value && { backgroundColor: `${option.color}20` },
                ]}
                onPress={() => setDifficulty(option.value as any)}
              >
                <Text
                  style={[
                    styles.difficultyLabel,
                    { color: difficulty === option.value ? option.color : colors.textSecondary },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.textPrimary }]}
            placeholder="Custom notes for patient (optional)"
            placeholderTextColor={colors.gray400}
            value={customNotes}
            onChangeText={setCustomNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Selected Exercises */}
        {selectedExercises.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Selected Exercises ({selectedExercises.length})
            </Text>
            {selectedExercises.map((exercise, index) => renderSelectedExercise(exercise, index))}
          </View>
        )}

        {/* Available Exercises */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Available Exercises
          </Text>
          {availableExercises.map(renderExerciseCard)}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={saving ? 'Assigning Program...' : 'Assign Program'}
          onPress={handleAssignProgram}
          loading={saving}
          disabled={saving || selectedExercises.length === 0}
        />
      </View>
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
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  input: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: fontSize.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  difficultyButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  difficultyLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  exerciseCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  exerciseCardSelected: {
    opacity: 0.5,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exerciseInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  exerciseName: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  exerciseMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  difficultyText: {
    fontSize: fontSize.xs,
    textTransform: 'capitalize',
  },
  exerciseDescription: {
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  selectedExerciseCard: {
    padding: spacing.md,
    gap: spacing.md,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    flex: 1,
  },
  selectedControls: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  controlGroup: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  controlLabel: {
    fontSize: fontSize.xs,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  counterButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
