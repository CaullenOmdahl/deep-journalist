import { SearchTask, StoryTracking, StoryUpdate, TrackedStory } from "@/types";
import { v4 as uuidv4 } from "uuid";

/**
 * Extracts keywords from text to identify topics for story tracking
 */
export function extractKeywords(text: string): string[] {
  // Remove common stop words and punctuation
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", 
    "by", "about", "of", "from", "as", "that", "this", "which", "these", "those"
  ]);
  
  // Tokenize and clean text
  const cleanedText = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ').trim();
  
  const words = cleanedText.split(' ');
  
  // Filter out stop words and short words
  const filteredWords = words.filter(word => 
    !stopWords.has(word) && word.length > 3
  );
  
  // Calculate word frequencies
  const wordFrequency: Record<string, number> = {};
  filteredWords.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });
  
  // Sort by frequency and get top keywords
  const sortedWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0]);
  
  return sortedWords;
}

/**
 * Identifies potential story entities (people, organizations, locations)
 */
export function identifyEntities(text: string): {
  people: string[],
  organizations: string[],
  locations: string[]
} {
  // This is a basic implementation that could be enhanced with NLP libraries
  // For a production app, consider using a proper NER (Named Entity Recognition) service
  
  const people: string[] = [];
  const organizations: string[] = [];
  const locations: string[] = [];
  
  // Basic pattern matching for entities
  // People: Capitalized words followed by capitalized words
  const peoplePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
  const peopleMatches = text.match(peoplePattern) || [];
  peopleMatches.forEach(match => {
    if (!people.includes(match)) {
      people.push(match);
    }
  });
  
  // Organizations: Words with all caps or capitalized words with Inc, Corp, etc.
  const orgPattern = /\b([A-Z]{2,}|[A-Z][a-z]+ (Inc|Corp|LLC|Company|Association|Organization))\b/g;
  const orgMatches = text.match(orgPattern) || [];
  orgMatches.forEach(match => {
    if (!organizations.includes(match)) {
      organizations.push(match);
    }
  });
  
  // Locations: Common location patterns
  const locationPattern = /\b([A-Z][a-z]+ (City|County|State|Province|Region|District|Island))\b/g;
  const locationMatches = text.match(locationPattern) || [];
  locationMatches.forEach(match => {
    if (!locations.includes(match)) {
      locations.push(match);
    }
  });
  
  return { people, organizations, locations };
}

/**
 * Creates a new tracked story from research tasks
 */
export function createTrackedStory(tasks: SearchTask[], title: string, storyContent: string): TrackedStory {
  const id = uuidv4();
  const keywords = extractKeywords(storyContent);
  const entities = identifyEntities(storyContent);
  
  // Extract sources from all tasks
  const sources = tasks.reduce((allSources, task) => {
    if (task.sources && task.sources.length > 0) {
      return [...allSources, ...task.sources];
    }
    return allSources;
  }, [] as Source[]);
  
  // Generate tracking URLs based on sources and keywords
  const trackingUrls = generateTrackingUrls(sources, keywords);
  
  const tracked: TrackedStory = {
    id,
    title,
    dateCreated: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    keywords,
    entities,
    originalContent: storyContent,
    sources: sources.map(src => ({
      id: src.id || uuidv4(),
      url: src.url,
      title: src.title || '',
      lastChecked: new Date().toISOString(),
      updateFrequency: 'daily' // default check frequency
    })),
    tracking: {
      urls: trackingUrls,
      updateFrequency: 'daily',
      lastChecked: new Date().toISOString(),
      notificationsEnabled: true
    },
    updates: [],
    contentVersions: [
      {
        id: uuidv4(),
        content: storyContent,
        date: new Date().toISOString(),
        changeDescription: 'Initial version'
      }
    ]
  };
  
  return tracked;
}

/**
 * Generates tracking URLs based on source domains and keywords
 */
