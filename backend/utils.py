import os
import re
import hashlib
import tempfile
import json
import concurrent.futures
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import pickle
import matplotlib.pyplot as plt
import networkx as nx
import logging
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime

# Document processing
import fitz  # PyMuPDF
from docx import Document as DocxDocument

# Language model and embeddings
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document as LangchainDocument

# Configuration constants
MAX_CHUNK_SIZE = 1000
OVERLAP_SIZE = 200
BATCH_SIZE = 10  # Number of pages to process at once for memory management

# Setup logger for this module
logger = logging.getLogger(__name__)

# Cache embeddings using a simple dictionary
_embeddings_cache = {}
def get_embeddings():
    """Get embeddings model, with caching and better error handling"""
    global _embeddings_cache
    
    # Try multiple model options in case one fails
    model_options = [
        "sentence-transformers/all-mpnet-base-v2",
        "sentence-transformers/all-MiniLM-L6-v2",  # Smaller, faster alternative
        "sentence-transformers/paraphrase-MiniLM-L3-v2"  # Even smaller fallback
    ]
    
    # First check if we already have a cached model
    for model_name in model_options:
        if model_name in _embeddings_cache:
            logger.info(f"Using cached embedding model: {model_name}")
            return _embeddings_cache[model_name]
    
    # Try loading each model in priority order
    for model_name in model_options:
        try:
            logger.info(f"Attempting to load embedding model: {model_name}")
            
            # Check if sentence_transformers is available
            try:
                import sentence_transformers
                logger.info("sentence_transformers package is available")
            except ImportError:
                logger.error("sentence_transformers package is not installed")
                raise ImportError("The required package 'sentence-transformers' is not installed. Please install it using pip.")

            # Load embeddings model with explicit parameters
            embeddings = HuggingFaceEmbeddings(
                model_name=model_name,
                cache_folder=None,  # Use default cache location
                model_kwargs={"device": "cpu"}
            )
            
            # Test the embeddings with a simple example
            test_text = "This is a test"
            _ = embeddings.embed_query(test_text)
            
            logger.info(f"Successfully loaded and tested embedding model: {model_name}")
            _embeddings_cache[model_name] = embeddings
            return embeddings
            
        except Exception as e:
            logger.error(f"Error loading model {model_name}: {str(e)}")
            continue  # Try next model
    
    # If all models failed, use a very basic fallback
    logger.warning("All embedding models failed to load. Using simple mock embeddings.")
    
    class MockEmbeddings:
        """Simple mock embeddings that return random vectors"""
        def embed_documents(self, texts):
            import numpy as np
            # Return random vectors of fixed dimension (384)
            return [np.random.rand(384).tolist() for _ in texts]
            
        def embed_query(self, text):
            import numpy as np
            # Return random vector of fixed dimension (384)
            return np.random.rand(384).tolist()
    
    mock_embeddings = MockEmbeddings()
    _embeddings_cache["mock"] = mock_embeddings
    return mock_embeddings

