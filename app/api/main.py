import os
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import AnalysisRequest, AnalysisResponse
from app.scrapers.paywall_bypass import PaywallBypassScraper
from app.analysis.article_analyzer import ArticleAnalyzer

# Setup logging
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Deep-Journalist API",
    description="AI-powered journalistic research assistant API",
    version="1.0.0"
)

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup API key authentication
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

# Initialize components
article_analyzer = ArticleAnalyzer()
paywall_scraper = PaywallBypassScraper()

async def get_api_key(api_key_header: str = Security(api_key_header)) -> str:
    """Validate API key."""
    if api_key_header == os.getenv('API_SECRET_KEY'):
        return api_key_header
    raise HTTPException(
        status_code=403,
        detail="Invalid API key"
    )

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_article(
    request: AnalysisRequest,
    api_key: str = Depends(get_api_key)
) -> AnalysisResponse:
    """
    Analyze an article for bias, extract citations, and generate annotations.
    
    Args:
        request: AnalysisRequest object containing article details
        api_key: API key for authentication
        
    Returns:
        AnalysisResponse object with analysis results
    """
    try:
        logger.info(f"Analyzing article: {request.headline}")
        
        # Scrape article content if URL provided
        if request.url:
            article_data = paywall_scraper.scrape_article(request.url)
            content = article_data['content']
        else:
            content = request.body
            
        # Perform analysis
        bias_analysis = article_analyzer.analyze_bias(content)
        citations = article_analyzer.extract_citations(content)
        annotations = article_analyzer.generate_annotations(content)
        
        # Classify sources
        sources = []
        for citation in citations:
            source = article_analyzer.classify_source(
                citation.context,
                citation.url
            )
            sources.append(source)
            
        # Calculate overall neutrality score
        neutrality_score = 1.0 - bias_analysis['subjectivity']
        
        return AnalysisResponse(
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
        
    except Exception as e:
        logger.error(f"Error analyzing article: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing article: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv('API_HOST', '0.0.0.0'),
        port=int(os.getenv('API_PORT', 8000)),
        reload=True
    ) 