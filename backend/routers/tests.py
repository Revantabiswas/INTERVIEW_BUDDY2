from fastapi import APIRouter, HTTPException
from typing import List
import os
import json
import uuid
from datetime import datetime

from models.schemas import TestRequest, Test, TestSubmission
from utils import get_document_context, get_document_by_id
from agents import create_assessment_expert_agent, create_test_generation_task, run_agent_task

router = APIRouter()

# Storage directory
TESTS_DIR = "./storage/tests"
os.makedirs(TESTS_DIR, exist_ok=True)

@router.post("/generate", response_model=Test)
async def generate_test(request: TestRequest):
    """Generate a test for a topic and optional document"""
    context = ""
    
    # If document_id is provided, validate and get context
    if request.document_id:
        document = get_document_by_id(request.document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        context = get_document_context(request.topic, request.document_id)
    
    try:
        # Create assessment expert agent
        assessment_expert = create_assessment_expert_agent()
        
        # Create test generation task
        test_task = create_test_generation_task(
            assessment_expert, 
            request.topic, 
            request.difficulty,
            context
        )
        
        # Execute task
        test_data = run_agent_task(assessment_expert, test_task)
        
        # Parse test data
        from utils import parse_test_from_text
        parsed_test = parse_test_from_text(test_data)
        
        # Generate a unique ID for the test
        test_id = str(uuid.uuid4())[:8]
        
        # Create test
        test = Test(
            id=test_id,
            topic=request.topic,
            questions=parsed_test["questions"],
            answer_key=parsed_test["answer_key"],
            document_id=request.document_id or "",
            created_at=datetime.now().isoformat()
        )
        
        # Save test to file
        with open(f"{TESTS_DIR}/{test_id}.json", "w") as f:
            json.dump(test.dict(), f)
        
        return test
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating test: {str(e)}")

@router.get("/", response_model=List[Test])
async def get_all_tests():
    """Get all tests"""
    tests = []
    
    if not os.path.exists(TESTS_DIR):
        return tests
    
    for file in os.listdir(TESTS_DIR):
        if file.endswith(".json"):
            with open(f"{TESTS_DIR}/{file}", "r") as f:
                test = json.load(f)
                tests.append(Test(**test))
    
    # Sort by creation date (newest first)
    tests.sort(key=lambda x: x.created_at, reverse=True)
    return tests

@router.get("/{test_id}", response_model=Test)
async def get_test(test_id: str):
    """Get a specific test"""
    test_path = f"{TESTS_DIR}/{test_id}.json"
    
    if not os.path.exists(test_path):
        raise HTTPException(status_code=404, detail="Test not found")
    
    with open(test_path, "r") as f:
        test = json.load(f)
    
    return Test(**test)

@router.delete("/{test_id}")
async def delete_test(test_id: str):
    """Delete a test"""
    test_path = f"{TESTS_DIR}/{test_id}.json"
    
    if not os.path.exists(test_path):
        raise HTTPException(status_code=404, detail="Test not found")
    
    os.remove(test_path)
    return {"status": "success", "message": "Test deleted successfully"}

@router.post("/{test_id}/submit", response_model=dict)
async def submit_test_answers(test_id: str, submission: TestSubmission):
    """Submit answers for a test"""
    test_path = f"{TESTS_DIR}/{test_id}.json"
    
    if not os.path.exists(test_path):
        raise HTTPException(status_code=404, detail="Test not found")
    
    with open(test_path, "r") as f:
        test = json.load(f)
    
    # Calculate score
    correct_answers = 0
    total_questions = len(test["questions"])
    
    for question_id, answer in submission.answers.items():
        if question_id in test["answer_key"] and answer.lower() == test["answer_key"][question_id].lower():
            correct_answers += 1
    
    score_percentage = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
    
    return {
        "score": score_percentage,
        "correct_answers": correct_answers,
        "total_questions": total_questions,
        "feedback": "Great job!" if score_percentage >= 70 else "Keep practicing!"
    }
