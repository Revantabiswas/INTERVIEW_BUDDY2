import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
VECTOR_STORE_DIR = BASE_DIR / "storage" / "vectorstores"
CACHE_DIR = BASE_DIR / "storage" / "cache"
DOCS_DIR = BASE_DIR / "storage" / "documents"

# Create directories if they don't exist
for dir_path in [UPLOAD_DIR, VECTOR_STORE_DIR, CACHE_DIR, DOCS_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# API Configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# Model Configuration
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-3.5-turbo")
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "2000"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.7"))

# Document Processing
MAX_CHUNK_SIZE = 1000
OVERLAP_SIZE = 200
BATCH_SIZE = 10

# Supported file types
SUPPORTED_FILE_TYPES = {".pdf", ".docx", ".txt"} 