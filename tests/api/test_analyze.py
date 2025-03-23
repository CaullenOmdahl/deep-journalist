import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from app.main import app
from app.analysis.article_analyzer import ArticleAnalyzer
from app.scrapers.base_scraper import BaseScraper
from app.scrapers.bypass.paywall_bypass import PaywallBypass
from app.scrapers.extractors.content_extractor import ContentExtractor
from app.models.domain.article import BiasAnalysis, UrlCitation, Annotation

client = TestClient(app)

@pytest.fixture
def mock_article_html():
    return """
    <html>
        <head><title>Test Article</title></head>
        <body>
            <article>
                <h1>Test Article</h1>
                <p>This is a test article content.</p>
            </article>
        </body>
    </html>
    """

@pytest.fixture
def mock_bias_analysis():
    return BiasAnalysis(
        political_bias="neutral",
        loaded_language=["obviously"],
        subjective_statements=["This is a test article content."],
        neutral_language_score=0.85,
        bias_score=0.3,
        perspective_balance=0.8,
        detected_bias_types=["none detected"],
        suggestions=["The text appears to be relatively neutral"],
        source_diversity_score=0.0,
        factual_accuracy_score=0.0,
        raw_analysis={
            "political_bias": "neutral",
            "bias_types": ["none detected"],
            "perspective_balance": 0.8,
            "suggestions": ["The text appears to be relatively neutral"]
        }
    )

@pytest.fixture
def mock_analyzer():
    analyzer = MagicMock()
    analyzer.analyze_bias = AsyncMock(return_value=mock_bias_analysis)
    analyzer.generate_annotations = AsyncMock(return_value=[
        Annotation(
            text="Test annotation",
            type="url_citation",
            category="fact",
            confidence=0.8,
            requires_verification=True,
            url_citation=UrlCitation(
                url="https://example.com",
                title="Test Source",
                text="Test citation",
                source="Test Source",
                context="Test context",
                exactQuote="Test citation",
                confidence=0.8,
                verified=False
            )
        )
    ])
    analyzer.classify_source = MagicMock(return_value={
        "type": "news",
        "reliability_score": 0.8,
        "credibility_score": 0.8,
        "classification_confidence": 0.9,
        "metadata": {
            "is_primary": False
        }
    })
    return analyzer

@pytest.fixture
def mock_scraper(mock_article_html):
    scraper = ContentExtractor(test_mode=True)
    scraper._html = mock_article_html
    scraper.extract_content = AsyncMock(return_value={
        'content': 'Test content',
        'metadata': {
            'title': 'Test Article',
            'author': 'Test Author',
            'date': '2024-03-20',
            'canonical_url': 'https://example.com/article'
        },
        'word_count': 10,
        'has_paywall': False
    })
    return scraper

@pytest.mark.asyncio
async def test_analyze_article_success(mock_article_html, mock_analyzer, mock_scraper):
    """Test successful article analysis."""
    url = "https://example.com/article"
    
    # Mock the dependencies
    with patch('app.api.routes.analyze.ArticleAnalyzer', return_value=mock_analyzer):
        app.dependency_overrides = {
            'get_scraper': lambda: mock_scraper
        }
        
        response = client.post("/api/analyze", json={"url": url})
        
        assert response.status_code == 200
        data = response.json()
        assert "bias_analysis" in data
        assert "fact_check" in data
        assert "source_analysis" in data
        assert "content" in data
        assert "annotations" in data

@pytest.mark.asyncio
async def test_analyze_article_paywall_detection(mock_scraper):
    """Test paywall detection."""
    url = "https://example.com/paywalled-article"
    
    # Configure mock scraper for paywall
    mock_scraper.extract_content = AsyncMock(return_value={
        'content': '',
        'metadata': {},
        'word_count': 0,
        'has_paywall': True
    })
    
    # Mock the dependencies
    app.dependency_overrides = {
        'get_scraper': lambda: mock_scraper
    }
    
    response = client.post("/api/analyze", json={"url": url})
    assert response.status_code == 402
    data = response.json()
    assert "error" in data
    assert "paywall" in data
    assert data["paywall"] is True

@pytest.mark.asyncio
async def test_analyze_article_scraping_error(mock_scraper):
    """Test handling of scraping errors."""
    url = "https://example.com/error"
    
    # Configure mock scraper to raise error
    mock_scraper.scrape_article = AsyncMock(side_effect=Exception("Failed to scrape"))
    
    # Mock the dependencies
    app.dependency_overrides = {
        'get_scraper': lambda: mock_scraper
    }
    
    response = client.post("/api/analyze", json={"url": url})
    assert response.status_code == 500
    data = response.json()
    assert "detail" in data
    assert "Failed to scrape" in data["detail"]

@pytest.mark.asyncio
async def test_analyze_article_rate_limit(mock_scraper):
    """Test rate limiting."""
    url = "https://example.com/article"
    
    # Configure mock scraper for rate limit
    mock_scraper.scrape_article = AsyncMock(side_effect=Exception("Rate limit exceeded"))
    
    # Mock the dependencies
    app.dependency_overrides = {
        'get_scraper': lambda: mock_scraper
    }
    
    response = client.post("/api/analyze", json={"url": url})
    assert response.status_code == 429
    data = response.json()
    assert "error" in data
    assert "rate limit" in data["error"].lower()

@pytest.mark.asyncio
async def test_analyze_article_performance(mock_analyzer, mock_scraper):
    """Test article analysis performance."""
    url = "https://example.com/article"
    
    # Mock the dependencies
    with patch('app.api.routes.analyze.ArticleAnalyzer', return_value=mock_analyzer):
        app.dependency_overrides = {
            'get_scraper': lambda: mock_scraper
        }
        
        response = client.post("/api/analyze", json={"url": url})
        
        assert response.elapsed.total_seconds() < 5.0  # Should complete within 5 seconds
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_analyze_article_content_validation(mock_article_html, mock_analyzer, mock_scraper):
    """Test content validation in response."""
    url = "https://example.com/article"
    
    # Mock the dependencies
    with patch('app.api.routes.analyze.ArticleAnalyzer', return_value=mock_analyzer):
        app.dependency_overrides = {
            'get_scraper': lambda: mock_scraper
        }
        
        response = client.post("/api/analyze", json={"url": url})
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate bias analysis
        assert "bias_analysis" in data
        bias = data["bias_analysis"]
        assert "political_bias" in bias
        assert "loaded_language" in bias
        assert isinstance(bias["loaded_language"], list)
        
        # Validate fact check
        assert "fact_check" in data
        facts = data["fact_check"]
        assert "claims" in facts
        assert "needs_verification" in facts
        assert isinstance(facts["claims"], list)
        
        # Validate source analysis
        assert "source_analysis" in data
        source = data["source_analysis"]
        assert "type" in source
        assert "reliability" in source
        assert "credibility_indicators" in source 