function generateTrackingUrls(sources: Source[], keywords: string[]): StoryTracking['urls'] {
  const trackingUrls: StoryTracking['urls'] = [];
  
  // For each major source domain, create a search URL with the story keywords
  const domains = new Set(sources.map(src => {
    try {
      const url = new URL(src.url);
      return url.hostname;
    } catch (e) {
      return null;
    }
  }).filter(Boolean) as string[]);
  
  // Add major news domains if we don't have many sources
  if (domains.size < 3) {
    domains.add('nytimes.com');
    domains.add('bbc.com');
    domains.add('apnews.com');
    domains.add('reuters.com');
  }
  
  // For each domain, create tracking URLs with key terms
  domains.forEach(domain => {
    if (domain.includes('nytimes.com')) {
      trackingUrls.push({
        id: uuidv4(),
        url: `https://www.nytimes.com/search?query=${keywords.slice(0, 3).join('+')}`,
        domain: 'nytimes.com',
        lastChecked: new Date().toISOString()
      });
    } else if (domain.includes('bbc.com') || domain.includes('bbc.co.uk')) {
      trackingUrls.push({
        id: uuidv4(),
        url: `https://www.bbc.co.uk/search?q=${keywords.slice(0, 3).join('+')}`,
        domain: 'bbc.com',
        lastChecked: new Date().toISOString()
      });
    } else if (domain.includes('apnews.com')) {
      trackingUrls.push({
        id: uuidv4(),
        url: `https://apnews.com/search?q=${keywords.slice(0, 3).join('+')}`,
        domain: 'apnews.com',
        lastChecked: new Date().toISOString()
      });
    } else if (domain.includes('reuters.com')) {
      trackingUrls.push({
        id: uuidv4(),
        url: `https://www.reuters.com/site-search/?query=${keywords.slice(0, 3).join('+')}`,
        domain: 'reuters.com',
        lastChecked: new Date().toISOString()
      });
    } else {
      // For other domains, use Google search with site: operator
      trackingUrls.push({
        id: uuidv4(),
        url: `https://www.google.com/search?q=site:${domain}+${keywords.slice(0, 3).join('+')}`,
        domain,
        lastChecked: new Date().toISOString()
      });
    }
  });
  
  // Add Google News alert
  trackingUrls.push({
    id: uuidv4(),
    url: `https://news.google.com/search?q=${keywords.slice(0, 5).join('+')}`,
    domain: 'news.google.com',
    lastChecked: new Date().toISOString()
  });
  
  return trackingUrls;
}

/**
 * Simulates checking for updates to a tracked story
 * In a real app, this would make actual HTTP requests or use news APIs
 */
export async function checkForUpdates(story: TrackedStory): Promise<StoryUpdate[]> {
  // This is a mock implementation that would be replaced with actual HTTP requests
  // or API calls in a production environment
  
  // Simulate finding some updates randomly
  const hasUpdates = Math.random() > 0.7;
  
  if (!hasUpdates) {
    return [];
  }
  
  // For simulation, we'll create 1-3 mock updates
  const numberOfUpdates = Math.floor(Math.random() * 3) + 1;
  const updates: StoryUpdate[] = [];
  
  for (let i = 0; i < numberOfUpdates; i++) {
    updates.push(createMockUpdate(story));
  }
  
  return updates;
}

/**
 * Creates a mock update for testing purposes
 */
