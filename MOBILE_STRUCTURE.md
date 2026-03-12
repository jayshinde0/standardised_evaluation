# Mobile App Structure - Complete Documentation

## Directory Structure

```
mobile/
├── src/
│   ├── api/
│   │   └── client.js                # API client and endpoints
│   ├── components/
│   │   └── Icon.js                  # Centralized icon mappings
│   ├── context/
│   │   └── AuthContext.js           # Authentication context
│   ├── navigation/
│   │   ├── AppNavigator.js          # Root navigator
│   │   ├── StudentNavigator.js      # Student tab navigation
│   │   ├── ParentNavigator.js       # Parent tab navigation
│   │   └── TeacherNavigator.js      # Teacher tab navigation
│   ├── screens/
│   │   ├── LoginScreen.js           # Login interface
│   │   ├── SignupScreen.js          # Registration interface
│   │   ├── StudentDashboardScreen.js    # Student home
│   │   ├── ParentDashboardScreen.js     # Parent home
│   │   ├── TeacherDashboardScreen.js    # Teacher home
│   │   ├── TakeTestScreen.js        # Test taking interface
│   │   ├── QuizHistoryScreen.js     # Quiz list
│   │   ├── QuizHistoryDetailScreen.js   # Quiz details + PDF
│   │   ├── RemediesScreen.js        # Reports + PDF download
│   │   ├── UploadPhysicalScreen.js  # Physical metrics
│   │   └── ProfileScreen.js         # User profile
│   └── styles/
│       └── theme.js                 # Design system
├── App.js                           # App entry point
├── package.json                     # Dependencies
└── app.json                         # Expo configuration
```

## File Descriptions

### API Layer

#### `src/api/client.js`
**Purpose:** Centralized API communication
**Features:**
- Axios instance with base URL configuration
- Token management (AsyncStorage)
- Request/response interceptors
- Error handling

**API Modules:**
1. `authAPI` - Authentication endpoints
   - `signup(userData)` - Register new user
   - `login(email)` - User login

2. `studentAPI` - Student-specific endpoints
   - `generateEQTest()` - Get EQ test
   - `generateIQTest()` - Get IQ test
   - `submitTest(testData)` - Submit answers
   - `getQuizHistory()` - Fetch quiz history

3. `parentAPI` - Parent-specific endpoints
   - `generateReport(apaarId)` - Generate comprehensive report
   - `getRemedies(apaarId)` - Fetch all reports

4. `teacherAPI` - Teacher-specific endpoints
   - `uploadPhysical(apaarId, data)` - Upload physical metrics

**Base URL Configuration:**
```javascript
// iOS Simulator
const API_BASE_URL = 'http://localhost:8000/api';

// Android Emulator
const API_BASE_URL = 'http://10.0.2.2:8000/api';

// Physical Device
const API_BASE_URL = 'http://YOUR_IP:8000/api';
```

### Components

#### `src/components/Icon.js`
**Purpose:** Centralized icon management
**Features:**
- Maps semantic names to Ionicons
- Consistent icon usage across app
- Easy icon updates

**Icon Mappings:**
- Test types: EQ, IQ, Physical
- Actions: Take test, view history, generate report
- Navigation: Home, profile, logout
- Status: Success, error, warning

### Context

#### `src/context/AuthContext.js`
**Purpose:** Global authentication state
**Provides:**
- `userToken` - JWT token
- `userRole` - User role (student/parent/teacher)
- `apaarId` - Student APAAR ID
- `signIn(token, role, apaarId)` - Login function
- `signOut()` - Logout function
- `isLoading` - Loading state

**Storage:**
- Uses AsyncStorage for persistence
- Auto-loads on app start
- Clears on logout

### Navigation

#### `src/navigation/AppNavigator.js`
**Purpose:** Root navigation structure
**Logic:**
- Shows auth screens if not logged in
- Routes to role-specific navigator if logged in
- Handles loading states

#### `src/navigation/StudentNavigator.js`
**Purpose:** Student tab navigation
**Tabs:**
- Home (Dashboard + Test + History stack)
- Profile

**Stack Screens:**
- Dashboard
- TakeTest
- QuizHistory
- QuizHistoryDetail

#### `src/navigation/ParentNavigator.js`
**Purpose:** Parent tab navigation
**Tabs:**
- Home (Dashboard + Remedies + History stack)
- Profile

**Stack Screens:**
- Dashboard
- Remedies
- QuizHistory
- QuizHistoryDetail

#### `src/navigation/TeacherNavigator.js`
**Purpose:** Teacher tab navigation
**Tabs:**
- Home (Dashboard + Upload stack)
- Profile

**Stack Screens:**
- Dashboard
- UploadPhysical

### Screens

#### `src/screens/LoginScreen.js`
**Purpose:** User authentication
**Features:**
- Email and password input
- Show/hide password toggle
- Loading states
- Navigation to signup
- JWT token storage
- Role-based routing

**UI Elements:**
- Logo container
- Input fields with icons
- Gradient button
- Link to signup

