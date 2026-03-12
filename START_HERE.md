# 🎯 START HERE - AI Context Guide

## What This Project Is

**Student Development Tracker** - A holistic assessment platform for Indian schools that tracks emotional, cognitive, and physical health of students using APAAR IDs.

## For AI Assistants: How to Understand This Project

### Step 1: Read These Files in Order
1. **COMPLETE_PROJECT_INDEX.md** - Master index (read this first!)
2. **PROJECT_OVERVIEW.md** - High-level overview
3. **BACKEND_STRUCTURE.md** - Backend details
4. **MOBILE_STRUCTURE.md** - Frontend details
5. **FEATURES_DOCUMENTATION.md** - Feature descriptions

### Step 2: Key Concepts to Understand

**APAAR ID:** Unique identifier for Indian students
**EQ Test:** Emotional intelligence assessment (Likert scale)
**IQ Test:** Cognitive ability assessment (multiple choice)
**SEL:** Social Emotional Learning
**EmoSocio Model:** Framework for emotional assessment
**SAFE Approach:** Activity methodology (Safe, Active, Focus, Explicit)

### Step 3: Architecture Overview

```
Mobile App (React Native + Expo)
    ↓ HTTP/REST
Backend API (FastAPI + Python)
    ↓ Async
MongoDB Database
    ↓ API Calls
AI Services (Cerebras + Unsplash)
```

### Step 4: User Roles

1. **Student** - Takes tests, views history
2. **Parent** - Generates reports, downloads PDFs
3. **Teacher** - Uploads physical metrics

### Step 5: Core Data Flow

```
User → Login → Dashboard → Action (Test/Report/Upload)
    ↓
Backend receives request
    ↓
AI analyzes data (Cerebras)
    ↓
Image generated (Unsplash)
    ↓
Report created with image
    ↓
Stored in MongoDB
    ↓
Returned to app
    ↓
Displayed with image
    ↓
Can export as PDF
```

## Quick File Reference

### Need to understand...
- **Authentication?** → BACKEND_STRUCTURE.md (auth section)
- **Test generation?** → BACKEND_STRUCTURE.md (llm_service)
- **Image feature?** → IMAGE_GENERATION_FIXED.md
- **PDF export?** → PDF_DOWNLOAD_FEATURE.md
- **UI design?** → MOBILE_STRUCTURE.md (theme section)
- **Navigation?** → MOBILE_STRUCTURE.md (navigation section)
- **API endpoints?** → BACKEND_STRUCTURE.md (main.py section)

### Need to modify...
- **Add new test type?** → backend/app/llm_service.py
- **Change UI colors?** → mobile/src/styles/theme.js
- **Add new screen?** → mobile/src/screens/ + navigator
- **Modify report format?** → backend/app/llm_service.py
- **Change PDF layout?** → RemediesScreen.js or QuizHistoryDetailScreen.js

## Technology Stack Summary

**Backend:** FastAPI, MongoDB, Cerebras AI, JWT
**Frontend:** React Native, Expo, React Navigation
**Services:** Unsplash (images), expo-print (PDFs)

## Key Features (15 Total)

1. Multi-role authentication
2. AI-generated EQ tests
3. AI-generated IQ tests
4. Emotional insight images
5. Comprehensive reports
6. PDF export with timestamps
7. Quiz history
8. Physical health tracking
9. Professional UI/UX
10. Role-based navigation
11. SEL activities
12. Progress tracking
13. Image display
14. Profile management
15. Enhanced navigation

## File Count Summary

- **Backend:** 8 core files + config files
- **Frontend:** 12 screens + 4 navigators + components
- **Documentation:** 10+ comprehensive guides
- **Total Lines:** ~15,000+ lines of code

## Database Collections

1. users (authentication)
2. test_results (quiz attempts)
3. parent_reports (generated reports)
4. physical_data (health metrics)

## API Endpoints (8 Main)

1. POST /api/auth/signup
2. POST /api/auth/login
3. POST /api/student/generate-eq-test
4. POST /api/student/generate-iq-test
5. POST /api/student/submit-test
6. GET /api/student/quiz-history
7. POST /api/parent/generate-report
8. POST /api/teacher/upload-physical

## Current Status

✅ All features implemented
✅ All bugs fixed
✅ Production ready
✅ Fully documented

## For Quick Understanding

**What it does:** Tracks student development holistically
**Who uses it:** Students, parents, teachers in Indian schools
**How it works:** AI-powered assessments + reports + images + PDFs
**Tech:** React Native mobile app + FastAPI backend + MongoDB
**Special:** Automatic emotional insight image generation

## Documentation Quality

- ✅ Complete file-by-file descriptions
- ✅ Data flow diagrams
- ✅ Code examples
- ✅ Feature explanations
- ✅ Setup instructions
- ✅ Troubleshooting guides
- ✅ API documentation
- ✅ Database schemas

## Next Steps for AI

1. Read COMPLETE_PROJECT_INDEX.md
2. Understand the architecture
3. Review specific files as needed
4. Reference feature docs for details
5. Check code comments for implementation

---

**You now have 100% context of this project!**

Start with: **COMPLETE_PROJECT_INDEX.md**
