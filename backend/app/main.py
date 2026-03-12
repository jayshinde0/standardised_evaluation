from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.exceptions import RequestValidationError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
from typing import List, Optional
from app.config import settings
from app.database import (
    users_collection,
    student_profiles_collection,
    test_results_collection,
    actionable_remedies_collection,
    quiz_history_collection,
    create_indexes,
)
from app.models import (
    User, UserCreate, UserLogin, Token, StudentProfile,
    TestResult, ActionableRemedy, PhysicalTestInput, PhysicalBulkUploadRequest, UserRole, TestType
)
from app.auth import get_password_hash, verify_password, create_access_token, decode_access_token
from app.llm_service import (
    generate_eq_test,
    generate_iq_test,
    generate_parent_report,
    generate_quiz_report_and_remedies,
    generate_physical_advice,
)
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

    try:
        questions = await generate_eq_test(grade)
    except Exception as e:
        err_name = type(e).__name__
        err_msg = str(e).lower()
        if err_name == "RateLimitError" or "429" in err_msg or "rate" in err_msg or "too_many_requests" in err_msg or "high traffic" in err_msg:
            raise HTTPException(
                status_code=503,
                detail="Service is busy. Please try again in a moment.",
            )
        logger.exception("generate-eq-test failed")
        raise HTTPException(
            status_code=502,
            detail="Could not generate test. Please try again.",
        )
    return {"questions": questions}


