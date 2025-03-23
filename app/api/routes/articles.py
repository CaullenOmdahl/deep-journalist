"""
Article analysis endpoints.
"""
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, HttpUrl

from app.analysis.bias.analyzer import BiasAnalyzer
from app.analysis.fact_check.verifier import verify_article_claims, extract_claims
from app.models.api.article import (
    ArticleAnalysisRequest as ArticleRequest,
    ArticleAnalysisResponse as ArticleResponse,
    BiasAnalysis,
    FactCheck,
    Source
)
from app.scrapers.extractors.content_extractor import ContentExtractor
from app.analysis.article_analyzer import ArticleAnalyzer
from app.core.rate_limiter import RateLimiter
from app.utils.logger import get_logger
from app.scrapers.base_scraper import BaseScraper
from app.scrapers.bypass.paywall_bypass import PaywallBypass
from app.models.domain.article import Article
from app.core.config import Settings

router = APIRouter()
logger = get_logger(__name__)
rate_limiter = RateLimiter(max_requests=5, time_window=60)  # 5 requests per minute

class ArticleRequest(BaseModel):
    url: HttpUrl

class ArticleResponse(BaseModel):
    content: str
    metadata: Dict[str, Any]
    analysis: Dict[str, Any]
    warnings: Optional[List[str]] = []

@router.post("/analyze", response_model=ArticleResponse)
async def analyze_article(
    request: ArticleRequest,
    settings: Settings = Depends(Settings)
) -> ArticleResponse:
    """
    Analyze an article for bias and extract key information.
    """
    try:
        article = Article(
            url=request.url,
            title=request.title,
            content=request.content,
            author=request.author,
            published_date=request.published_date,
            source=request.source
        )
        
        analyzer = ArticleAnalyzer(settings=settings)
        result = await analyzer.analyze_article(article)
        
        return ArticleResponse(
            url=result.url,
            title=result.title,
            bias_analysis=result.bias_analysis,
            claims=result.claims
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing article: {str(e)}")

@router.post("/analyze/bias")
async def analyze_text_bias(
    text: str,
    settings: Settings = Depends(Settings)
) -> BiasAnalysis:
    """
    Analyze text for bias directly.
    """
    try:
        analyzer = BiasAnalyzer(settings=settings)
        return await analyzer.analyze_bias(text)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing bias: {str(e)}")

@router.post("/analyze")
async def analyze_article_old(request: ArticleRequest) -> ArticleResponse:
    """Analyze an article from a URL.
    
    Args:
        request (ArticleRequest): The request containing the article URL.
        
    Returns:
        ArticleResponse: The analysis results.
        
    Raises:
        HTTPException: If the request fails.
    """
    # Check rate limit
    if not rate_limiter.allow_request():
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {rate_limiter.time_until_reset()} seconds."
        )

    try:
        # Initialize components
        scraper = BaseScraper()
        paywall_bypass = PaywallBypass()
        analyzer = ArticleAnalyzer()
        warnings = []

        # Scrape article
        html = await scraper.scrape_article(str(request.url))

        # Check for paywall
        if await paywall_bypass.detect_paywall(html):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Article is behind a paywall"
            )

        # Extract content
        content_result = await scraper.extract_content(html)
        if not content_result or not content_result.get('content'):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No content found in article"
            )

        # Check content length
        if len(content_result['content']) < 50:
            warnings.append("Article content is shorter than recommended minimum length")

        # Analyze content
        analysis_result = await analyzer.analyze_article(content_result['content'])

        # Prepare response
        response = ArticleResponse(
            content=content_result['content'],
            metadata=content_result.get('metadata', {}),
            analysis=analysis_result,
            warnings=warnings
        )

        return response

    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        logger.error(f"Error analyzing article: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing article: {str(e)}"
        ) 