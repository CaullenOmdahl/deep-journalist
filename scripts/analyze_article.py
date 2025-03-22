import os
import sys
import json
import logging
from typing import Optional
from app.cli import analyze_article

# Setup logging
logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO'),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_analysis(
    url: Optional[str] = None,
    input_file: Optional[str] = None,
    output_file: Optional[str] = None
) -> None:
    """
    Run article analysis using the CLI tool.
    
    Args:
        url: URL of the article to analyze
        input_file: Path to input JSON file
        output_file: Path to output JSON file
    """
    try:
        # Validate input
        if not url and not input_file:
            raise ValueError("Either URL or input file must be provided")
            
        # Run analysis
        logger.info("Starting article analysis...")
        results = analyze_article(url=url, input_file=input_file)
        
        # Handle output
        if output_file:
            # Write to file
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            logger.info(f"Results written to: {output_file}")
        else:
            # Print to stdout
            print(json.dumps(results, indent=2, ensure_ascii=False))
            
    except Exception as e:
        logger.error(f"Error analyzing article: {str(e)}")
        sys.exit(1)

def main():
    """Main function to handle command line usage."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Deep-Journalist CLI - Analyze articles for bias and verify sources"
    )
    parser.add_argument(
        '--url',
        help='URL of the article to analyze'
    )
    parser.add_argument(
        '--input',
        help='Path to input JSON file'
    )
    parser.add_argument(
        '--output',
        help='Path to output JSON file (optional)'
    )
    
    args = parser.parse_args()
    
    run_analysis(
        url=args.url,
        input_file=args.input,
        output_file=args.output
    )

if __name__ == "__main__":
    main() 