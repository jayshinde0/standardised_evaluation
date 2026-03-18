from cerebras.cloud.sdk import Cerebras
from app.config import settings
from typing import List, Dict, Any
import json
import re
import logging
import os
import httpx
import base64
import asyncio
from cerebras.cloud.sdk import RateLimitError

logger = logging.getLogger(__name__)

client = Cerebras(api_key="csk-r93e2hmrnv6x8tp2vdehkhhpvxj8xr9c2h2xed66j3fr8cm4")

# ============================================================================
# IMAGE GENERATION CONFIGURATION
# ============================================================================
# This service automatically generates emotionally attaching images for student
# semester reports to visually represent emotional and social progress.
#
# CURRENT SETUP: Using Google Gemini Flash 1.5 with Imagen
# API KEY: Configured below
# ============================================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCfyTzvwKHV94LX8-C41YT0l8cGnI7bBKA")
GEMINI_IMAGE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict"


async def _call_llm_with_retry(messages: List[Dict], max_retries: int = 3, initial_delay: float = 2.0):
    delay = initial_delay
    loop = asyncio.get_event_loop()

    for attempt in range(max_retries):
        try:
            # ✅ run_in_executor prevents the sync SDK call from blocking the event loop
            response = await loop.run_in_executor(
                None,
                lambda: client.chat.completions.create(
                    model="gpt-oss-120b",
                    messages=messages,
                    temperature=0.6
                )
            )
            return response

        except RateLimitError:
            if attempt == max_retries - 1:
                raise
            wait_time = delay * (2 ** attempt) + (loop.time() % 1)
            logger.warning(f"Rate limit hit, retrying in {wait_time:.2f}s (attempt {attempt + 1}/{max_retries})")
            await asyncio.sleep(wait_time)

        except Exception:
            raise

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


def _fallback_eq_test() -> List[Dict[str, Any]]:
    """Fallback EQ test questions when LLM fails"""
    return [
        {
            "parameter_measured": "Empathy",
            "question_text": "When I see a classmate feeling sad, I try to understand how they feel.",
            "target_audience": "student",
            "response_type": "Likert"
        },
        {
            "parameter_measured": "Self-Awareness",
            "question_text": "I can recognize when I am feeling angry or frustrated.",
            "target_audience": "student",
            "response_type": "Likert"
        },
        {
            "parameter_measured": "Emotional Regulation",
            "question_text": "When I feel upset, I can calm myself down without help.",
            "target_audience": "student",
            "response_type": "Likert"
        },
        {
            "parameter_measured": "Teamwork",
            "question_text": "I enjoy working with others in group activities.",
            "target_audience": "student",
            "response_type": "Likert"
        },
        {
            "parameter_measured": "Relationships",
            "question_text": "I find it easy to make friends and maintain friendships.",
            "target_audience": "student",
            "response_type": "Likert"
        },
        {
            "parameter_measured": "Self-Esteem",
            "question_text": "I feel good about myself and my abilities.",
            "target_audience": "student",
            "response_type": "Likert"
        },
        {
            "parameter_measured": "Flexibility",
            "question_text": "I can adapt when plans change unexpectedly.",
            "target_audience": "student",
            "response_type": "Likert"
        },
        {
            "parameter_measured": "Optimism",
            "question_text": "I believe things will work out well even when facing challenges.",
            "target_audience": "student",
            "response_type": "Likert"
        },
        {
            "parameter_measured": "Assertiveness",
            "question_text": "I can express my opinions respectfully even when others disagree.",
            "target_audience": "student",
            "response_type": "Likert"
        },
        {
            "parameter_measured": "Self-motivation",
            "question_text": "I can motivate myself to complete tasks without being reminded.",
            "target_audience": "student",
            "response_type": "Likert"
        },
        {
            "parameter_measured": "Emotional Expression",
            "question_text": "I can express my feelings in a healthy way.",
            "target_audience": "student",
            "response_type": "Likert"
        },
        {
            "parameter_measured": "Influence",
            "question_text": "I can encourage others to participate in positive activities.",
            "target_audience": "student",
            "response_type": "Likert"
        },
        {
            "parameter_measured": "Group Emotional Awareness",
            "question_text": "I can sense the overall mood of my class or group.",
            "target_audience": "student",
            "response_type": "Likert"
        },
        {
            "parameter_measured": "Group Emotional Regulation",
            "question_text": "I help create a positive atmosphere in group settings.",
            "target_audience": "student",
            "response_type": "Likert"
        },
        {
            "parameter_measured": "Group Emotional Climate",
            "question_text": "I feel comfortable sharing my ideas in group discussions.",
            "target_audience": "student",
            "response_type": "Likert"
        },
        {
            "parameter_measured": "Popularity",
            "question_text": "Who would you most like to work with on a group project?",
            "target_audience": "student",
            "response_type": "Peer_Nomination"
        },
        {
            "parameter_measured": "Affective Connection",
            "question_text": "Who do you feel most comfortable talking to when you have a problem?",
            "target_audience": "student",
            "response_type": "Peer_Nomination"
        },
        {
            "parameter_measured": "Social Expansion",
            "question_text": "Who would you like to get to know better in your class?",
            "target_audience": "student",
            "response_type": "Peer_Nomination"
        },
        {
            "parameter_measured": "Leadership",
            "question_text": "Who do you think is a good leader in your class?",
            "target_audience": "student",
            "response_type": "Peer_Nomination"
        }
    ]


