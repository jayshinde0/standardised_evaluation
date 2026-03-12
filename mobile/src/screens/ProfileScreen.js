import { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { studentAPI } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows, card, iconSizes } from '../styles/theme';

const screenWidth = Dimensions.get('window').width;

export default function ProfileScreen() {
  const { signOut } = useContext(AuthContext);
  const [userInfo, setUserInfo] = useState({
    role: '',
    email: '',
    apaarId: '',
  });
  const [physicalHealth, setPhysicalHealth] = useState(null);
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      const apaarId = await AsyncStorage.getItem('apaarId');
      setUserInfo({
        role: role || 'User',
        apaarId: apaarId || 'N/A',
      });
      
      // Load physical health data for students
      if (role === 'student') {
        loadPhysicalHealth();
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const getRoleIcon = () => {
    switch (userInfo.role) {
      case 'student':
        return 'school';
      case 'teacher':
        return 'person-outline';
      case 'parent':
        return 'people-outline';
      default:
        return 'person';
    }
  };

  const getRoleColor = () => {
    switch (userInfo.role) {
      case 'student':
        return colors.iq;
      case 'teacher':
        return colors.secondary;
      case 'parent':
        return colors.primary;
      default:
        return colors.primary;
    }
  };

  const renderPhysicalMetric = (icon, label, value, unit = '') => (
    <View style={styles.metricItem}>
      <View style={styles.metricIconContainer}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.metricInfo}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value ? `${value}${unit}` : '—'}</Text>
      </View>
    </View>
  );

  const formatNutritionText = (text) => {
    if (!text) return '';
    
    // Remove markdown bold syntax
    let formatted = text.replace(/\*\*(.+?)\*\*/g, '$1');
    
    // Remove extra asterisks
    formatted = formatted.replace(/\*/g, '');
    
    return formatted;
  };

  const metrics = physicalHealth?.physical_metrics || {};
  const nutritionPlan = physicalHealth?.nutrition_plan;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={[styles.avatarContainer, { backgroundColor: getRoleColor() + '15' }]}>
          <Ionicons name={getRoleIcon()} size={72} color={getRoleColor()} />
        </View>
        <Text style={styles.roleTitle}>
          {userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1)}
        </Text>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor() }]}>
          <Text style={styles.roleBadgeText}>{userInfo.role.toUpperCase()}</Text>
        </View>
      </View>

      {/* Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        {userInfo.apaarId !== 'N/A' && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIconContainer, { backgroundColor: colors.primary + '12' }]}>
                <Ionicons name="card" size={iconSizes.md} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>APAAR ID</Text>
                <Text style={styles.infoValue}>{userInfo.apaarId}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIconContainer, { backgroundColor: colors.success + '12' }]}>
              <Ionicons name="shield-checkmark" size={iconSizes.md} color={colors.success} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Account Status</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: colors.info + '12' }]}>
              <Ionicons name="settings" size={iconSizes.md} color={colors.info} />
            </View>
            <Text style={styles.actionText}>Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: colors.warning + '12' }]}>
              <Ionicons name="help-circle" size={iconSizes.md} color={colors.warning} />
            </View>
            <Text style={styles.actionText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: colors.secondary + '12' }]}>
              <Ionicons name="information-circle" size={iconSizes.md} color={colors.secondary} />
            </View>
            <Text style={styles.actionText}>About</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Physical Health & Nutrition Section - Only for Students */}
      {userInfo.role === 'student' && physicalHealth && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="fitness" size={iconSizes.md} color={colors.physical} style={styles.sectionHeaderIcon} />
            <Text style={styles.sectionTitle}>Your Physical Health</Text>
          </View>
          
          <View style={styles.healthCard}>
            <Text style={styles.healthCardTitle}>Physical Metrics</Text>
            <View style={styles.metricsGrid}>
              {renderPhysicalMetric('fitness', 'BMI', metrics.bmi)}
              {renderPhysicalMetric('trophy', 'Fitness', metrics.fitness_score)}
              {renderPhysicalMetric('resize', 'Height', metrics.height_cm, ' cm')}
              {renderPhysicalMetric('scale', 'Weight', metrics.weight_kg, ' kg')}
              {renderPhysicalMetric('heart', 'Heart Rate', metrics.resting_heart_rate, ' bpm')}
              {renderPhysicalMetric('pulse', 'BP', metrics.systolic_bp && metrics.diastolic_bp ? `${metrics.systolic_bp}/${metrics.diastolic_bp}` : null, ' mmHg')}
              {renderPhysicalMetric('moon', 'Sleep', metrics.sleep_hours, ' hrs')}
            </View>
          </View>

          {nutritionPlan && !nutritionPlan.is_fallback && (
            <View style={styles.nutritionCard}>
              <View style={styles.nutritionHeader}>
                <Ionicons name="restaurant" size={iconSizes.md} color={colors.accent} style={styles.nutritionHeaderIcon} />
                <Text style={styles.nutritionTitle}>Personalized Nutrition Plan</Text>
              </View>
              <Text style={styles.nutritionSummary}>{formatNutritionText(nutritionPlan.ui_summary)}</Text>
              <TouchableOpacity
                style={styles.viewPlanButton}
                onPress={() => setShowNutritionModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewPlanButtonText}>View Full Diet Plan</Text>
                <Ionicons name="arrow-forward" size={iconSizes.sm} color={colors.primary} style={styles.viewPlanButtonIcon} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={styles.logoutIconContainer}>
            <Ionicons name="log-out" size={22} color={colors.white} />
          </View>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Student Development Tracker</Text>
        <Text style={styles.versionText}>Version 2.0.0</Text>
      </View>

      {/* Nutrition Plan Modal */}
      <Modal
        visible={showNutritionModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowNutritionModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Nutrition Plan</Text>
            <TouchableOpacity
              onPress={() => setShowNutritionModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={iconSizes.lg} color={colors.white} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
            {/* Visual Data - Pie Chart */}
            {nutritionPlan?.visuals && nutritionPlan.visuals.length > 0 && (
              <View style={styles.chartSection}>
                {nutritionPlan.visuals.map((visual, index) => {
                  if (visual.chartType === 'pie') {
                    const pieColors = ['#1E3A8A', '#0D9488', '#D97706'];
                    const pieData = visual.labels.map((label, idx) => ({
                      name: label,
                      population: visual.datasets[0].data[idx],
                      color: pieColors[idx % 3],
                      legendFontColor: colors.textPrimary,
                      legendFontSize: 13,
                    }));
                    
                    return (
                      <View key={index} style={styles.chartCard}>
                        <Text style={styles.chartTitle}>{visual.chartTitle}</Text>
                        <PieChart
                          data={pieData}
                          width={screenWidth - spacing.xl * 2}
                          height={220}
                          chartConfig={{
                            color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
                          }}
                          accessor="population"
                          backgroundColor="transparent"
                          paddingLeft="15"
                          center={[10, 0]}
                          absolute
                          hasLegend={true}
                        />
                      </View>
                    );
                  }
                  return null;
                })}
              </View>
            )}
            
            {/* Detailed Report Text */}
            <Text style={styles.modalText}>{formatNutritionText(nutritionPlan?.detailed_report || '')}</Text>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  roleTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  roleBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    letterSpacing: 1,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs + 2,
    fontWeight: '500',
  },
  infoValue: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success,
    marginRight: spacing.sm,
  },
  statusText: {
    ...typography.h4,
    color: colors.success,
    fontWeight: '600',
  },
  actionCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  actionText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  logoutButton: {
    ...card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg + 2,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.error,
    borderWidth: 0,
    ...shadows.md,
  },
  logoutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  logoutText: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.lg,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  versionText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionHeaderIcon: {
    marginRight: spacing.sm,
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
});
