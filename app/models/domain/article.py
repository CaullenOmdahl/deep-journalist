"""
Domain models for articles.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, AnyHttpUrl, ConfigDict
from .source import Source
from .fact_check import FactCheck
from .annotation import Annotation

class UrlCitation(BaseModel):
    """URL citation model."""
    url: str = Field(..., description="URL of the citation source")
    title: str = Field(..., description="Title of the source")
    text: str = Field(..., description="Cited text")
    source: str = Field(..., description="Name of the source")
    context: str = Field(..., description="Context of the citation")
    exactQuote: str = Field(..., description="Exact quoted text")
    dateTime: Optional[datetime] = Field(default_factory=datetime.now, description="Date and time of the citation")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of the citation")
    verified: bool = Field(default=False, description="Whether the citation has been verified")

    def validate_url(self) -> str:
        """Validate and normalize the URL."""
        if not self.url.startswith(('http://', 'https://')):
            raise ValueError("Invalid URL format. URL must start with http:// or https://")
        return self.url

class Annotation(BaseModel):
    """Annotation model."""
    text: str
    type: str
    category: str
    confidence: float
    requires_verification: bool
    url_citation: Optional[UrlCitation] = None

class BiasAnalysis(BaseModel):
    """Analysis of bias in an article."""
    political_bias: str = Field(default="neutral", description="Political bias classification")
    loaded_language: List[str] = Field(default_factory=list, description="List of loaded or biased language found")
    subjective_statements: List[str] = Field(default_factory=list, description="List of subjective statements found")
    neutral_language_score: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Score indicating how neutral the language is"
    )
    bias_score: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Overall bias score"
    )
    perspective_balance: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Score indicating balance of different perspectives"
    )
    detected_bias_types: List[str] = Field(
        default_factory=list,
        description="Types of bias detected"
    )
    suggestions: List[str] = Field(
        default_factory=list,
        description="Suggestions for improving neutrality"
    )
    source_diversity_score: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Score for diversity of sources"
    )
    factual_accuracy_score: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Score for factual accuracy"
    )
    raw_analysis: Dict[str, Any] = Field(
        default_factory=dict,
        description="Raw analysis data from the AI model"
    )
    
    model_config = ConfigDict(
        validate_assignment=True
    )

class Article(BaseModel):
    """Model for analyzed articles."""
    url: AnyHttpUrl = Field(..., description="URL of the article")
    title: str = Field(..., description="Article title")
    content: str = Field(..., description="Article content")
    author: Optional[str] = Field(default=None, description="Article author")
    publication_date: Optional[datetime] = Field(default=None, description="Publication date")
    domain: str = Field(..., description="Domain of the article")
    word_count: int = Field(default=0, description="Number of words in the article")
    has_paywall: bool = Field(default=False, description="Whether the article has a paywall")
    
    # Analysis results
    summary: Optional[str] = Field(default=None, description="Article summary")
    bias_analysis: Optional[BiasAnalysis] = Field(default=None, description="Bias analysis results")
    fact_checks: List[FactCheck] = Field(default_factory=list, description="Fact check results")
    annotations: List[Annotation] = Field(default_factory=list, description="Article annotations")
    sources: List[Source] = Field(default_factory=list, description="Article sources")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat() if v else None,
            AnyHttpUrl: str
        }
    )

class SourceAnalysis(BaseModel):
    """Model representing source analysis results."""
    reliability: str = Field(default="unknown", description="Source reliability rating")
    type: str = Field(default="unknown", description="Source type classification")
    credibility_indicators: List[str] = Field(default_factory=list, description="Credibility indicators")
    primary_sources: List[Source] = Field(default_factory=list, description="Primary sources")
    secondary_sources: List[Source] = Field(default_factory=list, description="Secondary sources")

class ArticleAnalysis(BaseModel):
    """Model representing complete article analysis."""
    article: Article = Field(..., description="Original article")
    bias_analysis: BiasAnalysis = Field(default_factory=BiasAnalysis, description="Bias analysis")
    fact_checks: List[FactCheck] = Field(default_factory=list, description="Fact checks")
    source_analysis: SourceAnalysis = Field(default_factory=SourceAnalysis, description="Source analysis")
    annotations: List[Annotation] = Field(default_factory=list, description="Article annotations")
    summary: str = Field(default="", description="Article summary")
    warnings: List[str] = Field(default_factory=list, description="Analysis warnings") 