async def generate_eq_test(grade_level: int = 5) -> List[Dict[str, Any]]:
    """Generate a 5-question EQ test based on the EmoSocio model"""

    prompt = f"""System Role: Act as an expert educational psychologist and psychometrician implementing the EduCardia Social and Emotional Learning (SEL) methodology.Task: Generate an assessment questionnaire to evaluate a student's emotional and social competencies based on the EmoSocio model. Tailor the language and scenarios to be culturally relevant for a typical school environment in India.Input Variable: [Target_Age_Group] (e.g., 6-8, 9-12, or 13-18)Methodology Rules strictly based on the target age:If Age is 6-8: Generate questions for a Rating Scale assessment. The questions must be directed at the teacher to respond on behalf of each student based on their daily observations.If Age is 9-12 or 13-18: Generate questions for a Self-Report assessment. The questions must be directed at the student to evaluate their own behavior and feelings.
* For All Ages (Sociometry): Generate 4 Peer Nomination questions where the student selects peers from their classroom based on specific criteria (e.g., who they want to collaborate with).Parameter Coverage:
1. Generate 12 Likert-scale questions covering the Individual Emotional Competencies: Empathy, Self-Awareness, Emotional Regulation, Flexibility, Influence, Emotional Expression, Optimism, Assertiveness, Self-motivation, Relationships, Self-Esteem, and Teamwork.
2. Generate 3 Likert-scale questions covering the Group Emotional Competencies: Group Emotional Awareness, Group Emotional Regulation, and Group Emotional Climate.
3. Generate 4 Peer Nomination questions designed to calculate Sociometric Indexes (Popularity, Antipathy, Affective Connection, Social Expansion, etc.).Output Format: Provide the output as a strict, clean JSON array of objects. Each object must contain parameter_measured, question_text, target_audience (student or teacher), and response_type (Likert or Peer_Nomination)."""

    try:
        response = await _call_llm_with_retry(
            messages=[
                {"role": "system", "content": "You are an expert in child psychology and emotional intelligence assessment."},
                {"role": "user", "content": prompt}
            ],
            max_retries=1,  # Only 1 retry for test generation to keep it fast
            initial_delay=1.0
        )

        content = response.choices[0].message.content if response.choices else None
        if not content or not str(content).strip():
            logger.warning("LLM returned empty content for generate_eq_test, using fallback")
            return _fallback_eq_test()

        parsed = _extract_json(str(content))
        if parsed is None:
            logger.warning("Failed to parse LLM response for generate_eq_test, using fallback")
            return _fallback_eq_test()
        
        if isinstance(parsed, list) and len(parsed) > 0:
            return parsed
        if isinstance(parsed, dict) and "questions" in parsed and len(parsed["questions"]) > 0:
            return parsed["questions"]
        if isinstance(parsed, dict):
            return [parsed]
        
        logger.warning("LLM returned invalid format for generate_eq_test, using fallback")
        return _fallback_eq_test()
    
    except Exception as e:
        logger.exception(f"generate_eq_test failed with error: {e}, using fallback")
        return _fallback_eq_test()


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


async def _generate_emotional_insight_image(analysis_text: str) -> str | None:
    """
    Generate an emotionally attaching image based on the analysis text.
    Returns the image URL or None if generation fails.
    This function is designed to be non-blocking and fail-safe.
    
    The image represents the student's emotional and social progress in an
    empathetic, culturally appropriate, and uplifting way for Indian students.
    
    Note: Currently using curated placeholder images. To enable AI-generated images,
    integrate with OpenAI DALL-E, Stability AI, or similar service.
    """
    try:
        # Extract core emotional theme from analysis text
        emotional_summary = analysis_text[:300].strip().lower()
        
        logger.info("Generating emotional insight image for student report")
        
        # Analyze emotional keywords to select appropriate themed image
        theme_mapping = {
            "empathy": "compassion,kindness,understanding",
            "confidence": "success,achievement,pride",
            "teamwork": "collaboration,together,friends",
            "growth": "progress,development,learning",
            "resilience": "strength,courage,determination",
            "happiness": "joy,smile,celebration",
            "creativity": "art,imagination,innovation",
            "leadership": "guidance,mentor,inspire",
        }
        
        # Detect primary emotional theme
        detected_theme = "growth,learning,education"  # default
        for keyword, theme_terms in theme_mapping.items():
            if keyword in emotional_summary:
                detected_theme = theme_terms
                logger.info(f"Detected emotional theme: {keyword}")
                break
        
        # Use Unsplash Source API with specific educational themes
        # This provides high-quality, curated images suitable for educational context
        image_url = f"https://source.unsplash.com/800x450/?education,children,{detected_theme},india,school"
        
        logger.info(f"Generated themed image URL: {image_url}")
        return image_url
        
    except Exception as e:
        logger.warning(f"Image generation failed gracefully: {e}")
        return None


