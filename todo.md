# Deep Journalist: Transformation Checklist

## Project Overview
Convert the existing Deep Research application into a Deep Journalist tool that ingests article URLs or event summaries, searches for related articles and primary sources, and produces balanced, well-attributed journalistic articles without bias.

## 1. Application Rebranding

- [x] Update application name from "Deep Research" to "Deep Journalist" across all files
- [x] Modify README.md with new project description and features
- [x] Update page titles, metadata, and SEO information
- [ ] Redesign logo/favicon if applicable
- [ ] Update GitHub repository details and descriptions

## 2. Input System Modifications

- [x] Extend Topic.tsx component to support new input types:
  - [x] Add URL input field for article ingestion
  - [x] Add text area for event summary input
  - [x] Add time frame selector (e.g., past 24 hours, past week, past month, custom range)
  - [x] Add geographical focus option (local, national, international)
- [x] Create URL content extractor service:
  - [x] Implement webpage scraping functionality
  - [x] Extract key information: title, author, publication date, main content
  - [x] Handle paywalls and robot blocking (implement user agent rotation, delay mechanisms)
  - [x] Add option for manual input if automatic extraction fails
- [x] Create input validation system
  - [x] Validate URL format and accessibility
  - [x] Check for minimum content length for summaries
  - [ ] Detect input language and offer translation if needed

## 3. Search Strategy Enhancements

- [x] Modify src/utils/deep-research.ts with new prompt templates:
  - [x] Create generateJournalisticQueriesPrompt function
  - [x] Create processJournalisticSearchResultPrompt function
  - [x] Create reviewJournalisticQueriesPrompt function
- [x] Update searchTask interface in src/types.d.ts:
  - [x] Add sourceType: 'primary' | 'secondary' | 'official' | 'analysis' | 'commentary'
  - [x] Add credibilityScore: number
  - [x] Add publicationDate: string
  - [x] Add biasAssessment: string
- [x] Enhance query generation to target specifically:
  - [x] Primary sources and official statements
  - [x] Conflicting accounts and perspectives
  - [x] Historical context and precedents
  - [x] Expert analysis and factual verification
  - [x] Follow-up developments and latest updates

## 4. Source Management and Validation

- [x] Create new SourceValidator component:
  - [x] Implement credibility assessment algorithm
  - [x] Create source type classification system
  - [x] Add publication date extractor and validator
  - [x] Implement domain reputation checker
- [x] Create SourcesPanel component:
  - [x] Display sources categorized by type
  - [x] Show credibility metrics and bias assessment
  - [x] Allow manual adjustment of source credibility and categorization
  - [x] Provide source comparison view
- [x] Implement fact cross-referencing system:
  - [x] Extract claims from each source
  - [x] Match and compare similar claims across sources
  - [x] Highlight conflicts and agreements between sources
  - [x] Provide confidence score for verified facts

## 5. Article Generation Enhancement

- [x] Create new article templates and structures:
  - [x] News article format (inverted pyramid structure)
  - [x] Feature article format
  - [x] Investigative report format
  - [x] Explainer/contextual format
- [x] Implement src/utils/writeJournalisticArticlePrompt:
  - [x] Adapt to journalistic writing standards (AP style)
  - [x] Structure information by importance (most critical first)
  - [x] Ensure proper attribution for all claims and statements
  - [x] Generate balanced presentation of multiple perspectives
- [x] Add methodology and transparency section:
  - [x] List all sources consulted
  - [x] Explain source selection and validation process
  - [x] Acknowledge information gaps and limitations
  - [x] Detail fact-checking procedures applied
- [x] Implement bias detection and neutralization:
  - [x] Create database of biased terms and phrases
  - [x] Develop algorithms to detect subtle bias in text
  - [x] Suggest neutral alternatives for biased language
  - [x] Add visual highlighting of potentially biased content

## 6. UI/UX Modifications

- [ ] Redesign main interface:
  - [ ] Update landing page with journalism-focused messaging
  - [x] Create new article type selection interface
  - [x] Design source management dashboard
  - [ ] Implement article preview with formatting options
- [x] Create new custom components:
  - [x] SourceCredibilityIndicator component
  - [x] ClaimVerificationStatus component
  - [x] PerspectiveBalanceVisualizer component
  - [ ] ArticleStructureEditor component
