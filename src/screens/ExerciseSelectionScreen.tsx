import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize } from '../theme';

interface Exercise {
  id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  icon: keyof typeof Ionicons.glyphMap;
  duration: number; // suggested duration in seconds
  color: string;
}

const exercises: Exercise[] = [
  {
    id: '1',
    name: 'Plank',
    description: 'Core stability exercise - hold a straight body position',
    difficulty: 'Beginner',
    icon: 'fitness',
    duration: 30,
    color: '#7556E8',
  },
  {
    id: '2',
    name: 'Squat',
    description: 'Lower body strength - perfect your squat form',
    difficulty: 'Beginner',
    icon: 'person',
    duration: 60,
    color: '#E8569D',
  },
  {
    id: '3',
    name: 'Push-Up',
    description: 'Upper body and core strength exercise',
    difficulty: 'Intermediate',
    icon: 'arrow-up',
    duration: 45,
    color: '#56E8A0',
  },
  {
    id: '4',
    name: 'Lunge',
    description: 'Single-leg strength and balance training',
    difficulty: 'Intermediate',
    icon: 'walk',
    duration: 60,
    color: '#E8C956',
  },
  {
    id: '5',
    name: 'Forearm Plank',
    description: 'Advanced core stability on forearms',
    difficulty: 'Intermediate',
    icon: 'remove',
    duration: 45,
    color: '#5694E8',
  },
  {
    id: '6',
    name: 'Bodyweight Squat',
    description: 'Perfect your squat depth and form',
    difficulty: 'Beginner',
    icon: 'trending-down',
    duration: 60,
    color: '#E88456',
  },
  {
    id: '7',
    name: 'Shoulder Raise',
    description: 'Lateral shoulder raises for deltoid strength',
    difficulty: 'Beginner',
    icon: 'hand-right',
    duration: 45,
    color: '#E856C9',
  },
  {
    id: '8',
    name: 'Front Arm Raise',
    description: 'Raise arms forward to shoulder height',
    difficulty: 'Beginner',
    icon: 'arrow-up-circle',
    duration: 40,
    color: '#56E8D4',
  },
  {
    id: '9',
    name: 'Overhead Press',
    description: 'Press arms overhead for shoulder strength',
    difficulty: 'Intermediate',
    icon: 'arrow-up-outline',
    duration: 50,
    color: '#C956E8',
  },
  {
    id: '10',
    name: 'Lateral Raise',
    description: 'Lift arms out to the sides for shoulder definition',
    difficulty: 'Beginner',
    icon: 'expand',
    duration: 45,
    color: '#56A0E8',
  },
];

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onPress }) => {
  const getDifficultyColor = () => {
    switch (exercise.difficulty) {
      case 'Beginner':
        return '#56E8A0';
      case 'Intermediate':
        return '#E8C956';
      case 'Advanced':
        return '#E8569D';
      default:
        return colors.primary;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[exercise.color + '20', exercise.color + '05']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={[styles.iconContainer, { backgroundColor: exercise.color + '30' }]}>
          <Ionicons name={exercise.icon} size={32} color={exercise.color} />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseDescription}>{exercise.description}</Text>

          <View style={styles.cardFooter}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor() + '20' }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor() }]}>
                {exercise.difficulty}
              </Text>
            </View>

            <View style={styles.durationContainer}>
              <Ionicons name="time-outline" size={16} color={colors.gray400} />
              <Text style={styles.durationText}>{exercise.duration}s</Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const ExerciseSelectionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const handleExerciseSelect = (exercise: Exercise) => {
    navigation.navigate('LiveWorkout', {
      exercise: exercise.name,
      duration: exercise.duration,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Exercise</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Select Your Exercise</Text>
          <Text style={styles.introText}>
            Choose an exercise to practice with real-time AI posture correction
          </Text>
        </View>

        <View style={styles.exerciseList}>
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onPress={() => handleExerciseSelect(exercise)}
            />
          ))}
        </View>

        <TouchableOpacity 
          style={styles.customExerciseButton}
          onPress={() => {
            // Navigate to a generic workout mode
            navigation.navigate('LiveWorkout', {
              exercise: 'Custom Exercise',
              duration: 60,
            });
          }}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          <Text style={styles.customExerciseText}>Try Generic Posture Mode</Text>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  introSection: {
    marginBottom: spacing.xl,
  },
  introTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  introText: {
    fontSize: fontSize.md,
    color: colors.gray400,
    lineHeight: 22,
  },
  exerciseList: {
    gap: spacing.md,
  },
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.cardBg,
    marginBottom: spacing.sm,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: spacing.xs,
  },
  exerciseName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  exerciseDescription: {
    fontSize: fontSize.sm,
    color: colors.gray400,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  difficultyText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: fontSize.sm,
    color: colors.gray400,
    fontWeight: '500',
  },
  customExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
    marginTop: spacing.lg,
  },
  customExerciseText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
});