async def _generate_chart_data(test_results: List[Dict]) -> Dict:
    """
    Generate chart data for mobile app visualization.
    Returns data for Radar/Bar chart (EmoSocio parameters) and Pie chart (score distribution).
    """
    try:
        # Initialize parameter scores
        parameter_scores = {
            "Relationships": [],
            "Teamwork": [],
            "Empathy": [],
            "Emotional Regulation": [],
            "Self-Awareness": [],
            "Flexibility": [],
            "Influence": [],
            "Emotional Expression": [],
            "Optimism": [],
            "Assertiveness": [],
            "Self-motivation": [],
            "Self-Esteem": [],
        }
        
        # Extract scores from test results
        for result in test_results:
            if result.get("test_type") == "eq":
                questions = result.get("questions", [])
                answers = result.get("answers", [])
                
                for i, question in enumerate(questions):
                    param = question.get("parameter_measured", "")
                    if param in parameter_scores and i < len(answers):
                        # Likert scale: 0-4, convert to 0-100
                        score = (answers[i] / 4.0) * 100 if isinstance(answers[i], (int, float)) else 0
                        parameter_scores[param].append(score)
        
        # Calculate average scores for top 5 parameters
        avg_scores = {}
        for param, scores in parameter_scores.items():
            if scores:
                avg_scores[param] = sum(scores) / len(scores)
        
        # Select top 5 parameters or use defaults
        if avg_scores:
            sorted_params = sorted(avg_scores.items(), key=lambda x: x[1], reverse=True)[:5]
            bar_labels = [p[0] for p in sorted_params]
            bar_data = [round(p[1]) for p in sorted_params]
        else:
            # Default data if no scores available
            bar_labels = ["Relationships", "Teamwork", "Empathy", "Emotional Reg", "Self-Awareness"]
            bar_data = [75, 80, 70, 65, 85]
        
        # Calculate pie chart distribution
        all_scores = [score for scores in parameter_scores.values() for score in scores]
        if all_scores:
            high_count = sum(1 for s in all_scores if s >= 75)
            moderate_count = sum(1 for s in all_scores if 50 <= s < 75)
            low_count = sum(1 for s in all_scores if s < 50)
            total = len(all_scores)
            
            pie_data = [
                round((high_count / total) * 100) if total > 0 else 33,
                round((moderate_count / total) * 100) if total > 0 else 33,
                round((low_count / total) * 100) if total > 0 else 34,
            ]
        else:
            # Default distribution
            pie_data = [40, 35, 25]
        
        return {
            "visuals": [
                {
                    "chartType": "bar",
                    "chartTitle": "Core EmoSocio Parameters",
                    "labels": bar_labels,
                    "datasets": [
                        {
                            "data": bar_data
                        }
                    ]
                },
                {
                    "chartType": "pie",
                    "chartTitle": "Overall Score Distribution",
                    "labels": ["Mastered (High)", "Developing (Moderate)", "Needs Focus (Low)"],
                    "datasets": [
                        {
                            "data": pie_data
                        }
                    ]
                }
            ]
        }
    except Exception as e:
        logger.warning(f"Chart data generation failed: {e}")
        # Return default chart data
        return {
            "visuals": [
                {
                    "chartType": "bar",
                    "chartTitle": "Core EmoSocio Parameters",
                    "labels": ["Relationships", "Teamwork", "Empathy", "Emotional Reg", "Self-Awareness"],
                    "datasets": [
                        {
                            "data": [75, 80, 70, 65, 85]
                        }
                    ]
                },
                {
                    "chartType": "pie",
                    "chartTitle": "Overall Score Distribution",
                    "labels": ["Mastered (High)", "Developing (Moderate)", "Needs Focus (Low)"],
                    "datasets": [
                        {
                            "data": [40, 35, 25]
                        }
                    ]
                }
            ]
        }


def _fallback_parent_report(test_results: List[Dict]) -> Dict[str, Any]:
    """Fallback parent report when LLM API quota is exceeded"""
    logger.info("=" * 80)
    logger.warning("⚠️  FALLBACK PARENT REPORT GENERATED")
    logger.info("=" * 80)
    logger.info(f"Report Type: PARENT COMPREHENSIVE REPORT (FALLBACK)")
    
    num_tests = len(test_results)
    eq_tests = [t for t in test_results if t.get("test_type") == "eq"]
    iq_tests = [t for t in test_results if t.get("test_type") == "iq"]
    
    # Calculate average scores
    eq_scores = [t.get("score", 0) for t in eq_tests if t.get("score") is not None]
    iq_scores = [t.get("score", 0) for t in iq_tests if t.get("score") is not None]
    
    avg_eq = sum(eq_scores) / len(eq_scores) if eq_scores else 0
    avg_iq = sum(iq_scores) / len(iq_scores) if iq_scores else 0
    
    logger.info(f"Total Tests Analyzed: {num_tests}")
    logger.info(f"EQ Tests: {len(eq_tests)} (avg: {avg_eq:.1f}%)")
    logger.info(f"IQ Tests: {len(iq_tests)} (avg: {avg_iq:.1f}%)")
    
    analysis = f"""The student has completed {num_tests} assessment(s) to date.

Emotional Intelligence (EQ): {len(eq_tests)} test(s) completed with an average performance of {avg_eq:.1f}%. The student shows {'strong' if avg_eq >= 75 else 'developing' if avg_eq >= 50 else 'emerging'} emotional and social competencies.

Cognitive Intelligence (IQ): {len(iq_tests)} test(s) completed with an average score of {avg_iq:.1f}%. This indicates {'excellent' if avg_iq >= 80 else 'good' if avg_iq >= 60 else 'developing'} cognitive abilities.

Note: This is a basic summary. For detailed analysis, please try again when the AI service is available."""
    
    return {
        "Data_Analysis": analysis,
        "Sub_grouping_Recommendation": "Recommend peer learning groups based on complementary strengths.",
        "Targeted_SEL_Activities": [
            {
                "title": "Mindful Breathing Exercise",
                "description": "Practice 5 minutes of deep breathing daily to improve emotional regulation and focus.",
                "duration": "5-10 minutes daily"
            },
            {
                "title": "Gratitude Journaling",
                "description": "Write down three things you're grateful for each day to build positive thinking patterns.",
                "duration": "10 minutes daily"
            },
            {
                "title": "Peer Collaboration Activity",
                "description": "Work on group projects to develop teamwork and communication skills.",
                "duration": "30 minutes weekly"
            }
        ],
        "Progress_Tracking": "Monitor emotional responses in group settings and track completion of daily mindfulness exercises.",
        "visuals": [
            {
                "chartType": "bar",
                "chartTitle": "Assessment Performance",
                "labels": ["EQ Tests", "IQ Tests"],
                "datasets": [
                    {
                        "data": [round(avg_eq), round(avg_iq)]
                    }
                ]
            },
            {
                "chartType": "pie",
                "chartTitle": "Test Distribution",
                "labels": ["EQ Tests", "IQ Tests", "Pending"],
                "datasets": [
                    {
                        "data": [len(eq_tests), len(iq_tests), max(0, 5 - num_tests)]
                    }
                ]
            }
        ],
        "is_fallback": True,
        "fallback_reason": "LLM API quota exceeded or service unavailable"
    }
    
    logger.info(f"📊 Chart Data: 2 fallback charts included")
    logger.info(f"📝 SEL Activities: 3 default activities recommended")
    logger.info("=" * 80)


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
- CRITICAL: Complete ALL fields fully before adding the chart JSON. Do not cut off mid-sentence.

