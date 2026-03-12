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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ProgressChart, BarChart, PieChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { parentAPI } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows, card, iconSizes } from '../styles/theme';

const screenWidth = Dimensions.get('window').width;

// Helper function to extract visuals from text or use provided visuals
const extractOrGenerateVisuals = (remedy) => {
  console.log('\n========================================');
  console.log('📊 REMEDIES CHART EXTRACTION DEBUG');
  console.log('========================================');
  
  if (remedy.is_fallback) {
    console.log('⚠️  FALLBACK REPORT DETECTED');
    console.log('Reason:', remedy.fallback_reason || 'Unknown');
  } else {
    console.log('✅ REAL LLM REPORT');
  }
  
  console.log('\nRemedy Fields:', Object.keys(remedy || {}).join(', '));
  console.log('Visuals Field:', remedy.visuals ? `Array[${remedy.visuals.length}]` : 'Missing');
  
  // First, check if visuals field exists and has data
  if (remedy.visuals && Array.isArray(remedy.visuals) && remedy.visuals.length > 0) {
    console.log('\n✅ Using visuals from remedy.visuals field');
    console.log('\n📈 Chart Data:');
    remedy.visuals.forEach((visual, idx) => {
      console.log(`\n  Chart ${idx + 1}: ${visual.chartTitle}`);
      console.log(`  Type: ${visual.chartType}`);
      console.log(`  Labels: ${visual.labels.join(', ')}`);
      console.log(`  Data: ${visual.datasets[0].data.join(', ')}`);
    });
    console.log('========================================\n');
    return remedy.visuals;
  }
  
  console.log('\n⚠️  No visuals in remedy.visuals field');
  
  // Try to extract from JSON block in data_analysis
  if (remedy.data_analysis) {
    console.log('Checking data_analysis for embedded JSON...');
    const jsonMatch = remedy.data_analysis.match(/```json\s*\n?([\s\S]*?)\n?```/);
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
      chartTitle: 'Core EmoSocio Parameters',
      labels: ['Relationships', 'Teamwork', 'Empathy', 'Emotional Reg', 'Self-Awareness'],
      datasets: [{ data: [75, 80, 65, 70, 85] }]
    },
    {
      chartType: 'pie',
      chartTitle: 'Overall Score Distribution',
      labels: ['Mastered (High)', 'Developing (Moderate)', 'Needs Focus (Low)'],
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
  
  // Match Markdown image syntax: ![alt text](url)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const match = imageRegex.exec(cleanText);
  
  if (match) {
    const imageUrl = match[2];
    // Remove the image markdown from text
    cleanText = cleanText.replace(imageRegex, '').trim();
    return { text: cleanText, imageUrl };
  }
  
  return { text: cleanText, imageUrl: null };
};

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
    // Format timestamp in IST
    const timestamp = new Date(remedy.generated_at || new Date()).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
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
            <div class="section-content">${(() => {
              const { text, imageUrl } = extractImageFromMarkdown(remedy.data_analysis || 'No analysis available');
              let html = text;
              if (imageUrl) {
                html += `<br/><br/><img src="${imageUrl}" alt="Emotional Insight" style="max-width: 100%; height: auto; border-radius: 8px; margin-top: 16px;"/>
                <p style="text-align: center; font-size: 12px; color: #64748B; font-style: italic; margin-top: 8px;">Emotional Insight</p>`;
              }
              return html;
            })()}</div>
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
      const timestamp = istDate.replace(/[/,:\s]/g, '-');
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
            {/* Chart Data Visualizations - ALWAYS SHOW */}
            {(() => {
              const visuals = extractOrGenerateVisuals(latestRemedy);
              console.log('Remedies - Final visuals to render:', visuals);
              
              return (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="bar-chart" size={iconSizes.md} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Performance Analytics</Text>
                  </View>
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
                              width={screenWidth - spacing.xl * 4 - 50}
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
                            width={screenWidth - spacing.xl * 4}
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
                {(() => {
                  const { text, imageUrl } = extractImageFromMarkdown(latestRemedy.data_analysis);
                  return (
                    <>
                      <Text style={styles.cardText}>{text}</Text>
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
