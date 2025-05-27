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
BASE_DIR = Path(__file__).parent
CACHE_DIR = BASE_DIR / "storage" / "cache"
DOCS_DIR = BASE_DIR / "storage" / "documents"
VECTORSTORE_DIR = BASE_DIR / "storage" / "vectorstores"

# Create directories if they don't exist
for dir_path in [BASE_DIR, CACHE_DIR, DOCS_DIR, VECTORSTORE_DIR]:
    dir_path.mkdir(exist_ok=True, parents=True)

# Custom exceptions
class DocumentProcessingError(Exception):
    """Raised when there's an error processing a document"""
    pass

class FileFormatError(Exception):
    """Raised when the file format is not supported"""
    pass

class VectorStoreError(Exception):
    """Exception for vector store operations"""
    pass

class DocumentNotFoundError(Exception):
    """Raised when a document or its vector store is not found"""
    pass

# Constants
UPLOAD_DIR = Path("uploads")
SUPPORTED_FILE_TYPES = {".pdf", ".docx", ".txt"}

@lru_cache(maxsize=1)
def get_embeddings():
    """Get cached instance of HuggingFace embeddings with improved configuration"""
    try:
        logger.info("Loading HuggingFace embedding model...")
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-mpnet-base-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True, "batch_size": 32}
        )
        logger.info("HuggingFace embedding model loaded successfully")
        return embeddings
    except Exception as e:
        logger.error(f"Error loading embeddings model: {e}", exc_info=True)
        # Fall back to a simpler model that might be more reliable
        logger.info("Falling back to simpler embedding model...")
        return HuggingFaceEmbeddings(
            model_name="sentence-transformers/paraphrase-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True}
        )

# Document Processing Functions
def compute_file_hash(file_bytes):
    """Compute MD5 hash for a file to use as cache key"""
    if isinstance(file_bytes, str):
        # If a file path is provided, read the file
        with open(file_bytes, 'rb') as f:
            file_bytes = f.read()
    return hashlib.md5(file_bytes).hexdigest()

def get_document_hash(file_path: str) -> str:
    """Get document hash from file path"""
    try:
        with open(file_path, 'rb') as f:
            file_bytes = f.read()
        return compute_file_hash(file_bytes)
    except Exception as e:
        logger.error(f"Error computing document hash: {e}", exc_info=True)
        raise DocumentProcessingError("Failed to compute document hash") from e

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
    """
    Process an uploaded document asynchronously.
    
    Args:
        file: The uploaded file
        
    Returns:
        dict: Document information including ID, filename, and pages
        
    Raises:
        DocumentProcessingError: If there's an error processing the document
        FileFormatError: If the file format is not supported
    """
    try:
        # Create upload directory if it doesn't exist
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        
        # Save file
        file_path = UPLOAD_DIR / file.filename
        try:
            with open(file_path, "wb") as buffer:
                # Read and write in chunks to handle large files
                chunk_size = 1024 * 1024  # 1MB chunks
                while chunk := await file.read(chunk_size):
                    buffer.write(chunk)
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            raise DocumentProcessingError("Failed to save file")
        
        # Get file hash
        with open(file_path, 'rb') as f:
            file_bytes = f.read()
            file_hash = compute_file_hash(file_bytes)
        
        # Check if document already exists
        if file_hash in get_processed_documents():
            return {
                "id": file_hash,
                "filename": file.filename,
                "pages": get_document_by_id(file_hash).get("pages", 0),
                "status": "already_processed"
            }
        
        # Process document
        try:
            doc_info = process_document(str(file_path))
            return {
                "id": doc_info["id"],
                "filename": file.filename,
                "pages": doc_info["pages"],
                "status": "processed"
            }
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            raise DocumentProcessingError(f"Failed to process document: {str(e)}")
            
    except Exception as e:
        logger.error(f"Error in process_document_async: {str(e)}", exc_info=True)
        raise DocumentProcessingError(f"Failed to process document: {str(e)}")

def process_document(file_path: str) -> dict:
    """
    Process document from file path and return document info.
    
    Args:
        file_path: Path to the document file
        
    Returns:
        dict: Document information including text and metadata
    """
    try:
        # Read file bytes in chunks to handle large files
        file_size = 0
        chunks = []
        chunk_size = 1024 * 1024  # 1MB chunks
        
        with open(file_path, 'rb') as f:
            while chunk := f.read(chunk_size):
                file_size += len(chunk)
                chunks.append(chunk)
        
        file_content = b''.join(chunks)
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
                # Use PyMuPDF for PDF processing
                logger.info(f"Using PyMuPDF for processing PDF: {filename}")
                text_by_page = extract_text_from_pdf_pymupdf(file_content)
                    
                # If PyMuPDF fails, try PyPDF2 as last resort
                if not text_by_page or len(text_by_page) == 0:
                    logger.warning(f"PyMuPDF extraction returned empty result for {filename}, falling back to PyPDF2")
                    text_by_page = extract_text_from_pdf_pypdf2(file_content)
            elif file_extension == 'docx':
                text_by_page = extract_text_from_docx(file_content)
            elif file_extension == 'txt':
                text_by_page = extract_text_from_txt(file_content)
            else:
                raise ValueError(f"Unsupported file format: {file_extension}")
                
            # Verify we got text content
            if not text_by_page or len(text_by_page) == 0:
                logger.warning(f"No text extracted from {filename}")
                text_by_page = ["No text could be extracted from this document."]
                
        except Exception as e:
            logger.error(f"Error processing document: {e}")
            raise DocumentProcessingError(f"Error processing document: {str(e)}")
        
        # Create document object with metadata
        doc_info = {
            'id': file_hash,
            'filename': filename,
            'pages': len(text_by_page),
            'text_by_page': text_by_page,
            'file_hash': file_hash,
            'created_at': datetime.now().isoformat(),
            'file_size': file_size,
            'file_path': str(file_path),
            'processing_status': 'completed',
            'processing_method': 'standard'
        }
        
        # Cache the processed document
        with open(cache_path, 'wb') as f:
            pickle.dump(doc_info, f)
        
        return doc_info
    except Exception as e:
        logger.error(f"Error in process_document: {str(e)}", exc_info=True)
        raise DocumentProcessingError(f"Failed to process document: {str(e)}") from e

