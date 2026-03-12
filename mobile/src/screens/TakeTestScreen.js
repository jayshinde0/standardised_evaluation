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
          <ActivityIndicator size="large" color="#007AFF" />
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

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.progress}>
            Question {currentQuestion + 1} of {questions.length}
          </Text>
          <Text style={styles.competency}>
            {question?.parameter_measured || 'Emotional Competency'}
          </Text>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.question}>
            {question?.question_text || question?.question || ''}
          </Text>

          <View style={styles.optionsContainer}>
            {optionsToRender.map(
              (option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  answers[currentQuestion] === index && styles.optionButtonSelected,
                ]}
                onPress={() => handleAnswer(index)}
              >
                <Text
                  style={[
                    styles.optionText,
                    answers[currentQuestion] === index && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
    progress: {
      fontSize: 16,
      color: '#fff',
      fontWeight: '600',
      marginBottom: 5,
    },
    competency: {
      fontSize: 14,
      color: '#fff',
      opacity: 0.9,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    question: {
      fontSize: 20,
      color: '#333',
      fontWeight: '600',
      marginBottom: 30,
      lineHeight: 28,
    },
    optionsContainer: {
      marginBottom: 20,
    },
    optionButton: {
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 10,
      marginBottom: 15,
      borderWidth: 2,
      borderColor: '#ddd',
    },
    optionButtonSelected: {
      borderColor: '#007AFF',
      backgroundColor: '#E3F2FD',
    },
    optionText: {
      fontSize: 16,
      color: '#333',
    },
    optionTextSelected: {
      color: '#007AFF',
      fontWeight: '600',
    },
    footer: {
      padding: 20,
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: '#ddd',
    },
    nextButton: {
      backgroundColor: '#007AFF',
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
    },
    nextButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
