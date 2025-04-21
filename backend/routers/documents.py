from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from typing import List, Optional
import uuid
from fastapi.responses import JSONResponse
from pathlib import Path
import os
import logging

from models.schemas import DocumentMetadata, DocumentResponse
from utils import (
    process_document_async,
    create_vector_store,
    list_processed_documents,
    get_document_by_id,
    process_document,
    compute_file_hash,
    get_document_hash,
    get_processed_documents,
    DocumentProcessingError
)

# Constants
SUPPORTED_FILE_TYPES = {'pdf', 'docx', 'txt'}
UPLOAD_DIR = Path("./storage/documents")
DOCUMENTS_DIR = Path("./storage/documents")
VECTOR_STORE_DIR = Path("./storage/vectorstores")

logger = logging.getLogger(__name__)

class FileFormatError(Exception):
    pass

router = APIRouter()

# Configure maximum file size (50MB)
MAX_FILE_SIZE = 50 * 1024 * 1024

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    process_now: bool = Form(True)  # Default to True to ensure vector store is created
) -> dict:
    """
    Upload a document and optionally process it immediately.
    
    Args:
        file: The file to upload
        process_now: Whether to process the document immediately
        
    Returns:
        dict: Document information including processing status
    """
    try:
        # Validate file type
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in SUPPORTED_FILE_TYPES:
            raise FileFormatError(f"Unsupported file format: {file_extension}. Supported formats are: {', '.join(SUPPORTED_FILE_TYPES)}")
        
        # Create directories if they don't exist
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        VECTOR_STORE_DIR.mkdir(parents=True, exist_ok=True)
        
        # Process document
        doc_info = await process_document_async(file)
        logger.info(f"Document processed successfully: {doc_info['id']}")
        
        # Create vector store immediately or in background
        if process_now:
            try:
                # Get the full document info to create vector store
                full_doc = get_document_by_id(doc_info["id"])
                if not full_doc:
                    logger.error(f"Failed to retrieve document data for {doc_info['id']}")
                    raise DocumentProcessingError(f"Failed to retrieve document data for {doc_info['id']}")
                    
                # Create vector store
                vector_store = create_vector_store(full_doc)
                logger.info(f"Vector store created for document {doc_info['id']}")
                
                # Check if vector store was properly created
                vector_store_path = VECTOR_STORE_DIR / doc_info["id"]
                if not vector_store_path.exists():
                    logger.error(f"Vector store directory was not created for {doc_info['id']}")
                    raise DocumentProcessingError("Vector store was not properly saved")
                
                return {
                    "id": doc_info["id"],
                    "filename": doc_info["filename"],
                    "pages": doc_info["pages"],
                    "status": "processed",
                    "vector_store_created": True,
                    "processing_method": "standard"
                }
            except Exception as e:
                logger.error(f"Error creating vector store: {str(e)}")
                return {
                    "id": doc_info["id"],
                    "filename": doc_info["filename"],
                    "pages": doc_info["pages"],
                    "status": "processed_with_errors",
                    "error": f"Document processed but vector store creation failed: {str(e)}",
                    "vector_store_created": False
                }
        else:
            # Add vector store creation to background tasks
            background_tasks.add_task(create_vector_store_background, doc_info["id"])
            return {
                "id": doc_info["id"],
                "filename": doc_info["filename"],
                "pages": doc_info["pages"],
                "status": "processing",
                "processing_method": "standard"
            }
            
    except FileFormatError as e:
        logger.error(f"File format error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except DocumentProcessingError as e:
        logger.error(f"Document processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# Helper function for background processing
async def create_vector_store_background(document_id: str):
    """Create vector store in the background"""
    try:
        doc_info = get_document_by_id(document_id)
        if not doc_info:
            logger.error(f"Document {document_id} not found for background vector store creation")
            return
            
        vector_store = create_vector_store(doc_info)
        logger.info(f"Vector store created in background for document {document_id}")
        
        # Verify the vector store was created
        vector_store_path = VECTOR_STORE_DIR / document_id
        if not vector_store_path.exists():
            logger.error(f"Vector store directory was not created for {document_id}")
            raise DocumentProcessingError("Vector store was not properly saved")
    except Exception as e:
        logger.error(f"Error creating vector store in background: {str(e)}")

@router.get("/status/{document_id}")
async def get_document_status(document_id: str) -> dict:
    """
    Get the processing status of a document.
    
    Args:
        document_id: The ID of the document
        
    Returns:
        dict: Document status information
    """
    try:
        doc = get_document_by_id(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Document {document_id} not found")
            
        # Check if vector store exists
        vector_store_path = VECTOR_STORE_DIR / document_id
        vector_store_exists = vector_store_path.exists()
        
        return {
            "id": document_id,
            "filename": doc.get("filename", "Unknown"),
            "pages": doc.get("pages", 0),
            "status": "processed" if vector_store_exists else "processing",
            "vector_store_created": vector_store_exists
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting document status: {str(e)}")

@router.get("/", response_model=List[DocumentMetadata])
async def get_documents():
    """Get a list of all processed documents"""
    try:
        documents = list_processed_documents()
        return documents
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing documents: {str(e)}")

@router.get("/{document_id}", response_model=DocumentMetadata)
async def get_document(document_id: str):
    """Get document metadata by ID"""
    doc = get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document {document_id} not found")
    
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
            raise HTTPException(status_code=404, detail=f"Document {document_id} not found")
            
        # Delete document cache
        cache_path = Path("./storage/cache") / f"{document_id}.pkl"
        if cache_path.exists():
            cache_path.unlink()
            
        # Delete vector store if it exists
        vector_store_path = VECTOR_STORE_DIR / document_id
        if vector_store_path.exists() and vector_store_path.is_dir():
            import shutil
            shutil.rmtree(vector_store_path)
            
        return {"message": f"Document {document_id} deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")