def process_document(file_path: str, cache_dir: Path) -> Dict[str, Any]:
    """Process an uploaded document file from its path with improved error handling."""
    logger.info(f"Processing document at path: {file_path}")
    try:    
        # Validate file path
        if not isinstance(file_path, str):
            raise ValueError(f"Expected string path, got {type(file_path)}")
            
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found at path: {file_path}")
            
        if os.path.getsize(file_path) == 0:
            raise ValueError("File is empty")
            
        filename = os.path.basename(file_path)
        
        # Determine file type from extension
        if '.' not in filename:
            raise ValueError(f"File has no extension: {filename}")
            
        ext = filename.split('.')[-1].lower()
        logger.info(f"Processing file: {filename} (type: {ext})")
        
        pages = []
        text_by_page = []
        
        if ext == 'pdf':
            # Process PDF
            try:
                logger.info(f"Opening PDF: {file_path}")
                # Use context manager to ensure the document is properly handled
                with fitz.open(file_path) as doc:
                    logger.info(f"PDF opened successfully. Page count: {doc.page_count}")
                    for i, page in enumerate(doc):
                        try:
                            text = page.get_text("text")
                            if text and text.strip():  # Only add non-empty pages
                                pages.append(i+1)
                                text_by_page.append(text)
                        except Exception as page_err:
                            logger.warning(f"Error extracting text from page {i+1}: {str(page_err)}")
                    logger.info(f"Extracted text from {len(text_by_page)}/{doc.page_count} PDF pages")
                logger.info(f"PDF document {filename} closed.")
            except Exception as pdf_err:
                logger.error(f"Error processing PDF: {str(pdf_err)}", exc_info=True)
                raise ValueError(f"Failed to process PDF: {str(pdf_err)}")
                
        elif ext == 'docx':
            # Process DOCX
            try:
                doc = DocxDocument(file_path)
                all_paras = []
                # Extract paragraphs with better error handling
                for p in doc.paragraphs:
                    try:
                        if p.text and p.text.strip():
                            all_paras.append(p.text)
                    except Exception as para_err:
                        logger.warning(f"Error with paragraph: {str(para_err)}")
                
                # Combine into a single page for simplicity
                full_text = "\n\n".join(all_paras)
                if full_text.strip():
                    text_by_page.append(full_text)
                    pages.append(1)
                logger.info(f"Processed DOCX with {len(all_paras)} paragraphs")
            except Exception as docx_err:
                logger.error(f"Error processing DOCX: {str(docx_err)}", exc_info=True)
                raise ValueError(f"Failed to process DOCX: {str(docx_err)}")
                
        elif ext in ['txt', 'md']:
            # Process plain text
            try:
                with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()
                if content.strip():
                    text_by_page.append(content)
                    pages.append(1)
                logger.info(f"Processed text file with {len(content)} characters")
            except Exception as txt_err:
                logger.error(f"Error processing text file: {str(txt_err)}", exc_info=True)
                raise ValueError(f"Failed to process text file: {str(txt_err)}")
        
        # Validate extracted content
        if not text_by_page:
            logger.warning("No text could be extracted from document")
            # Return a minimal document info to indicate processing_failed status
            return {
                'id': str(uuid.uuid4()),
                'filename': filename,
                'type': ext,
                'pages': 0,
                'page_numbers': [],
                'text_by_page': [],
                'upload_time': datetime.now().isoformat(),
                'status': 'processing_failed',
                'size': os.path.getsize(file_path) if os.path.exists(file_path) else 0
            }
        
        # Create document info
        doc_id = str(uuid.uuid4())
        upload_time = datetime.now().isoformat()
        file_size = os.path.getsize(file_path)
        doc_info = {
            'id': doc_id,
            'filename': filename,
            'type': ext,
            'pages': len(pages),
            'page_numbers': pages,
            'text_by_page': text_by_page,
            'upload_time': upload_time,
            'status': 'processed',
            'size': file_size
        }
        
        logger.info(f"Document processing complete: {filename} with ID {doc_id} ({len(pages)} pages)")
        return doc_info
        
    except Exception as e:
        logger.error(f"Document processing failed: {str(e)}", exc_info=True)
        # Re-throw the exception so the API endpoint can handle it
        raise

def create_vector_store(document_info: Dict[str, Any], cache_dir: Path):
    """Create a vector store from document text with more error resilience."""
    doc_id = document_info.get('id')
    doc_filename = document_info.get('filename')
    try:
        if not doc_id:
            logger.warning("Document ID is missing, generating a new one")
            doc_id = str(uuid.uuid4())
            
        # Ensure cache directory exists
        os.makedirs(str(cache_dir), exist_ok=True)
        vs_cache_filename = f"{doc_id}_vectorstore.pkl"
        vs_cache_path = os.path.join(str(cache_dir), vs_cache_filename)
        logger.info(f"Vector store path: {vs_cache_path}")
        
        # Get text content
        text_by_page = document_info.get('text_by_page', [])
        if not text_by_page:
            logger.warning("No text content available, cannot create vector store")
            return None
        
        all_text = "\n\n".join(text_by_page)
        
        # Create chunks with a simple method if RecursiveCharacterTextSplitter fails
        try:
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=MAX_CHUNK_SIZE,
                chunk_overlap=OVERLAP_SIZE,
                length_function=len
            )
            chunks = text_splitter.split_text(all_text)
        except Exception as e:
            logger.warning(f"Error with RecursiveCharacterTextSplitter: {e}")
            # Simple fallback chunking
            chunks = []
            chunk_size = MAX_CHUNK_SIZE
            for i in range(0, len(all_text), chunk_size - OVERLAP_SIZE):
                chunks.append(all_text[i:i + chunk_size])
        
        if not chunks:
            logger.warning("No chunks created from text")
            return None
        
        logger.info(f"Created {len(chunks)} text chunks")
        
        # Create Langchain documents
        documents = []
        for i, chunk in enumerate(chunks):
            if not chunk.strip():  # Skip empty chunks
                continue
            doc = LangchainDocument(
                page_content=chunk,
                metadata={"source": doc_filename or "unknown", "chunk_id": i}
            )
            documents.append(doc)
        
        if not documents:
            logger.warning("No valid documents created")
            return None
        
        # Try to get embeddings - this is where many errors occur
        try:
            embeddings = get_embeddings()
            logger.info(f"Got embeddings, creating vector store with {len(documents)} documents")
            
            # Create vector store - handle different versions of FAISS
            try:
                vectorstore = FAISS.from_documents(documents, embeddings)
            except Exception as faiss_err:
                logger.error(f"Error with FAISS.from_documents: {str(faiss_err)}")
                # Try alternative construction method if available
                try:
                    from langchain.vectorstores.faiss import dependable_faiss_import
                    faiss = dependable_faiss_import()
                    if not faiss:
                        raise ImportError("Could not import faiss")
                    
                    # Manual construction
                    embeddings_list = embeddings.embed_documents([d.page_content for d in documents])
                    index = faiss.IndexFlatL2(len(embeddings_list[0]))
                    import numpy as np
                    index.add(np.array(embeddings_list, dtype=np.float32))
                    
                    # Create FAISS object manually
                    vectorstore = FAISS(embeddings, index, {i: d for i, d in enumerate(documents)})
                except Exception as e:
                    logger.error(f"Alternative FAISS creation failed: {e}")
                    raise
                    
            # Try to save vector store
            try:
                with open(vs_cache_path, 'wb') as f:
                    pickle.dump(vectorstore, f)
                logger.info(f"Vector store saved to {vs_cache_path}")
            except Exception as e:
                logger.warning(f"Could not save vector store: {e}")
                # Continue even if saving fails
            
            return vectorstore
            
        except Exception as emb_err:
            logger.error(f"Error with embeddings: {emb_err}")
            # Return None instead of failing
            return None
        
    except Exception as e:
        logger.error(f"Vector store creation error: {e}", exc_info=True)
        return None

