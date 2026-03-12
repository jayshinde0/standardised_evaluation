import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { teacherAPI } from '../api/client';

export default function UploadPhysicalScreen({ route, navigation }) {
  const { student } = route.params;
  const [formData, setFormData] = useState({
    bmi: '',
    fitness_score: '',
    health_notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.bmi && !formData.fitness_score && !formData.health_notes) {
      Alert.alert('Error', 'Please fill in at least one field');
      return;
    }

    setLoading(true);
    try {
      const data = {
        apaar_id: student.apaar_id,
        bmi: formData.bmi ? parseFloat(formData.bmi) : null,
        fitness_score: formData.fitness_score ? parseFloat(formData.fitness_score) : null,
        health_notes: formData.health_notes || null,
      };

      await teacherAPI.uploadPhysicalTest(data);
      Alert.alert('Success', 'Physical test data uploaded successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student.full_name}</Text>
          <Text style={styles.studentDetail}>APAAR ID: {student.apaar_id}</Text>
          <Text style={styles.studentDetail}>Grade: {student.grade}</Text>
        </View>

        <Text style={styles.sectionTitle}>Physical Test Data</Text>

        <Text style={styles.label}>BMI</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter BMI value"
          value={formData.bmi}
          onChangeText={(text) => setFormData({ ...formData, bmi: text })}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Fitness Score (0-100)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter fitness score"
          value={formData.fitness_score}
          onChangeText={(text) => setFormData({ ...formData, fitness_score: text })}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Health Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter any health observations or notes"
          value={formData.health_notes}
          onChangeText={(text) => setFormData({ ...formData, health_notes: text })}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Uploading...' : 'Upload Data'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  studentInfo: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  studentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  studentDetail: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
