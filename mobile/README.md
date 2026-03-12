# Student Development Tracker - Mobile App

React Native mobile application for K-12 student cognitive, physical, and emotional development tracking.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update API URL in `src/api/client.js`:
   - For iOS simulator: `http://localhost:8000/api`
   - For Android emulator: `http://10.0.2.2:8000/api`
   - For physical device: Use your computer's IP address

3. Start the development server:
```bash
npm start
```

4. Run on device:
   - iOS: Press `i` or scan QR code with Expo Go
   - Android: Press `a` or scan QR code with Expo Go

## Features

### Student Role
- View dashboard with pending tests
- Take dynamic EQ assessments based on EmoSocio model
- Submit test results
- Track progress

### Teacher Role
- View student directory by APAAR ID
- Upload physical test data (BMI, fitness scores, health notes)
- Manage student records

### Parent Role
- View child's profile and test results
- Generate AI-powered comprehensive reports
- Access actionable SEL activities and cognitive exercises
- Track EQ competencies with visual progress bars

## Project Structure

```
mobile/
├── src/
│   ├── api/
│   │   └── client.js          # API client and endpoints
│   ├── context/
│   │   └── AuthContext.js     # Authentication context
│   ├── navigation/
│   │   ├── StudentNavigator.js
│   │   ├── TeacherNavigator.js
│   │   └── ParentNavigator.js
│   └── screens/
│       ├── LoginScreen.js
│       ├── SignupScreen.js
│       ├── StudentDashboardScreen.js
│       ├── TakeTestScreen.js
│       ├── TeacherDashboardScreen.js
│       ├── UploadPhysicalScreen.js
│       ├── ParentDashboardScreen.js
│       └── RemediesScreen.js
├── App.js
├── app.json
└── package.json
```

## Key Technologies

- React Native with Expo
- React Navigation (Stack & Bottom Tabs)
- Axios for API calls
- AsyncStorage for token persistence
- Role-based navigation

## Notes

- Make sure the backend API is running before starting the mobile app
- The app uses JWT authentication with automatic token management
- All API calls include the authentication token in headers