def get_document_context(query: str, vectorstore: Optional[FAISS], top_k: int = 5) -> str:
    """Retrieve relevant context from the vector store based on query"""
    if vectorstore is None:
        logger.warning("Attempted to get context, but vectorstore is None.")
        return "No document context available."
    try:
        results = vectorstore.similarity_search(query, k=top_k)
        context = "\n\n".join([doc.page_content for doc in results])
        logger.info(f"Retrieved {len(results)} context chunks for query.")
        return context
    except Exception as e:
        logger.error(f"Error during similarity search: {e}", exc_info=True)
        return f"Error retrieving context: {e}"

def generate_mind_map_data(mind_map_description):
    """Generate network graph data from mind map description"""
    try:
        central_match = re.search(r"Central concept:\s*(.*?)(?:\n|$)", mind_map_description, re.IGNORECASE)
        central_node = central_match.group(1).strip() if central_match else "Main Topic"
        nodes = [{"id": 0, "label": central_node, "group": 0}]
        edges = []
        
        branch_pattern = re.compile(r"Branch(?:\s\d+)?:\s*(.*?)(?:\n|$)", re.IGNORECASE)
        connection_pattern = re.compile(r"Connection(?:\s\d+)?:\s*(.*?)\s*-\s*(.*?)(?:\n|$)", re.IGNORECASE)

        branches = branch_pattern.findall(mind_map_description)
        for i, branch in enumerate(branches):
            branch = branch.strip()
            nodes.append({"id": i+1, "label": branch, "group": 1})
            edges.append({"from": 0, "to": i+1})

        connections = connection_pattern.findall(mind_map_description)
        for i, (source, target) in enumerate(connections):
            source = source.strip()
            target = target.strip()
            source_id = next((i for i, node in enumerate(nodes) if node["label"] == source), None)
            target_id = next((i for i, node in enumerate(nodes) if node["label"] == target), None)

            if source_id is None:
                source_id = len(nodes)
                nodes.append({"id": source_id, "label": source, "group": 2})
            if target_id is None:
                target_id = len(nodes)
                nodes.append({"id": target_id, "label": target, "group": 2})

            edges.append({"from": source_id, "to": target_id})

        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        logger.error(f"Error generating mind map data: {e}", exc_info=True)
        return {"nodes": [{"id": 0, "label": "Error", "group": 0}], "edges": []}

def parse_flashcards_from_text(text):
    """Parse flashcard data from text response"""
    try:
        try:
            json_data = json.loads(text)
            if isinstance(json_data, list):
                return json_data
            elif isinstance(json_data, dict) and "flashcards" in json_data:
                return json_data["flashcards"]
        except json.JSONDecodeError:
            pass

        flashcards = []
        qa_pattern = re.compile(r"(?:Card\s*\d*:?\s*)?Q:\s*(.*?)\s*A:\s*(.*?)(?=(?:\n\s*(?:Card\s*\d*:?\s*)?Q:)|$)", re.DOTALL)
        matches = qa_pattern.findall(text)

        if matches:
            for q, a in matches:
                flashcards.append({"front": q.strip(), "back": a.strip()})
            return flashcards

        card_pattern = re.compile(r"(?:Card|Flashcard)\s*(\d+):\s*\n*Front:\s*(.*?)\s*\n*Back:\s*(.*?)(?=(?:\n\s*(?:Card|Flashcard)\s*\d+:)|$)", re.DOTALL)
        matches = card_pattern.findall(text)

        if matches:
            for _, front, back in matches:
                flashcards.append({"front": front.strip(), "back": back.strip()})
            return flashcards

        logger.warning("Could not parse flashcards from text.")
        return []
    except Exception as e:
        logger.error(f"Error parsing flashcards: {e}", exc_info=True)
        return []

