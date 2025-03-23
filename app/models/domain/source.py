"""
Domain model for sources.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, HttpUrl, Field

class Source(BaseModel):
    """Source model."""
    url: HttpUrl
    title: str
    author: Optional[str] = None
    date_published: Optional[str] = None
    type: str = Field(description="Type of source (primary, secondary, etc.)")
    reliability_score: float = Field(ge=0, le=1, description="Source reliability score")
    credibility_score: float = Field(ge=0, le=1, description="Source credibility score")
    classification_confidence: float = Field(ge=0, le=1, description="Confidence in source classification")
    citations: List[str] = Field(default_factory=list, description="Citations from this source")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional source metadata") 