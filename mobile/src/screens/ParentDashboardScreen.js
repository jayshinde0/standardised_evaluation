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
      case 'eq': return '#4CAF50';
      case 'iq': return '#2196F3';
      case 'physical': return '#FF9800';
      default: return '#999';
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Your Child's Progress</Text>
        <Text style={styles.childName}>{profile?.full_name || 'Student'}</Text>
        <Text style={styles.apaarId}>APAAR ID: {profile?.apaar_id}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          <Text style={styles.resultCount}>{testResults.length} tests</Text>
        </View>
        
        {testResults.length > 0 ? (
          testResults.map((result, index) => (
            <View key={index} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={[styles.badge, { backgroundColor: getTestTypeColor(result.test_type) }]}>
                  <Text style={styles.badgeText}>{result.test_type.toUpperCase()}</Text>
                </View>
                <Text style={styles.resultDate}>
                  {new Date(result.test_date).toLocaleDateString()}
                </Text>
              </View>
              {result.score && (
                <Text style={styles.score}>Score: {result.score.toFixed(1)}%</Text>
              )}
              {result.notes && (
                <Text style={styles.notes}>{result.notes}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No test results available</Text>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Remedies')}
        >
          <Text style={styles.actionButtonText}>View Suggested Activities</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('QuizHistory')}
        >
          <Text style={styles.secondaryButtonText}>View Quiz History</Text>
        </TouchableOpacity>
      </View>
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
  greeting: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 5,
  },
  childName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  apaarId: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
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
  resultDate: {
    fontSize: 14,
    color: '#666',
  },
  score: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  notes: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});
