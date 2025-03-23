from typing import List, Optional, Literal
from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime

class Source(BaseModel):
    dateTime: str
    exactQuote: str
    url: str
    authorityType: Optional[Literal["official", "expert", "primary", "secondary"]] = None
    sourceType: Optional[Literal["primary", "secondary", "expert_analysis"]] = None
    verificationStatus: Optional[Literal["verified", "unverified", "disputed"]] = None

class UrlCitation(BaseModel):
    """Model for URL citations."""
    text: str = Field(description="The cited text")
    source: str = Field(description="Source name or identifier")
    context: str = Field(description="Context around the citation")
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Confidence score for the citation"
    )
    url: str = Field(description="URL of the source")
    title: str = Field(
        default="",
        description="Title of the source document"
    )
    exactQuote: str = Field(
        default="",
        description="Exact quote from the source"
    )
    dateTime: datetime = Field(
        default_factory=datetime.now,
        description="Date and time of the citation"
    )

class Annotation(BaseModel):
    type: Literal["url_citation"]
    url_citation: UrlCitation

class Message(BaseModel):
    role: Literal["assistant"]
    content: str
    type: Literal["text", "json"]
    annotations: Optional[List[Annotation]] = None

class Choice(BaseModel):
    index: int
    message: Message
    logprobs: Optional[dict] = None
    finish_reason: str

class Usage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class ArticleAnalysis(BaseModel):
    Analysis: str
    Body: str
    Byline: str
    Context: str
    Dateline: str
    Headline: str
    Lede: str
    Sources: List[Source]

class AnalysisRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(int(datetime.now().timestamp())))
    object: str = "chat.completion"
    created: int = Field(default_factory=lambda: int(datetime.now().timestamp()))
    model: str = "jina-deepsearch-v1"
    system_fingerprint: str = Field(default_factory=lambda: f"fp_{int(datetime.now().timestamp())}")
    choices: List[Choice]
    usage: Usage
    visitedURLs: List[str]
    readURLs: List[str]
    numURLs: int

class AnalysisResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    system_fingerprint: str
    choices: List[Choice]
    usage: Usage
    visitedURLs: List[str]
    readURLs: List[str]
    numURLs: int 