- [x] Update existing components:
  - [x] Modify SearchResult.tsx to categorize sources
  - [x] Enhance FinalReport.tsx with journalistic formatting
  - [ ] Update MilkdownEditor with journalism-specific tools

## 7. New Features Implementation

- [x] Construct timeline feature for chronological event visualization
  - [x] Extract dates and events from articles
  - [x] Create visual timeline representation
  - [x] Allow filtering and zooming of timeline
  - [x] Highlight conflicting information from different sources
- [ ] Add automated fact-checking:
  - [ ] Connect to fact-checking databases (e.g., Google Fact Check API)
  - [ ] Flag claims that contradict verified information
  - [ ] Provide fact check references and explanations
- [ ] Implement citation manager:
  - [ ] Generate citations in multiple formats (APA, MLA, Chicago, etc.)
  - [ ] Create interactive footnotes/endnotes
  - [ ] Enable source management and organization
- [x] Build "Track Story" feature for following developing news
  - [x] Monitor sources for updates on a topic
  - [x] Notify of significant developments
  - [x] Maintain version history of changing narratives

## 8. Technical Infrastructure Updates

- [x] Update API integration:
  - [x] Add specialized Google Gemini prompts for journalistic tasks
  - [ ] Implement fallback mechanisms for API failures
  - [ ] Add caching system for frequent queries
- [x] Enhance data storage:
  - [x] Update schema in src/utils/storage.ts
  - [ ] Add version migration for existing research data
  - [ ] Implement more robust data backup solutions
- [ ] Improve error handling:
  - [ ] Create specialized error messages for journalistic workflow
  - [ ] Implement recovery mechanisms for interrupted processes
  - [ ] Add detailed logging for troubleshooting

## 9. Testing and Validation

- [ ] Create test cases:
  - [ ] Develop tests for URL content extraction
  - [ ] Test bias detection and neutralization
  - [ ] Validate source credibility assessment
  - [ ] Evaluate article quality and balance
- [ ] Perform user testing:
  - [ ] Create test scripts for journalism workflows
  - [ ] Gather feedback from journalism professionals
  - [ ] Test on various device types and screen sizes

## 10. Documentation Updates

- [x] Create user guide:
  - [x] Document workflow for different article types
  - [x] Explain source validation system
  - [x] Provide tips for optimal inputs and results
- [ ] Update developer documentation:
  - [ ] Document new components and functions
  - [ ] Create migration guide from Deep Research
  - [ ] Update API documentation

## 11. Deployment and Release

- [x] Create deployment pipeline:
  - [x] Update Docker configuration if needed
  - [ ] Configure CI/CD for the new features
  - [ ] Set up staging environment for testing
- [ ] Plan phased rollout:
  - [ ] Identify minimum viable product features
  - [ ] Create release schedule for additional features
  - [ ] Develop communication plan for existing users

## 12. Ethical Considerations

- [x] Implement ethical guidelines:
  - [x] Create transparency about AI-generated content
  - [x] Ensure privacy protection for sensitive topics
  - [x] Develop guidelines for controversial subjects
  - [x] Add content warnings where appropriate
- [ ] Develop fairness mechanisms:
  - [ ] Ensure equitable representation of perspectives
  - [ ] Create checks for unintentional bias
  - [ ] Implement diversity in source selection 

## 13. Journalistic Principles and Standards

### Core Pillars of Journalism
- [x] Implement the Society of Professional Journalists' core principles:
  - [x] Seek Truth and Report It: Ensure accuracy, thorough fact-checking, and context
  - [x] Minimize Harm: Consider consequences of reporting, respect privacy
  - [x] Act Independently: Avoid conflicts of interest, refuse gifts/favors
  - [x] Be Accountable and Transparent: Correct errors, explain methodologies
- [x] Create automated checks for adherence to these principles
- [x] Develop metrics to evaluate articles against journalistic standards
  - [x] Define key metrics (accuracy, fairness, completeness, ethics)
  - [x] Implement scoring system
  - [x] Provide feedback on areas for improvement

