import os
import sys
import logging
from app import app
# Assuming config.py exists and has get_config()
try:
    from config import get_config 
except ImportError:
    print("WARNING: config.py not found or get_config not defined. Using default Flask config.")
    get_config = lambda: type('obj', (object,), {'DEBUG': True})() # Simple default config object

# Configure basic logging focused on console for startup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        # Keep file handler if desired for persistent logs
        # logging.FileHandler("error.log"), 
        logging.StreamHandler(sys.stdout) # Ensure output goes to console
    ]
)
logger = logging.getLogger(__name__)

# Check for required dependencies
try:
    import flask
    import numpy
    import pandas
    import flask_cors
    import werkzeug
    import dotenv
    import langchain_groq
    import crewai
    import fitz # PyMuPDF
    import langchain_community
    # Add other critical dependencies here
except ImportError as e:
    logger.error(f"Missing critical dependency: {str(e)}")
    logger.error("Please ensure all required packages are installed (e.g., pip install -r requirements.txt)")
    sys.exit(1)

if __name__ == '__main__':
    try:
        # Get configuration based on environment
        config = get_config()
        logger.info(f"Loaded configuration: {config.__class__.__name__}")
        
        # Apply configuration to app
        app.config.from_object(config)
        
        # Get port from environment or use default
        port = int(os.environ.get('PORT', 5000))
        host = os.environ.get('HOST', '0.0.0.0') # Allow host override
        
        debug_mode = app.config.get('DEBUG', False) # Default to False if not set
        
        logger.info(f"Starting Interview Buddy backend")
        logger.info(f" -> Environment: {os.environ.get('FLASK_ENV', 'development')}")
        logger.info(f" -> Debug mode: {'ON' if debug_mode else 'OFF'}")
        logger.info(f" -> Listening on: http://{host}:{port}")
        
        # Run the app using Flask's development server
        # For production, consider using a WSGI server like Gunicorn or Waitress
        app.run(
            host=host,
            port=port,
            debug=debug_mode 
        )
    except ImportError as e:
         if "config" in str(e):
              logger.error("Failed to import configuration. Please ensure config.py exists and is correct.")
         else:
              logger.error(f"An import error occurred: {str(e)}")
         sys.exit(1)
    except Exception as e:
        logger.error(f"FATAL ERROR starting server: {str(e)}", exc_info=True)
        # exc_info=True automatically includes traceback in logger
        sys.exit(1)
