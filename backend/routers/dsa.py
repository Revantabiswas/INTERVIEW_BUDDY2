from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any
from pydantic import BaseModel
import os
import json
import uuid
from datetime import datetime

from models.schemas import DSAFilterRequest, DSAQuestion
from agents import create_dsa_expert_agent, create_dsa_question_generation_task, create_dsa_plan_generation_task, create_dsa_code_analysis_task, run_agent_task

router = APIRouter()

# Storage directory
DSA_DIR = "./storage/dsa"
os.makedirs(DSA_DIR, exist_ok=True)

# New model for code analysis request
class CodeAnalysisRequest(BaseModel):
    code: str
    problem: str = ""
    language: str = "python"

# New model for code analysis response
class CodeAnalysisResponse(BaseModel):
    bugs: List[str] = []
    optimizations: List[str] = []
    improved_code: str = ""
    time_complexity: str = ""
    space_complexity: str = ""
    explanation: str = ""

@router.get("/questions", response_model=List[DSAQuestion])
async def get_dsa_questions(filter_request: DSAFilterRequest):
    """Get DSA questions based on filters"""
    try:
        # Create DSA expert agent
        dsa_expert = create_dsa_expert_agent()
        
        # Create question generation task
        question_task = create_dsa_question_generation_task(
            dsa_expert,
            filter_request.topic,
            filter_request.difficulty,
            filter_request.count
        )
        
        # Execute task
        questions_data = run_agent_task(dsa_expert, question_task)
        
        # Parse questions data
        from utils import parse_dsa_questions_from_text
        questions = parse_dsa_questions_from_text(questions_data)
        
        # Add IDs and timestamps
        for question in questions:
            question.id = str(uuid.uuid4())[:8]
            question.created_at = datetime.now().isoformat()
        
        return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating DSA questions: {str(e)}")

@router.post("/plan")
async def generate_dsa_plan(days_available: int = Body(10), hours_per_day: int = Body(2)):
    """Generate a personalized DSA study plan"""
    try:
        # Create DSA expert agent
        dsa_expert = create_dsa_expert_agent()
        
        # Create plan generation task
        plan_task = create_dsa_plan_generation_task(
            dsa_expert,
            days_available,
            hours_per_day
        )
        
        # Execute task
        plan_data = run_agent_task(dsa_expert, plan_task)
        
        # Parse plan data
        from utils import parse_dsa_plan_from_text
        plan = parse_dsa_plan_from_text(plan_data)
        
        # Generate a unique ID for the plan
        plan_id = str(uuid.uuid4())[:8]
        
        # Save plan to file
        plan["id"] = plan_id
        plan["created_at"] = datetime.now().isoformat()
        
        with open(f"{DSA_DIR}/plan_{plan_id}.json", "w") as f:
            json.dump(plan, f)
        
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating DSA plan: {str(e)}")

@router.post("/analyze-code", response_model=CodeAnalysisResponse)
async def analyze_code(request: CodeAnalysisRequest):
    """Analyze and debug DSA code submission"""
    try:
        # Create DSA expert agent
        dsa_expert = create_dsa_expert_agent()
        
        # Create code analysis task with problem context
        analysis_task = create_dsa_code_analysis_task(
            dsa_expert,
            request.code,
            request.language,
            request.problem
        )
        
        # Execute task
        analysis_data = run_agent_task(dsa_expert, analysis_task)
        
        # Parse analysis data
        from utils import parse_code_analysis
        analysis = parse_code_analysis(analysis_data)
        
        # Save analysis to file for history tracking
        analysis_id = str(uuid.uuid4())[:8]
        analysis_record = {
            "id": analysis_id,
            "original_code": request.code,
            "language": request.language,
            "problem": request.problem,
            "analysis": analysis,
            "created_at": datetime.now().isoformat()
        }
        
        os.makedirs(f"{DSA_DIR}/code_analysis", exist_ok=True)
        with open(f"{DSA_DIR}/code_analysis/analysis_{analysis_id}.json", "w") as f:
            json.dump(analysis_record, f)
        
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing code: {str(e)}")

@router.get("/plans")
async def get_all_plans():
    """Get all DSA study plans"""
    plans = []
    
    if not os.path.exists(DSA_DIR):
        return plans
    
    for file in os.listdir(DSA_DIR):
        if file.startswith("plan_") and file.endswith(".json"):
            with open(f"{DSA_DIR}/{file}", "r") as f:
                plan = json.load(f)
                plans.append(plan)
    
    # Sort by creation date (newest first)
    plans.sort(key=lambda x: x["created_at"], reverse=True)
    return plans

@router.get("/plans/{plan_id}")
async def get_plan(plan_id: str):
    """Get a specific DSA study plan"""
    plan_path = f"{DSA_DIR}/plan_{plan_id}.json"
    
    if not os.path.exists(plan_path):
        raise HTTPException(status_code=404, detail="Plan not found")
    
    with open(plan_path, "r") as f:
        plan = json.load(f)
    
    return plan

@router.delete("/plans/{plan_id}")
async def delete_plan(plan_id: str):
    """Delete a DSA study plan"""
    plan_path = f"{DSA_DIR}/plan_{plan_id}.json"
    
    if not os.path.exists(plan_path):
        raise HTTPException(status_code=404, detail="Plan not found")
    
    os.remove(plan_path)
    return {"status": "success", "message": "Plan deleted successfully"}
