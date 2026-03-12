from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    PARENT = "parent"

class User(BaseModel):
    email: EmailStr
    hashed_password: str
    role: UserRole
    full_name: str
    apaar_id: Optional[str] = None  # For students, this is their own ID; for parents, their child's ID
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: UserRole
    full_name: str
    apaar_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str
    role: UserRole
    apaar_id: Optional[str] = None

class StudentProfile(BaseModel):
    apaar_id: str
    full_name: str
    grade: int
    date_of_birth: datetime
    parent_email: Optional[str] = None
    school_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TestType(str, Enum):
    IQ = "iq"
    EQ = "eq"
    PHYSICAL = "physical"

class TestResult(BaseModel):
    apaar_id: Optional[str] = None
    test_type: TestType
    test_date: datetime = Field(default_factory=datetime.utcnow)
    questions: Optional[List[Dict[str, Any]]] = None  # For IQ/EQ tests
    answers: Optional[List[Any]] = None  # Student's answers
    score: Optional[float] = None
    physical_metrics: Optional[Dict[str, Any]] = None  # For physical tests (BMI, fitness scores, etc.)
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EQCompetency(BaseModel):
    category: str  # "intrapersonal" or "interpersonal"
    competency: str  # e.g., "self-awareness", "empathy"
    score: float
    description: str

class ActionableRemedy(BaseModel):
    apaar_id: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    report_summary: str
    strengths: List[str]
    weaknesses: List[str]
    eq_competencies: List[EQCompetency]
    sel_activities: List[Dict[str, str]]  # {"title": "...", "description": "...", "duration": "..."}
    cognitive_exercises: List[Dict[str, str]]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PhysicalTestInput(BaseModel):
    apaar_id: str
    bmi: Optional[float] = None
    fitness_score: Optional[float] = None
    health_notes: Optional[str] = None
    additional_metrics: Optional[Dict[str, Any]] = None
