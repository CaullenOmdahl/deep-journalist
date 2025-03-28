/**
 * Domain Reputation Utility
 * 
 * Provides functionality to assess the credibility and reputation of domains/sources.
 * This helps journalists evaluate the reliability of sources in their research.
 */

import { extractDomainFromUrl } from './url-extractor';

/**
 * Types of media sources
 */
export type SourceType = 'primary' | 'secondary' | 'official' | 'analysis' | 'commentary';

/**
 * Domain reputation data
 */
export interface DomainReputation {
  domain: string;
  credibilityScore: number; // 0-10 scale
  factualReporting: 'very high' | 'high' | 'mostly factual' | 'mixed' | 'low' | 'very low' | 'unknown';
  bias: 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'unknown';
  type: SourceType;
  description?: string;
}

// Database of known domains with reputation data
// In a real application, this would be backed by an API or external database
const DOMAIN_REPUTATION_DB: Record<string, DomainReputation> = {
  'reuters.com': {
    domain: 'reuters.com',
    credibilityScore: 9,
    factualReporting: 'very high',
    bias: 'center',
    type: 'primary',
    description: 'International news organization known for factual reporting and minimal bias'
  },
  'apnews.com': {
    domain: 'apnews.com',
    credibilityScore: 9,
    factualReporting: 'very high',
    bias: 'center',
    type: 'primary',
    description: 'Associated Press - A primary source for factual reporting'
  },
  'bbc.com': {
    domain: 'bbc.com',
    credibilityScore: 8,
    factualReporting: 'high',
    bias: 'center-left',
    type: 'primary',
    description: 'British Broadcasting Corporation - Reliable international news source'
  },
  'nytimes.com': {
    domain: 'nytimes.com',
    credibilityScore: 7,
    factualReporting: 'high',
    bias: 'center-left',
    type: 'analysis',
    description: 'The New York Times - Established newspaper with strong factual reporting but some left-leaning bias'
  },
  'wsj.com': {
    domain: 'wsj.com',
    credibilityScore: 7,
    factualReporting: 'high',
    bias: 'center-right',
    type: 'analysis',
    description: 'Wall Street Journal - Established financial newspaper with right-leaning editorial stance'
  },
  'npr.org': {
    domain: 'npr.org',
    credibilityScore: 8,
    factualReporting: 'high',
    bias: 'center-left',
    type: 'primary',
    description: 'National Public Radio - Reliable reporting with minimal bias'
  },
  'foxnews.com': {
    domain: 'foxnews.com',
    credibilityScore: 4,
    factualReporting: 'mixed',
    bias: 'right',
    type: 'commentary',
    description: 'Right-leaning news network with mixed factual reporting'
  },
  'breitbart.com': {
    domain: 'breitbart.com',
    credibilityScore: 2,
    factualReporting: 'low',
    bias: 'right',
    type: 'commentary',
    description: 'Far-right news site with questionable factual reporting'
  },
  'huffpost.com': {
    domain: 'huffpost.com',
    credibilityScore: 5,
    factualReporting: 'mostly factual',
    bias: 'left',
    type: 'commentary',
    description: 'Left-leaning news and opinion site'
  },
  'theguardian.com': {
    domain: 'theguardian.com',
    credibilityScore: 7,
    factualReporting: 'high',
    bias: 'center-left',
    type: 'analysis',
    description: 'British newspaper with strong reporting but left-leaning perspective'
  },
  'cnn.com': {
    domain: 'cnn.com',
    credibilityScore: 6,
    factualReporting: 'mostly factual',
    bias: 'center-left',
    type: 'analysis',
    description: 'Cable News Network - Generally reliable but with some sensationalism'
  },
  'whitehouse.gov': {
    domain: 'whitehouse.gov',
    credibilityScore: 7,
    factualReporting: 'mostly factual',
    bias: 'center',
    type: 'official',
    description: 'Official US White House website - Primary source for government statements'
  },
  'who.int': {
    domain: 'who.int',
    credibilityScore: 8,
    factualReporting: 'high',
    bias: 'center',
    type: 'official',
    description: 'World Health Organization - Official source for global health information'
  },
  'sciencemag.org': {
    domain: 'sciencemag.org',
    credibilityScore: 9,
    factualReporting: 'very high',
    bias: 'center',
    type: 'primary',
    description: 'Science Magazine - Peer-reviewed scientific journal'
  },
  'nature.com': {
    domain: 'nature.com',
    credibilityScore: 9,
    factualReporting: 'very high',
    bias: 'center',
    type: 'primary',
    description: 'Nature - Highly respected peer-reviewed scientific journal'
  },
  'academic.oup.com': {
    domain: 'academic.oup.com',
    credibilityScore: 9,
    factualReporting: 'very high',
    bias: 'center',
    type: 'primary',
    description: 'Oxford University Press - Academic publisher of peer-reviewed research'
  }
};

