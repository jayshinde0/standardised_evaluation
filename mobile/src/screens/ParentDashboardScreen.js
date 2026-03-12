import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { parentAPI } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows, card, iconSizes } from '../styles/theme';

const screenWidth = Dimensions.get('window').width;

export default function ParentDashboardScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, resultsRes] = await Promise.all([
        parentAPI.getChildProfile(),
        parentAPI.getTestResults(),
      ]);
      
      setProfile(profileRes.data);
      setTestResults(resultsRes.data.test_results || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getTestTypeColor = (type) => {
    switch (type) {
      case 'eq': return colors.eq;
      case 'iq': return colors.iq;
      case 'physical': return colors.physical;
      default: return colors.textTertiary;
    }
  };

  const getTestIcon = (testType) => {
    switch (testType) {
      case 'eq': return { name: 'brain', component: MaterialCommunityIcons };
      case 'iq': return { name: 'bulb', component: Ionicons };
      case 'physical': return { name: 'fitness', component: Ionicons };
      default: return { name: 'document-text', component: Ionicons };
    }
  };

  // Prepare chart data
  const getChartData = () => {
    const testTypeCounts = testResults.reduce((acc, result) => {
      acc[result.test_type] = (acc[result.test_type] || 0) + 1;
      return acc;
    }, {});

    const pieData = Object.entries(testTypeCounts).map(([type, count]) => ({
      name: type.toUpperCase(),
      count,
      color: getTestTypeColor(type),
      legendFontColor: colors.textSecondary,
      legendFontSize: 12,
    }));

    return pieData;
  };

  const getScoreChartData = () => {
    const recentTests = testResults
      .filter(r => r.score !== null && r.score !== undefined)
      .slice(0, 6)
      .reverse();

    if (recentTests.length === 0) return null;

    return {
      labels: recentTests.map((r, i) => `T${i + 1}`),
      datasets: [{
        data: recentTests.map(r => r.score || 0),
      }],
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const pieData = getChartData();
  const scoreData = getScoreChartData();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary || '#1E3A8A', colors.primaryDark || '#1E40AF']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Child's Progress</Text>
              <Text style={styles.childName}>{profile?.full_name || 'Student'}</Text>
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
        {/* Test Distribution Chart */}
        {pieData.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pie-chart-outline" size={iconSizes.md} color={colors.primary} />
              <Text style={styles.sectionTitle}>Test Distribution</Text>
            </View>
            <View style={styles.chartCard}>
              <PieChart
                data={pieData}
                width={screenWidth - spacing.xl * 4}
                height={200}
                chartConfig={{
                  color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
                }}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </View>
        )}

        {/* Score Trend Chart */}
        {scoreData && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trending-up-outline" size={iconSizes.md} color={colors.primary} />
              <Text style={styles.sectionTitle}>Recent Score Trend</Text>
            </View>
            <View style={styles.chartCard}>
              <BarChart
                data={scoreData}
                width={screenWidth - spacing.xl * 4}
                height={200}
                chartConfig={{
                  backgroundColor: colors.surface,
                  backgroundGradientFrom: colors.surface,
                  backgroundGradientTo: colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
                  labelColor: (opacity = 1) => colors.textSecondary,
                  style: {
                    borderRadius: borderRadius.md,
                  },
                  propsForLabels: {
                    fontSize: 11,
                  },
                }}
                style={{
                  borderRadius: borderRadius.md,
                }}
                fromZero
                yAxisSuffix="%"
                showValuesOnTopOfBars
              />
            </View>
          </View>
        )}

        {/* Test Results List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={iconSizes.md} color={colors.primary} />
            <Text style={styles.sectionTitle}>Test Results</Text>
            {testResults.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{testResults.length}</Text>
              </View>
            )}
          </View>
          
          {testResults.length > 0 ? (
            testResults.map((result, index) => {
              const iconInfo = getTestIcon(result.test_type);
              const IconComponent = iconInfo.component;
              const testColor = getTestTypeColor(result.test_type);
              
              return (
                <View key={index} style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <View style={styles.resultLeft}>
                      <View style={[styles.testBadge, { backgroundColor: testColor + '15' }]}>
                        <IconComponent name={iconInfo.name} size={iconSizes.lg} color={testColor} />
                      </View>
                      <View>
                        <Text style={styles.testBadgeText}>{result.test_type.toUpperCase()}</Text>
                        <View style={styles.dateRow}>
                          <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
                          <Text style={styles.resultDate}>
                            {new Date(result.test_date).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {result.score && (
                      <View style={styles.scoreContainer}>
                        <Text style={styles.score}>{result.score.toFixed(0)}%</Text>
                      </View>
                    )}
                  </View>
                  {result.notes && (
                    <Text style={styles.notes}>{result.notes}</Text>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="bar-chart-outline" size={iconSizes.xxl} color={colors.textTertiary} />
              </View>
              <Text style={styles.emptyText}>No test results yet</Text>
              <Text style={styles.emptySubtext}>Results will appear here once tests are completed</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Remedies')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.secondary || '#0D9488', colors.secondaryDark || '#0F766E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="bulb-outline" size={iconSizes.md} color={colors.white} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionButtonText}>Suggested Activities</Text>
                <Text style={styles.actionButtonSubtext}>View personalized recommendations</Text>
              </View>
              <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('QuizHistory')}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={iconSizes.md} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>View Quiz History</Text>
            <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.primary} />
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
  childName: {
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
    flex: 1,
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
  chartCard: {
    ...card,
    padding: spacing.lg,
    alignItems: 'center',
  },
  resultCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  testBadge: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  testBadgeText: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  resultDate: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  scoreContainer: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  score: {
    ...typography.h3,
    fontWeight: '700',
    color: colors.primary,
  },
  notes: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 20,
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
  actionButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
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
  secondaryButton: {
    ...card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  secondaryButtonText: {
    ...typography.h4,
    color: colors.primary,
    flex: 1,
  },
});
