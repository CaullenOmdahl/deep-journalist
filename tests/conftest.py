"""
Pytest configuration for Deep-Journalist tests.
"""
import asyncio
import os
from typing import AsyncGenerator, Generator, Dict, Any, List

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from playwright.async_api import async_playwright, Browser, Page, Playwright
from unittest.mock import patch, MagicMock, AsyncMock

from app.main import app
from app.utils.logging.logger import setup_logging
from app.core.config import AIConfig
from app.analysis.article_analyzer import ArticleAnalyzer
from app.analysis.fact_check.verifier import FactChecker
from app.core.gemini.client import GeminiClient
from app.scrapers.base_scraper import BaseScraper
from app.scrapers.extractors.content_extractor import ContentExtractor
from app.scrapers.bypass.paywall_bypass import PaywallBypass

# Setup logging for tests
setup_logging()

# FastAPI test client
@pytest.fixture(scope="module")
def client() -> Generator:
    """Create FastAPI test client."""
    with TestClient(app) as test_client:
        yield test_client

# Playwright fixtures
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def playwright() -> AsyncGenerator[Playwright, None]:
    """Create Playwright instance."""
    async with async_playwright() as playwright:
        yield playwright

@pytest.fixture(scope="session")
async def browser(playwright: Playwright) -> AsyncGenerator[Browser, None]:
    """Create browser instance."""
    browser = await playwright.chromium.launch(
        headless=True,  # Set to False for debugging
        args=[
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
        ]
    )
    yield browser
    await browser.close()

@pytest.fixture
async def page(browser: Browser) -> AsyncGenerator[Page, None]:
    """Create new page for each test."""
    page = await browser.new_page(
        viewport={'width': 1920, 'height': 1080},
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/91.0.4472.124 Safari/537.36"
        )
    )
    yield page
    await page.close()

@pytest.fixture(autouse=True)
def _setup_testing_environment():
    """Setup environment variables for testing."""
    # Load environment variables from .env.test
    load_dotenv(".env.test", override=True)
    
# Test data fixtures
@pytest.fixture
def mock_article_data():
    """Return mock article data for testing."""
    return {
        'url': 'https://example.com/article',
        'title': 'Test Article',
        'content': 'This is a test article with some content.',
        'author': 'Test Author',
        'date_published': '2024-03-20'
    }

@pytest.fixture
def mock_bias_analysis():
    """Return mock bias analysis results for testing."""
    return {
        'political_bias': 'neutral',
        'loaded_language': ['controversial', 'extreme'],
        'subjective_statements': ['This is a subjective statement']
    }

@pytest.fixture
def mock_fact_check():
    """Return mock fact check results for testing."""
    return {
        'claims': ['This is a claim that needs verification'],
        'needs_verification': True,
        'citations': ['https://example.com/source']
    }

@pytest.fixture
def mock_gemini_response():
    """Return mock Gemini API response for testing."""
    return {
        'bias_analysis': {
            'political_bias': 'neutral',
            'loaded_language': ['controversial', 'extreme'],
            'subjective_statements': ['This is a subjective statement']
        },
        'fact_check': {
            'claims': ['This is a claim that needs verification'],
            'needs_verification': True,
            'citations': ['https://example.com/source']
        },
        'source_analysis': {
            'reliability': 'high',
            'type': 'news',
            'credibility_indicators': ['professional writing', 'cited sources']
        }
    }

@pytest.fixture
def mock_verification_results():
    """Mock verification results from Gemini."""
    return [{
        "claim": "Global temperatures have risen by 1.5°C",
        "verified": True,
        "confidence": 0.95,
        "evidence": "Multiple scientific studies confirm this trend",
        "sources": [{
            "url": "https://example.com/study",
            "title": "Climate Study",
            "type": "academic",
            "credibility_score": 0.9,
            "exactQuote": "Global temperatures have increased by 1.5 degrees Celsius"
        }]
    }]

@pytest.fixture
def mock_claims() -> List[Dict[str, str]]:
    """Mock claims extracted from text."""
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
def mock_article_text() -> str:
    """Mock article text for testing."""
    return """
    This is a test article about a controversial topic.
    Some people believe one thing, while others believe another.
    The government has made several decisions on this matter.
    Experts suggest that more research is needed.
    """

@pytest.fixture
def mock_article_html():
    """Return mock HTML content for testing."""
    return """
    <html>
        <head>
            <title>Test Article Title</title>
            <meta name="author" content="Test Author">
            <meta name="description" content="Test Description">
            <meta name="date" content="2024-01-01">
            <link rel="canonical" href="https://example.com/test-article">
        </head>
        <body>
            <article>
                <h1>Test Article Title</h1>
                <p>This is a test article with sufficient content length for testing purposes.
                It includes multiple paragraphs to ensure proper content extraction and analysis.
                The content needs to be long enough to meet minimum requirements.</p>
                <p>Additional paragraph with more content to ensure proper testing of the extraction
                process. This helps validate the content cleaning and processing functionality.</p>
            </article>
        </body>
    </html>
    """