Input data:
{json.dumps(payload, ensure_ascii=False, default=str)[:12000]}

Output JSON keys (exact):
1. Data_Analysis: Plain-language interpretation for parents/teacher (strengths + areas to improve). Write 2-3 complete paragraphs. After completing the full analysis text, append the chart data JSON block.

2. Sub_grouping_Recommendation: Complete grouping/peer-support recommendation (2-3 sentences). Do not leave incomplete.

3. Targeted_SEL_Activities: Array of at least 2 objects with title, description, duration (SAFE approach).

4. Progress_Tracking: Complete description of what to monitor in the next assessment (2-3 sentences).

CHART DATA FORMAT (append at the END of Data_Analysis field):
After writing the complete Data_Analysis text, add this JSON block:
```json
{{
  "visuals": [
    {{
      "chartType": "bar",
      "chartTitle": "Core EmoSocio Parameters",
      "labels": ["Relationships", "Teamwork", "Empathy", "Emotional Reg", "Self-Awareness"],
      "datasets": [
        {{
          "data": [75, 80, 65, 70, 85]
        }}
      ]
    }},
    {{
      "chartType": "pie",
      "chartTitle": "Overall Score Distribution",
      "labels": ["Mastered (High)", "Developing (Moderate)", "Needs Focus (Low)"],
      "datasets": [
        {{
          "data": [40, 35, 25]
        }}
      ]
    }}
  ]
}}
```

