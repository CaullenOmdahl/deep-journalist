import re
import logging
from typing import List, Dict, Any, Tuple, Optional
from textblob import TextBlob
from sklearn.feature_extraction.text import TfidfVectorizer
from app.models.schemas import Source, UrlCitation, Annotation
from app.core.config import Settings
from loguru import logger
import sys
import json
from datetime import datetime
from app.models.domain.source import Source
from app.models.domain.article import BiasAnalysis, Annotation, Article, ArticleAnalysis, SourceAnalysis
from app.analysis.bias.analyzer import BiasAnalyzer
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class ArticleAnalyzer:
    """Analyzes articles for bias, factual claims, and journalistic quality."""

    def __init__(self, settings: Optional[Settings] = None, test_mode: bool = False):
        """Initialize the analyzer.
        
        Args:
            settings: Application settings
            test_mode: Whether to run in test mode
        """
        self.settings = settings or Settings(test_mode=test_mode)
        self.bias_analyzer = BiasAnalyzer(settings=self.settings)
        
        # Initialize TF-IDF vectorizer for keyword extraction
        self.vectorizer = TfidfVectorizer(
            max_features=50,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        # Load loaded words list
        self.loaded_words = {
            'obviously', 'clearly', 'undoubtedly', 'certainly', 'naturally',
            'of course', 'without doubt', 'surely', 'everyone knows', 'always',
            'never', 'absolutely', 'completely', 'totally', 'utterly',
            'very', 'really', 'extremely', 'definitely', 'obviously'
        }

    async def analyze_article(self, article: Article) -> ArticleAnalysis:
        """Analyze an article for bias, claims, and journalistic quality.
        
        Args:
            article: Article to analyze
            
        Returns:
            ArticleAnalysis object containing analysis results
            
        Raises:
            ValueError: If article content is empty or invalid
        """
        if not article.content or not article.content.strip():
            raise ValueError("Article content cannot be empty")

        try:
            # Analyze bias
            bias_analysis = await self.bias_analyzer.analyze_bias(article.content)
            
            # Extract and analyze claims
            claims = await self.bias_analyzer.analyze_claims(article.content)
            
            # Generate annotations
            annotations = await self.generate_annotations(article.content)
            
            # Analyze source
            source_analysis = SourceAnalysis(
                reliability=self._assess_source_reliability(article.content, str(article.url)),
                type=self._determine_source_type(article),
                credibility_indicators=self._get_credibility_indicators(article),
                primary_sources=[],  # To be filled later
                secondary_sources=[]  # To be filled later
            )
            
            # Get improvement suggestions if bias score is high
            if bias_analysis.bias_score > 0.7:
                suggestions = await self.bias_analyzer.get_improvement_suggestions(article.content)
                bias_analysis.suggestions.extend(suggestions)
            
            # Create ArticleAnalysis object
            return ArticleAnalysis(
                article=article,
                bias_analysis=bias_analysis,
                fact_checks=[],  # To be filled by fact checker
                source_analysis=source_analysis,
                annotations=annotations,
                summary="",  # To be filled by summarizer
                warnings=self._get_analysis_warnings(article, bias_analysis)
            )
            
        except Exception as e:
            logger.error(f"Error analyzing article: {str(e)}")
            raise

    def _determine_source_type(self, article: Article) -> str:
        """Determine the type of source based on URL and content."""
        domain = urlparse(str(article.url)).netloc
        
        # Check for academic/government domains
        if any(domain.endswith(x) for x in ['.edu', '.gov', '.org']):
            return 'academic'
            
        # Check for news domains
        if any(x in domain for x in ['news', 'times', 'post', 'tribune']):
            return 'news'
            
        # Check content for research indicators
        research_words = ['study', 'research', 'analysis', 'report', 'findings']
        if any(word in article.content.lower() for word in research_words):
            return 'research'
            
        return 'other'

    def _get_credibility_indicators(self, article: Article) -> List[str]:
        """Get credibility indicators for an article."""
        indicators = []
        
        # Check for author
        if article.author:
            indicators.append('author_identified')
            
        # Check for publication date
        if article.publication_date:
            indicators.append('date_provided')
            
        # Check for sources
        if article.sources and len(article.sources) > 0:
            indicators.append('source_identified')
            
        # Check content length
        if len(article.content.split()) > 300:
            indicators.append('substantial_content')
            
        return indicators

    def _get_analysis_warnings(self, article: Article, bias_analysis: BiasAnalysis) -> List[str]:
        """Get warnings based on article analysis."""
        warnings = []
        
        # Check for high bias
        if bias_analysis.bias_score > 0.7:
            warnings.append("High bias detected")
            
        # Check for missing metadata
        if not article.author:
            warnings.append("Missing author information")
        if not article.publication_date:
            warnings.append("Missing publication date")
            
        # Check for loaded language
        if len(bias_analysis.loaded_language) > 5:
            warnings.append("Excessive use of loaded language")
            
        # Check for source diversity
        if bias_analysis.source_diversity_score < 0.5:
            warnings.append("Limited source diversity")
            
        return warnings

    async def analyze_bias(self, text: str) -> BiasAnalysis:
        """
        Analyze text for bias using BiasAnalyzer.
        
        Args:
            text: Text to analyze
            
        Returns:
            BiasAnalysis object containing bias analysis results
        """
        if not text or not isinstance(text, str):
            raise ValueError("Invalid text input")
            
        try:
            return await self.bias_analyzer.analyze_bias(text)
        except Exception as e:
            logger.error(f"Failed to analyze bias: {str(e)}")
            raise

    async def classify_source(self, text: str) -> Dict[str, Any]:
        """Classify the source type and reliability.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dict containing source classification
        """
        try:
            result = await self.settings.analyze_text(text)
            analysis = json.loads(result['analysis'])
            return analysis.get('source_analysis', {})
        except Exception as e:
            logger.error(f"Failed to classify source: {str(e)}")
            return {
                'type': 'unknown',
                'reliability': 'unknown',
                'credibility_indicators': []
            }

    async def extract_citations(self, text: str) -> List[UrlCitation]:
        """Extract citations from text.
        
        Args:
            text: Text to analyze
            
        Returns:
            List of UrlCitation objects
        """
        try:
            # Get citations from Gemini
            citations = await self.settings.extract_citations(text)
            
            # Convert to UrlCitation objects
            url_citations = []
            for citation in citations:
                url_citations.append(
                    UrlCitation(
                        url=citation.get('url', 'https://example.com'),
                        title=citation.get('source', 'Unknown Source'),
                        text=citation.get('text', ''),
                        source=citation.get('source', 'Unknown'),
                        context=citation.get('context', ''),
                        exactQuote=citation.get('text', ''),
                        confidence=citation.get('confidence', 0.8),
                        verified=False
                    )
                )
            return url_citations
            
        except Exception as e:
            logger.error(f"Failed to extract citations: {str(e)}")
            return []

    async def generate_annotations(self, text: str) -> List[Annotation]:
        """Generate annotations for text.
        
        Args:
            text: Text to analyze
            
        Returns:
            List of Annotation objects
        """
        try:
            # Extract citations first
            citations = await self.extract_citations(text)
            
            # Convert citations to annotations
            annotations = []
            for citation in citations:
                annotations.append(
                    Annotation(
                        text=f"According to [{citation.source}], {citation.text}",
                        type="url_citation",
                        category="fact",
                        confidence=citation.confidence,
                        requires_verification=True,
                        url_citation=citation
                    )
                )
            return annotations
            
        except Exception as e:
            logger.error(f"Failed to generate annotations: {str(e)}")
            return []

    def find_loaded_words(self, text: str) -> List[str]:
        """Find loaded or biased language in text.
        
        Args:
            text: Text to analyze
            
        Returns:
            List of loaded words found
        """
        words = text.lower().split()
        found_words = []
        
        for word in words:
            if word in self.loaded_words:
                # Return the word as it appears in the original text
                original_word = next(w for w in text.split() if w.lower() == word)
                found_words.append(original_word)
                
        return found_words

    def get_subjective_sentences(self, blob: TextBlob) -> List[str]:
        """Get subjective sentences from text.
        
        Args:
            blob: TextBlob object
            
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

    async def assess_source_reliability(self, text: str) -> Dict[str, Any]:
        """Assess the reliability of a source.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dict containing reliability assessment
        """
        try:
            result = await self.settings.analyze_text(text)
            analysis = json.loads(result['analysis'])
            return analysis.get('source_analysis', {})
        except Exception as e:
            logger.error(f"Failed to assess source reliability: {str(e)}")
            return {
                'reliability': 'unknown',
                'credibility_indicators': []
            }

    async def needs_verification(self, text: str) -> bool:
        """Check if text needs fact verification.
        
        Args:
            text: Text to analyze
            
        Returns:
            bool indicating if verification is needed
        """
        try:
            result = await self.settings.analyze_text(text)
            analysis = json.loads(result['analysis'])
            return analysis.get('fact_check', {}).get('needs_verification', True)
        except Exception as e:
            logger.error(f"Failed to check verification need: {str(e)}")
            return True

    def classify_source(self, text: str, url: str) -> Source:
        """Classify the source type and reliability.
        
        Args:
            text: Text to analyze
            url: Source URL
            
        Returns:
            Source object with classification
        """
        try:
            # Parse domain from URL
            domain = urlparse(url).netloc
            
            # Determine source type based on content and URL
            is_academic = any(domain.endswith(x) for x in ['.edu', '.gov', '.org'])
            is_research = any(word in text.lower() for word in [
                'research', 'study', 'report', 'paper', 'analysis',
                'survey', 'data', 'findings', 'results'
            ])
            
            source_type = 'primary' if (is_academic or is_research) else 'news'
            
            # Assess reliability
            reliability_score = self._assess_source_reliability(text, url)
            
            # Create Source object
            return Source(
                url=url,
                title=text[:100],  # Use first 100 chars as title
                type=source_type,  # Use determined source type
                reliability_score=reliability_score,
                credibility_score=0.8,  # Default score, can be updated
                classification_confidence=0.9,  # Default confidence
                metadata={
                    'classification_confidence': 0.9,
                    'is_primary': source_type == 'primary'
                }
            )
        except Exception as e:
            logger.error(f"Failed to classify source: {str(e)}")
            raise

    def _assess_source_reliability(self, text: str, url: str) -> str:
        """Assess the reliability of a source.
        
        Args:
            text: Text to analyze
            url: Source URL
            
        Returns:
            Reliability rating as a string: 'high', 'medium', 'low', or 'unknown'
        """
        score = 0.5  # Start with neutral score
        
        # Domain-based scoring
        domain = urlparse(url).netloc
        academic_domains = ['.edu', '.gov', '.org']
        if any(d in domain for d in academic_domains):
            score += 0.2
            
        # Content-based scoring
        if len(text) > 1000:  # Longer articles might be more detailed
            score += 0.1
            
        # Convert score to reliability rating
        if score >= 0.8:
            return 'high'
        elif score >= 0.5:
            return 'medium'
        elif score > 0:
            return 'low'
        else:
            return 'unknown'

    def _assess_sentence_importance(self, sentence: str) -> float:
        """
        Assess the importance of a sentence based on its content.
        Returns a score between 0 and 1.
        """
        # Simple heuristic based on sentence length and structure
        importance = 0.5
        
        # Longer sentences might contain more information
        if len(sentence) > 100:
            importance += 0.2
            
        # Sentences with numbers might be more factual
        if any(char.isdigit() for char in sentence):
            importance += 0.1
            
        # Sentences with quotes might be more important
        if '"' in sentence or '"' in sentence:
            importance += 0.1
            
        return min(importance, 1.0)

    def _categorize_statement(self, sentence: str) -> str:
        """Categorize the type of statement."""
        categories = ["fact", "claim", "opinion", "quote"]
        results = self.settings.classify_text(sentence, categories)
        return results['label']

    def _needs_verification(self, sentence: str) -> bool:
        """Determine if a statement needs verification."""
        # Check for specific patterns that suggest need for verification
        verification_triggers = [
            r'\d+',  # Numbers
            r'according to',
            r'studies show',
            r'research indicates',
            r'experts say'
        ]
        
        return any(re.search(pattern, sentence.lower()) 
                  for pattern in verification_triggers)

    def _determine_statement_type(self, text: str) -> str:
        """
        Determine the type of statement (claim, opinion, fact, etc.).
        
        Args:
            text: The text to analyze
            
        Returns:
            Statement type classification
        """
        # Check for opinion indicators
        opinion_words = {'believe', 'think', 'feel', 'suggest', 'seem', 'appear', 'likely', 'may', 'could', 'might'}
        if any(word in text.lower() for word in opinion_words):
            return 'opinion'
            
        # Check for factual indicators
        fact_words = {'research shows', 'study finds', 'according to', 'data indicates', 'evidence suggests'}
        if any(phrase in text.lower() for phrase in fact_words):
            return 'fact'
            
        # Default to claim if no clear indicators
        return 'claim'

    def _calculate_sentence_importance(self, sentence: str) -> float:
        """
        Calculate the importance of a sentence based on its content.
        Returns a score between 0 and 1.
        """
        # Simple heuristic based on sentence length and structure
        importance = 0.5
        
        # Longer sentences might contain more information
        if len(sentence) > 100:
            importance += 0.2
            
        # Sentences with numbers might be more factual
        if any(char.isdigit() for char in sentence):
            importance += 0.1
            
        # Sentences with quotes might be more important
        if '"' in sentence or '"' in sentence:
            importance += 0.1
            
        return min(importance, 1.0)

    def _determine_statement_category(self, sentence: str) -> str:
        """
        Determine the category of a statement based on its content.
        
        Args:
            sentence: The text of the statement
            
        Returns:
            Statement category classification
        """
        # Check for opinion indicators
        opinion_words = {'believe', 'think', 'feel', 'suggest', 'seem', 'appear', 'likely', 'may', 'could', 'might'}
        if any(word in sentence.lower() for word in opinion_words):
            return 'opinion'
            
        # Check for factual indicators
        fact_words = {'research shows', 'study finds', 'according to', 'data indicates', 'evidence suggests'}
        if any(phrase in sentence.lower() for phrase in fact_words):
            return 'fact'
            
        # Default to claim if no clear indicators
        return 'claim' 