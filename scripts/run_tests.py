import os
import sys
import pytest
import logging
from typing import List, Optional

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_tests(test_path: Optional[str] = None, args: Optional[List[str]] = None) -> int:
    """
    Run the project's tests.
    
    Args:
        test_path: Optional path to specific test file or directory
        args: Optional list of additional pytest arguments
        
    Returns:
        Exit code from pytest
    """
    try:
        # Set up test arguments
        test_args = []
        
        # Add test path if provided
        if test_path:
            test_args.append(test_path)
            
        # Add any additional arguments
        if args:
            test_args.extend(args)
            
        # Add default arguments if none provided
        if not test_args:
            test_args = ['tests']
            
        # Add verbose flag and show locals on failure
        test_args.extend(['-v', '--showlocals'])
        
        # Run tests
        logger.info(f"Running tests with arguments: {test_args}")
        return pytest.main(test_args)
        
    except Exception as e:
        logger.error(f"Error running tests: {str(e)}")
        return 1

def main():
    """Main function to handle command line usage."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Run Deep-Journalist tests"
    )
    parser.add_argument(
        'test_path',
        nargs='?',
        help='Path to specific test file or directory'
    )
    parser.add_argument(
        '--args',
        nargs='+',
        help='Additional pytest arguments'
    )
    
    args = parser.parse_args()
    
    exit_code = run_tests(args.test_path, args.args)
    sys.exit(exit_code)

if __name__ == "__main__":
    main() 