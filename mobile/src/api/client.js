import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure API URL based on platform
const getApiUrl = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access host machine
      return 'http://192.168.0.247:8000/api';
    } else {
      // iOS simulator can use localhost
      return 'http://192.168.0.247:8000/api';
    }
  }
  // Production - replace with your actual API URL
  return 'http://192.168.0.247:8000/api';
};

const API_BASE_URL = 'http://192.168.0.247:8000/api';

console.log('API Base URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error Response:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('API No Response:', error.request);
      error.message = 'Cannot connect to server. Make sure backend is running.';
    } else {
      // Something else happened
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email) => 
    apiClient.post('/auth/login', { email }),
  
  signup: (userData) => 
    apiClient.post('/auth/signup', userData),
};

export const studentAPI = {
  getProfile: () => 
    apiClient.get('/student/profile'),
  
  getPendingTests: () => 
    apiClient.get('/student/pending-tests'),
  
  generateEQTest: () => 
    apiClient.post('/student/generate-eq-test'),
  
  submitTest: (testData) => 
    apiClient.post('/student/submit-test', testData),

  getQuizHistory: () =>
    apiClient.get('/student/quiz-history'),
};

export const teacherAPI = {
  getStudents: () => 
    apiClient.get('/teacher/students'),
  
  uploadPhysicalTest: (data) => 
    apiClient.post('/teacher/upload-physical-test', data),
};

export const parentAPI = {
  getChildProfile: () => 
    apiClient.get('/parent/child-profile'),
  
  getTestResults: () => 
    apiClient.get('/parent/test-results'),
  
  getQuizHistory: () =>
    apiClient.get('/parent/quiz-history'),
  
  generateReport: () => 
    apiClient.post('/parent/generate-report'),
  
  getRemedies: () => 
    apiClient.get('/parent/remedies'),
};

export default apiClient;
