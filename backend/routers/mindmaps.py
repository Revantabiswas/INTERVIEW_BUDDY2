from fastapi import APIRouter, HTTPException
from typing import List
import os
import json
import uuid
from datetime import datetime

from models.schemas import MindMapRequest, MindMap
from utils import get_document_context, get_document_by_id
from agents import create_visual_learning_expert_agent, create_mind_map_task, run_agent_task

router = APIRouter()

# Storage directory
MINDMAPS_DIR = "./storage/mindmaps"
os.makedirs(MINDMAPS_DIR, exist_ok=True)

@router.post("/generate", response_model=MindMap)
async def generate_mindmap(request: MindMapRequest):
    """Generate a mind map for a topic and document"""
    # Validate document exists
    document = get_document_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Get document context
        context = get_document_context(request.topic, request.document_id)
        
        # Create visual learning expert agent
        visual_expert = create_visual_learning_expert_agent()
        
        # Create mind map task
        mindmap_task = create_mind_map_task(
            visual_expert, 
            request.topic, 
            context
        )
        
        # Execute task
        mindmap_data = run_agent_task(visual_expert, mindmap_task)
        
        # Parse mind map data
        from utils import generate_mind_map_data
        graph_data = generate_mind_map_data(mindmap_data)
        
        # Generate a unique ID for the mind map
        map_id = str(uuid.uuid4())[:8]
        
        # Create mind map
        mindmap = MindMap(
            id=map_id,
            topic=request.topic,
            nodes=graph_data["nodes"],
            edges=graph_data["edges"],
            document_id=request.document_id,
            created_at=datetime.now().isoformat()
        )
        
        # Save mind map to file
        with open(f"{MINDMAPS_DIR}/{map_id}.json", "w") as f:
            json.dump(mindmap.dict(), f)
        
        return mindmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating mind map: {str(e)}")

@router.get("/", response_model=List[MindMap])
async def get_all_mindmaps():
    """Get all mind maps"""
    mindmaps = []
    
    if not os.path.exists(MINDMAPS_DIR):
        return mindmaps
    
    for file in os.listdir(MINDMAPS_DIR):
        if file.endswith(".json"):
            with open(f"{MINDMAPS_DIR}/{file}", "r") as f:
                mindmap = json.load(f)
                mindmaps.append(MindMap(**mindmap))
    
    # Sort by creation date (newest first)
    mindmaps.sort(key=lambda x: x.created_at, reverse=True)
    return mindmaps

@router.get("/{map_id}", response_model=MindMap)
async def get_mindmap(map_id: str):
    """Get a specific mind map"""
    map_path = f"{MINDMAPS_DIR}/{map_id}.json"
    
    if not os.path.exists(map_path):
        raise HTTPException(status_code=404, detail="Mind map not found")
    
    with open(map_path, "r") as f:
        mindmap = json.load(f)
    
    return MindMap(**mindmap)

@router.delete("/{map_id}")
async def delete_mindmap(map_id: str):
    """Delete a mind map"""
    map_path = f"{MINDMAPS_DIR}/{map_id}.json"
    
    if not os.path.exists(map_path):
        raise HTTPException(status_code=404, detail="Mind map not found")
    
    os.remove(map_path)
    return {"status": "success", "message": "Mind map deleted successfully"}