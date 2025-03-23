"""
Fact checking module for Deep-Journalist.
"""
from typing import List, Dict, Optional

from app.core.gemini.client import client
from app.models.fact_check import FactCheck, Source
from app.utils.logging.logger import get_logger

logger = get_logger(__name__)

class FactChecker:
    """Verify claims using Gemini AI."""
    
    async def verify_claims(self, claims: List[str], context: str) -> List[FactCheck]:
        """
        Verify a list of claims using Gemini AI.
        
        Args:
            claims: List of claims to verify
            context: Additional context for verification
            
        Returns:
            List of FactCheck objects containing verification results
            
        Raises:
            ValueError: If claims list is empty or invalid
        """
        if not claims or not isinstance(claims, list):
            raise ValueError("Invalid claims input")
            
        # Get raw verification results from Gemini
        raw_results = await client.verify_claims(claims, context)
        
        # Convert to FactCheck models
        return [
            FactCheck(
                claim=claim,
                verified=result["verified"],
                confidence=result["confidence"],
                evidence=result["evidence"],
                context=context,
                supporting_sources=[
                    Source(**source) for source in result["sources"]
                ]
            )
            for claim, result in zip(claims, raw_results)
        ]
        
    async def verify_claim(self, claim: str, context: str) -> FactCheck:
        """
        Verify a single claim using Gemini AI.
        
        Args:
            claim: The claim to verify
            context: Context around the claim
            
        Returns:
            FactCheck object containing verification results
            
        Raises:
            ValueError: If claim is empty or invalid
        """
        if not claim or not isinstance(claim, str):
            raise ValueError("Invalid claim input")
            
        # Get raw verification from Gemini
        raw_verification = await client.verify_claim(claim, context)
        
        # Convert to FactCheck model
        return FactCheck(
            claim=claim,
            verified=raw_verification["verified"],
            confidence=raw_verification["confidence"],
            evidence=raw_verification["evidence"],
            context=context,
            supporting_sources=[
                Source(**source) for source in raw_verification["sources"]
            ]
        )

    async def extract_claims(self, text: str) -> List[Dict[str, str]]:
        """
        Extract claims from text using Gemini AI.
        
        Args:
            text: Text to extract claims from
            
        Returns:
            List of dictionaries containing claims and their context
            
        Raises:
            ValueError: If text is empty or invalid
        """
        if not text or not isinstance(text, str):
            raise ValueError("Invalid text input")

        # Get raw claims from Gemini
        return await client.extract_claims(text)


# Global instance
checker = FactChecker()

# Convenience function
async def verify_article_claims(claims: List[str], context: str) -> List[FactCheck]:
    """Verify a list of claims from an article."""
    return await checker.verify_claims(claims, context)

async def extract_claims(text: str) -> List[str]:
    """
    Extract verifiable claims from text.
    
    Args:
        text: Text to analyze
        
    Returns:
        List of verifiable claims
    """
    try:
        logger.info("Extracting claims from text")
        claims = await client.extract_claims(text)
        logger.info(f"Extracted {len(claims)} claims")
        return claims
    except Exception as e:
        logger.error(f"Failed to extract claims: {str(e)}")
        raise

async def verify_claim(
    claim: str,
    context: Optional[str] = None,
    min_confidence: float = 0.7
) -> FactCheck:
    """
    Verify a single claim using Gemini AI.
    
    Args:
        claim: Claim to verify
        context: Optional context for verification
        min_confidence: Minimum confidence threshold
        
    Returns:
        FactCheck object with verification results
    """
    try:
        logger.info(f"Verifying claim: {claim}")
        
        # Get verification from Gemini
        results = await client.verify_facts([claim], context or "")
        if not results:
            raise ValueError("No verification results returned")
            
        result = results[0]
        
        # Create sources from required evidence
        sources = [
            Source(
                url=evidence,  # Assuming evidence is a URL, would need proper parsing
                title="",  # Would need to fetch title
                type="primary",  # Would need proper classification
                credibility_score=0.8,  # Would need proper scoring
                relevance_score=0.9,  # Would need proper scoring
            )
            for evidence in result["required_evidence"]
        ]
        
        fact_check = FactCheck(
            claim=claim,
            verified=result["verified"] and result["confidence"] >= min_confidence,
            confidence=result["confidence"],
            supporting_sources=sources,
            context=result["context"]
        )
        
        logger.info(
            f"Claim verification complete: verified={fact_check.verified}, "
            f"confidence={fact_check.confidence:.2f}"
        )
        
        return fact_check
        
    except Exception as e:
        logger.error(f"Claim verification failed: {str(e)}")
        raise

async def verify_article_claims(
    text: str,
    min_confidence: float = 0.7
) -> List[FactCheck]:
    """
    Extract and verify all claims in an article.
    
    Args:
        text: Article text
        min_confidence: Minimum confidence threshold
        
    Returns:
        List of FactCheck objects for each claim
    """
    try:
        logger.info("Starting article claims verification")
        
        # Extract claims
        claims = await extract_claims(text)
        
        # Verify each claim
        fact_checks = []
        for claim in claims:
            fact_check = await verify_claim(
                claim,
                context=text,
                min_confidence=min_confidence
            )
            fact_checks.append(fact_check)
            
        logger.info(
            f"Completed article verification: {len(fact_checks)} claims, "
            f"{sum(1 for fc in fact_checks if fc.verified)} verified"
        )
        
        return fact_checks
        
    except Exception as e:
        logger.error(f"Article verification failed: {str(e)}")
        raise 