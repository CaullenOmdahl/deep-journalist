"""
Gemini AI client implementation.
"""
import os
import json
import logging
from typing import Any, Dict, List, Optional

import google.generativeai as genai
from google.generativeai.types import GenerateContentResponse
from google.generativeai.types import ContentType, HarmCategory, HarmBlockThreshold
from pydantic import BaseModel

from app.core.config import Settings
from app.utils.logging.logger import get_logger

logger = get_logger(__name__)

class GeminiPrompt(BaseModel):
    """Base model for Gemini prompts."""
    system: str
    user: str
    
    def to_text(self) -> str:
        """Convert prompt to text format."""
        return f"{self.system}\n\nUser: {self.user}"

class GeminiClient:
    """
    Client for interacting with Google's Gemini AI API.
    """
    
    def __init__(self, settings: Optional[Settings] = None, test_mode: bool = False):
        """
        Initialize the Gemini AI client.
        
        Args:
            settings: Application settings
            test_mode: Whether to run in test mode (returns mock responses)
        """
        self.settings = settings or Settings()
        self.test_mode = test_mode
        self._setup_client()
        
    def _setup_client(self):
        """Set up the Gemini AI client with API key and model."""
        try:
            genai.configure(api_key=self.settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-pro')
            logger.info("Gemini AI client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini AI client: {str(e)}")
            raise
    
    async def generate(
        self,
        prompt: GeminiPrompt,
        temperature: float = 0.3,
        top_p: float = 0.8,
        top_k: int = 40,
        max_output_tokens: int = 1024,
    ) -> str:
        """
        Generate text using Gemini AI.
        
        Args:
            prompt: Structured prompt
            temperature: Controls randomness (0.0 = deterministic, 1.0 = creative)
            top_p: Nucleus sampling parameter
            top_k: Number of highest probability tokens to consider
            max_output_tokens: Maximum length of generated text
            
        Returns:
            Generated text response
            
        Raises:
            Exception: If generation fails
        """
        try:
            response = await self.model.generate_content_async(
                prompt.to_text(),
                generation_config={
                    "temperature": temperature,
                    "top_p": top_p,
                    "top_k": top_k,
                    "max_output_tokens": max_output_tokens,
                }
            )
            
            if not response.text:
                raise ValueError("Empty response from Gemini AI")
                
            return response.text
            
        except Exception as e:
            logger.error(f"Gemini AI generation failed: {str(e)}")
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
            return self._get_mock_bias_analysis()
            
        prompt = f"""
        Analyze the following text for bias and provide a detailed analysis:
        
        {text}
        
        Please provide:
        1. Overall bias score (0-1)
        2. Types of bias detected
        3. Loaded/biased words
        4. Neutral language score
        5. Perspective balance score
        6. Suggestions for improving neutrality
        7. Source diversity score
        8. Factual accuracy score
        
        Return the analysis in a structured format.
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            return self._parse_bias_analysis(response)
        except Exception as e:
            logger.error(f"Failed to analyze bias: {str(e)}")
            raise
    
    async def verify_claim(self, claim: str, context: str) -> Dict[str, Any]:
        """
        Verify a single claim using Gemini AI.

        Args:
            claim: The claim to verify
            context: Context around the claim

        Returns:
            Dictionary containing verification results
        """
        # Prepare prompt for claim verification
        prompt = f"""
        Please verify the following claim. Return a JSON object with:
        - confidence (float 0-1)
        - evidence (list of strings)
        - sources (list of dictionaries with url, title, type, confidence)

        Claim: {claim}
        Context: {context}
        """

        response = await self._call_gemini(prompt)
        return response

    async def verify_claims(self, claims: List[Dict[str, str]], context: str) -> List[Dict[str, Any]]:
        """
        Verify multiple claims using Gemini AI.

        Args:
            claims: List of claims to verify
            context: Context around the claims

        Returns:
            List of dictionaries containing verification results
        """
        results = []
        for claim in claims:
            result = await self.verify_claim(claim["claim"], context)
            results.append(result)
        return results

    async def extract_claims(self, text: str) -> List[Dict[str, str]]:
        """
        Extract claims from text using Gemini AI.

        Args:
            text: Text to extract claims from

        Returns:
            List of dictionaries containing claims and their context
        """
        # Prepare prompt for claim extraction
        prompt = f"""
        Please extract factual claims from the following text. Return a list of JSON objects with:
        - claim (string)
        - context (string)
        - importance (string: high/medium/low)

        Text to analyze:
        {text}
        """

        response = await self._call_gemini(prompt)
        return response

    async def analyze_article(self, text: str) -> Dict[str, Any]:
        """
        Analyze an article using Gemini AI.

        Args:
            text: Article text to analyze

        Returns:
            Dictionary containing complete analysis results
        """
        # Get bias analysis
        bias_analysis = await self.analyze_bias(text)

        # Extract and verify claims
        claims = await self.extract_claims(text)
        fact_checks = await self.verify_claims(claims, text)

        # Generate summary
        summary_prompt = f"""
        Please summarize the following article in 2-3 sentences. Return just the summary text.

        Article:
        {text}
        """
        summary = await self._call_gemini(summary_prompt)

        return {
            "bias_analysis": bias_analysis,
            "fact_checks": fact_checks,
            "summary": summary
        }

    async def _call_gemini(self, prompt: str) -> Dict[str, Any]:
        """Make a call to Gemini AI."""
        response = await self.model.generate_content(prompt)
        return json.loads(response.text)

    def _parse_bias_analysis(self, response: GenerateContentResponse) -> Dict[str, Any]:
        """Parse the Gemini AI response into structured bias analysis.
        
        Args:
            response: Raw response from Gemini AI
            
        Returns:
            Dictionary containing parsed analysis results
        """
        # TODO: Implement proper parsing of Gemini response
        # For now, return mock data
        return self._get_mock_bias_analysis()
        
    def _get_mock_bias_analysis(self) -> Dict[str, Any]:
        """Get mock bias analysis for testing.
        
        Returns:
            Dictionary containing mock analysis results
        """
        return {
            "bias_score": 0.3,
            "neutral_language_score": 0.8,
            "perspective_balance": 0.7,
            "detected_bias_types": ["political", "source"],
            "loaded_words": ["radical", "extreme", "disaster"],
            "improvement_suggestions": [
                "Replace loaded terms with neutral alternatives",
                "Include more diverse perspectives",
                "Add supporting evidence for claims"
            ],
            "source_diversity_score": 0.6,
            "factual_accuracy_score": 0.9
        }
        
    async def extract_citations(self, text: str) -> List[Dict[str, Any]]:
        """Extract citations and references from text.
        
        Args:
            text: Text to analyze
            
        Returns:
            List of dictionaries containing citation information
        """
        if self.test_mode:
            return self._get_mock_citations()
            
        prompt = f"""
        Extract all citations and references from the following text:
        
        {text}
        
        For each citation, provide:
        1. The quoted text
        2. The source
        3. The context
        4. Confidence score
        
        Return the citations in a structured format.
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            return self._parse_citations(response)
        except Exception as e:
            logger.error(f"Failed to extract citations: {str(e)}")
            raise
            
    def _parse_citations(self, response: GenerateContentResponse) -> List[Dict[str, Any]]:
        """Parse the Gemini AI response into structured citations.
        
        Args:
            response: Raw response from Gemini AI
            
        Returns:
            List of dictionaries containing citation information
        """
        # TODO: Implement proper parsing of Gemini response
        # For now, return mock data
        return self._get_mock_citations()
        
    def _get_mock_citations(self) -> List[Dict[str, Any]]:
        """Get mock citations for testing.
        
        Returns:
            List of dictionaries containing mock citation information
        """
        return [
            {
                "text": "Example citation text",
                "source": "Example Source",
                "context": "Used to support main argument",
                "confidence": 0.9
            }
        ]

# Global client instance
client = GeminiClient() 