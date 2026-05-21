from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import initialize_database
from routes import auth, chat, projects, tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup event: Create database tables on first run.
    """
    initialize_database()
    yield


# Create FastAPI app
app = FastAPI(
    title="TaskMind AI",
    description="Just talk. We manage.",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware - Allow all origins for prototype
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with prefixes
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])


@app.get("/")
def root():
    """
    Root endpoint - Health check for TaskMind AI backend.
    """
    return {
        "message": "TaskMind AI Backend",
        "status": "running"
    }


@app.get("/health")
def health_check():
    """
    Health check endpoint to verify TaskMind AI is running.
    """
    return {
        "status": "ok",
        "message": "TaskMind AI is running",
        "timestamp": datetime.utcnow().isoformat(),
    }
