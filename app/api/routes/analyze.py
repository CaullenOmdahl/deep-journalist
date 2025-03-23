"""
Article analysis routes.
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, AnyHttpUrl, Field

from app.analysis.article_analyzer import ArticleAnalyzer
from app.scrapers.extractors.content_extractor import ContentExtractor
from app.scrapers.bypass.paywall_bypass import PaywallBypass
from app.models.domain.article import BiasAnalysis, UrlCitation, Annotation

router = APIRouter()

class AnalyzeRequest(BaseModel):
    """Request model for article analysis."""
    url: str = Field(..., description="URL of the article to analyze", example="https://example.com/article")
    
    def validate_url(self) -> str:
        """Validate and normalize the URL."""
        if not self.url.startswith(('http://', 'https://')):
            raise HTTPException(status_code=422, detail="Invalid URL format. URL must start with http:// or https://")
        return self.url

class BiasAnalysisResponse(BaseModel):
    """Response model for bias analysis."""
    political_bias: str
    loaded_language: List[str]
    subjective_statements: List[str]
    neutral_language_score: float
    bias_score: float
    perspective_balance: float
    detected_bias_types: List[str]
    suggestions: List[str]
    source_diversity_score: float
    factual_accuracy_score: float

class FactCheckResponse(BaseModel):
    """Response model for fact checking."""
    claims: List[Dict[str, Any]]
    needs_verification: bool
    confidence: float
    sources: List[UrlCitation]

class SourceAnalysisResponse(BaseModel):
    """Response model for source analysis."""
    type: str
    reliability: float
    credibility_indicators: Dict[str, Any]
    metadata: Dict[str, Any]

class AnalyzeResponse(BaseModel):
    """Response model for article analysis."""
    bias_analysis: BiasAnalysisResponse
    fact_check: FactCheckResponse
    source_analysis: SourceAnalysisResponse
    content: Dict[str, Any]
    annotations: List[Annotation]

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_article(request: AnalyzeRequest):
    """
    Analyze an article for bias, fact check claims, and extract sources.
    
    Args:
        request: AnalyzeRequest containing article URL
        
    Returns:
        AnalyzeResponse with analysis results
        
    Raises:
        HTTPException: If article cannot be accessed or analyzed
    """
    try:
        # Initialize components
        scraper = ContentExtractor()
        analyzer = ArticleAnalyzer()
        paywall_bypass = PaywallBypass()
        
        # Scrape article content
        html = await scraper.scrape_article(request.validate_url())
        
        # Extract content
        content = await scraper.extract_content(html)
        
        # Check for paywall
        if content.get('has_paywall', False):
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "Article is behind a paywall",
                    "paywall": True,
                    "bypass_available": paywall_bypass.can_bypass(request.validate_url())
                }
            )
            
        # Analyze bias
        bias_analysis = await analyzer.analyze_bias(content['content'])
        
        # Extract citations and generate annotations
        annotations = await analyzer.generate_annotations(content['content'])
        
        # Classify source
        source = analyzer.classify_source(content['content'], request.validate_url())
        
        # Create response
        return AnalyzeResponse(
            bias_analysis=BiasAnalysisResponse(
                political_bias=bias_analysis.political_bias,
                loaded_language=bias_analysis.loaded_language,
                subjective_statements=bias_analysis.subjective_statements,
                neutral_language_score=bias_analysis.neutral_language_score,
                bias_score=bias_analysis.bias_score,
                perspective_balance=bias_analysis.perspective_balance,
                detected_bias_types=bias_analysis.detected_bias_types,
                suggestions=bias_analysis.suggestions,
                source_diversity_score=bias_analysis.source_diversity_score,
                factual_accuracy_score=bias_analysis.factual_accuracy_score
            ),
            fact_check=FactCheckResponse(
                claims=[],  # TODO: Implement fact checking
                needs_verification=True,
                confidence=0.8,
                sources=[]
            ),
            source_analysis=SourceAnalysisResponse(
                type=source.type,
                reliability=source.reliability_score,
                credibility_indicators={
                    "classification_confidence": source.classification_confidence,
                    "is_primary": source.metadata.get("is_primary", False)
                },
                metadata=source.metadata
            ),
            content={
                "title": content.get("metadata", {}).get("title", ""),
                "author": content.get("metadata", {}).get("author", ""),
                "date": content.get("metadata", {}).get("date", ""),
                "text": content.get("content", ""),
                "word_count": content.get("word_count", 0)
            },
            annotations=annotations
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing article: {str(e)}"
        ) 