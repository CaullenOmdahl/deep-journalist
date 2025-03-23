import logging
import sys
from loguru import logger

def get_logger(name: str) -> logger:
    """Get a configured logger instance.
    
    Args:
        name: Name of the logger (usually __name__)
        
    Returns:
        Configured logger instance
    """
    # Remove default logger
    logger.remove()
    
    # Add custom format with timestamp, level, and module name
    format_string = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )
    
    # Add console handler with custom format
    logger.add(
        sys.stderr,
        format=format_string,
        level="INFO",
        enqueue=True,
        backtrace=True,
        diagnose=True,
    )
    
    # Add file handler for errors
    logger.add(
        "logs/error.log",
        format=format_string,
        level="ERROR",
        rotation="1 day",
        retention="7 days",
        enqueue=True,
        backtrace=True,
        diagnose=True,
    )
    
    return logger.bind(name=name) 