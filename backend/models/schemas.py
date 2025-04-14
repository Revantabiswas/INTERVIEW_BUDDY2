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
    document_id: str
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