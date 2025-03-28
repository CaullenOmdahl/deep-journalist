/**
 * Timeline Builder Utility
 * 
 * Extracts dates and events from articles and sources to create
 * a chronological timeline of events for journalistic narratives.
 */

import { SearchTask } from "@/types";

/**
 * A single event in the timeline
 */
export interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  description: string;
  sourceId?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  category?: string;
  confidence: 'high' | 'medium' | 'low';
  conflicts?: string[];
}

/**
 * A collection of timeline events with metadata
 */
export interface Timeline {
  events: TimelineEvent[];
  startDate: Date;
  endDate: Date;
  title: string;
  description?: string;
}

/**
 * Options for timeline extraction
 */
export interface TimelineOptions {
  includeLowConfidence?: boolean;
  categorizeEvents?: boolean;
  detectConflicts?: boolean;
  includeSourceInfo?: boolean;
}

/**
 * Extract date patterns from text content
 * @param text Content to analyze for dates
 * @returns Array of potential dates with context
 */
function extractDatePatterns(text: string): Array<{
  dateString: string;
  index: number;
  surroundingText: string;
}> {
  const results: Array<{
    dateString: string;
    index: number;
    surroundingText: string;
  }> = [];
  
  // Common date formats
  const datePatterns = [
    // ISO format: 2023-01-31
    /\b(\d{4}-\d{1,2}-\d{1,2})\b/g,
    
    // Common US format: January 31, 2023 or Jan 31, 2023 or January 31 2023
    /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/g,
    
    // Common US numeric format: 01/31/2023 or 1/31/2023
    /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g,
    
    // Common European format: 31 January 2023 or 31 Jan 2023
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{4})\b/g,
    
    // Year with context: in 2023, during 2023
    /\b(?:in|during|by|before|after|since)\s+(\d{4})\b/g,
    
    // Relative dates: yesterday, last week, etc.
    /\b(yesterday|today|last\s+(?:week|month|year)|(?:this|next)\s+(?:week|month|year))\b/gi
  ];
  
  // Iterate through each pattern and extract matches
  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Get surrounding text (up to 100 chars on each side) for context
      const start = Math.max(0, match.index - 100);
      const end = Math.min(text.length, match.index + match[0].length + 100);
      const surroundingText = text.substring(start, end);
      
      results.push({
        dateString: match[0],
        index: match.index,
        surroundingText
      });
    }
  }
  
  return results;
}

/**
 * Parse date string to Date object
 * @param dateString String representation of a date
 * @param referenceDate Optional reference date for relative dates
 * @returns Date object or null if parsing fails
 */
function parseDate(dateString: string, referenceDate: Date = new Date()): Date | null {
  try {
    // Handle ISO dates
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateString)) {
      return new Date(dateString);
    }
    
    // Handle relative dates
    if (dateString.toLowerCase() === 'today') {
      return new Date(referenceDate);
    }
    
    if (dateString.toLowerCase() === 'yesterday') {
      const yesterday = new Date(referenceDate);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }
    
    if (/last\s+week/i.test(dateString)) {
      const lastWeek = new Date(referenceDate);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return lastWeek;
    }
    
    if (/last\s+month/i.test(dateString)) {
      const lastMonth = new Date(referenceDate);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return lastMonth;
    }
    
    if (/last\s+year/i.test(dateString)) {
      const lastYear = new Date(referenceDate);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      return lastYear;
    }
    
    // Handle "in 2023" type dates - set to January 1 of that year
    const yearMatch = /(?:in|during|by|before|after|since)\s+(\d{4})/.exec(dateString);
    if (yearMatch) {
      return new Date(`${yearMatch[1]}-01-01`);
    }
    
    // Try to parse with built-in Date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // Handle US format MM/DD/YYYY
    const usMatch = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(dateString);
    if (usMatch) {
      return new Date(`${usMatch[3]}-${usMatch[1]}-${usMatch[2]}`);
    }
    
    // Unable to parse
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Extract potential event from text surrounding a date
 * @param surroundingText Text around a date reference
 * @returns Potential event title and description
 */