def create_vector_store(doc_info: dict) -> Any:
    """
    Create a vector store from document text.
    
    Args:
        doc_info: Document information including text and metadata
        
    Returns:
        VectorStore: The created vector store
    """
    try:
        # Get document text from all pages
        text_by_page = doc_info.get('text_by_page', [])
        doc_id = doc_info.get('id', doc_info.get('file_hash', 'unknown'))
        
        # Check if document text is empty
        if not text_by_page or all(not page.strip() for page in text_by_page):
            logger.warning(f"Document text is empty for {doc_id}. Adding placeholder text.")
            # Add placeholder text to prevent empty vectors
            text_by_page = ["Document content could not be extracted properly. This is a placeholder text."]
        
        # Process in batches to avoid memory issues with large documents
        all_chunks = []
        batch_size = 10  # Process 10 pages at a time
        
        logger.info(f"Starting chunking process for document {doc_id} with {len(text_by_page)} pages")
        
        # Create text splitter with optimal parameters for semantic search
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=MAX_CHUNK_SIZE,
            chunk_overlap=OVERLAP_SIZE,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        
        # Process pages in batches
        for i in range(0, len(text_by_page), batch_size):
            batch_pages = text_by_page[i:i+batch_size]
            batch_text = "\n\n---PAGE BREAK---\n\n".join(page for page in batch_pages if page.strip())
            
            # Split text into chunks
            try:
                page_chunks = text_splitter.split_text(batch_text)
                all_chunks.extend(page_chunks)
                logger.info(f"Processed pages {i+1}-{min(i+batch_size, len(text_by_page))}, generated {len(page_chunks)} chunks")
            except Exception as e:
                logger.error(f"Error splitting text batch {i//batch_size}: {e}")
                # Continue with next batch if one fails
        
        # Ensure we have at least one chunk
        if not all_chunks:
            logger.warning(f"No chunks created for document {doc_id}. Adding placeholder chunk.")
            all_chunks = ["Document content could not be properly chunked. This is a placeholder."]
        
        logger.info(f"Total chunks created: {len(all_chunks)}")
        
        # Create embeddings
        try:
            embeddings = get_embeddings()
            logger.info("Successfully loaded embeddings model")
        except Exception as e:
            logger.error(f"Failed to load primary embeddings model: {e}")
            # Emergency fallback to the most basic model if everything else fails
            logger.info("Using emergency fallback embeddings model")
            from langchain.embeddings import HuggingFaceEmbeddings
            embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/paraphrase-MiniLM-L3-v2",
                model_kwargs={"device": "cpu"}
            )
        
        # Create vector store with proper metadata
        try:
            metadatas = [{"source": doc_id, "chunk": i} for i in range(len(all_chunks))]
            vector_store = FAISS.from_texts(
                texts=all_chunks,
                embedding=embeddings,
                metadatas=metadatas
            )
            logger.info(f"Successfully created FAISS vector store with {len(all_chunks)} chunks")
        except Exception as e:
            logger.error(f"Error creating FAISS vector store: {e}")
            # Try with smaller batch if the initial attempt fails
            if len(all_chunks) > 100:
                logger.info("Trying again with smaller batch size")
                
                # Create vector store with first 100 chunks
                first_batch = all_chunks[:100]
                first_metadatas= metadatas[:100]
                vector_store = FAISS.from_texts(
                    texts=first_batch,
                    embedding=embeddings,
                    metadatas=first_metadatas
                )
                
                # Add remaining chunks in smaller batches
                remaining_chunks = all_chunks[100:]
                remaining_metadatas = metadatas[100:]
                
                for i in range(0, len(remaining_chunks), 50):
                    end_idx = min(i+50, len(remaining_chunks))
                    batch_chunks = remaining_chunks[i:end_idx]
                    batch_metadatas = remaining_metadatas[i:end_idx]
                    
                    vector_store.add_texts(
                        texts=batch_chunks,
                        metadatas=batch_metadatas
                    )
                    logger.info(f"Added batch {i//50 + 1} to vector store")
            else:
                # If we have few chunks but still failing, something is wrong with the text content
                logger.error(f"Failed to create vector store even with small number of chunks: {e}")
                raise DocumentProcessingError(f"Failed to create vector store: {str(e)}")
        
        # Save vector store
        vector_store_path = VECTORSTORE_DIR / str(doc_id)
        vector_store_path.mkdir(parents=True, exist_ok=True)
        
        try:
            vector_store.save_local(str(vector_store_path))
            logger.info(f"Successfully saved vector store to {vector_store_path}")
        except Exception as save_error:
            logger.error(f"Error saving vector store: {save_error}")
            # Try again with alternative serialization
            try:
                import pickle
                with open(vector_store_path / "vector_store.pkl", "wb") as f:
                    pickle.dump(vector_store, f)
                logger.info(f"Saved vector store using pickle serialization")
            except Exception as pickle_error:
                logger.error(f"Failed to save vector store with pickle: {pickle_error}")
                # We'll still return the vector store even if we couldn't save it
        
        return vector_store
        
    except Exception as e:
        logger.error(f"Error creating vector store: {str(e)}", exc_info=True)
        raise DocumentProcessingError(f"Failed to create vector store: {str(e)}")

def load_vector_store(doc_id: str) -> Any:
    """
    Load or create a vector store for a document.
    
    Args:
        doc_id: Document ID
        
    Returns:
        FAISS: The loaded vector store
        
    Raises:
        DocumentNotFoundError: If document not found
        VectorStoreError: If vector store cannot be loaded or created
    """
    # Check if document exists
    doc_info = get_document_by_id(doc_id)
    if not doc_info:
        logger.error(f"Document {doc_id} not found in cache")
        raise DocumentNotFoundError(f"Document {doc_id} not found")
    
    # Check if vector store exists
    vector_store_path = VECTORSTORE_DIR / str(doc_id)
    logger.info(f"Checking for vector store at: {vector_store_path}")
    
    try:
        # Attempt to load existing vector store
        if vector_store_path.exists():
            logger.info(f"Vector store found at {vector_store_path}, attempting to load")
            
            # Get embeddings model
            embeddings = get_embeddings()
            
            # Try standard FAISS loading first
            try:
                vector_store = FAISS.load_local(
                    folder_path=str(vector_store_path),
                    embeddings=embeddings,
                    allow_dangerous_deserialization=True
                )
                logger.info(f"Successfully loaded vector store for {doc_id}")
                return vector_store
            except Exception as e:
                logger.warning(f"Standard loading of vector store failed: {e}")
                
                # Try alternative loading with pickle if standard failed
                pickle_path = vector_store_path / "vector_store.pkl"
                if pickle_path.exists():
                    logger.info(f"Trying to load vector store using pickle from {pickle_path}")
                    try:
                        with open(pickle_path, "rb") as f:
                            vector_store = pickle.load(f)
                        logger.info(f"Successfully loaded vector store from pickle for {doc_id}")
                        return vector_store
                    except Exception as pickle_e:
                        logger.warning(f"Pickle loading of vector store failed: {pickle_e}")
                
                # If both methods failed, recreate the vector store
                logger.warning(f"All loading methods failed, recreating vector store for {doc_id}")
                pass  # Fall through to recreation code
        else:
            logger.info(f"No vector store found at {vector_store_path}, creating new one")
        
        # Create a new vector store
        logger.info(f"Creating new vector store for document {doc_id}")
        vector_store = create_vector_store(doc_info)
        logger.info(f"Successfully created new vector store for {doc_id}")
        return vector_store
        
    except Exception as e:
        logger.error(f"Error loading or creating vector store: {str(e)}", exc_info=True)
        raise VectorStoreError(f"Failed to load or create vector store: {str(e)}")

def get_document_context(query: str, vectorstore_or_doc_id: Any, top_k: int = 3) -> str:
    """
    Get relevant context from a document or vectorstore for a given query.
    
    Args:
        query: Query string
        vectorstore_or_doc_id: Either a vector store object or document ID string
        top_k: Number of chunks to retrieve
        
    Returns:
        str: Relevant context from the document
    """
    try:
        # Check if input is a document ID or a vector store
        if isinstance(vectorstore_or_doc_id, str):
            # It's a document ID
            doc_id = vectorstore_or_doc_id
            # Check if document exists
            doc_info = get_document_by_id(doc_id)
            if not doc_info:
                logger.error(f"Document {doc_id} not found in cache")
                raise DocumentNotFoundError(f"Document {doc_id} not found")
                
            # Log more details about the document for debugging
            logger.info(f"Found document in cache: {doc_id}, filename: {doc_info.get('filename', 'unknown')}, pages: {doc_info.get('pages', 0)}")
                
            # Load or create vector store
            vector_store = load_vector_store(doc_id)
        else:
            # It's a vector store
            logger.info("Using provided vector store object directly")
            vector_store = vectorstore_or_doc_id
            
        # Search for relevant chunks
        logger.info(f"Searching for context relevant to query: {query[:50]}...")
        docs = vector_store.similarity_search(query, k=top_k)
        logger.info(f"Found {len(docs)} relevant chunks")
        
        # Combine chunks into context
        context = "\n".join(doc.page_content for doc in docs)
        
        # Process the context to filter out index-like sections
        cleaned_context = preprocess_document_context(context)
        
        # Log stats about the context
        context_length = len(cleaned_context)
        logger.info(f"Retrieved context length: {context_length} characters")
        if context_length < 50:
            logger.warning(f"Very short context retrieved ({context_length} chars): '{cleaned_context}'")
        
        return cleaned_context
        
    except DocumentNotFoundError:
        logger.error(f"Document not found error for: {vectorstore_or_doc_id}")
        raise
    except VectorStoreError as e:
        logger.error(f"Vector store error: {str(e)}")
        raise DocumentProcessingError(f"Vector store error: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting document context: {str(e)}", exc_info=True)
        raise DocumentProcessingError(f"Failed to get document context: {str(e)}")

