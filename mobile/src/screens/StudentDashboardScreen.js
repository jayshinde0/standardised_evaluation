import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { studentAPI } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows, card, iconSizes } from '../styles/theme';

export default function StudentDashboardScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [pendingTests, setPendingTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, testsRes] = await Promise.all([
        studentAPI.getProfile(),
        studentAPI.getPendingTests(),
      ]);
      
      setProfile(profileRes.data);
      setPendingTests(testsRes.data.pending_tests || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getTestIcon = (testType) => {
    switch (testType) {
      case 'eq': return { name: 'brain', component: MaterialCommunityIcons, color: colors.eq };
      case 'iq': return { name: 'bulb', component: Ionicons, color: colors.iq };
      case 'physical': return { name: 'fitness', component: Ionicons, color: colors.physical };
      default: return { name: 'document-text', component: Ionicons, color: colors.primary };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{profile?.full_name || 'Student'}</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={iconSizes.lg} color={colors.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.idBadge}>
            <Ionicons name="card-outline" size={16} color={colors.white} />
            <Text style={styles.apaarId}>APAAR ID: {profile?.apaar_id}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Pending Assessments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Assessments</Text>
            {pendingTests.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{pendingTests.length}</Text>
              </View>
            )}
          </View>
          
          {pendingTests.length > 0 ? (
            pendingTests.map((test, index) => {
              const iconInfo = getTestIcon(test);
              const IconComponent = iconInfo.component;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.testCard}
                  onPress={() => navigation.navigate('TakeTest', { testType: test })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.testIconContainer, { backgroundColor: iconInfo.color + '15' }]}>
                    <IconComponent name={iconInfo.name} size={iconSizes.lg} color={iconInfo.color} />
                  </View>
                  <View style={styles.testContent}>
                    <Text style={styles.testTitle}>
                      {test.toUpperCase()} Assessment
                    </Text>
                    <Text style={styles.testSubtitle}>Tap to begin test</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textTertiary} />
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="checkmark-circle" size={iconSizes.xxl} color={colors.success} />
              </View>
              <Text style={styles.emptyText}>All Caught Up!</Text>
              <Text style={styles.emptySubtext}>No pending assessments at the moment</Text>
            </View>
          )}
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={styles.profileIconContainer}>
                <Ionicons name="school-outline" size={iconSizes.md} color={colors.primary} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>Grade</Text>
                <Text style={styles.profileValue}>{profile?.grade || 'Class 2'}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.profileRow}>
              <View style={styles.profileIconContainer}>
                <Ionicons name="business-outline" size={iconSizes.md} color={colors.primary} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>School</Text>
                <Text style={styles.profileValue}>{profile?.school_name || 'Delhi Public School'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('QuizHistory')}
            activeOpacity={0.7}
          >
            <View style={styles.actionButtonContent}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="bar-chart-outline" size={iconSizes.md} color={colors.white} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionButtonText}>View Quiz History</Text>
                <Text style={styles.actionButtonSubtext}>Check your past performance</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.white} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingTop: spacing.xxxl + spacing.xl,
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  greeting: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
  },
  userName: {
    ...typography.h1,
    color: colors.white,
    marginTop: spacing.xs,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    gap: spacing.sm,
  },
  apaarId: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  section: {
    marginBottom: spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  testCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  testIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  testContent: {
    flex: 1,
  },
  testTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  testSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  emptyCard: {
    ...card,
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emptyIconContainer: {
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  profileCard: {
    ...card,
    padding: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  profileValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  actionButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.lg,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionButtonText: {
    ...typography.h4,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  actionButtonSubtext: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.9,
  },
});
