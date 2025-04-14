import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Base configuration"""
    # App settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-replace-in-production')
    DEBUG = False
    TESTING = False
    
    # LLM API settings
    LLM_PROVIDER = os.environ.get('LLM_PROVIDER', 'openai')
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
    ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
    
    # Document processing settings
    MAX_CHUNK_SIZE = 1000
    OVERLAP_SIZE = 200
    BATCH_SIZE = 10
    
    # File paths
    BASE_DIR = Path("./studybuddy_data")
    CACHE_DIR = BASE_DIR / "cache"
    DOCS_DIR = BASE_DIR / "documents"
    NOTES_DIR = BASE_DIR / "notes"
    FLASHCARDS_DIR = BASE_DIR / "flashcards"
    TESTS_DIR = BASE_DIR / "tests"
    PROGRESS_DIR = BASE_DIR / "progress"
    ROADMAPS_DIR = BASE_DIR / "roadmaps"
    
    # Allowed file extensions
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt', 'md'}
    
    # Upload settings
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    

class ProductionConfig(Config):
    """Production configuration"""
    # Production-specific settings
    pass


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True


# Dictionary mapping environment names to config classes
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig
}

# Determine which config to use
def get_config():
    env = os.environ.get('FLASK_ENV', 'development')
    return config_by_name.get(env, DevelopmentConfig)
