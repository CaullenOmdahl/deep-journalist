"""
Logging configuration for Deep-Journalist.
"""
import sys
from pathlib import Path
from typing import Optional

from loguru import logger

from app.core.config.settings import get_settings

settings = get_settings()

def setup_logging(log_file: Optional[str] = None) -> None:
    """Configure application logging.
    
    Args:
        log_file: Optional path to log file. If not provided, uses the path from settings.
    """
    # Remove default logger
    logger.remove()
    
    # Ensure log directory exists
    log_path = Path(log_file or settings.log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Configure console logging
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=settings.log_level,
        backtrace=True,
        diagnose=True,
    )
    
    # Configure file logging
    logger.add(
        log_path,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level=settings.log_level,
        rotation="1 day",
        retention="30 days",
        compression="zip",
        backtrace=True,
        diagnose=True,
    )

def get_logger(name: str):
    """Get a logger instance with the given name."""
    return logger.bind(name=name) 