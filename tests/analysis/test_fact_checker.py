"""
Tests for fact checking functionality.
"""
import pytest
from unittest.mock import patch, MagicMock
from app.analysis.fact_check.verifier import FactChecker

@pytest.fixture
def fact_checker():
    """Create a FactChecker instance for testing."""
    return FactChecker()

@pytest.fixture
def mock_article_text():
    return """
    According to recent studies, global temperatures have risen by 1.5°C.
    Scientists predict significant impacts on ecosystems.
    The government announced new environmental policies yesterday.
    Industry experts estimate $2 billion in required infrastructure updates.
    """

@pytest.fixture
def mock_claims():
    """Sample claims for testing."""
    return [
        {
            "claim": "Global temperatures have risen by 1.5°C",
            "context": "According to recent studies",
            "importance": "high"
        },
        {
            "claim": "New environmental policies were announced",
            "context": "Government announcement",
            "importance": "medium"
        }
    ]

@pytest.fixture
def mock_verification_results():
    """Sample verification results."""
    return [
        {
            "claim": "Global temperatures have risen by 1.5°C",
            "verified": True,
            "confidence": 0.95,
            "evidence": "Multiple scientific studies confirm this trend",
            "sources": [
                {
                    "url": "https://example.com/gov-announcement",
                    "title": "Government Press Release",
                    "type": "primary",
                    "credibility_score": 0.95,
                    "relevance_score": 0.9,
                    "dateTime": "2024-03-23T00:00:00Z",
                    "exactQuote": "Global temperatures have increased by 1.5°C",
                    "classification_confidence": 0.95
                }
            ]
        }
    ]

@pytest.mark.asyncio
async def test_extract_claims_success(fact_checker, mock_article_text, mock_claims):
    with patch("app.core.gemini.client.GeminiClient.extract_claims") as mock_extract:
        mock_extract.return_value = mock_claims
        
        claims = await fact_checker.extract_claims(mock_article_text)
        
        assert isinstance(claims, list)
        assert len(claims) > 0
        for claim in claims:
            assert "claim" in claim
            assert "context" in claim
            assert "importance" in claim

@pytest.mark.asyncio
async def test_verify_claim_success(fact_checker, mock_verification_results):
    test_claim = mock_verification_results[0]["claim"]
    test_context = "According to recent studies"

    with patch("app.core.gemini.client.GeminiClient.verify_claim") as mock_verify:
        mock_verify.return_value = mock_verification_results[0]

        result = await fact_checker.verify_claim(test_claim, test_context)
        assert result.verified == mock_verification_results[0]["verified"]
        assert result.confidence == mock_verification_results[0]["confidence"]
        assert result.evidence == mock_verification_results[0]["evidence"]
        assert len(result.supporting_sources) == len(mock_verification_results[0]["sources"])

@pytest.mark.asyncio
async def test_verify_claims_batch(fact_checker, mock_claims, mock_verification_results):
    with patch("app.core.gemini.client.GeminiClient.verify_claims") as mock_verify:
        mock_verify.return_value = [
            {
                "claim": claim["claim"],
                "verified": True,
                "confidence": 0.95,
                "evidence": "Test evidence",
                "sources": [
                    {
                        "url": "https://example.com/source1",
                        "title": "Source 1",
                        "type": "primary",
                        "credibility_score": 0.9,
                        "relevance_score": 0.85,
                        "dateTime": "2024-03-23T00:00:00Z",
                        "exactQuote": "Test quote",
                        "classification_confidence": 0.9
                    }
                ]
            }
            for claim in mock_claims
        ]

        results = await fact_checker.verify_claims(
            [claim["claim"] for claim in mock_claims],
            "Article context"
        )
        
        assert len(results) == len(mock_claims)
        for result in results:
            assert result.verified is True
            assert result.confidence == 0.95
            assert len(result.supporting_sources) > 0

@pytest.mark.asyncio
async def test_source_requirements(fact_checker, mock_claims):
    with patch("app.core.gemini.client.GeminiClient.verify_claim") as mock_verify:
        mock_verify.return_value = {
            "claim": mock_claims[0]["claim"],
            "verified": True,
            "confidence": 0.9,
            "evidence": "Evidence from multiple sources",
            "sources": [
                {
                    "url": "source1",
                    "title": "Primary Source 1",
                    "type": "primary",
                    "credibility_score": 0.9,
                    "relevance_score": 0.85,
                    "dateTime": "2024-03-23T00:00:00Z",
                    "exactQuote": "Test quote 1",
                    "classification_confidence": 0.9
                },
                {
                    "url": "source2",
                    "title": "Primary Source 2",
                    "type": "primary",
                    "credibility_score": 0.85,
                    "relevance_score": 0.8,
                    "dateTime": "2024-03-23T00:00:00Z",
                    "exactQuote": "Test quote 2",
                    "classification_confidence": 0.85
                },
                {
                    "url": "source3",
                    "title": "Secondary Source",
                    "type": "secondary",
                    "credibility_score": 0.8,
                    "relevance_score": 0.75,
                    "dateTime": "2024-03-23T00:00:00Z",
                    "exactQuote": "Test quote 3",
                    "classification_confidence": 0.8
                }
            ]
        }

        result = await fact_checker.verify_claim(
            mock_claims[0]["claim"],
            mock_claims[0]["context"]
        )
        
        assert len(result.supporting_sources) == 3
        primary_sources = [s for s in result.supporting_sources if s.type == "primary"]
        assert len(primary_sources) >= 2

@pytest.mark.asyncio
async def test_confidence_thresholds(fact_checker, mock_claims):
    test_cases = [
        {"confidence": 0.95, "should_verify": True},
        {"confidence": 0.75, "should_verify": True},
        {"confidence": 0.5, "should_verify": False}
    ]

    for case in test_cases:
        with patch("app.core.gemini.client.GeminiClient.verify_claim") as mock_verify:
            mock_verify.return_value = {
                "claim": mock_claims[0]["claim"],
                "verified": case["should_verify"],
                "confidence": case["confidence"],
                "evidence": "Test evidence",
                "sources": [
                    {
                        "url": "test-source",
                        "title": "Test Source",
                        "type": "primary",
                        "credibility_score": 0.9,
                        "relevance_score": 0.85,
                        "dateTime": "2024-03-23T00:00:00Z",
                        "exactQuote": "Test quote",
                        "classification_confidence": 0.9
                    }
                ]
            }

            result = await fact_checker.verify_claim(
                mock_claims[0]["claim"],
                mock_claims[0]["context"]
            )
            
            assert result.verified == case["should_verify"]
            assert result.confidence == case["confidence"]

@pytest.mark.asyncio
async def test_error_handling(fact_checker):
    with pytest.raises(ValueError):
        await fact_checker.verify_claim("", "")  # Empty claim and context

    with pytest.raises(ValueError):
        await fact_checker.verify_claims([], "")  # Empty claims list

@pytest.mark.asyncio
async def test_performance_requirements(fact_checker, mock_claims, mock_verification_results):
    with patch("app.core.gemini.client.GeminiClient.verify_claim") as mock_verify:
        mock_verify.return_value = mock_verification_results[0]

        import time
        start_time = time.time()

        result = await fact_checker.verify_claim(
            mock_claims[0]["claim"],
            mock_claims[0]["context"]
        )

        end_time = time.time()
        processing_time = end_time - start_time

        assert processing_time < 5.0  # Maximum 5 seconds for verification
        assert result.verified is True
        assert result.confidence > 0.7  # Minimum confidence threshold 