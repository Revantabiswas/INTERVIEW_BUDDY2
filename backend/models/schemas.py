from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

class DocumentMetadata(BaseModel):
    id: str
    filename: str
    pages: int
    file_hash: str
    created_at: str
    file_size: int
    mime_type: Optional[str] = None

class DocumentResponse(BaseModel):
    status: str
    document: Optional[DocumentMetadata] = None
    message: Optional[str] = None

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant" 
    content: str
    
class ChatRequest(BaseModel):
    question: str
    document_id: str
    history: Optional[List[ChatMessage]] = []
    
class ChatResponse(BaseModel):
    message: ChatMessage
    sources: Optional[List[str]] = None

class NotesRequest(BaseModel):
    topic: str
    document_id: str
    
class NotesResponse(BaseModel):
    id: str
    topic: str
    content: str
    document_id: str
    created_at: str

class FlashcardRequest(BaseModel):
    topic: str
    document_id: str
    num_cards: int = 10

class Flashcard(BaseModel):
    front: str
    back: str

class FlashcardDeck(BaseModel):
    id: str
    topic: str
    document_id: str
    created_at: str
    cards: List[Flashcard]

class MindMapRequest(BaseModel):
    topic: str
    document_id: str

class MindMapNode(BaseModel):
    id: int
    label: str
    group: int

class MindMapEdge(BaseModel):
    from_: int = Field(..., alias="from")
    to: int

class MindMap(BaseModel):
    id: str
    topic: str
    document_id: str
    created_at: str
    nodes: List[MindMapNode]
    edges: List[MindMapEdge]
    description: str

class RoadmapRequest(BaseModel):
    document_id: str
    days_available: int
    hours_per_day: float
    quick_mode: bool = False

class RoadmapDay(BaseModel):
    day: int
    content: str
    topics: List[str]
    hours: float

class Roadmap(BaseModel):
    id: str
    document_id: str
    created_at: str
    overview: str
    schedule: List[RoadmapDay]
    milestones: List[str]
    sections: List[str]

class TestRequest(BaseModel):
    topic: str
    document_id: Optional[str] = None
    difficulty: str = "Medium"

class TestQuestion(BaseModel):
    question: str
    options: Optional[List[str]] = None
    
class Test(BaseModel):
    id: str
    topic: str
    document_id: str
    created_at: str
    questions: List[TestQuestion]
    answer_key: Dict[str, str]

class TestSubmission(BaseModel):
    answers: Dict[str, str]

class DSAFilterRequest(BaseModel):
    difficulty: Optional[List[str]] = None
    topics: Optional[List[str]] = None
    companies: Optional[List[str]] = None
    limit: int = 10

class DSAQuestion(BaseModel):
    id: int
    title: str
    description: str
    difficulty: str
    topics: List[str]
    companies: List[str]
    link: Optional[str] = None
    platform: Optional[str] = None

class MindMapResponse(BaseModel):
    nodes: List[MindMapNode]
    edges: List[MindMapEdge]
    description: str

class FlashcardResponse(BaseModel):
    cards: List[Flashcard]

class TestResponse(BaseModel):
    questions: List[TestQuestion]
    answer_key: Dict[str, str]

class RoadmapResponse(BaseModel):
    overview: str
    schedule: List[RoadmapDay]
    milestones: List[str]
    sections: List[str]

class ErrorResponse(BaseModel):
    detail: str

# Progress Tracking Models
class ProgressMetrics(BaseModel):
    total_completed: int = 0
    total_attempted: int = 0
    success_rate: float = 0.0
    average_attempts: float = 0.0
    by_difficulty: Dict[str, int] = {"Easy": 0, "Medium": 0, "Hard": 0}
    by_topic: Dict[str, Dict[str, int]] = {}
    by_company: Dict[str, Dict[str, int]] = {}
    trending_topics: List[str] = []

class StudySession(BaseModel):
    date: str
    duration_minutes: int
    questions_attempted: int
    questions_completed: int
    focus_topics: List[str] = []

class QuestionProgress(BaseModel):
    id: int
    title: str
    status: str  # "not_started", "attempted", "completed"
    attempts: int = 0
    first_attempt_date: Optional[str] = None
    completed_date: Optional[str] = None
    time_spent_minutes: int = 0
    difficulty: str
    topics: List[str] = []
    companies: List[str] = []
    solution_saved: bool = False
    notes: Optional[str] = None

class ProgressData(BaseModel):
    user_id: str = "default"
    questions: List[QuestionProgress] = []
    study_sessions: List[StudySession] = []
    goals: Dict[str, Any] = {}
    preferences: Dict[str, Any] = {}
    last_updated: str

class ProgressUpdateRequest(BaseModel):
    question_progress: Optional[QuestionProgress] = None
    study_session: Optional[StudySession] = None
    goals_update: Optional[Dict[str, Any]] = None
    preferences_update: Optional[Dict[str, Any]] = None

class ProgressResponse(BaseModel):
    metrics: ProgressMetrics
    recent_activity: List[StudySession]
    recommendations: List[str] = []
    achievements: List[str] = []

class ProgressAnalytics(BaseModel):
    weekly_progress: Dict[str, int]
    difficulty_breakdown: Dict[str, Dict[str, int]]
    topic_performance: Dict[str, float]
    company_focus: Dict[str, int]
    study_streaks: Dict[str, int]
    time_analytics: Dict[str, Any]