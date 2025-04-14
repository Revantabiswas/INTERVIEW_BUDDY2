import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import uvicorn
import importlib

# Setup logging to debug errors
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Import routers - Only import what's available
from routers import documents, chat  # Always include these basic ones

# Try to import optional routers
optional_routers = {}
for router_name in ["notes", "flashcards", "mindmaps", "roadmaps", "tests", "dsa", "progress"]:
    try:
        router_module = importlib.import_module(f"routers.{router_name}")
        if hasattr(router_module, "router"):
            optional_routers[router_name] = router_module.router
    except (ImportError, AttributeError):
        print(f"Router '{router_name}' not found or doesn't have a router attribute")

# Ensure storage directories exist
storage_dirs = [
    "./storage",
    "./storage/cache",
    "./storage/documents",
    "./storage/vectorstores",
    "./storage/notes",
    "./storage/flashcards",
    "./storage/tests",
    "./storage/mindmaps",
    "./storage/roadmaps",
]

for dir_path in storage_dirs:
    Path(dir_path).mkdir(parents=True, exist_ok=True)
    logger.info(f"Ensured directory exists: {dir_path}")

from utils import create_empty_routers

# Create empty routers for endpoints that aren't implemented yet
create_empty_routers()

app = FastAPI(
    title="InterviewBuddy API",
    description="API for Interview Preparation and Study Assistant",
    version="1.0.0"
)

# Configure CORS - update to allow both localhost:3000 (frontend) and localhost:8000 (API docs)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include basic routers
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

# Include optional routers that were successfully imported
router_prefixes = {
    "notes": ("/api/notes", "Study Notes"),
    "flashcards": ("/api/flashcards", "Flashcards"),
    "mindmaps": ("/api/mindmaps", "Mind Maps"),
    "roadmaps": ("/api/roadmaps", "Study Roadmaps"),
    "tests": ("/api/tests", "Practice Tests"),
    "dsa": ("/api/dsa", "DSA Interview Prep"),
    "progress": ("/api/progress", "Progress Tracking"),
}

for name, router in optional_routers.items():
    prefix, tag = router_prefixes.get(name, (f"/api/{name}", name.capitalize()))
    app.include_router(router, prefix=prefix, tags=[tag])

@app.get("/")
def root():
    """Root endpoint - useful for checking if the API is running"""
    return {"message": "API is running. Go to /docs for API documentation."}

@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "API is running"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)