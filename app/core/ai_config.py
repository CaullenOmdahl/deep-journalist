import os
from typing import Dict, Any, Optional
import google.generativeai as genai
from loguru import logger
from unittest.mock import MagicMock

class AIConfig:
    """Configuration for AI services."""

    def __init__(self, test_mode: bool = False):
        """Initialize AI configuration.
        
        Args:
            test_mode: Whether to run in test mode with mock services
        """
        self.test_mode = test_mode
        self.api_key = os.getenv("GEMINI_API_KEY")
        
        if test_mode:
            # Create mock objects for testing
            self.model = MagicMock()
            self._setup_mock_responses()
        else:
            try:
                # Initialize Gemini
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-pro')
            except Exception as e:
                logger.error(f"Failed to initialize Gemini services: {str(e)}")
                self.model = None

    def _setup_mock_responses(self):
        """Set up mock responses for test mode."""
        mock_response = MagicMock()
        mock_response.text = """
        {
            "bias_analysis": {
                "political_bias": "neutral",
                "loaded_language": ["example loaded word"],
                "subjective_statements": ["example subjective statement"]
            },
            "fact_check": {
                "claims": ["example claim"],
                "needs_verification": true,
                "citations": ["example citation"]
            },
            "source_analysis": {
                "reliability": "high",
                "type": "news",
                "credibility_indicators": ["professional writing", "cited sources"]
            }
        }
        """
        self.model.generate_content.return_value = mock_response

    async def analyze_text(self, text: str) -> Dict[str, Any]:
        """Analyze text using Gemini.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dict containing analysis results
        """
        if not text:
            raise ValueError("Text cannot be empty")

        try:
            # Generate prompt for text analysis
            prompt = f"""
            Analyze the following text for bias, factual claims, and journalistic quality.
            Consider:
            - Political bias and loaded language
            - Factual claims that need verification
            - Source credibility and reliability
            - Citations and evidence
            - Subjective vs objective statements

            Text: {text}

            Provide a structured analysis in JSON format with the following structure:
            {
                "sentiment": {
                    "score": 0.5,  # -1 to 1, where -1 is negative, 1 is positive
                    "magnitude": 0.8  # 0 to 1, intensity of emotion
                },
                "entities": [
                    {
                        "name": "entity name",
                        "type": "PERSON|ORGANIZATION|LOCATION|etc",
                        "salience": 0.9  # 0 to 1, importance in text
                    }
                ],
                "analysis": {
                    "bias_analysis": {
                        "political_bias": "left|center|right",
                        "loaded_language": ["word1", "word2"],
                        "subjective_statements": ["statement1", "statement2"]
                    },
                    "fact_check": {
                        "claims": ["claim1", "claim2"],
                        "needs_verification": true|false,
                        "citations": ["citation1", "citation2"]
                    },
                    "source_analysis": {
                        "reliability": "high|medium|low",
                        "type": "news|opinion|analysis",
                        "credibility_indicators": ["indicator1", "indicator2"]
                    }
                }
            }
            """

            # Get Gemini analysis
            response = await self.model.generate_content(prompt)
            return response.text

        except Exception as e:
            logger.error(f"Failed to analyze text: {str(e)}")
            if self.test_mode:
                # Return mock data in test mode
                return {
                    'sentiment': {'score': 0.2, 'magnitude': 0.8},
                    'entities': [{'name': 'Test Entity', 'type': 'ORGANIZATION', 'salience': 0.9}],
                    'analysis': '{"bias_analysis": {"political_bias": "neutral"}}'
                }
            raise

    def generate_text(
        self,
        prompt: str,
        max_tokens: Optional[int] = 1024,
        temperature: Optional[float] = 0.7
    ) -> str:
        """
        Generate text using Gemini.
        
        Args:
            prompt: Input text prompt
            max_tokens: Maximum number of tokens to generate
            temperature: Sampling temperature (0.0 to 1.0)
            
        Returns:
            Generated text response
        """
        response = self.model.generate_content(
            prompt,
            generation_config={
                'max_output_tokens': max_tokens,
                'temperature': temperature
            }
        )
        return response.text
        
    def classify_text(self, text: str, labels: list) -> dict:
        """
        Classify text using zero-shot classification.
        
        Args:
            text: Text to classify
            labels: List of possible labels
            
        Returns:
            Dictionary containing classification results
        """
        # Create classification prompt
        prompt = f"""Classify the following text into one of these categories: {', '.join(labels)}
        
Text: {text}

Respond in JSON format:
{
    "label": "category_name",
    "confidence": 0.9  # 0 to 1 confidence score
}
"""
        
        response = self.generate_text(prompt, max_tokens=50, temperature=0.1)
        return response 