function createMockUpdate(story: TrackedStory): StoryUpdate {
  const updateTypes = [
    'new_source',
    'source_update',
    'fact_correction',
    'new_development',
    'perspective_change'
  ];
  
  const significanceLevel = ['low', 'medium', 'high'] as const;
  const updateType = updateTypes[Math.floor(Math.random() * updateTypes.length)] as StoryUpdate['type'];
  
  // Choose a random source from the story
  const sourceIndex = Math.floor(Math.random() * story.sources.length);
  const source = story.sources[sourceIndex];
  
  // Generate mock content based on update type
  let content = '';
  let title = '';
  let suggestedRevision = '';
  
  switch (updateType) {
    case 'new_source':
      title = 'New source provides additional context';
      content = `A new publication has reported on this story with additional details that may be relevant to your coverage.`;
      suggestedRevision = `Consider incorporating the perspective from this new source to provide a more complete picture.`;
      break;
    case 'source_update':
      title = 'Source has updated their reporting';
      content = `${source.title || 'A source'} has published an update to their original story with new information.`;
      suggestedRevision = `The updated reporting contains facts that may affect your conclusions. Review the latest version.`;
      break;
    case 'fact_correction':
      title = 'Fact correction published';
      content = `A key fact in the original reporting has been corrected by multiple sources.`;
      suggestedRevision = `You may need to revise statements based on the corrected information.`;
      break;
    case 'new_development':
      title = 'Breaking development in story';
      content = `There is a significant new development in this story that changes its trajectory.`;
      suggestedRevision = `This new development may require substantial revisions to your article to remain current.`;
      break;
    case 'perspective_change':
      title = 'Shift in expert consensus';
      content = `There appears to be a shift in how experts are interpreting events related to this story.`;
      suggestedRevision = `Consider revisiting your analysis in light of changing expert opinions.`;
      break;
  }
  
  return {
    id: uuidv4(),
    date: new Date().toISOString(),
    type: updateType,
    title,
    content,
    sourceUrl: source?.url || '',
    sourceName: source?.title || 'Unknown Source',
    significance: significanceLevel[Math.floor(Math.random() * significanceLevel.length)],
    isRead: false,
    suggestedRevision
  };
}

/**
 * Updates a story with new content version based on updates
 */
export function createNewVersion(
  story: TrackedStory, 
  newContent: string, 
  changeDescription: string
): TrackedStory {
  const updatedStory = { ...story };
  
  // Add new content version
  updatedStory.contentVersions = [
    ...updatedStory.contentVersions,
    {
      id: uuidv4(),
      content: newContent,
      date: new Date().toISOString(),
      changeDescription
    }
  ];
  
  // Update the lastUpdated timestamp
  updatedStory.lastUpdated = new Date().toISOString();
  
  return updatedStory;
}

/**
 * Marks story updates as read
 */
export function markUpdatesAsRead(story: TrackedStory, updateIds?: string[]): TrackedStory {
  const updatedStory = { ...story };
  
  if (updateIds && updateIds.length > 0) {
    // Mark specific updates as read
    updatedStory.updates = updatedStory.updates.map(update => {
      if (updateIds.includes(update.id)) {
        return { ...update, isRead: true };
      }
      return update;
    });
  } else {
    // Mark all updates as read
    updatedStory.updates = updatedStory.updates.map(update => ({
      ...update,
      isRead: true
    }));
  }
  
  return updatedStory;
}

/**
 * Sets the update frequency for a tracked story
 */
export function setUpdateFrequency(
  story: TrackedStory, 
  frequency: 'hourly' | 'daily' | 'weekly'
): TrackedStory {
  return {
    ...story,
    tracking: {
      ...story.tracking,
      updateFrequency: frequency
    }
  };
}

/**
 * Toggles notifications for a tracked story
 */
export function toggleNotifications(story: TrackedStory): TrackedStory {
  return {
    ...story,
    tracking: {
      ...story.tracking,
      notificationsEnabled: !story.tracking.notificationsEnabled
    }
  };
}

/**
 * Adds a new tracking URL to monitor
 */
export function addTrackingUrl(story: TrackedStory, url: string, domain?: string): TrackedStory {
  try {
    // Validate URL and extract domain if not provided
    const urlObj = new URL(url);
    const urlDomain = domain || urlObj.hostname;
    
    const newTrackingUrl = {
      id: uuidv4(),
      url,
      domain: urlDomain,
      lastChecked: new Date().toISOString()
    };
    
    return {
      ...story,
      tracking: {
        ...story.tracking,
        urls: [...story.tracking.urls, newTrackingUrl]
      }
    };
  } catch (e) {
    // Invalid URL, return story unchanged
    console.error('Invalid URL provided:', url);
    return story;
  }
}

/**
 * Removes a tracking URL
 */
export function removeTrackingUrl(story: TrackedStory, urlId: string): TrackedStory {
  return {
    ...story,
    tracking: {
      ...story.tracking,
      urls: story.tracking.urls.filter(url => url.id !== urlId)
    }
  };
} 