def preprocess_document_context(context: str) -> str:
    """
    Preprocess document context to filter out index entries, tables of contents,
    and other non-informative sections.
    
    Args:
        context: The raw context text from vector search
        
    Returns:
        str: Cleaned context text
    """
    # If context is empty, return as is
    if not context or not context.strip():
        return context
    
    # Check if this looks like an index section (multiple short entries with page numbers)
    index_pattern = re.compile(r"^([\w\s\-\(\)]+),\s+\d+(\-\d+)?(,\s*\d+)*$", re.MULTILINE)
    index_entries = index_pattern.findall(context)
    
    # If more than 5 index-like entries, this is probably an index section
    if len(index_entries) > 5:
        logger.info("Detected index section in context, filtering out")
        # Either filter out the entire context if it's mostly index entries
        # or try to find actual content sections
        
        # Check what percentage of lines look like index entries
        lines = [line for line in context.split('\n') if line.strip()]
        index_lines = [line for line in lines if index_pattern.match(line)]
        
        if len(index_lines) / len(lines) > 0.5:  # If over 50% are index-like entries
            # This is primarily an index section - respond with a helpful message
            return "The search results contain primarily index entries. Please rephrase your question to focus on a specific concept or topic from the document."
        
        # Otherwise, try to filter out just the index parts
        filtered_lines = []
        current_block = []
        in_index_block = False
        
        for line in lines:
            if index_pattern.match(line):
                if not in_index_block:
                    # Start of an index block
                    in_index_block = True
                    if current_block:
                        filtered_lines.extend(current_block)
                        current_block = []
            else:
                if in_index_block:
                    # End of an index block
                    in_index_block = False
                current_block.append(line)
                
        if current_block:
            filtered_lines.extend(current_block)
            
        if filtered_lines:
            return "\n".join(filtered_lines)
    
    # Check for and remove symbol sections that often appear in algorithm textbooks
    symbol_index_pattern = re.compile(r"^[\u0370-\u03FF\u2200-\u22FF\u2190-\u21FF\u0100-\u017F\*\(\)\[\]\{\}][^\n]{0,10},\s+\d+(\-\d+)?(,\s*\d+)*$", re.MULTILINE)
    context = re.sub(symbol_index_pattern, "", context)
    
    return context

def list_processed_documents() -> List[Dict]:
    """List all processed documents"""
    try:
        documents = []
        for cache_file in CACHE_DIR.glob("*.pkl"):
            try:
                with open(cache_file, 'rb') as f:
                    doc_info = pickle.load(f)
                    # Remove text content from response
                    doc_metadata = {k: v for k, v in doc_info.items() if k != 'text_by_page'}
                    documents.append(doc_metadata)
            except Exception as e:
                logger.error(f"Error loading document {cache_file}: {e}")
                continue
        return documents
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        return []

def get_document_by_id(document_id: str) -> Optional[Dict]:
    """Get document by ID"""
    try:
        cache_path = CACHE_DIR / f"{document_id}.pkl"
        if cache_path.exists():
            with open(cache_path, 'rb') as f:
                return pickle.load(f)
        return None
    except Exception as e:
        logger.error(f"Error getting document {document_id}: {e}")
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

def parse_test_from_text(text):
    """Parse test data from text response"""
    try:
        # First try to see if it's valid JSON
        try:
            json_data = json.loads(text)
            if isinstance(json_data, dict) and "questions" in json_data and "answer_key" in json_data:
                # If JSON is already in the expected format, return it directly
                return json_data
        except json.JSONDecodeError:
            pass
        
        # Try to extract questions and answers from text
        test_data = {
            "questions": [],
            "answer_key": {}
        }
        
        # First try to find sections with standard markdown headers
        questions_match = re.search(r"#+\s*Questions\s*(.*?)(?=#+\s*Answer|$)", text, re.DOTALL)
        questions_text = questions_match.group(1) if questions_match else text
        
        # Look for numbered questions with potential options
        question_blocks = re.split(r"(?:^|\n)\s*(?:Question\s*)?(\d+)[\.:\)]\s*", questions_text)
        
        if len(question_blocks) > 1:
            # First element is empty or intro text, so skip it
            for i in range(1, len(question_blocks), 2):
                if i+1 < len(question_blocks):
                    question_num = question_blocks[i]
                    question_content = question_blocks[i+1].strip()
                    
                    # Check if the question has multiple choice options
                    options_match = re.findall(r"(?:^|\n)\s*([A-Da-d])[\.:\)]\s*(.*?)(?=(?:^|\n)\s*[A-Da-d][\.:\)]|$)", 
                                              question_content, re.DOTALL | re.MULTILINE)
                    
                    if options_match:
                        # This is a multiple choice question
                        question_text = re.split(r"(?:^|\n)\s*[A-Da-d][\.:\)]", question_content)[0].strip()
                        options = [opt[1].strip() for opt in options_match]
                        
                        test_data["questions"].append({
                            "question": question_text,
                            "options": options
                        })
                    else:
                        # This is a short answer question
                        test_data["questions"].append({
                            "question": question_content
                        })
        else:
            # Fall back to the original simple pattern if the above didn't find anything
            question_pattern = re.compile(r"(?:^|\n)\s*(?:Question\s*)?(\d+)[\.:\)]\s*(.*?)(?=(?:^|\n)\s*(?:Question\s*)?(?:\d+)[\.:\)]|$)", re.DOTALL | re.MULTILINE)
            questions = question_pattern.findall(questions_text)
            for num, q in questions:
                test_data["questions"].append({
                    "question": q.strip()
                })
        
        # Extract answer key - try with header first
        answer_key_match = re.search(r"#+\s*Answer\s*Key\s*(.*?)$", text, re.DOTALL)
        if answer_key_match:
            answers_text = answer_key_match.group(1)
            answer_pattern = re.compile(r"(?:^|\n)\s*(?:Answer\s*)?(\d+)[\.:\)]\s*(.*?)(?=(?:^|\n)\s*(?:Answer\s*)?(?:\d+)[\.:\)]|$)", re.DOTALL | re.MULTILINE)
            answers = answer_pattern.findall(answers_text)
            for num, ans in answers:
                test_data["answer_key"][num] = ans.strip()
        
        return test_data
    except Exception as e:
        logger.error(f"Error parsing test: {e}")
        return {"questions": [], "answer_key": {}}
        
