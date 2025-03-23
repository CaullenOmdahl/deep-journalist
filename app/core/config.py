from typing import Dict, List, Any, Optional
import os
import logging
import google.generativeai as genai

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
        self.test_mode = test_mode
        self.api_key = os.getenv("GEMINI_API_KEY")
        
        if not test_mode:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-pro')
                logger.info("Gemini model initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini model: {str(e)}")
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
        Analyze the following text for bias. Consider:
        1. Political bias (left, right, center)
        2. Types of bias present
        3. Balance of perspectives (0-1 score)
        4. Suggestions for improving neutrality

        Text: {text}
        
        Respond in JSON format with the following structure:
        {
            "political_bias": "left|right|center",
            "bias_types": ["type1", "type2"],
            "perspective_balance": 0.8,
            "suggestions": ["suggestion1", "suggestion2"]
        }
        """
        
        try:
            response = await self.model.generate_content(prompt)
            return response.text
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
                "confidence": 0.9
            }]
            
        prompt = f"""
        Extract citations and their sources from the following text.
        For each citation, provide:
        1. The quoted text
        2. The source
        3. The surrounding context
        4. Confidence score (0-1)

        Text: {text}
        
        Respond in JSON format with an array of citations:
        [
            {
                "text": "quoted text",
                "source": "source name",
                "context": "surrounding context",
                "confidence": 0.9
            }
        ]
        """
        
        try:
            response = await self.model.generate_content(prompt)
            return response.text
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

        Text: {text}
        
        Respond in JSON format:
        {
            "label": "category_name",
            "confidence": 0.9
        }
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Failed to classify text: {str(e)}")
            raise 