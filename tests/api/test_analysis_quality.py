"""
Tests for evaluating the quality of article analysis output.
"""
import json
from typing import Dict, List

import pytest
from playwright.async_api import Page, expect

from app.utils.logging.logger import get_logger

logger = get_logger(__name__)

# Quality thresholds
QUALITY_THRESHOLDS = {
    "min_primary_sources": 0.8,  # 80% should be primary sources
    "min_source_diversity": 3,    # At least 3 different source domains
    "max_bias_score": 0.3,       # Bias score should be below 0.3
    "min_neutral_score": 0.9,    # Neutral language score should be above 0.9
    "min_fact_confidence": 0.85,  # Fact check confidence should be above 85%
}

# Test articles with known characteristics
TEST_ARTICLES_QUALITY = {
    "balanced": {
        "url": "https://example.com/balanced-article",
        "expected_bias": 0.2,
        "expected_sources": 5,
    },
    "biased": {
        "url": "https://example.com/biased-article",
        "expected_bias": 0.7,
        "expected_sources": 2,
    },
    "comprehensive": {
        "url": "https://example.com/comprehensive-article",
        "expected_bias": 0.1,
        "expected_sources": 8,
    }
}

def evaluate_source_quality(sources: List[Dict]) -> Dict:
    """
    Evaluate the quality of sources.
    
    Args:
        sources: List of source objects
        
    Returns:
        Dictionary containing quality metrics and suggestions
    """
    # Count primary vs secondary sources
    primary_sources = [s for s in sources if s["type"] == "primary"]
    primary_ratio = len(primary_sources) / len(sources) if sources else 0
    
    # Check source diversity
    unique_domains = len(set(s["url"].split("/")[2] for s in sources))
    
    # Calculate average credibility
    avg_credibility = sum(s["credibility_score"] for s in sources) / len(sources) if sources else 0
    
    # Generate suggestions
    suggestions = []
    if primary_ratio < QUALITY_THRESHOLDS["min_primary_sources"]:
        suggestions.append(
            "Increase primary source ratio - current analysis relies too heavily on secondary sources"
        )
    if unique_domains < QUALITY_THRESHOLDS["min_source_diversity"]:
        suggestions.append(
            "Diversify sources - analysis would benefit from a broader range of sources"
        )
    if avg_credibility < 0.8:
        suggestions.append(
            "Improve source credibility - consider using more established sources"
        )
        
    return {
        "primary_ratio": primary_ratio,
        "unique_domains": unique_domains,
        "avg_credibility": avg_credibility,
        "meets_standards": all([
            primary_ratio >= QUALITY_THRESHOLDS["min_primary_sources"],
            unique_domains >= QUALITY_THRESHOLDS["min_source_diversity"],
            avg_credibility >= 0.8
        ]),
        "suggestions": suggestions
    }

def evaluate_bias_analysis(bias_analysis: Dict) -> Dict:
    """
    Evaluate the quality of bias analysis.
    
    Args:
        bias_analysis: Bias analysis results
        
    Returns:
        Dictionary containing quality metrics and suggestions
    """
    suggestions = []
    
    if bias_analysis["bias_score"] > QUALITY_THRESHOLDS["max_bias_score"]:
        suggestions.append(
            f"High bias detected ({bias_analysis['bias_score']:.2f}). "
            "Consider rewriting with more neutral language."
        )
        
    if bias_analysis["neutral_language_score"] < QUALITY_THRESHOLDS["min_neutral_score"]:
        suggestions.append(
            f"Low neutral language score ({bias_analysis['neutral_language_score']:.2f}). "
            "Review and revise loaded or emotional language."
        )
        
    if bias_analysis["perspective_balance"] < 0.7:
        suggestions.append(
            "Improve perspective balance by including more diverse viewpoints."
        )
        
    return {
        "meets_standards": all([
            bias_analysis["bias_score"] <= QUALITY_THRESHOLDS["max_bias_score"],
            bias_analysis["neutral_language_score"] >= QUALITY_THRESHOLDS["min_neutral_score"],
            bias_analysis["perspective_balance"] >= 0.7
        ]),
        "suggestions": suggestions
    }

def evaluate_fact_checking(fact_checks: List[Dict]) -> Dict:
    """
    Evaluate the quality of fact checking.
    
    Args:
        fact_checks: List of fact check results
        
    Returns:
        Dictionary containing quality metrics and suggestions
    """
    verified_claims = [fc for fc in fact_checks if fc["verified"]]
    high_confidence = [
        fc for fc in fact_checks 
        if fc["confidence"] >= QUALITY_THRESHOLDS["min_fact_confidence"]
    ]
    
    suggestions = []
    
    if len(verified_claims) / len(fact_checks) < 0.9:
        suggestions.append(
            "High number of unverified claims. Consider providing additional evidence."
        )
        
    if len(high_confidence) / len(fact_checks) < 0.8:
        suggestions.append(
            "Low confidence in fact checks. Strengthen claims with better sources."
        )
        
    return {
        "verification_rate": len(verified_claims) / len(fact_checks),
        "high_confidence_rate": len(high_confidence) / len(fact_checks),
        "meets_standards": all([
            len(verified_claims) / len(fact_checks) >= 0.9,
            len(high_confidence) / len(fact_checks) >= 0.8
        ]),
        "suggestions": suggestions
    }

