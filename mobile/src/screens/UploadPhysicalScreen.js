import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { teacherAPI } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows, card, iconSizes } from '../styles/theme';

const screenWidth = Dimensions.get('window').width;

export default function UploadPhysicalScreen({ route, navigation }) {
  const { apaarId, student } = route.params;
  const studentApaarId = apaarId || student?.apaar_id;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingData, setExistingData] = useState(null);
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  
  const [formData, setFormData] = useState({
    bmi: '',
    fitness_score: '',
    height_cm: '',
    weight_kg: '',
    resting_heart_rate: '',
    systolic_bp: '',
    diastolic_bp: '',
    sleep_hours: '',
    health_notes: '',
  });

  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      const response = await teacherAPI.getPhysicalTest(studentApaarId);
      console.log('📊 Physical Test Response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.has_data) {
        const data = response.data.data;
        const metrics = data.physical_metrics || {};
        
        console.log('✅ Physical metrics:', JSON.stringify(metrics, null, 2));
        
        setExistingData(data);
        setFormData({
          bmi: metrics.bmi?.toString() || '',
          fitness_score: metrics.fitness_score?.toString() || '',
          height_cm: metrics.height_cm?.toString() || '',
          weight_kg: metrics.weight_kg?.toString() || '',
          resting_heart_rate: metrics.resting_heart_rate?.toString() || '',
          systolic_bp: metrics.systolic_bp?.toString() || '',
          diastolic_bp: metrics.diastolic_bp?.toString() || '',
          sleep_hours: metrics.sleep_hours?.toString() || '',
          health_notes: data.notes || '',
        });
      }
    } catch (error) {
      console.log('No existing physical data found');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => {
    const payload = {
      apaar_id: studentApaarId,
      test_type: 'physical',
    };

    // Add all 8 parameters at top level
    if (formData.bmi) payload.bmi = parseFloat(formData.bmi);
    if (formData.fitness_score) payload.fitness_score = parseFloat(formData.fitness_score);
    if (formData.height_cm) payload.height_cm = parseFloat(formData.height_cm);
    if (formData.weight_kg) payload.weight_kg = parseFloat(formData.weight_kg);
    if (formData.resting_heart_rate) payload.resting_heart_rate = parseInt(formData.resting_heart_rate);
    if (formData.systolic_bp) payload.systolic_bp = parseInt(formData.systolic_bp);
    if (formData.diastolic_bp) payload.diastolic_bp = parseInt(formData.diastolic_bp);
    if (formData.sleep_hours) payload.sleep_hours = parseFloat(formData.sleep_hours);
    if (formData.health_notes) payload.notes = formData.health_notes;

    console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));
    return payload;
  };

  const handleSubmit = async () => {
    if (!formData.bmi || !formData.fitness_score) {
      Alert.alert('Error', 'Please fill in at least BMI and Fitness Score');
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload();
      await teacherAPI.uploadPhysicalTest(payload);
      
      Alert.alert('Success', 'Physical test data uploaded successfully', [
        {
          text: 'OK',
          onPress: async () => {
            await loadExistingData();
            setIsEditMode(false);
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to upload physical test data');
    } finally {
      setSubmitting(false);
    }
  };

  const renderMetricCard = (icon, label, value, unit = '') => (
    <View style={styles.metricItem}>
      <View style={[styles.metricIconContainer, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name={icon} size={iconSizes.lg} color={colors.primary} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>
        {value ? `${value}${unit}` : '—'}
      </Text>
    </View>
  );

  const renderInputField = (label, field, placeholder, keyboardType = 'numeric', icon) => (
    <View style={styles.inputContainer}>
      <View style={styles.inputHeader}>
        <Ionicons name={icon} size={iconSizes.md} color={colors.primary} style={styles.inputIcon} />
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      <TextInput
        style={styles.input}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
      />
    </View>
  );

  const formatNutritionText = (text) => {
    if (!text) return '';
    
    // Remove markdown bold syntax
    let formatted = text.replace(/\*\*(.+?)\*\*/g, '$1');
    
    // Remove extra asterisks
    formatted = formatted.replace(/\*/g, '');
    
    return formatted;
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return 'Not Available';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Healthy Weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const getBMICategoryColor = (bmi) => {
    if (!bmi) return colors.textSecondary;
    if (bmi < 18.5) return colors.warning;
    if (bmi < 25) return colors.success;
    if (bmi < 30) return colors.warning;
    return colors.error;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // View Mode - Show existing data
  if (existingData && !isEditMode) {
    const metrics = existingData.physical_metrics || {};
    
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="fitness" size={iconSizes.xxl} color={colors.primary} />
          <Text style={styles.title}>Physical Health Data</Text>
          <Text style={styles.subtitle}>APAAR ID: {studentApaarId}</Text>
        </View>

        <View style={styles.metricsCard}>
          <View style={styles.metricsRow}>
            {renderMetricCard('fitness', 'BMI', metrics.bmi)}
            {renderMetricCard('trophy', 'Fitness Score', metrics.fitness_score)}
          </View>
          <View style={styles.metricsDivider} />
          
          <View style={styles.metricsRow}>
            {renderMetricCard('resize', 'Height', metrics.height_cm, ' cm')}
            {renderMetricCard('scale', 'Weight', metrics.weight_kg, ' kg')}
          </View>
          <View style={styles.metricsDivider} />
          
          <View style={styles.metricsRow}>
            {renderMetricCard('heart', 'Heart Rate', metrics.resting_heart_rate, ' bpm')}
            {renderMetricCard('pulse', 'BP Systolic', metrics.systolic_bp, ' mmHg')}
          </View>
          <View style={styles.metricsDivider} />
          
          <View style={styles.metricsRow}>
            {renderMetricCard('pulse', 'BP Diastolic', metrics.diastolic_bp, ' mmHg')}
            {renderMetricCard('moon', 'Sleep', metrics.sleep_hours, ' hrs')}
          </View>
        </View>

        {existingData.notes && (
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <Ionicons name="document-text" size={iconSizes.md} color={colors.secondary} style={styles.notesIcon} />
              <Text style={styles.notesTitle}>Health Notes</Text>
            </View>
            <Text style={styles.notesText}>{existingData.notes}</Text>
          </View>
        )}

        {existingData.physical_advice && (
          <View style={styles.adviceCard}>
            <View style={styles.adviceHeader}>
              <Ionicons name="bulb" size={iconSizes.md} color={colors.accent} style={styles.adviceIcon} />
              <Text style={styles.adviceTitle}>AI Health Advice</Text>
            </View>
            <Text style={styles.adviceText}>{existingData.physical_advice.Summary}</Text>
          </View>
        )}

        {/* BMI Classification Card */}
        {metrics.bmi && (
          <View style={styles.bmiCard}>
            <View style={styles.bmiHeader}>
              <Ionicons name="analytics" size={iconSizes.md} color={getBMICategoryColor(metrics.bmi)} style={styles.bmiIcon} />
              <Text style={styles.bmiTitle}>BMI Classification</Text>
            </View>
            <View style={styles.bmiContent}>
              <Text style={styles.bmiValue}>{metrics.bmi}</Text>
              <View style={[styles.bmiCategoryBadge, { backgroundColor: getBMICategoryColor(metrics.bmi) + '20' }]}>
                <Text style={[styles.bmiCategoryText, { color: getBMICategoryColor(metrics.bmi) }]}>
                  {getBMICategory(metrics.bmi)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Nutrition Plan Section */}
        {existingData.nutrition_plan && !existingData.nutrition_plan.is_fallback && (
          <View style={styles.nutritionSection}>
            <View style={styles.nutritionHeader}>
              <Ionicons name="restaurant" size={iconSizes.md} color={colors.secondary} style={styles.nutritionHeaderIcon} />
              <Text style={styles.nutritionTitle}>Personalized Nutrition Plan</Text>
            </View>
            <Text style={styles.nutritionSummary}>
              {formatNutritionText(existingData.nutrition_plan.ui_summary)}
            </Text>
            <TouchableOpacity
              style={styles.viewPlanButton}
              onPress={() => setShowNutritionModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.viewPlanButtonText}>View Full Diet Plan</Text>
              <Ionicons name="arrow-forward" size={iconSizes.sm} color={colors.primary} style={styles.viewPlanButtonIcon} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditMode(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="create" size={iconSizes.md} color={colors.white} style={styles.editButtonIcon} />
          <Text style={styles.editButtonText}>Edit Data</Text>
        </TouchableOpacity>

        {/* Nutrition Plan Modal */}
        <Modal
          visible={showNutritionModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowNutritionModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nutrition & Diet Plan</Text>
              <TouchableOpacity
                onPress={() => setShowNutritionModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={iconSizes.lg} color={colors.white} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
              {/* Visual Data - Pie Chart */}
              {existingData.nutrition_plan?.visuals && existingData.nutrition_plan.visuals.length > 0 && (
                <View style={styles.chartSection}>
                  {existingData.nutrition_plan.visuals.map((visual, index) => {
                    if (visual.chartType === 'pie') {
                      const pieColors = ['#1E3A8A', '#0D9488', '#D97706'];
                      const pieData = visual.labels.map((label, idx) => ({
                        name: label,
                        population: visual.datasets[0].data[idx],
                        color: pieColors[idx % 3],
                        legendFontColor: colors.textPrimary,
                        legendFontSize: 13,
                      }));
                      
                      return (
                        <View key={index} style={styles.chartCard}>
                          <Text style={styles.chartTitle}>{visual.chartTitle}</Text>
                          <PieChart
                            data={pieData}
                            width={screenWidth - spacing.xl * 2}
                            height={220}
                            chartConfig={{
                              color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
                            }}
                            accessor="population"
                            backgroundColor="transparent"
                            paddingLeft="15"
                            center={[10, 0]}
                            absolute
                            hasLegend={true}
                          />
                        </View>
                      );
                    }
                    return null;
                  })}
                </View>
              )}
              
              {/* Detailed Report Text */}
              <Text style={styles.modalText}>
                {formatNutritionText(existingData.nutrition_plan?.detailed_report || '')}
              </Text>
            </ScrollView>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  // Edit/Create Mode - Show form
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="fitness" size={iconSizes.xxl} color={colors.primary} />
        <Text style={styles.title}>
          {existingData ? 'Edit Physical Data' : 'Upload Physical Test'}
        </Text>
        <Text style={styles.subtitle}>APAAR ID: {studentApaarId}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Required Metrics</Text>
        {renderInputField('BMI', 'bmi', 'e.g., 22.5', 'decimal-pad', 'fitness')}
        {renderInputField('Fitness Score', 'fitness_score', 'e.g., 85', 'decimal-pad', 'trophy')}

        <Text style={styles.sectionTitle}>Body Measurements</Text>
        {renderInputField('Height (cm)', 'height_cm', 'e.g., 165', 'decimal-pad', 'resize')}
        {renderInputField('Weight (kg)', 'weight_kg', 'e.g., 60', 'decimal-pad', 'scale')}

        <Text style={styles.sectionTitle}>Vital Signs</Text>
        {renderInputField('Resting Heart Rate (bpm)', 'resting_heart_rate', 'e.g., 72', 'number-pad', 'heart')}
        {renderInputField('Systolic BP (mmHg)', 'systolic_bp', 'e.g., 120', 'number-pad', 'pulse')}
        {renderInputField('Diastolic BP (mmHg)', 'diastolic_bp', 'e.g., 80', 'number-pad', 'pulse')}

        <Text style={styles.sectionTitle}>Lifestyle</Text>
        {renderInputField('Sleep Hours', 'sleep_hours', 'e.g., 7.5', 'decimal-pad', 'moon')}

        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Ionicons name="document-text" size={iconSizes.md} color={colors.primary} style={styles.inputIcon} />
            <Text style={styles.inputLabel}>Health Notes (Optional)</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.health_notes}
            onChangeText={(value) => handleInputChange('health_notes', value)}
            placeholder="Any additional health observations..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={iconSizes.md} color={colors.white} style={styles.submitButtonIcon} />
              <Text style={styles.submitButtonText}>
                {existingData ? 'Update Data' : 'Submit Data'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {existingData && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setIsEditMode(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle" size={iconSizes.md} color={colors.primary} style={styles.cancelButtonIcon} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
  content: {
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  metricsCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricsDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.lg,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  metricIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  metricValue: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  notesCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.secondary + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  notesIcon: {
    marginRight: spacing.sm,
  },
  notesTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  notesText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  adviceCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.warning + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  adviceIcon: {
    marginRight: spacing.sm,
  },
  adviceTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  adviceText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  editButtonIcon: {
    marginRight: spacing.sm,
  },
  editButtonText: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '600',
  },
  form: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  inputLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  input: {
    ...card,
    ...typography.body,
    color: colors.textPrimary,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.md,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
    ...shadows.md,
  },
  submitButtonIcon: {
    marginRight: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  cancelButtonIcon: {
    marginRight: spacing.sm,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  bmiCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.primaryLight + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryLight,
  },
  bmiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bmiIcon: {
    marginRight: spacing.sm,
  },
  bmiTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  bmiContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bmiValue: {
    ...typography.h1,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  bmiCategoryBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  bmiCategoryText: {
    ...typography.body,
    fontWeight: '600',
  },
  nutritionSection: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.secondary + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nutritionHeaderIcon: {
    marginRight: spacing.sm,
  },
  nutritionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  nutritionSummary: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  viewPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  viewPlanButtonIcon: {
    marginLeft: spacing.sm,
  },
  viewPlanButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xxxl + spacing.xl,
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.white,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: spacing.xl,
  },
  modalText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  chartSection: {
    marginBottom: spacing.xl,
  },
  chartCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  chartTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