#### `src/screens/SignupScreen.js`
**Purpose:** User registration
**Features:**
- Full name, email, password inputs
- Role selection (Student/Teacher/Parent)
- APAAR ID input (conditional)
- Form validation
- Success navigation to login

**UI Elements:**
- Role selection buttons
- Conditional APAAR ID field
- Gradient submit button
- Link to login

#### `src/screens/StudentDashboardScreen.js`
**Purpose:** Student home screen
**Features:**
- Welcome message with name
- Test type cards (EQ, IQ, Physical)
- Quick stats display
- Recent activity
- Navigation to tests

**UI Elements:**
- Gradient header
- Test cards with icons
- Stats grid
- Action buttons

#### `src/screens/ParentDashboardScreen.js`
**Purpose:** Parent home screen
**Features:**
- Child's APAAR ID display
- Generate report button
- View remedies button
- Recent reports list
- Progress overview

**UI Elements:**
- Gradient header
- Action buttons
- Report cards
- Navigation links

#### `src/screens/TeacherDashboardScreen.js`
**Purpose:** Teacher home screen
**Features:**
- Student list
- Upload physical metrics button
- Recent uploads
- Quick actions

**UI Elements:**
- Gradient header
- Student cards
- Upload button
- Activity list

#### `src/screens/TakeTestScreen.js`
**Purpose:** Test taking interface
**Features:**
- Question display
- Progress indicator
- Answer selection (Likert/Multiple choice)
- Navigation between questions
- Submit functionality
- Loading states

**UI Elements:**
- Progress bar
- Question card
- Radio button options
- Next/Submit button
- Gradient header

**Flow:**
1. Load test questions
2. Display one question at a time
3. Validate answer selection
4. Navigate to next question
5. Submit all answers
6. Show success message

#### `src/screens/QuizHistoryScreen.js`
**Purpose:** List of all quiz attempts
**Features:**
- Chronological list
- Test type badges
- Score display
- Date/time stamps
- Tap to view details
- Empty state

**UI Elements:**
- List items with icons
- Score badges
- Date labels
- Navigation arrows

#### `src/screens/QuizHistoryDetailScreen.js`
**Purpose:** Detailed quiz analysis
**Features:**
- **PDF Download button** (NEW)
- Score display
- Question-by-question breakdown
- Answer review
- Report sections:
  - Data Analysis (with image)
  - Sub-grouping Recommendation
  - Targeted SEL Activities
  - Progress Tracking
- **Image display** (NEW)

**UI Elements:**
- Download PDF button
- Score card
- Question cards
- Report cards
- Activity list
- Emotional insight image

**PDF Generation:**
- Timestamp in filename
- Professional HTML template
- Embedded images
- All report sections
- Share/save dialog

#### `src/screens/RemediesScreen.js`
**Purpose:** Comprehensive reports and remedies
**Features:**
- Generate new report button
- **Download PDF button**
- Latest report display
- Competency chart (if available)
- Report sections:
  - Summary Analysis (with image)
  - Sub-grouping Recommendation
  - Targeted SEL Activities
  - Progress Tracking
- **Image display**
- Historical reports

**UI Elements:**
- Gradient header
- Action buttons
- Progress chart
- Report cards
- Activity cards
- Emotional insight image

**PDF Generation:**
- Timestamp in filename
- Professional HTML template
- Embedded images
- Chart data
- All sections
- Share/save dialog

**Image Handling:**
- Extracts image from Markdown
- Displays separately from text
- Shows caption
- Embeds in PDF

#### `src/screens/UploadPhysicalScreen.js`
**Purpose:** Physical health metrics upload
**Features:**
- APAAR ID input
- Metric inputs (height, weight, BMI, etc.)
- Notes field
- Submit functionality
- Validation
- Success feedback

**UI Elements:**
- Input fields
- Numeric keyboards
- Text area for notes
- Submit button

#### `src/screens/ProfileScreen.js`
**Purpose:** User profile and settings
**Features:**
- User information display
- Role badge
- APAAR ID (if applicable)
- Account status
- Quick actions (Settings, Help, About)
- **Logout button** (improved design)

**UI Elements:**
- Avatar with role icon
- Info cards
- Action cards
- Logout button (red, prominent)
- App version

### Styles

#### `src/styles/theme.js`
**Purpose:** Design system and theme
**Exports:**

1. **Colors:**
```javascript
colors = {
  // Primary
  primary: '#1E3A8A',        // Deep Blue
  primaryDark: '#1E40AF',
  primaryLight: '#3B82F6',
  
  // Secondary
  secondary: '#0D9488',      // Teal
  secondaryDark: '#0F766E',
  
  // Accent
  accent: '#D97706',         // Amber
  
  // Test Types
  eq: '#7C3AED',            // Purple (EQ)
  iq: '#2563EB',            // Blue (IQ)
  physical: '#DC2626',      // Red (Physical)
  
  // Semantic
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Neutrals
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
}
```

2. **Spacing:**
```javascript
spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
}
```

3. **Border Radius:**
```javascript
borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
}
```

