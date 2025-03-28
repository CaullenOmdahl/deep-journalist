# Deep Journalist (Transitioning from Deep Research)

## Overview
This document tracks our progress in transitioning from Deep Research to Deep Journalist, a specialized tool for journalists to research, fact-check, and craft articles with integrity.

## Completed Tasks
- [x] Update application name across key files
- [x] Modify README.md with journalism-focused description
- [x] Extend Topic.tsx component to support URL input and event summary
- [x] Add SourceCredibilityIndicator component
- [x] Create ClaimVerificationStatus component
- [x] Add WordCountIndicator based on article types
- [x] Create ContentWarningDialog for sensitive content
- [x] Create URL content extractor service
  - [x] Implement webpage scraping functionality
  - [x] Extract key information (title, author, publication date, main content)
  - [x] Handle paywalls and robot blocking
  - [x] Add option for manual input if automatic extraction fails
- [x] Create PerspectiveBalanceVisualizer to ensure diverse viewpoints
- [x] Implement domain reputation checker for SourceValidator
- [x] Create automated checks for adherence to journalistic principles
- [x] Implement bias detection and neutralization
  - [x] Create bias detection algorithm
  - [x] Build a UI for highlighting and neutralizing biased language
  - [x] Support different political leanings and bias types
  - [x] Provide alternative phrasing suggestions

## Remaining Tasks
- [ ] Create SourcesPanel for managing and categorizing sources
- [ ] Develop metrics to evaluate articles against journalistic standards
- [ ] Implement advanced fact-checking with external APIs
- [ ] Create citation manager for proper attribution
- [ ] Build "Track Story" feature for following developing news
- [ ] Construct timeline feature for chronological event visualization
- [ ] Create ArticleStructureEditor for different journalism formats
- [ ] Update landing page with journalism-focused messaging
- [ ] Redesign logo to reflect journalistic focus

## Technical Debt
- [ ] Refactor state management for better performance
- [ ] Improve error handling for API requests
- [ ] Add comprehensive testing for journalism-specific features
- [ ] Optimize content extraction for paywalled sites 