def parse_flashcards_from_text(text):
    """Parse flashcard data from text response with enhanced robustness"""
    try:
        # Sanitize any potential string format specifiers in the input text
        # This helps prevent '%s', '%d', etc. from causing string formatting errors
        text = text.replace("%", "%%")
        
        # First try to see if it's valid JSON
        try:
            json_data = json.loads(text)
            if isinstance(json_data, list):
                # If it's already a list of objects with front/back, return it
                if json_data and isinstance(json_data[0], dict) and "front" in json_data[0] and "back" in json_data[0]:
                    print(f"Found valid flashcards JSON list with {len(json_data)} cards")
                    # Escape any % characters in the content to prevent format string issues
                    return [{
                        "front": str(card.get("front", "")).replace("%", "%%"),
                        "back": str(card.get("back", "")).replace("%", "%%")
                    } for card in json_data]
                # Check for other formats like Q/A keys
                formatted_cards = []
                for item in json_data:
                    if isinstance(item, dict):
                        if "question" in item and "answer" in item:
                            formatted_cards.append({
                                "front": str(item["question"]).replace("%", "%%"), 
                                "back": str(item["answer"]).replace("%", "%%")
                            })
                        elif "q" in item and "a" in item:
                            formatted_cards.append({
                                "front": str(item["q"]).replace("%", "%%"), 
                                "back": str(item["a"]).replace("%", "%%")
                            })
                        elif "term" in item and "definition" in item:
                            formatted_cards.append({
                                "front": str(item["term"]).replace("%", "%%"), 
                                "back": str(item["definition"]).replace("%", "%%")
                            })
                        # Handle potential nested content
                        elif any(key in item for key in ["content", "card", "text"]):
                            for key in ["content", "card", "text"]:
                                if key in item and isinstance(item[key], dict):
                                    card_content = item[key]
                                    if "front" in card_content and "back" in card_content:
                                        formatted_cards.append({
                                            "front": str(card_content["front"]).replace("%", "%%"),
                                            "back": str(card_content["back"]).replace("%", "%%")
                                        })
                                    break
                if formatted_cards:
                    print(f"Converted JSON format to standard format, found {len(formatted_cards)} cards")
                    return formatted_cards
            elif isinstance(json_data, dict):
                # Check for nested flashcards field
                if "flashcards" in json_data and isinstance(json_data["flashcards"], list):
                    print(f"Found flashcards field in JSON with {len(json_data['flashcards'])} cards")
                    cards = []
                    for card in json_data["flashcards"]:
                        if isinstance(card, dict):
                            if "front" in card and "back" in card:
                                cards.append({
                                    "front": str(card["front"]).replace("%", "%%"), 
                                    "back": str(card["back"]).replace("%", "%%")
                                })
                            elif "question" in card and "answer" in card:
                                cards.append({
                                    "front": str(card["question"]).replace("%", "%%"), 
                                    "back": str(card["answer"]).replace("%", "%%")
                                })
                    if cards:
                        return cards
                    # If we couldn't convert, at least ensure the strings are escaped
                    return [{
                        "front": str(card.get("front", "")).replace("%", "%%") if isinstance(card, dict) else str(card).replace("%", "%%"), 
                        "back": str(card.get("back", "")).replace("%", "%%") if isinstance(card, dict) else "No content available"
                    } for card in json_data["flashcards"]]
                elif "cards" in json_data and isinstance(json_data["cards"], list):
                    print(f"Found cards field in JSON with {len(json_data['cards'])} cards")
                    cards = []
                    for card in json_data["cards"]:
                        if isinstance(card, dict):
                            if "front" in card and "back" in card:
                                cards.append({
                                    "front": str(card["front"]).replace("%", "%%"), 
                                    "back": str(card["back"]).replace("%", "%%")
                                })
                            elif "question" in card and "answer" in card:
                                cards.append({
                                    "front": str(card["question"]).replace("%", "%%"), 
                                    "back": str(card["answer"]).replace("%", "%%")
                                })
                    if cards:
                        return cards
                    # If we couldn't convert, at least ensure the strings are escaped
                    return [{
                        "front": str(card.get("front", "")).replace("%", "%%") if isinstance(card, dict) else str(card).replace("%", "%%"), 
                        "back": str(card.get("back", "")).replace("%", "%%") if isinstance(card, dict) else "No content available"
                    } for card in json_data["cards"]]
                # Check direct front/back arrays
                elif "front" in json_data and "back" in json_data:
                    fronts = json_data["front"]
                    backs = json_data["back"]
                    if isinstance(fronts, list) and isinstance(backs, list) and len(fronts) == len(backs):
                        cards = []
                        for i in range(len(fronts)):
                            cards.append({
                                "front": str(fronts[i]).replace("%", "%%"), 
                                "back": str(backs[i]).replace("%", "%%")
                            })
                        print(f"Created {len(cards)} cards from front/back arrays")
                        return cards
        except json.JSONDecodeError:
            print("JSON parsing failed, trying text patterns")
            pass
            
        # If not valid JSON, try to parse structured text
        flashcards = []
        
        # Pattern for "Q: ... A: ..." format
        qa_pattern = re.compile(r"(?:Card\s*\d*:?\s*)?(?:Q|Question):?\s*(.*?)\s*(?:A|Answer):?\s*(.*?)(?=(?:\n\s*(?:Card\s*\d*:?\s*)?(?:Q|Question):?)|$)", re.DOTALL)
        matches = qa_pattern.findall(text)
        if matches:
            for q, a in matches:
                if q.strip() and a.strip():  # Only add if both sides have content
                    # Escape % characters in both front and back content
                    flashcards.append({
                        "front": q.strip().replace("%", "%%"), 
                        "back": a.strip().replace("%", "%%")
                    })
            print(f"Found {len(flashcards)} cards using Q/A pattern")
            if len(flashcards) > 0:
                return flashcards
        
        # Try another common format with numbered cards
        card_pattern = re.compile(r"(?:Card|Flashcard)\s*(\d+)[:.\)]*\s*\n*(?:Front|Question):?\s*(.*?)\s*\n*(?:Back|Answer):?\s*(.*?)(?=(?:\n\s*(?:Card|Flashcard)\s*\d+[:.\)]*)|$)", re.DOTALL)
        matches = card_pattern.findall(text)
        if matches:
            for _, front, back in matches:
                if front.strip() and back.strip():  # Only add if both sides have content
                    # Escape % characters in both front and back content
                    flashcards.append({
                        "front": front.strip().replace("%", "%%"), 
                        "back": back.strip().replace("%", "%%")
                    })
            print(f"Found {len(flashcards)} cards using Card/Front/Back pattern")
            if len(flashcards) > 0:
                return flashcards
        
        # Try simpler pattern with just Front/Back labels
        simple_pattern = re.compile(r"(?:^|\n)(?:Front|Question):?\s*(.*?)\s*\n+(?:Back|Answer):?\s*(.*?)(?=(?:\n+(?:Front|Question):?)|$)", re.DOTALL)
        matches = simple_pattern.findall(text)
        if matches:
            for front, back in matches:
                if front.strip() and back.strip():  # Only add if both sides have content
                    # Escape % characters in both front and back content
                    flashcards.append({
                        "front": front.strip().replace("%", "%%"), 
                        "back": back.strip().replace("%", "%%")
                    })
            print(f"Found {len(flashcards)} cards using simple Front/Back pattern")
            if len(flashcards) > 0:
                return flashcards
            
        # Try numbered items that might be term:definition pairs
        numbered_pattern = re.compile(r"(?:^|\n)\s*(\d+)[\.:\)]\s*(.*?)\s*(?::|->|→|—|-)\s*(.*?)(?=(?:\n\s*\d+[\.:\)])|$)", re.DOTALL)
        matches = numbered_pattern.findall(text)
        if matches:
            for _, front, back in matches:
                if front.strip() and back.strip():  # Only add if both sides have content
                    # Escape % characters in both front and back content
                    flashcards.append({
                        "front": front.strip().replace("%", "%%"), 
                        "back": back.strip().replace("%", "%%")
                    })
            print(f"Found {len(flashcards)} cards using numbered item pattern")
            if len(flashcards) > 0:
                return flashcards
        
        # Try term/definition pairs without numbers (often separated by - or :)
        term_def_pattern = re.compile(r"(?:^|\n)([^:\n-]{2,50})\s*(?::|->|→|—|-)\s*(.*?)(?=\n[^:\n-]{2,50}\s*(?::|->|→|—|-)|$)", re.DOTALL)
        matches = term_def_pattern.findall(text)
        if matches:
            for term, definition in matches:
                if term.strip() and definition.strip() and len(term.strip()) < 150:  # Reasonable term length
                    # Escape % characters in both front and back content
                    flashcards.append({
                        "front": term.strip().replace("%", "%%"), 
                        "back": definition.strip().replace("%", "%%")
                    })
            print(f"Found {len(flashcards)} cards using term:definition pattern")
            if len(flashcards) > 0:
                return flashcards
        
        # Try free text with double line breaks separating cards
        if not flashcards and "\n\n" in text:
            sections = text.split("\n\n")
            for section in sections:
                parts = section.split("\n", 1)
                if len(parts) == 2:
                    front, back = parts
                    if front.strip() and back.strip() and len(front.strip().split()) <= 20:  # Reasonable card front length
                        # Escape % characters in both front and back content
                        flashcards.append({
                            "front": front.strip().replace("%", "%%"), 
                            "back": back.strip().replace("%", "%%")
                        })
            
            if flashcards:
                print(f"Found {len(flashcards)} cards using paragraph pattern")
                return flashcards
        
        # Try a last resort pattern that looks for any kind of term-definition structure
        if not flashcards:
            lines = text.strip().split('\n')
            potential_cards = []
            
            for i in range(0, len(lines)-1, 2):
                if i+1 < len(lines):
                    # Check if this looks like a term-definition pair
                    potential_front = lines[i].strip()
                    potential_back = lines[i+1].strip()
                    
                    # Check for reasonable front/back contents
                    if (potential_front and potential_back and 
                            len(potential_front) < 200 and 
                            potential_front != potential_back and
                            not potential_front.startswith('---')):
                        # Escape % characters in both front and back content
                        potential_cards.append({
                            "front": potential_front.replace("%", "%%"),
                            "back": potential_back.replace("%", "%%")
                        })
            
            if potential_cards:
                print(f"Found {len(potential_cards)} cards using last-resort pattern")
                return potential_cards
                
        # If all else fails, try to extract any content from markdown/bullet points
        if not flashcards:
            print("Trying markdown/bullet extraction as last resort")
            bullet_points = re.findall(r"(?:^|\n)[\*\-•]\s*(.*?)(?=(?:\n[\*\-•])|$)", text, re.DOTALL)
            if len(bullet_points) >= 2 and len(bullet_points) % 2 == 0:
                # If we have an even number of bullet points, try to pair them
                for i in range(0, len(bullet_points), 2):
                    if i+1 < len(bullet_points):
                        front = bullet_points[i].strip()
                        back = bullet_points[i+1].strip()
                        if front and back:
                            # Escape % characters in both front and back content
                            flashcards.append({
                                "front": front.replace("%", "%%"),
                                "back": back.replace("%", "%%")
                            })
                
                if flashcards:
                    print(f"Created {len(flashcards)} cards from bullet points")
                    return flashcards
        
        # If we still have no flashcards, return a safe default message
        if not flashcards:
            print("No flashcards found in the response, returning safe default")
            return [{
                "front": "No valid flashcards could be parsed", 
                "back": "Please try again with a different topic or format."
            }]
                
        print("No flashcards found in the response")
        return []
    except Exception as e:
        print(f"Error parsing flashcards: {e}")
        import traceback
        traceback.print_exc()
        # Return a safe default in case of error
        return [{
            "front": "Error parsing flashcards",
            "back": "An error occurred while processing the flashcards. Please try again."
        }]

