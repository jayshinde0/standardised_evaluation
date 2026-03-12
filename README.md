# Student Development Tracking System

A comprehensive mobile application for assessing, tracking, and improving the cognitive (IQ), physical, and emotional (EQ) development of K-12 students.

## Overview

This system centers around the APAAR ID - a unique identifier for each student that links all test results, physical metrics, and AI-generated reports.

## Tech Stack

- **Frontend:** React Native (Expo)
- **Backend:** FastAPI (Python)
- **Database:** MongoDB with Motor (async)
- **AI:** OpenAI API for test generation and analysis

## Features

### Three User Roles

1. **Student**
   - Take dynamic EQ/IQ assessments
   - View pending tests and progress
   - Mobile-friendly test interface

2. **Teacher/School**
   - View student directory by APAAR ID
   - Upload physical test data (BMI, fitness scores)
   - Manage student records

3. **Parent**
   - View comprehensive child reports
   - Access AI-generated SEL activities
   - Track EQ competencies based on EmoSocio model

### EmoSocio Model

EQ assessments measure:
- **Intrapersonal:** self-awareness, emotional regulation, self-motivation, optimism, self-esteem
- **Interpersonal:** empathy, teamwork, flexibility, emotional expression, assertiveness, influence, relationships

## Project Structure

```
.
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py      # API endpoints
│   │   ├── models.py    # Pydantic models
│   │   ├── database.py  # MongoDB setup
│   │   ├── auth.py      # JWT authentication
│   │   └── llm_service.py # OpenAI integration
│   └── requirements.txt
│
└── mobile/              # React Native app
    ├── src/
    │   ├── api/         # API client
    │   ├── screens/     # All screens
    │   └── navigation/  # Role-based navigators
    └── package.json
```

## Getting Started

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB URL and OpenAI API key

5. Run the server:
```bash
uvicorn app.main:app --reload
```

API will be available at `http://localhost:8000`

### Mobile Setup

1. Navigate to mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Update API URL in `src/api/client.js`

4. Start Expo:
```bash
npm start
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Key Features

- JWT-based authentication with role-based access control
- APAAR ID-centric data architecture
- LLM-powered EQ test generation
- AI-generated parent reports with targeted remedies
- Async MongoDB operations
- Mobile-first responsive design

## Development Notes

- Passwords temporarily accept any value for development
- All test results are linked to APAAR ID
- EQ tests dynamically generated based on grade level
- Parent reports include actionable SEL activities

## License

Proprietary
