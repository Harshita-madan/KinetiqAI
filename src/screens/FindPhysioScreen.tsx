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
import { Avatar, Card } from '../components';
import { spacing, borderRadius, fontSize, fontWeight, useTheme } from '../theme';
import { Profile } from '../types/database';

interface PhysioWithConnection extends Profile {
  isConnected?: boolean;
  connectionStatus?: 'pending' | 'active' | 'inactive';
}

export const FindPhysioScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, profile } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [physiotherapists, setPhysiotherapists] = useState<PhysioWithConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  useEffect(() => {
    loadPhysiotherapists();
  }, []);

  const loadPhysiotherapists = async () => {
    try {
      setLoading(true);

      // Get all physiotherapists
      const { data: physios, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'physiotherapist')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user's existing connections
      const { data: connections } = await supabase
        .from('connections')
        .select('physiotherapist_id, status')
        .eq('patient_id', user?.id);

      // Merge connection status with physio data
      const physiosWithStatus = (physios || []).map(physio => {
        const connection = connections?.find(c => c.physiotherapist_id === physio.id);
        return {
          ...physio,
          isConnected: !!connection,
          connectionStatus: connection?.status,
        };
      });

      setPhysiotherapists(physiosWithStatus);
    } catch (error) {
      console.error('Error loading physiotherapists:', error);
      Alert.alert('Error', 'Failed to load physiotherapists');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (physioId: string) => {
    if (!user) return;

    Alert.alert(
      'Send Connection Request',
      'Would you like to connect with this physiotherapist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          onPress: async () => {
            try {
              setSendingRequest(physioId);

              const { error } = await supabase
                .from('connections')
                .insert({
                  patient_id: user.id,
                  physiotherapist_id: physioId,
                  status: 'pending',
                });

              if (error) throw error;

              Alert.alert('Success', 'Connection request sent!');
              loadPhysiotherapists(); // Reload to update status
            } catch (error: any) {
              console.error('Error sending request:', error);
              Alert.alert('Error', error.message || 'Failed to send request');
            } finally {
              setSendingRequest(null);
            }
          },
        },
      ]
    );
  };

  const filteredPhysios = physiotherapists.filter(physio => {
    const query = searchQuery.toLowerCase();
    return (
      physio.full_name?.toLowerCase().includes(query) ||
      physio.bio?.toLowerCase().includes(query) ||
      physio.specialization?.some(s => s.toLowerCase().includes(query))
    );
  });

  const renderPhysioCard = (physio: PhysioWithConnection) => {
    const isRequesting = sendingRequest === physio.id;
    const canSendRequest = !physio.isConnected && !isRequesting;

    return (
      <Card key={physio.id} style={styles.physioCard}>
        <View style={styles.physioHeader}>
          <Avatar name={physio.full_name || 'Physio'} size="lg" />
          <View style={styles.physioInfo}>
            <Text style={[styles.physioName, { color: colors.textPrimary }]}>
              {physio.full_name || 'Unnamed Physiotherapist'}
            </Text>
            {physio.specialization && physio.specialization.length > 0 && (
              <View style={styles.specializationTags}>
                {physio.specialization.slice(0, 2).map((spec, idx) => (
                  <View key={idx} style={[styles.tag, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.tagText, { color: colors.primary }]}>{spec}</Text>
                  </View>
                ))}
                {physio.specialization.length > 2 && (
                  <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                    +{physio.specialization.length - 2} more
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {physio.bio && (
          <Text style={[styles.physioBio, { color: colors.textSecondary }]} numberOfLines={3}>
            {physio.bio}
          </Text>
        )}

        <View style={styles.physioFooter}>
          {physio.hourly_rate && (
            <View style={styles.rateContainer}>
              <Ionicons name="cash-outline" size={16} color={colors.primary} />
              <Text style={[styles.rateText, { color: colors.textPrimary }]}>
                ${physio.hourly_rate}/hr
              </Text>
            </View>
          )}

          {physio.isConnected ? (
            <View style={[styles.statusBadge, { 
              backgroundColor: physio.connectionStatus === 'active' ? '#E8F5E9' : '#FFF3E0'
            }]}>
              <Text style={[styles.statusText, { 
                color: physio.connectionStatus === 'active' ? '#4CAF50' : '#FF9800'
              }]}>
                {physio.connectionStatus === 'active' ? 'Connected' : 
                 physio.connectionStatus === 'pending' ? 'Pending' : 'Inactive'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: colors.primary }]}
              onPress={() => handleSendRequest(physio.id)}
              disabled={isRequesting}
            >
              {isRequesting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={16} color={colors.white} />
                  <Text style={styles.connectButtonText}>Connect</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Find Physiotherapist</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.gray400} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search by name or specialization..."
          placeholderTextColor={colors.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading physiotherapists...
          </Text>
        </View>
      ) : filteredPhysios.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={colors.gray400} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {searchQuery ? 'No Results Found' : 'No Physiotherapists Yet'}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Check back later for available physiotherapists'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
            {filteredPhysios.length} physiotherapist{filteredPhysios.length !== 1 ? 's' : ''} found
          </Text>
          {filteredPhysios.map(renderPhysioCard)}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    padding: 0,
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
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  resultsText: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  physioCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  physioHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  physioInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  physioName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  specializationTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  moreText: {
    fontSize: fontSize.xs,
  },
  physioBio: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  physioFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rateText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