def parse_test_from_text(text):
    """Parse test data from text response"""
    try:
        test_data = {
            "questions": [],
            "answer_key": {}
        }

        questions_match = re.search(r"#+\s*Questions\s*(.*?)(?=#+\s*Answer|$)", text, re.DOTALL)
        if questions_match:
            questions_text = questions_match.group(1)
            question_pattern = re.compile(r"(?:^|\n)\s*(?:Question\s*)?(\d+)[\.:\)]\s*(.*?)(?=(?:^|\n)\s*(?:Question\s*)?(?:\d+)[\.:\)]|$)", re.DOTALL | re.MULTILINE)
            questions = question_pattern.findall(questions_text)
            for num, q in questions:
                test_data["questions"].append(q.strip())
        else:
            question_pattern = re.compile(r"(?:^|\n)\s*(?:Question\s*)?(\d+)[\.:\)]\s*(.*?)(?=(?:^|\n)\s*(?:Question\s*)?(?:\d+)[\.:\)]|$)", re.DOTALL | re.MULTILINE)
            questions = question_pattern.findall(text)
            for num, q in questions:
                test_data["questions"].append(q.strip())

        answer_key_match = re.search(r"#+\s*Answer\s*Key\s*(.*?)$", text, re.DOTALL)
        if answer_key_match:
            answers_text = answer_key_match.group(1)
            answer_pattern = re.compile(r"(?:^|\n)\s*(?:Answer\s*)?(\d+)[\.:\)]\s*(.*?)(?=(?:^|\n)\s*(?:Answer\s*)?(?:\d+)[\.:\)]|$)", re.DOTALL | re.MULTILINE)
            answers = answer_pattern.findall(answers_text)
            for num, ans in answers:
                test_data["answer_key"][num] = ans.strip()

        if not test_data["questions"]:
            logger.warning("Could not parse questions from test text.")
        if not test_data["answer_key"]:
            logger.warning("Could not parse answer key from test text.")

        return test_data
    except Exception as e:
        logger.error(f"Error parsing test: {e}", exc_info=True)
        return {"questions": [], "answer_key": {}}

def parse_roadmap_from_text(text):
    """Parse roadmap data from text response"""
    try:
        roadmap_data = {
            "overview": "",
            "schedule": [],
            "milestones": [],
            "sections": []
        }

        overview_match = re.search(r"#+\s*Overview\s*(.*?)(?=#+|$)", text, re.DOTALL | re.IGNORECASE)
        if overview_match:
            roadmap_data["overview"] = overview_match.group(1).strip()

        schedule_pattern = re.compile(r"Day\s*(\d+):?\s*(.*?)(?=(?:Day\s*\d+)|$)", re.DOTALL | re.IGNORECASE)
        schedule_matches = schedule_pattern.findall(text)

        for day, content in schedule_matches:
            day_data = {
                "day": int(day),
                "content": content.strip(),
                "topics": [],
                "hours": 0
            }
            topics_match = re.search(r"Topics?:?\s*(.*?)(?=\n\n|$)", content, re.DOTALL)
            if topics_match:
                topics_text = topics_match.group(1)
                if "-" in topics_text:
                    day_data["topics"] = [t.strip() for t in topics_text.split("-") if t.strip()]
                else:
                    day_data["topics"] = [t.strip() for t in topics_text.split(",") if t.strip()]

            hours_match = re.search(r"(\d+(?:\.\d+)?)\s*hours?", content, re.IGNORECASE)
            if hours_match:
                day_data["hours"] = float(hours_match.group(1))

            roadmap_data["schedule"].append(day_data)

        milestones_match = re.search(r"#+\s*Milestones\s*(.*?)(?=#+|$)", text, re.DOTALL | re.IGNORECASE)
        if milestones_match:
            milestones_text = milestones_match.group(1)
            milestone_pattern = re.compile(r"(?:[\*\-•]\s*|\d+\.\s*)(.*?)(?=(?:[\*\-•]|\d+\.)|$)", re.DOTALL)
            milestones = milestone_pattern.findall(milestones_text)
            roadmap_data["milestones"] = [m.strip() for m in milestones if m.strip()]

        sections_match = re.search(r"#+\s*Sections\s*(.*?)(?=#+|$)", text, re.DOTALL | re.IGNORECASE)
        if sections_match:
            sections_text = sections_match.group(1)
            section_pattern = re.compile(r"(?:[\*\-•]\s*|\d+\.\s*)(.*?)(?=(?:[\*\-•]|\d+\.)|$)", re.DOTALL)
            sections = section_pattern.findall(sections_text)
            roadmap_data["sections"] = [s.strip() for s in sections if s.strip()]

        if not roadmap_data["schedule"] and not roadmap_data["milestones"] and not roadmap_data["sections"]:
            logger.warning("Could not parse detailed structure from roadmap text.")

        return roadmap_data
    except Exception as e:
        logger.error(f"Error parsing roadmap: {e}", exc_info=True)
        return {
            "overview": "Error parsing roadmap data",
            "schedule": [],
            "milestones": [],
            "sections": []
        }

