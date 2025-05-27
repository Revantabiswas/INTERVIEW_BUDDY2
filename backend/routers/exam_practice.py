from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import List, Dict, Optional
import os
import json
import uuid
from datetime import datetime, timedelta
import logging

from models.exam_schemas import (
    ExamPracticeRequest, 
    ExamTest, 
    ExamQuestion, 
    ExamAttempt,
    ExamSubmission,
    ExamResult,
    SubjectPerformance,
    TimeAnalysis,
    PerformanceMetrics,
    ExamStudySession,
    AnalyticsRequest
)
from utils import get_document_context, get_document_by_id, parse_exam_test_from_text
from agents import create_assessment_expert_agent, create_enhanced_test_generation_task, run_agent_task

router = APIRouter()
logger = logging.getLogger(__name__)

# Storage directories
EXAMS_DIR = "./storage/exams"
ATTEMPTS_DIR = "./storage/exam_attempts"
RESULTS_DIR = "./storage/exam_results"
STUDY_SESSIONS_DIR = "./storage/study_sessions"

# Create directories
os.makedirs(EXAMS_DIR, exist_ok=True)
os.makedirs(ATTEMPTS_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(STUDY_SESSIONS_DIR, exist_ok=True)

# Utility function to generate a unique ID
def generate_id():
    return str(uuid.uuid4())[:8]

# Utility function to get current datetime as ISO string
def get_current_time():
    return datetime.now().isoformat()

@router.post("/exams/generate", response_model=ExamTest)
async def generate_exam(request: ExamPracticeRequest, background_tasks: BackgroundTasks):
    """Generate an exam based on specified parameters"""
    context = ""
    
    # If document_id is provided, validate and get context
    if request.document_id:
        try:
            document = get_document_by_id(request.document_id)
            if not document:
                raise HTTPException(status_code=404, detail="Document not found")
            context = get_document_context(request.topic or "", request.document_id)
        except Exception as e:
            logger.error(f"Error getting document context: {e}")
            # Continue without context if document access fails
            context = ""
    
    try:
        # Create assessment expert agent
        assessment_expert = create_assessment_expert_agent()
        
        # Create test title
        title = f"{request.subject or 'General'} - {request.topic or 'Comprehensive'} Test"
        if request.board:
            title = f"{request.board.upper()} {request.class_level or ''} {title}"
          # Create test generation task with exam specifics
        test_task = create_enhanced_test_generation_task(
            assessment_expert, 
            request.topic or "General Knowledge",
            request.difficulty,
            context,
            question_count=request.question_count,
            subject=request.subject,
            board=request.board,
            class_level=request.class_level,
            with_difficulty_levels=True,
            with_topic_tags=True,
            with_time_estimates=True
        )
        
        # Execute task
        logger.info(f"Generating test for topic: {request.topic}, difficulty: {request.difficulty}")
        test_data = run_agent_task(assessment_expert, test_task)
        
        # Parse test data
        parsed_test = parse_exam_test_from_text(test_data)
        
        # Generate a unique ID for the test
        test_id = generate_id()
        
        # Create difficulty distribution
        difficulty_distribution = {"Easy": 0, "Medium": 0, "Hard": 0}
        for question in parsed_test["questions"]:
            if "difficulty" in question:
                difficulty = question["difficulty"]
                if difficulty in difficulty_distribution:
                    difficulty_distribution[difficulty] += 1
                else:
                    difficulty_distribution["Medium"] += 1  # Default to medium
        
        # Calculate total marks
        total_marks = sum(q.get("marks", 1) for q in parsed_test["questions"])
        
        # Create exam test
        exam = ExamTest(
            id=test_id,
            title=title,
            board=request.board,
            class_level=request.class_level,
            subject=request.subject,
            topic=request.topic,
            duration=request.duration,
            total_marks=total_marks,
            difficulty_distribution=difficulty_distribution,
            created_at=get_current_time(),
            questions=[
                ExamQuestion(
                    id=f"q{i+1}",
                    question=q["question"],
                    options=q.get("options", []),
                    difficulty=q.get("difficulty", request.difficulty),
                    topic=q.get("topic", request.topic),
                    subtopic=q.get("subtopic"),
                    expected_time=q.get("expected_time"),
                    marks=q.get("marks", 1)
                ) for i, q in enumerate(parsed_test["questions"])
            ],
            answer_key=parsed_test["answer_key"],
            document_id=request.document_id or ""
        )
        
        # Save exam to file
        with open(f"{EXAMS_DIR}/{test_id}.json", "w") as f:
            json.dump(exam.dict(), f, indent=2)
        
        logger.info(f"Successfully generated exam: {test_id}")
        return exam
        
    except Exception as e:
        logger.error(f"Error generating exam: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating exam: {str(e)}")

@router.get("/exams", response_model=List[ExamTest])
async def get_all_exams(
    board: Optional[str] = None,
    class_level: Optional[str] = None,
    subject: Optional[str] = None,
    limit: int = Query(10, ge=1, le=100)
):
    """Get all exams with optional filters"""
    exams = []
    
    if not os.path.exists(EXAMS_DIR):
        return exams
    
    try:
        for file in os.listdir(EXAMS_DIR):
            if file.endswith(".json"):
                with open(f"{EXAMS_DIR}/{file}", "r") as f:
                    exam_data = json.load(f)
                    exam = ExamTest(**exam_data)
                    
                    # Apply filters
                    if board and exam.board != board:
                        continue
                    if class_level and exam.class_level != class_level:
                        continue
                    if subject and exam.subject != subject:
                        continue
                    
                    exams.append(exam)
        
        # Sort by creation date (newest first)
        exams.sort(key=lambda x: x.created_at, reverse=True)
        
        # Apply limit
        return exams[:limit]
        
    except Exception as e:
        logger.error(f"Error retrieving exams: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving exams")

@router.get("/exams/{exam_id}", response_model=ExamTest)
async def get_exam(exam_id: str):
    """Get a specific exam"""
    exam_path = f"{EXAMS_DIR}/{exam_id}.json"
    
    if not os.path.exists(exam_path):
        raise HTTPException(status_code=404, detail="Exam not found")
    
    try:
        with open(exam_path, "r") as f:
            exam_data = json.load(f)
        return ExamTest(**exam_data)
    except Exception as e:
        logger.error(f"Error retrieving exam {exam_id}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving exam")

@router.delete("/exams/{exam_id}")
async def delete_exam(exam_id: str):
    """Delete an exam"""
    exam_path = f"{EXAMS_DIR}/{exam_id}.json"
    
    if not os.path.exists(exam_path):
        raise HTTPException(status_code=404, detail="Exam not found")
    
    try:
        os.remove(exam_path)
        logger.info(f"Deleted exam: {exam_id}")
        return {"status": "success", "message": "Exam deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting exam {exam_id}: {e}")
        raise HTTPException(status_code=500, detail="Error deleting exam")

@router.post("/exams/{exam_id}/start", response_model=ExamAttempt)
async def start_exam_attempt(exam_id: str):
    """Start an exam attempt"""
    # Check if exam exists
    exam_path = f"{EXAMS_DIR}/{exam_id}.json"
    if not os.path.exists(exam_path):
        raise HTTPException(status_code=404, detail="Exam not found")
    
    try:
        attempt_id = generate_id()
        
        # Create exam attempt
        attempt = ExamAttempt(
            id=attempt_id,
            test_id=exam_id,
            started_at=get_current_time(),
            status="in_progress"
        )
        
        # Save attempt to file
        with open(f"{ATTEMPTS_DIR}/{attempt_id}.json", "w") as f:
            json.dump(attempt.dict(), f, indent=2)
        
        logger.info(f"Started exam attempt: {attempt_id} for exam: {exam_id}")
        return attempt
        
    except Exception as e:
        logger.error(f"Error starting exam attempt: {e}")
        raise HTTPException(status_code=500, detail="Error starting exam attempt")

@router.post("/exams/attempts/{attempt_id}/submit", response_model=ExamResult)
async def submit_exam_attempt(attempt_id: str, submission: ExamSubmission):
    """Submit an exam attempt and get results"""
    # Check if attempt exists
    attempt_path = f"{ATTEMPTS_DIR}/{attempt_id}.json"
    if not os.path.exists(attempt_path):
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    try:
        with open(attempt_path, "r") as f:
            attempt_data = json.load(f)
        
        attempt = ExamAttempt(**attempt_data)
        
        # Update attempt with submission data
        attempt.answers = submission.answers
        attempt.time_spent = submission.time_spent
        attempt.completed_at = submission.completed_at
        attempt.status = "completed"
        attempt.skipped_questions = submission.skipped_questions
        attempt.bookmarked_questions = submission.bookmarked_questions
        
        # Save updated attempt
        with open(attempt_path, "w") as f:
            json.dump(attempt.dict(), f, indent=2)
        
        # Get exam details
        exam_path = f"{EXAMS_DIR}/{attempt.test_id}.json"
        if not os.path.exists(exam_path):
            raise HTTPException(status_code=404, detail="Exam not found")
        
        with open(exam_path, "r") as f:
            exam_data = json.load(f)
        
        exam = ExamTest(**exam_data)
        
        # Calculate result metrics
        correct_answers = 0
        incorrect_answers = 0
        obtained_marks = 0
        total_marks = exam.total_marks
        difficulty_performance = {"Easy": {"attempted": 0, "correct": 0}, 
                                 "Medium": {"attempted": 0, "correct": 0}, 
                                 "Hard": {"attempted": 0, "correct": 0}}
        topic_performance = {}
        question_analysis = {}
        
        for q in exam.questions:
            q_id = q.id
            
            # Initialize topic performance if not exists
            if q.topic and q.topic not in topic_performance:
                topic_performance[q.topic] = {"attempted": 0, "correct": 0}
            
            # Skip if question was not attempted
            if q_id not in submission.answers or q_id in submission.skipped_questions:
                question_analysis[q_id] = {
                    "status": "skipped",
                    "time": submission.time_spent.get(q_id, 0),
                    "difficulty": q.difficulty
                }
                continue
            
            # Update attempts for difficulty and topic
            difficulty_performance[q.difficulty]["attempted"] += 1
            if q.topic:
                topic_performance[q.topic]["attempted"] += 1
            
            # Check if answer is correct
            user_answer = submission.answers[q_id].strip().upper()
            correct_answer = exam.answer_key[q_id].strip().upper()
            is_correct = user_answer == correct_answer
            
            if is_correct:
                correct_answers += 1
                obtained_marks += q.marks
                difficulty_performance[q.difficulty]["correct"] += 1
                if q.topic:
                    topic_performance[q.topic]["correct"] += 1
                
                question_analysis[q_id] = {
                    "status": "correct",
                    "time": submission.time_spent.get(q_id, 0),
                    "difficulty": q.difficulty
                }
            else:
                incorrect_answers += 1
                question_analysis[q_id] = {
                    "status": "incorrect",
                    "time": submission.time_spent.get(q_id, 0),
                    "difficulty": q.difficulty,
                    "correct_answer": exam.answer_key[q_id]
                }
        
        # Calculate accuracy and score
        total_attempted = correct_answers + incorrect_answers
        accuracy = (correct_answers / total_attempted * 100) if total_attempted > 0 else 0
        score = (obtained_marks / total_marks * 100) if total_marks > 0 else 0
        
        # Calculate total time
        total_time = sum(submission.time_spent.values())
        
        # Calculate percentile (mock implementation)
        percentile = min(100, 50 + score / 2)  # Mock implementation
        
        # Create result
        result = ExamResult(
            test_id=attempt.test_id,
            attempt_id=attempt_id,
            score=score,
            total_marks=total_marks,
            obtained_marks=obtained_marks,
            correct_answers=correct_answers,
            incorrect_answers=incorrect_answers,
            skipped_questions=len(submission.skipped_questions),
            accuracy=accuracy,
            percentile=percentile,
            time_spent=submission.time_spent,
            total_time=total_time,
            difficulty_performance=difficulty_performance,
            topic_performance=topic_performance,
            question_analysis=question_analysis,
            completed_at=submission.completed_at
        )
        
        # Save result
        with open(f"{RESULTS_DIR}/{attempt_id}_result.json", "w") as f:
            json.dump(result.dict(), f, indent=2)
        
        logger.info(f"Submitted exam attempt: {attempt_id}, score: {score:.2f}%")
        return result
        
    except Exception as e:
        logger.error(f"Error submitting exam attempt: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error submitting exam attempt")

@router.get("/analytics", response_model=PerformanceMetrics)
async def get_performance_analytics(time_period: str = "all"):
    """Get performance analytics"""
    try:
        # Get all results
        results = []
        
        if os.path.exists(RESULTS_DIR):
            for file in os.listdir(RESULTS_DIR):
                if file.endswith("_result.json"):
                    with open(f"{RESULTS_DIR}/{file}", "r") as f:
                        result_data = json.load(f)
                        results.append(ExamResult(**result_data))
        
        # If no results, return empty analytics
        if not results:
            return PerformanceMetrics(
                tests_taken=0,
                average_score=0.0,
                accuracy=0.0,
                subjects={},
                topics={},
                difficulty_performance={},
                recent_trend=[],
                study_time={}
            )
        
        # Filter results by time period if specified
        if time_period != "all":
            now = datetime.now()
            if time_period == "week":
                cutoff_date = now - timedelta(days=7)
            elif time_period == "month":
                cutoff_date = now - timedelta(days=30)
            elif time_period == "year":
                cutoff_date = now - timedelta(days=365)
            else:
                cutoff_date = now - timedelta(days=365)  # Default to year
            
            results = [r for r in results if datetime.fromisoformat(r.completed_at) >= cutoff_date]
        
        # Calculate basic metrics
        tests_taken = len(results)
        average_score = sum(r.score for r in results) / tests_taken if tests_taken > 0 else 0.0
        accuracy = sum(r.accuracy for r in results) / tests_taken if tests_taken > 0 else 0.0
        
        # Create performance metrics
        performance_metrics = PerformanceMetrics(
            tests_taken=tests_taken,
            average_score=average_score,
            accuracy=accuracy,
            subjects={},
            topics={},
            difficulty_performance={},
            recent_trend=[{"date": r.completed_at, "score": r.score, "accuracy": r.accuracy} 
                         for r in sorted(results, key=lambda x: x.completed_at, reverse=True)[:5]],
            study_time={}
        )
        
        return performance_metrics
        
    except Exception as e:
        logger.error(f"Error getting performance analytics: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving analytics")
