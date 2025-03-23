"""
Health check endpoints.
"""
from fastapi import APIRouter

from app.utils.logging.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

@router.get("")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        dict: Health status
    """
    logger.debug("Health check requested")
    return {"status": "healthy"} 