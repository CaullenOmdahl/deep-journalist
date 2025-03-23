"""
Base web scraper implementation using Playwright.
"""
import asyncio
from typing import Dict, Optional, Any, TYPE_CHECKING
from urllib.parse import urlparse
from abc import ABC, abstractmethod
import aiohttp
from bs4 import BeautifulSoup
import re
from datetime import datetime
from loguru import logger
from fastapi import HTTPException

from playwright.async_api import Browser, Page, Playwright, async_playwright

from app.core.config.settings import get_settings

if TYPE_CHECKING:
    from app.scrapers.bypass.paywall_bypass import PaywallBypass

class ScrapingError(Exception):
    """Custom exception for scraping errors."""
    pass

class BaseScraper(ABC):
    """Base class for web scraping with content extraction capabilities."""
    
    # Common article content selectors
    CONTENT_SELECTORS = [
        "article",
        "main",
        "[role='main']",
        ".article-content",
        ".post-content",
        ".entry-content",
        "#content",
        ".content",
    ]

    def __init__(self, min_content_length: int = 100, test_mode: bool = False):
        """Initialize the scraper with minimum content length."""
        self.min_content_length = min_content_length
        self._playwright: Optional[Playwright] = None
        self._browser: Optional[Browser] = None
        self._page: Optional[Page] = None
        self._settings = get_settings()
        self._html: Optional[str] = None
        self.session = None
        self.test_mode = test_mode
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    async def __aenter__(self):
        """Set up the scraper when entering context."""
        await self.setup()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Clean up resources when exiting context."""
        await self.cleanup()

    async def setup(self) -> None:
        """Initialize Playwright browser and page."""
        if not self.test_mode:
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=True,
                args=[
                    "--disable-gpu",
                    "--disable-dev-shm-usage",
                    "--disable-setuid-sandbox",
                    "--no-sandbox",
                ]
            )
            self._page = await self._browser.new_page()
            await self._add_stealth_scripts()

    async def cleanup(self) -> None:
        """Clean up Playwright resources."""
        if not self.test_mode:
            if self._page:
                await self._page.close()
            if self._browser:
                await self._browser.close()
            if self._playwright:
                await self._playwright.stop()

    async def _add_stealth_scripts(self) -> None:
        """Add stealth scripts to avoid detection."""
        if self._page:
            await self._page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                })
            """)

    async def navigate(self, url: str, timeout: int = 30000) -> None:
        """Navigate to a URL and wait for load."""
        if not self._page:
            raise RuntimeError("Page not initialized")
        try:
            await self._page.goto(url, wait_until="networkidle", timeout=timeout)
        except Exception as e:
            raise ScrapingError(f"Failed to navigate to {url}: {str(e)}")

    async def get_content(self) -> str:
        """Get the page content."""
        if not self._page:
            raise RuntimeError("Page not initialized")
        try:
            return await self._page.content()
        except Exception as e:
            raise ScrapingError(f"Failed to get page content: {str(e)}")

    async def wait_for_selector(
        self,
        selector: str,
        timeout: int = 5000,
        state: str = "visible"
    ) -> None:
        """Wait for an element to be present."""
        if not self._page:
            raise RuntimeError("Page not initialized")
        try:
            await self._page.wait_for_selector(selector, timeout=timeout, state=state)
        except Exception as e:
            logger.warning(f"Timeout waiting for selector {selector}: {str(e)}")

    async def extract_text(self, selector: str) -> str:
        """Extract text from an element."""
        if not self._page:
            raise RuntimeError("Page not initialized")
        try:
            element = await self._page.query_selector(selector)
            if element:
                return (await element.text_content() or "").strip()
        except Exception as e:
            logger.warning(f"Error extracting text from {selector}: {str(e)}")
        return ""

    @staticmethod
    def get_domain(url: str) -> str:
        """Extract domain from URL."""
        return urlparse(url).netloc

    async def scrape_article(self, url: str) -> str:
        """Scrape article from URL.
        
        Args:
            url: URL to scrape
            
        Returns:
            str: Article HTML content
            
        Raises:
            HTTPException: If scraping fails
        """
        try:
            html = await self._get_html(url)
            if not html:
                raise ScrapingError("Failed to get HTML content")
            return html
        except ScrapingError as e:
            logger.error(f"Failed to scrape article from {url}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
        except Exception as e:
            logger.error(f"Failed to scrape article from {url}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to scrape article: {str(e)}")
        finally:
            if self.session:
                await self.session.close()

    async def _get_html(self, url: str) -> str:
        """Get HTML content from URL.
        
        Args:
            url: URL to fetch
            
        Returns:
            str: HTML content
            
        Raises:
            ScrapingError: If fetching fails
        """
        if self.test_mode:
            return self._html or "<html><body>Test content</body></html>"
            
        try:
            async with aiohttp.ClientSession(headers=self.headers) as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        return await response.text()
                    elif response.status == 403:
                        raise ScrapingError("Access denied - possible paywall")
                    elif response.status == 404:
                        raise ScrapingError("Page not found")
                    elif response.status == 429:
                        raise ScrapingError("Rate limit exceeded")
                    else:
                        raise ScrapingError(f"HTTP error {response.status}")
        except aiohttp.ClientError as e:
            raise ScrapingError(f"Failed to fetch URL: {str(e)}")
        except Exception as e:
            raise ScrapingError(f"Unexpected error: {str(e)}")

    @abstractmethod
    async def extract_content(self, html: str) -> Dict[str, Any]:
        """Extract content from HTML.
        
        Args:
            html: HTML content to parse
            
        Returns:
            Dict containing extracted content and metadata
        """
        pass 