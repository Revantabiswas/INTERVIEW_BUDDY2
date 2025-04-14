import os
import uuid
from pathlib import Path
from werkzeug.utils import secure_filename
from flask import current_app
import logging

logger = logging.getLogger(__name__)

def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def save_uploaded_file(file, directory):
    """Save an uploaded file to the specified directory with a secure name"""
    if file and allowed_file(file.filename):
        # Create a secure filename
        original_filename = secure_filename(file.filename)
        # Get extension
        ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
        # Create unique filename
        unique_filename = f"{uuid.uuid4().hex[:8]}_{original_filename}"
        
        # Ensure directory exists
        os.makedirs(directory, exist_ok=True)
        
        # Save file
        file_path = os.path.join(directory, unique_filename)
        file.save(file_path)
        
        logger.info(f"Saved uploaded file to {file_path}")
        return {
            "original_filename": original_filename,
            "saved_filename": unique_filename,
            "path": file_path,
            "extension": ext
        }
    else:
        logger.warning(f"Invalid file: {file.filename if file else 'None'}")
        return None

def get_file_metadata(file_path):
    """Get metadata for a file"""
    path = Path(file_path)
    return {
        "filename": path.name,
        "size_bytes": path.stat().st_size,
        "created_at": path.stat().st_ctime,
        "modified_at": path.stat().st_mtime,
        "extension": path.suffix.lower()[1:] if path.suffix else "",
        "path": str(path)
    }

def list_files(directory, extensions=None):
    """List files in a directory, optionally filtered by extensions"""
    files = []
    
    if not os.path.exists(directory):
        logger.warning(f"Directory does not exist: {directory}")
        return files
    
    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        if os.path.isfile(filepath):
            if extensions is None or any(filename.lower().endswith(f".{ext.lower()}") for ext in extensions):
                files.append(get_file_metadata(filepath))
    
    return files

def delete_file(file_path):
    """Delete a file if it exists"""
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            logger.info(f"Deleted file: {file_path}")
            return True
        except Exception as e:
            logger.error(f"Error deleting file {file_path}: {str(e)}")
            return False
    else:
        logger.warning(f"File does not exist: {file_path}")
        return False