function extractEventFromContext(surroundingText: string): {
  title: string;
  description: string;
} {
  // Split the text into sentences
  const sentences = surroundingText.split(/(?<=[.!?])\s+/);
  
  // Find the sentence containing the date
  let primarySentence = '';
  for (const sentence of sentences) {
    if (sentence.match(/\b(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}\/\d{4}|January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b/)) {
      primarySentence = sentence;
      break;
    }
  }
  
  // If no sentence with date was found, use the first sentence
  if (!primarySentence && sentences.length > 0) {
    primarySentence = sentences[0];
  }
  
  // Clean up the primary sentence to use as title
  const title = primarySentence
    .replace(/^\s+|\s+$/g, '') // Trim
    .replace(/^[,;:.]\s*/, '') // Remove leading punctuation
    .replace(/\s*[,;:]$/, '.') // Replace trailing punctuation with period
    .substring(0, 100); // Limit to 100 chars
  
  // Use the full context as description
  const description = surroundingText
    .replace(/^\s+|\s+$/g, '') // Trim
    .substring(0, 500); // Limit to 500 chars
  
  return { title, description };
}

/**
 * Determine confidence level in the extracted date and event
 * @param dateString The extracted date string
 * @param surroundingText The text surrounding the date
 * @returns Confidence level: high, medium, or low
 */
function determineConfidence(dateString: string, surroundingText: string): 'high' | 'medium' | 'low' {
  // Check for full date with year, month, and day
  if (/\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}\/\d{4}/.test(dateString)) {
    return 'high';
  }
  
  // Check for month, day, and year in text format
  if (/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/.test(dateString)) {
    return 'high';
  }
  
  // Check for relative dates - these are less precise
  if (/yesterday|last\s+week|last\s+month/i.test(dateString)) {
    return 'medium';
  }
  
  // Check for year-only references
  if (/\b(?:in|during|by|before|after|since)\s+\d{4}\b/.test(dateString)) {
    return 'medium';
  }
  
  // Check if the surrounding text has action verbs indicating an event
  const hasActionVerbs = /\b(?:announce|launch|release|start|begin|end|create|establish|form|found|discover|reveal|report|say|state|publish|issue|declare)\b/i.test(surroundingText);
  
  return hasActionVerbs ? 'medium' : 'low';
}

/**
 * Categorize events based on content keywords
 * @param event The event title and description
 * @returns Category name
 */
function categorizeEvent(event: { title: string; description: string }): string {
  const text = `${event.title} ${event.description}`.toLowerCase();
  
  // Define categories with associated keywords
  const categories = [
    {
      name: 'announcement',
      keywords: ['announce', 'statement', 'press release', 'declared', 'revealed', 'unveiled']
    },
    {
      name: 'policy',
      keywords: ['policy', 'regulation', 'law', 'legislation', 'rule', 'bill', 'act', 'reform']
    },
    {
      name: 'conflict',
      keywords: ['war', 'attack', 'combat', 'battle', 'fight', 'conflict', 'clash', 'dispute']
    },
    {
      name: 'disaster',
      keywords: ['disaster', 'catastrophe', 'emergency', 'crisis', 'accident', 'incident', 'tragedy']
    },
    {
      name: 'economy',
      keywords: ['economy', 'economic', 'market', 'financial', 'trade', 'business', 'stock', 'recession']
    },
    {
      name: 'science',
      keywords: ['research', 'study', 'discovery', 'scientist', 'scientific', 'experiment', 'technology']
    },
    {
      name: 'health',
      keywords: ['health', 'medical', 'disease', 'virus', 'pandemic', 'treatment', 'medicine', 'vaccine']
    },
    {
      name: 'politics',
      keywords: ['election', 'vote', 'campaign', 'political', 'president', 'government', 'parliament']
    }
  ];
  
  // Check each category
  for (const category of categories) {
    if (category.keywords.some(keyword => text.includes(keyword))) {
      return category.name;
    }
  }
  
  return 'general';
}

/**
 * Check for conflicting events on the same date
 * @param events List of timeline events
 * @returns Updated events with conflict information
 */
