import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { studentAPI, parentAPI } from '../api/client';

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
      return '#4CAF50';
    case 'iq':
      return '#2196F3';
    case 'physical':
      return '#FF9800';
    default:
      return '#999';
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
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Quiz History</Text>

      {history.length === 0 ? (
        <Text style={styles.emptyText}>No quiz history available yet</Text>
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
              <View style={styles.headerRow}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: isAttempt ? getBadgeColor(testType) : '#7B1FA2' },
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {isAttempt ? (testType || 'quiz').toUpperCase() : isReport ? 'REPORT' : 'ITEM'}
                  </Text>
                </View>
                <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
              </View>

              {isAttempt && (
                <>
                  {score !== null && !Number.isNaN(score) && (
                    <Text style={styles.primaryText}>Score: {score.toFixed(1)}%</Text>
                  )}
                  <Text style={styles.secondaryText}>
                    Questions: {Array.isArray(item.questions) ? item.questions.length : 0}
                  </Text>
                  {reportSummary ? (
                    <Text style={styles.previewText} numberOfLines={2}>
                      Report &amp; remedies: {reportSummary}
                    </Text>
                  ) : null}
                </>
              )}

              {isReport && (
                <>
                  {reportSummary ? (
                    <>
                      <Text style={styles.sectionLabel}>Summary</Text>
                      <Text style={styles.secondaryText}>{reportSummary}</Text>
                    </>
                  ) : (
                    <Text style={styles.secondaryText}>Report generated</Text>
                  )}
                </>
              )}
              <Text style={styles.tapHint}>Tap to view full analysis →</Text>
            </TouchableOpacity>
          );
        })
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
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 13,
    color: '#666',
  },
  primaryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  secondaryText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  tapHint: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
  },
  previewText: {
    fontSize: 13,
    color: '#555',
    marginTop: 8,
    lineHeight: 18,
  },
});

