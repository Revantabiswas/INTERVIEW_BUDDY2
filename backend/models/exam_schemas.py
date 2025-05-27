from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

# Exam Practice Request Schema
class ExamPracticeRequest(BaseModel):
    board: Optional[str] = None  # "cbse", "jee", "neet", etc.
    class_level: Optional[str] = None  # "10", "11", "12"
    subject: Optional[str] = None  # "Mathematics", "Physics", etc.
    topic: Optional[str] = None  # "Algebra", "Mechanics", etc.
    duration: int = 60  # in minutes
    question_count: int = 20
    difficulty: str = "Medium"  # "Easy", "Medium", "Hard"
    include_previous_years: bool = False
    document_id: Optional[str] = None  # For document-based tests

# Test Question with extended info for exams
class ExamQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    difficulty: str = "Medium"  # "Easy", "Medium", "Hard" 
    topic: Optional[str] = None
    subtopic: Optional[str] = None
    expected_time: Optional[int] = None  # expected solving time in seconds
    marks: int = 1

# Exam Test Model
class ExamTest(BaseModel):
    id: str
    title: str
    board: Optional[str] = None
    class_level: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    duration: int = 60  # in minutes
    total_marks: int
    difficulty_distribution: Dict[str, int] = {"Easy": 0, "Medium": 0, "Hard": 0}
    created_at: str
    questions: List[ExamQuestion]
    answer_key: Dict[str, str]
    document_id: Optional[str] = None
    is_previous_year: bool = False
    exam_year: Optional[str] = None
    
# Test Attempt Schema
class ExamAttempt(BaseModel):
    id: str
    test_id: str
    started_at: str
    completed_at: Optional[str] = None
    answers: Dict[str, str] = {}
    time_spent: Dict[str, int] = {}  # question_id -> time spent in seconds
    status: str = "in_progress"  # "in_progress", "completed", "abandoned"
    skipped_questions: List[str] = []
    bookmarked_questions: List[str] = []
    
# Test Submission Schema
class ExamSubmission(BaseModel):
    answers: Dict[str, str]
    time_spent: Dict[str, int]  # question_id -> time spent in seconds
    completed_at: str
    skipped_questions: List[str] = []
    bookmarked_questions: List[str] = []
    
# Test Result Schema
class ExamResult(BaseModel):
    test_id: str
    attempt_id: str
    score: float  # percentage
    total_marks: int
    obtained_marks: int
    correct_answers: int
    incorrect_answers: int
    skipped_questions: int
    accuracy: float
    percentile: Optional[float] = None
    time_spent: Dict[str, int]  # question_id -> time spent in seconds
    total_time: int  # in seconds
    difficulty_performance: Dict[str, Dict[str, Any]]  # difficulty -> {attempted, correct}
    topic_performance: Dict[str, Dict[str, Any]]  # topic -> {attempted, correct}
    question_analysis: Dict[str, Dict[str, Any]]  # question_id -> {status, time, difficulty}
    completed_at: str

# Subject Performance Analysis
class SubjectPerformance(BaseModel):
    subject: str
    tests_attempted: int
    average_score: float
    strengths: List[str]  # list of strong topics
    weaknesses: List[str]  # list of weak topics
    progress: float  # progress percentage
    
# Time Analysis Schema
class TimeAnalysis(BaseModel):
    avg_time_per_question: float  # in seconds
    time_distribution: Dict[str, Dict[str, Any]]  # time range -> {questions, accuracy}
    time_trend: Dict[str, float]  # date -> avg time per question

# Performance Metrics Schema
class PerformanceMetrics(BaseModel):
    tests_taken: int
    average_score: float
    accuracy: float
    subjects: Dict[str, Dict[str, Any]]  # subject -> performance metrics
    topics: Dict[str, Dict[str, Any]]  # topic -> performance metrics
    difficulty_performance: Dict[str, Dict[str, Any]]  # difficulty -> {attempted%, correct%}
    recent_trend: List[Dict[str, Any]]  # list of recent test scores
    study_time: Dict[str, int]  # date -> minutes spent
    
# Study Session Schema
class ExamStudySession(BaseModel):
    id: str
    date: str
    duration: int  # in minutes
    subject: Optional[str] = None
    topics: List[str] = []
    tests_taken: int = 0
    questions_attempted: int = 0
    
# Analytics Request Schema
class AnalyticsRequest(BaseModel):
    time_period: Optional[str] = "all"  # "week", "month", "year", "all"
    subject: Optional[str] = None
    include_previous_years: bool = True
