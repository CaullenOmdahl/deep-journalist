import pytest
from bs4 import BeautifulSoup
from unittest.mock import patch, MagicMock
from app.scrapers.extractors.content_extractor import ContentExtractor
from app.scrapers.bypass.paywall_bypass import PaywallBypass

@pytest.fixture
def content_extractor():
    """Create a ContentExtractor instance for testing."""
    return ContentExtractor(min_content_length=50)  # Lower threshold for testing

@pytest.fixture
def mock_html_content():
    """Create sample HTML content for testing."""
    return """
    <html>
        <head>
            <title>Test Article Title</title>
            <meta name="author" content="Test Author">
            <meta name="description" content="Test Description">
            <meta name="article:published_time" content="2024-01-01">
        </head>
        <body>
            <article>
                <h1>Test Article</h1>
                <p>This is a test article with enough content to meet the minimum length requirement. 
                It contains multiple paragraphs and should be properly extracted by our content extractor.
                We need to ensure it works correctly.</p>
                <div class="comment">This is a comment</div>
            </article>
        </body>
    </html>
    """

@pytest.fixture
def mock_paywall_html():
    return """
    <html>
        <body>
            <div class="paywall-message">
                Subscribe to continue reading
            </div>
            <div class="article-preview">
                <p>Preview of the article content...</p>
            </div>
        </body>
    </html>
    """

@pytest.mark.asyncio
async def test_extract_content_success(content_extractor):
    """Test successful content extraction."""
    html = """
    <html>
        <head>
            <title>Test Article</title>
            <meta name="author" content="Test Author">
            <meta name="date" content="2024-03-20">
            <link rel="canonical" href="https://example.com/article">
        </head>
        <body>
            <article>
                <h1>Test Article</h1>
                <p>This is a test article with some content.</p>
                <p>It contains multiple paragraphs for testing.</p>
            </article>
        </body>
    </html>
    """
    result = await content_extractor.extract_content(html)
    
    assert isinstance(result, dict)
    assert 'content' in result
    assert 'metadata' in result
    assert len(result['content']) > 0

@pytest.mark.asyncio
async def test_extract_metadata(content_extractor):
    """Test metadata extraction."""
    html = """
    <html>
        <head>
            <title>Test Article</title>
            <meta name="author" content="Test Author">
            <meta name="date" content="2024-03-20">
            <link rel="canonical" href="https://example.com/article">
        </head>
        <body>
            <article>
                <h1>Test Article</h1>
                <p>Test content.</p>
            </article>
        </body>
    </html>
    """
    result = await content_extractor.extract_content(html)
    
    assert 'metadata' in result
    metadata = result['metadata']
    assert metadata['title'] == 'Test Article'
    assert metadata['author'] == 'Test Author'
    assert metadata['date'] == '2024-03-20'
    assert metadata['canonical_url'] == 'https://example.com/article'

@pytest.mark.asyncio
async def test_paywall_detection(content_extractor):
    """Test paywall detection."""
    html = """
    <html>
        <body>
            <div class="paywall">
                <p>Subscribe to continue reading</p>
            </div>
        </body>
    </html>
    """
    soup = BeautifulSoup(html, 'html.parser')
    result = content_extractor._detect_paywall(soup)
    assert result == True  # Should detect paywall due to class name

@pytest.mark.asyncio
async def test_content_cleaning(content_extractor):
    """Test content cleaning."""
    html = """
    <html>
        <body>
            <article>
                <script>alert('test');</script>
                <style>.test { color: red; }</style>
                <nav>Navigation</nav>
                <header>Header</header>
                <footer>Footer</footer>
                <p>Clean content.</p>
            </article>
        </body>
    </html>
    """
    result = await content_extractor.extract_content(html)
    
    assert 'script' not in result['content'].lower()
    assert 'style' not in result['content'].lower()
    assert 'navigation' not in result['content'].lower()
    assert 'header' not in result['content'].lower()
    assert 'footer' not in result['content'].lower()
    assert 'clean content' in result['content'].lower()

@pytest.mark.asyncio
async def test_malformed_html_handling(content_extractor):
    """Test handling of malformed HTML."""
    malformed_html = """
    <html>
        <body>
            <article>
                <p>This is a test article with proper content
                that should be extracted despite malformed HTML.
                The content is meaningful and should be preserved.</p>
            </article>
    """
    result = await content_extractor.extract_content(malformed_html)
    
    assert len(result['content']) > 0
    assert 'test article' in result['content'].lower()
    assert 'content is meaningful' in result['content'].lower()

@pytest.mark.asyncio
async def test_empty_content_handling(content_extractor):
    """Test handling of empty content."""
    html = """
    <html>
        <body>
            <article></article>
        </body>
    </html>
    """
    result = await content_extractor.extract_content(html)
    
    assert result['content'] == ''
    assert result['word_count'] == 0

@pytest.mark.asyncio
async def test_short_content_warning(content_extractor):
    """Test warning for short content."""
    html = """
    <html>
        <body>
            <article>
                <p>Too short.</p>
            </article>
        </body>
    </html>
    """
    result = await content_extractor.extract_content(html)
    
    assert result['word_count'] < 10
    assert result['content'] == 'Too short.'

@pytest.mark.asyncio
async def test_multiple_article_handling(content_extractor):
    """Test handling of multiple article tags."""
    html = """
    <html>
        <body>
            <article>
                <p>First article content.</p>
            </article>
            <article>
                <p>Second article content.</p>
            </article>
        </body>
    </html>
    """
    result = await content_extractor.extract_content(html)
    
    assert 'first article' in result['content'].lower()
    assert 'second article' in result['content'].lower() 