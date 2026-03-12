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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';

export default function UploadPhysicalScreen({ route, navigation }) {
  const { student } = route.params;
  const [formData, setFormData] = useState({
    bmi: '',
    fitness_score: '',
    health_notes: '',
    height_cm: '',
    weight_kg: '',
    resting_heart_rate: '',
    systolic_bp: '',
    diastolic_bp: '',
    sleep_hours: '',
  });
  const [loading, setLoading] = useState(false);

  const parseNumOrNull = (value) => {
    if (value === null || value === undefined) return null;
    const str = String(value).trim();
    if (!str) return null;
    const num = Number(str);
    return Number.isFinite(num) ? num : null;
  };

  const parseStrOrNull = (value) => {
    if (value === null || value === undefined) return null;
    const str = String(value).trim();
    return str ? str : null;
  };

  const buildPayload = (overrides = {}) => {
    const merged = { ...formData, ...overrides };
    const additional_metrics = {};

    const height_cm = parseNumOrNull(merged.height_cm);
    const weight_kg = parseNumOrNull(merged.weight_kg);
    const resting_heart_rate = parseNumOrNull(merged.resting_heart_rate);
    const systolic_bp = parseNumOrNull(merged.systolic_bp);
    const diastolic_bp = parseNumOrNull(merged.diastolic_bp);
    const sleep_hours = parseNumOrNull(merged.sleep_hours);

    if (height_cm !== null) additional_metrics.height_cm = height_cm;
    if (weight_kg !== null) additional_metrics.weight_kg = weight_kg;
    if (resting_heart_rate !== null) additional_metrics.resting_heart_rate = resting_heart_rate;
    if (systolic_bp !== null) additional_metrics.systolic_bp = systolic_bp;
    if (diastolic_bp !== null) additional_metrics.diastolic_bp = diastolic_bp;
    if (sleep_hours !== null) additional_metrics.sleep_hours = sleep_hours;

    const payload = {
      apaar_id: student.apaar_id,
      bmi: parseNumOrNull(merged.bmi),
      fitness_score: parseNumOrNull(merged.fitness_score),
      health_notes: parseStrOrNull(merged.health_notes),
      additional_metrics: Object.keys(additional_metrics).length ? additional_metrics : null,
    };

    return payload;
  };

  const handleSubmit = async () => {
    if (
      !formData.bmi &&
      !formData.fitness_score &&
      !formData.health_notes &&
      !formData.height_cm &&
      !formData.weight_kg &&
      !formData.resting_heart_rate &&
      !formData.systolic_bp &&
      !formData.diastolic_bp &&
      !formData.sleep_hours
    ) {
      Alert.alert('Error', 'Please fill in at least one field');
      return;
    }

    setLoading(true);
    try {
      const data = buildPayload();
      const res = await teacherAPI.uploadPhysicalTest(data);
      Alert.alert('Success', 'Physical test data uploaded successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload data');
    } finally {
      setLoading(false);
    }
  };

  const normalizeKey = (k) =>
    String(k || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

  const uploadFromExcel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;
      const file = result.assets && result.assets[0];
      if (!file?.uri) {
        Alert.alert('Error', 'Could not read the selected file');
        return;
      }

      const b64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const wb = XLSX.read(b64, { type: 'base64' });
      const sheetName = wb.SheetNames?.[0];
      if (!sheetName) {
        Alert.alert('Error', 'No sheets found in Excel file');
        return;
      }
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!rows.length) {
        Alert.alert('Error', 'Excel sheet is empty');
        return;
      }

      // For this screen we take the first row (single student upload)
      const row = rows[0];
      const mapped = {};
      Object.keys(row).forEach((key) => {
        mapped[normalizeKey(key)] = row[key];
      });

      // Optional: if sheet has apaar_id column, enforce match
      const sheetApaar = mapped.apaar_id ? String(mapped.apaar_id).trim() : '';
      if (sheetApaar && sheetApaar !== String(student.apaar_id)) {
        Alert.alert(
          'Wrong student',
          `This sheet is for APAAR ID ${sheetApaar}, but you selected ${student.apaar_id}.`
        );
        return;
      }

      const nextFormData = {
        ...formData,
        bmi: mapped.bmi ?? formData.bmi,
        fitness_score: mapped.fitness_score ?? mapped.fitnessscore ?? formData.fitness_score,
        health_notes: mapped.health_notes ?? mapped.notes ?? formData.health_notes,
        height_cm: mapped.height_cm ?? mapped.height ?? formData.height_cm,
        weight_kg: mapped.weight_kg ?? mapped.weight ?? formData.weight_kg,
        resting_heart_rate: mapped.resting_heart_rate ?? mapped.restinghr ?? mapped.heart_rate ?? formData.resting_heart_rate,
        systolic_bp: mapped.systolic_bp ?? mapped.bp_systolic ?? formData.systolic_bp,
        diastolic_bp: mapped.diastolic_bp ?? mapped.bp_diastolic ?? formData.diastolic_bp,
        sleep_hours: mapped.sleep_hours ?? mapped.sleep ?? formData.sleep_hours,
      };

      // Prefill the form so teacher can review before uploading
      setFormData({
        ...nextFormData,
        bmi: nextFormData.bmi ? String(nextFormData.bmi) : '',
        fitness_score: nextFormData.fitness_score ? String(nextFormData.fitness_score) : '',
        health_notes: nextFormData.health_notes ? String(nextFormData.health_notes) : '',
        height_cm: nextFormData.height_cm ? String(nextFormData.height_cm) : '',
        weight_kg: nextFormData.weight_kg ? String(nextFormData.weight_kg) : '',
        resting_heart_rate: nextFormData.resting_heart_rate ? String(nextFormData.resting_heart_rate) : '',
        systolic_bp: nextFormData.systolic_bp ? String(nextFormData.systolic_bp) : '',
        diastolic_bp: nextFormData.diastolic_bp ? String(nextFormData.diastolic_bp) : '',
        sleep_hours: nextFormData.sleep_hours ? String(nextFormData.sleep_hours) : '',
      });

      Alert.alert('Loaded', 'Excel values loaded. Review and tap “Upload Data”.');
    } catch (e) {
      Alert.alert('Error', 'Failed to import Excel file');
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

        <TouchableOpacity
          style={[styles.excelButton, loading && styles.buttonDisabled]}
          onPress={uploadFromExcel}
          disabled={loading}
        >
          <Text style={styles.excelButtonText}>
            {loading ? 'Please wait...' : 'Upload from Excel (.xlsx)'}
          </Text>
        </TouchableOpacity>

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

        <Text style={styles.label}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 145"
          value={formData.height_cm}
          onChangeText={(text) => setFormData({ ...formData, height_cm: text })}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 38"
          value={formData.weight_kg}
          onChangeText={(text) => setFormData({ ...formData, weight_kg: text })}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Resting Heart Rate (bpm)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 78"
          value={formData.resting_heart_rate}
          onChangeText={(text) => setFormData({ ...formData, resting_heart_rate: text })}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Blood Pressure — Systolic (mmHg)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 110"
          value={formData.systolic_bp}
          onChangeText={(text) => setFormData({ ...formData, systolic_bp: text })}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Blood Pressure — Diastolic (mmHg)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 70"
          value={formData.diastolic_bp}
          onChangeText={(text) => setFormData({ ...formData, diastolic_bp: text })}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Sleep (hours/day)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 8"
          value={formData.sleep_hours}
          onChangeText={(text) => setFormData({ ...formData, sleep_hours: text })}
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
  excelButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 20,
  },
  excelButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
