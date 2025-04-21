from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
import json
import os
from pathlib import Path
import logging
import re

# Imports for LLM functionality
from agents import get_llm, create_study_tutor_agent, create_explanation_task, run_agent_task

# Change relative imports to absolute imports
from utils import (
    get_document_context, DocumentNotFoundError, DocumentProcessingError,
    get_chapter_specific_context, debug_document_retrieval
)
from config import UPLOAD_DIR, VECTOR_STORE_DIR

router = APIRouter()
logger = logging.getLogger(__name__)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    document_ids: Optional[List[str]] = None

class ChatResponse(BaseModel):
    content: str
    sources: Optional[List[str]] = None

@router.post("/ask")
async def ask_question(request: dict):
    """
    Ask a question about a specific document.
    """
    try:
        document_id = request.get("document_id")
        question = request.get("question")

        if not document_id or not question:
            raise HTTPException(status_code=400, detail="Missing document_id or question")

        # Get document context
        try:
            # Check if this is a chapter-specific question
            chapter_match = re.search(r"chapter\s+(\d+)", question.lower())
            
            if chapter_match:
                # For chapter-specific questions, use specialized retrieval
                logger.info(f"Chapter-specific question detected for chapter {chapter_match.group(1)}")
                chapter_number = int(chapter_match.group(1))
                context = get_chapter_specific_context(question, document_id, chapter_number)
                logger.info(f"Retrieved chapter-specific context of length: {len(context)}")
            else:
                # Regular question handling
                context = get_document_context(question, document_id)
                
            sources = [document_id]
            
        except DocumentNotFoundError:
            raise HTTPException(status_code=404, detail=f"Document {document_id} not found")
        except DocumentProcessingError as e:
            raise HTTPException(status_code=500, detail=str(e))

        # Create an AI tutor and task for document-specific questions
        tutor_agent = create_study_tutor_agent()
        
        # For very short contexts that might be index entries, try to detect this case
        if len(context) < 200 or "index entries" in context.lower():
            logger.warning(f"Very short context retrieved, possibly index-only: {context}")
            # If the context is very short or contains the index warning, try to recover
            try:
                # Try debug retrieval to get more insights
                debug_info = debug_document_retrieval(document_id, question)
                logger.info(f"Debug retrieval results: {debug_info}")
                
                # Check if all retrieved chunks appear to be index entries
                if all(chunk.get("appears_to_be_index", False) for chunk in debug_info.get("chunks_analysis", [])):
                    # This is a case where we're only getting index entries
                    error_message = (
                        "I can't provide a detailed explanation because the document sections I can access "
                        "appear to be primarily index or table of contents pages rather than actual content. "
                        "Could you try asking about a different topic from the document, or provide more specific "
                        "details about what you'd like to know? For example, instead of asking about 'Chapter 1', "
                        "you might ask about a specific concept that appears in that chapter."
                    )
                    return {
                        "content": error_message,
                        "sources": sources
                    }
            except Exception as debug_error:
                logger.error(f"Error in debug recovery: {debug_error}")
                # Continue with the original context if debug fails
                pass
            
        explanation_task = create_explanation_task(tutor_agent, question, context)
        
        # Generate the answer
        response = run_agent_task(tutor_agent, explanation_task)

        return {
            "content": response,
            "sources": sources
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing question: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process question: {str(e)}")

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint that uses document context if provided. 
    Answers general questions if no context is attached.
    """
    try:
        # Get the last user message
        user_messages = [msg for msg in request.messages if msg.role == "user"]
        if not user_messages:
            raise HTTPException(status_code=400, detail="No user message found")
        query = user_messages[-1].content

        # Get context from documents if provided
        context = ""
        sources = []
        if request.document_ids:
            for doc_id in request.document_ids:
                try:
                    # Fix the parameter order: query first, then document_id
                    doc_context = get_document_context(query, doc_id)
                    if doc_context:
                        context += f"\n\nFrom document '{doc_id}':\n{doc_context}"
                        sources.append(doc_id)
                except DocumentNotFoundError:
                    logger.warning(f"Document {doc_id} not found, skipping")
                except Exception as e:
                    logger.error(f"Error getting context for document {doc_id}: {str(e)}")
                    # Continue with other documents instead of failing completely

        # Create a tutor agent for generating responses
        tutor_agent = create_study_tutor_agent()
        
        if context:
            # Create a task with document context
            system_prompt = """You are an expert tutor. Answer the user's question based on the provided context.
            If the answer isn't in the context, say so politely. Cite specific parts of the document when relevant."""
            task_context = f"{context}\n\nQuestion: {query}"
            explanation_task = create_explanation_task(tutor_agent, query, task_context)
        else:
            # Create a task for general questions without document context
            explanation_task = create_explanation_task(tutor_agent, query, "")
        
        # Generate the response
        response = run_agent_task(tutor_agent, explanation_task)

        return ChatResponse(
            content=response,
            sources=sources if sources else None
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{document_id}")
async def get_chat_history(document_id: str):
    """
    Get chat history for a specific document
    """
    try:
        history_path = Path("./storage/chat_histories.json")
        
        # Create file if it doesn't exist
        if not history_path.exists():
            with open(history_path, 'w') as f:
                json.dump({}, f)
            return []
        
        # Read chat history
        with open(history_path, 'r') as f:
            all_histories = json.load(f)
            
        # Return chat history for the document
        document_history = all_histories.get(document_id, [])
        return document_history
    
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get chat history: {str(e)}")

@router.delete("/history/{document_id}")
async def clear_chat_history(document_id: str):
    """
    Clear chat history for a specific document
    """
    try:
        history_path = Path("./storage/chat_histories.json")
        
        # Return early if file doesn't exist
        if not history_path.exists():
            return {"message": "History cleared"}
        
        # Read chat history
        with open(history_path, 'r') as f:
            all_histories = json.load(f)
            
        # Clear history for document
        all_histories[document_id] = []
        
        # Write back
        with open(history_path, 'w') as f:
            json.dump(all_histories, f)
            
        return {"message": "History cleared"}
    
    except Exception as e:
        logger.error(f"Error clearing chat history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to clear chat history: {str(e)}")