### Article Length and Structure Guidelines
- [x] Configure article length constraints based on type:
  - [x] News articles: 500-800 words (focused, concise reporting)
  - [x] Feature articles: 800-1,500 words (more depth, human interest)
  - [x] Investigative reports: 1,500-2,500 words (comprehensive analysis)
  - [x] Explainers: 800-1,200 words (contextual information)
- [x] Implement AP Style guidelines:
  - [x] Inverted pyramid structure for news (most important information first)
  - [x] Proper formatting for quotes, numbers, dates, and titles
  - [x] Consistent abbreviation rules
  - [x] Clear, concise language (avoid jargon)
- [x] Add word count indicator and enforcement in the editor
- [x] Create templates for each article type with proper structural elements 

## Features for Deep Journalist

- [x] Update application name in key files
- [x] Create SourceCredibilityIndicator component
  - [x] Implement rating scale (low to high reliability)
  - [x] Add tooltip with explanation of rating
  - [x] Create visual indicator with appropriate colors
- [x] Create ClaimVerificationStatus component
  - [x] Design status badges (Verified, Unverified, Disputed)
  - [x] Include sources for verification when applicable
  - [x] Allow toggle to show verification evidence
- [x] Create WordCountIndicator component 
  - [x] Track article word count
  - [x] Show warning/indicator for very short or very long articles
  - [x] Add standard count ranges for different article types
- [x] Create ContentWarningDialog component
  - [x] Detect potentially sensitive content
  - [x] Show appropriate content warnings before display
  - [x] Allow user to acknowledge/proceed
- [x] Create URL content extractor service
  - [x] Implement webpage scraping functionality
  - [x] Extract key information (title, author, publication date, main content)
  - [x] Handle paywalls and robot blocking
  - [x] Add option for manual input if automatic extraction fails
- [x] Implement domain reputation checker for SourceValidator
  - [x] Create database of known reliable/unreliable domains
  - [x] Add visual credibility indicator
  - [x] Provide domain reputation explanation
- [x] Create SourcesPanel for managing and categorizing sources
  - [x] Implement filtering by source type (primary, secondary, etc.)
  - [x] Add credibility sorting options
  - [x] Create PerspectiveBalanceVisualizer to show viewpoint distribution
- [x] Develop metrics to evaluate articles against journalistic standards
  - [x] Define key metrics (accuracy, fairness, completeness, ethics)
  - [x] Implement scoring system
  - [x] Provide feedback on areas for improvement
- [x] Create automated checks for adherence to these principles
  - [x] Implement source credibility checking
  - [x] Add bias detection and warning system
  - [x] Verify citation completeness
- [x] Implement bias detection and neutralization
  - [x] Create database of biased terms and phrases
  - [x] Develop algorithms to detect subtle bias in text
  - [x] Suggest neutral alternatives for biased language
  - [x] Add visual highlighting of potentially biased content
- [x] Create citation manager for proper attribution
  - [x] Support multiple citation styles (APA, MLA, Chicago)
  - [x] Auto-generate citations from source metadata
  - [x] Implement citation checking for completeness
- [x] Construct timeline feature for chronological event visualization
  - [x] Extract dates and events from articles
  - [x] Create visual timeline representation
  - [x] Allow filtering and zooming of timeline
  - [x] Highlight conflicting information from different sources
- [x] Build "Track Story" feature for following developing news
  - [x] Monitor sources for updates on a topic
  - [x] Notify of significant developments
  - [x] Maintain version history of changing narratives
- [x] Create ArticleStructureEditor for different journalism formats
  - [x] Add templates for common article types
  - [x] Provide structure guidance for different formats
  - [x] Include best practices tooltips
- [x] Update landing page with journalism-focused messaging
  - [x] Create educational content about journalistic principles
  - [x] Add examples of tool usage in journalism workflows
  - [x] Highlight ethical journalism capabilities
- [ ] Redesign logo to reflect journalistic focus
  - [ ] Create new brandmark incorporating journalistic themes
  - [ ] Update color scheme to reflect trustworthiness
  - [ ] Design new iconography for journalism-related features

## Technical Debt and Improvements

- [ ] Refactor state management for better performance
- [ ] Improve error handling for API requests
- [ ] Add comprehensive testing for journalism-specific features 
- [ ] Optimize content extraction for paywalled sites 