from cerebras.cloud.sdk import Cerebras
from app.config import settings
from typing import List, Dict, Any
import json
import re
import logging

logger = logging.getLogger(__name__)

client = Cerebras(api_key="csk-5dfr98efhr3dh8nexcdwvfdcyp2fv934xy3ctp6phy6j9jvy")


def _extract_json(text: str):
    """Extract and parse JSON from LLM response, handling markdown code blocks and empty content."""
    if not text or not isinstance(text, str):
        return None
    text = text.strip()
    if not text:
        return None
    # Strip markdown code block if present (e.g. ```json ... ``` or ``` ... ```)
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        text = match.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.warning("LLM response was not valid JSON: %s", e)
        return None


async def generate_eq_test(grade_level: int = 5) -> List[Dict[str, Any]]:
    """Generate a 5-question EQ test based on the EmoSocio model"""

    prompt = f"""System Role: Act as an expert educational psychologist and psychometrician implementing the EduCardia Social and Emotional Learning (SEL) methodology.Task: Generate an assessment questionnaire to evaluate a student's emotional and social competencies based on the EmoSocio model. Tailor the language and scenarios to be culturally relevant for a typical school environment in India.Input Variable: [Target_Age_Group] (e.g., 6-8, 9-12, or 13-18)Methodology Rules strictly based on the target age:If Age is 6-8: Generate questions for a Rating Scale assessment. The questions must be directed at the teacher to respond on behalf of each student based on their daily observations.If Age is 9-12 or 13-18: Generate questions for a Self-Report assessment. The questions must be directed at the student to evaluate their own behavior and feelings.
* For All Ages (Sociometry): Generate 4 Peer Nomination questions where the student selects peers from their classroom based on specific criteria (e.g., who they want to collaborate with).Parameter Coverage:
1. Generate 12 Likert-scale questions covering the Individual Emotional Competencies: Empathy, Self-Awareness, Emotional Regulation, Flexibility, Influence, Emotional Expression, Optimism, Assertiveness, Self-motivation, Relationships, Self-Esteem, and Teamwork.
2. Generate 3 Likert-scale questions covering the Group Emotional Competencies: Group Emotional Awareness, Group Emotional Regulation, and Group Emotional Climate.
3. Generate 4 Peer Nomination questions designed to calculate Sociometric Indexes (Popularity, Antipathy, Affective Connection, Social Expansion, etc.).Output Format: Provide the output as a strict, clean JSON array of objects. Each object must contain parameter_measured, question_text, target_audience (student or teacher), and response_type (Likert or Peer_Nomination)."""

    response = client.chat.completions.create(
        model="gpt-oss-120b",
        messages=[
            {"role": "system", "content": "You are an expert in child psychology and emotional intelligence assessment."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )

    content = response.choices[0].message.content if response.choices else None
    if not content or not str(content).strip():
        logger.warning("LLM returned empty content for generate_eq_test")
        return []

    parsed = _extract_json(str(content))
    if parsed is None:
        return []
    if isinstance(parsed, list):
        return parsed
    if isinstance(parsed, dict) and "questions" in parsed:
        return parsed["questions"]
    if isinstance(parsed, dict):
        return [parsed]
    return []


async def generate_iq_test(grade_level: int = 5) -> List[Dict[str, Any]]:
    """
    Generate a simple IQ-style test.
    For reliability in development, this uses a static question set
    instead of calling the LLM.
    """
    return [
        {
            "parameter_measured": "Logical Reasoning",
            "question_text": "What number should come next in the sequence: 2, 4, 6, 8, ?",
            "options": ["9", "10", "12", "14"],
            "correct_index": 1,
        },
        {
            "parameter_measured": "Pattern Recognition",
            "question_text": "Which shape completes the pattern: ■, ▲, ■, ▲, ?",
            "options": ["■", "▲", "●", "★"],
            "correct_index": 0,
        },
        {
            "parameter_measured": "Spatial Reasoning",
            "question_text": "A square has 4 sides. How many sides do two squares have together?",
            "options": ["4", "6", "8", "10"],
            "correct_index": 2,
        },
        {
            "parameter_measured": "Verbal Reasoning",
            "question_text": "Which word does NOT belong with the others?",
            "options": ["apple", "banana", "carrot", "mango"],
            "correct_index": 2,
        },
        {
            "parameter_measured": "Numerical Reasoning",
            "question_text": "If 5 + 3 = 8, what is 9 − 4?",
            "options": ["3", "4", "5", "6"],
            "correct_index": 2,
        },
    ]


async def generate_parent_report(apaar_id: str, test_results: List[Dict], student_profile: Dict) -> Dict[str, Any]:
    """Analyze test results and generate a comprehensive parent report with SEL remedies"""

    payload = {
        "apaar_id": apaar_id,
        "student": {
            "full_name": student_profile.get("full_name", "Student"),
            "grade": student_profile.get("grade"),
            "age_years": student_profile.get("age_years"),
        },
        "test_results": test_results[:50] if test_results else [],
    }

    prompt = f"""System Role: Act as an expert educational psychologist implementing the EduCardia Social and Emotional Learning (SEL) methodology.
Task: Generate a constructive summative SEL evaluation using ONLY the provided student profile and test results (data may be incomplete).
IMPORTANT:
- Do NOT ask the user for more data.
- If parameter scores are missing, infer patterns from the available quiz attempts and physical notes, and clearly state assumptions.
- Return valid JSON ONLY.

Input data:
{json.dumps(payload, ensure_ascii=False, default=str)[:12000]}

Output JSON keys (exact):
1. Data_Analysis: plain-language interpretation for parents/teacher (strengths + areas to improve).
2. Sub_grouping_Recommendation: grouping/peer-support recommendation (or empty string).
3. Targeted_SEL_Activities: array of at least 2 objects with title, description, duration (SAFE approach).
4. Progress_Tracking: what to monitor in the next assessment."""

    response = client.chat.completions.create(
        model="gpt-oss-120b",
        messages=[
            {"role": "system", "content": "Return valid JSON only. Never ask follow-up questions."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.6
    )

    content = response.choices[0].message.content if response.choices else None
    if not content or not str(content).strip():
        logger.warning("LLM returned empty content for generate_parent_report")
        return {
            "Data_Analysis": "Report could not be generated.",
            "Sub_grouping_Recommendation": "",
            "Targeted_SEL_Activities": [],
            "Progress_Tracking": "",
        }

    report = _extract_json(str(content))
    if isinstance(report, dict):
        if not isinstance(report.get("Targeted_SEL_Activities"), list):
            report["Targeted_SEL_Activities"] = []
        # Ensure required keys exist
        report.setdefault("Data_Analysis", "")
        report.setdefault("Sub_grouping_Recommendation", "")
        report.setdefault("Progress_Tracking", "")
        return report
    return {
        "Data_Analysis": str(content)[:2000] if content else "Report could not be generated.",
        "Sub_grouping_Recommendation": "",
        "Targeted_SEL_Activities": [],
        "Progress_Tracking": "",
    }


async def generate_quiz_report_and_remedies(
    questions: List[Dict[str, Any]],
    answers: List[Any],
    score: Any,
    student_profile: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Generate a detailed report + SEL remedies for a single quiz attempt.
    Same JSON shape as generate_parent_report so the app can render one UI.
    """
    payload = {
        "questions": questions[:50] if questions else [],
        "answers": answers[:50] if answers else [],
        "score": score,
        "student": {
            "grade": student_profile.get("grade"),
            "full_name": student_profile.get("full_name", "Student"),
        },
    }

    prompt = f"""System Role: Act as an expert educational psychologist implementing the EduCardia Social and Emotional Learning (SEL) methodology.
Task: A student has completed one quiz attempt. Below is the JSON payload of questions and their answers (Likert indices 0-4 may be used).
Analyze this single attempt only. Produce a concise but complete report for parents/teachers.

Input data:
{json.dumps(payload, ensure_ascii=False, default=str)[:12000]}

Output Generation: Return JSON only with these keys:
1. Data_Analysis: Plain-language interpretation of this quiz attempt (strengths, areas to work on, emotional tone).
2. Sub_grouping_Recommendation: Brief note on peer/social support or classroom grouping if relevant; else empty string.
3. Targeted_SEL_Activities: Array of at least 2 objects with title, description, duration (SAFE approach).
4. Progress_Tracking: What to monitor on the next quiz."""

    try:
        response = client.chat.completions.create(
            model="gpt-oss-120b",
            messages=[
                {"role": "system", "content": "You are an expert educational psychologist. Respond with valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
        )
        content = response.choices[0].message.content if response.choices else None
        if not content or not str(content).strip():
            return _fallback_quiz_report()
        report = _extract_json(str(content))
        if isinstance(report, dict) and report.get("Data_Analysis"):
            # Ensure list structure for activities
            if not isinstance(report.get("Targeted_SEL_Activities"), list):
                report["Targeted_SEL_Activities"] = []
            return report
    except Exception as e:
        logger.warning("generate_quiz_report_and_remedies failed: %s", e)

    return _fallback_quiz_report()


def _fallback_quiz_report() -> Dict[str, Any]:
    return {
        "Data_Analysis": "Detailed analysis could not be generated for this attempt. Your answers have been saved.",
        "Sub_grouping_Recommendation": "",
        "Targeted_SEL_Activities": [
            {"title": "Daily reflection", "description": "Spend 5 minutes reflecting on one social interaction.", "duration": "5 min"},
            {"title": "Breathing before responding", "description": "Practice one slow breath before answering when upset.", "duration": "2 min"},
        ],
        "Progress_Tracking": "Compare patterns on the next quiz and note any consistent low or high areas.",
    }


async def generate_physical_advice(
    physical_metrics: Dict[str, Any],
    student_profile: Dict[str, Any],
    notes: str | None = None,
) -> Dict[str, Any]:
    """
    Generate practical, general physical well-being advice based on available metrics.
    Returns JSON-only dict with keys: Summary, Key_Findings, Advice, Safety_Note.
    All inputs are optional; function should never raise.
    """
    payload = {
        "student": {
            "full_name": student_profile.get("full_name", "Student"),
            "grade": student_profile.get("grade"),
        },
        "physical_metrics": physical_metrics,
        "notes": notes or "",
    }

    prompt = f"""System Role: Act as a school health and fitness coach for children in India.
Task: Using ONLY the provided metrics (some may be missing), provide safe, practical advice.
Do NOT diagnose. If values look concerning, recommend consulting a qualified doctor.

Input:
{json.dumps(payload, ensure_ascii=False, default=str)[:12000]}

Return JSON only with keys:
1. Summary: 2-3 sentences
2. Key_Findings: 3-6 bullet strings
3. Advice: 5-8 actionable tips (sleep, hydration, activity, posture, diet)
4. Safety_Note: one short disclaimer line
"""
    try:
        response = client.chat.completions.create(
            model="gpt-oss-120b",
            messages=[
                {"role": "system", "content": "Return valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
        )
        content = response.choices[0].message.content if response.choices else None
        if not content or not str(content).strip():
            return {
                "Summary": "Advice could not be generated right now. Your data has been saved.",
                "Key_Findings": [],
                "Advice": [],
                "Safety_Note": "This is general guidance, not medical advice.",
            }
        parsed = _extract_json(str(content))
        if isinstance(parsed, dict):
            return parsed
    except Exception as e:
        logger.warning("generate_physical_advice failed: %s", e)

    return {
        "Summary": "Advice could not be generated right now. Your data has been saved.",
        "Key_Findings": [],
        "Advice": [],
        "Safety_Note": "This is general guidance, not medical advice.",
    }
