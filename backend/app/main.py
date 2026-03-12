from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.exceptions import RequestValidationError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
from typing import List, Optional
from app.config import settings
from app.database import (
    users_collection, student_profiles_collection, 
    test_results_collection, actionable_remedies_collection,
    quiz_history_collection,
    create_indexes
)
from app.models import (
    User, UserCreate, UserLogin, Token, StudentProfile,
    TestResult, ActionableRemedy, PhysicalTestInput, UserRole, TestType
)
from app.auth import get_password_hash, verify_password, create_access_token, decode_access_token
from app.llm_service import generate_eq_test, generate_parent_report
from fastapi.responses import JSONResponse
import logging

app = FastAPI(title="Student Development Tracking API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

@app.on_event("startup")
async def startup_event():
    await create_indexes()

logger = logging.getLogger("uvicorn.error")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body_bytes = await request.body()
    body_text = body_bytes.decode("utf-8", errors="replace")
    logger.error("Validation error on %s\nBody: %s\nErrors: %s",
                 request.url.path, body_text, exc.errors())
    # Return the normal 422 but include the body for debugging
    return JSONResponse(status_code=422, content={"detail": exc.errors(), "body": body_text})

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    email = payload.get("sub")
    user = await users_collection.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# Auth endpoints
@app.post("/api/auth/signup", response_model=Token)
async def signup(user_data: UserCreate):
    try:
        existing_user = await users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user document
        from datetime import datetime
        user_dict = {
            "email": user_data.email,
            "hashed_password": get_password_hash(user_data.password),
            "role": user_data.role.value if isinstance(user_data.role, UserRole) else user_data.role,
            "full_name": user_data.full_name,
            "apaar_id": user_data.apaar_id,
            "created_at": datetime.utcnow()
        }
        
        await users_collection.insert_one(user_dict)
        
        access_token = create_access_token(
            data={"sub": user_data.email, "role": user_data.role.value if isinstance(user_data.role, UserRole) else user_data.role},
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            role=user_data.role,
            apaar_id=user_data.apaar_id
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await users_collection.find_one({"email": user_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    user_role = user["role"]
    access_token = create_access_token(
        data={"sub": user_data.email, "role": user_role},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user_role,
        apaar_id=user.get("apaar_id")
    )

# Student endpoints
@app.get("/api/student/profile")
async def get_student_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Access denied")
    
    profile = await users_collection.find_one({"email": current_user["email"]})
    print(profile)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile["_id"] = str(profile["_id"])
    return profile

@app.get("/api/student/pending-tests")
async def get_pending_tests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Return pending test types (simplified logic)
    return {"pending_tests": ["eq", "iq"]}

@app.post("/api/student/generate-eq-test")
async def get_eq_test(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Access denied")
    
    profile = await student_profiles_collection.find_one({"apaar_id": current_user["apaar_id"]})
    grade = profile.get("grade", 5) if profile else 5
    
    questions = await generate_eq_test(grade)
    return {"questions": questions}

@app.post("/api/student/submit-test")
async def submit_test(test_result: TestResult, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Access denied")
    
    test_result.apaar_id = current_user["apaar_id"]
    result_dict = test_result.dict()
    # Convert enum to string
    if "test_type" in result_dict and hasattr(result_dict["test_type"], "value"):
        result_dict["test_type"] = result_dict["test_type"].value
    
    insert_result = await test_results_collection.insert_one(result_dict)
    from datetime import datetime
    await quiz_history_collection.insert_one({
        "kind": "quiz_attempt",
        "child_email": current_user["email"],
        "apaar_id": current_user["apaar_id"],
        "test_result_id": str(insert_result.inserted_id),
        "test_type": result_dict.get("test_type"),
        "test_date": result_dict.get("test_date"),
        "questions": result_dict.get("questions"),
        "answers": result_dict.get("answers"),
        "score": result_dict.get("score"),
        "created_at": datetime.utcnow(),
        "report": None,
    })
    
    return {"message": "Test submitted successfully"}

@app.get("/api/student/quiz-history")
async def get_student_quiz_history(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Access denied")
    
    history = []
    async for item in quiz_history_collection.find({"child_email": current_user["email"]}).sort("created_at", -1):
        item["_id"] = str(item["_id"])
        history.append(item)
    return {"quiz_history": history}

# Teacher endpoints
@app.get("/api/teacher/students")
async def get_students(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Access denied")
    
    students = []
    async for student in student_profiles_collection.find():
        student["_id"] = str(student["_id"])
        students.append(student)
    
    return {"students": students}

@app.post("/api/teacher/upload-physical-test")
async def upload_physical_test(data: PhysicalTestInput, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Access denied")
    
    from datetime import datetime
    test_result_dict = {
        "apaar_id": data.apaar_id,
        "test_type": "physical",
        "test_date": datetime.utcnow(),
        "physical_metrics": {
            "bmi": data.bmi,
            "fitness_score": data.fitness_score,
            "additional_metrics": data.additional_metrics
        },
        "notes": data.health_notes,
        "created_at": datetime.utcnow()
    }
    
    await test_results_collection.insert_one(test_result_dict)
    return {"message": "Physical test data uploaded successfully"}

# Parent endpoints
@app.get("/api/parent/child-profile")
async def get_child_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Access denied")
    
    profile = await student_profiles_collection.find_one({"apaar_id": current_user["apaar_id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Child profile not found")
    
    profile["_id"] = str(profile["_id"])
    return profile

@app.get("/api/parent/test-results")
async def get_child_test_results(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Access denied")
    
    results = []
    async for result in test_results_collection.find({"apaar_id": current_user["apaar_id"]}):
        result["_id"] = str(result["_id"])
        results.append(result)
    
    return {"test_results": results}

@app.post("/api/parent/generate-report")
async def generate_report(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get student profile
    profile = await student_profiles_collection.find_one({"apaar_id": current_user["apaar_id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Child profile not found")
    
    # Get all test results
    results = []
    async for result in test_results_collection.find({"apaar_id": current_user["apaar_id"]}):
        result["_id"] = str(result["_id"])
        results.append(result)
    
    # Generate report using LLM
    report_data = await generate_parent_report(current_user["apaar_id"], results, profile)
    
    # Save the remedy
    from datetime import datetime
    remedy_dict = {
        "apaar_id": current_user["apaar_id"],
        "generated_at": datetime.utcnow(),
        "report_summary": report_data["report_summary"],
        "strengths": report_data["strengths"],
        "weaknesses": report_data["weaknesses"],
        "eq_competencies": report_data["eq_competencies"],
        "sel_activities": report_data["sel_activities"],
        "cognitive_exercises": report_data["cognitive_exercises"],
        "created_at": datetime.utcnow()
    }
    remedy_insert = await actionable_remedies_collection.insert_one(remedy_dict)
    
    child_user = await users_collection.find_one({"role": "student", "apaar_id": current_user["apaar_id"]})
    if not child_user:
        child_user = await users_collection.find_one({ "email": current_user["email"] })
    child_email = child_user.get("email") if child_user else None
    await quiz_history_collection.insert_one({
        "kind": "parent_report",
        "child_email": child_email,
        "apaar_id": current_user["apaar_id"],
        "actionable_remedy_id": str(remedy_insert.inserted_id),
        "included_test_result_ids": [r.get("_id") for r in results if r.get("_id")],
        "report": {
            "report_summary": report_data["report_summary"],
            "strengths": report_data["strengths"],
            "weaknesses": report_data["weaknesses"],
            "eq_competencies": report_data["eq_competencies"],
            "sel_activities": report_data["sel_activities"],
            "cognitive_exercises": report_data["cognitive_exercises"],
        },
        "created_at": datetime.utcnow(),
    })
    
    return remedy_dict

@app.get("/api/parent/remedies")
async def get_remedies(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Access denied")
    
    remedies = []
    async for remedy in actionable_remedies_collection.find({"apaar_id": current_user["apaar_id"]}).sort("created_at", -1):
        remedy["_id"] = str(remedy["_id"])
        remedies.append(remedy)
    
    return {"remedies": remedies}

@app.get("/api/parent/quiz-history")
async def get_parent_quiz_history(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Access denied")
    
    child_user = await users_collection.find_one({"role": "student", "apaar_id": current_user["apaar_id"]})
    if not child_user:
        child_user = await users_collection.find_one({"apaar_id": current_user["apaar_id"], "role": {"$ne": "parent"}})
    child_email = child_user.get("email") if child_user else None
    if not child_email:
        return {"quiz_history": []}
    
    history = []
    async for item in quiz_history_collection.find({"child_email": child_email}).sort("created_at", -1):
        item["_id"] = str(item["_id"])
        history.append(item)
    return {"quiz_history": history}

@app.get("/")
async def root():
    return {"message": "Student Development Tracking API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint to verify API and database connectivity"""
    try:
        # Test MongoDB connection
        await users_collection.find_one({})
        return {
            "status": "healthy",
            "database": "connected",
            "message": "API is running"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }
