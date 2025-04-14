import os
import time
import uuid
import json
from datetime import datetime
from pathlib import Path
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS, cross_origin
from werkzeug.utils import secure_filename
import logging
from dotenv import load_dotenv
import traceback

# Import from our modules
from agents import (
    get_llm, create_study_tutor_agent, create_note_taker_agent, 
    create_assessment_expert_agent, create_flashcard_specialist_agent,
    create_visual_learning_expert_agent, create_learning_coach_agent, 
    create_roadmap_planner_agent, create_explanation_task, create_notes_generation_task,
    create_test_generation_task, create_flashcard_generation_task, create_mind_map_task,
    create_progress_analysis_task, create_roadmap_generation_task,
    create_quick_roadmap_generation_task, run_agent_task,
    # DSA-specific agent imports
    create_question_fetching_agent, create_filtering_agent, create_progress_tracking_agent,
    create_personalization_agent, create_debugging_agent, create_dsa_recommendation_agent,
    create_coding_pattern_agent, create_interview_strategy_agent, create_company_specific_agent,
    # DSA-specific task imports
    create_question_fetching_task, create_filtering_task, create_progress_tracking_task,
    create_personalization_task, create_debugging_task, create_dsa_recommendation_task,
    create_pattern_identification_task, create_company_preparation_task, create_mock_interview_task
)

from utils import (
    process_document, create_vector_store, get_document_context,
    generate_mind_map_data, parse_flashcards_from_text, parse_test_from_text,
    parse_roadmap_from_text, MAX_CHUNK_SIZE, OVERLAP_SIZE, BATCH_SIZE, 
    get_sample_dsa_questions, calculate_dsa_progress_metrics, parse_code_analysis
)

# Load environment variables
load_dotenv()

# Initialize Flask app with enhanced configuration
app = Flask(__name__, static_folder='../frontend/build')
app.config.update(
    MAX_CONTENT_LENGTH=50 * 1024 * 1024,  # Limit upload size to 50MB
    SECRET_KEY=os.environ.get('SECRET_KEY', 'dev_key_replace_in_production'),
    JSON_SORT_KEYS=False,  # Preserve order in JSON responses
    CORS_HEADERS='Content-Type'
)

# Set up better logging
logging.basicConfig(
    level=logging.INFO, # Ensure level is INFO or DEBUG to see the request logs
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
# Initialize logger *before* using it
logger = logging.getLogger(__name__) 

# Setup CORS with more specific configuration
# Default to allowing localhost:3000 (typical Next.js dev) if not specified
default_frontend_url = "http://localhost:3000"
cors_origins_str = os.environ.get('CORS_ORIGINS', default_frontend_url)
cors_origins_list = [origin.strip() for origin in cors_origins_str.split(',')]

logger.info(f"Configuring CORS for origins: {cors_origins_list}")

CORS(app, 
     resources={ r"/api/*": { "origins": cors_origins_list } }, 
     supports_credentials=True, 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"]
)

# Add a before_request handler to log incoming requests
@app.before_request
def log_request_info():
    # Avoid logging static file requests if they become too noisy
    # You might want to refine this check based on your static file paths
    if request.path.startswith('/api'): 
        # Use INFO level for request logs now that basicConfig is set to INFO
        logger.info(f"Incoming Request: {request.method} {request.path}")
        # Log key headers for debugging, especially Origin for CORS
        logger.info(f"  Origin: {request.headers.get('Origin')}")
        logger.info(f"  Host: {request.headers.get('Host')}")
        logger.info(f"  Content-Type: {request.headers.get('Content-Type')}")
        # logger.debug(f"  Headers: {request.headers}") # Use debug if you want full headers and set basicConfig level to DEBUG

# Define directory paths
# Place BASE_DIR one level up from the current file's directory (app.py)
# This assumes app.py is directly inside the 'backend' folder.
APP_DIR = Path(__file__).parent 
BASE_DIR = APP_DIR.parent / "studybuddy_data" # e.g., interview-buddy/studybuddy_data/
CACHE_DIR = BASE_DIR / "cache"
DOCS_DIR = BASE_DIR / "documents"
NOTES_DIR = BASE_DIR / "notes"
FLASHCARDS_DIR = BASE_DIR / "flashcards"
TESTS_DIR = BASE_DIR / "tests"
PROGRESS_DIR = BASE_DIR / "progress"
ROADMAPS_DIR = BASE_DIR / "roadmaps"

# Create directories if they don't exist
for directory in [BASE_DIR, CACHE_DIR, DOCS_DIR, NOTES_DIR, FLASHCARDS_DIR, TESTS_DIR, PROGRESS_DIR, ROADMAPS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Update UPLOAD_FOLDER config to use the new path
app.config.update(
    UPLOAD_FOLDER=str(DOCS_DIR)  # Explicitly set UPLOAD_FOLDER to the new DOCS_DIR path
)
logger.info(f"Data directory set to: {BASE_DIR}")
logger.info(f"Upload folder set to: {app.config['UPLOAD_FOLDER']}")

# Global data store (in a real app, you would use a database)
documents = {}
vectorstores = {}
chat_histories = {}
study_notes = {}
flashcards = {}
tests = {}
mind_maps = {}
progress_data = {}
roadmaps = {}
dsa_questions = {}
dsa_progress = {"questions": []}
user_code_solutions = {}
solved_questions = set()
dsa_practice_history = []
personalized_questions = {}
favorite_questions = set()
current_study_plans = {}
code_analysis_results = {}

# --- Basic Health Check ---
@app.route('/api/health', methods=['GET'])
def health_check():
    """Basic health check endpoint"""
    logger.info("Health check endpoint accessed.")
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})

# Serve static files from React frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# Error handling
@app.errorhandler(400)
def bad_request(e):
    return jsonify({"error": "Bad request", "message": str(e)}), 400

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found", "message": str(e)}), 404

@app.errorhandler(500)
def server_error(e):
    logger.error(f"Server error: {str(e)}")
    return jsonify({"error": "Internal server error", "message": "An unexpected error occurred"}), 500

# API Endpoints for Document Management
@app.route('/api/documents', methods=['GET'])
def get_documents():
    """Get list of all documents"""
    return jsonify(list(documents.values()))

@app.route('/api/documents/upload', methods=['POST'])
def upload_document():
    """Upload and process a document"""
    if 'file' not in request.files:
        logger.warning("Upload attempt failed: No file part in request.")
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        logger.warning("Upload attempt failed: No selected file.")
        return jsonify({"error": "No selected file"}), 400
    
    if file:
        filename = secure_filename(file.filename)
        if not filename:
             logger.warning(f"Upload attempt failed: Invalid filename after securing: {file.filename}")
             return jsonify({"error": "Invalid filename"}), 400

        temp_path = CACHE_DIR / filename
        doc_info = None

        try:
            # Save the uploaded file
            file.save(str(temp_path))
            logger.info(f"File '{filename}' saved temporarily to: {temp_path}")

            # Check if file exists before processing
            if not temp_path.exists():
                 logger.error(f"Temporary file '{temp_path}' does not exist after saving.")
                 return jsonify({"error": "Failed to save file for processing"}), 500

            logger.info(f"Attempting to process document: {temp_path}")
            try:
                # Process document using the utility function
                doc_info = process_document(str(temp_path), CACHE_DIR)
                if doc_info:
                    logger.info(f"Successfully processed document: {filename}")
                else:
                    logger.error(f"Document processing returned None for file: {filename}")
                    return jsonify({"error": "Failed to extract document content"}), 500

            except Exception as processing_error:
                logger.error(f"Error occurred *during* process_document for '{filename}': {str(processing_error)}")
                logger.error(traceback.format_exc())
                return jsonify({"error": f"Failed during processing: {str(processing_error)}"}), 500

            doc_key = doc_info.get('filename', filename)
            documents[doc_key] = doc_info
            logger.info(f"Document info stored for key: {doc_key}")

            # Create vector store
            try:
                vectorstores[doc_key] = create_vector_store(doc_info, CACHE_DIR)
                logger.info(f"Vector store created for key: {doc_key}")
            except Exception as vector_err:
                logger.error(f"Error creating vector store for {doc_key}: {str(vector_err)}")
                logger.error(traceback.format_exc())
                return jsonify({"error": f"Processed document but failed to create vector store: {str(vector_err)}"}), 500

            return jsonify({
                "success": True,
                "message": f"Processed {doc_key} ({doc_info.get('pages', '?')} pages)",
                "document": doc_info
            })

        except Exception as outer_e:
            logger.error(f"Outer error handling upload for '{filename}': {str(outer_e)}")
            logger.error(traceback.format_exc())
            if temp_path.exists():
                try:
                    temp_path.unlink()
                    logger.info(f"Cleaned up temporary file {temp_path} after outer error.")
                except OSError as e:
                    logger.error(f"Error removing temporary file {temp_path} after outer error: {e}")
            return jsonify({"error": f"Server error during file upload: {str(outer_e)}"}), 500

    return jsonify({"error": "Invalid file object"}), 400

@app.route('/api/documents/<filename>', methods=['GET'])
def get_document(filename):
    """Get a specific document by filename"""
    doc = documents.get(filename)
    if doc:
        return jsonify(doc)
    return jsonify({"error": "Document not found"}), 404

@app.route('/api/documents/<filename>', methods=['DELETE'])
def delete_document(filename):
    """Delete a specific document and its associated data"""
    logger.info(f"Attempting to delete document: {filename}")
    if filename in documents:
        try:
            del documents[filename]
            logger.info(f"Removed '{filename}' from documents dictionary.")

            if filename in vectorstores:
                del vectorstores[filename]
                logger.info(f"Removed vector store for '{filename}'.")

            if filename in chat_histories:
                del chat_histories[filename]
                logger.info(f"Removed chat history for '{filename}'.")

            items_to_delete = {}
            for store_name, store in [("notes", study_notes), ("flashcards", flashcards),
                                      ("tests", tests), ("mind_maps", mind_maps),
                                      ("roadmaps", roadmaps)]:
                items_to_delete[store_name] = [k for k, v in store.items() if v.get("document") == filename]

            for store_name, keys in items_to_delete.items():
                store = globals()[store_name]
                for key in keys:
                    if key in store:
                        del store[key]
                        logger.info(f"Deleted {store_name[:-1]} '{key}' associated with '{filename}'.")

            return jsonify({"success": True, "message": f"Document '{filename}' and associated data deleted."})
        except Exception as e:
            logger.error(f"Error during deletion of '{filename}': {str(e)}")
            return jsonify({"error": "Failed to completely delete document and associated data", "details": str(e)}), 500
    else:
        logger.warning(f"Attempted to delete non-existent document: {filename}")
        return jsonify({"error": "Document not found"}), 404

# API Endpoints for Chat with Document
@app.route('/api/chat', methods=['POST'])
def chat_with_document():
    """Ask a question about a document"""
    data = request.json
    if not data or 'question' not in data or 'filename' not in data:
        return jsonify({"error": "Missing question or filename"}), 400
    
    question = data['question']
    filename = data['filename']
    
    if filename not in documents:
        return jsonify({"error": "Document not found"}), 404
    
    try:
        context = get_document_context(question, vectorstores[filename])
        tutor = create_study_tutor_agent()
        explanation_task = create_explanation_task(tutor, question, context)
        result = run_agent_task(tutor, explanation_task)
        
        if filename not in chat_histories:
            chat_histories[filename] = []
        chat_histories[filename].append({
            "role": "user", 
            "content": question,
            "timestamp": datetime.now().isoformat()
        })
        chat_histories[filename].append({
            "role": "assistant", 
            "content": result,
            "timestamp": datetime.now().isoformat()
        })
        
        return jsonify({
            "answer": result,
            "history": chat_histories.get(filename, [])
        })
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/history/<filename>', methods=['GET'])
def get_chat_history(filename):
    """Get chat history for a document"""
    return jsonify(chat_histories.get(filename, []))

# API Endpoints for Study Notes
@app.route('/api/notes', methods=['POST'])
def generate_notes():
    """Generate study notes for a topic"""
    data = request.json
    if not data or 'filename' not in data:
        return jsonify({"error": "Missing filename"}), 400
    
    filename = data['filename']
    topic = data.get('topic', '')
    
    if filename not in documents:
        return jsonify({"error": "Document not found"}), 404
    
    try:
        if topic:
            context = get_document_context(topic, vectorstores[filename], top_k=10)
            notes_topic = topic
        else:
            doc_info = documents[filename]
            full_text = "\n\n".join(doc_info['text_by_page'])
            context = full_text[:10000] + "..." if len(full_text) > 10000 else full_text
            notes_topic = f"Complete summary of {filename}"
        
        note_taker = create_note_taker_agent()
        notes_task = create_notes_generation_task(note_taker, notes_topic, context)
        notes = run_agent_task(note_taker, notes_task)
        note_id = str(uuid.uuid4())[:8]
        
        study_notes[note_id] = {
            "topic": notes_topic,
            "content": notes,
            "created_at": datetime.now().isoformat(),
            "document": filename
        }
        
        return jsonify({
            "note_id": note_id,
            "notes": study_notes[note_id]
        })
    except Exception as e:
        logger.error(f"Error generating notes: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/notes', methods=['GET'])
def get_notes():
    """Get all study notes"""
    return jsonify(study_notes)

@app.route('/api/notes/<note_id>', methods=['GET'])
def get_note(note_id):
    """Get a specific note"""
    if note_id in study_notes:
        return jsonify(study_notes[note_id])
    return jsonify({"error": "Note not found"}), 404

@app.route('/api/notes/<note_id>', methods=['DELETE'])
def delete_note(note_id):
    """Delete a note"""
    if note_id in study_notes:
        del study_notes[note_id]
        return jsonify({"success": True})
    return jsonify({"error": "Note not found"}), 404

# API Endpoints for Flashcards
@app.route('/api/flashcards', methods=['POST'])
def generate_flashcards():
    """Generate flashcards for a topic"""
    data = request.json
    if not data or 'filename' not in data or 'topic' not in data:
        return jsonify({"error": "Missing filename or topic"}), 400
    
    filename = data['filename']
    topic = data['topic']
    num_cards = data.get('num_cards', 10)
    
    if filename not in documents:
        return jsonify({"error": "Document not found"}), 404
    
    try:
        context = get_document_context(topic, vectorstores[filename], top_k=10)
        flashcard_specialist = create_flashcard_specialist_agent()
        flashcard_task = create_flashcard_generation_task(flashcard_specialist, topic, context)
        flashcards_text = run_agent_task(flashcard_specialist, flashcard_task)
        cards = parse_flashcards_from_text(flashcards_text)
        
        if cards:
            deck_id = str(uuid.uuid4())[:8]
            flashcards[deck_id] = {
                "topic": topic,
                "cards": cards,
                "created_at": datetime.now().isoformat(),
                "document": filename
            }
            return jsonify({
                "deck_id": deck_id,
                "flashcards": flashcards[deck_id]
            })
        else:
            return jsonify({"error": "Failed to generate flashcards"}), 500
    except Exception as e:
        logger.error(f"Error generating flashcards: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/flashcards', methods=['GET'])
def get_flashcards():
    """Get all flashcard decks"""
    return jsonify(flashcards)

@app.route('/api/flashcards/<deck_id>', methods=['GET'])
def get_flashcard_deck(deck_id):
    """Get a specific flashcard deck"""
    if deck_id in flashcards:
        return jsonify(flashcards[deck_id])
    return jsonify({"error": "Flashcard deck not found"}), 404

@app.route('/api/flashcards/<deck_id>', methods=['DELETE'])
def delete_flashcard_deck(deck_id):
    """Delete a flashcard deck"""
    if deck_id in flashcards:
        del flashcards[deck_id]
        return jsonify({"success": True})
    return jsonify({"error": "Flashcard deck not found"}), 404

# API Endpoints for Mind Maps
@app.route('/api/mindmaps', methods=['POST'])
def generate_mind_map():
    """Generate a mind map for a topic"""
    data = request.json
    if not data or 'filename' not in data or 'topic' not in data:
        return jsonify({"error": "Missing filename or topic"}), 400
    
    filename = data['filename']
    topic = data['topic']
    
    if filename not in documents:
        return jsonify({"error": "Document not found"}), 404
    
    try:
        context = get_document_context(topic, vectorstores[filename], top_k=10)
        visual_expert = create_visual_learning_expert_agent()
        mind_map_task = create_mind_map_task(visual_expert, topic, context)
        mind_map_text = run_agent_task(visual_expert, mind_map_task)
        graph_data = generate_mind_map_data(mind_map_text)
        
        map_id = str(uuid.uuid4())[:8]
        mind_maps[map_id] = {
            "topic": topic,
            "description": mind_map_text,
            "graph_data": graph_data,
            "created_at": datetime.now().isoformat(),
            "document": filename
        }
        
        return jsonify({
            "map_id": map_id,
            "mind_map": mind_maps[map_id]
        })
    except Exception as e:
        logger.error(f"Error generating mind map: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/mindmaps', methods=['GET'])
def get_mind_maps():
    """Get all mind maps"""
    return jsonify(mind_maps)

@app.route('/api/mindmaps/<map_id>', methods=['GET'])
def get_mind_map(map_id):
    """Get a specific mind map"""
    if map_id in mind_maps:
        return jsonify(mind_maps[map_id])
    return jsonify({"error": "Mind map not found"}), 404

@app.route('/api/mindmaps/<map_id>', methods=['DELETE'])
def delete_mind_map(map_id):
    """Delete a mind map"""
    if map_id in mind_maps:
        del mind_maps[map_id]
        return jsonify({"success": True})
    return jsonify({"error": "Mind map not found"}), 404

# API Endpoints for Tests
@app.route('/api/tests', methods=['POST'])
def generate_test():
    """Generate a test for a topic"""
    data = request.json
    if not data or 'filename' not in data or 'topic' not in data:
        return jsonify({"error": "Missing filename or topic"}), 400
    
    filename = data['filename']
    topic = data['topic']
    difficulty = data.get('difficulty', 'Medium')
    
    if filename not in documents:
        return jsonify({"error": "Document not found"}), 404
    
    try:
        context = get_document_context(topic, vectorstores[filename], top_k=10)
        assessment_expert = create_assessment_expert_agent()
        test_task = create_test_generation_task(assessment_expert, topic, difficulty, context)
        test_content_str = run_agent_task(assessment_expert, test_task)
        test_data = parse_test_from_text(test_content_str)
        
        test_id = str(uuid.uuid4())[:8]
        tests[test_id] = {
            "topic": topic,
            "difficulty": difficulty,
            "content": test_content_str,
            "questions": test_data["questions"],
            "answer_key": test_data["answer_key"],
            "created_at": datetime.now().isoformat(),
            "document": filename
        }
        
        return jsonify({
            "test_id": test_id,
            "test": tests[test_id]
        })
    except Exception as e:
        logger.error(f"Error generating test: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/tests', methods=['GET'])
def get_tests():
    """Get all tests"""
    return jsonify(tests)

@app.route('/api/tests/<test_id>', methods=['GET'])
def get_test(test_id):
    """Get a specific test"""
    if test_id in tests:
        return jsonify(tests[test_id])
    return jsonify({"error": "Test not found"}), 404

@app.route('/api/tests/<test_id>', methods=['DELETE'])
def delete_test(test_id):
    """Delete a test"""
    if test_id in tests:
        del tests[test_id]
        return jsonify({"success": True})
    return jsonify({"error": "Test not found"}), 404

# API Endpoints for Roadmaps
@app.route('/api/roadmaps', methods=['POST'])
def generate_roadmap():
    """Generate a study roadmap"""
    data = request.json
    if not data or 'filename' not in data:
        return jsonify({"error": "Missing filename"}), 400
    
    filename = data['filename']
    days_available = data.get('days_available', 14)
    hours_per_day = data.get('hours_per_day', 2)
    focus_areas = data.get('focus_areas', '')
    learning_style = data.get('learning_style', 'Mixed')
    prior_knowledge = data.get('prior_knowledge', 'Beginner')
    quick_roadmap = data.get('quick_roadmap', False)
    
    if filename not in documents:
        return jsonify({"error": "Document not found"}), 404
    
    try:
        doc_info = documents[filename]
        full_text = "\n\n".join(doc_info['text_by_page'])
        first_pages = "\n\n".join(doc_info['text_by_page'][:3])
        
        sampled_pages = []
        if len(doc_info['text_by_page']) > 5:
            import random
            sample_indices = random.sample(range(3, len(doc_info['text_by_page'])), min(5, len(doc_info['text_by_page'])-3))
            sampled_pages = [doc_info['text_by_page'][i] for i in sample_indices]
        
        context = f"Document Title: {filename}\n"
        context += f"Total Pages: {doc_info['pages']}\n\n"
        context += f"DOCUMENT BEGINNING:\n{first_pages}\n\n"
        
        if sampled_pages:
            context += f"SAMPLE SECTIONS FROM DOCUMENT:\n" + "\n---\n".join(sampled_pages)
        
        context += f"\n\nSTUDY PREFERENCES:\n"
        context += f"Days Available: {days_available}\n"
        context += f"Hours Per Day: {hours_per_day}\n"
        
        if focus_areas:
            context += f"Focus Areas: {focus_areas}\n"
        
        context += f"Learning Style: {learning_style}\n"
        context += f"Prior Knowledge: {prior_knowledge}\n"
        
        roadmap_planner = create_roadmap_planner_agent()
        
        if quick_roadmap:
            roadmap_task = create_quick_roadmap_generation_task(
                roadmap_planner,
                filename,
                days_available,
                hours_per_day,
                context
            )
        else:
            roadmap_task = create_roadmap_generation_task(
                roadmap_planner,
                filename,
                days_available,
                hours_per_day,
                context
            )
        
        roadmap_text = run_agent_task(roadmap_planner, roadmap_task)
        roadmap_data = parse_roadmap_from_text(roadmap_text)
        
        roadmap_id = str(uuid.uuid4())[:8]
        roadmaps[roadmap_id] = {
            "document": filename,
            "days_available": days_available,
            "hours_per_day": hours_per_day,
            "focus_areas": focus_areas if focus_areas else "General study",
            "learning_style": learning_style,
            "prior_knowledge": prior_knowledge,
            "roadmap_text": roadmap_text,
            "roadmap_data": roadmap_data,
            "created_at": datetime.now().isoformat()
        }
        
        return jsonify({
            "roadmap_id": roadmap_id,
            "roadmap": roadmaps[roadmap_id]
        })
    except Exception as e:
        logger.error(f"Error generating roadmap: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/roadmaps', methods=['GET'])
def get_roadmaps():
    """Get all roadmaps"""
    return jsonify(roadmaps)

@app.route('/api/roadmaps/<roadmap_id>', methods=['GET'])
def get_roadmap(roadmap_id):
    """Get a specific roadmap"""
    if roadmap_id in roadmaps:
        return jsonify(roadmaps[roadmap_id])
    return jsonify({"error": "Roadmap not found"}), 404

@app.route('/api/roadmaps/<roadmap_id>', methods=['DELETE'])
def delete_roadmap(roadmap_id):
    """Delete a roadmap"""
    if roadmap_id in roadmaps:
        del roadmaps[roadmap_id]
        return jsonify({"success": True})
    return jsonify({"error": "Roadmap not found"}), 404

# API Endpoints for DSA Interview Preparation
@app.route('/api/dsa/questions', methods=['GET'])
def get_dsa_questions():
    """Get DSA practice questions with optional filtering"""
    difficulty = request.args.get('difficulty', 'All')
    topics = request.args.getlist('topics')
    companies = request.args.getlist('companies')
    platforms = request.args.getlist('platforms')
    
    try:
        if not dsa_questions:
            questions = get_sample_dsa_questions()
            for q in questions:
                dsa_questions[q["id"]] = q
        
        result_questions = list(dsa_questions.values())
        
        if difficulty != "All":
            result_questions = [q for q in result_questions if q["difficulty"] == difficulty]
        
        if topics:
            result_questions = [q for q in result_questions if any(topic in q["topics"] for topic in topics)]
        
        if companies:
            result_questions = [q for q in result_questions if any(company in q["companies"] for company in companies)]
        
        if platforms:
            result_questions = [q for q in result_questions if q.get("platform", "LeetCode") in platforms]
        
        for q in result_questions:
            q["solved"] = q["id"] in solved_questions
            q["favorite"] = q["id"] in favorite_questions
        
        return jsonify(result_questions)
    except Exception as e:
        logger.error(f"Error getting DSA questions: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/dsa/questions/<question_id>/solve', methods=['POST'])
def solve_dsa_question(question_id):
    """Mark a DSA question as solved"""
    if question_id not in dsa_questions:
        return jsonify({"error": "Question not found"}), 404
    
    solved_questions.add(question_id)
    
    q = dsa_questions[question_id]
    dsa_practice_history.append({
        "id": question_id,
        "title": q["title"],
        "difficulty": q["difficulty"],
        "date_solved": datetime.now().isoformat(),
        "topics": q["topics"]
    })
    
    return jsonify({"success": True, "solved": True})

@app.route('/api/dsa/questions/<question_id>/unsolved', methods=['POST'])
def unsolve_dsa_question(question_id):
    """Mark a DSA question as unsolved"""
    if question_id in solved_questions:
        solved_questions.remove(question_id)
    
    return jsonify({"success": True, "solved": False})

@app.route('/api/dsa/questions/<question_id>/favorite', methods=['POST'])
def favorite_dsa_question(question_id):
    """Add a DSA question to favorites"""
    if question_id not in dsa_questions:
        return jsonify({"error": "Question not found"}), 404
    
    favorite_questions.add(question_id)
    return jsonify({"success": True, "favorite": True})

@app.route('/api/dsa/questions/<question_id>/unfavorite', methods=['POST'])
def unfavorite_dsa_question(question_id):
    """Remove a DSA question from favorites"""
    if question_id in favorite_questions:
        favorite_questions.remove(question_id)
    
    return jsonify({"success": True, "favorite": False})

@app.route('/api/dsa/code/analyze', methods=['POST'])
def analyze_code():
    """Analyze DSA solution code"""
    data = request.json
    if not data or 'code' not in data or 'language' not in data or 'problem_id' not in data:
        return jsonify({"error": "Missing code, language or problem_id"}), 400
    
    code = data['code']
    language = data['language']
    problem_id = data['problem_id']
    
    if problem_id not in dsa_questions:
        return jsonify({"error": "Problem not found"}), 404
    
    problem = dsa_questions[problem_id]
    
    try:
        debugging_agent = create_debugging_agent()
        debugging_task = create_debugging_task(
            debugging_agent,
            code,
            problem["description"],
            language
        )
        
        analysis_result = run_agent_task(debugging_agent, debugging_task)
        analysis = parse_code_analysis(analysis_result)
        
        solution_key = f"{problem_id}_{language}"
        user_code_solutions[solution_key] = code
        code_analysis_results[solution_key] = analysis
        
        return jsonify({
            "analysis": analysis,
            "solution_key": solution_key
        })
    except Exception as e:
        logger.error(f"Error analyzing code: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/dsa/personalized-plan', methods=['POST'])
def create_personalized_plan():
    """Generate a personalized DSA interview preparation plan"""
    data = request.json
    if not data:
        return jsonify({"error": "Missing request data"}), 400
    
    target_company = data.get('target_company', 'Any')
    target_role = data.get('target_role', 'Software Engineer')
    experience_level = data.get('experience_level', '1-3 years')
    timeline = data.get('timeline', '1 month')
    target_salary = data.get('target_salary', 'Mid Level ($120k-$180k)')
    
    try:
        user_goals = {
            "target_company": target_company if target_company != "Any" else "Not specified",
            "target_role": target_role,
            "target_salary": target_salary,
            "timeline": timeline
        }
        
        if target_company != "Any":
            company_agent = create_company_specific_agent()
            company_task = create_company_preparation_task(
                company_agent,
                target_company,
                user_experience=experience_level,
                available_time=timeline
            )
            plan_result = run_agent_task(company_agent, company_task)
        else:
            personalization_agent = create_personalization_agent()
            questions = list(dsa_questions.values()) if dsa_questions else get_sample_dsa_questions()
            personalization_task = create_personalization_task(
                personalization_agent,
                str(questions),
                user_goals
            )
            plan_result = run_agent_task(personalization_agent, personalization_task)
        
        plan_id = str(uuid.uuid4())[:8]
        current_study_plans[plan_id] = {
            "plan": plan_result,
            "created_at": datetime.now().isoformat(),
            "user_goals": user_goals
        }
        
        return jsonify({
            "plan_id": plan_id,
            "plan": current_study_plans[plan_id]
        })
    except Exception as e:
        logger.error(f"Error creating personalized plan: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/dsa/progress', methods=['GET'])
def get_dsa_progress():
    """Get DSA progress metrics"""
    try:
        completed_questions = [
            {
                "id": q_id,
                "title": dsa_questions[q_id]["title"] if q_id in dsa_questions else "Unknown",
                "difficulty": dsa_questions[q_id]["difficulty"] if q_id in dsa_questions else "Medium",
                "topics": dsa_questions[q_id]["topics"] if q_id in dsa_questions else [],
                "companies": dsa_questions[q_id]["companies"] if q_id in dsa_questions else [],
                "status": "completed",
                "attempts": 1
            } for q_id in solved_questions if q_id in dsa_questions
        ]
        
        metrics = calculate_dsa_progress_metrics({
            "questions": completed_questions
        })
        
        metrics["practice_history"] = sorted(
            dsa_practice_history,
            key=lambda x: x.get("date_solved", ""), 
            reverse=True
        )
        
        return jsonify(metrics)
    except Exception as e:
        logger.error(f"Error getting DSA progress: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/dsa/mock-interview', methods=['POST'])
def create_mock_interview():
    """Create a mock interview session"""
    data = request.json
    if not data:
        return jsonify({"error": "Missing request data"}), 400
    
    company = data.get('company', 'General')
    difficulty = data.get('difficulty', 'Medium')
    category = data.get('category', 'Any')
    
    try:
        filtered_problems = []
        for q in dsa_questions.values():
            matches_difficulty = q["difficulty"] == difficulty
            matches_category = category == "Any" or category in q["topics"]
            matches_company = company == "General" or company in q["companies"]
            if matches_difficulty and (matches_category or category == "Any"):
                filtered_problems.append(q)
        
        if not filtered_problems:
            filtered_problems = list(dsa_questions.values())
        
        import random
        selected_problem = random.choice(filtered_problems)
        
        interview_agent = create_interview_strategy_agent()
        mock_interview_task = create_mock_interview_task(
            interview_agent,
            selected_problem["description"],
            difficulty,
            company
        )
        
        interview_session = run_agent_task(interview_agent, mock_interview_task)
        
        return jsonify({
            "problem": selected_problem,
            "interview_session": interview_session,
            "company": company,
            "difficulty": difficulty
        })
    except Exception as e:
        logger.error(f"Error creating mock interview: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/dsa/pattern-hints', methods=['POST'])
def get_pattern_hints():
    """Get hints and patterns for solving a DSA problem"""
    data = request.json
    if not data or 'problem_id' not in data:
        return jsonify({"error": "Missing problem_id"}), 400
    
    problem_id = data['problem_id']
    
    if problem_id not in dsa_questions:
        return jsonify({"error": "Problem not found"}), 404
    
    problem = dsa_questions[problem_id]
    
    try:
        pattern_agent = create_coding_pattern_agent()
        
        similar_problems = []
        for q in dsa_questions.values():
            if q["id"] != problem_id and any(topic in q["topics"] for topic in problem["topics"]):
                similar_problems.append(q["title"])
        
        similar_problems = similar_problems[:3]
        
        pattern_task = create_pattern_identification_task(
            pattern_agent, 
            problem["description"], 
            ", ".join(similar_problems)
        )
        
        hints = run_agent_task(pattern_agent, pattern_task)
        
        return jsonify({
            "hints": hints,
            "similar_problems": similar_problems
        })
    except Exception as e:
        logger.error(f"Error getting pattern hints: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Main entry point
if __name__ == '__main__':
    app.run(debug=True, port=5000)