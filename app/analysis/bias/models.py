from pydantic import BaseModel, Field
from typing import List, Optional

class BiasAnalysis(BaseModel):
    """Model representing bias analysis results."""
    
    # Overall bias metrics
    bias_score: float = Field(default=0.0, description="Overall bias score from 0-1")
    neutral_language_score: float = Field(default=0.0, description="Score for neutral language usage")
    perspective_balance: float = Field(default=0.0, description="Score for balanced perspective presentation")
    
    # Detailed analysis
    detected_bias_types: List[str] = Field(default_factory=list, description="Types of bias detected")
    loaded_words: List[str] = Field(default_factory=list, description="List of loaded/biased words found")
    subjective_statements: List[str] = Field(default_factory=list, description="List of subjective statements")
    
    # Improvement suggestions
    suggestions: List[str] = Field(default_factory=list, description="List of suggestions for improving neutrality")
    
    # Additional metrics
    source_diversity_score: float = Field(default=0.0, description="Score for diversity of sources")
    factual_accuracy_score: float = Field(default=0.0, description="Score for factual accuracy")
    
    # Raw analysis data
    raw_analysis: dict = Field(default_factory=dict, description="Raw analysis data from AI model") 