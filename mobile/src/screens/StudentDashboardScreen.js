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
  const [physicalHealth, setPhysicalHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingHealth, setLoadingHealth] = useState(false);

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
      
      // Load physical health data
      loadPhysicalHealth();
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadPhysicalHealth = async () => {
    setLoadingHealth(true);
    try {
      const healthRes = await studentAPI.getPhysicalHealth();
      if (healthRes.data.has_data) {
        setPhysicalHealth(healthRes.data);
      }
    } catch (error) {
      console.log('Physical health data not available:', error.message);
    } finally {
      setLoadingHealth(false);
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

  const renderHealthMetric = (icon, label, value, unit = '') => (
    <View style={styles.healthMetricItem}>
      <View style={styles.healthMetricIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.healthMetricLabel}>{label}</Text>
      <Text style={styles.healthMetricValue}>
        {value ? `${value}${unit}` : '—'}
      </Text>
    </View>
  );

  const getBMICategory = (bmi) => {
    if (!bmi) return 'Not Available';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Healthy Weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const getBMICategoryColor = (bmi) => {
    if (!bmi) return colors.textSecondary;
    if (bmi < 18.5) return colors.warning;
    if (bmi < 25) return colors.success;
    if (bmi < 30) return colors.warning;
    return colors.error;
  };

  const formatNutritionText = (text) => {
    if (!text) return '';
    let formatted = text.replace(/\*\*(.+?)\*\*/g, '$1');
    formatted = formatted.replace(/\*/g, '');
    return formatted;
  };

  const metrics = physicalHealth?.physical_metrics || {};
  const nutritionPlan = physicalHealth?.nutrition_plan;

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
        colors={[colors.primary || '#1E3A8A', colors.primaryDark || '#1E40AF']}
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
            <Ionicons name="card-outline" size={16} color={colors.white} style={styles.idBadgeIcon} />
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

        {/* Physical Health Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="fitness" size={iconSizes.md} color={colors.primary} style={styles.sectionHeaderIcon} />
            <Text style={styles.sectionTitle}>Your Physical Health</Text>
          </View>

          {loadingHealth ? (
            <View style={styles.healthLoadingCard}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.healthLoadingText}>Loading health data...</Text>
            </View>
          ) : physicalHealth ? (
            <>
              {/* Health Metrics Card */}
              <View style={styles.healthMetricsCard}>
                <Text style={styles.healthCardTitle}>Key Health Metrics</Text>
                <View style={styles.healthMetricsGrid}>
                  <View style={styles.healthMetricsRow}>
                    {renderHealthMetric('fitness', 'BMI', metrics.bmi)}
                    {renderHealthMetric('trophy', 'Fitness', metrics.fitness_score)}
                    {renderHealthMetric('resize', 'Height', metrics.height_cm, ' cm')}
                  </View>
                  <View style={styles.healthMetricsDivider} />
                  <View style={styles.healthMetricsRow}>
                    {renderHealthMetric('scale', 'Weight', metrics.weight_kg, ' kg')}
                    {renderHealthMetric('heart', 'Heart Rate', metrics.resting_heart_rate, ' bpm')}
                    {renderHealthMetric('moon', 'Sleep', metrics.sleep_hours, ' hrs')}
                  </View>
                </View>
              </View>

              {/* BMI Status Card */}
              {metrics.bmi && (
                <View style={styles.bmiStatusCard}>
                  <View style={styles.bmiStatusHeader}>
                    <Ionicons name="analytics" size={iconSizes.md} color={getBMICategoryColor(metrics.bmi)} style={styles.bmiStatusIcon} />
                    <Text style={styles.bmiStatusTitle}>BMI Status</Text>
                  </View>
                  <View style={styles.bmiStatusContent}>
                    <Text style={styles.bmiStatusValue}>{metrics.bmi}</Text>
                    <View style={[styles.bmiStatusBadge, { backgroundColor: getBMICategoryColor(metrics.bmi) + '20' }]}>
                      <Text style={[styles.bmiStatusText, { color: getBMICategoryColor(metrics.bmi) }]}>
                        {getBMICategory(metrics.bmi)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* AI Health Insights */}
              {nutritionPlan && !nutritionPlan.is_fallback && (
                <View style={styles.healthInsightsCard}>
                  <View style={styles.healthInsightsHeader}>
                    <Ionicons name="bulb" size={iconSizes.md} color={colors.secondary} style={styles.healthInsightsIcon} />
                    <Text style={styles.healthInsightsTitle}>AI Health Insights</Text>
                  </View>
                  <Text style={styles.healthInsightsText}>
                    {formatNutritionText(nutritionPlan.ui_summary)}
                  </Text>
                  <TouchableOpacity
                    style={styles.viewDetailsButton}
                    onPress={() => navigation.navigate('Profile')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewDetailsButtonText}>View Full Health Report</Text>
                    <Ionicons name="arrow-forward" size={iconSizes.sm} color={colors.primary} style={styles.viewDetailsButtonIcon} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noHealthDataCard}>
              <View style={styles.noHealthDataIcon}>
                <Ionicons name="fitness-outline" size={iconSizes.xxl} color={colors.textTertiary} />
              </View>
              <Text style={styles.noHealthDataTitle}>No Health Data Available</Text>
              <Text style={styles.noHealthDataText}>
                Your physical health data has not been uploaded yet. Please contact your teacher for a health assessment.
              </Text>
            </View>
          )}
        </View>

        {/* More Options */}
        <View style={styles.section}>
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
  },
  idBadgeIcon: {
    marginRight: spacing.sm,
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
  healthCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  healthCardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  metricItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    marginBottom: spacing.sm,
  },
  metricIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  nutritionCard: {
    ...card,
    padding: spacing.lg,
    backgroundColor: colors.accent + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nutritionHeaderIcon: {
    marginRight: spacing.sm,
  },
  nutritionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  nutritionSummary: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  viewPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  viewPlanButtonIcon: {
    marginLeft: spacing.sm,
  },
  viewPlanButtonText: {
    ...typography.body,
    color: colors.primary,
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
  healthCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  healthCardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  metricItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    marginBottom: spacing.sm,
  },
  metricIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xxxl + spacing.xl,
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.white,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: spacing.xl,
  },
  modalText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  chartSection: {
    marginBottom: spacing.xl,
  },
  chartCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  chartTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  menuItem: {
    ...card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  logoutItem: {
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  logoutIconContainer: {
    backgroundColor: colors.error + '15',
  },
  logoutText: {
    color: colors.error,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionHeaderIcon: {
    marginRight: spacing.sm,
  },
  healthLoadingCard: {
    ...card,
    padding: spacing.xl,
    alignItems: 'center',
  },
  healthLoadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  healthMetricsCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  healthCardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  healthMetricsGrid: {
    marginTop: spacing.sm,
  },
  healthMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  healthMetricsDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  healthMetricItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  healthMetricIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  healthMetricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  healthMetricValue: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  bmiStatusCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.primaryLight + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryLight,
  },
  bmiStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bmiStatusIcon: {
    marginRight: spacing.sm,
  },
  bmiStatusTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  bmiStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bmiStatusValue: {
    ...typography.h1,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  bmiStatusBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  bmiStatusText: {
    ...typography.body,
    fontWeight: '600',
  },
  healthInsightsCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.secondary + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  healthInsightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  healthInsightsIcon: {
    marginRight: spacing.sm,
  },
  healthInsightsTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  healthInsightsText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  viewDetailsButtonIcon: {
    marginLeft: spacing.sm,
  },
  viewDetailsButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  noHealthDataCard: {
    ...card,
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  noHealthDataIcon: {
    marginBottom: spacing.lg,
  },
  noHealthDataTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  noHealthDataText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
