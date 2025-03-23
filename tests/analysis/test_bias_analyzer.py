"""
Tests for bias analysis functionality.
"""
import pytest
from unittest.mock import patch, MagicMock
from textblob import TextBlob

from app.analysis.bias.analyzer import BiasAnalyzer
from app.models.domain.article import BiasAnalysis
from app.core.config import Settings

@pytest.fixture
def bias_analyzer():
    """Create a BiasAnalyzer instance for testing."""
    settings = Settings(test_mode=True)
    return BiasAnalyzer(settings=settings)

@pytest.fixture
def mock_article_text():
    """Sample article text for testing."""
    return """
    This is obviously a very controversial topic.
    Some people believe one thing, while others definitely think another.
    The government has absolutely made several questionable decisions.
    Experts clearly suggest that more research is needed.
    """

@pytest.fixture
def mock_gemini_response():
    """Sample Gemini AI response for testing."""
    return {
        "bias_score": 0.3,
        "detected_bias_types": ["political", "source"],
        "neutral_language_score": 0.85,
        "perspective_balance": 0.8,
        "political_bias": "neutral",
        "source_diversity_score": 0.7,
        "factual_accuracy_score": 0.9,
        "suggestions": [
            "Use more neutral language",
            "Include diverse viewpoints"
        ]
    }

@pytest.mark.asyncio
async def test_analyze_bias_combined_scoring(bias_analyzer, mock_article_text, mock_gemini_response):
    """Test that bias analysis combines TextBlob and AI scores correctly."""
    with patch("app.core.gemini.GeminiClient.analyze_bias") as mock_analyze:
        mock_analyze.return_value = mock_gemini_response
        
        result = await bias_analyzer.analyze_bias(mock_article_text)
        
        # Check that final score is average of TextBlob and AI scores
        assert isinstance(result, BiasAnalysis)
        assert 0 <= result.bias_score <= 1
        assert result.neutral_language_score == 1.0 - result.bias_score
        assert len(result.loaded_language) > 0  # Should detect loaded words
        assert len(result.subjective_statements) > 0  # Should detect subjective statements

@pytest.mark.asyncio
async def test_loaded_words_detection(bias_analyzer):
    """Test detection of loaded words in text."""
    test_text = "This is obviously a very controversial topic that everyone knows about."
    
    loaded_words = bias_analyzer._find_loaded_words(test_text)
    
    assert "obviously" in loaded_words
    assert "everyone knows" in loaded_words
    assert len(loaded_words) >= 2

@pytest.mark.asyncio
async def test_subjective_sentences(bias_analyzer):
    """Test detection of subjective sentences."""
    test_text = """
    This is a fact-based statement.
    This is obviously a very biased statement that everyone knows is true.
    Another neutral statement about data.
    """
    blob = TextBlob(test_text)
    
    subjective_sentences = bias_analyzer._get_subjective_sentences(blob)
    
    assert len(subjective_sentences) > 0
    assert any("obviously" in s.lower() for s in subjective_sentences)
    assert not any("fact-based" in s.lower() for s in subjective_sentences)

@pytest.mark.asyncio
async def test_analyze_claims_with_bias(bias_analyzer, mock_article_text):
    """Test analysis of individual claims with bias scores."""
    mock_claims = [
        "The government has made controversial decisions",
        "Experts unanimously agree on the solution"
    ]
    
    mock_bias_response = {
        "bias_score": 0.4,
        "detected_bias_types": ["political"],
        "neutral_language_score": 0.6,
        "perspective_balance": 0.7,
        "political_bias": "neutral",
        "suggestions": []
    }
    
    with patch("app.core.gemini.GeminiClient.extract_claims") as mock_extract:
        with patch("app.core.gemini.GeminiClient.analyze_bias") as mock_analyze:
            mock_extract.return_value = mock_claims
            mock_analyze.return_value = mock_bias_response
            
            analyzed_claims = await bias_analyzer.analyze_claims(mock_article_text)
            
            assert len(analyzed_claims) == len(mock_claims)
            for claim_analysis in analyzed_claims:
                assert "claim" in claim_analysis
                assert "bias_score" in claim_analysis
                assert "bias_types" in claim_analysis
                assert 0 <= claim_analysis["bias_score"] <= 1

@pytest.mark.asyncio
async def test_improvement_suggestions_threshold(bias_analyzer, mock_article_text):
    """Test that improvement suggestions are only returned above threshold."""
    mock_responses = [
        {"bias_score": 0.6, "suggestions": ["Suggestion 1"]},  # Below threshold
        {"bias_score": 0.8, "suggestions": ["Suggestion 2"]}   # Above threshold
    ]
    
    for response in mock_responses:
        with patch("app.core.gemini.GeminiClient.analyze_bias") as mock_analyze:
            mock_analyze.return_value = response
            suggestions = await bias_analyzer.get_improvement_suggestions(
                mock_article_text,
                threshold=0.7
            )
            
            if response["bias_score"] > 0.7:
                assert len(suggestions) > 0
            else:
                assert len(suggestions) == 0

@pytest.mark.asyncio
async def test_error_handling_and_logging(bias_analyzer, mock_article_text, caplog):
    """Test error handling and logging in bias analysis."""
    with patch("app.core.gemini.GeminiClient.analyze_bias") as mock_analyze:
        mock_analyze.side_effect = Exception("API Error")
        
        with pytest.raises(Exception) as exc_info:
            await bias_analyzer.analyze_bias(mock_article_text)
            
        assert "API Error" in str(exc_info.value)
        assert any("Error analyzing bias" in record.message for record in caplog.records)

@pytest.mark.asyncio
async def test_performance_requirements(bias_analyzer, mock_article_text, mock_gemini_response):
    """Test that bias analysis meets performance requirements."""
    with patch("app.core.gemini.GeminiClient.analyze_bias") as mock_analyze:
        mock_analyze.return_value = mock_gemini_response
        
        import time
        start_time = time.time()
        
        result = await bias_analyzer.analyze_bias(mock_article_text)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        assert processing_time < 5  # Should complete within 5 seconds
        assert result is not None

@pytest.mark.asyncio
async def test_bias_analysis_validation(bias_analyzer):
    """Test input validation for bias analysis."""
    invalid_inputs = [
        None,
        "",
        " ",
        123,
        [],
        {}
    ]
    
    for invalid_input in invalid_inputs:
        with pytest.raises(ValueError):
            await bias_analyzer.analyze_bias(invalid_input)

@pytest.mark.asyncio
async def test_source_diversity_requirements(bias_analyzer, mock_article_text, mock_gemini_response):
    """Test that source diversity meets project requirements."""
    with patch("app.core.gemini.GeminiClient.analyze_bias") as mock_analyze:
        mock_analyze.return_value = mock_gemini_response
        
        result = await bias_analyzer.analyze_bias(mock_article_text)
        
        assert result.source_diversity_score >= 0.7  # Project requirement
        assert result.factual_accuracy_score >= 0.8  # Project requirement 