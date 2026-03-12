# Backend Structure - Complete Documentation

## Directory Structure

```
backend/
├── app/
│   ├── __init__.py              # Package initializer
│   ├── main.py                  # FastAPI application entry point
│   ├── config.py                # Configuration settings
│   ├── database.py              # MongoDB connection setup
│   ├── models.py                # Pydantic data models
│   ├── auth.py                  # Authentication utilities
│   └── llm_service.py           # AI/LLM service functions
├── .env                         # Environment variables (not in git)
├── .env.example                 # Environment template
├── requirements.txt             # Python dependencies
├── run.py                       # Server startup script
├── check_setup.py               # Setup verification script
├── test_gemini_image.py         # Image generation test
├── test_image_append.py         # Image append test
├── SETUP.md                     # Setup instructions
├── WINDOWS_SETUP.md             # Windows-specific setup
├── README.md                    # Backend documentation
└── IMAGE_GENERATION_SETUP.md    # Image feature docs
```

## File Descriptions

### Core Application Files

#### `app/main.py`
**Purpose:** FastAPI application entry point and API routes
**Key Features:**
- Health check endpoint
- User signup and login
- Test generation (EQ/IQ)
- Test submission
- Report generation
- Physical health tracking
- Quiz history retrieval
- CORS middleware configuration

