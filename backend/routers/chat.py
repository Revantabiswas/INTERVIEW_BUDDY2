from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
import uuid
import json
import os
from datetime import datetime

from models.schemas import ChatMessage, ChatRequest, ChatResponse
from utils import get_document_context, get_document_by_id
from agents import create_study_tutor_agent, create_explanation_task

router = APIRouter()

# Store chat histories in a persistent file
CHAT_HISTORY_FILE = "./storage/chat_histories.json"

# Load existing chat histories or create empty dict
def get_chat_histories():
    if os.path.exists(CHAT_HISTORY_FILE):
        with open(CHAT_HISTORY_FILE, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {}
    return {}

def save_chat_histories(histories):
    os.makedirs(os.path.dirname(CHAT_HISTORY_FILE), exist_ok=True)
    with open(CHAT_HISTORY_FILE, 'w') as f:
        json.dump(histories, f)

@router.post("/ask", response_model=ChatResponse)
async def ask_question(request: ChatRequest):
    """Ask a question about a document"""
    # Validate document exists
    document = get_document_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get chat histories
    chat_histories = get_chat_histories()
    
    # Create chat ID based on document ID if not exists
    if request.document_id not in chat_histories:
        chat_histories[request.document_id] = []
    
    # Add user message to history
    user_message = {"role": "user", "content": request.question}
    chat_histories[request.document_id].append(user_message)
    
    try:
        # Get document context
        context = get_document_context(request.question, request.document_id)
        
        # Create agent and task
        tutor = create_study_tutor_agent()
        explanation_task = create_explanation_task(tutor, request.question, context)
        
        # Run the task
        result = explanation_task.execute()
        
        # Create assistant message
        assistant_message = {"role": "assistant", "content": result}
        
        # Add to history
        chat_histories[request.document_id].append(assistant_message)
        
        # Save updated chat histories
        save_chat_histories(chat_histories)
        
        # Return response with sources
        response = ChatResponse(
            message=ChatMessage(**assistant_message),
            sources=[document["filename"]]
        )
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")

@router.get("/history/{document_id}", response_model=List[ChatMessage])
async def get_chat_history(document_id: str):
    """Get chat history for a document"""
    chat_histories = get_chat_histories()
    if document_id not in chat_histories:
        return []
    return [ChatMessage(**msg) for msg in chat_histories[document_id]]

@router.delete("/history/{document_id}")
async def clear_chat_history(document_id: str):
    """Clear chat history for a document"""
    chat_histories = get_chat_histories()
    if document_id in chat_histories:
        chat_histories[document_id] = []
        save_chat_histories(chat_histories)
    return {"status": "success", "message": "Chat history cleared"}