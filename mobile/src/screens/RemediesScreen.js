import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { parentAPI } from '../api/client';

export default function RemediesScreen() {
  const [remedies, setRemedies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadRemedies();
  }, []);

  const loadRemedies = async () => {
    try {
      const response = await parentAPI.getRemedies();
      setRemedies(response.data.remedies || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load remedies');
    } finally {
      setLoading(false);
    }
  };

  const generateNewReport = async () => {
    setGenerating(true);
    try {
      const response = await parentAPI.generateReport();
      setRemedies([response.data, ...remedies]);
      Alert.alert('Success', 'New report generated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const latestRemedy = remedies[0];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Actionable Remedies</Text>
        <TouchableOpacity
          style={[styles.generateButton, generating && styles.buttonDisabled]}
          onPress={generateNewReport}
          disabled={generating}
        >
          <Text style={styles.generateButtonText}>
            {generating ? 'Generating...' : 'Generate New Report'}
          </Text>
        </TouchableOpacity>
      </View>

      {latestRemedy ? (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Summary Analysis</Text>
            <Text style={styles.summaryText}>{latestRemedy.data_analysis}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sub-grouping Recommendation</Text>
            <Text style={styles.summaryText}>
              {latestRemedy.sub_grouping_recommendation}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Targeted SEL Activities</Text>
            {latestRemedy.targeted_sel_activities.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <Text style={styles.activityTitle}>
                  {activity.title || activity.name || `Activity ${index + 1}`}
                </Text>
                {activity.description && (
                  <Text style={styles.activityDesc}>{activity.description}</Text>
                )}
                {activity.duration && (
                  <Text style={styles.activityDuration}>
                    Duration: {activity.duration}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Progress Tracking</Text>
            <Text style={styles.summaryText}>{latestRemedy.progress_tracking}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No reports available yet</Text>
          <Text style={styles.emptySubtext}>Generate a report to see personalized recommendations</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  generateButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
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
    marginBottom: 15,
  },
  summaryText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bullet: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 10,
    fontWeight: 'bold',
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  competencyItem: {
    marginBottom: 20,
  },
  competencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  competencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  competencyScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  competencyDesc: {
    fontSize: 14,
    color: '#666',
  },
  activityItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  activityDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  activityDuration: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
  },
});
