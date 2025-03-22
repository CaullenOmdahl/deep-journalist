import os
import sys
import json
import argparse
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from app.scrapers.paywall_bypass import PaywallBypassScraper
from app.analysis.article_analyzer import ArticleAnalyzer
from app.models.schemas import AnalysisRequest, AnalysisResponse

# Setup logging
logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO'),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def analyze_article(url: Optional[str] = None, input_file: Optional[str] = None) -> Dict[str, Any]:
    """
    Analyze an article from either a URL or input file.
    
    Args:
        url: URL of the article to analyze
        input_file: Path to input JSON file
        
    Returns:
        Dict containing analysis results
    """
    try:
        # Initialize components
        scraper = PaywallBypassScraper()
        analyzer = ArticleAnalyzer()
        
        # Get article content
        if url:
            logger.info(f"Scraping article from URL: {url}")
            article_data = scraper.scrape_article(url)
            content = article_data['content']
            request = AnalysisRequest(
                url=url,
                headline=article_data.get('title', ''),
                body=content,
                dateline=datetime.now().isoformat()
            )
        elif input_file:
            logger.info(f"Reading article from file: {input_file}")
            with open(input_file, 'r', encoding='utf-8') as f:
                input_data = json.load(f)
            request = AnalysisRequest(**input_data)
            content = request.body
        else:
            raise ValueError("Either URL or input file must be provided")
            
        # Perform analysis
        logger.info("Analyzing article content...")
        bias_analysis = analyzer.analyze_bias(content)
        citations = analyzer.extract_citations(content)
        annotations = analyzer.generate_annotations(content)
        
        # Classify sources
        sources = []
        for citation in citations:
            source = analyzer.classify_source(
                citation.context,
                citation.url
            )
            sources.append(source)
            
        # Calculate overall neutrality score
        neutrality_score = 1.0 - bias_analysis['subjectivity']
        
        # Create response
        response = AnalysisResponse(
            headline=request.headline,
            byline=request.byline,
            dateline=request.dateline,
            lede=request.lede,
            body=content,
            bias_indicators=bias_analysis,
            sources=sources,
            citations=citations,
            annotations=annotations,
            neutrality_score=neutrality_score
        )
        
        return response.dict()
        
    except Exception as e:
        logger.error(f"Error analyzing article: {str(e)}")
        raise

def main():
    """Main CLI function."""
    parser = argparse.ArgumentParser(
        description="Deep-Journalist CLI - Analyze articles for bias and verify sources"
    )
    
    # Add arguments
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
    
    try:
        # Validate arguments
        if not args.url and not args.input:
            parser.error("Either --url or --input must be provided")
            
        # Analyze article
        results = analyze_article(
            url=args.url,
            input_file=args.input
        )
        
        # Output results
        if args.output:
            # Write to file
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            logger.info(f"Results written to: {args.output}")
        else:
            # Print to stdout
            print(json.dumps(results, indent=2, ensure_ascii=False))
            
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 