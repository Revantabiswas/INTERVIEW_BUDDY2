import os
import re
import hashlib
import tempfile
import json
import concurrent.futures
import logging
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import pickle
import matplotlib.pyplot as plt
import networkx as nx
from functools import lru_cache

# Document processing
import fitz  # PyMuPDF
import PyPDF2
from docx import Document as DocxDocument

# Language model and embeddings
from langchain.vectorstores import FAISS
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document as LangchainDocument

# FastAPI specific imports
from fastapi import UploadFile, HTTPException
import aiofiles
from datetime import datetime

# Configuration constants
MAX_CHUNK_SIZE = 1000
OVERLAP_SIZE = 200
BATCH_SIZE = 10  # Number of pages to process at once for memory management

# Setup logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Define storage directories
BASE_DIR = Path("./storage")
CACHE_DIR = BASE_DIR / "cache"
DOCS_DIR = BASE_DIR / "documents"
VECTORSTORE_DIR = BASE_DIR / "vectorstores"

# Create directories if they don't exist
for dir_path in [BASE_DIR, CACHE_DIR, DOCS_DIR, VECTORSTORE_DIR]:
    dir_path.mkdir(exist_ok=True, parents=True)

@lru_cache(maxsize=1)
def get_embeddings():
    # Load HuggingFace embeddings
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-mpnet-base-v2"
    )

# Document Processing Functions
def compute_file_hash(file_bytes):
    """Compute MD5 hash for a file to use as cache key"""
    return hashlib.md5(file_bytes).hexdigest()

def extract_text_from_pdf_pymupdf(file_bytes, start_page=0, end_page=None):
    """Extract text from PDF using PyMuPDF (primary method)"""
    text_by_page = []
    
    with fitz.open(stream=file_bytes, filetype="pdf") as pdf_document:
        total_pages = pdf_document.page_count
        end_page = end_page if end_page is not None else total_pages
        
        for page_num in range(start_page, min(end_page, total_pages)):
            page = pdf_document.load_page(page_num)
            text = page.get_text()
            text_by_page.append(text)
            
    return text_by_page

def extract_text_from_pdf_pypdf2(file_bytes, start_page=0, end_page=None):
    """Extract text from PDF using PyPDF2 (fallback method)"""
    text_by_page = []
    
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        temp_file.write(file_bytes)
        temp_file_path = temp_file.name
    
    try:
        with open(temp_file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            total_pages = len(pdf_reader.pages)
            end_page = end_page if end_page is not None else total_pages
            
            for page_num in range(start_page, min(end_page, total_pages)):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                text_by_page.append(text)
    finally:
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
            
    return text_by_page

def extract_text_from_docx(file_bytes):
    """Extract text from DOCX file"""
    text_by_page = []
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp_file:
        temp_file.write(file_bytes)
        temp_file_path = temp_file.name
    
    try:
        doc = DocxDocument(temp_file_path)
        full_text = '\n'.join([paragraph.text for paragraph in doc.paragraphs])
        
        # Split into pseudo-pages (approx. 3000 chars per page)
        chars_per_page = 3000
        text_by_page = [full_text[i:i+chars_per_page] 
                       for i in range(0, len(full_text), chars_per_page)]
    finally:
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
            
    return text_by_page

def extract_text_from_txt(file_bytes):
    """Extract text from TXT file"""
    text = file_bytes.decode('utf-8')
    
    # Split into pseudo-pages (approx. 3000 chars per page)
    chars_per_page = 3000
    text_by_page = [text[i:i+chars_per_page] 
                   for i in range(0, len(text), chars_per_page)]
    
    return text_by_page

async def process_document_async(file: UploadFile) -> dict:
    """Process document asynchronously and return document info"""
    # Reset file pointer if needed
    await file.seek(0)
    
    # Read file bytes
    file_content = await file.read()
    file_hash = compute_file_hash(file_content)
    file_extension = file.filename.split('.')[-1].lower()
    
    # Check if document is already cached
    cache_path = CACHE_DIR / f"{file_hash}.pkl"
    if cache_path.exists():
        with open(cache_path, 'rb') as f:
            logger.info(f"Using cached document: {file.filename}")
            return pickle.load(f)
    
    # Save the uploaded file
    file_path = DOCS_DIR / f"{file_hash}.{file_extension}"
    async with aiofiles.open(file_path, 'wb') as out_file:
        await file.seek(0)  # Reset file pointer
        await out_file.write(file_content)
    
    # Process document based on file type
    try:
        if file_extension == 'pdf':
            try:
                text_by_page = extract_text_from_pdf_pymupdf(file_content)
            except Exception as e:
                logger.warning(f"PyMuPDF extraction failed, falling back to PyPDF2: {e}")
                text_by_page = extract_text_from_pdf_pypdf2(file_content)
        elif file_extension == 'docx':
            text_by_page = extract_text_from_docx(file_content)
        elif file_extension == 'txt':
            text_by_page = extract_text_from_txt(file_content)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
            
        # Create document info
        doc_info = {
            'id': file_hash,
            'filename': file.filename,
            'pages': len(text_by_page),
            'text_by_page': text_by_page,
            'file_hash': file_hash,
            'created_at': datetime.now().isoformat(),
            'file_size': len(file_content),
            'mime_type': file.content_type,
            'file_path': str(file_path),
        }
        
        # Cache the processed document
        with open(cache_path, 'wb') as f:
            pickle.dump(doc_info, f)
        
        return doc_info
    except Exception as e:
        logger.error(f"Error in process_document_async: {e}", exc_info=True)
        raise

def process_document(file_path: str) -> dict:
    """Process document from file path and return document info"""
    # Read file bytes
    with open(file_path, 'rb') as f:
        file_content = f.read()
    
    file_hash = compute_file_hash(file_content)
    file_extension = file_path.split('.')[-1].lower()
    filename = Path(file_path).name
    
    # Check if document is already cached
    cache_path = CACHE_DIR / f"{file_hash}.pkl"
    if cache_path.exists():
        with open(cache_path, 'rb') as f:
            logger.info(f"Using cached document: {filename}")
            return pickle.load(f)
    
    # Process document based on file type
    try:
        if file_extension == 'pdf':
            try:
                # Use PyMuPDF first
                text_by_page = extract_text_from_pdf_pymupdf(file_content)
            except Exception as e:
                logger.warning(f"PyMuPDF extraction failed, falling back to PyPDF2: {e}")
                text_by_page = extract_text_from_pdf_pypdf2(file_content)
        elif file_extension == 'docx':
            text_by_page = extract_text_from_docx(file_content)
        elif file_extension == 'txt':
            text_by_page = extract_text_from_txt(file_content)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        raise ValueError(f"Error processing document: {str(e)}")
    
    # Create document object with metadata
    doc_info = {
        'id': file_hash,
        'filename': filename,
        'pages': len(text_by_page),
        'text_by_page': text_by_page,
        'file_hash': file_hash,
        'created_at': datetime.now().isoformat(),
        'file_size': len(file_content),
        'file_path': str(file_path),
    }
    
    # Cache the processed document
    with open(cache_path, 'wb') as f:
        pickle.dump(doc_info, f)
    
    return doc_info

def create_vector_store(document_info: dict) -> FAISS:
    """Create a vector store from document text"""
    
    # Check if we already have a vector store for this document
    vs_cache_path = VECTORSTORE_DIR / f"{document_info['file_hash']}_vectorstore.pkl"
    if vs_cache_path.exists():
        with open(vs_cache_path, 'rb') as f:
            logger.info(f"Using cached vectorstore for: {document_info['filename']}")
            return pickle.load(f)
    
    # Combine all pages into one text
    all_text = '\n\n'.join(document_info['text_by_page'])
    
    # Split text into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=MAX_CHUNK_SIZE,
        chunk_overlap=OVERLAP_SIZE,
        length_function=len
    )
    
    chunks = text_splitter.split_text(all_text)
    
    # Create documents for vectorstore
    documents = [
        LangchainDocument(page_content=chunk, metadata={"source": document_info['filename']})
        for chunk in chunks
    ]
    
    # Create vector store
    embeddings = get_embeddings()
    vectorstore = FAISS.from_documents(documents, embeddings)
    
    # Cache the vector store
    with open(vs_cache_path, 'wb') as f:
        pickle.dump(vectorstore, f)
    
    return vectorstore