@pytest.fixture
def mock_paywall_html() -> str:
    """Mock HTML with paywall."""
    return """
    <html>
        <body>
            <div class="paywall-message">
                Subscribe to continue reading...
            </div>
            <div class="article-preview">
                <p>Preview of the article content...</p>
            </div>
        </body>
    </html>
    """

# Mock Gemini services
@pytest.fixture
def mock_gemini_services(monkeypatch):
    """Mock Gemini services."""
    # Mock GeminiClient
    mock_client = MagicMock()
    mock_client.analyze_bias = AsyncMock(return_value=MagicMock(
        political_bias="neutral",
        loaded_language=["controversial", "extreme"],
        subjective_statements=["This is a subjective statement"]
    ))
    mock_client.extract_citations = AsyncMock(return_value=MagicMock(
        citations=["https://example.com/source"],
        claims=["This is a claim that needs verification"]
    ))
    monkeypatch.setattr("app.core.gemini.client.GeminiClient", lambda: mock_client)
    
    return mock_client

@pytest.fixture
def mock_ai_config():
    """Create a mock AI configuration for testing."""
    config = AIConfig(test_mode=True)
    return config

@pytest.fixture
async def analyzer(mock_ai_config):
    """Create an ArticleAnalyzer instance for testing."""
    return ArticleAnalyzer(test_mode=True)

@pytest.fixture
def fact_checker():
    """Create a FactChecker instance for testing."""
    return FactChecker()

@pytest.fixture
def gemini_client():
    """Create a GeminiClient instance for testing."""
    return GeminiClient()

@pytest.fixture
def base_scraper():
    """Create a BaseScraper instance for testing."""
    return BaseScraper()

@pytest.fixture
async def content_extractor():
    """Create a ContentExtractor instance for testing."""
    extractor = ContentExtractor()
    return extractor

@pytest.fixture
def mock_paywall_bypass():
    """Create a mock PaywallBypass instance for testing."""
    bypass = MagicMock(spec=PaywallBypass)
    bypass.detect_paywall = AsyncMock(return_value=False)
    return bypass

@pytest.fixture
def mock_scraper(mock_paywall_bypass):
    """Create a mock scraper for testing."""
    scraper = MagicMock()
    scraper.scrape_article = AsyncMock(return_value={
        "content": "Test article content",
        "metadata": {
            "title": "Test Title",
            "author": "Test Author",
            "date": "2024-01-01"
        }
    })
    scraper.paywall_bypass = mock_paywall_bypass
    return scraper

@pytest.fixture
def mock_gemini_response():
    """Return mock Gemini API response for testing."""
    return {
        "bias_analysis": {
            "political_bias": "neutral",
            "loaded_language": ["test word"],
            "subjective_statements": ["test statement"]
        },
        "fact_check": {
            "claims": ["test claim"],
            "sources": ["test source"],
            "verification_needed": True
        },
        "summary": "Test summary of the article content."
    }

@pytest.fixture
def mock_fact_check():
    """Return mock fact check results for testing."""
    return {
        "claims": ["test claim"],
        "sources": ["test source"],
        "verification_needed": True
    }

@pytest.fixture
def mock_bias_analysis():
    """Return mock bias analysis results for testing."""
    return {
        "political_bias": "neutral",
        "loaded_language": ["test word"],
        "subjective_statements": ["test statement"]
    }

@pytest.fixture
def mock_article_data():
    """Return mock article data for testing."""
    return {
        "url": "https://example.com/test-article",
        "title": "Test Article",
        "content": "Test article content for analysis",
        "author": "Test Author",
        "date": "2024-01-01"
    }

@pytest.fixture
async def mock_page(browser: Browser) -> AsyncGenerator[Page, None]:
    """Create a mock page for testing analysis quality."""
    page = await browser.new_page()
    
    # Mock the goto method to handle test article URLs
    async def mock_goto(url: str, **kwargs):
        if "balanced-article" in url:
            await page.set_content("""
                <article>
                    <h1>Balanced Article</h1>
                    <p>This is a balanced article with multiple primary sources.</p>
                    <cite>Source: Harvard Study</cite>
                    <cite>Source: Stanford Research</cite>
                    <cite>Source: MIT Paper</cite>
                </article>
            """)
        elif "biased-article" in url:
            await page.set_content("""
                <article>
                    <h1>Biased Article</h1>
                    <p>This article shows clear bias with loaded language.</p>
                    <cite>Source: Opinion Blog</cite>
                </article>
            """)
        elif "comprehensive-article" in url:
            await page.set_content("""
                <article>
                    <h1>Comprehensive Article</h1>
                    <p>A thorough analysis with extensive sourcing.</p>
                    <cite>Source: Academic Journal</cite>
                    <cite>Source: Government Report</cite>
                    <cite>Source: Research Institute</cite>
                    <cite>Source: Expert Interview</cite>
                </article>
            """)
    
    # Replace the goto method with our mock
    page.goto = mock_goto
    
    yield page
    await page.close() 