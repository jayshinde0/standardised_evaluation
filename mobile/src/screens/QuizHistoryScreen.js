import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { studentAPI, parentAPI } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows, glassCard } from '../styles/theme';

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '';
  }
}

function getBadgeColor(testType) {
  switch (testType) {
    case 'eq':
      return colors.eq;
    case 'iq':
      return colors.iq;
    case 'physical':
      return colors.physical;
    default:
      return colors.textLight;
  }
}

function getTestIcon(testType) {
  switch (testType) {
    case 'eq': return '🧠';
    case 'iq': return '💡';
    case 'physical': return '💪';
    default: return '📝';
  }
}

export default function QuizHistoryScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const role = await AsyncStorage.getItem('userRole');
      const response =
        role === 'parent'
          ? await parentAPI.getQuizHistory()
          : await studentAPI.getQuizHistory();
      setHistory(response.data.quiz_history || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load quiz history');
    } finally {
      setLoading(false);
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
          <Text style={styles.title}>Quiz History</Text>
          <Text style={styles.subtitle}>{history.length} total records</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>No quiz history yet</Text>
            <Text style={styles.emptySubtext}>Your completed quizzes will appear here</Text>
          </View>
        ) : (
          history.map((item) => {
            const isAttempt = item.kind === 'quiz_attempt';
            const isReport = item.kind === 'parent_report';
            const testType = item.test_type;
            const score =
              typeof item.score === 'number' ? item.score : item?.score ? Number(item.score) : null;
            const reportSummary =
              item?.report?.Data_Analysis ||
              item?.report?.report_summary;

            return (
              <TouchableOpacity
                key={item._id}
                style={styles.card}
                onPress={() => navigation.navigate('QuizHistoryDetail', { item })}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={[
                    styles.iconBadge,
                    { backgroundColor: isAttempt ? getBadgeColor(testType) : colors.primary }
                  ]}>
                    <Text style={styles.iconBadgeText}>
                      {isAttempt ? getTestIcon(testType) : '📊'}
                    </Text>
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitle}>
                      {isAttempt ? (testType || 'quiz').toUpperCase() : 'REPORT'}
                    </Text>
                    <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
                  </View>
                </View>

                {isAttempt && (
                  <>
                    {score !== null && !Number.isNaN(score) && (
                      <View style={styles.scoreRow}>
                        <Text style={styles.scoreLabel}>Score:</Text>
                        <Text style={styles.scoreValue}>{score.toFixed(1)}%</Text>
                      </View>
                    )}
                    <Text style={styles.questionsText}>
                      {Array.isArray(item.questions) ? item.questions.length : 0} questions
                    </Text>
                    {reportSummary && (
                      <Text style={styles.previewText} numberOfLines={2}>
                        {reportSummary}
                      </Text>
                    )}
                  </>
                )}

                {isReport && reportSummary && (
                  <Text style={styles.previewText} numberOfLines={3}>
                    {reportSummary}
                  </Text>
                )}

                <Text style={styles.tapHint}>Tap to view details →</Text>
              </TouchableOpacity>
            );
          })
        )}
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
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  card: {
    ...glassCard,
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconBadgeText: {
    fontSize: 24,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  scoreLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  scoreValue: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  questionsText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  previewText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  tapHint: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyCard: {
    ...glassCard,
    backgroundColor: colors.white,
    padding: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
