import os
from typing import Optional, List, Dict, Any
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential

class GeminiClient:
    """Client for interacting with Google's Gemini API."""
    
    def __init__(self):
        """Initialize the Gemini API client."""
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
            
        self.model_name = os.getenv('MODEL_NAME', 'gemini-pro')
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(self.model_name)
        
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def generate_text(
        self,
        prompt: str,
        temperature: Optional[float] = 0.7,
        top_p: Optional[float] = 0.8,
        top_k: Optional[int] = 40,
        max_output_tokens: Optional[int] = 1024,
    ) -> str:
        """
        Generate text using Gemini API.
        
        Args:
            prompt: Input text prompt
            temperature: Controls randomness (0.0 to 1.0)
            top_p: Nucleus sampling parameter
            top_k: Number of highest probability tokens to consider
            max_output_tokens: Maximum number of tokens to generate
            
        Returns:
            Generated text response
        """
        generation_config = {
            "temperature": temperature,
            "top_p": top_p,
            "top_k": top_k,
            "max_output_tokens": max_output_tokens,
        }
        
        response = await self.model.generate_content_async(
            prompt,
            generation_config=generation_config
        )
        
        return response.text
        
    async def analyze_sentiment(self, text: str) -> Dict[str, float]:
        """
        Analyze text sentiment using Gemini.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary containing sentiment score and magnitude
        """
        prompt = f"""Analyze the sentiment of the following text and return a JSON object with two fields:
        1. score: a number between -1.0 (negative) and 1.0 (positive)
        2. magnitude: a number between 0.0 and 1.0 indicating sentiment strength
        
        Text: {text}
        
        Response (JSON only):"""
        
        response = await self.generate_text(prompt, temperature=0.1)
        
        try:
            import json
            result = json.loads(response)
            return {
                'score': float(result['score']),
                'magnitude': float(result['magnitude'])
            }
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            raise ValueError(f"Failed to parse sentiment analysis response: {e}")
            
    async def classify_text(
        self,
        text: str,
        labels: List[str],
        multi_label: bool = False
    ) -> Dict[str, Any]:
        """
        Classify text using Gemini.
        
        Args:
            text: Text to classify
            labels: List of possible labels
            multi_label: Whether to allow multiple labels
            
        Returns:
            Dictionary containing classification results
        """
        label_type = "one of these categories" if not multi_label else "one or more of these categories"
        prompt = f"""Classify the following text into {label_type}: {', '.join(labels)}
        
        Text: {text}
        
        Return a JSON object with:
        1. labels: {'a single label' if not multi_label else 'an array of labels'}
        2. confidence: a number between 0.0 and 1.0 for each label
        
        Response (JSON only):"""
        
        response = await self.generate_text(prompt, temperature=0.1)
        
        try:
            import json
            return json.loads(response)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse classification response: {e}")
            
    async def extract_facts(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract factual claims from text.
        
        Args:
            text: Text to analyze
            
        Returns:
            List of dictionaries containing extracted facts and their attributes
        """
        prompt = f"""Extract factual claims from the following text. For each fact, provide:
        1. claim: the factual statement
        2. confidence: confidence score between 0.0 and 1.0
        3. requires_verification: boolean indicating if the claim needs verification
        4. type: type of claim (e.g., "statistic", "quote", "event", "definition")
        
        Return as a JSON array.
        
        Text: {text}
        
        Response (JSON only):"""
        
        response = await self.generate_text(prompt, temperature=0.1)
        
        try:
            import json
            return json.loads(response)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse fact extraction response: {e}")
            
    async def analyze_bias(self, text: str) -> Dict[str, Any]:
        """
        Analyze potential bias in text.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary containing bias analysis results
        """
        prompt = f"""Analyze the potential bias in the following text. Return a JSON object with:
        1. bias_indicators: array of potentially biased phrases or words
        2. sentiment: object with positive/negative sentiment scores
        3. subjectivity: score between 0.0 (objective) and 1.0 (subjective)
        4. tone: overall tone assessment
        5. recommendations: suggestions for making the text more neutral
        
        Text: {text}
        
        Response (JSON only):"""
        
        response = await self.generate_text(prompt, temperature=0.1)
        
        try:
            import json
            return json.loads(response)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse bias analysis response: {e}") 