/**
 * Get the reputation data for a domain
 * @param domain Domain name or URL
 * @returns Domain reputation data or null if not found
 */
export function getDomainReputation(domain: string): DomainReputation | null {
  // Extract domain if a full URL is provided
  const cleanDomain = domain.includes('://') ? extractDomainFromUrl(domain) : domain;
  
  // Try exact match first
  if (DOMAIN_REPUTATION_DB[cleanDomain]) {
    return DOMAIN_REPUTATION_DB[cleanDomain];
  }
  
  // Try to match subdomain (e.g., politics.nytimes.com should match nytimes.com)
  const parts = cleanDomain.split('.');
  if (parts.length > 2) {
    const mainDomain = parts.slice(-2).join('.');
    if (DOMAIN_REPUTATION_DB[mainDomain]) {
      return DOMAIN_REPUTATION_DB[mainDomain];
    }
  }
  
  return null;
}

/**
 * Assess the reputation of a domain
 * @param url URL or domain to assess
 * @returns Assessment with score and type
 */
export function assessDomainReputation(url: string): {
  score: number;
  type: SourceType;
  factualReporting: string;
  bias: string;
  description: string;
} {
  const domain = extractDomainFromUrl(url);
  const reputation = getDomainReputation(domain);
  
  if (reputation) {
    return {
      score: reputation.credibilityScore,
      type: reputation.type,
      factualReporting: reputation.factualReporting,
      bias: reputation.bias,
      description: reputation.description || ''
    };
  }
  
  // Heuristic assessment for unknown domains
  return inferDomainReputation(domain);
}

/**
 * Infer domain reputation for unknown domains using heuristics
 * @param domain Domain to assess
 */
function inferDomainReputation(domain: string): {
  score: number;
  type: SourceType;
  factualReporting: string;
  bias: string;
  description: string;
} {
  // Default assessment for unknown domains
  let assessment = {
    score: 5,
    type: 'secondary' as SourceType,
    factualReporting: 'unknown',
    bias: 'unknown',
    description: 'Domain not in our database. Exercise caution.'
  };
  
  // Check domain TLD for clues
  if (domain.endsWith('.gov')) {
    assessment = {
      ...assessment,
      score: 7,
      type: 'official',
      description: 'Government domain - likely an official source'
    };
  } else if (domain.endsWith('.edu')) {
    assessment = {
      ...assessment,
      score: 7,
      type: 'analysis',
      description: 'Educational institution - likely authoritative on academic subjects'
    };
  } else if (domain.endsWith('.org')) {
    assessment = {
      ...assessment,
      score: 6,
      description: 'Organization domain - verify the organization\'s credibility'
    };
  } else if (domain.match(/blog|wordpress|medium|substack/i)) {
    assessment = {
      ...assessment,
      score: 4,
      type: 'commentary',
      description: 'Blog platform - likely opinion-based content'
    };
  }
  
  return assessment;
}

/**
 * Get a list of highly credible domains for a given topic
 * Could be expanded with a proper topic classification system
 */
export function getCredibleSourcesForTopic(topic: string): string[] {
  // Basic implementation - in a real application, this would have more sophisticated
  // topic classification and matching logic
  const normalizedTopic = topic.toLowerCase();
  
  const allDomains = Object.values(DOMAIN_REPUTATION_DB)
    .filter(domain => domain.credibilityScore >= 7)
    .map(domain => domain.domain);
  
  if (normalizedTopic.includes('health') || normalizedTopic.includes('medicine')) {
    return [
      'who.int',
      'nih.gov',
      'cdc.gov',
      'mayoclinic.org',
      'nature.com',
      'sciencemag.org',
      ...allDomains
    ];
  }
  
  if (normalizedTopic.includes('politic') || normalizedTopic.includes('government')) {
    return [
      'reuters.com',
      'apnews.com',
      'bbc.com',
      'whitehouse.gov',
      'senate.gov',
      'house.gov',
      'un.org',
      ...allDomains
    ];
  }
  
  // Default recommendation for other topics
  return allDomains;
}

export default {
  getDomainReputation,
  assessDomainReputation,
  getCredibleSourcesForTopic
}; 