**Main Endpoints:**
- `GET /` - Health check
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/student/generate-eq-test` - Generate EQ test
- `POST /api/student/generate-iq-test` - Generate IQ test
- `POST /api/student/submit-test` - Submit test answers
- `POST /api/parent/generate-report` - Generate parent report
- `GET /api/parent/remedies` - Get remedies/reports
- `POST /api/teacher/upload-physical` - Upload physical metrics
- `GET /api/student/quiz-history` - Get quiz history

#### `app/config.py`
**Purpose:** Configuration management using Pydantic
**Contains:**
- MongoDB connection URL
- Database name
- JWT secret key
- Token algorithm
- Token expiration time
- Environment variable loading

#### `app/database.py`
**Purpose:** MongoDB database connection and collections
**Provides:**
- Async MongoDB client using Motor
- Database instance
- Collection references (users, test_results, parent_reports, physical_data)
- Connection lifecycle management

#### `app/models.py`
**Purpose:** Pydantic models for data validation
**Models:**
- `UserSignup` - User registration data
- `UserLogin` - Login credentials
- `TestResult` - Quiz/test submission
- `PhysicalMetrics` - Physical health data
- `Token` - JWT token response
- `User` - User database model

#### `app/auth.py`
**Purpose:** Authentication and authorization utilities
**Functions:**
- `create_access_token()` - Generate JWT tokens
- `get_password_hash()` - Hash passwords
- `verify_password()` - Verify password hashes
- `get_current_user()` - Decode and validate JWT
- Token expiration handling

#### `app/llm_service.py`
**Purpose:** AI/LLM service for test generation and analysis
**Key Functions:**

1. `generate_eq_test(grade_level)` - Generate emotional intelligence test
   - Uses Cerebras GPT-OSS-120B
   - EmoSocio model methodology
   - Likert scale questions
   - Returns 12 individual + 3 group competency questions

2. `generate_iq_test(grade_level)` - Generate cognitive test
   - Static question set for reliability
   - Pattern recognition, logical reasoning
   - Multiple choice format
   - 5 questions covering different skills

3. `generate_parent_report(apaar_id, test_results, student_profile)` - Generate comprehensive report
   - Analyzes all test results
   - Generates Data_Analysis text
   - Creates Sub_grouping_Recommendation
   - Provides Targeted_SEL_Activities
   - Includes Progress_Tracking
   - **Automatically generates and appends emotional insight image**

4. `generate_quiz_report_and_remedies(questions, answers, score, student_profile)` - Single quiz analysis
   - Analyzes individual quiz attempt
   - Provides immediate feedback
   - Suggests remedies
   - Same structure as parent report

5. `generate_physical_advice(physical_metrics, student_profile, notes)` - Physical health guidance
   - Analyzes physical metrics
   - Provides safe, general advice
   - No medical diagnosis
   - Actionable tips

6. `_generate_emotional_insight_image(analysis_text)` - Image generation
   - Analyzes emotional themes
   - Detects keywords (empathy, confidence, teamwork, etc.)
   - Generates themed Unsplash URL
   - Returns image URL for embedding
   - Fail-safe design (returns None on error)

7. `_extract_json(text)` - JSON parsing utility
   - Extracts JSON from LLM responses
   - Handles markdown code blocks
   - Error handling for invalid JSON

### Configuration Files

#### `.env`
**Purpose:** Environment variables (sensitive data)
**Contains:**
```
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=student_development_db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GEMINI_API_KEY=your-api-key
```

#### `requirements.txt`
**Purpose:** Python package dependencies
**Key Packages:**
- fastapi==0.109.0
- uvicorn==0.27.0
- motor==3.3.2 (async MongoDB)
- pydantic==2.5.3
- python-jose[cryptography]==3.3.0 (JWT)
- passlib[bcrypt]==1.7.4 (password hashing)
- openai==1.10.0
- httpx==0.27.0 (async HTTP)
- python-dotenv==1.0.0

### Utility Scripts

#### `run.py`
**Purpose:** Start the FastAPI server
**Features:**
- Checks MongoDB connection
- Starts uvicorn server
- Configures host and port
- Auto-reload in development

#### `check_setup.py`
**Purpose:** Verify backend setup
**Checks:**
- MongoDB connection
- Database accessibility
- Environment variables
- Dependencies installed

#### `test_gemini_image.py`
**Purpose:** Test image generation API
**Tests:**
- API connectivity
- Image generation
- Response format
- Error handling

## Data Flow

### User Registration Flow:
```
1. Client sends signup request → main.py
2. main.py validates data → models.py
3. auth.py hashes password
4. database.py stores user in MongoDB
5. Returns success response
```

### Test Generation Flow:
```
1. Client requests test → main.py
2. main.py calls llm_service.py
3. llm_service.py calls Cerebras API
4. Parses and validates questions
5. Returns formatted test to client
```

### Test Submission Flow:
```
1. Client submits answers → main.py
2. main.py stores in database.py
3. Calls llm_service.py for analysis
4. llm_service.py generates report
5. Generates emotional insight image
6. Appends image to report
7. Returns complete report
```

### Report Generation Flow:
```
1. Parent requests report → main.py
2. main.py fetches all test results
3. Calls llm_service.py with data
4. llm_service.py analyzes patterns
5. Generates comprehensive report
6. Generates themed image
7. Appends image in Markdown format
8. Returns report with embedded image
```

## Database Schema

### users collection:
```javascript
{
  _id: ObjectId,
  email: string,
  password_hash: string,
  full_name: string,
  role: "student" | "teacher" | "parent",
  apaar_id: string (optional),
  created_at: datetime
}
```

### test_results collection:
```javascript
{
  _id: ObjectId,
  apaar_id: string,
  test_type: "eq" | "iq" | "physical",
  questions: array,
  answers: array,
  score: number,
  report: object,
  created_at: datetime
}
```

### parent_reports collection:
```javascript
{
  _id: ObjectId,
  apaar_id: string,
  data_analysis: string (with image markdown),
  sub_grouping_recommendation: string,
  targeted_sel_activities: array,
  progress_tracking: string,
  competency_scores: object,
  created_at: datetime
}
```

### physical_data collection:
```javascript
{
  _id: ObjectId,
  apaar_id: string,
  metrics: object,
  notes: string,
  advice: object,
  created_at: datetime
}
```

## API Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

Token contains:
- User email
- Role
- APAAR ID
- Expiration time

## Error Handling

- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid/missing token)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error (server issues)

All errors return JSON:
```json
{
  "detail": "Error message"
}
```

## Environment Setup

1. Install Python 3.8+
2. Install MongoDB
3. Create virtual environment
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env`
6. Configure environment variables
7. Start MongoDB
8. Run: `python run.py`

Server runs on: http://localhost:8000
API docs: http://localhost:8000/docs

---

**Next:** See MOBILE_STRUCTURE.md for frontend documentation.
