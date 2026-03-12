import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ProgressChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { parentAPI } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows, card, iconSizes } from '../styles/theme';

const screenWidth = Dimensions.get('window').width;

export default function RemediesScreen() {
  const [remedies, setRemedies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

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

  const generatePDFHTML = (remedy) => {
    const timestamp = new Date().toLocaleString();
    const activities = remedy.targeted_sel_activities || [];
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              padding: 40px;
              color: #0F172A;
              line-height: 1.6;
            }
            .header {
              background: linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%);
              color: white;
              padding: 30px;
              border-radius: 12px;
              margin-bottom: 30px;
            }
            .header h1 {
              font-size: 28px;
              margin-bottom: 10px;
              font-weight: 700;
            }
            .header .timestamp {
              font-size: 14px;
              opacity: 0.9;
            }
            .section {
              margin-bottom: 30px;
              background: white;
              padding: 25px;
              border-radius: 12px;
              border: 1px solid #E2E8F0;
            }
            .section-title {
              font-size: 20px;
              font-weight: 600;
              color: #1E3A8A;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #E2E8F0;
            }
            .section-content {
              font-size: 15px;
              color: #475569;
              line-height: 1.8;
            }
            .activity {
              background: #F8FAFC;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 15px;
              border-left: 4px solid #1E3A8A;
            }
            .activity-number {
              display: inline-block;
              background: #1E3A8A;
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              text-align: center;
              line-height: 28px;
              font-weight: 700;
              font-size: 14px;
              margin-right: 10px;
            }
            .activity-title {
              font-size: 16px;
              font-weight: 600;
              color: #0F172A;
              margin-bottom: 10px;
            }
            .activity-desc {
              font-size: 14px;
              color: #64748B;
              margin-bottom: 10px;
            }
            .activity-duration {
              display: inline-block;
              background: #E2E8F0;
              padding: 4px 12px;
              border-radius: 6px;
              font-size: 12px;
              color: #475569;
              font-weight: 500;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #E2E8F0;
              text-align: center;
              color: #64748B;
              font-size: 12px;
            }
            @media print {
              body {
                padding: 20px;
              }
              .section {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Student Development Report</h1>
            <div class="timestamp">Generated on: ${timestamp}</div>
          </div>

          <div class="section">
            <div class="section-title">Summary Analysis</div>
            <div class="section-content">${remedy.data_analysis || 'No analysis available'}</div>
          </div>

          <div class="section">
            <div class="section-title">Sub-grouping Recommendation</div>
            <div class="section-content">${remedy.sub_grouping_recommendation || 'No recommendations available'}</div>
          </div>

          <div class="section">
            <div class="section-title">Targeted SEL Activities</div>
            ${activities.map((activity, index) => `
              <div class="activity">
                <div>
                  <span class="activity-number">${index + 1}</span>
                  <span class="activity-title">${activity.title || activity.name || `Activity ${index + 1}`}</span>
                </div>
                ${activity.description ? `<div class="activity-desc">${activity.description}</div>` : ''}
                ${activity.duration ? `<div class="activity-duration">Duration: ${activity.duration}</div>` : ''}
              </div>
            `).join('')}
          </div>

          <div class="section">
            <div class="section-title">Progress Tracking</div>
            <div class="section-content">${remedy.progress_tracking || 'No tracking information available'}</div>
          </div>

          <div class="footer">
            <p>Student Development Tracker - Holistic Assessment Report</p>
            <p>This report is confidential and intended for educational purposes only.</p>
          </div>
        </body>
      </html>
    `;
  };

  const downloadPDF = async () => {
    if (!remedies[0]) {
      Alert.alert('No Report', 'Please generate a report first before downloading.');
      return;
    }

    setDownloadingPDF(true);
    try {
      const html = generatePDFHTML(remedies[0]);
      const { uri } = await Print.printToFileAsync({ html });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const fileName = `Student_Report_${timestamp}.pdf`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });

      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(newPath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Student Report',
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

  // Extract competency data for progress chart
  const getCompetencyData = (remedy) => {
    if (!remedy?.competency_scores) return null;
    
    const scores = remedy.competency_scores;
    const data = {};
    const labels = [];
    const colors_array = [colors.primary, colors.secondary, colors.accent, colors.eq, colors.iq];
    
    Object.entries(scores).slice(0, 5).forEach(([key, value]) => {
      const normalizedScore = typeof value === 'number' ? value / 100 : 0;
      data[key] = normalizedScore;
      labels.push(key);
    });

    return {
      labels,
      data,
      colors: labels.map((_, i) => colors_array[i % colors_array.length]),
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const latestRemedy = remedies[0];
  const competencyData = latestRemedy ? getCompetencyData(latestRemedy) : null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Actionable Remedies</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.generateButton, generating && styles.buttonDisabled]}
              onPress={generateNewReport}
              disabled={generating}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={iconSizes.sm} color={colors.primary} />
              <Text style={styles.generateButtonText}>
                {generating ? 'Generating...' : 'Generate Report'}
              </Text>
            </TouchableOpacity>
            
            {latestRemedy && (
              <TouchableOpacity
                style={[styles.downloadButton, downloadingPDF && styles.buttonDisabled]}
                onPress={downloadPDF}
                disabled={downloadingPDF}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={downloadingPDF ? "hourglass-outline" : "download-outline"} 
                  size={iconSizes.sm} 
                  color={colors.white} 
                />
                <Text style={styles.downloadButtonText}>
                  {downloadingPDF ? 'Generating...' : 'Download PDF'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {latestRemedy ? (
          <>
            {/* Competency Progress Chart */}
            {competencyData && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="stats-chart" size={iconSizes.md} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Competency Overview</Text>
                </View>
                <View style={styles.chartCard}>
                  <ProgressChart
                    data={competencyData}
                    width={screenWidth - spacing.xl * 4}
                    height={220}
                    strokeWidth={16}
                    radius={32}
                    chartConfig={{
                      backgroundColor: colors.surface,
                      backgroundGradientFrom: colors.surface,
                      backgroundGradientTo: colors.surface,
                      color: (opacity = 1, index) => {
                        return competencyData.colors[index] || colors.primary;
                      },
                      labelColor: () => colors.textSecondary,
                      style: {
                        borderRadius: borderRadius.md,
                      },
                    }}
                    hideLegend={false}
                  />
                </View>
              </View>
            )}

            {/* Summary Analysis */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="analytics-outline" size={iconSizes.md} color={colors.primary} />
                <Text style={styles.sectionTitle}>Summary Analysis</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardText}>{latestRemedy.data_analysis}</Text>
              </View>
            </View>

            {/* Sub-grouping Recommendation */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people-outline" size={iconSizes.md} color={colors.primary} />
                <Text style={styles.sectionTitle}>Sub-grouping Recommendation</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardText}>
                  {latestRemedy.sub_grouping_recommendation}
                </Text>
              </View>
            </View>

            {/* Targeted SEL Activities */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb-outline" size={iconSizes.md} color={colors.primary} />
                <Text style={styles.sectionTitle}>Targeted SEL Activities</Text>
              </View>
              {latestRemedy.targeted_sel_activities.map((activity, index) => (
                <View key={index} style={styles.activityCard}>
                  <View style={styles.activityHeader}>
                    <View style={styles.activityNumber}>
                      <Text style={styles.activityNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.activityTitle}>
                      {activity.title || activity.name || `Activity ${index + 1}`}
                    </Text>
                  </View>
                  {activity.description && (
                    <Text style={styles.activityDesc}>{activity.description}</Text>
                  )}
                  {activity.duration && (
                    <View style={styles.durationBadge}>
                      <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                      <Text style={styles.durationText}>{activity.duration}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Progress Tracking */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trending-up-outline" size={iconSizes.md} color={colors.primary} />
                <Text style={styles.sectionTitle}>Progress Tracking</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardText}>{latestRemedy.progress_tracking}</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="document-text-outline" size={iconSizes.xxl * 2} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyText}>No reports available yet</Text>
            <Text style={styles.emptySubtext}>Generate a report to see personalized recommendations</Text>
          </View>
        )}
      </ScrollView>
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
    paddingTop: spacing.xxxl + spacing.xl,
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    marginBottom: spacing.lg,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  generateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  downloadButtonText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  section: {
    marginBottom: spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  chartCard: {
    ...card,
    padding: spacing.lg,
    alignItems: 'center',
  },
  card: {
    ...card,
    padding: spacing.xl,
  },
  cardText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  activityCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  activityNumber: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityNumberText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '700',
  },
  activityTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    flex: 1,
  },
  activityDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  durationText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyContainer: {
    ...card,
    padding: spacing.xxxl * 2,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emptyIconContainer: {
    marginBottom: spacing.xl,
  },
  emptyText: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
