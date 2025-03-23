"""
FactCheck model for representing fact checking results.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from .source import Source
from datetime import datetime

class FactCheck(BaseModel):
    """
    Model representing the result of a fact check on a claim.
    """
    claim: str = Field(..., description="The claim being fact-checked")
    verified: bool = Field(default=False, description="Whether the claim is verified")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="Confidence in verification")
    evidence: str = Field(default="", description="Evidence supporting verification")
    context: str = Field(default="", description="Context around the claim")
    supporting_sources: List[Source] = Field(default_factory=list, description="Sources supporting verification")
    needs_verification: bool = Field(default=True, description="Whether claim needs verification")
    importance: str = Field(default="medium", description="Importance of the claim")
    category: str = Field(default="unclassified", description="Category of the claim")
    verdict: str = Field(..., description="Fact check verdict")
    explanation: str = Field(
        default="",
        description="Explanation of the fact check verdict"
    )
    dateTime: datetime = Field(
        default_factory=datetime.now,
        description="When the fact check was performed"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata"
    )
    
    model_config = ConfigDict(
        json_encoders={
            Source: lambda v: v.dict(),
            datetime: lambda v: v.isoformat() if v else None
        }
    ) 