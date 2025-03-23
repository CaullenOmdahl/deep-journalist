"""
Content extraction module for scraping article content.
"""
from typing import Dict, Any, Optional
from bs4 import BeautifulSoup
import re
from datetime import datetime

class ContentExtractor:
    """
    Extracts content and metadata from HTML pages.
    """
    def __init__(self, min_content_length: int = 100):
        self.min_content_length = min_content_length

    def extract_content(self, html: str) -> Dict[str, Any]:
        """
        Extract content and metadata from HTML.
        
        Args:
            html: Raw HTML string
            
        Returns:
            Dict containing extracted content and metadata
        """
        if not html:
            raise ValueError("Empty HTML content")
            
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extract main content
        content = self._extract_main_content(soup)
        content = self.clean_content(content)
        
        if len(content) < self.min_content_length:
            raise ValueError(f"Content length {len(content)} below minimum {self.min_content_length}")
            
        # Get metadata
        metadata = self.extract_metadata(soup)
        
        return {
            "content": content,
            "metadata": metadata,
            "extracted_at": datetime.now().isoformat()
        }

    def _extract_main_content(self, soup: BeautifulSoup) -> str:
        """Extract the main content from the HTML."""
        # Try article tag first
        article = soup.find('article')
        if article:
            return article.get_text()
            
        # Try main content div
        main = soup.find('main')
        if main:
            return main.get_text()
            
        # Fallback to body content
        body = soup.find('body')
        if body:
            return body.get_text()
            
        return ""

    def clean_content(self, content: str) -> str:
        """Clean extracted content by removing extra whitespace."""
        # Remove extra whitespace
        content = re.sub(r'\s+', ' ', content)
        # Remove empty lines
        content = '\n'.join(line.strip() for line in content.splitlines() if line.strip())
        return content.strip()

    def extract_metadata(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract metadata from HTML."""
        metadata = {
            "title": "",
            "author": "",
            "date": None,
            "description": ""
        }
        
        # Get title
        title = soup.find('title')
        if title:
            metadata["title"] = title.get_text().strip()
            
        # Try meta tags
        meta_mappings = {
            "author": ["author", "article:author"],
            "description": ["description", "og:description"],
            "date": ["article:published_time", "date", "pubdate"]
        }
        
        for field, meta_names in meta_mappings.items():
            for name in meta_names:
                meta = soup.find('meta', attrs={"name": name}) or soup.find('meta', attrs={"property": name})
                if meta and meta.get("content"):
                    metadata[field] = meta["content"]
                    break
                    
        return metadata 