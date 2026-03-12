import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { studentAPI } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows, card, iconSizes } from '../styles/theme';

export default function TakeTestScreen({ route, navigation }) {
  const { testType } = route.params;
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTest();
  }, []);

  const loadTest = async () => {
    try {
      if (testType === 'eq') {
        const response = await studentAPI.generateEQTest();
        const rawQuestions = response.data.questions || [];
        const likertStudentQuestions = rawQuestions.filter(
          (q) =>
            q.response_type === 'Likert' &&
            (q.target_audience || '').toLowerCase() === 'student'
        );
        const finalQuestions =
          likertStudentQuestions.length > 0 ? likertStudentQuestions : rawQuestions;

        if (!finalQuestions || finalQuestions.length === 0) {
          Alert.alert('No questions available', 'This EQ test could not be loaded. Please try again later.');
          navigation.goBack();
          return;
        }

        setQuestions(finalQuestions);
        setAnswers(new Array(finalQuestions.length).fill(null));
      } else if (testType === 'iq') {
        const response = await studentAPI.generateIQTest();
        const rawQuestions = response.data.questions || [];

        if (!rawQuestions || rawQuestions.length === 0) {
          Alert.alert('No questions available', 'This IQ test could not be loaded. Please try again later.');
          navigation.goBack();
          return;
        }

        setQuestions(rawQuestions);
        setAnswers(new Array(rawQuestions.length).fill(null));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load test');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (answers[currentQuestion] === null) {
      Alert.alert('Please select an answer', 'You must select an answer before continuing');
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      const testResult = {
        test_type: testType,
        questions: questions,
        answers: answers,
      };

      await studentAPI.submitTest(testResult);
      Alert.alert('Success', 'Test submitted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit test');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const question = questions[currentQuestion] || {};
  const isEQ = testType === 'eq';
  const likertOptions = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
  const iqOptions =
    Array.isArray(question.options) && question.options.length > 0
      ? question.options
      : [];
  const optionsToRender = isEQ ? likertOptions : iqOptions;

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                Question {currentQuestion + 1} of {questions.length}
              </Text>
              <Text style={styles.competency}>
                {question?.parameter_measured || 'Assessment'}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.questionCard}>
          <Text style={styles.question}>
            {question?.question_text || question?.question || 'Loading question...'}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {optionsToRender.map((option, index) => {
            const isSelected = answers[currentQuestion] === index;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected,
                ]}
                onPress={() => handleAnswer(index)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionRadio, isSelected && styles.optionRadioSelected]}>
                  {isSelected && <View style={styles.optionRadioInner} />}
                </View>
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {currentQuestion === questions.length - 1 ? 'Submit Test' : 'Next Question'}
            </Text>
            <Ionicons 
              name={currentQuestion === questions.length - 1 ? 'checkmark-circle' : 'arrow-forward'} 
              size={iconSizes.md} 
              color={colors.white} 
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    paddingBottom: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.xl,
  },
  progressContainer: {
    gap: spacing.md,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '600',
  },
  competency: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.9,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  questionCard: {
    ...card,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  question: {
    ...typography.h3,
    color: colors.textPrimary,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionButton: {
    ...card,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: {
    borderColor: colors.primary,
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  optionText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  footer: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.md,
  },
  nextButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  nextButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
