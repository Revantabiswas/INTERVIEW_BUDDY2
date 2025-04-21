from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
import uuid
import os
import json
from datetime import datetime

from models.schemas import NotesRequest, NotesResponse
from utils import get_document_context, get_document_by_id
from agents import create_note_taker_agent

router = APIRouter()

# Store notes in a persistent file
NOTES_DIR = "./storage/notes"
os.makedirs(NOTES_DIR, exist_ok=True)

@router.post("/generate", response_model=NotesResponse)
async def generate_notes(request: NotesRequest):
    """Generate study notes for a document and topic"""
    # Validate document exists
    document = get_document_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Get document context
        context = get_document_context(request.topic, request.document_id)
        
        # Create note taker agent
        from agents import create_note_taker_agent, create_notes_generation_task, run_agent_task
        note_taker = create_note_taker_agent()
        
        # Use the existing notes generation task function instead of creating a Task directly
        # This ensures proper handling of the context parameter
        task = create_notes_generation_task(note_taker, request.topic, context)
        
        # Execute the task using the helper function
        notes_content = run_agent_task(note_taker, task)
        
        # Generate a unique ID for the notes
        note_id = str(uuid.uuid4())[:8]
        
        # Create notes response
        notes = {
            "id": note_id,
            "topic": request.topic,
            "content": notes_content,
            "document_id": request.document_id,
            "created_at": datetime.now().isoformat()
        }
        
        # Save notes to file
        with open(f"{NOTES_DIR}/{note_id}.json", "w") as f:
            json.dump(notes, f)
        
        return NotesResponse(**notes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating notes: {str(e)}")

@router.get("/", response_model=List[NotesResponse])
async def get_all_notes():
    """Get all saved notes"""
    notes = []
    
    if not os.path.exists(NOTES_DIR):
        return notes
    
    for file in os.listdir(NOTES_DIR):
        if file.endswith(".json"):
            with open(f"{NOTES_DIR}/{file}", "r") as f:
                note = json.load(f)
                notes.append(NotesResponse(**note))
    
    # Sort by creation date (newest first)
    notes.sort(key=lambda x: x.created_at, reverse=True)
    return notes

@router.get("/{note_id}", response_model=NotesResponse)
async def get_note(note_id: str):
    """Get a specific note by ID"""
    note_path = f"{NOTES_DIR}/{note_id}.json"
    
    if not os.path.exists(note_path):
        raise HTTPException(status_code=404, detail="Note not found")
    
    with open(note_path, "r") as f:
        note = json.load(f)
    
    return NotesResponse(**note)

@router.delete("/{note_id}")
async def delete_note(note_id: str):
    """Delete a specific note"""
    note_path = f"{NOTES_DIR}/{note_id}.json"
    
    if not os.path.exists(note_path):
        raise HTTPException(status_code=404, detail="Note not found")
    
    os.remove(note_path)
    return {"status": "success", "message": "Note deleted successfully"}