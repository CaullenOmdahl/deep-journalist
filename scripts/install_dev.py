import os
import sys
import logging
import subprocess
from typing import List, Optional

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_command(cmd: List[str], cwd: Optional[str] = None) -> None:
    """
    Run a shell command.
    
    Args:
        cmd: Command to run as list of strings
        cwd: Working directory for the command
    """
    try:
        logger.info(f"Running command: {' '.join(cmd)}")
        subprocess.run(
            cmd,
            check=True,
            cwd=cwd,
            capture_output=True,
            text=True
        )
    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed with error: {e.stderr}")
        raise
    except Exception as e:
        logger.error(f"Error running command: {str(e)}")
        raise

def install_dev(
    venv: bool = True,
    extension: bool = True,
    requirements: bool = True
) -> None:
    """
    Install the project in development mode.
    
    Args:
        venv: Whether to create and use a virtual environment
        extension: Whether to install the bypass paywall extension
        requirements: Whether to install requirements
    """
    try:
        project_dir = os.path.dirname(os.path.dirname(__file__))
        
        # Create and activate virtual environment if requested
        if venv:
            venv_dir = os.path.join(project_dir, 'venv')
            if not os.path.exists(venv_dir):
                logger.info("Creating virtual environment...")
                run_command(['python', '-m', 'venv', venv_dir])
                
            # Determine pip path
            if sys.platform == 'win32':
                pip_path = os.path.join(venv_dir, 'Scripts', 'pip')
            else:
                pip_path = os.path.join(venv_dir, 'bin', 'pip')
        else:
            pip_path = 'pip'
            
        # Install requirements if requested
        if requirements:
            logger.info("Installing requirements...")
            run_command(
                [pip_path, 'install', '-r', 'requirements.txt'],
                cwd=project_dir
            )
            
        # Install project in development mode
        logger.info("Installing project in development mode...")
        run_command(
            [pip_path, 'install', '-e', '.'],
            cwd=project_dir
        )
        
        # Install bypass paywall extension if requested
        if extension:
            logger.info("Installing bypass paywall extension...")
            run_command(
                ['python', 'scripts/install_extension.py'],
                cwd=project_dir
            )
            
        logger.info("Installation completed successfully")
        
    except Exception as e:
        logger.error(f"Installation failed: {str(e)}")
        sys.exit(1)

def main():
    """Main function to handle command line usage."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Install Deep-Journalist in development mode"
    )
    parser.add_argument(
        '--no-venv',
        action='store_true',
        help="Don't create or use a virtual environment"
    )
    parser.add_argument(
        '--no-extension',
        action='store_true',
        help="Don't install the bypass paywall extension"
    )
    parser.add_argument(
        '--no-requirements',
        action='store_true',
        help="Don't install requirements"
    )
    
    args = parser.parse_args()
    
    install_dev(
        venv=not args.no_venv,
        extension=not args.no_extension,
        requirements=not args.no_requirements
    )

if __name__ == "__main__":
    main() 