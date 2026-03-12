# Student Development Tracking - Backend

FastAPI backend for K-12 student cognitive, physical, and emotional development tracking.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB URL and OpenAI API key.

4. Run the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Key Features

- JWT-based authentication with role-based access control (Student, Teacher, Parent)
- APAAR ID-based student tracking
- LLM-powered EQ test generation using EmoSocio model
- AI-generated parent reports with SEL remedies
- Physical test data management
- MongoDB async operations with Motor

## Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Student
- `GET /api/student/profile` - Get student profile
- `GET /api/student/pending-tests` - Get pending tests
- `POST /api/student/generate-eq-test` - Generate EQ test
- `POST /api/student/submit-test` - Submit test results

### Teacher
- `GET /api/teacher/students` - List all students
- `POST /api/teacher/upload-physical-test` - Upload physical test data

### Parent
- `GET /api/parent/child-profile` - Get child's profile
- `GET /api/parent/test-results` - Get child's test results
- `POST /api/parent/generate-report` - Generate AI report
- `GET /api/parent/remedies` - Get actionable remedies
