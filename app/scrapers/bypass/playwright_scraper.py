from typing import Optional, Dict, Any
import asyncio
import logging
from playwright.async_api import async_playwright, Browser, Page, Response
from app.utils.logging import get_logger

logger = get_logger(__name__)

class PlaywrightScraper:
    """Base scraper class using Playwright for headless browsing."""
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context = None
        self.page: Optional[Page] = None
        
    async def __aenter__(self):
        """Initialize browser for use in async context."""
        await self.init_browser()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Cleanup browser resources."""
        await self.cleanup()
        
    async def init_browser(self):
        """Initialize headless browser with required configurations."""
        playwright = await async_playwright().start()
        
        # Browser configuration for optimal scraping
        browser_config = {
            "headless": True,  # Run in headless mode for server environment
            "args": [
                "--disable-web-security",  # Required for some paywall bypasses
                "--disable-features=IsolateOrigins,site-per-process",
                "--disable-site-isolation-trials",
                "--disable-dev-shm-usage",
                "--disable-setuid-sandbox",
                "--no-sandbox",
                "--disable-gpu",
            ]
        }
        
        self.browser = await playwright.chromium.launch(**browser_config)
        
        # Context configuration for paywall bypass
        context_config = {
            "bypass_csp": True,  # Bypass Content Security Policy
            "js_enabled": True,
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "viewport": {"width": 1920, "height": 1080},
            "ignore_https_errors": True
        }
        
        self.context = await self.browser.new_context(**context_config)
        self.page = await self.context.new_page()
        
        # Setup request interception for paywall bypass
        await self.setup_request_interception()
        
    async def setup_request_interception(self):
        """Setup request interception rules for paywall bypass."""
        # Block common paywall-related resources
        await self.page.route("**/{ads,analytics,pixel}.{js,html}", lambda route: route.abort())
        
        # Modify headers to bypass paywalls
        async def handle_headers(route):
            headers = route.request.headers
            headers["Referer"] = "https://www.google.com/"
            headers["DNT"] = "1"
            await route.continue_(headers=headers)
            
        await self.page.route("**/*", handle_headers)
        
    async def navigate(self, url: str, wait_until: str = "networkidle") -> Optional[str]:
        """
        Navigate to URL and extract content after paywall bypass.
        
        Args:
            url: Target URL to scrape
            wait_until: Navigation wait condition
            
        Returns:
            Extracted article content or None if failed
        """
        try:
            # Navigate with timeout and wait condition
            await self.page.goto(url, wait_until=wait_until, timeout=30000)
            
            # Wait for content to load
            await self.page.wait_for_load_state("domcontentloaded")
            
            # Execute paywall bypass scripts if needed
            await self.execute_bypass_scripts()
            
            # Extract main content
            content = await self.extract_content()
            return content
            
        except Exception as e:
            logger.error(f"Failed to scrape {url}: {str(e)}")
            return None
            
    async def execute_bypass_scripts(self):
        """Execute scripts to bypass paywalls."""
        # Remove overlay elements
        await self.page.evaluate("""() => {
            const selectors = [
                '[class*="paywall"]',
                '[class*="popup"]',
                '[class*="overlay"]',
                '[id*="paywall"]',
                '[id*="popup"]',
                '[id*="overlay"]'
            ];
            
            selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => el.remove());
            });
            
            // Enable scrolling
            document.documentElement.style.overflow = 'auto';
            document.body.style.overflow = 'auto';
        }""")
        
    async def extract_content(self) -> str:
        """Extract main content from the page."""
        # Use Readability.js to extract main content
        content = await self.page.evaluate("""() => {
            const readability = new Readability(document.cloneNode(true));
            const article = readability.parse();
            return article ? article.textContent : document.body.innerText;
        }""")
        
        return content.strip()
        
    async def cleanup(self):
        """Clean up browser resources."""
        if self.page:
            await self.page.close()
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
            
    async def get_metadata(self) -> Dict[str, Any]:
        """Extract metadata from the page."""
        metadata = await self.page.evaluate("""() => {
            const getMetaContent = (name) => {
                const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
                return meta ? meta.getAttribute('content') : null;
            };
            
            return {
                title: document.title,
                description: getMetaContent('description'),
                author: getMetaContent('author') || getMetaContent('article:author'),
                publishedDate: getMetaContent('article:published_time'),
                modifiedDate: getMetaContent('article:modified_time'),
                keywords: getMetaContent('keywords'),
                ogImage: getMetaContent('og:image')
            };
        }""")
        
        return metadata 