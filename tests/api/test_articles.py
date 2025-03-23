"""
Tests for article analysis endpoints.
"""
import json
from typing import Dict

import pytest
from fastapi.testclient import TestClient
from playwright.async_api import Page, expect

from app.main import app
from app.utils.logging.logger import get_logger

logger = get_logger(__name__)

# Test client for FastAPI
client = TestClient(app)

# Test article URLs
TEST_ARTICLES = {
    "basic": "https://example.com/test-article",
    "paywall": "https://wsj.com/test-article",
    "complex": "https://nytimes.com/test-article"
}

# Mock HTML content
MOCK_ARTICLE_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Test Article</title>
</head>
<body>
    <article>
        <h1 class="article-title">Test Article Title</h1>
        <div class="author">John Doe</div>
        <div class="date">2024-03-14</div>
        <div class="article-content">
            <p>This is a test article with some claims.</p>
            <p>Claim 1: The Earth is round.</p>
            <p>Claim 2: Water is wet.</p>
            <a href="/source1">Source 1</a>
            <a href="/source2">Source 2</a>
        </div>
    </article>
</body>
</html>
"""

@pytest.fixture
async def mock_page(page: Page):
    """Setup mock page with intercepted requests."""
    
    # Intercept navigation requests
    async def handle_route(route):
        if route.request.url in TEST_ARTICLES.values():
            await route.fulfill(
                status=200,
                body=MOCK_ARTICLE_HTML,
                content_type="text/html"
            )
        else:
            await route.continue_()
            
    await page.route("**/*", handle_route)
    return page

async def test_article_analysis_basic(mock_page: Page):
    """Test basic article analysis without paywall."""
    
    # Navigate to test endpoint
    await mock_page.goto(f"http://localhost:8000/api/docs")
    
    # Expand the /analyze endpoint
    await mock_page.click("text=/analyze")
    
    # Click the "Try it out" button
    await mock_page.click("text=Try it out")
    
    # Fill in the request body
    request_body = {
        "url": TEST_ARTICLES["basic"],
        "include_sources": True,
        "check_facts": True,
        "detect_bias": True
    }
    
    # Find the request body textarea and fill it
    await mock_page.fill("textarea", json.dumps(request_body, indent=2))
    
    # Execute the request
    await mock_page.click("text=Execute")
    
    # Wait for response
    response_pre = mock_page.locator("pre.response-content")
    await expect(response_pre).to_be_visible()
    
    # Get response content
    response_text = await response_pre.text_content()
    response_data = json.loads(response_text)
    
    # Verify response structure
    assert response_data["url"] == TEST_ARTICLES["basic"]
    assert response_data["title"] == "Test Article Title"
    assert len(response_data["sources"]) <= 5
    assert "bias_analysis" in response_data
    assert len(response_data["fact_checks"]) > 0
    
async def test_article_analysis_paywall(mock_page: Page):
    """Test article analysis with paywall bypass."""
    
    # Mock paywall content first
    PAYWALL_HTML = """
    <div class="paywall">
        <h1>Subscribe Now</h1>
        <p>This content is for subscribers only.</p>
    </div>
    """
    
    # Setup paywall interception
    paywall_triggered = False
    
    async def handle_paywall_route(route):
        nonlocal paywall_triggered
        if route.request.url == TEST_ARTICLES["paywall"]:
            if not paywall_triggered:
                paywall_triggered = True
                await route.fulfill(
                    status=200,
                    body=PAYWALL_HTML,
                    content_type="text/html"
                )
            else:
                # Second attempt should succeed
                await route.fulfill(
                    status=200,
                    body=MOCK_ARTICLE_HTML,
                    content_type="text/html"
                )
        else:
            await route.continue_()
            
    await mock_page.route("**/*", handle_paywall_route)
    
    # Navigate to test endpoint
    await mock_page.goto(f"http://localhost:8000/api/docs")
    
    # Expand the /analyze endpoint
    await mock_page.click("text=/analyze")
    
    # Click the "Try it out" button
    await mock_page.click("text=Try it out")
    
    # Fill in the request body
    request_body = {
        "url": TEST_ARTICLES["paywall"],
        "include_sources": True,
        "check_facts": True,
        "detect_bias": True
    }
    
    await mock_page.fill("textarea", json.dumps(request_body, indent=2))
    
    # Execute the request
    await mock_page.click("text=Execute")
    
    # Wait for response
    response_pre = mock_page.locator("pre.response-content")
    await expect(response_pre).to_be_visible()
    
    # Verify response
    response_text = await response_pre.text_content()
    response_data = json.loads(response_text)
    
    assert response_data["url"] == TEST_ARTICLES["paywall"]
    assert response_data["title"] == "Test Article Title"
    assert paywall_triggered  # Verify paywall was detected

async def test_article_analysis_error_handling(mock_page: Page):
    """Test error handling for invalid URLs and failed requests."""
    
    # Navigate to test endpoint
    await mock_page.goto(f"http://localhost:8000/api/docs")
    
    # Expand the /analyze endpoint
    await mock_page.click("text=/analyze")
    
    # Click the "Try it out" button
    await mock_page.click("text=Try it out")
    
    # Test with invalid URL
    request_body = {
        "url": "not-a-valid-url",
        "include_sources": True,
        "check_facts": True,
        "detect_bias": True
    }
    
    await mock_page.fill("textarea", json.dumps(request_body, indent=2))
    
    # Execute the request
    await mock_page.click("text=Execute")
    
    # Wait for response
    response_pre = mock_page.locator("pre.response-content")
    await expect(response_pre).to_be_visible()
    
    # Verify error response
    response_text = await response_pre.text_content()
    response_data = json.loads(response_text)
    
    assert response_data["detail"] is not None
    assert response_data.get("status_code", 400) in [400, 422]

async def test_article_analysis_performance(mock_page: Page):
    """Test performance requirements for article analysis."""
    import time
    
    # Navigate to test endpoint
    await mock_page.goto(f"http://localhost:8000/api/docs")
    
    # Expand the /analyze endpoint
    await mock_page.click("text=/analyze")
    
    # Click the "Try it out" button
    await mock_page.click("text=Try it out")
    
    # Fill in the request body
    request_body = {
        "url": TEST_ARTICLES["basic"],
        "include_sources": True,
        "check_facts": True,
        "detect_bias": True
    }
    
    await mock_page.fill("textarea", json.dumps(request_body, indent=2))
    
    # Measure response time
    start_time = time.time()
    
    # Execute the request
    await mock_page.click("text=Execute")
    
    # Wait for response
    response_pre = mock_page.locator("pre.response-content")
    await expect(response_pre).to_be_visible()
    
    end_time = time.time()
    processing_time = end_time - start_time
    
    # Verify performance requirements
    assert processing_time < 30  # Should complete within 30 seconds 