from fastapi import APIRouter, HTTPException
from typing import List
import os
import json
import uuid
from datetime import datetime

from models.schemas import RoadmapRequest, Roadmap
from utils import get_document_context, get_document_by_id
from agents import create_roadmap_planner_agent, create_roadmap_generation_task, create_quick_roadmap_generation_task, run_agent_task

router = APIRouter()

# Storage directory
ROADMAPS_DIR = "./storage/roadmaps"
os.makedirs(ROADMAPS_DIR, exist_ok=True)

@router.post("/generate", response_model=Roadmap)
async def generate_roadmap(request: RoadmapRequest):
    """Generate a study roadmap for a document"""
    # Validate document exists
    document = get_document_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Get document context
        context = get_document_context("", request.document_id)
        
        # Create roadmap planner agent
        roadmap_planner = create_roadmap_planner_agent()
        
        # Create roadmap generation task
        if request.quick_mode:
            roadmap_task = create_quick_roadmap_generation_task(
                roadmap_planner, 
                document["filename"],
                request.days_available,
                request.hours_per_day,
                context
            )
        else:
            roadmap_task = create_roadmap_generation_task(
                roadmap_planner, 
                document["filename"],
                request.days_available,
                request.hours_per_day,
                context
            )
        
        # Execute task
        roadmap_data = run_agent_task(roadmap_planner, roadmap_task)
        
        # Parse roadmap data
        from utils import parse_roadmap_from_text
        parsed_roadmap = parse_roadmap_from_text(roadmap_data)
        
        # Generate a unique ID for the roadmap
        roadmap_id = str(uuid.uuid4())[:8]
        
        # Create roadmap
        roadmap = Roadmap(
            id=roadmap_id,
            overview=parsed_roadmap["overview"],
            schedule=parsed_roadmap["schedule"],
            milestones=parsed_roadmap["milestones"],
            sections=parsed_roadmap["sections"],
            document_id=request.document_id,
            created_at=datetime.now().isoformat()
        )
        
        # Save roadmap to file
        with open(f"{ROADMAPS_DIR}/{roadmap_id}.json", "w") as f:
            json.dump(roadmap.dict(), f)
        
        return roadmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating roadmap: {str(e)}")

@router.get("/", response_model=List[Roadmap])
async def get_all_roadmaps():
    """Get all roadmaps"""
    roadmaps = []
    
    if not os.path.exists(ROADMAPS_DIR):
        return roadmaps
    
    for file in os.listdir(ROADMAPS_DIR):
        if file.endswith(".json"):
            with open(f"{ROADMAPS_DIR}/{file}", "r") as f:
                roadmap = json.load(f)
                roadmaps.append(Roadmap(**roadmap))
    
    # Sort by creation date (newest first)
    roadmaps.sort(key=lambda x: x.created_at, reverse=True)
    return roadmaps

@router.get("/{roadmap_id}", response_model=Roadmap)
async def get_roadmap(roadmap_id: str):
    """Get a specific roadmap"""
    roadmap_path = f"{ROADMAPS_DIR}/{roadmap_id}.json"
    
    if not os.path.exists(roadmap_path):
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    with open(roadmap_path, "r") as f:
        roadmap = json.load(f)
    
    return Roadmap(**roadmap)

@router.delete("/{roadmap_id}")
async def delete_roadmap(roadmap_id: str):
    """Delete a roadmap"""
    roadmap_path = f"{ROADMAPS_DIR}/{roadmap_id}.json"
    
    if not os.path.exists(roadmap_path):
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    os.remove(roadmap_path)
    return {"status": "success", "message": "Roadmap deleted successfully"}
