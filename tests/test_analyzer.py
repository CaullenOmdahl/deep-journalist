import os
import pytest
from textblob import TextBlob
from app.analysis.article_analyzer import ArticleAnalyzer
from app.models.domain.article import BiasAnalysis, UrlCitation, Annotation
from app.models.domain.source import Source
from unittest.mock import patch, MagicMock, AsyncMock

# Sample test data
SAMPLE_TEXT = """
This is a test article with citations.
According to [Source 1], this is important.
Another study [Source 2] shows different results.
Obviously, this requires immediate action.
"""

@pytest.fixture
def mock_ai_config():
    """Create a mock AI configuration."""
    mock = MagicMock()
    mock.test_mode = True
    mock.analyze_bias = AsyncMock(return_value={
        "political_bias": "neutral",
        "bias_types": ["none detected"],
        "perspective_balance": 0.8,
        "suggestions": ["The text appears to be relatively neutral"]
    })
    mock.extract_citations = AsyncMock(return_value=[{
        "text": "Sample citation",
        "source": "Test Source",
        "context": "Test context",
        "confidence": 0.9,
        "url": "https://example.com"
    }])
    return mock

@pytest.fixture
def analyzer(mock_ai_config):
    """Create an ArticleAnalyzer instance for testing."""
    with patch('app.core.config.AIConfig', return_value=mock_ai_config):
        return ArticleAnalyzer(test_mode=True)

@pytest.fixture
def mock_article_text():
    """Sample article text for testing."""
    return """
According to recent studies by Harvard University (https://harvard.edu/study), climate change 
is accelerating faster than previously thought. The latest data shows that rising temperatures 
could cost the global economy trillions of dollars. Obviously, this is a concerning development 
that requires immediate action.
"""

@pytest.fixture
def mock_bias_analysis():
    """Mock bias analysis results."""
    return {
        "bias_score": 0.3,
        "detected_bias_types": ["political"],
        "neutral_language_score": 0.85,
        "perspective_diversity": 0.7
    }

@pytest.fixture
def mock_fact_checks():
    """Mock fact check results."""
    return {
        "verified_claims": [
            {
                "claim": "Climate change is accelerating",
                "verified": True,
                "confidence": 0.9,
                "evidence": "Multiple studies confirm acceleration"
            }
        ],
        "unverified_claims": []
    }

@pytest.fixture
def mock_article_data():
    """Mock article data for testing."""
    return {
        "content": "Test article content",
        "metadata": {
            "title": "Test Article",
            "author": "Test Author",
            "date": "2024-03-20",
            "description": "Test description"
        }
    }

@pytest.mark.asyncio
async def test_analyze_bias(analyzer):
    """Test bias analysis."""
    text = "This is a test article with potential bias."
    result = await analyzer.analyze_bias(text)
    
    assert isinstance(result, BiasAnalysis)
    assert 0 <= result.bias_score <= 1
    assert 0 <= result.neutral_language_score <= 1
    assert 0 <= result.perspective_balance <= 1
    assert isinstance(result.detected_bias_types, list)
    assert isinstance(result.suggestions, list)
    assert isinstance(result.loaded_language, list)
    assert isinstance(result.subjective_statements, list)
    assert isinstance(result.political_bias, str)

@pytest.mark.asyncio
async def test_extract_citations(analyzer):
    """Test citation extraction functionality."""
    citations = await analyzer.extract_citations(SAMPLE_TEXT)
    assert isinstance(citations, list)
    for citation in citations:
        assert isinstance(citation, UrlCitation)
        assert citation.text
        assert citation.source
        assert citation.context

@pytest.mark.asyncio
async def test_generate_annotations(analyzer):
    """Test annotation generation functionality."""
    annotations = await analyzer.generate_annotations(SAMPLE_TEXT)
    assert isinstance(annotations, list)
    for annotation in annotations:
        assert isinstance(annotation, Annotation)
        assert annotation.text
        assert annotation.type
        assert annotation.confidence

@pytest.mark.asyncio
async def test_find_loaded_words(analyzer):
    """Test loaded word detection."""
    result = await analyzer.find_loaded_words(SAMPLE_TEXT)

    assert isinstance(result, list)
    assert len(result) > 0
    assert 'obviously' in result

@pytest.mark.asyncio
async def test_get_subjective_sentences(analyzer):
    """Test subjective sentence detection."""
    result = await analyzer.get_subjective_sentences(SAMPLE_TEXT)

    assert isinstance(result, list)
    assert len(result) > 0
    assert any('obviously' in sentence.lower() for sentence in result)

@pytest.mark.asyncio
async def test_assess_source_reliability(analyzer):
    """Test source reliability assessment."""
    result = await analyzer.assess_source_reliability(SAMPLE_TEXT)

    assert isinstance(result, dict)
    assert 'reliability' in result
    assert 'credibility_indicators' in result

@pytest.mark.asyncio
async def test_needs_verification(analyzer):
    """Test verification need check."""
    result = await analyzer.needs_verification(SAMPLE_TEXT)

    assert isinstance(result, bool)

def test_classify_source(analyzer):
    """Test source classification functionality."""
    source = analyzer.classify_source(
        "Harvard University research paper on climate change",
        "https://harvard.edu/study"
    )
    
    assert isinstance(source, Source)
    assert str(source.url) == "https://harvard.edu/study"
    assert source.title == "Harvard University research paper on climate change"
    assert source.type == "primary"
    assert source.reliability_score > 0
    assert 0 <= source.credibility_score <= 1
    assert source.classification_confidence > 0

def test_find_loaded_words(analyzer):
    """Test loaded words detection."""
    loaded_words = analyzer.find_loaded_words(SAMPLE_TEXT)
    
    assert isinstance(loaded_words, list)
    assert "obviously" in loaded_words

def test_get_subjective_sentences(analyzer):
    """Test subjective sentence detection."""
    subjective_sentences = analyzer.get_subjective_sentences(TextBlob(SAMPLE_TEXT))
    
    assert isinstance(subjective_sentences, list)
    # The sentence with "Obviously" should be detected as subjective
    assert any("obviously" in sentence.lower() for sentence in subjective_sentences)

def test_assess_source_reliability(analyzer):
    """Test source reliability assessment."""
    reliability = analyzer._assess_source_reliability(
        "Academic research paper on climate change",
        "https://harvard.edu/study"
    )
    
    assert isinstance(reliability, float)
    assert 0 <= reliability <= 1
    # .edu domain should have higher reliability
    assert reliability > 0.5

def test_needs_verification(analyzer):
    """Test verification requirement detection."""
    # Test sentence with numbers
    assert analyzer._needs_verification("The temperature will rise by 2 degrees.")
    # Test sentence with attribution
    assert analyzer._needs_verification("According to experts, the impact will be severe.")
    # Test regular sentence
    assert not analyzer._needs_verification("This is a simple statement.") 