def parse_roadmap_from_text(text):
    """Parse roadmap data from text response"""
    try:
        roadmap_data = {
            "overview": "",
            "schedule": [],
            "milestones": [],
            "sections": []
        }
        # Extract overview
        overview_match = re.search(r"#+\s*Overview\s*(.*?)(?=#+|$)", text, re.DOTALL | re.IGNORECASE)
        if overview_match:
            roadmap_data["overview"] = overview_match.group(1).strip()
        
        # Extract day-by-day schedule
        schedule_pattern = re.compile(r"Day\s*(\d+):?\s*(.*?)(?=(?:Day\s*\d+)|$)", re.DOTALL | re.IGNORECASE)
        schedule_matches = schedule_pattern.findall(text)
        for day, content in schedule_matches:
            day_data = {
                "day": int(day),
                "content": content.strip(),
                "topics": [],
                "hours": 0
            }
            # Extract topics if available
            topics_match = re.search(r"Topics?:?\s*(.*?)(?=\n\n|$)", content, re.DOTALL)
            if topics_match:
                topics_text = topics_match.group(1)
                # Split by bullets or commas
                if "-" in topics_text:
                    day_data["topics"] = [t.strip() for t in topics_text.split("-") if t.strip()]
                else:
                    day_data["topics"] = [t.strip() for t in topics_text.split(",") if t.strip()]
            # Extract hours if available
            hours_match = re.search(r"(\d+(?:\.\d+)?)\s*hours?", content, re.IGNORECASE)
            if hours_match:
                day_data["hours"] = float(hours_match.group(1))
            
            roadmap_data["schedule"].append(day_data)
        
        # Extract milestones
        milestones_match = re.search(r"#+\s*Milestones\s*(.*?)(?=#+|$)", text, re.DOTALL | re.IGNORECASE)
        if milestones_match:
            milestones_text = milestones_match.group(1)
            # Try to extract individual milestones
            milestone_pattern = re.compile(r"(?:[\*\-•]\s*|\d+\.\s*)(.*?)(?=(?:[\*\-•]|\d+\.)|$)", re.DOTALL)
            milestones = milestone_pattern.findall(milestones_text)
            roadmap_data["milestones"] = [m.strip() for m in milestones if m.strip()]
        
        # Extract sections
        sections_match = re.search(r"#+\s*Sections\s*(.*?)(?=#+|$)", text, re.DOTALL | re.IGNORECASE)
        if sections_match:
            sections_text = sections_match.group(1)
            # Try to extract individual sections
            section_pattern = re.compile(r"(?:[\*\-•]\s*|\d+\.\s*)(.*?)(?=(?:[\*\-•]|\d+\.)|$)", re.DOTALL)
            sections = section_pattern.findall(sections_text)
            roadmap_data["sections"] = [s.strip() for s in sections if s.strip()]
        return roadmap_data
    except Exception as e:
        logger.error(f"Error parsing roadmap: {e}")
        return {
            "overview": "Error parsing roadmap data",
            "schedule": [],
            "milestones": [],
            "sections": []
        }
        
def parse_dsa_questions_from_text(text):
    """Parse DSA questions from text response"""
    try:
        # Try to parse as JSON
        try:
            questions = json.loads(text)
            if isinstance(questions, list):
                return questions
            elif isinstance(questions, dict) and "questions" in questions:
                return questions["questions"]
        except json.JSONDecodeError:
            pass
        # Use regex to parse structured text
        questions = []
        # Pattern for "Question X: Title"
        question_pattern = re.compile(r"Question\s*(\d+):\s*(.*?)(?=\n\n|\n(?:Difficulty|Description):|\Z)", re.DOTALL)
        description_pattern = re.compile(r"Description:\s*(.*?)(?=\n\n|\n(?:Input|Output|Example|Difficulty|Topics):|\Z)", re.DOTALL)
        difficulty_pattern = re.compile(r"Difficulty:\s*(.*?)(?=\n\n|\n(?:Description|Input|Output|Example|Topics|Company):|\Z)", re.DOTALL)
        topics_pattern = re.compile(r"Topics:\s*(.*?)(?=\n\n|\n(?:Description|Input|Output|Example|Difficulty|Company):|\Z)", re.DOTALL)
        company_pattern = re.compile(r"Company:\s*(.*?)(?=\n\n|\n(?:Description|Input|Output|Example|Difficulty|Topics):|\Z)", re.DOTALL)
        # Find all question blocks
        blocks = re.split(r"\n\s*Question\s*\d+:", text)
        if len(blocks) > 1:  # First block is likely introduction or empty
            for i, block in enumerate(blocks[1:], 1):
                block_text = f"Question {i}:{block}"
                question_match = question_pattern.search(block_text)
                description_match = description_pattern.search(block_text)
                difficulty_match = difficulty_pattern.search(block_text)
                topics_match = topics_pattern.search(block_text)
                company_match = company_pattern.search(block_text)
                question = {
                    "id": i,
                    "title": question_match.group(2).strip() if question_match else f"Question {i}",
                    "description": description_match.group(1).strip() if description_match else block_text.strip(),
                    "difficulty": difficulty_match.group(1).strip() if difficulty_match else "Medium",
                    "topics": [t.strip() for t in topics_match.group(1).split(',')] if topics_match else [],
                    "companies": [c.strip() for c in company_match.group(1).split(',')] if company_match else []
                }
                questions.append(question)
        return questions
    except Exception as e:
        logger.error(f"Error parsing DSA questions: {e}")
        return []
        
