import os
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

logger = logging.getLogger(__name__)

class PaywallBypassScraper:
    def __init__(self, chrome_path: Optional[str] = None, extension_path: Optional[str] = None):
        self.chrome_path = chrome_path or os.getenv('CHROME_PATH')
        self.extension_path = extension_path or os.path.join(
            os.path.dirname(__file__), 'extensions', 'bypass-paywalls-chrome-clean'
        )
        self.driver = None

    def _setup_driver(self) -> None:
        """Initialize the Chrome driver with the bypass paywall extension."""
        options = uc.ChromeOptions()
        options.add_argument(f'--load-extension={self.extension_path}')
        options.add_argument('--disable-gpu')
        
        if self.chrome_path:
            options.binary_location = self.chrome_path

        self.driver = uc.Chrome(
            options=options,
            driver_executable_path=None,  # Let it download automatically
            headless=False  # Extensions don't work in headless mode
        )

    def _cleanup(self) -> None:
        """Clean up the browser instance."""
        if self.driver:
            try:
                self.driver.quit()
            except Exception as e:
                logger.error(f"Error cleaning up driver: {e}")
            finally:
                self.driver = None

    def scrape_article(self, url: str, wait_time: int = 10) -> Dict[str, Any]:
        """
        Scrape an article from a URL, bypassing any paywalls.
        
        Args:
            url: The URL of the article to scrape
            wait_time: Maximum time to wait for page load in seconds
            
        Returns:
            Dict containing article content and metadata
        """
        try:
            if not self.driver:
                self._setup_driver()

            self.driver.get(url)

            # Wait for the main content to load
            WebDriverWait(self.driver, wait_time).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )

            # Let any dynamic content load
            self.driver.implicitly_wait(2)

            # Extract article content
            article = {
                'url': url,
                'title': self.driver.title,
                'content': '',
                'html': self.driver.page_source,
                'metadata': {}
            }

            # Try to find article content using common selectors
            content_selectors = [
                "article",
                '[role="article"]',
                ".article-content",
                ".story-body",
                ".main-content",
                "#article-body",
            ]

            for selector in content_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        article['content'] = elements[0].text
                        break
                except Exception as e:
                    logger.debug(f"Error with selector {selector}: {e}")

            # If no content found, use body text
            if not article['content']:
                article['content'] = self.driver.find_element(By.TAG_NAME, "body").text

            # Extract metadata
            meta_tags = self.driver.find_elements(By.TAG_NAME, "meta")
            for tag in meta_tags:
                name = tag.get_attribute("name") or tag.get_attribute("property")
                content = tag.get_attribute("content")
                if name and content:
                    article['metadata'][name] = content

            return article

        except TimeoutException:
            logger.error(f"Timeout while loading {url}")
            raise
        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            raise
        finally:
            self._cleanup()

    def __enter__(self):
        """Context manager entry."""
        if not self.driver:
            self._setup_driver()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self._cleanup() 