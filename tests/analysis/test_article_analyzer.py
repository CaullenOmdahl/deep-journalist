"""
Tests for article analysis functionality.
"""
import pytest
from unittest.mock import patch, MagicMock

from app.analysis.article_analyzer import ArticleAnalyzer
from app.analysis.bias.analyzer import BiasAnalyzer
from app.models.domain.article import Article, BiasAnalysis, ArticleAnalysis
from app.core.config import Settings

@pytest.fixture
def settings():
    """Create test settings."""
    return Settings(test_mode=True)

@pytest.fixture
def article_analyzer(settings):
    """Create an ArticleAnalyzer instance for testing."""
    return ArticleAnalyzer(settings=settings)

@pytest.fixture
def mock_article():
    """Create a mock article for testing."""
    return Article(
        url="https://example.com/test",
        title="Test Article",
        content="This is a test article with some potentially biased content.",
        author="Test Author",
        published_date="2024-03-20",
        source="Test Source",
        domain="example.com"
    )

@pytest.fixture
def mock_bias_analysis():
    """Create a mock bias analysis result."""
    return BiasAnalysis(
        bias_score=0.3,
        political_bias="neutral",
        loaded_language=["potentially", "some"],
        subjective_statements=["This is a test article"],
        neutral_language_score=0.7,
        perspective_balance=0.8,
        detected_bias_types=["source"],
        suggestions=["Consider using more neutral language"],
        source_diversity_score=0.75,
        factual_accuracy_score=0.85,
        raw_analysis={"test": "data"}
    )

@pytest.mark.asyncio
async def test_analyze_article_with_bias(article_analyzer, mock_article, mock_bias_analysis):
    """Test that article analysis properly integrates bias analysis."""
    with patch.object(BiasAnalyzer, 'analyze_bias') as mock_analyze_bias, \
         patch.object(BiasAnalyzer, 'analyze_claims') as mock_analyze_claims, \
         patch.object(BiasAnalyzer, 'get_improvement_suggestions') as mock_get_suggestions:
        
        mock_analyze_bias.return_value = mock_bias_analysis
        mock_analyze_claims.return_value = [
            {"claim": "Test claim", "bias_score": 0.5, "bias_types": ["political"]}
        ]
        mock_get_suggestions.return_value = ["Suggestion 1", "Suggestion 2"]

        result = await article_analyzer.analyze_article(mock_article)
        
        assert isinstance(result, ArticleAnalysis)
        assert result.bias_analysis == mock_bias_analysis
        assert result.article == mock_article
        assert len(result.warnings) >= 0

@pytest.mark.asyncio
async def test_analyze_article_empty_content(article_analyzer):
    """Test handling of articles with empty content."""
    empty_article = Article(
        url="https://example.com/empty",
        title="Empty Article",
        content="",
        author="Test Author",
        published_date="2024-03-20",
        source="Test Source",
        domain="example.com"
    )

    with pytest.raises(ValueError) as exc_info:
        await article_analyzer.analyze_article(empty_article)
    assert "Article content cannot be empty" in str(exc_info.value)

@pytest.mark.asyncio
async def test_analyze_article_with_claims(article_analyzer, mock_article):
    """Test that article analysis includes claim analysis."""
    mock_claims = [
        {
            "claim": "Test claim 1",
            "bias_score": 0.4,
            "bias_types": ["political"]
        },
        {
            "claim": "Test claim 2",
            "bias_score": 0.2,
            "bias_types": ["source"]
        }
    ]

    with patch.object(BiasAnalyzer, 'analyze_bias') as mock_analyze_bias, \
         patch.object(BiasAnalyzer, 'analyze_claims') as mock_analyze_claims:
        
        mock_analyze_bias.return_value = BiasAnalysis()
        mock_analyze_claims.return_value = mock_claims

        result = await article_analyzer.analyze_article(mock_article)
        
        assert isinstance(result, ArticleAnalysis)
        assert result.article == mock_article

@pytest.mark.asyncio
async def test_analyze_article_error_handling(article_analyzer, mock_article):
    """Test error handling during article analysis."""
    with patch.object(BiasAnalyzer, 'analyze_bias') as mock_analyze_bias:
        mock_analyze_bias.side_effect = Exception("Analysis error")

        with pytest.raises(Exception) as exc_info:
            await article_analyzer.analyze_article(mock_article)
            
        assert "Analysis error" in str(exc_info.value)

@pytest.mark.asyncio
async def test_analyze_article_performance(article_analyzer, mock_article, mock_bias_analysis):
    """Test performance requirements for article analysis."""
    with patch.object(BiasAnalyzer, 'analyze_bias') as mock_analyze_bias, \
         patch.object(BiasAnalyzer, 'analyze_claims') as mock_analyze_claims:
        
        mock_analyze_bias.return_value = mock_bias_analysis
        mock_analyze_claims.return_value = []

        import time
        start_time = time.time()
        
        result = await article_analyzer.analyze_article(mock_article)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        assert processing_time < 5.0  # Analysis should complete within 5 seconds
        assert isinstance(result, ArticleAnalysis)

@pytest.mark.asyncio
async def test_analyze_article_with_suggestions(article_analyzer, mock_article, mock_bias_analysis):
    """Test that article analysis includes improvement suggestions."""
    with patch.object(BiasAnalyzer, 'analyze_bias') as mock_analyze_bias, \
         patch.object(BiasAnalyzer, 'analyze_claims') as mock_analyze_claims, \
         patch.object(BiasAnalyzer, 'get_improvement_suggestions') as mock_get_suggestions:

        mock_analyze_bias.return_value = mock_bias_analysis
        mock_analyze_claims.return_value = []
        mock_get_suggestions.return_value = ["Suggestion 1", "Suggestion 2"]

        result = await article_analyzer.analyze_article(mock_article)
        
        assert isinstance(result, ArticleAnalysis)
        assert result.bias_analysis == mock_bias_analysis
        assert len(result.bias_analysis.suggestions) > 0

@pytest.mark.asyncio
async def test_analyze_article_source_validation(article_analyzer):
    """Test validation of article source information."""
    invalid_article = Article(
        url="https://example.com/test",
        title="Test Article",
        content="Test content",
        author="",  # Empty author
        published_date="invalid-date",  # Invalid date
        source="",  # Empty source
        domain="example.com"
    )

    with patch.object(BiasAnalyzer, 'analyze_bias') as mock_analyze_bias, \
         patch.object(BiasAnalyzer, 'analyze_claims') as mock_analyze_claims:
        
        mock_analyze_bias.return_value = BiasAnalysis()
        mock_analyze_claims.return_value = []

        result = await article_analyzer.analyze_article(invalid_article)
        
        assert isinstance(result, ArticleAnalysis)
        assert "Missing author information" in result.warnings
        assert "Missing publication date" in result.warnings

@pytest.mark.asyncio
async def test_analyze_article_content_requirements(article_analyzer, mock_article, mock_bias_analysis):
    """Test that article analysis meets content quality requirements."""
    with patch.object(BiasAnalyzer, 'analyze_bias') as mock_analyze_bias, \
         patch.object(BiasAnalyzer, 'analyze_claims') as mock_analyze_claims:
        
        mock_analyze_bias.return_value = mock_bias_analysis
        mock_analyze_claims.return_value = []

        result = await article_analyzer.analyze_article(mock_article)
        
        assert isinstance(result, ArticleAnalysis)
        assert result.bias_analysis.neutral_language_score >= 0.0
        assert result.bias_analysis.neutral_language_score <= 1.0
        assert result.bias_analysis.source_diversity_score >= 0.0
        assert result.bias_analysis.source_diversity_score <= 1.0 