import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { teacherAPI } from '../api/client';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';
import { colors, spacing, borderRadius, typography, shadows, glassCard } from '../styles/theme';

export default function TeacherDashboardScreen({ navigation }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await teacherAPI.getStudents();
      setStudents(response.data.students);
    } catch (error) {
      Alert.alert('Error', 'Failed to load students');
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

  const uploadBulkFromExcel = async () => {
    try {
      setUploading(true);
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

      const items = rows.map((row) => {
        const mapped = {};
        Object.keys(row).forEach((key) => {
          mapped[normalizeKey(key)] = row[key];
        });

        const email = parseStrOrNull(mapped.email);
        const apaar_id = parseStrOrNull(mapped.apaar_id || mapped.apaar);

        const additional_metrics = {};
        const height_cm = parseNumOrNull(mapped.height_cm || mapped.height);
        const weight_kg = parseNumOrNull(mapped.weight_kg || mapped.weight);
        const resting_heart_rate = parseNumOrNull(
          mapped.resting_heart_rate || mapped.restinghr || mapped.heart_rate
        );
        const systolic_bp = parseNumOrNull(mapped.systolic_bp || mapped.bp_systolic);
        const diastolic_bp = parseNumOrNull(mapped.diastolic_bp || mapped.bp_diastolic);
        const sleep_hours = parseNumOrNull(mapped.sleep_hours || mapped.sleep);

        if (height_cm !== null) additional_metrics.height_cm = height_cm;
        if (weight_kg !== null) additional_metrics.weight_kg = weight_kg;
        if (resting_heart_rate !== null) additional_metrics.resting_heart_rate = resting_heart_rate;
        if (systolic_bp !== null) additional_metrics.systolic_bp = systolic_bp;
        if (diastolic_bp !== null) additional_metrics.diastolic_bp = diastolic_bp;
        if (sleep_hours !== null) additional_metrics.sleep_hours = sleep_hours;

        return {
          email,
          apaar_id,
          bmi: parseNumOrNull(mapped.bmi),
          fitness_score: parseNumOrNull(mapped.fitness_score || mapped.fitnessscore),
          health_notes: parseStrOrNull(mapped.health_notes || mapped.notes),
          height_cm,
          weight_kg,
          resting_heart_rate,
          systolic_bp,
          diastolic_bp,
          sleep_hours,
          additional_metrics: Object.keys(additional_metrics).length ? additional_metrics : null,
        };
      });

      const response = await teacherAPI.uploadPhysicalTestsBulk(items);
      const { inserted, failed, errors } = response.data || {};
      if (failed && errors && errors.length) {
        const preview = errors
          .slice(0, 5)
          .map((e) => `Row ${e.row}: ${e.error}`)
          .join('\n');
        Alert.alert(
          'Upload completed',
          `Inserted: ${inserted || 0}\nFailed: ${failed || 0}\n\nFirst errors:\n${preview}`
        );
      } else {
        Alert.alert('Upload completed', `Inserted: ${inserted || 0}\nFailed: ${failed || 0}`);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to upload from Excel');
    } finally {
      setUploading(false);
    }
  };

  const renderStudent = ({ item }) => (
    <TouchableOpacity
      style={styles.studentCard}
      onPress={() => navigation.navigate('UploadPhysical', { student: item })}
      activeOpacity={0.7}
    >
      <View style={styles.studentAvatar}>
        <Text style={styles.studentAvatarText}>
          {item.full_name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.full_name}</Text>
        <Text style={styles.studentDetail}>APAAR ID: {item.apaar_id}</Text>
        <Text style={styles.studentDetail}>Grade: {item.grade}</Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );

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
          <Text style={styles.title}>Student Directory</Text>
          <Text style={styles.subtitle}>Select a student to upload physical test data</Text>

          <TouchableOpacity
            style={[styles.excelButton, uploading && styles.buttonDisabled]}
            onPress={uploadBulkFromExcel}
            disabled={uploading}
            activeOpacity={0.7}
          >
            <Text style={styles.excelButtonText}>
              {uploading ? '⏳ Uploading...' : '📊 Upload from Excel'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={students}
        renderItem={renderStudent}
        keyExtractor={(item) => item.apaar_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        }
      />
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
    marginBottom: spacing.md,
  },
  excelButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    ...shadows.small,
  },
  excelButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  listContent: {
    padding: spacing.lg,
  },
  studentCard: {
    ...glassCard,
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  studentAvatarText: {
    ...typography.h2,
    color: colors.white,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  studentDetail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  arrow: {
    ...typography.h2,
    color: colors.primary,
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
  },
});
