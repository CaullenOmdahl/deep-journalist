import os
import pytest
from app.analysis.article_analyzer import ArticleAnalyzer
from app.models.schemas import Source, UrlCitation, Annotation

# Sample test data
SAMPLE_TEXT = """
According to recent studies by Harvard University (https://harvard.edu/study), climate change 
is accelerating faster than previously thought. The research indicates that global temperatures 
could rise by 2 degrees Celsius by 2050. However, some experts believe this estimate is too 
conservative. Dr. Jane Smith from MIT (https://mit.edu/climate) suggests that "the actual 
increase could be much higher, possibly reaching 3 degrees Celsius."

The World Bank (https://worldbank.org/report) estimates that this could cost the global 
economy trillions of dollars. Obviously, this is a concerning development that requires 
immediate action.
"""

@pytest.fixture
def analyzer():
    """Create an ArticleAnalyzer instance for testing."""
    return ArticleAnalyzer()

def test_analyze_bias(analyzer):
    """Test bias analysis functionality."""
    bias_results = analyzer.analyze_bias(SAMPLE_TEXT)
    
    assert isinstance(bias_results, dict)
    assert 'loaded_words' in bias_results
    assert 'subjective_sentences' in bias_results
    assert 'sentiment' in bias_results
    assert 'polarity' in bias_results
    assert 'subjectivity' in bias_results
    
    # Check if 'obviously' is detected as a loaded word
    assert 'obviously' in bias_results['loaded_words']

def test_classify_source(analyzer):
    """Test source classification functionality."""
    source = analyzer.classify_source(
        "Harvard University research paper on climate change",
        "https://harvard.edu/study"
    )
    
    assert isinstance(source, Source)
    assert source.url == "https://harvard.edu/study"
    assert isinstance(source.reliability_score, float)
    assert 0 <= source.reliability_score <= 1
    assert isinstance(source.classification_confidence, float)
    assert 0 <= source.classification_confidence <= 1

def test_extract_citations(analyzer):
    """Test citation extraction functionality."""
    citations = analyzer.extract_citations(SAMPLE_TEXT)
    
    assert isinstance(citations, list)
    assert len(citations) == 3  # Should find three URLs in the sample text
    assert all(isinstance(citation, UrlCitation) for citation in citations)
    
    # Check if all expected URLs are found
    urls = [citation.url for citation in citations]
    assert "https://harvard.edu/study" in urls
    assert "https://mit.edu/climate" in urls
    assert "https://worldbank.org/report" in urls

def test_generate_annotations(analyzer):
    """Test annotation generation functionality."""
    annotations = analyzer.generate_annotations(SAMPLE_TEXT)
    
    assert isinstance(annotations, list)
    assert len(annotations) > 0
    assert all(isinstance(annotation, Annotation) for annotation in annotations)
    
    # Check if important statements are annotated
    temperature_statement = next(
        (a for a in annotations if "2 degrees Celsius" in a.text),
        None
    )
    assert temperature_statement is not None
    assert temperature_statement.requires_verification  # Should require verification due to numbers

def test_find_loaded_words(analyzer):
    """Test loaded words detection."""
    loaded_words = analyzer._find_loaded_words(SAMPLE_TEXT)
    
    assert isinstance(loaded_words, list)
    assert "obviously" in loaded_words

def test_get_subjective_sentences(analyzer):
    """Test subjective sentence detection."""
    from textblob import TextBlob
    subjective_sentences = analyzer._get_subjective_sentences(TextBlob(SAMPLE_TEXT))
    
    assert isinstance(subjective_sentences, list)
    # The sentence with "Obviously" should be detected as subjective
    assert any("obviously" in sentence.lower() for sentence in subjective_sentences)

def test_assess_source_reliability(analyzer):
    """Test source reliability assessment."""
    reliability = analyzer._assess_source_reliability(
        "Academic research paper on climate change",
        "https://harvard.edu/study"
    )
    
    assert isinstance(reliability, float)
    assert 0 <= reliability <= 1
    # .edu domain should have higher reliability
    assert reliability > 0.5

def test_needs_verification(analyzer):
    """Test verification requirement detection."""
    # Test sentence with numbers
    assert analyzer._needs_verification("The temperature will rise by 2 degrees.")
    # Test sentence with attribution
    assert analyzer._needs_verification("According to experts, the impact will be severe.")
    # Test regular sentence
    assert not analyzer._needs_verification("This is a simple statement.") 