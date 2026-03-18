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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { parentAPI, studentAPI } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows, card, iconSizes } from '../styles/theme';

// Safely import charts with error handling
let LineChart, PieChart;
try {
  const charts = require('react-native-chart-kit');
  LineChart = charts.LineChart;
  PieChart = charts.PieChart;
} catch (error) {
  console.warn('Chart library not available:', error);
  LineChart = null;
  PieChart = null;
}

const screenWidth = Dimensions.get('window').width;

export default function ParentDashboardScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [remedies, setRemedies] = useState({ mental: [], physical: [] });
  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(0);
  const [semesterData, setSemesterData] = useState([]);
  const [trendInsights, setTrendInsights] = useState(null);
  const [healthSummary, setHealthSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const generateHealthSummary = (results, remediesData) => {
    try {
      // Calculate overall health status
      const mentalTests = results.filter(r => r.test_type === 'eq' || r.test_type === 'iq');
      const physicalTests = results.filter(r => r.test_type === 'physical');
      
      const mentalScores = mentalTests.filter(t => t.score).map(t => t.score);
      const avgMentalScore = mentalScores.length > 0 
        ? mentalScores.reduce((a, b) => a + b, 0) / mentalScores.length 
        : 0;
      
      const physicalScores = physicalTests.filter(t => t.score).map(t => t.score);
      const avgPhysicalScore = physicalScores.length > 0 
        ? physicalScores.reduce((a, b) => a + b, 0) / physicalScores.length 
        : 0;
      
      // Determine status
      const getMentalStatus = (score) => {
        if (score >= 80) return { text: 'Excellent', emoji: '🌟', color: colors.success };
        if (score >= 65) return { text: 'Good', emoji: '😊', color: colors.primary };
        if (score >= 50) return { text: 'Fair', emoji: '🙂', color: colors.warning };
        return { text: 'Needs Support', emoji: '💙', color: colors.error };
      };
      
      const getPhysicalStatus = (score) => {
        if (score >= 80) return { text: 'Healthy', emoji: '💪', color: colors.success };
        if (score >= 65) return { text: 'Good', emoji: '🏃', color: colors.primary };
        if (score >= 50) return { text: 'Fair', emoji: '🚶', color: colors.warning };
        return { text: 'Needs Attention', emoji: '🏥', color: colors.error };
      };
      
      const mentalStatus = getMentalStatus(avgMentalScore);
      const physicalStatus = getPhysicalStatus(avgPhysicalScore);
      
      // Generate AI image prompts
      const mentalImagePrompt = avgMentalScore >= 65 
        ? 'happy child learning emotional intelligence, bright colors, positive atmosphere'
        : 'child receiving emotional support, caring environment, warm colors';
      
      const physicalImagePrompt = avgPhysicalScore >= 65
        ? 'healthy active child playing outdoors, energetic, vibrant'
        : 'child doing gentle exercise, supportive environment, encouraging';
      
      // Pollinations.ai image URLs
      // Add a random seed so a fresh image is generated on every load
const randomSeed = Math.floor(Math.random() * 100000);

const mentalImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(mentalImagePrompt)}?width=400&height=300&nologo=true&seed=${randomSeed}`;

const physicalImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(physicalImagePrompt)}?width=400&height=300&nologo=true&seed=${randomSeed}`;
      
      setHealthSummary({
        mental: {
          status: mentalStatus,
          score: avgMentalScore,
          summary: avgMentalScore >= 65 
            ? 'Your child is showing strong emotional and social development'
            : 'Your child would benefit from additional emotional support activities',
          imageUrl: mentalImageUrl,
          testsCount: mentalTests.length
        },
        physical: {
          status: physicalStatus,
          score: avgPhysicalScore,
          summary: avgPhysicalScore >= 65
            ? 'Your child is maintaining good physical health and fitness'
            : 'Focus on improving physical activity and nutrition habits',
          imageUrl: physicalImageUrl,
          testsCount: physicalTests.length
        }
      });
    } catch (error) {
      console.error('Error generating health summary:', error);
      setHealthSummary(null);
    }
  };

  const loadData = async () => {
    try {
      const [profileRes, resultsRes, remediesRes] = await Promise.all([
        parentAPI.getChildProfile(),
        parentAPI.getTestResults(),
        parentAPI.getRemedies(),
      ]);
      
      setProfile(profileRes.data);
      const results = resultsRes.data.test_results || [];
      setTestResults(results);
      
      // Organize data by semesters (2 tests per semester)
      const organized = organizeBySemester(results);
      setSemesterData(organized);
      
      // Extract actual remedies from database
      await extractActualRemedies(remediesRes.data.remedies || [], results);
      
      // Generate trend insights
      generateTrendInsights(organized);
      
      // Generate health summary with AI images
      generateHealthSummary(results, remediesRes.data.remedies || []);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const organizeBySemester = (results) => {
    const semesters = [];
    const sortedResults = [...results].sort((a, b) => 
      new Date(a.test_date) - new Date(b.test_date)
    );
    
    // Group every 2 tests into a semester
    for (let i = 0; i < sortedResults.length; i += 2) {
      const semesterTests = sortedResults.slice(i, i + 2);
      const age = profile?.age_years || 3 + Math.floor(i / 4); // Estimate age
      const semesterNum = Math.floor((i % 4) / 2) + 1;
      
      semesters.push({
        id: i / 2,
        label: `Age ${age} - Sem ${semesterNum}`,
        age,
        semester: semesterNum,
        tests: semesterTests,
        mentalTests: semesterTests.filter(t => t.test_type === 'eq' || t.test_type === 'iq'),
        physicalTests: semesterTests.filter(t => t.test_type === 'physical'),
      });
    }
    
    return semesters;
  };

  const extractActualRemedies = async (remediesData, results) => {
    try {
      const mental = [];
      const physical = [];
      
      // Extract mental health remedies from actionable_remedies collection
      // Get the most recent remedy report
      if (remediesData.length > 0) {
        const latestRemedy = remediesData[0];
        
        // Extract Targeted SEL Activities (mental health remedies)
        const selActivities = latestRemedy.targeted_sel_activities || [];
        selActivities.forEach(activity => {
          mental.push({
            title: activity.title || activity.name || 'SEL Activity',
            description: activity.description || 'No description available',
            priority: 'high', // Default priority
            duration: activity.duration || ''
          });
        });
      }
      
      // Extract physical health remedies from physical test results
      const physicalTests = results.filter(r => r.test_type === 'physical');
      if (physicalTests.length > 0) {
        // Get the most recent physical test
        const latestPhysical = physicalTests[0];
        
        if (latestPhysical.physical_advice) {
          const advice = latestPhysical.physical_advice;
          
          // Extract advice items
          if (advice.Advice && Array.isArray(advice.Advice)) {
            advice.Advice.slice(0, 3).forEach(item => {
              physical.push({
                title: 'Physical Health Tip',
                description: item,
                priority: 'medium'
              });
            });
          }
          
          // Extract key findings as remedies
          if (advice.Key_Findings && Array.isArray(advice.Key_Findings)) {
            advice.Key_Findings.slice(0, 2).forEach(finding => {
              physical.push({
                title: 'Health Finding',
                description: finding,
                priority: 'high'
              });
            });
          }
        }
        
        // Fetch nutrition plan for the child
        try {
          const nutritionRes = await studentAPI.getPhysicalHealth();
          if (nutritionRes.data.has_data && nutritionRes.data.nutrition_plan) {
            setNutritionPlan(nutritionRes.data.nutrition_plan);
          }
        } catch (error) {
          console.log('Failed to fetch nutrition plan:', error);
        }
      }
      
      // If no remedies found, show placeholder
      if (mental.length === 0) {
        mental.push({
          title: 'Complete assessments',
          description: 'Mental health remedies will appear after completing EQ/IQ tests',
          priority: 'low'
        });
      }
      
      if (physical.length === 0) {
        physical.push({
          title: 'Complete physical assessment',
          description: 'Physical health remedies will appear after completing physical tests',
          priority: 'low'
        });
      }
      
      // Limit to 3 each
      setRemedies({ 
        mental: mental.slice(0, 3), 
        physical: physical.slice(0, 3) 
      });
    } catch (error) {
      console.error('Error extracting remedies:', error);
      // Set default remedies on error
      setRemedies({
        mental: [{
          title: 'Complete assessments',
          description: 'Mental health remedies will appear after completing EQ/IQ tests',
          priority: 'low'
        }],
        physical: [{
          title: 'Complete physical assessment',
          description: 'Physical health remedies will appear after completing physical tests',
          priority: 'low'
        }]
      });
    }
  };

  const generateTrendInsights = (semesters) => {
    try {
      if (semesters.length < 2) {
        setTrendInsights({
          mentalTrend: 'stable',
          physicalTrend: 'stable',
          insights: ['More data needed for trend analysis'],
          chartData: null
        });
        return;
      }
      
      // Calculate average scores per semester
      const mentalScores = semesters.map(sem => {
        const scores = sem.mentalTests.filter(t => t.score).map(t => t.score);
        return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      });
      
      const physicalScores = semesters.map(sem => {
        const scores = sem.physicalTests.filter(t => t.score).map(t => t.score);
        return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50; // Default 50 if no score
      });
      
      // Determine trends
      const mentalTrend = mentalScores[mentalScores.length - 1] > mentalScores[0] ? 'improving' : 
                          mentalScores[mentalScores.length - 1] < mentalScores[0] ? 'declining' : 'stable';
      const physicalTrend = physicalScores[physicalScores.length - 1] > physicalScores[0] ? 'improving' : 
                            physicalScores[physicalScores.length - 1] < physicalScores[0] ? 'declining' : 'stable';
      
      // Generate insights
      const insights = [];
      if (mentalTrend === 'improving') {
        insights.push('✅ Mental health showing positive improvement');
        insights.push('💡 Continue current emotional support activities');
      } else if (mentalTrend === 'declining') {
        insights.push('⚠️ Mental health needs attention');
        insights.push('💡 Increase one-on-one time and emotional check-ins');
      } else {
        insights.push('📊 Mental health is stable');
      }
      
      if (physicalTrend === 'improving') {
        insights.push('✅ Physical health improving well');
        insights.push('💡 Maintain current exercise and nutrition routine');
      } else if (physicalTrend === 'declining') {
        insights.push('⚠️ Physical health needs focus');
        insights.push('💡 Increase physical activity and review diet');
      } else {
        insights.push('📊 Physical health is consistent');
      }
      
      // Prepare chart data
      const chartData = {
        labels: semesters.map(s => `S${s.id + 1}`),
        datasets: [
          {
            data: mentalScores.length > 0 ? mentalScores : [0],
            color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
            strokeWidth: 3,
          },
          {
            data: physicalScores.length > 0 ? physicalScores : [0],
            color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
            strokeWidth: 3,
          },
        ],
        legend: ['Mental Health', 'Physical Health'],
      };
      
      setTrendInsights({ mentalTrend, physicalTrend, insights, chartData });
    } catch (error) {
      console.error('Error generating trend insights:', error);
      setTrendInsights({
        mentalTrend: 'stable',
        physicalTrend: 'stable',
        insights: ['Unable to generate insights at this time'],
        chartData: null
      });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textTertiary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const currentSemester = semesterData[selectedSemester];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary || '#1E3A8A', colors.primaryDark || '#1E40AF']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Child's Progress</Text>
              <Text style={styles.childName}>{profile?.full_name || 'Student'}</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={iconSizes.lg} color={colors.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.idBadge}>
            <Ionicons name="card-outline" size={16} color={colors.white} />
            <Text style={styles.apaarId}>APAAR ID: {profile?.apaar_id}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Health Summary Card with AI Images */}
        {healthSummary && (
          <View style={styles.summarySection}>
            <Text style={styles.summarySectionTitle}>Health Overview</Text>
            
            <View style={styles.summaryCardsContainer}>
              {/* Mental Health Summary */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryImageContainer}>
                  <Image
                    source={{ uri: healthSummary.mental.imageUrl }}
                    style={styles.summaryImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.summaryImageOverlay}
                  />
                  <View style={styles.summaryBadge}>
                    <Text style={styles.summaryEmoji}>{healthSummary.mental.status.emoji}</Text>
                    <Text style={styles.summaryBadgeText}>{healthSummary.mental.status.text}</Text>
                  </View>
                </View>
                <View style={styles.summaryContent}>
                  <View style={styles.summaryHeader}>
                    <MaterialCommunityIcons name="brain" size={20} color={colors.eq} />
                    <Text style={styles.summaryTitle}>Mental Health</Text>
                  </View>
                  <Text style={styles.summaryText}>{healthSummary.mental.summary}</Text>
                  <View style={styles.summaryFooter}>
                    <Text style={styles.summaryCount}>{healthSummary.mental.testsCount} tests completed</Text>
                    {healthSummary.mental.score > 0 && (
                      <Text style={[styles.summaryScore, { color: healthSummary.mental.status.color }]}>
                        {healthSummary.mental.score.toFixed(0)}%
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Physical Health Summary */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryImageContainer}>
                  <Image
                    source={{ uri: healthSummary.physical.imageUrl }}
                    style={styles.summaryImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.summaryImageOverlay}
                  />
                  <View style={styles.summaryBadge}>
                    <Text style={styles.summaryEmoji}>{healthSummary.physical.status.emoji}</Text>
                    <Text style={styles.summaryBadgeText}>{healthSummary.physical.status.text}</Text>
                  </View>
                </View>
                <View style={styles.summaryContent}>
                  <View style={styles.summaryHeader}>
                    <Ionicons name="fitness" size={20} color={colors.physical} />
                    <Text style={styles.summaryTitle}>Physical Health</Text>
                  </View>
                  <Text style={styles.summaryText}>{healthSummary.physical.summary}</Text>
                  <View style={styles.summaryFooter}>
                    <Text style={styles.summaryCount}>{healthSummary.physical.testsCount} tests completed</Text>
                    {healthSummary.physical.score > 0 && (
                      <Text style={[styles.summaryScore, { color: healthSummary.physical.status.color }]}>
                        {healthSummary.physical.score.toFixed(0)}%
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Actionable Remedies Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={iconSizes.md} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Actionable Remedies</Text>
          </View>
          
          {/* Mental Health Remedies */}
          <View style={styles.remedyCategory}>
            <View style={styles.categoryHeader}>
              <MaterialCommunityIcons name="brain" size={20} color={colors.eq} />
              <Text style={styles.categoryTitle}>Mental Health</Text>
            </View>
            {remedies.mental.length > 0 ? (
              remedies.mental.map((remedy, index) => (
                <View key={index} style={styles.remedyCard}>
                  <View style={styles.remedyHeader}>
                    <Text style={styles.remedyTitle}>{remedy.title}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(remedy.priority) + '20' }]}>
                      <Text style={[styles.priorityText, { color: getPriorityColor(remedy.priority) }]}>
                        {remedy.priority}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.remedyDescription}>{remedy.description}</Text>
                  {remedy.duration && (
                    <View style={styles.durationContainer}>
                      <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                      <Text style={styles.durationText}>{remedy.duration}</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No mental health remedies at this time</Text>
            )}
          </View>

          {/* Physical Health Remedies */}
          <View style={styles.remedyCategory}>
            <View style={styles.categoryHeader}>
              <Ionicons name="fitness" size={20} color={colors.physical} />
              <Text style={styles.categoryTitle}>Physical Health</Text>
            </View>
            {remedies.physical.length > 0 ? (
              remedies.physical.map((remedy, index) => (
                <View key={index} style={styles.remedyCard}>
                  <View style={styles.remedyHeader}>
                    <Text style={styles.remedyTitle}>{remedy.title}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(remedy.priority) + '20' }]}>
                      <Text style={[styles.priorityText, { color: getPriorityColor(remedy.priority) }]}>
                        {remedy.priority}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.remedyDescription}>{remedy.description}</Text>
                  {remedy.duration && (
                    <View style={styles.durationContainer}>
                      <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                      <Text style={styles.durationText}>{remedy.duration}</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No physical health remedies at this time</Text>
            )}
          </View>

          {/* Personalized Nutrition & Diet Plan */}
          {nutritionPlan && (
            <View style={styles.nutritionSection}>
              <View style={styles.nutritionHeader}>
                <MaterialCommunityIcons name="food-apple" size={24} color={colors.success} />
                <Text style={styles.nutritionTitle}>Personalized Nutrition Plan</Text>
              </View>
              
              {/* Health Status Overview */}
              {nutritionPlan.ui_summary && (
                <View style={styles.nutritionCard}>
                  <Text style={styles.nutritionSummary}>
                    {nutritionPlan.ui_summary.split('\n\n')[0]?.replace('Health Status Overview\n', '') || 'Health status information not available'}
                  </Text>
                </View>
              )}

              {/* Key Focus Areas */}
              {nutritionPlan.ui_summary && nutritionPlan.ui_summary.includes('Key Focus Areas') && (
                <View style={styles.focusAreasCard}>
                  <Text style={styles.focusAreasTitle}>Key Focus Areas</Text>
                  {nutritionPlan.ui_summary
                    .split('Key Focus Areas')[1]
                    ?.split('\n')
                    .filter(line => line.trim().startsWith('•'))
                    .map((area, index) => (
                      <View key={index} style={styles.focusAreaItem}>
                        <View style={styles.focusAreaDot} />
                        <Text style={styles.focusAreaText}>{area.replace('•', '').trim()}</Text>
                      </View>
                    )) || <Text style={styles.noDataText}>Focus areas not available</Text>}
                </View>
              )}

              {/* Macronutrient Distribution Chart */}
              {nutritionPlan.visuals && nutritionPlan.visuals.length > 0 && nutritionPlan.visuals[0]?.labels && (
                <View style={styles.macroChartCard}>
                  <Text style={styles.macroChartTitle}>Ideal Daily Macro Target</Text>
                  {PieChart ? (
                    <PieChart
                      data={nutritionPlan.visuals[0].labels.map((label, idx) => ({
                        name: label,
                        population: nutritionPlan.visuals[0].datasets[0].data[idx],
                        color: ['#4CAF50', '#2196F3', '#FF9800'][idx % 3],
                        legendFontColor: colors.textSecondary,
                        legendFontSize: 12,
                      }))}
                      width={screenWidth - spacing.xl * 4}
                      height={180}
                      chartConfig={{
                        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                      }}
                      accessor="population"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      absolute
                      hasLegend={true}
                    />
                  ) : (
                    <View style={styles.chartPlaceholder}>
                      <Ionicons name="pie-chart-outline" size={48} color={colors.textTertiary} />
                      <Text style={styles.chartPlaceholderText}>Chart not available</Text>
                    </View>
                  )}
                </View>
              )}

              {/* View Full Diet Plan Button */}
              <TouchableOpacity
                style={styles.viewDietButton}
                onPress={() => {
                  try {
                    // Show detailed diet plan in a scrollable alert
                    const detailedPlan = nutritionPlan.detailed_report || 'Detailed plan not available';
                    const planSections = detailedPlan.split('\n\n').slice(0, 15).join('\n\n'); // First 15 paragraphs
                    
                    Alert.alert(
                      '🍎 Personalized Diet Plan',
                      planSections,
                      [
                        { 
                          text: 'Close', 
                          style: 'cancel' 
                        }
                      ],
                      { cancelable: true }
                    );
                  } catch (error) {
                    console.error('Error showing diet plan:', error);
                    Alert.alert('Error', 'Unable to display diet plan');
                  }
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="food-variant" size={20} color={colors.success} />
                <Text style={styles.viewDietButtonText}>View Full Diet Plan</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.success} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Semester-wise Test Results */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={iconSizes.md} color={colors.primary} />
            <Text style={styles.sectionTitle}>Test Results by Semester</Text>
          </View>

          {/* Semester Tabs */}
          {semesterData.length > 0 ? (
            <>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.tabsContainer}
              >
                {semesterData.map((semester, index) => (
                  <TouchableOpacity
                    key={semester.id}
                    style={[
                      styles.tab,
                      selectedSemester === index && styles.tabActive
                    ]}
                    onPress={() => setSelectedSemester(index)}
                  >
                    <Text style={[
                      styles.tabText,
                      selectedSemester === index && styles.tabTextActive
                    ]}>
                      {semester.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Selected Semester Content */}
              {currentSemester && (
                <View style={styles.semesterContent}>
                  {/* Mental Tests */}
                  {currentSemester.mentalTests.length > 0 && (
                    <View style={styles.testGroup}>
                      <Text style={styles.testGroupTitle}>Mental Health Tests</Text>
                      {currentSemester.mentalTests.map((test, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.testCard}
                          onPress={() => {
                            // Navigate to quiz history detail
                            navigation.navigate('QuizHistory');
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.testHeader}>
                            <View style={[styles.testIcon, { backgroundColor: test.test_type === 'eq' ? colors.eq + '20' : colors.iq + '20' }]}>
                              <MaterialCommunityIcons 
                                name={test.test_type === 'eq' ? 'brain' : 'lightbulb-on'} 
                                size={24} 
                                color={test.test_type === 'eq' ? colors.eq : colors.iq} 
                              />
                            </View>
                            <View style={styles.testInfo}>
                              <Text style={styles.testType}>{test.test_type.toUpperCase()} Test</Text>
                              <Text style={styles.testDate}>
                                {new Date(test.test_date).toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </Text>
                            </View>
                            {test.score && (
                              <View style={styles.scoreBox}>
                                <Text style={styles.scoreValue}>{test.score.toFixed(0)}%</Text>
                              </View>
                            )}
                            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Physical Tests */}
                  {currentSemester.physicalTests.length > 0 && (
                    <View style={styles.testGroup}>
                      <Text style={styles.testGroupTitle}>Physical Health Tests</Text>
                      {currentSemester.physicalTests.map((test, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.testCard}
                          onPress={() => {
                            // Navigate to quiz history for physical test details
                            navigation.navigate('QuizHistory');
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.testHeader}>
                            <View style={[styles.testIcon, { backgroundColor: colors.physical + '20' }]}>
                              <Ionicons name="fitness" size={24} color={colors.physical} />
                            </View>
                            <View style={styles.testInfo}>
                              <Text style={styles.testType}>Physical Test</Text>
                              <Text style={styles.testDate}>
                                {new Date(test.test_date).toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </Text>
                            </View>
                            {test.score && (
                              <View style={styles.scoreBox}>
                                <Text style={styles.scoreValue}>{test.score.toFixed(0)}%</Text>
                              </View>
                            )}
                            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                          </View>
                          {test.notes && (
                            <Text style={styles.testNotes}>{test.notes}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {currentSemester.tests.length === 0 && (
                    <View style={styles.emptyState}>
                      <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
                      <Text style={styles.emptyText}>No tests for this semester</Text>
                    </View>
                  )}
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No test data available</Text>
            </View>
          )}
        </View>

        {/* Health Trend Analysis & ML Insights */}
        {trendInsights && trendInsights.chartData && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics" size={iconSizes.md} color={colors.secondary} />
              <Text style={styles.sectionTitle}>Health Trend Analysis</Text>
            </View>

            {/* Trend Chart */}
            <View style={styles.chartCard}>
              {LineChart ? (
                <LineChart
                  data={trendInsights.chartData}
                  width={screenWidth - spacing.xl * 4}
                  height={220}
                  chartConfig={{
                    backgroundColor: colors.surface,
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
                    labelColor: (opacity = 1) => colors.textSecondary,
                    style: {
                      borderRadius: borderRadius.md,
                    },
                    propsForDots: {
                      r: '5',
                      strokeWidth: '2',
                    },
                  }}
                  bezier
                  style={{
                    borderRadius: borderRadius.md,
                  }}
                  yAxisSuffix="%"
                  withInnerLines={true}
                  withOuterLines={true}
                />
              ) : (
                <View style={styles.chartPlaceholder}>
                  <Ionicons name="bar-chart-outline" size={48} color={colors.textTertiary} />
                  <Text style={styles.chartPlaceholderText}>Chart not available</Text>
                </View>
              )}
            </View>

            {/* ML Insights */}
            <View style={styles.insightsCard}>
              <View style={styles.insightsHeader}>
                <MaterialCommunityIcons name="robot" size={24} color={colors.secondary} />
                <Text style={styles.insightsTitle}>AI-Powered Insights</Text>
              </View>
              {trendInsights.insights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <View style={styles.insightDot} />
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('QuizHistory')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.secondary || '#0D9488', colors.secondaryDark || '#0F766E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="time-outline" size={iconSizes.md} color={colors.white} />
              <Text style={styles.actionButtonText}>View Detailed Quiz History</Text>
              <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  greeting: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
  },
  childName: {
    ...typography.h1,
    color: colors.white,
    marginTop: spacing.xs,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    gap: spacing.sm,
  },
  apaarId: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  summarySection: {
    marginBottom: spacing.xxxl,
  },
  summarySectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  summaryCardsContainer: {
    gap: spacing.lg,
  },
  summaryCard: {
    ...card,
    overflow: 'hidden',
    padding: 0,
  },
  summaryImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  summaryImage: {
    width: '100%',
    height: '100%',
  },
  summaryImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  summaryBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    ...shadows.md,
  },
  summaryEmoji: {
    fontSize: 18,
  },
  summaryBadgeText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryContent: {
    padding: spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  summaryText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryCount: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  summaryScore: {
    ...typography.h3,
    fontWeight: '700',
  },
  section: {
    marginBottom: spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    flex: 1,
  },
  remedyCategory: {
    marginBottom: spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  remedyCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  remedyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  remedyTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  priorityText: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  remedyDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  durationText: {
    ...typography.caption,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  nutritionSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  nutritionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  nutritionCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.success + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  nutritionSummary: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  focusAreasCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  focusAreasTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  focusAreaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  focusAreaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginTop: 7,
    marginRight: spacing.sm,
  },
  focusAreaText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  macroChartCard: {
    ...card,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  macroChartTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  viewDietButton: {
    ...card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.success,
    backgroundColor: colors.success + '05',
  },
  viewDietButtonText: {
    ...typography.h4,
    color: colors.success,
    flex: 1,
  },
  noDataText: {
    ...typography.body,
    color: colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  tabsContainer: {
    marginBottom: spacing.lg,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.white,
  },
  semesterContent: {
    marginTop: spacing.md,
  },
  testGroup: {
    marginBottom: spacing.lg,
  },
  testGroupTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  testCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  testInfo: {
    flex: 1,
  },
  testType: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  testDate: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  scoreBox: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  scoreValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  testNotes: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  emptyState: {
    ...card,
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
  chartCard: {
    ...card,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  chartPlaceholder: {
    padding: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartPlaceholderText: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
  insightsCard: {
    ...card,
    padding: spacing.lg,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  insightsTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    marginTop: 7,
    marginRight: spacing.sm,
  },
  insightText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  actionButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  actionButtonText: {
    ...typography.h4,
    color: colors.white,
    flex: 1,
  },
});
