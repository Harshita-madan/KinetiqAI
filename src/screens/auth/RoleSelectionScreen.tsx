import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores';
import { Button } from '../../components';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { UserRole } from '../../types/database';

interface RouteParams {
  email: string;
  password: string;
}

export const RoleSelectionScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { email, password } = route.params as RouteParams;
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  const { signUp, loading } = useAuthStore();

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert('Selection Required', 'Please select your role to continue');
      return;
    }

    try {
      const { error } = await signUp(email, password, selectedRole);
      
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      // Navigate to profile setup
      navigation.replace('ProfileSetup', { role: selectedRole });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>
            Select the option that best describes you
          </Text>
        </View>

        {/* Role Cards */}
        <View style={styles.rolesContainer}>
          {/* Patient Role */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'patient' && styles.roleCardSelected,
            ]}
            onPress={() => setSelectedRole('patient')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                selectedRole === 'patient'
                  ? [colors.primary + '40', colors.primary + '20']
                  : [colors.cardBg, colors.cardBg]
              }
              style={styles.roleCardGradient}
            >
              {selectedRole === 'patient' && (
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
                </View>
              )}

              <View style={[styles.roleIcon, { backgroundColor: '#E8569D20' }]}>
                <Ionicons name="person" size={48} color="#E8569D" />
              </View>

              <Text style={styles.roleTitle}>Patient</Text>
              <Text style={styles.roleDescription}>
                I want to improve my form and track my progress with professional guidance
              </Text>

              <View style={styles.features}>
                <FeatureItem text="Real-time form correction" />
                <FeatureItem text="Connect with physiotherapists" />
                <FeatureItem text="Track your progress" />
                <FeatureItem text="Personalized exercise programs" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Physiotherapist Role */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'physiotherapist' && styles.roleCardSelected,
            ]}
            onPress={() => setSelectedRole('physiotherapist')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                selectedRole === 'physiotherapist'
                  ? [colors.primary + '40', colors.primary + '20']
                  : [colors.cardBg, colors.cardBg]
              }
              style={styles.roleCardGradient}
            >
              {selectedRole === 'physiotherapist' && (
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
                </View>
              )}

              <View style={[styles.roleIcon, { backgroundColor: '#7556E820' }]}>
                <Ionicons name="medical" size={48} color="#7556E8" />
              </View>

              <Text style={styles.roleTitle}>Physiotherapist</Text>
              <Text style={styles.roleDescription}>
                I want to monitor patients remotely and provide professional guidance
              </Text>

              <View style={styles.features}>
                <FeatureItem text="Monitor patient progress" />
                <FeatureItem text="Assign exercise programs" />
                <FeatureItem text="Review session recordings" />
                <FeatureItem text="Provide real-time feedback" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <Button
          title="Continue"
          onPress={handleContinue}
          loading={loading}
          disabled={!selectedRole || loading}
          style={styles.continueButton}
        />

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const FeatureItem: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.featureItem}>
    <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xxl,
    marginTop: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.gray400,
  },
  rolesContainer: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  roleCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardSelected: {
    borderColor: colors.primary,
  },
  roleCardGradient: {
    padding: spacing.xl,
    position: 'relative',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  roleIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  roleTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  roleDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  features: {
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  continueButton: {
    marginTop: spacing.lg,
  },
  backButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: fontSize.md,
    color: colors.gray400,
    fontWeight: '600',
  },
});