def calculate_dsa_progress_metrics(user_progress):
    """Calculate DSA practice progress metrics"""
    try:
        # Initialize metrics
        metrics = {
            "total_completed": 0,
            "total_attempted": 0,
            "by_difficulty": {"Easy": 0, "Medium": 0, "Hard": 0},
            "by_topic": {},
            "by_company": {},
            "success_rate": 0,
            "average_attempts": 0,
            "trending_topics": []
        }
        if not user_progress or not user_progress.get("questions"):
            return metrics
        questions = user_progress.get("questions", [])
        
        # Process each question
        for q in questions:
            if q.get("status") == "completed":
                metrics["total_completed"] += 1
            
            if q.get("attempts", 0) > 0:
                metrics["total_attempted"] += 1
            # Track by difficulty
            difficulty = q.get("difficulty", "Medium")
            if difficulty in metrics["by_difficulty"]:
                if q.get("status") == "completed":
                    metrics["by_difficulty"][difficulty] += 1
            # Track by topic
            for topic in q.get("topics", []):
                if topic not in metrics["by_topic"]:
                    metrics["by_topic"][topic] = {"completed": 0, "total": 0}
                
                metrics["by_topic"][topic]["total"] += 1
                if q.get("status") == "completed":
                    metrics["by_topic"][topic]["completed"] += 1
            # Track by company
            for company in q.get("companies", []):
                if company not in metrics["by_company"]:
                    metrics["by_company"][company] = {"completed": 0, "total": 0}
                
                metrics["by_company"][company]["total"] += 1
                if q.get("status") == "completed":
                    metrics["by_company"][company]["completed"] += 1
        # Calculate derived metrics
        if metrics["total_attempted"] > 0:
            metrics["success_rate"] = metrics["total_completed"] / metrics["total_attempted"] * 100
        # Calculate trending topics (topics with most questions)
        if metrics["by_topic"]:
            trending = sorted(metrics["by_topic"].items(), 
                             key=lambda x: x[1]["total"], 
                             reverse=True)[:5]
            metrics["trending_topics"] = [t[0] for t in trending]
        return metrics
    except Exception as e:
        logger.error(f"Error calculating progress metrics: {e}")
        return {}
        
def parse_code_analysis(text):
    """
    Parse code analysis output from debugging agent into a structured format
    
    Args:
        text: Raw text output from the debugging agent
        
    Returns:
        dict: Structured analysis with bugs, optimizations, improved code, etc.
    """
    try:
        # Initialize the structure for code analysis
        analysis = {
            "bugs": [],
            "optimizations": [],
            "improved_code": "",
            "time_complexity": "",
            "space_complexity": "",
            "explanation": ""
        }
        
        # Extract bugs section
        bugs_pattern = re.compile(r"BUGS:?\s*(.*?)(?=OPTIMIZATIONS:|TIME_COMPLEXITY:|IMPROVED_CODE:|SPACE_COMPLEXITY:|EXPLANATION:|$)", re.DOTALL | re.IGNORECASE)
        bugs_match = bugs_pattern.search(text)
        if bugs_match:
            bugs_text = bugs_match.group(1).strip()
            # Extract individual bugs (bullet points or numbered)
            bug_items = re.findall(r"(?:^|\n)(?:\d+\.|\*|-)\s*(.*?)(?=(?:\n(?:\d+\.|\*|-)|$))", bugs_text, re.DOTALL)
            if bug_items:
                analysis["bugs"] = [bug.strip() for bug in bug_items if bug.strip()]
            else:
                # If no bullet points found, split by newlines
                analysis["bugs"] = [line.strip() for line in bugs_text.split("\n") if line.strip()]
        
        # Extract optimizations section
        opt_pattern = re.compile(r"OPTIMIZATIONS:?\s*(.*?)(?=BUGS:|TIME_COMPLEXITY:|IMPROVED_CODE:|SPACE_COMPLEXITY:|EXPLANATION:|$)", re.DOTALL | re.IGNORECASE)
        opt_match = opt_pattern.search(text)
        if opt_match:
            opt_text = opt_match.group(1).strip()
            # Extract individual optimizations
            opt_items = re.findall(r"(?:^|\n)(?:\d+\.|\*|-)\s*(.*?)(?=(?:\n(?:\d+\.|\*|-)|$))", opt_text, re.DOTALL)
            if opt_items:
                analysis["optimizations"] = [opt.strip() for opt in opt_items if opt.strip()]
            else:
                # If no bullet points found, split by newlines
                analysis["optimizations"] = [line.strip() for line in opt_text.split("\n") if line.strip()]
        
        # Extract time complexity
        time_pattern = re.compile(r"TIME_COMPLEXITY:?\s*(.*?)(?=BUGS:|OPTIMIZATIONS:|IMPROVED_CODE:|SPACE_COMPLEXITY:|EXPLANATION:|$)", re.DOTALL | re.IGNORECASE)
        time_match = time_pattern.search(text)
        if time_match:
            analysis["time_complexity"] = time_match.group(1).strip()
        
        # Extract space complexity
        space_pattern = re.compile(r"SPACE_COMPLEXITY:?\s*(.*?)(?=BUGS:|OPTIMIZATIONS:|TIME_COMPLEXITY:|IMPROVED_CODE:|EXPLANATION:|$)", re.DOTALL | re.IGNORECASE)
        space_match = space_pattern.search(text)
        if space_match:
            analysis["space_complexity"] = space_match.group(1).strip()
        
        # Extract improved code section
        code_pattern = re.compile(r"IMPROVED_CODE:?\s*(.*?)(?=BUGS:|OPTIMIZATIONS:|TIME_COMPLEXITY:|SPACE_COMPLEXITY:|EXPLANATION:|$)", re.DOTALL | re.IGNORECASE)
        code_match = code_pattern.search(text)
        if code_match:
            code_text = code_match.group(1).strip()
            # Remove code block markers if present
            code_text = re.sub(r"^```\w*\n", "", code_text)
            code_text = re.sub(r"\n```$", "", code_text)
            analysis["improved_code"] = code_text.strip()
        
        # Extract explanation
        explanation_pattern = re.compile(r"EXPLANATION:?\s*(.*?)(?=BUGS:|OPTIMIZATIONS:|TIME_COMPLEXITY:|SPACE_COMPLEXITY:|IMPROVED_CODE:|$)", re.DOTALL | re.IGNORECASE)
        explanation_match = explanation_pattern.search(text)
        if explanation_match:
            analysis["explanation"] = explanation_match.group(1).strip()
        
        # If we couldn't extract any bugs but the analysis mentions issues, try to extract them from the explanation
        if not analysis["bugs"] and analysis["explanation"]:
            # Look for mention of issues in the explanation
            if re.search(r'issue|bug|problem|incorrect|wrong|error|fail', analysis["explanation"], re.IGNORECASE):
                # Split explanation into sentences
                sentences = re.split(r'(?<=[.!?])\s+', analysis["explanation"])
                # Filter sentences that seem to describe issues
                for sentence in sentences:
                    if re.search(r'issue|bug|problem|incorrect|wrong|error|fail', sentence, re.IGNORECASE):
                        analysis["bugs"].append(sentence.strip())
        
        # If we couldn't find any improved code using structured parsing, try a more general approach
        if not analysis["improved_code"]:
            # Look for code blocks
            code_blocks = re.findall(r"```(?:\w*\n)?(.*?)```", text, re.DOTALL)
            if code_blocks:
                # Use the largest code block found
                analysis["improved_code"] = max(code_blocks, key=len).strip()
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error parsing code analysis: {e}")
        return {
            "bugs": ["Error occurred while parsing the analysis"],
            "optimizations": [],
            "improved_code": "",
            "time_complexity": "",
            "space_complexity": "",
            "explanation": f"A parsing error occurred: {str(e)}"
        }

def get_sample_dsa_questions():
    """Return a comprehensive list of DSA questions from various platforms for interview preparation"""
    return [
        {
            "id": 1,
            "title": "Two Sum",
            "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
            "difficulty": "Easy",
            "topics": ["Array", "Hash Table"],
            "companies": ["Amazon", "Google", "Microsoft", "Facebook", "Adobe"],
            "link": "https://leetcode.com/problems/two-sum/",
            "platform": "LeetCode"
        },
        # ... (rest of the sample questions)
    ]
        
