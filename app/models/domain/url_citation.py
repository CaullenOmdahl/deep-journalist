from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, HttpUrl, ConfigDict

class UrlCitation(BaseModel):
    """
    Model representing a URL citation from an article.
    """
    url: HttpUrl = Field(..., description="URL of the source")
    title: str = Field(default="", description="Title of the source document")
    text: str = Field(..., description="The cited text")
    source: str = Field(..., description="Source name or identifier")
    context: str = Field(default="", description="Context around the citation")
    exactQuote: str = Field(default="", description="Exact quote from the source")
    dateTime: datetime = Field(default_factory=datetime.now, description="Date and time of the citation")
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Confidence score for the citation"
    )
    verified: bool = Field(default=False, description="Whether the citation has been verified")

    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat() if v else None
        }
    ) 