"""
Content extraction module for news articles.
"""
from typing import Dict, List, Optional, Any, TYPE_CHECKING
from urllib.parse import urljoin
import re
from datetime import datetime
import aiohttp

from bs4 import BeautifulSoup
from readability import Document
from loguru import logger

from app.scrapers.base_scraper import BaseScraper
from app.utils.logging.logger import get_logger
from app.scrapers.bypass.paywall_bypass import PaywallBypass

if TYPE_CHECKING:
    from app.scrapers.bypass.paywall_bypass import PaywallBypass

logger = get_logger(__name__)

class ContentExtractor(BaseScraper):
    """Extract content and metadata from HTML."""

    def __init__(self, min_content_length: int = 100, test_mode: bool = False):
        """Initialize the content extractor.
        
        Args:
            min_content_length: Minimum length of content to extract (default: 100)
            test_mode: Whether to run in test mode (default: False)
        """
        super().__init__(min_content_length=min_content_length, test_mode=test_mode)
        self.min_content_length = min_content_length
        self.excluded_tags = {'script', 'style', 'nav', 'header', 'footer', 'aside'}
        self.test_mode = test_mode
        self._test_content = None
        self._test_metadata = None

    def set_test_content(self, content: Dict[str, Any]) -> None:
        """Set test content and metadata.
        
        Args:
            content: Dictionary containing content and metadata
        """
        self._test_content = content

    async def extract_content(self, html: str) -> Dict[str, Any]:
        """
        Extract content and metadata from HTML.
        
        Args:
            html: HTML content to extract from
            
        Returns:
            Dict containing extracted content and metadata
        """
        if self.test_mode and self._test_content is not None:
            return self._test_content
            
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Remove unwanted elements
            for tag in soup.find_all(['script', 'style', 'iframe']):
                tag.decompose()
                
            # Check for paywall
            has_paywall = self._detect_paywall(soup)
            
            # Extract main content
            doc = Document(html)
            content = doc.summary()
            
            # If no content from readability, try article tags
            if not content:
                articles = soup.find_all('article')
                if articles:
                    content = ' '.join(article.get_text() for article in articles)
                    
            # Clean content
            content = self._clean_content(content)
            
            # Extract metadata
            metadata = {
                'title': doc.title() or '',
                'author': self._extract_author(soup) or '',
                'date': self._extract_date(soup),
                'canonical_url': self._extract_canonical_url(soup) or ''
            }
            
            # Get word count
            word_count = len(content.split())
            
            # Log warning if content is too short
            if word_count < 100:
                logger.warning("Content length below minimum threshold")
                
            return {
                'content': content,
                'metadata': metadata,
                'word_count': word_count,
                'has_paywall': has_paywall
            }
            
        except Exception as e:
            logger.error(f"Failed to extract content: {str(e)}")
            raise

    def _extract_title(self, soup: BeautifulSoup) -> str:
        """Extract article title."""
        # Try meta tags first
        meta_title = soup.find('meta', {'property': 'og:title'})
        if meta_title and meta_title.get('content'):
            return meta_title['content']

        meta_title = soup.find('meta', {'name': 'twitter:title'})
        if meta_title and meta_title.get('content'):
            return meta_title['content']

        # Try h1 tag
        h1 = soup.find('h1')
        if h1:
            return h1.get_text(strip=True)

        # Fall back to title tag
        title = soup.find('title')
        if title:
            return title.get_text(strip=True)

        return ''

    def _extract_author(self, soup: BeautifulSoup) -> str:
        """Extract article author."""
        # Try meta tags
        meta_author = soup.find('meta', {'name': 'author'})
        if meta_author and meta_author.get('content'):
            return meta_author['content']

        # Try schema.org markup
        author = soup.find('meta', {'property': 'article:author'})
        if author and author.get('content'):
            return author['content']

        # Try byline class
        byline = soup.find(class_=re.compile(r'byline|author'))
        if byline:
            return byline.get_text(strip=True)

        return ''

    def _extract_date(self, soup: BeautifulSoup) -> str:
        """Extract article date."""
        # Try meta tags
        for meta in soup.find_all('meta'):
            if meta.get('name') in ['date', 'article:published_time', 'publication_date']:
                return meta.get('content', '')
            
        # Try time tag
        time = soup.find('time')
        if time and time.get('datetime'):
            return time['datetime']

        return ''

    def _extract_canonical_url(self, soup: BeautifulSoup) -> str:
        """Extract canonical URL."""
        canonical = soup.find('link', {'rel': 'canonical'})
        if canonical and canonical.get('href'):
            return canonical['href']
        return ''

    def _clean_content(self, content: str) -> str:
        """Clean extracted content by removing unwanted elements and formatting."""
        # Remove unwanted HTML elements
        soup = BeautifulSoup(content, 'html.parser')
        
        # Remove script, style, nav, header, footer tags
        for tag in soup.find_all(['script', 'style', 'nav', 'header', 'footer']):
            tag.decompose()
            
        # Get text content
        text = soup.get_text(separator=' ')
        
        # Clean up whitespace
        text = ' '.join(text.split())
        
        # Remove URLs
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
        
        # Remove special characters
        text = re.sub(r'[^\w\s.,!?-]', '', text)
        
        return text.strip()

    def _detect_paywall(self, soup: BeautifulSoup) -> bool:
        """Detect if the article has a paywall.
        
        Args:
            soup: BeautifulSoup object of the article HTML
            
        Returns:
            True if a paywall is detected, False otherwise
        """
        # Common paywall indicators
        paywall_classes = {
            'paywall', 'subscription-required', 'premium-content',
            'subscriber-only', 'paid-content', 'restricted-content'
        }
        
        paywall_text = {
            'subscribe to continue',
            'subscription required',
            'premium article',
            'subscribe now',
            'sign up to read',
            'premium content',
            'subscribers only',
            'register to continue'
        }
        
        # Check for paywall elements by class
        for element in soup.find_all(class_=lambda x: x and any(p in x.lower() for p in paywall_classes)):
            return True
            
        # Check for paywall text
        page_text = soup.get_text().lower()
        if any(text in page_text for text in paywall_text):
            return True
            
        # Check for login/subscribe buttons near article content
        article = soup.find('article') or soup
        if article:
            buttons = article.find_all(['button', 'a'])
            for button in buttons:
                text = button.get_text().lower()
                if any(p in text for p in {'subscribe', 'sign in', 'log in', 'register'}):
                    return True
                    
        return False

    async def extract_article(self, url: str) -> Dict[str, str]:
        """
        Extract article content and metadata.
        
        Args:
            url: Article URL
            
        Returns:
            Dictionary containing article content and metadata
        """
        try:
            logger.info(f"Extracting content from {url}")
            
            # Try normal extraction first
            await self.navigate(url)
            content = await self.get_content()
            
            # Check for paywall
            if not content or await self._is_blocked():
                logger.info("Content blocked, attempting paywall bypass")
                async with self.paywall_bypass as bypass:
                    content = await bypass.bypass_paywall(url)
                    
            if not content:
                raise ValueError("Failed to extract content")
                
            # Parse content
            article = self._parse_article(content, url)
            
            logger.info(f"Successfully extracted article: {article['title']}")
            return article
            
        except Exception as e:
            logger.error(f"Content extraction failed: {str(e)}")
            raise
            
    async def _is_blocked(self) -> bool:
        """Check if content is blocked by paywall."""
        try:
            # Check common paywall indicators
            blocked_text = [
                "subscribe",
                "subscription",
                "premium",
                "register",
                "sign up",
            ]
            
            content = await self.get_content()
            content_lower = content.lower()
            
            # Check if content is very short (likely blocked)
            if len(content) < 1000:
                return any(text in content_lower for text in blocked_text)
                
            return False
            
        except Exception as e:
            logger.error(f"Block check failed: {str(e)}")
            return True
            
    def _parse_article(self, html: str, url: str) -> Dict[str, str]:
        """
        Parse article content from HTML.
        
        Args:
            html: Raw HTML content
            url: Article URL
            
        Returns:
            Dictionary containing parsed article data
        """
        try:
            # Use readability for main content
            doc = Document(html)
            
            # Use BeautifulSoup for detailed extraction
            soup = BeautifulSoup(html, 'html.parser')
            
            # Extract content using multiple methods
            content = doc.summary()
            title = self._extract_title(soup) or doc.title()
            
            # Extract metadata
            author = self._extract_metadata(soup, "author")
            date = self._extract_metadata(soup, "date")
            
            # Extract and process links
            links = self._extract_links(soup, url)
            
            return {
                "title": title,
                "content": content,
                "author": author,
                "date": date,
                "url": url,
                "links": links,
            }
            
        except Exception as e:
            logger.error(f"HTML parsing failed: {str(e)}")
            raise
            
    def _extract_metadata(self, soup: BeautifulSoup, field: str) -> Optional[str]:
        """Extract metadata field."""
        for selector in self.CONTENT_SELECTORS[field]:
            element = soup.select_one(selector)
            if element:
                return element.get_text().strip()
        return None
        
    def _extract_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Extract and normalize links from content."""
        links = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            # Convert relative URLs to absolute
            absolute_url = urljoin(base_url, href)
            # Filter out non-article links
            if self._is_article_link(absolute_url):
                links.append(absolute_url)
        return links
        
    @staticmethod
    def _is_article_link(url: str) -> bool:
        """Check if URL likely points to an article."""
        # Simple heuristic - can be improved
        return any(x in url for x in [
            '/article/',
            '/story/',
            '/news/',
            '/opinion/',
            '.html',
        ])

    async def get_content(self) -> str:
        """
        Get the raw HTML content from the current page.

        Returns:
            str: Raw HTML content of the page

        Raises:
            ValueError: If page content cannot be retrieved
        """
        try:
            # Get page content using Playwright
            content = await self.page.content()
            if not content:
                raise ValueError("Empty page content")
            return content
        except Exception as e:
            logger.error(f"Failed to get page content: {str(e)}")
            raise ValueError(f"Failed to get page content: {str(e)}")

    async def _get_html(self, url: str) -> str:
        """Get HTML content from URL using aiohttp."""
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    raise ValueError(f"Failed to fetch URL: {response.status}")
                return await response.text() 