def parse_dsa_questions_from_text(text):
    """Parse DSA questions from text response"""
    try:
        try:
            questions = json.loads(text)
            if isinstance(questions, list):
                return questions
            elif isinstance(questions, dict) and "questions" in questions:
                return questions["questions"]
        except json.JSONDecodeError:
            pass

        questions = []
        question_pattern = re.compile(r"Question\s*(\d+):\s*(.*?)(?=\n\n|\n(?:Difficulty|Description):|\Z)", re.DOTALL)
        description_pattern = re.compile(r"Description:\s*(.*?)(?=\n\n|\n(?:Input|Output|Example|Difficulty):|\Z)", re.DOTALL)
        difficulty_pattern = re.compile(r"Difficulty:\s*(.*?)(?=\n\n|\n(?:Description|Input|Output|Example|Topics):|\Z)", re.DOTALL)
        topics_pattern = re.compile(r"Topics:\s*(.*?)(?=\n\n|\n(?:Description|Input|Output|Example|Difficulty|Company):|\Z)", re.DOTALL)
        company_pattern = re.compile(r"Company:\s*(.*?)(?=\n\n|\n(?:Description|Input|Output|Example|Difficulty|Topics):|\Z)", re.DOTALL)

        blocks = re.split(r"\n\s*Question\s*\d+:", text)
        if len(blocks) > 1:
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

        if not questions:
            logger.warning("Could not parse DSA questions from text.")
        return questions
    except Exception as e:
        logger.error(f"Error parsing DSA questions: {e}", exc_info=True)
        return []

def calculate_dsa_progress_metrics(user_progress):
    """Calculate DSA practice progress metrics"""
    try:
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
        for q in questions:
            if q.get("status") == "completed":
                metrics["total_completed"] += 1
            if q.get("attempts", 0) > 0:
                metrics["total_attempted"] += 1

            difficulty = q.get("difficulty", "Medium")
            if difficulty in metrics["by_difficulty"]:
                metrics["by_difficulty"][difficulty] += 1

            for topic in q.get("topics", []):
                if topic not in metrics["by_topic"]:
                    metrics["by_topic"][topic] = {"completed": 0, "total": 0}

                metrics["by_topic"][topic]["total"] += 1
                if q.get("status") == "completed":
                    metrics["by_topic"][topic]["completed"] += 1

            for company in q.get("companies", []):
                if company not in metrics["by_company"]:
                    metrics["by_company"][company] = {"completed": 0, "total": 0}

                metrics["by_company"][company]["total"] += 1
                if q.get("status") == "completed":
                    metrics["by_company"][company]["completed"] += 1

        if metrics["total_attempted"] > 0:
            metrics["success_rate"] = metrics["total_completed"] / metrics["total_attempted"] * 100

        if metrics["by_topic"]:
            trending = sorted(metrics["by_topic"].items(),
                             key=lambda x: x[1]["total"],
                             reverse=True)[:5]
            metrics["trending_topics"] = [t[0] for t in trending]

        return metrics
    except Exception as e:
        logger.error(f"Error calculating progress metrics: {e}", exc_info=True)
        return {}

