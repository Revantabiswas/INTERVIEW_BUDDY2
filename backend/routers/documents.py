from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from typing import List, Optional
import uuid
from fastapi.responses import JSONResponse
from pathlib import Path
import os

from models.schemas import DocumentMetadata, DocumentResponse
from utils import process_document_async, create_vector_store, list_processed_documents, get_document_by_id
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    process_now: bool = Form(False)
):
    """Upload and process a document"""
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Log request details
    logger.info(f"Received upload: {file.filename}, size: {file.size}, content_type: {file.content_type}")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Process the document using the async version which takes UploadFile
        try:
            doc_info = await process_document_async(file)
            
            # Remove text content from response
            doc_metadata = {k: v for k, v in doc_info.items() if k != 'text_by_page'}
            
            # Vector store creation
            if process_now:
                try:
                    background_tasks.add_task(create_vector_store, doc_info)
                except Exception as vs_err:
                    logger.error(f"Error creating vector store: {vs_err}")
            
            return DocumentResponse(
                status="success",
                document=DocumentMetadata(**doc_metadata)
            )
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.get("/", response_model=List[DocumentMetadata])
async def get_documents():
    """Get a list of all processed documents"""
    try:
        documents = list_processed_documents()
        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving documents: {str(e)}")

@router.get("/{document_id}", response_model=DocumentMetadata)
async def get_document(document_id: str):
    """Get document metadata by ID"""
    doc = get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Remove text content from response
    doc_metadata = {k: v for k, v in doc.items() if k != 'text_by_page'}
    return doc_metadata

@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and its vector store"""
    try:
        # Check if document exists
        doc = get_document_by_id(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Get file paths
        cache_path = Path(f"./storage/cache/{document_id}.pkl")
        vectorstore_path = Path(f"./storage/vectorstores/{document_id}_vectorstore.pkl")
        
        # Delete files if they exist
        if cache_path.exists():
            os.remove(cache_path)
        
        if vectorstore_path.exists():
            os.remove(vectorstore_path)
            
        # Delete original document if path exists in metadata
        if 'file_path' in doc and Path(doc['file_path']).exists():
            os.remove(doc['file_path'])
            
        return {"status": "success", "message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")