@app.post("/api/student/generate-iq-test")
async def get_iq_test(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Access denied")

    profile = await student_profiles_collection.find_one({"apaar_id": current_user["apaar_id"]})
    grade = profile.get("grade", 5) if profile else 5

    # For now, IQ questions are generated from a static helper and
    # are unlikely to fail; keep error handling simple.
    try:
        questions = await generate_iq_test(grade)
    except Exception:
        logger.exception("generate-iq-test failed")
        raise HTTPException(
            status_code=502,
            detail="Could not generate test. Please try again.",
        )
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

    # Compute IQ score (percentage correct) if applicable
    if result_dict.get("test_type") == "iq" and result_dict.get("questions") and result_dict.get("answers"):
        questions = result_dict.get("questions") or []
        answers = result_dict.get("answers") or []
        total = 0
        correct = 0
        for idx, q in enumerate(questions):
            if idx >= len(answers):
                break
            a = answers[idx]
            try:
                # Accept numeric or numeric-like string
                if isinstance(a, str):
                    a_val = int(a)
                else:
                    a_val = int(a)
            except Exception:
                continue
            if isinstance(q, dict) and isinstance(q.get("correct_index"), int):
                total += 1
                if a_val == q["correct_index"]:
                    correct += 1
        if total > 0:
            result_dict["score"] = round((correct / total) * 100.0, 1)

    insert_result = await test_results_collection.insert_one(result_dict)
    from datetime import datetime

    profile = await student_profiles_collection.find_one({"apaar_id": current_user["apaar_id"]})
    if not profile:
        profile = {"full_name": current_user.get("full_name", "Student"), "grade": None}

    quiz_report = None
    if result_dict.get("test_type") in ("eq", "iq") and result_dict.get("questions"):
        try:
            quiz_report = await generate_quiz_report_and_remedies(
                result_dict.get("questions") or [],
                result_dict.get("answers") or [],
                result_dict.get("score"),
                profile,
            )
        except Exception as e:
            logger.exception("Per-quiz report generation failed: %s", e)
            quiz_report = None

    history_doc = {
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
        "report": quiz_report,
    }
    history_insert = await quiz_history_collection.insert_one(history_doc)

    # If LLM failed before insert, try again with update
    if not quiz_report and result_dict.get("questions"):
        try:
            quiz_report = await generate_quiz_report_and_remedies(
                result_dict.get("questions") or [],
                result_dict.get("answers") or [],
                result_dict.get("score"),
                profile,
            )
            if quiz_report:
                await quiz_history_collection.update_one(
                    {"_id": history_insert.inserted_id},
                    {"$set": {"report": quiz_report}},
                )
        except Exception as e:
            logger.exception("Per-quiz report retry failed: %s", e)

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
    async for student in users_collection.find():
        student["_id"] = str(student["_id"])
        students.append(student)
    
    return {"students": students}

@app.post("/api/teacher/upload-physical-test")
async def upload_physical_test(data: PhysicalTestInput, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Access denied")
    
    from datetime import datetime
    # Base physical metrics (all optional)
    physical_metrics = {
        "bmi": data.bmi,
        "fitness_score": data.fitness_score,
        "height_cm": data.height_cm,
        "weight_kg": data.weight_kg,
        "resting_heart_rate": data.resting_heart_rate,
        "systolic_bp": data.systolic_bp,
        "diastolic_bp": data.diastolic_bp,
        "sleep_hours": data.sleep_hours,
        "additional_metrics": data.additional_metrics,
    }
    # Remove nulls to keep documents clean
    physical_metrics = {k: v for k, v in physical_metrics.items() if v is not None}

    student_profile = await student_profiles_collection.find_one({"apaar_id": data.apaar_id}) or {}
    advice = None
    try:
        advice = await generate_physical_advice(physical_metrics, student_profile, data.health_notes)
    except Exception:
        logger.exception("generate_physical_advice failed")
        advice = None

    test_result_dict = {
        "apaar_id": data.apaar_id,
        "test_type": "physical",
        "test_date": datetime.utcnow(),
        "physical_metrics": physical_metrics,
        "notes": data.health_notes,
        "physical_advice": advice,
        "created_at": datetime.utcnow()
    }
    
    await test_results_collection.insert_one(test_result_dict)
    return {"message": "Physical test data uploaded successfully", "physical_advice": advice}

@app.post("/api/teacher/upload-physical-tests-bulk")
async def upload_physical_tests_bulk(payload: PhysicalBulkUploadRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Access denied")

    from datetime import datetime
    inserted = 0
    failed = 0
    errors = []

    for idx, item in enumerate(payload.items or []):
        try:
            email = item.email
            apaar_id = item.apaar_id
            if not email and not apaar_id:
                failed += 1
                errors.append({"row": idx + 1, "error": "Missing email or apaar_id"})
                continue

            if not apaar_id and email:
                user = await users_collection.find_one({"email": email})
                apaar_id = user.get("apaar_id") if user else None
                if not apaar_id:
                    failed += 1
                    errors.append({"row": idx + 1, "error": f"No student found for email {email}"})
                    continue

            physical_metrics = {
                "bmi": item.bmi,
                "fitness_score": item.fitness_score,
                "height_cm": item.height_cm,
                "weight_kg": item.weight_kg,
                "resting_heart_rate": item.resting_heart_rate,
                "systolic_bp": item.systolic_bp,
                "diastolic_bp": item.diastolic_bp,
                "sleep_hours": item.sleep_hours,
                "additional_metrics": item.additional_metrics,
            }
            physical_metrics = {k: v for k, v in physical_metrics.items() if v is not None}

            student_profile = await student_profiles_collection.find_one({"apaar_id": apaar_id}) or {}
            advice = None
            try:
                advice = await generate_physical_advice(physical_metrics, student_profile, item.health_notes)
            except Exception:
                logger.exception("generate_physical_advice failed in bulk")
                advice = None

            test_result_dict = {
                "apaar_id": apaar_id,
                "test_type": "physical",
                "test_date": datetime.utcnow(),
                "physical_metrics": physical_metrics,
                "notes": item.health_notes,
                "physical_advice": advice,
                "created_at": datetime.utcnow(),
            }
            await test_results_collection.insert_one(test_result_dict)
            inserted += 1
        except Exception as e:
            failed += 1
            errors.append({"row": idx + 1, "error": str(e)})

    return {"inserted": inserted, "failed": failed, "errors": errors[:50]}

# Parent endpoints
@app.get("/api/parent/child-profile")
async def get_child_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Access denied")
    
    profile = await users_collection.find_one({"apaar_id": current_user["apaar_id"]})
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
        profile = await users_collection.find_one({"apaar_id": current_user["apaar_id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Child profile not found")

    try:
        dob = profile.get("date_of_birth")
        if dob:
            from datetime import datetime
            now = datetime.utcnow()
            age_years = now.year - dob.year - ((now.month, now.day) < (dob.month, dob.day))
            profile["age_years"] = max(age_years, 0)
    except Exception:
        pass
    
    results = []
    async for result in test_results_collection.find({"apaar_id": current_user["apaar_id"]}):
        result["_id"] = str(result["_id"])
        results.append(result)
    
    report_data = await generate_parent_report(current_user["apaar_id"], results, profile)
    
    from datetime import datetime
    now = datetime.utcnow()
    remedy_dict = {
        "apaar_id": current_user["apaar_id"],
        "generated_at": now.isoformat(),           # ✅ convert datetime to string
        "data_analysis": report_data["Data_Analysis"],
        "sub_grouping_recommendation": report_data["Sub_grouping_Recommendation"],
        "targeted_sel_activities": report_data["Targeted_SEL_Activities"],
        "progress_tracking": report_data["Progress_Tracking"],
        "created_at": now.isoformat()              # ✅ convert datetime to string
    }

    # Use a separate dict with native datetime for MongoDB inserts
    remedy_db_dict = {**remedy_dict, "generated_at": now, "created_at": now}
    remedy_insert = await actionable_remedies_collection.insert_one(remedy_db_dict)
    
    child_user = await users_collection.find_one({"role": "student", "apaar_id": current_user["apaar_id"]})
    if not child_user:
        child_user = await users_collection.find_one({"email": current_user["email"]})
    child_email = child_user.get("email") if child_user else None

    await quiz_history_collection.insert_one({
        "kind": "parent_report",
        "child_email": child_email,
        "apaar_id": current_user["apaar_id"],
        "actionable_remedy_id": str(remedy_insert.inserted_id),  # ✅ already stringified
        "included_test_result_ids": [r.get("_id") for r in results if r.get("_id")],
        "report": {
            "Data_Analysis": report_data["Data_Analysis"],
            "Sub_grouping_Recommendation": report_data["Sub_grouping_Recommendation"],
            "Targeted_SEL_Activities": report_data["Targeted_SEL_Activities"],
            "Progress_Tracking": report_data["Progress_Tracking"],
        },
        "created_at": now,
    })
    
    remedy_dict["id"] = str(remedy_insert.inserted_id)  # ✅ add inserted ID as string
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
