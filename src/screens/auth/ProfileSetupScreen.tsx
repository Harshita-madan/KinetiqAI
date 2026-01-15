import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores';
import { TextInput, Button, Avatar } from '../../components';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { UserRole } from '../../types/database';

interface RouteParams {
  role: UserRole;
}

export const ProfileSetupScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { role } = route.params as RouteParams;
  const { updateProfile, profile, loading } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');

  const isPhysiotherapist = role === 'physiotherapist';

  const handleContinue = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name');
      return;
    }

    try {
      const updates: any = {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
      };

      if (isPhysiotherapist) {
        // Always set specialization array (empty if not provided)
        updates.specialization = specialization.trim()
          ? specialization.split(',').map(s => s.trim()).filter(Boolean)
          : [];
        
        if (hourlyRate) {
          const rate = parseFloat(hourlyRate);
          if (!isNaN(rate) && rate > 0) {
            updates.hourly_rate = rate;
          }
        }
      }

      const { error } = await updateProfile(updates);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      // Navigate to main app
      navigation.replace('MainTabs');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    }
  };

  const handleSkip = async () => {
    // For skip, set a default name if empty to satisfy navigation check
    if (!fullName.trim()) {
      const defaultName = isPhysiotherapist ? 'Physiotherapist' : 'Patient';
      try {
        await updateProfile({ full_name: defaultName });
      } catch (error) {
        console.error('Error setting default name:', error);
      }
    }
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              {isPhysiotherapist
                ? 'Help patients find and trust you'
                : 'Let your physiotherapist know about you'}
            </Text>
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <Avatar name={fullName || 'User'} size="xl" />
            <TouchableOpacity style={styles.changePhotoButton}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label="Full Name *"
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Doe"
              autoCapitalize="words"
              leftIcon={<Ionicons name="person-outline" size={20} color={colors.gray400} />}
            />

            <TextInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 234 567 8900"
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={20} color={colors.gray400} />}
            />

            <TextInput
              label="Bio"
              value={bio}
              onChangeText={setBio}
              placeholder={
                isPhysiotherapist
                  ? 'Share your experience and approach...'
                  : 'Tell us about your fitness goals...'
              }
              multiline
              numberOfLines={4}
              style={styles.bioInput}
              leftIcon={
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={colors.gray400}
                />
              }
            />

            {isPhysiotherapist && (
              <>
                <TextInput
                  label="Specialization"
                  value={specialization}
                  onChangeText={setSpecialization}
                  placeholder="e.g., Sports, Orthopedic, Pediatric"
                  leftIcon={<Ionicons name="medal-outline" size={20} color={colors.gray400} />}
                  helperText="Separate multiple specializations with commas"
                />

                <TextInput
                  label="Hourly Rate (USD)"
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  placeholder="50"
                  keyboardType="decimal-pad"
                  leftIcon={<Ionicons name="cash-outline" size={20} color={colors.gray400} />}
                  helperText="Optional - for marketplace visibility"
                />
              </>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Button
              title="Complete Setup"
              onPress={handleContinue}
              loading={loading}
              disabled={loading}
            />

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              You can always update your profile later from the settings
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
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
    lineHeight: 22,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    position: 'relative',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: '50%',
    marginRight: -60,
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttons: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  skipButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: fontSize.md,
    color: colors.gray400,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
