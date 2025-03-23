from typing import List
from pydantic import BaseModel, Field

class BiasAnalysis(BaseModel):
    """Model for bias analysis results."""
    
    political_bias: str = Field(
        default="neutral",
        description="Political bias assessment"
    )
    
    loaded_language: List[str] = Field(
        default_factory=list,
        description="List of loaded or biased language found"
    )
    
    subjective_statements: List[str] = Field(
        default_factory=list,
        description="List of subjective statements found"
    )
    
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
        description="Score indicating balance of perspectives"
    )
    
    detected_bias_types: List[str] = Field(
        default_factory=list,
        description="Types of bias detected"
    )
    
    suggestions: List[str] = Field(
        default_factory=list,
        description="Suggestions for improving objectivity"
    )
    
    source_diversity_score: float = Field(
        default=0.0,
        description="Score for diversity of sources",
        ge=0,
        le=1
    )
    
    factual_accuracy_score: float = Field(
        default=0.0,
        description="Score for factual accuracy",
        ge=0,
        le=1
    ) 