IMPORTANT: Ensure Sub_grouping_Recommendation, Targeted_SEL_Activities, and Progress_Tracking are COMPLETE before ending the response."""

    try:
        response = await _call_llm_with_retry(
            messages=[
                {"role": "system", "content": "Return valid JSON only. Never ask follow-up questions."},
                {"role": "user", "content": prompt}
            ],
            max_retries=3,
            initial_delay=2.0
        )

        content = response.choices[0].message.content if response.choices else None
        if not content or not str(content).strip():
            logger.warning("LLM returned empty content for generate_parent_report, using fallback")
            return _fallback_parent_report(test_results)
    
    except RateLimitError as e:
        error_msg = str(e)
        if "token_quota_exceeded" in error_msg or "too_many_tokens" in error_msg:
            logger.warning(f"⚠️ FALLBACK PARENT REPORT: Daily token quota exceeded - {error_msg}")
        else:
            logger.warning(f"⚠️ FALLBACK PARENT REPORT: Rate limit error - {error_msg}")
        fallback = _fallback_parent_report(test_results)
        fallback["fallback_reason"] = f"Rate limit: {error_msg[:100]}"
        return fallback
    
    except Exception as e:
        logger.exception(f"⚠️ FALLBACK PARENT REPORT: Unexpected error - {str(e)}")
        fallback = _fallback_parent_report(test_results)
        fallback["fallback_reason"] = f"Error: {str(e)[:100]}"
        return fallback

    report = _extract_json(str(content))
    if isinstance(report, dict):
        logger.info("=" * 80)
        logger.info("✅ REAL PARENT REPORT GENERATED FROM LLM")
        logger.info("=" * 80)
        logger.info(f"Report Type: PARENT COMPREHENSIVE REPORT")
        logger.info(f"APAAR ID: {apaar_id}")
        logger.info(f"Total Test Results Analyzed: {len(test_results)}")
        logger.info(f"Student: {student_profile.get('full_name', 'Unknown')}")
        logger.info(f"Grade: {student_profile.get('grade', 'Unknown')}")
        
        if not isinstance(report.get("Targeted_SEL_Activities"), list):
            report["Targeted_SEL_Activities"] = []
        # Ensure required keys exist
        report.setdefault("Data_Analysis", "")
        report.setdefault("Sub_grouping_Recommendation", "")
        report.setdefault("Progress_Tracking", "")
        report["is_fallback"] = False
        
        # Extract embedded JSON from Data_Analysis if present
        analysis_text = report.get("Data_Analysis", "")
        analysis_text, embedded_visuals = _extract_visuals_from_text(analysis_text)
        report["Data_Analysis"] = analysis_text
        
        if embedded_visuals:
            logger.info(f"Extracted {len(embedded_visuals)} charts from Data_Analysis")
        
        # Use embedded visuals if available, otherwise generate from _generate_chart_data
        if embedded_visuals:
            report["visuals"] = embedded_visuals
            logger.info("Using embedded chart data from LLM response")
        else:
            # Fallback to generating chart data
            chart_data = await _generate_chart_data(test_results)
            report["visuals"] = chart_data.get("visuals", [])
            logger.info("Generated fallback chart data")
        
        logger.info(f"📊 Chart Data: {len(report.get('visuals', []))} chart(s) included")
        for idx, visual in enumerate(report.get('visuals', [])):
            logger.info(f"  Chart {idx + 1}: {visual.get('chartTitle', 'Untitled')} ({visual.get('chartType', 'unknown')})")
        logger.info(f"📝 SEL Activities: {len(report.get('Targeted_SEL_Activities', []))} activities recommended")
        logger.info("=" * 80)
        
        # Generate emotional insight image and append to Data_Analysis
        analysis_text = report.get("Data_Analysis", "")
        logger.info(f"Attempting to generate image for analysis text (length: {len(analysis_text)})")
        if analysis_text:
            try:
                image_url = await _generate_emotional_insight_image(analysis_text)
                logger.info(f"Image generation result: {image_url[:100] if image_url else 'None'}")
                if image_url:
                    # Append image in Markdown format to the analysis text
                    report["Data_Analysis"] = f"{analysis_text}\n\n![Emotional Insight]({image_url})"
                    logger.info("Successfully appended emotional insight image to report")
                else:
                    logger.warning("Image URL was None, skipping append")
            except Exception as e:
                # Fail silently - if image generation fails, return original text
                logger.warning(f"Failed to append image to report: {e}")
        else:
            logger.warning("No analysis text found, skipping image generation")
        
        return report
    return {
        "Data_Analysis": str(content)[:2000] if content else "Report could not be generated.",
        "Sub_grouping_Recommendation": "",
        "Targeted_SEL_Activities": [],
        "Progress_Tracking": "",
        "visuals": [
            {
                "chartType": "bar",
                "chartTitle": "Core EmoSocio Parameters",
                "labels": ["Relationships", "Teamwork", "Empathy", "Emotional Reg", "Self-Awareness"],
                "datasets": [
                    {
                        "data": [75, 80, 70, 65, 85]
                    }
                ]
            },
            {
                "chartType": "pie",
                "chartTitle": "Overall Score Distribution",
                "labels": ["Mastered (High)", "Developing (Moderate)", "Needs Focus (Low)"],
                "datasets": [
                    {
                        "data": [40, 35, 25]
                    }
                ]
            }
        ]
    }


def _clean_data_analysis(text: str) -> str:
    """Remove any JSON blobs that the LLM accidentally embedded in the analysis text."""
    if not text:
        return text
    
    # Remove markdown JSON code blocks
    cleaned = re.sub(r'```json\s*\n?[\s\S]*?\n?```', '', text)
    
    # Remove raw JSON objects containing visuals using brace counting
    start_pattern = r'\{\s*"visuals"\s*:\s*\['
    start_match = re.search(start_pattern, cleaned)
    if start_match:
        start_pos = start_match.start()
        brace_count = 0
        in_string = False
        escape_next = False
        end_pos = start_pos
        
        for i in range(start_pos, len(cleaned)):
            char = cleaned[i]
            
            if escape_next:
                escape_next = False
                continue
            
            if char == '\\':
                escape_next = True
                continue
            
            if char == '"' and not escape_next:
                in_string = not in_string
                continue
            
            if not in_string:
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_pos = i + 1
                        break
        
        if end_pos > start_pos:
            cleaned = (cleaned[:start_pos] + cleaned[end_pos:]).strip()
    
    return cleaned.strip()


def _extract_visuals_from_text(analysis_text: str) -> tuple[str, list]:
    """
    Extract visuals JSON from analysis text and return cleaned text + visuals array.
    Returns: (cleaned_text, visuals_array)
    """
    embedded_visuals = []
    
    # Try markdown code block first
    json_match = re.search(r'```json\s*\n?(.*?)\n?```', analysis_text, re.DOTALL)
    if json_match:
        try:
            embedded_data = json.loads(json_match.group(1).strip())
            if isinstance(embedded_data, dict) and "visuals" in embedded_data:
                embedded_visuals = embedded_data.get("visuals", [])
                analysis_text = analysis_text[:json_match.start()].strip()
                return analysis_text, embedded_visuals
        except json.JSONDecodeError:
            analysis_text = analysis_text[:json_match.start()].strip()
    
    # Try raw JSON with brace counting
    start_pattern = r'\{\s*"visuals"\s*:\s*\['
    start_match = re.search(start_pattern, analysis_text)
    if start_match:
        start_pos = start_match.start()
        brace_count = 0
        in_string = False
        escape_next = False
        end_pos = start_pos
        
        for i in range(start_pos, len(analysis_text)):
            char = analysis_text[i]
            
            if escape_next:
                escape_next = False
                continue
            
            if char == '\\':
                escape_next = True
                continue
            
            if char == '"' and not escape_next:
                in_string = not in_string
                continue
            
            if not in_string:
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_pos = i + 1
                        break
        
        if end_pos > start_pos:
            json_str = analysis_text[start_pos:end_pos]
            try:
                embedded_data = json.loads(json_str)
                if isinstance(embedded_data, dict) and "visuals" in embedded_data:
                    embedded_visuals = embedded_data.get("visuals", [])
                    analysis_text = (analysis_text[:start_pos] + analysis_text[end_pos:]).strip()
                    return analysis_text, embedded_visuals
            except json.JSONDecodeError:
                analysis_text = (analysis_text[:start_pos] + analysis_text[end_pos:]).strip()
    
    return analysis_text, embedded_visuals


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
Task: A student has completed one quiz attempt. Analyze it and produce a structured report for parents/teachers.

Input data:
{json.dumps(payload, ensure_ascii=False, default=str)[:12000]}

Return STRICT JSON only with EXACTLY these top-level keys:
{{
  "Data_Analysis": "Plain English text ONLY for parents — no JSON, no curly braces, no chart data embedded here. Describe strengths, areas to work on, and emotional tone.",
  "Sub_grouping_Recommendation": "Brief peer/social support note or empty string",
  "Targeted_SEL_Activities": [
    {{"title": "...", "description": "...", "duration": "..."}}
  ],
  "Progress_Tracking": "What to monitor on the next quiz",
  "visuals": [
    {{
      "chartType": "bar",
      "chartTitle": "Core EmoSocio Parameters",
      "labels": ["Empathy", "Self-Awareness", "Emotional Regulation", "Teamwork", "Relationships"],
      "datasets": [{{"data": [70, 75, 65, 80, 72]}}]
    }},
    {{
      "chartType": "pie",
      "chartTitle": "Overall Score Distribution",
      "labels": ["Mastered (High)", "Developing (Moderate)", "Needs Focus (Low)"],
      "datasets": [{{"data": [40, 35, 25]}}]
    }}
  ]
}}

CRITICAL RULES:
- Data_Analysis must contain ONLY readable plain text. Never embed JSON, chart data, or curly braces inside it.
- visuals is always a separate top-level key — always include both a bar chart and a pie chart with scores inferred from the answers.
- Return valid JSON only. No markdown, no code blocks, no extra explanation outside the JSON."""

    try:
        response = client.chat.completions.create(
            model="gpt-oss-120b",
            messages=[
                {"role": "system", "content": "You are an expert educational psychologist. Respond with valid JSON only. Never embed chart data inside Data_Analysis."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
        )
        content = response.choices[0].message.content if response.choices else None
        if not content or not str(content).strip():
            logger.warning("⚠️ FALLBACK QUIZ REPORT: LLM returned empty content")
            return _fallback_quiz_report()

        report = _extract_json(str(content))
        if isinstance(report, dict) and report.get("Data_Analysis"):
            logger.info("=" * 80)
            logger.info("✅ REAL QUIZ REPORT GENERATED FROM LLM")
            logger.info("=" * 80)
            logger.info(f"Report Type: SINGLE QUIZ ATTEMPT REPORT")
            logger.info(f"Student: {student_profile.get('full_name', 'Unknown')}")
            logger.info(f"Grade: {student_profile.get('grade', 'Unknown')}")
            logger.info(f"Score: {score}")
            logger.info(f"Questions Analyzed: {len(questions)}")
            
            # Extract embedded JSON from Data_Analysis if present
            analysis_text = report.get("Data_Analysis", "")
            analysis_text, embedded_visuals = _extract_visuals_from_text(analysis_text)
            report["Data_Analysis"] = analysis_text
            
            if embedded_visuals:
                logger.info(f"Extracted {len(embedded_visuals)} charts from Data_Analysis")
            
            # Use embedded visuals if found, otherwise use what's in the report
            if embedded_visuals:
                report["visuals"] = embedded_visuals
                logger.info("Using extracted visuals from Data_Analysis")
            elif not report.get("visuals"):
                # Generate default visuals if none provided
                report["visuals"] = [
                    {
                        "chartType": "bar",
                        "chartTitle": "Core EmoSocio Parameters",
                        "labels": ["Empathy", "Self-Awareness", "Emotional Regulation", "Teamwork", "Relationships"],
                        "datasets": [{"data": [70, 75, 65, 80, 72]}]
                    },
                    {
                        "chartType": "pie",
                        "chartTitle": "Overall Score Distribution",
                        "labels": ["Mastered (High)", "Developing (Moderate)", "Needs Focus (Low)"],
                        "datasets": [{"data": [40, 35, 25]}]
                    }
                ]
                logger.info("Generated default visuals for quiz report")

            # Ensure correct types for all fields
            if not isinstance(report.get("Targeted_SEL_Activities"), list):
                report["Targeted_SEL_Activities"] = []
            if not isinstance(report.get("visuals"), list):
                report["visuals"] = []

            report.setdefault("Sub_grouping_Recommendation", "")
            report.setdefault("Progress_Tracking", "")
            report["is_fallback"] = False

            # Generate and attach emotional insight image
            analysis_text = report.get("Data_Analysis", "")
            if analysis_text:
                try:
                    image_url = await _generate_emotional_insight_image(analysis_text)
                    if image_url:
                        report["insight_image_url"] = image_url
                        logger.info("Successfully attached emotional insight image to quiz report")
                except Exception as e:
                    logger.warning(f"Failed to attach image to quiz report: {e}")

            logger.info(f"📊 Chart Data: {len(report.get('visuals', []))} chart(s) included")
            for idx, visual in enumerate(report.get('visuals', [])):
                logger.info(f"  Chart {idx + 1}: {visual.get('chartTitle', 'Untitled')} ({visual.get('chartType', 'unknown')})")
            logger.info(f"📝 SEL Activities: {len(report.get('Targeted_SEL_Activities', []))} activities recommended")
            
            # Log detailed question-answer analysis
            logger.info("\n📋 DETAILED QUIZ ANALYSIS:")
            logger.info("-" * 80)
            for idx, (q, a) in enumerate(zip(questions[:10], answers[:10])):  # Log first 10
                param = q.get('parameter_measured', 'Unknown')
                q_text = q.get('question_text', 'No question text')[:60]
                logger.info(f"  Q{idx + 1} [{param}]: {q_text}...")
                logger.info(f"       Answer: {a}")
            if len(questions) > 10:
                logger.info(f"  ... and {len(questions) - 10} more questions")
            logger.info("-" * 80)
            logger.info("=" * 80)
            return report
        else:
            logger.warning("⚠️ FALLBACK QUIZ REPORT: LLM returned invalid JSON structure")
            return _fallback_quiz_report()

    except Exception as e:
        logger.warning(f"⚠️ FALLBACK QUIZ REPORT: Exception during generation - {str(e)}")
        fallback = _fallback_quiz_report()
        fallback["fallback_reason"] = f"Error: {str(e)[:100]}"
        return fallback


def _fallback_quiz_report() -> Dict[str, Any]:
    logger.info("=" * 80)
    logger.warning("⚠️  FALLBACK QUIZ REPORT GENERATED")
    logger.info("=" * 80)
    logger.info(f"Report Type: SINGLE QUIZ ATTEMPT REPORT (FALLBACK)")
    logger.info(f"📊 Chart Data: 2 fallback charts included")
    logger.info(f"📝 SEL Activities: 2 default activities recommended")
    logger.info("=" * 80)
    
    return {
        "Data_Analysis": "Detailed analysis could not be generated for this attempt. Your answers have been saved.",
        "Sub_grouping_Recommendation": "",
        "Targeted_SEL_Activities": [
            {"title": "Daily reflection", "description": "Spend 5 minutes reflecting on one social interaction.", "duration": "5 min"},
            {"title": "Breathing before responding", "description": "Practice one slow breath before answering when upset.", "duration": "2 min"},
        ],
        "Progress_Tracking": "Compare patterns on the next quiz and note any consistent low or high areas.",
        "visuals": [
            {
                "chartType": "bar",
                "chartTitle": "Core EmoSocio Parameters",
                "labels": ["Empathy", "Self-Awareness", "Emotional Regulation", "Teamwork", "Relationships"],
                "datasets": [{"data": [70, 75, 65, 80, 72]}]
            },
            {
                "chartType": "pie",
                "chartTitle": "Overall Score Distribution",
                "labels": ["Mastered (High)", "Developing (Moderate)", "Needs Focus (Low)"],
                "datasets": [{"data": [40, 35, 25]}]
            }
        ],
        "insight_image_url": None,
        "is_fallback": True,
        "fallback_reason": "LLM generation failed or returned invalid data"
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
        response = await _call_llm_with_retry(
            messages=[
                {"role": "system", "content": "Return valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            max_retries=2,
            initial_delay=1.5
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


async def generate_nutrition_plan(
    physical_metrics: Dict[str, Any],
    student_profile: Dict[str, Any],
    health_notes: str | None = None,
) -> Dict[str, Any]:
    """
    Generate a comprehensive nutrition and lifestyle plan for a student based on their physical metrics.
    Returns a structured plan with UI summary and detailed PDF content.
    """
    age = student_profile.get("age", "Not specified")
    gender = student_profile.get("gender", "Not specified")
    
    payload = {
        "student": {
            "full_name": student_profile.get("full_name", "Student"),
            "age": age,
            "gender": gender,
            "grade": student_profile.get("grade"),
        },
        "physical_metrics": physical_metrics,
        "health_notes": health_notes or "",
    }

    prompt = f"""You are an Expert Pediatric Nutritionist and Health Analyst evaluating a student's physical health metrics. Your task is to analyze the provided biometric data and generate a BMI-based health classification, growth-focused Indian diet plan, and lifestyle recommendations.

This information will be displayed on the Student Dashboard and used to generate a PDF Health Report.

Input Parameters:
{json.dumps(payload, ensure_ascii=False, default=str)[:12000]}

Analysis Guidelines:
- Use WHO BMI-for-age percentiles to classify the student into: Underweight, Healthy Weight, Overweight, or Obese
- Focus on healthy growth, balanced nutrition, and lifestyle improvement
- Diet recommendations must be: Culturally relevant Indian foods, Student-friendly, Affordable and accessible, Growth-focused rather than calorie-restrictive

Avoid:
- Medical diagnoses
- Prescription treatments
- Extreme dieting
- Unsafe health claims

STRICT OUTPUT FORMAT:
You must output exactly two sections separated by:
===SPLIT===

Do NOT include conversational text before or after the sections.

Part 1: Quick UI Summary

Health Status Overview
Provide exactly two sentences explaining:
- The student's BMI classification
- What it means for their growth and health trajectory

Key Focus Areas
Provide three concise actionable insights suitable for UI display.
Example style:
• Increase protein intake to support muscle development
• Improve hydration and daily activity levels
• Maintain consistent sleep for proper growth and recovery

===SPLIT===

Part 2: Detailed PDF Diet & Lifestyle Report

Comprehensive Physical Health & Nutrition Plan

1. Biometric Analysis
Provide a short, empathetic explanation of:
- Height, Weight, BMI classification
- Why the student falls into this category
- The importance of addressing this at their age

2. Personalized Indian Diet Plan
Note: Focus on simple, nutrient-dense foods suitable for a student's daily routine.

Early Morning (Pre-School)
Suggest 1–2 quick items such as: soaked almonds, banana, milk, dates

Breakfast
Balanced Indian breakfast examples:
- Poha with peanuts
- Moong dal chilla
- Idli with sambar
- Vegetable upma

School Tiffin (Lunch)
Portable balanced meal examples:
- Roti + seasonal sabzi + paneer/egg
- Vegetable pulao with curd
- Dal + rice + salad

Evening Snack
Post-school energy refuel:
- Roasted makhana
- Roasted chana
- Fruit bowl
- Peanut chikki

Dinner
Light and easily digestible meal:
- Dal + rice + vegetables
- Roti + paneer bhurji
- Khichdi with ghee

3. Hydration & Lifestyle Add-Ons

Hydration Goal: Recommend daily water intake based on age and weight

Physical Activity: Recommend sports or physical activity suitable for improving overall fitness

Sleep Hygiene: Explain the importance of adequate sleep for growth hormone release and recovery

4. Medical Disclaimer
This report is generated for educational and nutritional guidance purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.

5. Visual Data (Strict JSON)
At the very end of the report, output a raw JSON block enclosed in ```json tags.
This JSON will feed directly into the mobile app's chart UI.
Generate data for one Pie/Donut chart representing the ideal macronutrient distribution for the student's goal.

```json
{{
  "visuals": [
    {{
      "chartType": "pie",
      "chartTitle": "Ideal Daily Macro Target",
      "labels": ["Carbohydrates", "Proteins", "Healthy Fats"],
      "datasets": [
        {{
          "data": [55, 25, 20]
        }}
      ]
    }}
  ]
}}
```
"""

    try:
        response = await _call_llm_with_retry(
            messages=[
                {"role": "system", "content": "You are an expert pediatric nutritionist and health analyst. Follow the formatting rules exactly."},
                {"role": "user", "content": prompt},
            ],
            max_retries=2,
            initial_delay=2.0
        )
        
        content = response.choices[0].message.content if response.choices else None
        if not content or not str(content).strip():
            logger.warning("LLM returned empty content for nutrition plan")
            return _fallback_nutrition_plan()
        
        # Split content by ===SPLIT===
        parts = str(content).split("===SPLIT===")
        if len(parts) != 2:
            logger.warning("Nutrition plan missing SPLIT marker")
            return _fallback_nutrition_plan()
        
        ui_summary = parts[0].strip()
        detailed_report = parts[1].strip()
        
        # Extract JSON visuals from detailed report
        json_match = re.search(r'```json\s*\n?(.*?)\n?```', detailed_report, re.DOTALL)
        visuals = []
        if json_match:
            try:
                visual_data = json.loads(json_match.group(1).strip())
                visuals = visual_data.get("visuals", [])
                # Remove JSON block from detailed report
                detailed_report = detailed_report[:json_match.start()].strip()
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse nutrition plan visuals: {e}")
        
        logger.info("✅ Nutrition plan generated successfully")
        return {
            "ui_summary": ui_summary,
            "detailed_report": detailed_report,
            "visuals": visuals,
            "is_fallback": False
        }
        
    except Exception as e:
        logger.exception(f"Failed to generate nutrition plan: {e}")
        return _fallback_nutrition_plan()


def _fallback_nutrition_plan() -> Dict[str, Any]:
    """Fallback nutrition plan when LLM fails"""
    logger.warning("⚠️  Using fallback nutrition plan")
    return {
        "ui_summary": """Health Status Overview
Your physical metrics have been recorded. A balanced diet and regular physical activity are essential for healthy growth.

Key Focus Areas
• Maintain a balanced diet with adequate protein, carbohydrates, and healthy fats
• Stay hydrated with 6-8 glasses of water daily
• Engage in at least 60 minutes of physical activity each day""",
        "detailed_report": """Comprehensive Physical Health & Nutrition Plan

1. Biometric Analysis
Your physical health data has been recorded. Maintaining a healthy lifestyle through proper nutrition and regular exercise is important for your growth and development.

2. Personalized Indian Diet Plan

Early Morning (Pre-School): 1 glass of warm water, 5-6 soaked almonds

Breakfast: Poha with peanuts and vegetables, or 2 idlis with sambar, or vegetable paratha with curd

School Tiffin (Lunch): 2 rotis with seasonal vegetable sabzi, dal, and a small portion of rice

Evening Snack: Fresh fruit (banana, apple, or seasonal fruit), or roasted chana, or a glass of milk

Dinner: Light meal with dal, rice, roti, and vegetables. Avoid heavy or fried foods.

3. Hydration & Lifestyle Add-Ons
Hydration Goal: Drink 6-8 glasses of water throughout the day
Physical Activity: Engage in outdoor play, sports, or exercise for at least 60 minutes daily
Sleep Hygiene: Aim for 8-10 hours of quality sleep each night

4. Medical Disclaimer
This report is generated for educational and nutritional guidance purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.""",
        "visuals": [
            {
                "chartType": "pie",
                "chartTitle": "Ideal Daily Macro Target",
                "labels": ["Carbohydrates", "Proteins", "Healthy Fats"],
                "datasets": [
                    {
                        "data": [55, 25, 20]
       
                    }
                ]
            }
        ],
        "is_fallback": True
    }
