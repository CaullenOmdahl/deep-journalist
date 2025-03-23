"""
Article API models.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl


class Source(BaseModel):
    """Source model for article analysis."""
    url: HttpUrl = Field(..., description="URL of the source")
    title: str = Field(..., description="Title of the source")
    type: str = Field(..., description="Type of source (primary/secondary)")
    credibility_score: float = Field(
        ...,
        description="Credibility score from 0 (not credible) to 1 (highly credible)",
        ge=0,
        le=1
    )


class BiasAnalysis(BaseModel):
    """Model for bias analysis results."""
    political_bias: str = Field(default="neutral", description="Political bias classification")
    loaded_language: List[str] = Field(default_factory=list, description="List of loaded or biased words")
    subjective_statements: List[str] = Field(default_factory=list, description="List of subjective statements")
    neutral_language_score: float = Field(default=0.0, ge=0.0, le=1.0, description="Score for neutral language use")


class FactCheck(BaseModel):
    """Model for fact checking results."""
    claims: List[str] = Field(default_factory=list, description="List of claims requiring verification")
    needs_verification: bool = Field(default=True, description="Whether claims need verification")
    citations: List[str] = Field(default_factory=list, description="List of citations found")
    verified_claims: List[Dict[str, Any]] = Field(default_factory=list, description="List of verified claims")


class SourceAnalysis(BaseModel):
    """Model for source analysis results."""
    reliability: str = Field(default="unknown", description="Source reliability rating")
    type: str = Field(default="unknown", description="Source type classification")
    credibility_indicators: List[str] = Field(default_factory=list, description="List of credibility indicators")


class ArticleMetadata(BaseModel):
    """Model for article metadata."""
    title: str = Field(default="", description="Article title")
    author: str = Field(default="", description="Article author")
    date_published: Optional[datetime] = Field(default=None, description="Publication date")
    canonical_url: Optional[HttpUrl] = Field(default=None, description="Canonical URL of the article")
    word_count: int = Field(default=0, ge=0, description="Word count of the article")


class ArticleAnalysisRequest(BaseModel):
    """Request model for article analysis."""
    url: HttpUrl = Field(..., description="URL of the article to analyze")


class ArticleAnalysisResponse(BaseModel):
    """Response model for article analysis."""
    url: HttpUrl = Field(..., description="Original article URL")
    metadata: ArticleMetadata = Field(default_factory=ArticleMetadata, description="Article metadata")
    bias_analysis: BiasAnalysis = Field(default_factory=BiasAnalysis, description="Bias analysis results")
    fact_check: FactCheck = Field(default_factory=FactCheck, description="Fact checking results")
    source_analysis: SourceAnalysis = Field(default_factory=SourceAnalysis, description="Source analysis results")
    summary: str = Field(default="", description="Article summary")
    warnings: List[str] = Field(default_factory=list, description="Analysis warnings")
    sources: List[Source] = Field(default_factory=list, description="Primary sources found")
    suggestions: List[str] = Field(default_factory=list, description="Improvement suggestions")
    overall_credibility_score: float = Field(
        0.0,
        description="Overall credibility score from 0 (not credible) to 1 (highly credible)",
        ge=0,
        le=1
    ) 