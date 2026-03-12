import asyncio
from fastapi import FastAPI, HTTPException, Depends, status, Request, BackgroundTasks
from fastapi.exceptions import RequestValidationError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta, datetime, timezone
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

# Helper function to get Indian Standard Time
def get_ist_now():
    """Get current time in Indian Standard Time (IST = UTC+5:30)"""
    ist_offset = timezone(timedelta(hours=5, minutes=30))
    return datetime.now(ist_offset)

# Background task for generating parent report
async def generate_parent_report_background(apaar_id: str, email: str):
    """Background task to generate comprehensive parent report after test submission"""
    try:
        logger.info(f"[BACKGROUND TASK] Starting parent report generation for {apaar_id}")
        
        # Fetch student profile
        profile = await student_profiles_collection.find_one({"apaar_id": apaar_id})
        if not profile:
            profile = {"full_name": "Student", "grade": None}
            logger.warning(f"[BACKGROUND TASK] No profile found for {apaar_id}, using default")
        else:
            logger.info(f"[BACKGROUND TASK] Found profile for {apaar_id}")
        
        # Fetch all test results for this student
        all_results = await test_results_collection.find(
            {"apaar_id": apaar_id}
        ).to_list(length=100)
        logger.info(f"[BACKGROUND TASK] Found {len(all_results)} test results for {apaar_id}")
        
        if len(all_results) == 0:
            logger.warning(f"[BACKGROUND TASK] No test results found for {apaar_id}, skipping report generation")
            return
        
        # Generate comprehensive parent report with chart data
        logger.info(f"[BACKGROUND TASK] Calling generate_parent_report for {apaar_id}")
        parent_report = await generate_parent_report(
            apaar_id=apaar_id,
            test_results=all_results,
            student_profile=profile
        )
        
        # Log report type and details
        if parent_report.get("is_fallback"):
            logger.warning(f"[BACKGROUND TASK] ⚠️  FALLBACK report generated for {apaar_id}")
            logger.warning(f"[BACKGROUND TASK] Reason: {parent_report.get('fallback_reason', 'Unknown')}")
        else:
            logger.info(f"[BACKGROUND TASK] ✅ REAL LLM report generated for {apaar_id}")
        
        logger.info(f"[BACKGROUND TASK] Report contains {len(parent_report.get('visuals', []))} chart(s)")
        logger.info(f"[BACKGROUND TASK] Report contains {len(parent_report.get('Targeted_SEL_Activities', []))} SEL activities")
        
        # Store the report in actionable_remedies collection
        report_doc = {
            "apaar_id": apaar_id,
            "generated_at": get_ist_now(),
            "data_analysis": parent_report.get("Data_Analysis", ""),
            "sub_grouping_recommendation": parent_report.get("Sub_grouping_Recommendation", ""),
            "targeted_sel_activities": parent_report.get("Targeted_SEL_Activities", []),
            "progress_tracking": parent_report.get("Progress_Tracking", ""),
            "visuals": parent_report.get("visuals", []),
            "competency_scores": {},
            "created_at": get_ist_now(),
        }
        
        remedy_insert = await actionable_remedies_collection.insert_one(report_doc)
        logger.info(f"[BACKGROUND TASK] Stored report in actionable_remedies for {apaar_id}, ID: {remedy_insert.inserted_id}")
        
        # Also add to quiz_history for tracking
        child_user = await users_collection.find_one({"role": "student", "apaar_id": apaar_id})
        child_email = child_user.get("email") if child_user else email
        
        await quiz_history_collection.insert_one({
            "kind": "parent_report",
            "child_email": child_email,
            "apaar_id": apaar_id,
            "actionable_remedy_id": str(remedy_insert.inserted_id),
            "included_test_result_ids": [str(r.get("_id")) for r in all_results if r.get("_id")],
            "report": {
                "Data_Analysis": parent_report.get("Data_Analysis", ""),
                "Sub_grouping_Recommendation": parent_report.get("Sub_grouping_Recommendation", ""),
                "Targeted_SEL_Activities": parent_report.get("Targeted_SEL_Activities", []),
                "Progress_Tracking": parent_report.get("Progress_Tracking", ""),
                "visuals": parent_report.get("visuals", []),
            },
            "created_at": get_ist_now(),
        })
        logger.info(f"[BACKGROUND TASK] Stored report in quiz_history for {apaar_id}")
        
        logger.info(f"[BACKGROUND TASK] ✅ Successfully completed parent report generation for {apaar_id}")
        
    except Exception as e:
        # Log but don't fail - this is a background task
        logger.exception(f"[BACKGROUND TASK] ❌ Failed to generate parent report for {apaar_id}: {e}")

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
        user_dict = {
            "email": user_data.email,
            "hashed_password": get_password_hash(user_data.password),
            "role": user_data.role.value if isinstance(user_data.role, UserRole) else user_data.role,
            "full_name": user_data.full_name,
            "apaar_id": user_data.apaar_id,
            "created_at": get_ist_now()
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
        # ✅ 60s hard timeout so the route never hangs and blocks other requests
        questions = await asyncio.wait_for(
            generate_eq_test(grade),
            timeout=60.0
        )
    except asyncio.TimeoutError:
        logger.warning("generate-eq-test timed out after 60s")
        raise HTTPException(
            status_code=503,
            detail="Test generation timed out. Please try again.",
        )
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

    if not questions:
        raise HTTPException(
            status_code=502,
            detail="No questions were generated. Please try again.",
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
async def submit_test(test_result: TestResult, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
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
            
            # Log quiz report details
            if quiz_report:
                if quiz_report.get("is_fallback"):
                    logger.warning(f"⚠️  FALLBACK quiz report for {current_user['apaar_id']}")
                    logger.warning(f"Reason: {quiz_report.get('fallback_reason', 'Unknown')}")
                else:
                    logger.info(f"✅ REAL LLM quiz report for {current_user['apaar_id']}")
                logger.info(f"Quiz report: {len(quiz_report.get('visuals', []))} chart(s), {len(quiz_report.get('Targeted_SEL_Activities', []))} activities")
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
        "created_at": get_ist_now(),
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
                # Log retry success
                if quiz_report.get("is_fallback"):
                    logger.warning(f"⚠️  FALLBACK quiz report (retry) for {current_user['apaar_id']}")
                else:
                    logger.info(f"✅ REAL LLM quiz report (retry) for {current_user['apaar_id']}")
        except Exception as e:
            logger.exception("Per-quiz report retry failed: %s", e)

    # Schedule background task to auto-generate comprehensive parent report
    # This runs asynchronously and doesn't block the response
    background_tasks.add_task(
        generate_parent_report_background,
        current_user["apaar_id"],
        current_user["email"]
    )
    logger.info(f"Scheduled background parent report generation for {current_user['apaar_id']}")

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

@app.get("/api/student/physical-health")
async def get_student_physical_health(current_user: dict = Depends(get_current_user)):
    """Get student's physical metrics and generate personalized nutrition plan"""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Fetch latest physical test data
    physical_test = await test_results_collection.find_one(
        {"apaar_id": current_user["apaar_id"], "test_type": "physical"},
        sort=[("created_at", -1)]
    )
    
    if not physical_test:
        return {"has_data": False, "physical_metrics": None, "nutrition_plan": None}
    
    # Fetch student profile for age/gender
    profile = await student_profiles_collection.find_one({"apaar_id": current_user["apaar_id"]})
    if not profile:
        profile = await users_collection.find_one({"apaar_id": current_user["apaar_id"]})
    
    # Generate nutrition plan
    from app.llm_service import generate_nutrition_plan
    try:
        nutrition_plan = await generate_nutrition_plan(
            physical_metrics=physical_test.get("physical_metrics", {}),
            student_profile=profile or {},
            health_notes=physical_test.get("notes", "")
        )
    except Exception as e:
        logger.exception(f"Failed to generate nutrition plan: {e}")
        nutrition_plan = None
    
    return {
        "has_data": True,
        "physical_metrics": physical_test.get("physical_metrics", {}),
        "health_notes": physical_test.get("notes", ""),
        "last_updated": physical_test.get("created_at"),
        "nutrition_plan": nutrition_plan
    }

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
    
    # Log received data
    logger.info("=" * 80)
    logger.info("📊 PHYSICAL TEST DATA RECEIVED")
    logger.info("=" * 80)
    logger.info(f"APAAR ID: {data.apaar_id}")
    logger.info(f"BMI: {data.bmi}")
    logger.info(f"Fitness Score: {data.fitness_score}")
    logger.info(f"Height (cm): {data.height_cm}")
    logger.info(f"Weight (kg): {data.weight_kg}")
    logger.info(f"Heart Rate (bpm): {data.resting_heart_rate}")
    logger.info(f"BP Systolic (mmHg): {data.systolic_bp}")
    logger.info(f"BP Diastolic (mmHg): {data.diastolic_bp}")
    logger.info(f"Sleep (hours): {data.sleep_hours}")
    logger.info(f"Health Notes: {data.health_notes}")
    logger.info("=" * 80)
    
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
    
    logger.info(f"📦 Storing physical_metrics: {physical_metrics}")
    logger.info("=" * 80)

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
        "test_date": get_ist_now(),
        "physical_metrics": physical_metrics,
        "notes": data.health_notes,
        "physical_advice": advice,
        "created_at": get_ist_now()
    }
    
    await test_results_collection.insert_one(test_result_dict)
    return {"message": "Physical test data uploaded successfully", "physical_advice": advice}

@app.get("/api/teacher/physical-test/{apaar_id}")
async def get_physical_test(apaar_id: str, current_user: dict = Depends(get_current_user)):
    """Get the latest physical test data for a student with nutrition plan"""
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Find the most recent physical test for this student
    physical_test = await test_results_collection.find_one(
        {"apaar_id": apaar_id, "test_type": "physical"},
        sort=[("created_at", -1)]
    )
    
    if not physical_test:
        return {"has_data": False, "data": None}
    
    # Convert ObjectId to string
    physical_test["_id"] = str(physical_test["_id"])
    
    # Fetch student profile for nutrition plan generation
    profile = await student_profiles_collection.find_one({"apaar_id": apaar_id})
    
    # Generate nutrition plan
    from app.llm_service import generate_nutrition_plan
    try:
        nutrition_plan = await generate_nutrition_plan(
            physical_metrics=physical_test.get("physical_metrics", {}),
            student_profile=profile or {},
            health_notes=physical_test.get("notes")
        )
        physical_test["nutrition_plan"] = nutrition_plan
    except Exception as e:
        logger.exception(f"Failed to generate nutrition plan: {e}")
        physical_test["nutrition_plan"] = None
    
    return {"has_data": True, "data": physical_test}

@app.post("/api/teacher/upload-physical-tests-bulk")
async def upload_physical_tests_bulk(payload: PhysicalBulkUploadRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Access denied")

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
                "test_date": get_ist_now(),
                "physical_metrics": physical_metrics,
                "notes": item.health_notes,
                "physical_advice": advice,
                "created_at": get_ist_now(),
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
            now = get_ist_now()
            age_years = now.year - dob.year - ((now.month, now.day) < (dob.month, dob.day))
            profile["age_years"] = max(age_years, 0)
    except Exception:
        pass
    
    results = []
    async for result in test_results_collection.find({"apaar_id": current_user["apaar_id"]}):
        result["_id"] = str(result["_id"])
        results.append(result)
    
    report_data = await generate_parent_report(current_user["apaar_id"], results, profile)
    
    # Log report details
    if report_data.get("is_fallback"):
        logger.warning(f"⚠️  FALLBACK parent report for {current_user['apaar_id']}")
        logger.warning(f"Reason: {report_data.get('fallback_reason', 'Unknown')}")
    else:
        logger.info(f"✅ REAL LLM parent report for {current_user['apaar_id']}")
    logger.info(f"Parent report: {len(report_data.get('visuals', []))} chart(s), {len(report_data.get('Targeted_SEL_Activities', []))} activities")
    
    now = get_ist_now()
    remedy_dict = {
        "apaar_id": current_user["apaar_id"],
        "generated_at": now.isoformat(),           # ✅ convert datetime to string
        "data_analysis": report_data["Data_Analysis"],
        "sub_grouping_recommendation": report_data["Sub_grouping_Recommendation"],
        "targeted_sel_activities": report_data["Targeted_SEL_Activities"],
        "progress_tracking": report_data["Progress_Tracking"],
        "visuals": report_data.get("visuals", []),
        "competency_scores": {},
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
            "visuals": report_data.get("visuals", []),
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
