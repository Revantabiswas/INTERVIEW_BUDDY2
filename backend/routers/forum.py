from fastapi import APIRouter, HTTPException, Body, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import os
import json
import uuid
import httpx
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter()

# Get Supabase configuration from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Check if Supabase configuration is available
if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    import logging
    logging.warning("Supabase configuration not found in environment variables. Forum functionality will not work properly.")

# Models for request and response
class CreatePostRequest(BaseModel):
    title: str
    content: str
    user_id: str
    tags: Optional[List[str]] = []

class PostResponse(BaseModel):
    id: str
    title: str
    content: str
    user_id: str
    created_at: str
    tags: Optional[List[str]] = []
    
class TextAnalysisRequest(BaseModel):
    text: str
    options: Optional[Dict[str, Any]] = {}
    
class TextAnalysisResponse(BaseModel):
    summary: str
    sentiment: str
    tags: List[str]
    word_count: int

@router.post("/create-post", response_model=PostResponse)
async def create_post(post_request: CreatePostRequest):
    """Create a new forum post in Supabase"""
    try:
        # Generate a unique ID for the post
        post_id = str(uuid.uuid4())
        
        # Prepare post data
        post_data = {
            "id": post_id,
            "title": post_request.title,
            "content": post_request.content,
            "user_id": post_request.user_id,
            "created_at": datetime.now().isoformat(),
            "tags": post_request.tags
        }
        
        # Make API call to Supabase
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/posts",
                json=post_data,
                headers={
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                }
            )
            
            if response.status_code != 201:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Supabase error: {response.text}"
                )
                
            return post_data
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating forum post: {str(e)}"
        )

@router.get("/posts", response_model=List[PostResponse])
async def get_posts():
    """Get all forum posts from Supabase"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/posts",
                headers={
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json"
                },
                params={
                    "select": "*",
                    "order": "created_at.desc"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Supabase error: {response.text}"
                )
                
            return response.json()
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching forum posts: {str(e)}"
        )

@router.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(post_id: str):
    """Get a specific forum post from Supabase"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/posts",
                headers={
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json"
                },
                params={
                    "select": "*",
                    "id": f"eq.{post_id}"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Supabase error: {response.text}"
                )
                
            posts = response.json()
            if not posts:
                raise HTTPException(
                    status_code=404,
                    detail="Post not found"
                )
                
            return posts[0]
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching forum post: {str(e)}"
        )

@router.post("/analyze-text", response_model=TextAnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    """Analyze text and provide insights using simple analysis
    
    This endpoint provides a simple text analysis including a summary,
    sentiment analysis, auto-generated tags, and word count.
    """
    try:
        text = request.text
        options = request.options
        
        # Count words
        word_count = len(text.split())
        
        # Create a simple summary (first 100 characters or 20% of the text)
        summary_length = min(100, int(len(text) * 0.2))
        summary = text[:summary_length] + "..." if len(text) > summary_length else text
        
        # Very simple sentiment analysis
        positive_words = ["good", "great", "excellent", "amazing", "wonderful", "best", "positive", "happy"]
        negative_words = ["bad", "terrible", "awful", "worst", "negative", "sad", "unhappy", "disappointed"]
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            sentiment = "positive"
        elif negative_count > positive_count:
            sentiment = "negative"
        else:
            sentiment = "neutral"
        
        # Extract potential tags (just a simplified example)
        # In a real implementation, use NLP to extract key phrases
        words = [word.lower() for word in text.split() if len(word) > 4]
        unique_words = list(set(words))
        tags = unique_words[:5]  # Just use the first 5 unique words as tags
        
        return TextAnalysisResponse(
            summary=summary,
            sentiment=sentiment,
            tags=tags,
            word_count=word_count
        )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing text: {str(e)}"
        )