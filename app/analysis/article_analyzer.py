import re
import logging
from typing import List, Dict, Any, Tuple
from textblob import TextBlob
from transformers import pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from app.models.schemas import Source, UrlCitation, Annotation

logger = logging.getLogger(__name__)

class ArticleAnalyzer:
    def __init__(self):
        # Initialize sentiment analysis pipeline
        self.sentiment_analyzer = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            device=-1  # Use CPU
        )
        
        # Initialize zero-shot classification pipeline for source types
        self.source_classifier = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli",
            device=-1
        )
        
        # Initialize TF-IDF vectorizer for keyword extraction
        self.vectorizer = TfidfVectorizer(
            max_features=50,
            stop_words='english',
            ngram_range=(1, 2)
        )

    def analyze_bias(self, text: str) -> Dict[str, Any]:
        """
        Analyze potential bias in the text using sentiment analysis and linguistic markers.
        
        Args:
            text: The article text to analyze
            
        Returns:
            Dict containing bias analysis results
        """
        # Perform sentiment analysis
        sentiment_results = self.sentiment_analyzer(text[:512])  # Use first chunk
        
        # Analyze language patterns
        blob = TextBlob(text)
        
        # Look for bias indicators
        bias_indicators = {
            'loaded_words': self._find_loaded_words(text),
            'subjective_sentences': self._get_subjective_sentences(blob),
            'sentiment': sentiment_results[0],
            'polarity': blob.sentiment.polarity,
            'subjectivity': blob.sentiment.subjectivity
        }
        
        return bias_indicators

    def classify_source(self, source_text: str, source_url: str) -> Source:
        """
        Classify the type and reliability of a source.
        
        Args:
            source_text: Text description or content of the source
            source_url: URL of the source
            
        Returns:
            Source object with classification details
        """
        # Define source type categories
        source_types = [
            "primary source",
            "secondary source",
            "opinion piece",
            "press release",
            "academic paper",
            "news article"
        ]
        
        # Classify source type
        type_results = self.source_classifier(
            source_text[:512],
            candidate_labels=source_types
        )
        
        # Determine source reliability based on domain and content
        reliability_score = self._assess_source_reliability(source_text, source_url)
        
        return Source(
            url=source_url,
            type=type_results['labels'][0],
            reliability_score=reliability_score,
            classification_confidence=type_results['scores'][0]
        )

    def extract_citations(self, text: str) -> List[UrlCitation]:
        """
        Extract and validate citations from the text.
        
        Args:
            text: The article text to analyze
            
        Returns:
            List of UrlCitation objects
        """
        # Find URLs in text
        url_pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'
        urls = re.findall(url_pattern, text)
        
        citations = []
        for url in urls:
            # Extract surrounding context
            context = self._extract_citation_context(text, url)
            
            citations.append(UrlCitation(
                url=url,
                context=context,
                verified=self._verify_citation(url)
            ))
        
        return citations

    def generate_annotations(self, text: str) -> List[Annotation]:
        """
        Generate annotations for key claims and statements.
        
        Args:
            text: The article text to analyze
            
        Returns:
            List of Annotation objects
        """
        annotations = []
        sentences = TextBlob(text).sentences
        
        for sentence in sentences:
            # Skip short or non-informative sentences
            if len(str(sentence)) < 20:
                continue
                
            # Analyze sentence importance and factual content
            importance = self._assess_sentence_importance(str(sentence))
            if importance > 0.5:  # Only annotate important sentences
                annotation = Annotation(
                    text=str(sentence),
                    category=self._categorize_statement(str(sentence)),
                    confidence=importance,
                    requires_verification=self._needs_verification(str(sentence))
                )
                annotations.append(annotation)
        
        return annotations

    def _find_loaded_words(self, text: str) -> List[str]:
        """Find emotionally charged or biased words in the text."""
        # Add your list of loaded words here
        loaded_words = [
            "obviously", "clearly", "naturally", "of course",
            "without doubt", "undoubtedly", "certainly"
        ]
        found_words = []
        for word in loaded_words:
            if word.lower() in text.lower():
                found_words.append(word)
        return found_words

    def _get_subjective_sentences(self, blob: TextBlob) -> List[str]:
        """Extract highly subjective sentences from the text."""
        return [str(sentence) for sentence in blob.sentences 
                if sentence.sentiment.subjectivity > 0.7]

    def _assess_source_reliability(self, text: str, url: str) -> float:
        """
        Assess the reliability of a source based on various factors.
        Returns a score between 0 and 1.
        """
        score = 0.5  # Start with neutral score
        
        # Domain-based scoring
        domain = url.split('/')[2]
        academic_domains = ['.edu', '.gov', '.org']
        if any(d in domain for d in academic_domains):
            score += 0.2
            
        # Content-based scoring
        if len(text) > 1000:  # Longer articles might be more detailed
            score += 0.1
            
        # Cap the score between 0 and 1
        return min(max(score, 0.0), 1.0)

    def _extract_citation_context(self, text: str, url: str) -> str:
        """Extract the surrounding context of a citation."""
        # Find the position of the URL in the text
        url_pos = text.find(url)
        if url_pos == -1:
            return ""
            
        # Extract surrounding context (100 characters before and after)
        start = max(0, url_pos - 100)
        end = min(len(text), url_pos + len(url) + 100)
        return text[start:end].strip()

    def _verify_citation(self, url: str) -> bool:
        """
        Verify if a citation is valid and accessible.
        This is a placeholder - implement actual verification logic.
        """
        return True  # Placeholder

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
        results = self.source_classifier(sentence, categories)
        return results['labels'][0]

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