function detectConflicts(events: TimelineEvent[]): TimelineEvent[] {
  // Group events by date
  const eventsByDate: Record<string, TimelineEvent[]> = {};
  
  events.forEach(event => {
    const dateKey = event.date.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });
  
  // Check for conflicts within each date
  const updatedEvents = [...events];
  
  for (const dateKey in eventsByDate) {
    const dateEvents = eventsByDate[dateKey];
    
    if (dateEvents.length > 1) {
      // Compare event descriptions for potential conflicts
      for (let i = 0; i < dateEvents.length; i++) {
        for (let j = i + 1; j < dateEvents.length; j++) {
          const event1 = dateEvents[i];
          const event2 = dateEvents[j];
          
          // Check if the events might be contradictory
          const contradictionKeywords = ['however', 'but', 'contrary', 'despite', 'although', 'different'];
          const hasContradiction = contradictionKeywords.some(keyword => 
            event1.description.toLowerCase().includes(keyword) || 
            event2.description.toLowerCase().includes(keyword)
          );
          
          if (hasContradiction) {
            // Find the events in the updatedEvents array and update them
            const event1Index = updatedEvents.findIndex(e => e.id === event1.id);
            const event2Index = updatedEvents.findIndex(e => e.id === event2.id);
            
            if (event1Index !== -1 && event2Index !== -1) {
              updatedEvents[event1Index] = {
                ...updatedEvents[event1Index],
                conflicts: [...(updatedEvents[event1Index].conflicts || []), event2.id]
              };
              
              updatedEvents[event2Index] = {
                ...updatedEvents[event2Index],
                conflicts: [...(updatedEvents[event2Index].conflicts || []), event1.id]
              };
            }
          }
        }
      }
    }
  }
  
  return updatedEvents;
}

/**
 * Process a single source to extract timeline events
 * @param source Source article or document
 * @param options Timeline extraction options
 * @returns Array of timeline events
 */
function processSource(source: SearchTask, options: TimelineOptions): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  // Get the content to analyze
  const content = source.learning || '';
  
  // Extract dates with context
  const dateMatches = extractDatePatterns(content);
  
  // Process each date match
  dateMatches.forEach((match, index) => {
    // Parse the date
    const date = parseDate(match.dateString);
    if (!date) return; // Skip if date cannot be parsed
    
    // Extract event information from the surrounding text
    const { title, description } = extractEventFromContext(match.surroundingText);
    
    // Determine confidence level
    const confidence = determineConfidence(match.dateString, match.surroundingText);
    
    // Skip low confidence events if not explicitly included
    if (confidence === 'low' && !options.includeLowConfidence) return;
    
    // Generate a unique ID
    const id = `event-${source.id || 'unknown'}-${index}`;
    
    // Create the event
    const event: TimelineEvent = {
      id,
      date,
      title,
      description,
      confidence,
    };
    
    // Add source information if requested
    if (options.includeSourceInfo) {
      event.sourceId = source.id;
      event.sourceUrl = source.url;
      event.sourceTitle = source.title;
    }
    
    // Categorize the event if requested
    if (options.categorizeEvents) {
      event.category = categorizeEvent({ title, description });
    }
    
    events.push(event);
  });
  
  return events;
}

/**
 * Build a timeline from sources and content
 * @param sources List of sources to analyze
 * @param mainContent Optional main article content
 * @param options Timeline extraction options
 * @returns Timeline object with events
 */
export function buildTimeline(
  sources: SearchTask[],
  mainContent?: string,
  options: TimelineOptions = {}
): Timeline {
  // Set default options
  const opts = {
    includeLowConfidence: false,
    categorizeEvents: true,
    detectConflicts: true,
    includeSourceInfo: true,
    ...options
  };
  
  // Process all sources
  let allEvents: TimelineEvent[] = [];
  
  // Process sources
  sources.forEach(source => {
    const sourceEvents = processSource(source, opts);
    allEvents = [...allEvents, ...sourceEvents];
  });
  
  // Process main content if provided
  if (mainContent) {
    const mainSource: SearchTask = {
      id: 'main-content',
      query: 'Main Article',
      url: '',
      title: 'Main Article',
      state: 'completed',
      learning: mainContent
    };
    
    const mainEvents = processSource(mainSource, opts);
    allEvents = [...allEvents, ...mainEvents];
  }
  
  // Detect conflicts if requested
  if (opts.detectConflicts) {
    allEvents = detectConflicts(allEvents);
  }
  
  // Sort events chronologically
  allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Determine timeline start and end dates
  const startDate = allEvents.length > 0 ? allEvents[0].date : new Date();
  const endDate = allEvents.length > 0 ? allEvents[allEvents.length - 1].date : new Date();
  
  // Generate timeline title
  const title = allEvents.length > 0 
    ? `Timeline of Events (${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()})`
    : 'Timeline of Events';
  
  return {
    events: allEvents,
    startDate,
    endDate,
    title
  };
}

export default {
  buildTimeline
}; 