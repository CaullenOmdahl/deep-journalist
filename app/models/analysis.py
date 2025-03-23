from typing import List, Optional
from pydantic import BaseModel

class BiasAnalysis(BaseModel):
    """Analysis of article bias."""
    bias_score: float
    neutral_language_score: float
    perspective_balance: float
    detected_bias_types: List[str]
    suggestions: List[str]

class FactCheck(BaseModel):
    """Fact check result."""
    claim: str
    confidence: float
    evidence: List[str]
    sources: List[dict]

class ArticleAnalysis(BaseModel):
    """Complete article analysis."""
    bias_analysis: BiasAnalysis
    fact_checks: List[FactCheck]
    summary: str 