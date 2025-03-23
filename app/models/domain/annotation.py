from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict
from .url_citation import UrlCitation

class Annotation(BaseModel):
    """
    Model representing an annotation on article text.
    """
    text: str = Field(..., description="The annotated text")
    type: Literal["claim", "opinion", "fact", "url_citation"] = Field(
        default="claim",
        description="Type of annotation"
    )
    category: str = Field(
        default="unspecified",
        description="Category of the annotation"
    )
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Confidence score for the annotation"
    )
    requires_verification: bool = Field(
        default=False,
        description="Whether this annotation requires verification"
    )
    url_citation: Optional[UrlCitation] = Field(
        default=None,
        description="URL citation when type is url_citation"
    )

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        validate_assignment=True,
        json_encoders={
            UrlCitation: lambda v: v.dict()
        }
    ) 