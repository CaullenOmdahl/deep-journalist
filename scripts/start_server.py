import os
import sys
import logging
import uvicorn
from typing import Optional

# Setup logging
logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO'),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def start_server(
    host: Optional[str] = None,
    port: Optional[int] = None,
    reload: bool = True
) -> None:
    """
    Start the FastAPI server.
    
    Args:
        host: Host to bind to (default: from env or 0.0.0.0)
        port: Port to bind to (default: from env or 8000)
        reload: Whether to enable auto-reload (default: True)
    """
    try:
        # Get configuration from environment or use defaults
        host = host or os.getenv('API_HOST', '0.0.0.0')
        port = port or int(os.getenv('API_PORT', '8000'))
        
        # Configure server
        config = {
            'app': 'app.api.main:app',
            'host': host,
            'port': port,
            'reload': reload,
            'log_level': os.getenv('LOG_LEVEL', 'info').lower(),
            'workers': 1  # Use 1 worker when reload=True
        }
        
        # Log startup message
        logger.info(f"Starting server on {host}:{port}")
        if reload:
            logger.info("Auto-reload enabled")
            
        # Start server
        uvicorn.run(**config)
        
    except Exception as e:
        logger.error(f"Error starting server: {str(e)}")
        sys.exit(1)

def main():
    """Main function to handle command line usage."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Start Deep-Journalist API server"
    )
    parser.add_argument(
        '--host',
        help='Host to bind to (default: from env or 0.0.0.0)'
    )
    parser.add_argument(
        '--port',
        type=int,
        help='Port to bind to (default: from env or 8000)'
    )
    parser.add_argument(
        '--no-reload',
        action='store_true',
        help='Disable auto-reload'
    )
    
    args = parser.parse_args()
    
    start_server(
        host=args.host,
        port=args.port,
        reload=not args.no_reload
    )

if __name__ == "__main__":
    main() 