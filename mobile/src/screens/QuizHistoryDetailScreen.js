import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { colors, spacing, borderRadius, typography, shadows, iconSizes } from '../styles/theme';
import { generateComprehensivePDF } from '../utils/pdfGenerator';

const LIKERT_LABELS = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
const screenWidth = Dimensions.get('window').width;

// Helper function to extract visuals from text or use provided visuals
const extractOrGenerateVisuals = (report) => {
  console.log('\n========================================');
  console.log('📊 CHART EXTRACTION DEBUG');
  console.log('========================================');
  
  if (report.is_fallback) {
    console.log('⚠️  FALLBACK REPORT DETECTED');
    console.log('Reason:', report.fallback_reason || 'Unknown');
  } else {
    console.log('✅ REAL LLM REPORT');
  }
  
  console.log('\nReport Fields:', Object.keys(report || {}).join(', '));
  console.log('Visuals Field:', report.visuals ? `Array[${report.visuals.length}]` : 'Missing');
  
  // First, check if visuals field exists and has data
  if (report.visuals && Array.isArray(report.visuals) && report.visuals.length > 0) {
    console.log('\n✅ Using visuals from report.visuals field');
    console.log('\n📈 Chart Data:');
    report.visuals.forEach((visual, idx) => {
      console.log(`\n  Chart ${idx + 1}: ${visual.chartTitle}`);
      console.log(`  Type: ${visual.chartType}`);
      console.log(`  Labels: ${visual.labels.join(', ')}`);
      console.log(`  Data: ${visual.datasets[0].data.join(', ')}`);
    });
    console.log('========================================\n');
    return report.visuals;
  }
  
  console.log('\n⚠️  No visuals in report.visuals field');
  
  // Try to extract from JSON block in Data_Analysis
  if (report.Data_Analysis) {
    console.log('Checking Data_Analysis for embedded JSON...');
    const jsonMatch = report.Data_Analysis.match(/```json\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      console.log('Found JSON block, attempting to parse...');
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        if (jsonData.visuals && Array.isArray(jsonData.visuals) && jsonData.visuals.length > 0) {
          console.log('\n✅ Extracted visuals from JSON block');
          console.log('\n📈 Chart Data:');
          jsonData.visuals.forEach((visual, idx) => {
            console.log(`\n  Chart ${idx + 1}: ${visual.chartTitle}`);
            console.log(`  Type: ${visual.chartType}`);
            console.log(`  Labels: ${visual.labels.join(', ')}`);
            console.log(`  Data: ${visual.datasets[0].data.join(', ')}`);
          });
          console.log('========================================\n');
          return jsonData.visuals;
        }
      } catch (e) {
        console.error('❌ Failed to parse JSON:', e.message);
      }
    }
  }
  
  // Generate default visuals based on test data
  console.log('\n⚠️  Using default fallback charts');
  const defaultVisuals = [
    {
      chartType: 'bar',
      chartTitle: 'Assessment Performance',
      labels: ['Empathy', 'Teamwork', 'Self-Awareness', 'Emotional Reg', 'Relationships'],
      datasets: [{ data: [75, 80, 70, 65, 85] }]
    },
    {
      chartType: 'pie',
      chartTitle: 'Score Distribution',
      labels: ['Strong', 'Developing', 'Needs Focus'],
      datasets: [{ data: [40, 35, 25] }]
    }
  ];
  console.log('\n📈 Default Chart Data:');
  defaultVisuals.forEach((visual, idx) => {
    console.log(`\n  Chart ${idx + 1}: ${visual.chartTitle}`);
    console.log(`  Type: ${visual.chartType}`);
    console.log(`  Labels: ${visual.labels.join(', ')}`);
    console.log(`  Data: ${visual.datasets[0].data.join(', ')}`);
  });
  console.log('========================================\n');
  return defaultVisuals;
};

// Helper function to extract image URL from Markdown syntax
const extractImageFromMarkdown = (text) => {
  if (!text) return { text, imageUrl: null };
  
  // First, remove any JSON blocks that might still be in the text
  let cleanText = text.replace(/```json[\s\S]*?```/g, '').trim();
  
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const match = imageRegex.exec(cleanText);
  
  if (match) {
    const imageUrl = match[2];
    cleanText = cleanText.replace(imageRegex, '').trim();
    return { text: cleanText, imageUrl };
  }
  
  return { text: cleanText, imageUrl: null };
};

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  
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

  const downloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      // Generate IST timestamp for filename
      const istDate = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const fileTimestamp = istDate.replace(/[/,:\s]/g, '-');
      
      // Generate comprehensive PDF HTML
      const html = generateComprehensivePDF(
        item,
        report,
        questions,
        answers,
        score,
        isAttempt,
        LIKERT_LABELS,
        extractImageFromMarkdown,
        extractOrGenerateVisuals
      );

      const { uri } = await Print.printToFileAsync({ html });
      
      const fileName = `Quiz_Report_${fileTimestamp}.pdf`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });

      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(newPath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Quiz Report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        await Sharing.shareAsync(newPath);
      }

      Alert.alert('Success', 'Report PDF has been generated and saved!');
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const hasReport = report.Data_Analysis || report.Sub_grouping_Recommendation || 
                    (report.Targeted_SEL_Activities && report.Targeted_SEL_Activities.length > 0) ||
                    report.Progress_Tracking;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Download PDF Button */}
      {hasReport && (
        <TouchableOpacity
          style={[styles.downloadButton, downloadingPDF && styles.buttonDisabled]}
          onPress={downloadPDF}
          disabled={downloadingPDF}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={downloadingPDF ? "hourglass-outline" : "download-outline"} 
            size={iconSizes.md} 
            color={colors.white} 
          />
          <Text style={styles.downloadButtonText}>
            {downloadingPDF ? 'Generating PDF...' : 'Download PDF Report'}
          </Text>
        </TouchableOpacity>
      )}

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
              
              {/* Chart Data Visualizations - ALWAYS SHOW */}
              {(() => {
                const visuals = extractOrGenerateVisuals(report);
                console.log('Final visuals to render:', visuals);
                
                return (
                  <View style={styles.chartsContainer}>
                    {visuals.map((visual, index) => (
                      <View key={index} style={styles.chartCard}>
                        <Text style={styles.chartTitle}>{visual.chartTitle}</Text>
                        {visual.chartType === 'bar' && (
                          <View style={styles.barChartWrapper}>
                            <View style={styles.yAxisLabelContainer}>
                              <Text style={styles.yAxisLabelText}>Score (0-100)</Text>
                            </View>
                            <View style={styles.chartContent}>
                              <BarChart
                                data={{
                                  labels: visual.labels,
                                  datasets: visual.datasets,
                                }}
                                width={screenWidth - spacing.xl * 2 - 90}
                                height={240}
                                chartConfig={{
                                  backgroundColor: '#ffffff',
                                  backgroundGradientFrom: '#ffffff',
                                  backgroundGradientTo: '#f8fafc',
                                  decimalPlaces: 0,
                                  color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
                                  labelColor: () => '#475569',
                                  style: {
                                    borderRadius: borderRadius.md,
                                  },
                                  propsForLabels: {
                                    fontSize: 10,
                                    fontWeight: '600',
                                  },
                                  propsForVerticalLabels: {
                                    fontSize: 10,
                                    fontWeight: '500',
                                  },
                                  barPercentage: 0.6,
                                }}
                                style={{
                                  marginVertical: spacing.sm,
                                  borderRadius: borderRadius.md,
                                }}
                                showValuesOnTopOfBars
                                fromZero
                                verticalLabelRotation={20}
                                yAxisSuffix=""
                                withInnerLines={true}
                              />
                              <Text style={styles.xAxisLabelText}>EmoSocio Parameters</Text>
                            </View>
                          </View>
                        )}
                        {visual.chartType === 'pie' && (
                          <View style={styles.pieChartWrapper}>
                            <PieChart
                              data={visual.labels.map((label, idx) => {
                                const colors_pie = ['#1E3A8A', '#0D9488', '#D97706'];
                                return {
                                  name: label,
                                  population: visual.datasets[0].data[idx],
                                  color: colors_pie[idx % 3],
                                  legendFontColor: '#475569',
                                  legendFontSize: 12,
                                  legendFontWeight: '600',
                                };
                              })}
                              width={screenWidth - spacing.xl * 2 - 32}
                              height={220}
                              chartConfig={{
                                color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
                              }}
                              accessor="population"
                              backgroundColor="transparent"
                              paddingLeft="15"
                              center={[5, 0]}
                              absolute
                              hasLegend={true}
                              style={{
                                marginVertical: spacing.sm,
                                borderRadius: borderRadius.md,
                              }}
                            />
                            <Text style={styles.pieChartNote}>
                              Values represent percentage distribution
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                );
              })()}
              
              {report.Data_Analysis ? (
                <View style={styles.reportCard}>
                  <Text style={styles.cardTitle}>Data analysis</Text>
                  {(() => {
                    const { text, imageUrl } = extractImageFromMarkdown(report.Data_Analysis);
                    return (
                      <>
                        <Text style={styles.reportBody}>{text}</Text>
                        {imageUrl && (
                          <View style={styles.imageContainer}>
                            <Image
                              source={{ uri: imageUrl }}
                              style={styles.emotionalImage}
                              resizeMode="cover"
                            />
                            <Text style={styles.imageCaption}>Emotional Insight</Text>
                          </View>
                        )}
                      </>
                    );
                  })()}
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
              {(() => {
                const { text, imageUrl } = extractImageFromMarkdown(report.Data_Analysis);
                return (
                  <>
                    <Text style={styles.reportBody}>{text}</Text>
                    {imageUrl && (
                      <View style={styles.imageContainer}>
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.emotionalImage}
                          resizeMode="cover"
                        />
                        <Text style={styles.imageCaption}>Emotional Insight</Text>
                      </View>
                    )}
                  </>
                );
              })()}
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
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  downloadButtonText: {
    ...typography.button,
    color: colors.white,
  },
  chartsContainer: {
    marginBottom: spacing.lg,
  },
  chartCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    alignItems: 'center',
  },
  chartTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  barChartWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginTop: spacing.sm,
  },
  yAxisLabelContainer: {
    width: 50,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yAxisLabelText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 11,
    transform: [{ rotate: '-90deg' }],
    width: 100,
    textAlign: 'center',
  },
  chartContent: {
    flex: 1,
    alignItems: 'center',
  },
  xAxisLabelText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  pieChartWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  pieChartNote: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 10,
    marginTop: spacing.xs,
  },
  imageContainer: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  emotionalImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
  },
  imageCaption: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});