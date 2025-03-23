"""
Models for fact checking functionality.
"""
from typing import List, Optional
from pydantic import BaseModel, Field

class Source(BaseModel):
    """Model for a source used in fact checking."""
    
    url: str = Field(..., description="URL of the source")
    title: str = Field(..., description="Title of the source")
    type: str = Field(..., description="Type of source (primary/secondary)")
    credibility_score: float = Field(
        ...,
        description="Credibility score from 0 (not credible) to 1 (highly credible)",
        ge=0,
        le=1
    )

class FactCheck(BaseModel):
    """Model for fact checking results."""
    
    claim: str = Field(..., description="The claim being verified")
    verified: bool = Field(..., description="Whether the claim is verified as true")
    confidence: float = Field(
        ...,
        description="Confidence score from 0 (not confident) to 1 (highly confident)",
        ge=0,
        le=1
    )
    evidence: str = Field(..., description="Evidence supporting the verification")
    context: str = Field(..., description="Context around the claim")
    supporting_sources: List[Source] = Field(
        ...,
        description="List of sources supporting the verification"
    ) 