def parse_code_analysis(text):
    """Parse code analysis output from debugging agent"""
    try:
        analysis = {
            "bugs": [],
            "optimizations": [],
            "time_complexity": "",
            "space_complexity": "",
            "improved_code": ""
        }

        bugs_match = re.search(r"(?:Bugs|Issues)(?:\s+Found)?:\s*(.*?)(?=(?:\n\n|\n#|$))", text, re.DOTALL | re.IGNORECASE)
        if bugs_match:
            bugs_text = bugs_match.group(1)
            bug_items = re.findall(r"(?:^|\n)(?:\d+\.|\*|-)\s*(.*?)(?=(?:\n(?:\d+\.|\*|-|$))|\Z)", bugs_text, re.DOTALL)
            analysis["bugs"] = [bug.strip() for bug in bug_items if bug.strip()]

        opt_match = re.search(r"(?:Optimizations|Improvements):\s*(.*?)(?=(?:\n\n|\n#|$))", text, re.DOTALL | re.IGNORECASE)
        if opt_match:
            opt_text = opt_match.group(1)
            opt_items = re.findall(r"(?:^|\n)(?:\d+\.|\*|-)\s*(.*?)(?=(?:\n(?:\d+\.|\*|-|$))|\Z)", opt_text, re.DOTALL)
            analysis["optimizations"] = [opt.strip() for opt in opt_items if opt.strip()]

        time_match = re.search(r"Time Complexity:\s*(.*?)(?=\n|$)", text, re.IGNORECASE)
        if time_match:
            analysis["time_complexity"] = time_match.group(1).strip()

        space_match = re.search(r"Space Complexity:\s*(.*?)(?=\n|$)", text, re.IGNORECASE)
        if space_match:
            analysis["space_complexity"] = space_match.group(1).strip()

        code_match = re.search(r"(?:Improved|Optimized) Code:?\s*(?:```[\w]*\n)?(.*?)(?:```|\Z)", text, re.DOTALL | re.IGNORECASE)
        if code_match:
            analysis["improved_code"] = code_match.group(1).strip()

        if not analysis["bugs"] and not analysis["optimizations"] and not analysis["improved_code"]:
            logger.warning("Could not parse structured analysis from code analysis text.")

        return analysis
    except Exception as e:
        logger.error(f"Error parsing code analysis: {e}", exc_info=True)
        return {}

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
        {
            "id": 2,
            "title": "Reverse Linked List",
            "description": "Given the head of a singly linked list, reverse the list, and return the reversed list.",
            "difficulty": "Easy",
            "topics": ["Linked List", "Recursion"],
            "companies": ["Amazon", "Apple", "Microsoft", "Facebook"],
            "link": "https://leetcode.com/problems/reverse-linked-list/",
            "platform": "LeetCode"
        },
        {
            "id": 3,
            "title": "Valid Parentheses",
            "description": "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
            "difficulty": "Easy",
            "topics": ["Stack", "String"],
            "companies": ["Amazon", "Microsoft", "Google", "Facebook"],
            "link": "https://leetcode.com/problems/valid-parentheses/",
            "platform": "LeetCode"
        },
        {
            "id": 4,
            "title": "Maximum Subarray",
            "description": "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
            "difficulty": "Medium",
            "topics": ["Array", "Dynamic Programming", "Divide and Conquer"],
            "companies": ["Amazon", "Microsoft", "Apple", "Facebook", "Bloomberg"],
            "link": "https://leetcode.com/problems/maximum-subarray/",
            "platform": "LeetCode"
        },
        {
            "id": 5,
            "title": "Merge Intervals",
            "description": "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.",
            "difficulty": "Medium",
            "topics": ["Array", "Sorting"],
            "companies": ["Facebook", "Amazon", "Google", "Microsoft"],
            "link": "https://leetcode.com/problems/merge-intervals/",
            "platform": "LeetCode"
        },
        {
            "id": 6,
            "title": "3Sum",
            "description": "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.",
            "difficulty": "Medium",
            "topics": ["Array", "Two Pointers", "Sorting"],
            "companies": ["Amazon", "Facebook", "Google", "Microsoft", "Apple", "Adobe"],
            "link": "https://leetcode.com/problems/3sum/",
            "platform": "LeetCode"
        },
        {
            "id": 7,
            "title": "LRU Cache",
            "description": "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
            "difficulty": "Medium",
            "topics": ["Hash Table", "Linked List", "Design"],
            "companies": ["Amazon", "Microsoft", "Facebook", "Google", "Uber"],
            "link": "https://leetcode.com/problems/lru-cache/",
            "platform": "LeetCode"
        },
        {
            "id": 8,
            "title": "Trapping Rain Water",
            "description": "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
            "difficulty": "Hard",
            "topics": ["Array", "Two Pointers", "Dynamic Programming", "Stack"],
            "companies": ["Amazon", "Google", "Apple", "Facebook", "Microsoft"],
            "link": "https://leetcode.com/problems/trapping-rain-water/",
            "platform": "LeetCode"
        },
        {
            "id": 9,
            "title": "Binary Tree Level Order Traversal",
            "description": "Given the root of a binary tree, return the level order traversal of its nodes' values.",
            "difficulty": "Medium",
            "topics": ["Tree", "Binary Tree", "BFS"],
            "companies": ["Amazon", "Microsoft", "Facebook", "Google"],
            "link": "https://leetcode.com/problems/binary-tree-level-order-traversal/",
            "platform": "LeetCode"
        },
        {
            "id": 10,
            "title": "Word Break",
            "description": "Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.",
            "difficulty": "Medium",
            "topics": ["Dynamic Programming", "Trie", "String"],
            "companies": ["Amazon", "Google", "Facebook", "Microsoft", "Uber"],
            "link": "https://leetcode.com/problems/word-break/",
            "platform": "LeetCode"
        },
        {
            "id": 11,
            "title": "Merge K Sorted Lists",
            "description": "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list.",
            "difficulty": "Hard",
            "topics": ["Linked List", "Divide and Conquer", "Heap"],
            "companies": ["Amazon", "Google", "Microsoft", "Facebook"],
            "link": "https://leetcode.com/problems/merge-k-sorted-lists/",
            "platform": "LeetCode"
        },
        {
            "id": 12,
            "title": "Course Schedule",
            "description": "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai.",
            "difficulty": "Medium",
            "topics": ["Graph", "DFS", "BFS", "Topological Sort"],
            "companies": ["Google", "Amazon", "Facebook", "Microsoft"],
            "link": "https://leetcode.com/problems/course-schedule/",
            "platform": "LeetCode"
        },
        {
            "id": 13,
            "title": "Find Median from Data Stream",
            "description": "The median is the middle value in an ordered integer list. Design a data structure that supports adding new integers and finding the median.",
            "difficulty": "Hard",
            "topics": ["Heap", "Design", "Data Stream"],
            "companies": ["Amazon", "Google", "Microsoft", "Facebook"],
            "link": "https://leetcode.com/problems/find-median-from-data-stream/",
            "platform": "LeetCode"
        },
        {
            "id": 14,
            "title": "Min Stack",
            "description": "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.",
            "difficulty": "Easy",
            "topics": ["Stack", "Design"],
            "companies": ["Amazon", "Microsoft", "Google", "Bloomberg"],
            "link": "https://leetcode.com/problems/min-stack/",
            "platform": "LeetCode"
        },
        {
            "id": 15,
            "title": "Implement Trie (Prefix Tree)",
            "description": "A trie (pronounced as \"try\") or prefix tree is a tree data structure used to efficiently store and retrieve keys in a dataset of strings.",
            "difficulty": "Medium",
            "topics": ["Trie", "Design", "Tree"],
            "companies": ["Google", "Amazon", "Microsoft", "Facebook"],
            "link": "https://leetcode.com/problems/implement-trie-prefix-tree/",
            "platform": "LeetCode"
        },
        {
            "id": 16,
            "title": "Add Two Numbers",
            "description": "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit.",
            "difficulty": "Medium",
            "topics": ["Linked List", "Math", "Recursion"],
            "companies": ["Amazon", "Microsoft", "Apple", "Facebook", "Adobe"],
            "link": "https://leetcode.com/problems/add-two-numbers/",
            "platform": "LeetCode"
        },
        {
            "id": 17,
            "title": "Median of Two Sorted Arrays",
            "description": "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
            "difficulty": "Hard",
            "topics": ["Array", "Binary Search", "Divide and Conquer"],
            "companies": ["Google", "Amazon", "Microsoft", "Facebook"],
            "link": "https://leetcode.com/problems/median-of-two-sorted-arrays/",
            "platform": "LeetCode"
        },
        {
            "id": 18,
            "title": "Best Time to Buy and Sell Stock",
            "description": "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit.",
            "difficulty": "Easy",
            "topics": ["Array", "Dynamic Programming"],
            "companies": ["Amazon", "Microsoft", "Google", "Facebook", "Apple"],
            "link": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
            "platform": "LeetCode"
        },
        {
            "id": 19,
            "title": "Kth Largest Element in an Array",
            "description": "Given an integer array nums and an integer k, return the kth largest element in the array.",
            "difficulty": "Medium",
            "topics": ["Array", "Divide and Conquer", "Sorting", "Heap"],
            "companies": ["Amazon", "Facebook", "Microsoft", "Google"],
            "link": "https://leetcode.com/problems/kth-largest-element-in-an-array/",
            "platform": "LeetCode"
        },
        {
            "id": 20,
            "title": "Permutations",
            "description": "Given an array nums of distinct integers, return all the possible permutations.",
            "difficulty": "Medium",
            "topics": ["Array", "Backtracking"],
            "companies": ["Amazon", "Microsoft", "Google", "Facebook"],
            "link": "https://leetcode.com/problems/permutations/",
            "platform": "LeetCode"
        },
        {
            "id": 21,
            "title": "Rotate Array",
            "description": "Given an integer array nums, rotate the array to the right by k steps, where k is non-negative.",
            "difficulty": "Easy",
            "topics": ["Array", "Math"],
            "companies": ["Amazon", "Microsoft", "Apple", "Facebook"],
            "link": "https://leetcode.com/problems/rotate-array/",
            "platform": "LeetCode"
        },
        {
            "id": 22,
            "title": "Sort Colors",
            "description": "Given an array nums with n objects colored red, white, or blue, sort them in-place so that objects of the same color are adjacent.",
            "difficulty": "Medium",
            "topics": ["Array", "Two Pointers", "Sorting"],
            "companies": ["Amazon", "Microsoft", "Apple", "Google"],
            "link": "https://leetcode.com/problems/sort-colors/",
            "platform": "LeetCode"
        },
        {
            "id": 23,
            "title": "Validate Binary Search Tree",
            "description": "Given the root of a binary tree, determine if it is a valid binary search tree (BST).",
            "difficulty": "Medium",
            "topics": ["Tree", "Binary Search Tree", "DFS"],
            "companies": ["Amazon", "Microsoft", "Google", "Facebook"],
            "link": "https://leetcode.com/problems/validate-binary-search-tree/",
            "platform": "LeetCode"
        },
        {
            "id": 24,
            "title": "Longest Palindromic Substring",
            "description": "Given a string s, return the longest palindromic substring in s.",
            "difficulty": "Medium",
            "topics": ["String", "Dynamic Programming"],
            "companies": ["Amazon", "Microsoft", "Google", "Facebook"],
            "link": "https://leetcode.com/problems/longest-palindromic-substring/",
            "platform": "LeetCode"
        },
        {
            "id": 25,
            "title": "Single Number",
            "description": "Given a non-empty array of integers nums, every element appears twice except for one. Find that single one.",
            "difficulty": "Easy",
            "topics": ["Array", "Bit Manipulation"],
            "companies": ["Amazon", "Microsoft", "Google", "Facebook"],
            "link": "https://leetcode.com/problems/single-number/",
            "platform": "LeetCode"
        },
        {
            "id": 26,
            "title": "Detect a Loop in Linked List",
            "description": "Given a linked list, check if the linked list has a loop or not.",
            "difficulty": "Easy",
            "topics": ["Linked List", "Two Pointers"],
            "companies": ["Amazon", "Microsoft", "Google", "Adobe"],
            "link": "https://www.geeksforgeeks.org/detect-loop-in-a-linked-list/",
            "platform": "GeeksforGeeks"
        },
        {
            "id": 27,
            "title": "K Closest Points to Origin",
            "description": "Given an array of points where points[i] = [xi, yi] represents a point on the X-Y plane and an integer k, return the k closest points to the origin (0, 0).",
            "difficulty": "Medium",
            "topics": ["Array", "Math", "Divide and Conquer", "Heap", "Sorting"],
            "companies": ["Amazon", "Facebook", "Google", "Microsoft"],
            "link": "https://leetcode.com/problems/k-closest-points-to-origin/",
            "platform": "LeetCode"
        },
        {
            "id": 28,
            "title": "Letter Combinations of a Phone Number",
            "description": "Given a string containing digits from 2-9 inclusive, return all possible letter combinations that the number could represent.",
            "difficulty": "Medium",
            "topics": ["Hash Table", "String", "Backtracking"],
            "companies": ["Amazon", "Google", "Facebook", "Microsoft"],
            "link": "https://leetcode.com/problems/letter-combinations-of-a-phone-number/",
            "platform": "LeetCode"
        },
        {
            "id": 29,
            "title": "Minimum Window Substring",
            "description": "Given two strings s and t, return the minimum window in s which will contain all the characters in t.",
            "difficulty": "Hard",
            "topics": ["Hash Table", "String", "Sliding Window"],
            "companies": ["Amazon", "Google", "Facebook", "Microsoft"],
            "link": "https://leetcode.com/problems/minimum-window-substring/",
            "platform": "LeetCode"
        },
        {
            "id": 30,
            "title": "Meeting Rooms II",
            "description": "Given an array of meeting time intervals, find the minimum number of conference rooms required.",
            "difficulty": "Medium",
            "topics": ["Sorting", "Greedy", "Heap"],
            "companies": ["Amazon", "Google", "Facebook", "Microsoft", "Uber"],
            "link": "https://leetcode.com/problems/meeting-rooms-ii/",
            "platform": "LeetCode Premium"
        }
    ]
