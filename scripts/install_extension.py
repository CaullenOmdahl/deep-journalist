import os
import sys
import shutil
import logging
import subprocess
from pathlib import Path
from typing import Optional

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def install_extension(target_dir: Optional[str] = None) -> str:
    """
    Download and install the bypass-paywalls-chrome-clean extension.
    
    Args:
        target_dir: Optional directory to install the extension to.
                   If not provided, installs to app/scrapers/extensions.
                   
    Returns:
        Path to the installed extension directory
    """
    try:
        # Determine target directory
        if not target_dir:
            target_dir = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                'app',
                'scrapers',
                'extensions'
            )
            
        target_dir = os.path.abspath(target_dir)
        extension_dir = os.path.join(target_dir, 'bypass-paywalls-chrome-clean')
        
        # Create directories if they don't exist
        os.makedirs(target_dir, exist_ok=True)
        
        # Clone the repository
        logger.info("Cloning bypass-paywalls-chrome-clean repository...")
        clone_cmd = [
            'git',
            'clone',
            'https://gitlab.com/magnolia1234/bypass-paywalls-chrome-clean.git',
            extension_dir
        ]
        
        subprocess.run(
            clone_cmd,
            check=True,
            capture_output=True,
            text=True
        )
        
        # Clean up .git directory to reduce size
        git_dir = os.path.join(extension_dir, '.git')
        if os.path.exists(git_dir):
            shutil.rmtree(git_dir)
            
        logger.info(f"Extension installed successfully to: {extension_dir}")
        return extension_dir
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Error cloning repository: {e.stderr}")
        raise
    except Exception as e:
        logger.error(f"Error installing extension: {str(e)}")
        raise

def main():
    """Main function to handle command line usage."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Install bypass-paywalls-chrome-clean extension"
    )
    parser.add_argument(
        '--target-dir',
        help='Target directory to install the extension to'
    )
    
    args = parser.parse_args()
    
    try:
        extension_dir = install_extension(args.target_dir)
        print(f"Extension installed to: {extension_dir}")
    except Exception as e:
        logger.error(str(e))
        sys.exit(1)

if __name__ == "__main__":
    main() 