def get_processed_documents() -> List[str]:
    """Get a list of processed document IDs"""
    try:
        processed_docs = []
        for file_path in CACHE_DIR.glob("*.pkl"):
            processed_docs.append(file_path.stem)
        return processed_docs
    except Exception as e:
        logger.error(f"Error getting processed documents: {e}", exc_info=True)
        return []

def extract_chapter_directly(doc_info: dict, chapter_number: int) -> str:
    """
    Extract content directly from a specific chapter in a document.
    This bypasses vector search entirely and attempts to find chapter content
    directly from the document text.
    
    Args:
        doc_info: Document information including text_by_page and metadata
        chapter_number: The chapter number to extract
        
    Returns:
        str: The extracted chapter content or empty string if not found
    """
    try:
        if not doc_info or 'text_by_page' not in doc_info:
            logger.error(f"Invalid document info for chapter extraction")
            return ""
            
        text_by_page = doc_info.get('text_by_page', [])
        if not text_by_page:
            return ""
            
        # Find pages that contain chapter headers
        chapter_start_pages = []
        next_chapter_pages = []
        
        # Different patterns for chapter headers
        patterns = [
            # Standard chapter headers
            re.compile(r'(?i)(?:^|\n)\s*chapter\s+(\d+)', re.MULTILINE),
            # Alternate forms (e.g., "CHAPTER ONE", "Chapter I")
            re.compile(r'(?i)(?:^|\n)\s*chapter\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)', re.MULTILINE),
            re.compile(r'(?i)(?:^|\n)\s*chapter\s+([IVXivx]+)', re.MULTILINE),
            # Section headers that might indicate chapters
            re.compile(r'(?i)(?:^|\n)\s*(\d+)\.\s+[A-Z]', re.MULTILINE),
        ]
        
        # Map text numbers to digits
        text_to_num = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
            'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
            'nineteen': 19, 'twenty': 20
        }
        
        # Map Roman numerals to digits
        roman_to_num = {
            'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
            'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10,
            'xi': 11, 'xii': 12, 'xiii': 13, 'xiv': 14, 'xv': 15,
            'xvi': 16, 'xvii': 17, 'xviii': 18, 'xix': 19, 'xx': 20
        }
            
        # Look for chapter headers in each page
        for i, page_text in enumerate(text_by_page):
            for pattern in patterns:
                matches = pattern.findall(page_text)
                if matches:
                    for match in matches:
                        # Try to convert the matched chapter number to an integer
                        try:
                            if isinstance(match, str):
                                match_lower = match.lower()
                                if match_lower in text_to_num:
                                    match_num = text_to_num[match_lower]
                                elif match_lower in roman_to_num:
                                    match_num = roman_to_num[match_lower]
                                else:
                                    match_num = int(match)
                            else:
                                match_num = int(match)
                                
                            if match_num == chapter_number:
                                chapter_start_pages.append(i)
                            elif match_num == chapter_number + 1:
                                next_chapter_pages.append(i)
                        except (ValueError, TypeError):
                            pass
        
        if not chapter_start_pages:
            logger.warning(f"Could not find chapter {chapter_number} in document")
            # Try to find any page that mentions this chapter
            for i, page_text in enumerate(text_by_page):
                if re.search(rf'(?i)chapter\s+{chapter_number}\b', page_text):
                    chapter_start_pages.append(i)
        
        if chapter_start_pages:
            # Sort the pages in case we found multiple mentions
            chapter_start_pages.sort()
            start_page = chapter_start_pages[0]
            
            # Determine end page
            if next_chapter_pages:
                next_chapter_pages.sort()
                end_page = next_chapter_pages[0]
            else:
                # If we can't find the next chapter, use a reasonable number of pages
                end_page = min(start_page + 20, len(text_by_page))
            
            # Extract the chapter content
            chapter_content = "\n\n".join(text_by_page[start_page:end_page])
            
            # Clean up the content
            chapter_content = preprocess_document_context(chapter_content)
            
            logger.info(f"Successfully extracted content for Chapter {chapter_number} (pages {start_page+1} to {end_page})")
            return chapter_content
        else:
            return ""
    except Exception as e:
        logger.error(f"Error extracting chapter: {str(e)}", exc_info=True)
        return ""

def get_chapter_specific_context(query: str, doc_id: str, chapter_number: int = None, top_k: int = 5) -> str:
    """
    Get context specifically about a particular chapter from a document.
    This function is optimized for chapter-focused queries.
    
    Args:
        query: Query string
        doc_id: Document ID
        chapter_number: Target chapter number (extracted from query if None)
        top_k: Number of chunks to retrieve
        
    Returns:
        str: Context relevant to the specified chapter
    """
    try:
        # Extract chapter number from query if not provided
        if chapter_number is None:
            chapter_match = re.search(r"chapter\s+(\d+)", query.lower())
            if chapter_match:
                chapter_number = int(chapter_match.group(1))
        
        if chapter_number is None:
            # Fall back to standard context retrieval if no chapter specified
            logger.info("No chapter number specified, falling back to standard context retrieval")
            return get_document_context(query, doc_id, top_k)
            
        # Get document info
        doc_info = get_document_by_id(doc_id)
        if not doc_info:
            logger.error(f"Document {doc_id} not found")
            raise DocumentNotFoundError(f"Document {doc_id} not found")
            
        logger.info(f"Retrieving context specifically for Chapter {chapter_number}")
        
        # Approach 1: Try direct chapter extraction first
        logger.info(f"Trying direct chapter extraction for Chapter {chapter_number}")
        chapter_content = extract_chapter_directly(doc_info, chapter_number)
        if chapter_content and len(chapter_content.strip()) > 200:
            # If direct extraction found substantial content, use it
            logger.info(f"Successfully extracted Chapter {chapter_number} directly, content length: {len(chapter_content)}")
            return chapter_content
        else:
            logger.info(f"Direct extraction failed or returned insufficient content ({len(chapter_content) if chapter_content else 0} chars)")
        
        # Approach 2: Try vector search with chapter-focused query
        # Load or create vector store
        vector_store = load_vector_store(doc_id)
                
        # First try a chapter-specific query
        chapter_query = f"chapter {chapter_number}"
        logger.info(f"Performing vector search for '{chapter_query}'")
        docs = vector_store.similarity_search(chapter_query, k=top_k)
        
        # Filter for chunks actually containing the chapter
        chapter_pattern = re.compile(f"chapter\\s*{chapter_number}\\b", re.IGNORECASE)
        chapter_docs = [doc for doc in docs if chapter_pattern.search(doc.page_content)]
        logger.info(f"Found {len(chapter_docs)} chunks specifically mentioning Chapter {chapter_number}")
        
        if not chapter_docs:
            # If no exact chapter matches, add the original query results
            logger.info(f"No chapter-specific chunks found, trying with original query: {query}")
            original_docs = vector_store.similarity_search(query, k=top_k)
            docs = original_docs
        else:
            # If we have chapter matches, use those and try to add the original query results
            additional_docs = vector_store.similarity_search(query, k=top_k)
            logger.info(f"Adding query-specific results to chapter-specific chunks")
            # Combine without duplicates
            seen_content = set(doc.page_content for doc in chapter_docs)
            for doc in additional_docs:
                if doc.page_content not in seen_content:
                    chapter_docs.append(doc)
                    if len(chapter_docs) >= top_k:
                        break
            docs = chapter_docs
            
        # Combine and clean the context
        if docs:
            context = "\n".join(doc.page_content for doc in docs)
            cleaned_context = preprocess_document_context(context)
            context_length = len(cleaned_context)
            logger.info(f"Vector search retrieved context of length: {context_length}")
            
            # If we still don't have meaningful content, look through all pages for the chapter
            if "index" in cleaned_context.lower() or context_length < 200:
                logger.warning(f"Retrieved context appears to be index or too short ({context_length} chars)")
                # As a last resort, manually search through pages for any mention of the chapter
                logger.info(f"Searching all document pages for Chapter {chapter_number} mentions")
                chapter_content = []
                text_by_page = doc_info.get('text_by_page', [])
                for i, page_text in enumerate(text_by_page):
                    if chapter_pattern.search(page_text):
                        logger.info(f"Found Chapter {chapter_number} mention on page {i+1}")
                        chapter_content.append(page_text)
                        
                if chapter_content:
                    additional_context = "\n\n".join(chapter_content)
                    cleaned_context = preprocess_document_context(additional_context)
                    logger.info(f"Manual page search found content of length: {len(cleaned_context)}")
            
            if len(cleaned_context) > 100:
                return cleaned_context
        
        # If we still don't have good content, return a helpful message
        logger.warning(f"Failed to find specific content for Chapter {chapter_number}")
        return f"I couldn't find specific content for Chapter {chapter_number} in the document. The document might not have a clear chapter structure, or Chapter {chapter_number} might not exist in this document. Please try asking about specific topics or concepts instead."
            
    except DocumentNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error in get_chapter_specific_context: {str(e)}", exc_info=True)
        return f"Error retrieving chapter information: {str(e)}"

