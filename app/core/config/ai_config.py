from typing import Dict, List, Any, Optional
import os
import logging
import google.generativeai as genai
from google.generativeai.types import GenerateContentResponse

from .settings import get_settings

logger = logging.getLogger(__name__)

class AIConfig:
    """
    Configuration and operations for AI services.
    """
    
    def __init__(self, test_mode: bool = False):
        """
        Initialize AI configuration.
        
        Args:
            test_mode: Whether to run in test mode (uses mock responses)
        """
        self.settings = get_settings()
        self.test_mode = test_mode
        self.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        
        if not test_mode:
            try:
                if not self.GEMINI_API_KEY:
                    raise ValueError("GEMINI_API_KEY environment variable not set")
                    
                genai.configure(api_key=self.GEMINI_API_KEY)
                self.model = genai.GenerativeModel('gemini-pro')
                logger.info("Gemini AI client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize AI model: {str(e)}")
                raise
    
    async def analyze_bias(self, text: str) -> Dict[str, Any]:
        """
        Analyze text for bias using Gemini AI.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary containing bias analysis results
        """
        if self.test_mode:
            return {
                "political_bias": "neutral",
                "bias_types": ["none detected"],
                "perspective_balance": 0.8,
                "suggestions": ["The text appears to be relatively neutral"]
            }
            
        prompt = f"""
        Analyze the following text for bias. Return a JSON object with:
        1. political_bias: "left", "right", "center", or "neutral"
        2. bias_types: array of bias types found
        3. perspective_balance: number between 0-1
        4. suggestions: array of suggestions for improving neutrality

        Text: {text}
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            return self._parse_bias_response(response)
        except Exception as e:
            logger.error(f"Failed to analyze bias: {str(e)}")
            raise
    
    async def extract_citations(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract citations from text using Gemini AI.
        
        Args:
            text: Text to extract citations from
            
        Returns:
            List of citation dictionaries
        """
        if self.test_mode:
            return [{
                "text": "Sample citation",
                "source": "Test Source",
                "context": "Test context",
                "confidence": 0.9,
                "url": "https://example.com"
            }]
            
        prompt = f"""
        Extract citations and their sources from the following text.
        Return a JSON array where each citation has:
        1. text: The quoted text
        2. source: The source name
        3. context: The surrounding context
        4. confidence: Score between 0-1
        5. url: Source URL if available

        Text: {text}
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            return self._parse_citations_response(response)
        except Exception as e:
            logger.error(f"Failed to extract citations: {str(e)}")
            raise
    
    def classify_text(self, text: str, categories: List[str]) -> Dict[str, Any]:
        """
        Classify text into predefined categories.
        
        Args:
            text: Text to classify
            categories: List of possible categories
            
        Returns:
            Dictionary with classification label and confidence
        """
        if self.test_mode:
            return {
                "label": categories[0],
                "confidence": 0.9
            }
            
        prompt = f"""
        Classify the following text into one of these categories:
        {', '.join(categories)}

        Return a JSON object with:
        1. label: The chosen category
        2. confidence: Score between 0-1

        Text: {text}
        """
        
        try:
            response = self.model.generate_content(prompt)
            return self._parse_classification_response(response)
        except Exception as e:
            logger.error(f"Failed to classify text: {str(e)}")
            raise
    
    def _parse_bias_response(self, response: GenerateContentResponse) -> Dict[str, Any]:
        """Parse the bias analysis response."""
        try:
            import json
            result = json.loads(response.text)
            return {
                "political_bias": result.get("political_bias", "neutral"),
                "bias_types": result.get("bias_types", ["none detected"]),
                "perspective_balance": result.get("perspective_balance", 0.8),
                "suggestions": result.get("suggestions", ["The text appears to be relatively neutral"])
            }
        except Exception as e:
            logger.error(f"Failed to parse bias response: {str(e)}")
            return {
                "political_bias": "neutral",
                "bias_types": ["none detected"],
                "perspective_balance": 0.8,
                "suggestions": ["The text appears to be relatively neutral"]
            }
    
    def _parse_citations_response(self, response: GenerateContentResponse) -> List[Dict[str, Any]]:
        """Parse the citations response."""
        try:
            import json
            citations = json.loads(response.text)
            if not isinstance(citations, list):
                citations = [citations]
                
            return [{
                "text": citation.get("text", ""),
                "source": citation.get("source", "Unknown Source"),
                "context": citation.get("context", ""),
                "confidence": citation.get("confidence", 0.8),
                "url": citation.get("url", "https://example.com")
            } for citation in citations]
        except Exception as e:
            logger.error(f"Failed to parse citations response: {str(e)}")
            return [{
                "text": "Sample citation",
                "source": "Test Source",
                "context": "Test context",
                "confidence": 0.9,
                "url": "https://example.com"
            }]
    
    def _parse_classification_response(self, response: GenerateContentResponse) -> Dict[str, Any]:
        """Parse the classification response."""
        try:
            import json
            result = json.loads(response.text)
            return {
                "label": result.get("label", "news article"),
                "confidence": result.get("confidence", 0.9)
            }
        except Exception as e:
            logger.error(f"Failed to parse classification response: {str(e)}")
            return {
                "label": "news article",
                "confidence": 0.9
            } 