4. **Typography:**
```javascript
typography = {
  h1: { fontSize: 32, fontWeight: '700' },
  h2: { fontSize: 28, fontWeight: '700' },
  h3: { fontSize: 24, fontWeight: '600' },
  h4: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  bodySmall: { fontSize: 14, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
  button: { fontSize: 16, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '500' },
}
```

5. **Shadows:**
```javascript
shadows = {
  sm: { shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 },
}
```

6. **Card Style:**
```javascript
card = {
  backgroundColor: colors.surface,
  borderRadius: borderRadius.lg,
  padding: spacing.lg,
  ...shadows.sm,
}
```

7. **Icon Sizes:**
```javascript
iconSizes = {
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
}
```

## Key Features Implementation

### 1. Image Display in Reports

**Implementation:**
- Helper function `extractImageFromMarkdown(text)`
- Parses Markdown: `![alt](url)`
- Separates text and image URL
- Displays image using Image component
- Shows caption below image

**Used In:**
- RemediesScreen (Summary Analysis)
- QuizHistoryDetailScreen (Data Analysis)

### 2. PDF Download

**Implementation:**
- Uses expo-print for HTML to PDF
- Uses expo-file-system/legacy for file operations
- Uses expo-sharing for share dialog
- Timestamp in filename
- Professional HTML template
- Embedded images

**Used In:**
- RemediesScreen (semester reports)
- QuizHistoryDetailScreen (quiz reports)

**Flow:**
1. User clicks "Download PDF"
2. Generate HTML with data
3. Convert to PDF
4. Save with timestamp
5. Show share dialog
6. User saves/shares

### 3. Theme System

**Benefits:**
- Consistent colors across app
- Easy theme updates
- Reusable styles
- Professional appearance
- Accessibility-friendly

**Usage:**
```javascript
import { colors, spacing, typography } from '../styles/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
});
```

### 4. Navigation Structure

**Student Flow:**
```
Login → StudentNavigator
  ├── Home Tab
  │   ├── Dashboard
  │   ├── TakeTest
  │   ├── QuizHistory
  │   └── QuizHistoryDetail
  └── Profile Tab
```

**Parent Flow:**
```
Login → ParentNavigator
  ├── Home Tab
  │   ├── Dashboard
  │   ├── Remedies (with PDF)
  │   ├── QuizHistory
  │   └── QuizHistoryDetail (with PDF)
  └── Profile Tab
```

**Teacher Flow:**
```
Login → TeacherNavigator
  ├── Home Tab
  │   ├── Dashboard
  │   └── UploadPhysical
  └── Profile Tab
```

### 5. State Management

**Global State (AuthContext):**
- User authentication
- Role information
- APAAR ID
- Token management

**Local State (useState):**
- Form inputs
- Loading states
- Error messages
- UI interactions

**Persistent State (AsyncStorage):**
- JWT token
- User role
- APAAR ID

## Data Flow Examples

### Taking a Test:
```
1. StudentDashboardScreen → Navigate to TakeTestScreen
2. TakeTestScreen → Load test from API
3. User answers questions
4. TakeTestScreen → Submit to API
5. API generates report with image
6. Navigate back to Dashboard
7. Report available in QuizHistory
```

### Viewing Report with Image:
```
1. QuizHistoryScreen → Select quiz
2. QuizHistoryDetailScreen → Load quiz data
3. Extract image from Markdown
4. Display text and image separately
5. User can download PDF
6. PDF includes embedded image
```

### Downloading PDF:
```
1. User clicks "Download PDF"
2. Extract image from Markdown
3. Generate HTML template
4. Embed image in HTML
5. Convert HTML to PDF
6. Save with timestamp
7. Show share dialog
8. User saves/shares PDF
```

## Dependencies

Key packages in `package.json`:
```json
{
  "expo": "~54.0.0",
  "react": "18.3.1",
  "react-native": "0.76.5",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/stack": "^6.3.20",
  "@react-navigation/bottom-tabs": "^6.5.11",
  "expo-linear-gradient": "~14.0.1",
  "expo-print": "~14.0.1",
  "expo-sharing": "~13.0.1",
  "expo-file-system": "~18.0.4",
  "@expo/vector-icons": "^14.0.0",
  "react-native-chart-kit": "^6.12.0",
  "axios": "^1.6.5",
  "@react-native-async-storage/async-storage": "^2.1.0"
}
```

## Environment Setup

1. Install Node.js 18+
2. Install Expo CLI: `npm install -g expo-cli`
3. Navigate to mobile folder: `cd mobile`
4. Install dependencies: `npm install`
5. Configure API URL in `src/api/client.js`
6. Start: `npm start`
7. Scan QR code with Expo Go app

## Platform-Specific Notes

### iOS:
- Use localhost for simulator
- Share sheet for PDF
- Files app integration

### Android:
- Use 10.0.2.2 for emulator
- Share dialog for PDF
- Downloads folder integration

### Physical Devices:
- Use computer's IP address
- Ensure same network
- Configure firewall if needed

---

**Next:** See FEATURES_DOCUMENTATION.md for feature details.
