import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

const LIKERT_LABELS = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];

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
    case 'eq': return '#4CAF50';
    case 'iq': return '#2196F3';
    case 'physical': return '#FF9800';
    default: return '#999';
  }
}

export default function QuizHistoryDetailScreen({ route }) {
  const { item } = route.params || {};
  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No details available</Text>
      </View>
    );
  }

  const isAttempt = item.kind === 'quiz_attempt';
  const isReport = item.kind === 'parent_report';
  const questions = Array.isArray(item.questions) ? item.questions : [];
  const answers = Array.isArray(item.answers) ? item.answers : [];
  const score = typeof item.score === 'number' ? item.score : (item.score != null ? Number(item.score) : null);
  const report = item.report || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.badgeRow, { backgroundColor: isAttempt ? getBadgeColor(item.test_type) : '#7B1FA2' }]}>
        <Text style={styles.badgeTitle}>
          {isAttempt ? (item.test_type || 'Quiz').toUpperCase() : 'Report'}
        </Text>
        <Text style={styles.badgeDate}>{formatDate(item.created_at)}</Text>
      </View>

      {isAttempt && (
        <>
          {score !== null && !Number.isNaN(score) && (
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{score.toFixed(1)}%</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Question-by-question analysis</Text>
          {questions.length === 0 ? (
            <Text style={styles.secondaryText}>No questions saved for this attempt.</Text>
          ) : (
            questions.map((q, index) => {
              const answerIndex = answers[index];
              const options = Array.isArray(q.options) ? q.options : null;
              let answerText = '—';
              if (typeof answerIndex === 'number' && answerIndex >= 0) {
                if (options && options[answerIndex] != null) {
                  answerText = options[answerIndex];
                } else if (answerIndex < LIKERT_LABELS.length) {
                  answerText = LIKERT_LABELS[answerIndex];
                } else {
                  answerText = String(answerIndex);
                }
              } else if (answerIndex != null) {
                answerText = String(answerIndex);
              }
              const questionText = q.question_text || q.question || 'Question';
              const parameter = q.parameter_measured || q.competency || q.category || '';

              return (
                <View key={index} style={styles.questionCard}>
                  <Text style={styles.questionIndex}>Q{index + 1}</Text>
                  {parameter ? (
                    <Text style={styles.parameterText}>{parameter}</Text>
                  ) : null}
                  <Text style={styles.questionText}>{questionText}</Text>
                  <View style={styles.answerRow}>
                    <Text style={styles.answerLabel}>Your answer:</Text>
                    <Text style={styles.answerValue}>{answerText}</Text>
                  </View>
                </View>
              );
            })
          )}

          {/* Detailed report + remedies for this quiz attempt (stored on submit) */}
          {(report.Data_Analysis ||
            report.Sub_grouping_Recommendation ||
            (report.Targeted_SEL_Activities && report.Targeted_SEL_Activities.length > 0) ||
            report.Progress_Tracking) ? (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Detailed report &amp; remedies</Text>
              {report.Data_Analysis ? (
                <View style={styles.reportCard}>
                  <Text style={styles.cardTitle}>Data analysis</Text>
                  <Text style={styles.reportBody}>{report.Data_Analysis}</Text>
                </View>
              ) : null}
              {report.Sub_grouping_Recommendation ? (
                <View style={styles.reportCard}>
                  <Text style={styles.cardTitle}>Sub-grouping recommendation</Text>
                  <Text style={styles.reportBody}>{report.Sub_grouping_Recommendation}</Text>
                </View>
              ) : null}
              {report.Targeted_SEL_Activities && report.Targeted_SEL_Activities.length > 0 ? (
                <View style={styles.reportCard}>
                  <Text style={styles.cardTitle}>Remedies — targeted SEL activities</Text>
                  {report.Targeted_SEL_Activities.map((activity, index) => (
                    <View key={index} style={styles.activityItem}>
                      <Text style={styles.activityTitle}>
                        {activity.title || activity.name || `Activity ${index + 1}`}
                      </Text>
                      {activity.description ? (
                        <Text style={styles.activityDesc}>{activity.description}</Text>
                      ) : null}
                      {activity.duration ? (
                        <Text style={styles.activityDuration}>Duration: {activity.duration}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
              {report.Progress_Tracking ? (
                <View style={styles.reportCard}>
                  <Text style={styles.cardTitle}>Progress tracking</Text>
                  <Text style={styles.reportBody}>{report.Progress_Tracking}</Text>
                </View>
              ) : null}
            </>
          ) : null}
        </>
      )}

      {isReport && (
        <>
          {report.Data_Analysis ? (
            <View style={styles.reportCard}>
              <Text style={styles.cardTitle}>Data analysis</Text>
              <Text style={styles.reportBody}>{report.Data_Analysis}</Text>
            </View>
          ) : null}
          {report.report_summary ? (
            <View style={styles.reportCard}>
              <Text style={styles.cardTitle}>Summary</Text>
              <Text style={styles.reportBody}>{report.report_summary}</Text>
            </View>
          ) : null}

          {report.Sub_grouping_Recommendation ? (
            <View style={styles.reportCard}>
              <Text style={styles.cardTitle}>Sub-grouping recommendation</Text>
              <Text style={styles.reportBody}>{report.Sub_grouping_Recommendation}</Text>
            </View>
          ) : null}

          {report.Targeted_SEL_Activities && report.Targeted_SEL_Activities.length > 0 ? (
            <View style={styles.reportCard}>
              <Text style={styles.cardTitle}>Targeted SEL activities</Text>
              {report.Targeted_SEL_Activities.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <Text style={styles.activityTitle}>
                    {activity.title || activity.name || `Activity ${index + 1}`}
                  </Text>
                  {activity.description ? (
                    <Text style={styles.activityDesc}>{activity.description}</Text>
                  ) : null}
                  {activity.duration ? (
                    <Text style={styles.activityDuration}>Duration: {activity.duration}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {report.Progress_Tracking ? (
            <View style={styles.reportCard}>
              <Text style={styles.cardTitle}>Progress tracking</Text>
              <Text style={styles.reportBody}>{report.Progress_Tracking}</Text>
            </View>
          ) : null}

          {/* Legacy report fields */}
          {report.strengths && report.strengths.length > 0 ? (
            <View style={styles.reportCard}>
              <Text style={styles.cardTitle}>Strengths</Text>
              {report.strengths.map((s, i) => (
                <Text key={i} style={styles.bulletItem}>✓ {s}</Text>
              ))}
            </View>
          ) : null}
          {report.weaknesses && report.weaknesses.length > 0 ? (
            <View style={styles.reportCard}>
              <Text style={styles.cardTitle}>Areas for improvement</Text>
              {report.weaknesses.map((w, i) => (
                <Text key={i} style={styles.bulletItem}>• {w}</Text>
              ))}
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  badgeRow: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  badgeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  badgeDate: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  scoreCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  questionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionIndex: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 6,
  },
  parameterText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  answerLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 6,
  },
  answerValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  reportCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  reportBody: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },
  bulletItem: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    marginBottom: 6,
  },
  activityItem: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  activityDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 4,
  },
  activityDuration: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  secondaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});
