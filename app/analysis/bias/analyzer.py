"""
Bias analysis module for Deep-Journalist.
"""
from typing import Dict, List, Optional
from app.core.gemini.client import client
from app.models.domain.article import BiasAnalysis
from app.utils.logging.logger import get_logger
import nltk
from app.core.config import Settings
from app.core.gemini import GeminiClient
from textblob import TextBlob
import logging

logger = logging.getLogger(__name__)

class BiasAnalyzer:
    """Analyzer for detecting and measuring bias in text."""

    def __init__(self, settings: Optional[Settings] = None, gemini_client: Optional[GeminiClient] = None):
        """Initialize the BiasAnalyzer.
        
        Args:
            settings: Application settings
            gemini_client: Optional pre-configured GeminiClient instance
        """
        self.settings = settings or Settings()
        self.gemini_client = gemini_client or GeminiClient(settings=self.settings)
        
        # Common loaded words and phrases that may indicate bias
        self.loaded_words = {
            "obviously", "clearly", "without doubt", "undoubtedly",
            "naturally", "of course", "certainly", "always", "never",
            "everyone knows", "absolutely", "definitely", "totally",
            "completely", "utterly", "entirely", "beyond question",
            "indisputably", "unquestionably", "must", "should",
            "ought to", "have to", "need to", "regime", "extremist",
            "radical", "terrorist", "thug", "fanatic", "zealot"
        }

    async def analyze_bias(self, text: str) -> BiasAnalysis:
        """Analyze text for bias and return detailed analysis.
        
        Args:
            text: The text to analyze
            
        Returns:
            BiasAnalysis object containing detailed bias analysis
            
        Raises:
            ValueError: If text is empty, invalid, or wrong type
        """
        if not isinstance(text, str):
            raise ValueError("Input text must be a string")
        
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty")

        try:
            # Process text with TextBlob
            blob = TextBlob(text)
            
            # Extract subjective statements
            subjective_statements = self._get_subjective_sentences(blob)
            
            # Get loaded language
            loaded_words = self._find_loaded_words(text)
            
            # Calculate initial bias score from text analysis
            bias_score = (
                blob.sentiment.subjectivity * 0.4 +  # Weight subjectivity
                (len(loaded_words) / len(text.split())) * 0.3 +  # Weight loaded language
                (len(subjective_statements) / len(blob.sentences)) * 0.3  # Weight subjective statements
            )
            
            # Analyze with AI
            ai_analysis = await self.gemini_client.analyze_bias(text)
            
            # Combine AI and text analysis scores
            final_bias_score = (bias_score + ai_analysis.get('bias_score', 0.0)) / 2
            
            # Create BiasAnalysis object
            return BiasAnalysis(
                bias_score=final_bias_score,
                neutral_language_score=1.0 - final_bias_score,
                perspective_balance=ai_analysis.get('perspective_balance', 0.8),
                detected_bias_types=ai_analysis.get('detected_bias_types', []),
                suggestions=ai_analysis.get('suggestions', []),
                loaded_language=loaded_words,
                subjective_statements=subjective_statements,
                source_diversity_score=ai_analysis.get('source_diversity_score', 0.0),
                factual_accuracy_score=ai_analysis.get('factual_accuracy_score', 0.0),
                political_bias=ai_analysis.get('political_bias', 'neutral'),
                raw_analysis=ai_analysis
            )
            
        except Exception as e:
            logger.error(f"Error analyzing bias: {str(e)}")
            raise

    def _get_subjective_sentences(self, blob: TextBlob) -> List[str]:
        """Extract subjective sentences from text.
        
        Args:
            blob: TextBlob object to analyze
            
        Returns:
            List of subjective sentences
        """
        subjective_sentences = []
        
        for sentence in blob.sentences:
            # Check for loaded words
            has_loaded_words = any(word.lower() in self.loaded_words for word in sentence.words)
            
            # Check sentiment polarity and subjectivity
            is_subjective = sentence.sentiment.subjectivity > 0.5
            has_strong_polarity = abs(sentence.sentiment.polarity) > 0.3
            
            if has_loaded_words or (is_subjective and has_strong_polarity):
                subjective_sentences.append(str(sentence))
                
        return subjective_sentences

    def _find_loaded_words(self, text: str) -> List[str]:
        """Find loaded or biased words in text.
        
        Args:
            text: The text to analyze
            
        Returns:
            List of loaded words found in the text
        """
        found_words = []
        text_lower = text.lower()
        
        # Check for single words
        words = text.split()
        for word in words:
            if word.lower() in self.loaded_words:
                found_words.append(word)
        
        # Check for phrases
        for phrase in self.loaded_words:
            if ' ' in phrase and phrase in text_lower:
                # Find the original case in the text
                start = text_lower.find(phrase)
                if start >= 0:
                    end = start + len(phrase)
                    found_words.append(text[start:end])
                
        return found_words

    async def analyze_claims(self, text: str) -> List[str]:
        """Extract and analyze claims from text for bias.
        
        Args:
            text: Text to analyze
            
        Returns:
            List of extracted claims with their bias scores
            
        Raises:
            ValueError: If text is empty or invalid
        """
        if not text or not isinstance(text, str):
            raise ValueError("Invalid text input")
            
        claims = await self.gemini_client.extract_claims(text)
        
        # Analyze each claim for bias
        analyzed_claims = []
        for claim in claims:
            try:
                analysis = await self.analyze_bias(claim)
                analyzed_claims.append({
                    'claim': claim,
                    'bias_score': analysis.bias_score,
                    'bias_types': analysis.detected_bias_types
                })
            except Exception as e:
                logger.error(f"Failed to analyze claim: {str(e)}")
                continue
                
        return analyzed_claims
    
    async def get_improvement_suggestions(self, text: str, threshold: float = 0.7) -> List[str]:
        """Get suggestions for improving text neutrality if bias score is above threshold.
        
        Args:
            text: The text to analyze
            threshold: Bias score threshold for generating suggestions
            
        Returns:
            List of improvement suggestions
        """
        # Get AI analysis first
        ai_analysis = await self.gemini_client.analyze_bias(text)
        
        # Check if bias score is above threshold
        if ai_analysis.get('bias_score', 0.0) > threshold:
            suggestions = ai_analysis.get('suggestions', [])
            
            # Add our own suggestions based on text analysis
            blob = TextBlob(text)
            loaded_words = self._find_loaded_words(text)
            subjective_statements = self._get_subjective_sentences(blob)
            
            if loaded_words:
                suggestions.append(f"Consider replacing loaded words: {', '.join(loaded_words)}")
            if subjective_statements:
                suggestions.append("Try to rephrase subjective statements more objectively")
            if ai_analysis.get('political_bias', 'neutral') != "neutral":
                suggestions.append("Consider balancing political perspectives")
            
            return suggestions
        return [] 