async def test_analysis_quality_balanced(mock_page: Page):
    """Test analysis quality for a balanced article."""
    
    # Navigate to test endpoint
    await mock_page.goto(f"http://localhost:8000/api/docs")
    await mock_page.click("text=/analyze")
    await mock_page.click("text=Try it out")
    
    # Analyze balanced article
    request_body = {
        "url": TEST_ARTICLES_QUALITY["balanced"]["url"],
        "include_sources": True,
        "check_facts": True,
        "detect_bias": True
    }
    
    await mock_page.fill("textarea", json.dumps(request_body, indent=2))
    await mock_page.click("text=Execute")
    
    # Get and evaluate response
    response_pre = mock_page.locator("pre.response-content")
    await expect(response_pre).to_be_visible()
    response_text = await response_pre.text_content()
    analysis = json.loads(response_text)
    
    # Evaluate each aspect
    source_quality = evaluate_source_quality(analysis["sources"])
    bias_quality = evaluate_bias_analysis(analysis["bias_analysis"])
    fact_quality = evaluate_fact_checking(analysis["fact_checks"])
    
    # Log quality assessment
    logger.info("\n=== Analysis Quality Assessment ===")
    logger.info("Source Quality:")
    logger.info(f"- Primary source ratio: {source_quality['primary_ratio']:.2f}")
    logger.info(f"- Unique domains: {source_quality['unique_domains']}")
    logger.info(f"- Meets standards: {source_quality['meets_standards']}")
    if source_quality["suggestions"]:
        logger.info("Suggestions:")
        for suggestion in source_quality["suggestions"]:
            logger.info(f"  * {suggestion}")
            
    logger.info("\nBias Analysis:")
    logger.info(f"- Meets standards: {bias_quality['meets_standards']}")
    if bias_quality["suggestions"]:
        logger.info("Suggestions:")
        for suggestion in bias_quality["suggestions"]:
            logger.info(f"  * {suggestion}")
            
    logger.info("\nFact Checking:")
    logger.info(f"- Verification rate: {fact_quality['verification_rate']:.2f}")
    logger.info(f"- High confidence rate: {fact_quality['high_confidence_rate']:.2f}")
    logger.info(f"- Meets standards: {fact_quality['meets_standards']}")
    if fact_quality["suggestions"]:
        logger.info("Suggestions:")
        for suggestion in fact_quality["suggestions"]:
            logger.info(f"  * {suggestion}")
            
    # Assert quality standards
    assert source_quality["meets_standards"], "Source quality below standards"
    assert bias_quality["meets_standards"], "Bias analysis below standards"
    assert fact_quality["meets_standards"], "Fact checking below standards"

async def test_analysis_quality_improvement_needed(mock_page: Page):
    """Test quality assessment for an article needing improvement."""
    
    # Navigate to test endpoint
    await mock_page.goto(f"http://localhost:8000/api/docs")
    await mock_page.click("text=/analyze")
    await mock_page.click("text=Try it out")
    
    # Analyze biased article
    request_body = {
        "url": TEST_ARTICLES_QUALITY["biased"]["url"],
        "include_sources": True,
        "check_facts": True,
        "detect_bias": True
    }
    
    await mock_page.fill("textarea", json.dumps(request_body, indent=2))
    await mock_page.click("text=Execute")
    
    # Get and evaluate response
    response_pre = mock_page.locator("pre.response-content")
    await expect(response_pre).to_be_visible()
    response_text = await response_pre.text_content()
    analysis = json.loads(response_text)
    
    # Evaluate quality
    source_quality = evaluate_source_quality(analysis["sources"])
    bias_quality = evaluate_bias_analysis(analysis["bias_analysis"])
    fact_quality = evaluate_fact_checking(analysis["fact_checks"])
    
    # Log detailed improvement suggestions
    logger.info("\n=== Quality Improvement Recommendations ===")
    
    all_suggestions = (
        source_quality["suggestions"] +
        bias_quality["suggestions"] +
        fact_quality["suggestions"]
    )
    
    if all_suggestions:
        logger.info("The following improvements are recommended:")
        for i, suggestion in enumerate(all_suggestions, 1):
            logger.info(f"{i}. {suggestion}")
    
    # For this test, we expect to find areas needing improvement
    assert len(all_suggestions) > 0, "Expected to find areas needing improvement" 