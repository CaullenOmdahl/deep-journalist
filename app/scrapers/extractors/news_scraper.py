from typing import Dict, Any, List, Optional
import json
from urllib.parse import urlparse
from app.scrapers.bypass.playwright_scraper import PlaywrightScraper

class NewsScraper(PlaywrightScraper):
    """Specialized scraper for news articles with paywall bypass."""
    
    # Known paywall configurations for major news sites
    PAYWALL_CONFIGS = {
        "nytimes.com": {
            "selectors": [
                "#gateway-content",
                "#app > div > div:not(#frame-placeholder)",
                "div[data-testid='gateway-container']"
            ],
            "cookies": ["nyt-gdpr=1", "nyt-purr=cfh"]
        },
        "wsj.com": {
            "selectors": [
                "div.wsj-snippet-login",
                "div.snippet-promotion",
                "#cx-snippet-overlay"
            ]
        },
        "washingtonpost.com": {
            "selectors": [
                ".paywall-overlay",
                "#wall-bottom-drawer"
            ]
        }
    }
    
    async def scrape_article(self, url: str) -> Dict[str, Any]:
        """
        Scrape a news article with paywall bypass.
        
        Args:
            url: URL of the news article
            
        Returns:
            Dictionary containing article content and metadata
        """
        domain = urlparse(url).netloc
        
        # Apply site-specific paywall bypass if available
        if domain in self.PAYWALL_CONFIGS:
            await self.apply_paywall_bypass(domain)
        
        # Navigate and extract content
        content = await self.navigate(url)
        if not content:
            return None
            
        # Get metadata
        metadata = await self.get_metadata()
        
        # Extract article structure
        article_data = await self.extract_article_structure()
        
        return {
            "url": url,
            "content": content,
            "metadata": metadata,
            "structure": article_data
        }
        
    async def apply_paywall_bypass(self, domain: str):
        """Apply domain-specific paywall bypass techniques."""
        config = self.PAYWALL_CONFIGS.get(domain, {})
        
        # Set cookies if specified
        if "cookies" in config:
            for cookie in config["cookies"]:
                name, value = cookie.split("=")
                await self.context.add_cookies([{
                    "name": name,
                    "value": value,
                    "domain": domain,
                    "path": "/"
                }])
                
        # Add additional headers
        await self.page.set_extra_http_headers({
            "DNT": "1",
            "Upgrade-Insecure-Requests": "1",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
        })
        
    async def extract_article_structure(self) -> Dict[str, Any]:
        """Extract structured data from the article."""
        structure = await self.page.evaluate("""() => {
            // Helper function to get clean text
            const getText = (selector) => {
                const el = document.querySelector(selector);
                return el ? el.innerText.trim() : null;
            };
            
            // Helper function to get all paragraphs
            const getParagraphs = () => {
                const article = document.querySelector('article') || document.body;
                const paragraphs = Array.from(article.querySelectorAll('p'))
                    .map(p => p.innerText.trim())
                    .filter(text => text.length > 0);
                return paragraphs;
            };
            
            return {
                headline: getText('h1') || document.title,
                subheadline: getText('h2') || getText('.article-subtitle'),
                author: getText('[rel="author"]') || getText('.author'),
                date: getText('time') || getText('[datetime]'),
                paragraphs: getParagraphs(),
                quotes: Array.from(document.querySelectorAll('blockquote'))
                    .map(q => q.innerText.trim()),
                links: Array.from(document.querySelectorAll('a[href]'))
                    .map(a => ({
                        text: a.innerText.trim(),
                        href: a.href
                    }))
                    .filter(link => link.text && link.href.startsWith('http'))
            };
        }""")
        
        return structure
        
    async def extract_sources(self) -> List[Dict[str, str]]:
        """Extract source citations and references from the article."""
        sources = await self.page.evaluate("""() => {
            const sources = [];
            
            // Find all citation links
            document.querySelectorAll('a[href]').forEach(link => {
                const href = link.href;
                if (!href.startsWith('http')) return;
                
                const text = link.innerText.trim();
                if (!text) return;
                
                // Check if it looks like a citation
                const isCitation = (
                    link.closest('cite') ||
                    link.closest('.citation') ||
                    link.closest('.reference') ||
                    /\[\d+\]/.test(text) ||  // Numbered reference
                    text.toLowerCase().includes('source') ||
                    text.toLowerCase().includes('reference')
                );
                
                if (isCitation) {
                    sources.push({
                        text: text,
                        url: href,
                        type: 'citation'
                    });
                }
            });
            
            return sources;
        }""")
        
        return sources 