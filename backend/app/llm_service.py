from cerebras.cloud.sdk import Cerebras
from app.config import settings
from typing import List, Dict, Any
import json

client = Cerebras(api_key="csk-5dfr98efhr3dh8nexcdwvfdcyp2fv934xy3ctp6phy6j9jvy")

async def generate_eq_test(grade_level: int = 5) -> List[Dict[str, Any]]:
    """Generate a 5-question EQ test based on the EmoSocio model"""
    
    prompt = f"""Generate a 5-question Emotional Intelligence (EQ) assessment for a grade {grade_level} student based on the EmoSocio model.

The EmoSocio model includes:
- Intrapersonal competencies: self-awareness, emotional regulation, self-motivation, optimism, self-esteem
- Interpersonal competencies: empathy, teamwork, flexibility, emotional expression, assertiveness, influence, relationships

Create 5 multiple-choice questions (4 options each) that assess different competencies. Each question should be age-appropriate and scenario-based.

Return ONLY a valid JSON array with this exact structure:
[
  {{
    "question": "question text",
    "options": ["option A", "option B", "option C", "option D"],
    "competency": "competency name",
    "category": "intrapersonal or interpersonal",
    "correct_answer": 0
  }}
]

The correct_answer is the index (0-3) of the best answer that demonstrates high EQ."""

    response = client.chat.completions.create(
        model="gpt-oss-120b",
        messages=[
            {"role": "system", "content": "You are an expert in child psychology and emotional intelligence assessment."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )
    
    questions = json.loads(response.choices[0].message.content)
    return questions

async def generate_parent_report(apaar_id: str, test_results: List[Dict], student_profile: Dict) -> Dict[str, Any]:
    """Analyze test results and generate a comprehensive parent report with SEL remedies"""
    
    prompt = f"""Analyze the following student data and generate a comprehensive parent report with actionable SEL remedies.

Student: {student_profile.get('full_name', 'Student')} (Grade {student_profile.get('grade', 'N/A')})
APAAR ID: {apaar_id}

Test Results Summary:
{json.dumps(test_results, indent=2)}

Generate a report that includes:
1. A summary paragraph for parents
2. List of 3-5 key strengths
3. List of 3-5 areas for improvement
4. EQ competency breakdown with scores (0-100)
5. 5 specific SEL activities tailored to address weaknesses
6. 5 cognitive exercises to improve identified areas

Return ONLY valid JSON with this structure:
{{
  "report_summary": "paragraph for parents",
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "eq_competencies": [
    {{"category": "intrapersonal", "competency": "self-awareness", "score": 75, "description": "brief description"}}
  ],
  "sel_activities": [
    {{"title": "activity name", "description": "what to do", "duration": "15 minutes"}}
  ],
  "cognitive_exercises": [
    {{"title": "exercise name", "description": "what to do", "duration": "10 minutes"}}
  ]
}}"""

    response = client.chat.completions.create(
        model="gpt-oss-120b",
        messages=[
            {"role": "system", "content": "You are an expert educational psychologist specializing in K-12 student development."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )
    
    report = json.loads(response.choices[0].message.content)
    return report