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
import { Avatar, Card } from '../components';
import { spacing, borderRadius, fontSize, useTheme } from '../theme';
import { Connection, Profile } from '../types/database';

interface ConnectionWithPatient extends Connection {
  patient?: Profile;
  recentSessions?: number;
  lastSessionDate?: string;
}

export const PhysioDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const [connections, setConnections] = useState<ConnectionWithPatient[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);

      // Get all connections where user is the physiotherapist
      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          patient:patient_id(id, full_name, email, avatar_url, phone)
        `)
        .eq('physiotherapist_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const connectionsData = (data as ConnectionWithPatient[]) || [];

      // Get recent session counts for active patients
      const activeConnections = connectionsData.filter(c => c.status === 'active');
      
      for (const connection of activeConnections) {
        if (connection.patient_id) {
          const { data: sessions } = await supabase
            .from('workout_sessions')
            .select('id, started_at')
            .eq('patient_id', connection.patient_id)
            .order('started_at', { ascending: false })
            .limit(1);

          if (sessions && sessions.length > 0) {
            connection.lastSessionDate = sessions[0].started_at;
          }

          const { count } = await supabase
            .from('workout_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', connection.patient_id)
            .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

          connection.recentSessions = count || 0;
        }
      }

      setConnections(connectionsData.filter(c => c.status !== 'pending'));
      setPendingRequests(connectionsData.filter(c => c.status === 'pending'));
    } catch (error) {
      console.error('Error loading connections:', error);
      Alert.alert('Error', 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (connectionId: string) => {
    try {
      setProcessingRequest(connectionId);

      const { error } = await supabase
        .from('connections')
        .update({ 
          status: 'active',
          connected_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      if (error) throw error;

      Alert.alert('Success', 'Connection request accepted!');
      loadConnections();
    } catch (error: any) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', error.message || 'Failed to accept request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (connectionId: string) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this connection request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingRequest(connectionId);

              const { error } = await supabase
                .from('connections')
                .delete()
                .eq('id', connectionId);

              if (error) throw error;

              Alert.alert('Request Rejected', 'Connection request has been rejected');
              loadConnections();
            } catch (error: any) {
              console.error('Error rejecting request:', error);
              Alert.alert('Error', error.message || 'Failed to reject request');
            } finally {
              setProcessingRequest(null);
            }
          },
        },
      ]
    );
  };

  const handleViewPatient = (patientId: string) => {
    navigation.navigate('PatientDetail', { patientId });
  };

  const renderRequestCard = (connection: ConnectionWithPatient) => {
    const isProcessing = processingRequest === connection.id;

    return (
      <Card key={connection.id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <Avatar name={connection.patient?.full_name || 'Patient'} size="md" />
          <View style={styles.requestInfo}>
            <Text style={[styles.patientName, { color: colors.textPrimary }]}>
              {connection.patient?.full_name || 'Unnamed Patient'}
            </Text>
            <Text style={[styles.requestEmail, { color: colors.textSecondary }]}>
              {connection.patient?.email}
            </Text>
          </View>
        </View>

        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: colors.primary }]}
            onPress={() => handleAcceptRequest(connection.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color={colors.white} />
                <Text style={styles.acceptButtonText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rejectButton, { borderColor: colors.error }]}
            onPress={() => handleRejectRequest(connection.id)}
            disabled={isProcessing}
          >
            <Ionicons name="close" size={20} color={colors.error} />
            <Text style={[styles.rejectButtonText, { color: colors.error }]}>Reject</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderPatientCard = (connection: ConnectionWithPatient) => {
    const lastSession = connection.lastSessionDate
      ? new Date(connection.lastSessionDate).toLocaleDateString()
      : 'No sessions yet';

    return (
      <TouchableOpacity
        key={connection.id}
        onPress={() => handleViewPatient(connection.patient_id)}
      >
        <Card style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <Avatar name={connection.patient?.full_name || 'Patient'} size="lg" />
            <View style={styles.patientInfo}>
              <Text style={[styles.patientName, { color: colors.textPrimary }]}>
                {connection.patient?.full_name || 'Unnamed Patient'}
              </Text>
              <View style={styles.patientDetails}>
                <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {connection.patient?.email}
                </Text>
              </View>
              {connection.patient?.phone && (
                <View style={styles.patientDetails}>
                  <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    {connection.patient.phone}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.patientStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {connection.recentSessions || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Sessions (7d)
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {connection.status === 'active' ? 'Active' : 'Inactive'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Status</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]} numberOfLines={1}>
                {lastSession}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Last Session</Text>
            </View>
          </View>

          <View style={styles.patientFooter}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
              onPress={() => navigation.navigate('AssignProgram', { patientId: connection.patient_id })}
            >
              <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                Assign Program
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.viewDetailsButton}>
              <Text style={[styles.viewDetailsText, { color: colors.primary }]}>View Details</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Patients</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading patients...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Pending Requests Section */}
          {pendingRequests.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Pending Requests
                </Text>
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={styles.badgeText}>{pendingRequests.length}</Text>
                </View>
              </View>
              {pendingRequests.map(renderRequestCard)}
            </View>
          )}

          {/* Active Patients Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Active Patients ({connections.filter(c => c.status === 'active').length})
            </Text>

            {connections.filter(c => c.status === 'active').length === 0 ? (
              <View style={styles.emptySection}>
                <Ionicons name="people-outline" size={48} color={colors.gray400} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No active patients yet
                </Text>
              </View>
            ) : (
              connections.filter(c => c.status === 'active').map(renderPatientCard)
            )}
          </View>

          {/* Inactive Patients Section */}
          {connections.filter(c => c.status !== 'active' && c.status !== 'pending').length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Inactive Patients ({connections.filter(c => c.status !== 'active' && c.status !== 'pending').length})
              </Text>
              {connections.filter(c => c.status !== 'active' && c.status !== 'pending').map(renderPatientCard)}
            </View>
          )}
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
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
  },
  requestCard: {
    padding: spacing.md,
    gap: spacing.md,
  },
  requestHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  requestInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  patientName: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  requestEmail: {
    fontSize: fontSize.sm,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  rejectButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  patientCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  patientHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  patientInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  patientDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.sm,
  },
  patientStats: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  patientFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
