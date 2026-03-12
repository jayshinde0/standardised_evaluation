import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { studentAPI } from '../api/client';

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
        <Text style={styles.greeting}>Hello, {profile?.full_name || 'Student'}!</Text>
        <Text style={styles.apaarId}>APAAR ID: {profile?.apaar_id}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Tests</Text>
        {pendingTests.length > 0 ? (
          pendingTests.map((test, index) => (
            <TouchableOpacity
              key={index}
              style={styles.testCard}
              onPress={() => navigation.navigate('TakeTest', { testType: test })}
            >
              <Text style={styles.testTitle}>
                {test.toUpperCase()} Assessment
              </Text>
              <Text style={styles.testSubtitle}>Tap to start</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No pending tests</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress Summary</Text>
        <View style={styles.progressCard}>
          <Text style={styles.progressText}>Grade: {profile?.grade || 'Class 2'}</Text>
          <Text style={styles.progressText}>School: {profile?.school_name || 'Delhi Public School'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('QuizHistory')}
        >
          <Text style={styles.historyButtonText}>View Quiz History</Text>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  testCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  testSubtitle: {
    fontSize: 14,
    color: '#007AFF',
  },
  progressCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  historyButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  historyButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