def debug_document_retrieval(doc_id: str, query: str, top_k: int = 5) -> Dict:
    """
    Debug function to examine what content is being retrieved for a specific query.
    This helps diagnose issues with chatbot responses about chapters or content.
    
    Args:
        doc_id: Document ID
        query: Query string (e.g., "Explain Chapter 1")
        top_k: Number of chunks to retrieve
        
    Returns:
        Dict: Diagnostic information about retrieved content
    """
    try:
        # Get document info
        doc_info = get_document_by_id(doc_id)
        if not doc_info:
            return {"error": f"Document {doc_id} not found"}
            
        # Check vector store
        vector_store_path = VECTORSTORE_DIR / str(doc_id)
        if not vector_store_path.exists():
            return {"error": f"Vector store not found for {doc_id}"}
            
        # Load vector store
        embeddings = get_embeddings()
        try:
            vector_store = FAISS.load_local(str(vector_store_path), embeddings, allow_dangerous_deserialization=True)
        except Exception as e:
            return {"error": f"Failed to load vector store: {str(e)}"}
            
        # Get chunks
        docs = vector_store.similarity_search(query, k=top_k)
        
        # Analyze chunks
        chunks_analysis = []
        for i, doc in enumerate(docs):
            # Check if this appears to be an index entry
            index_pattern = re.compile(r"^([\w\s\-\(\)]+),\s+\d+(\-\d+)?(,\s*\d+)*$", re.MULTILINE)
            index_matches = index_pattern.findall(doc.page_content)
            
            # Check if this contains chapter information
            chapter_mentions = len(re.findall(r"chapter\s+\d+", doc.page_content.lower()))
            
            # For chapter-specific queries, check if the mentioned chapter is in this chunk
            chapter_query_match = re.search(r"chapter\s+(\d+)", query.lower())
            relevant_to_query = False
            if chapter_query_match:
                requested_chapter = chapter_query_match.group(1)
                chapter_in_chunk = re.search(r"chapter\s+" + requested_chapter, doc.page_content.lower())
                relevant_to_query = bool(chapter_in_chunk)
            
            chunks_analysis.append({
                "chunk_number": i + 1,
                "content_length": len(doc.page_content),
                "appears_to_be_index": len(index_matches) > 5,
                "chapter_mentions": chapter_mentions,
                "relevant_to_query": relevant_to_query,
                "first_100_chars": doc.page_content[:100] + "..." if len(doc.page_content) > 100 else doc.page_content,
                "metadata": doc.metadata
            })
        
        return {
            "query": query,
            "document_id": doc_id,
            "document_name": doc_info.get("filename", "Unknown"),
            "total_pages": doc_info.get("pages", 0),
            "chunks_retrieved": len(docs),
            "chunks_analysis": chunks_analysis
        }
    except Exception as e:
        logger.error(f"Error in debug_document_retrieval: {str(e)}", exc_info=True)
        return {"error": f"Debugging failed: {str(e)}"}

def parse_exam_test_from_text(text: str) -> Dict[str, Any]:
    """
    Parse a generated exam test from text format into structured format.
    This function is more advanced than the normal parse_test_from_text,
    supporting additional metadata like difficulty levels and topics.
    """
    questions = []
    answer_key = {}
    
    try:
        # Try to extract JSON if it exists in the text
        json_match = re.search(r'```json\s*([\s\S]+?)\s*```', text)
        if json_match:
            try:
                data = json.loads(json_match.group(1))
                # Extract questions and answer key based on expected format
                if isinstance(data, dict):
                    if "questions" in data and "answer_key" in data:
                        return data
                    elif "questions" in data:
                        questions_data = data["questions"]
                        for i, q in enumerate(questions_data):
                            q_id = f"q{i+1}"
                            if "id" in q:
                                q_id = q["id"]
                            
                            # Extract answer if available
                            if "answer" in q:
                                answer_key[q_id] = q["answer"]
                                
                        # If answer key is missing but answers exist in questions, create it
                        if not answer_key:
                            answer_key = {f"q{i+1}": q.get("answer", "") for i, q in enumerate(questions_data) if "answer" in q}
                            
                        return {
                            "questions": questions_data,
                            "answer_key": answer_key
                        }
            except json.JSONDecodeError:
                # If JSON parsing fails, fall back to text parsing
                pass
        
        # Parse text format
        lines = text.split("\n")
        current_question = None
        options = []
        
        for line in lines:
            # Skip empty lines
            if not line.strip():
                continue
            
            # Check for question pattern
            question_match = re.match(r'^(?:Q(\d+)[.:]?\s+)?(.+)$', line)
            if question_match and not re.match(r'^[A-D][.)]\s+', line):
                # If we were processing a question, add it to the list
                if current_question:
                    q_id = f"q{len(questions) + 1}"
                    questions.append({
                        "question": current_question,
                        "options": options.copy() if options else []
                    })
                    
                # Start a new question
                current_question = question_match.group(2)
                options = []
                continue
            
            # Check for option pattern
            option_match = re.match(r'^([A-D])[.)]\s+(.+)$', line)
            if option_match and current_question:
                options.append(option_match.group(2))
                continue
            
            # Check for answer key pattern
            answer_match = re.match(r'^Answer(?:\s+(?:to|for)\s+(?:question\s+)?(\d+))?\s*:\s*([A-D]).*', line, re.IGNORECASE)
            if answer_match:
                q_num = answer_match.group(1)
                ans = answer_match.group(2)
                
                if q_num:
                    q_id = f"q{q_num}"
                else:
                    q_id = f"q{len(questions) + 1}"
                    
                answer_key[q_id] = ans
                continue
        
        # Add the last question if any
        if current_question:
            q_id = f"q{len(questions) + 1}"
            questions.append({
                "question": current_question,
                "options": options.copy() if options else []
            })
        
        # If we don't have an answer key yet, try to extract it differently
        if not answer_key:
            # Look for "Answer Key:" section
            answer_section_idx = -1
            for i, line in enumerate(lines):
                if re.match(r'^Answer\s+Key\s*:', line, re.IGNORECASE):
                    answer_section_idx = i
                    break
            
            if answer_section_idx >= 0:
                for line in lines[answer_section_idx + 1:]:
                    # Look for patterns like "1. A" or "Question 1: A"
                    ans_match = re.match(r'^(?:Question\s+)?(\d+)[:.]\s*([A-D])', line, re.IGNORECASE)
                    if ans_match:
                        q_num = ans_match.group(1)
                        ans = ans_match.group(2)
                        answer_key[f"q{q_num}"] = ans
        
        # Create default answer key if none was found
        if not answer_key:
            # Just assign random answers for testing - in production this would be an error
            import random
            choices = ['A', 'B', 'C', 'D']
            answer_key = {f"q{i+1}": random.choice(choices) for i in range(len(questions))}
        
        return {
            "questions": questions,
            "answer_key": answer_key
        }
    except Exception as e:
        logger.error(f"Error parsing exam test: {e}")
        return {"questions": [], "answer_key": {}}
