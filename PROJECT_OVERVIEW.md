# Student Development Tracker - Complete Project Documentation

## Project Overview

A comprehensive holistic student assessment platform for Indian schools that tracks emotional, cognitive, and physical health of students using APAAR IDs. Built with React Native (mobile) and FastAPI (backend).

## Technology Stack

### Frontend (Mobile App)
- **Framework:** React Native with Expo
- **Navigation:** React Navigation (Stack + Bottom Tabs)
- **UI Components:** React Native core components
- **Styling:** StyleSheet with custom theme system
- **Charts:** react-native-chart-kit
- **PDF Generation:** expo-print
- **File Sharing:** expo-sharing
- **Icons:** @expo/vector-icons (Ionicons)
- **Gradients:** expo-linear-gradient

### Backend (API Server)
- **Framework:** FastAPI (Python)
- **Database:** MongoDB with Motor (async driver)
- **Authentication:** JWT tokens with python-jose
- **Password Hashing:** passlib with bcrypt
- **LLM Service:** Cerebras Cloud SDK
- **HTTP Client:** httpx (for async requests)
- **Environment:** python-dotenv

### AI/ML Services
- **Text Generation:** Cerebras GPT-OSS-120B model
- **Image Generation:** Unsplash API (themed educational images)
- **Analysis:** Custom prompts for SEL (Social Emotional Learning)

## Core Features

### 1. User Management
- Multi-role authentication (Student, Teacher, Parent)
- APAAR ID-based student identification
- JWT token-based session management
- Secure password hashing

### 2. Assessment System
- **EQ Tests:** Emotional intelligence assessments (Likert scale)
- **IQ Tests:** Cognitive ability tests (multiple choice)
- **Physical Tests:** Health metrics tracking
- Automated test generation using AI
- Question-by-question analysis

### 3. Reporting & Analytics
- AI-generated comprehensive reports
- Emotional insight image generation
- Competency scoring and visualization
- Progress tracking over time
- PDF export with timestamps

### 4. SEL Remedies
- Targeted Social Emotional Learning activities
- Sub-grouping recommendations
- SAFE approach methodology
- Duration-based activity planning

### 5. Dashboard Features
- Role-specific dashboards (Student/Parent/Teacher)
- Quiz history with detailed analysis
- Real-time report generation
- Visual progress charts
- Profile management

## Project Structure Overview

```
project-root/
├── backend/                 # FastAPI backend server
├── mobile/                  # React Native mobile app
├── Documentation files      # MD files for features and setup
└── Configuration files      # .gitignore, etc.
```

---

**Next:** See BACKEND_STRUCTURE.md and MOBILE_STRUCTURE.md for detailed breakdowns.