def get_document_context(query: str, document_id: str, top_k=5) -> str:
    """Retrieve relevant context from the vector store based on query"""
    # Load vectorstore for the document
    vs_cache_path = VECTORSTORE_DIR / f"{document_id}_vectorstore.pkl"
    if not vs_cache_path.exists():
        logger.error(f"Vector store not found for document ID: {document_id}")
        return "No document context available."
    
    with open(vs_cache_path, 'rb') as f:
        vectorstore = pickle.load(f)
    
    try:
        results = vectorstore.similarity_search(query, k=top_k)
        context = "\n\n".join([doc.page_content for doc in results])
        return context
    except Exception as e:
        logger.error(f"Error retrieving document context: {e}")
        return "Error retrieving document context."

def list_processed_documents() -> List[Dict]:
    """List all processed documents with metadata"""
    documents = []
    
    for cache_file in CACHE_DIR.glob("*.pkl"):
        if "_vectorstore" not in cache_file.name:  # Skip vectorstore files
            try:
                with open(cache_file, 'rb') as f:
                    doc_info = pickle.load(f)
                    # Remove text content to save bandwidth
                    if 'text_by_page' in doc_info:
                        doc_info = {k: v for k, v in doc_info.items() if k != 'text_by_page'}
                    documents.append(doc_info)
            except Exception as e:
                logger.error(f"Error loading document metadata: {e}")
    
    # Sort by creation date (newest first)
    documents.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return documents

def get_document_by_id(document_id: str) -> Optional[Dict]:
    """Get document metadata by ID"""
    cache_path = CACHE_DIR / f"{document_id}.pkl"
    if not cache_path.exists():
        return None
    
    try:
        with open(cache_path, 'rb') as f:
            doc_info = pickle.load(f)
            return doc_info
    except Exception as e:
        logger.error(f"Error loading document: {e}")
        return None

def create_empty_routers():
    """Create empty router files if they don't exist"""
    router_files = [
        "progress.py",
        "dsa.py",
        "tests.py",
        "roadmaps.py",
        "flashcards.py",
    ]
    
    router_template = """from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_placeholder():
    return {"message": "Endpoint under development"}
"""
    
    router_dir = Path("./routers")
    for file in router_files:
        file_path = router_dir / file
        if not file_path.exists() or file_path.stat().st_size == 0:
            with open(file_path, "w") as f:
                f.write(router_template)
                logger.info(f"Created placeholder router file: {file}")
