"""
Main application module for Deep-Journalist.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.core.config.settings import get_settings
from app.utils.logging.logger import setup_logging
from app.utils.rate_limit import rate_limit_middleware

settings = get_settings()

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    # Initialize logging
    setup_logging()
    
    # Create FastAPI app
    app = FastAPI(
        title="Deep-Journalist API",
        description="AI-powered journalistic research assistant",
        version="1.0.0",
        docs_url="/api/docs" if settings.debug else None,
        redoc_url="/api/redoc" if settings.debug else None,
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # In production, replace with specific origins
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add rate limiting middleware
    app.middleware("http")(rate_limit_middleware)
    
    # Include API routes
    app.include_router(api_router, prefix="/api")
    
    return app

app = create_app() 