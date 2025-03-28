# Deep Journalist Application Test Plan

This document outlines a structured approach to testing the Deep Journalist application to ensure all functionality works correctly.

## Test Environment
- Docker container running on port 3000
- Web browser: Chrome/Firefox/Edge
- Test credentials: None required

## Core Functionality Tests

### 1. Landing Page
- [ ] Verify landing page loads correctly with journalism-focused messaging
- [ ] Confirm all UI elements are properly styled and rendered
- [ ] Test responsive design on different screen sizes
- [ ] Ensure all buttons and links are clickable and navigate correctly
- [ ] Verify "Start Researching" button navigates to the main application

### 2. Topic Research
- [ ] Create new research topic with various complexity levels
- [ ] Test topic input field for valid/invalid inputs
- [ ] Verify topic suggestions feature if implemented
- [ ] Test topic editing and updating
- [ ] Confirm proper rendering of research questions

### 3. Source Management
- [ ] Add sources via URL input
- [ ] Verify source extraction works for various websites
- [ ] Test source credibility validation
- [ ] Confirm domain reputation checking functionality
- [ ] Test source categorization features
- [ ] Verify sources panel displays all added sources correctly
- [ ] Test source filtering and sorting
- [ ] Confirm source removal functionality

### 4. Bias Detection
- [ ] Test bias detection on sample text with known biases
- [ ] Verify bias neutralization suggestions
- [ ] Test highlighting of biased phrases
- [ ] Check different bias categories detection (political, emotional, etc.)
- [ ] Test bias severity indicators
- [ ] Verify saving neutralized text

### 5. Search Results
- [ ] Test search functionality with various queries
- [ ] Verify proper rendering of search results
- [ ] Test pagination/lazy loading if implemented
- [ ] Confirm source links are working correctly
- [ ] Test downloading search results
- [ ] Verify task management and deletion

### 6. Final Report
- [ ] Test report generation with various amounts of content
- [ ] Verify proper formatting of report content
- [ ] Test citations and references
- [ ] Check word count functionality
- [ ] Test saving and downloading reports
- [ ] Verify editing capabilities
- [ ] Test report templates if implemented

### 7. Timeline Features
- [ ] Test timeline visualization with chronological events
- [ ] Verify event extraction from sources
- [ ] Test timeline filtering and sorting
- [ ] Check timeline export functionality if implemented

### 8. Citation Manager
- [ ] Test generating citations in different academic styles
- [ ] Verify source metadata extraction
- [ ] Test citation copying to clipboard
- [ ] Check citation export functionality

### 9. Story Tracking
- [ ] Set up story tracking for a topic
- [ ] Test notification features for story updates
- [ ] Verify monitoring of developing stories
- [ ] Check story analytics if implemented

### 10. Article Structure Editor
- [ ] Test different article templates
- [ ] Verify template application to reports
- [ ] Check guidance features for journalism formats
- [ ] Test custom template creation if implemented

## Technical Tests

### 1. Performance
- [ ] Test application load time
- [ ] Verify response times for search operations
- [ ] Check rendering performance with large data sets
- [ ] Test simultaneous operations

### 2. Error Handling
- [ ] Test with unavailable sources (404 errors)
- [ ] Check handling of malformed inputs
- [ ] Verify appropriate error messages are displayed
- [ ] Test offline functionality if implemented
- [ ] Check recovery from API failures

### 3. Browser Compatibility
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Edge
- [ ] Test on Safari if available
- [ ] Check mobile browsers if relevant

### 4. Security
- [ ] Test input sanitization
- [ ] Check for exposed credentials in the UI
- [ ] Verify external links open safely
- [ ] Test XSS vulnerabilities with script injection attempts

## Testing Approach

### Exploratory Testing
1. Spend at least 30 minutes freely exploring the application
2. Note any unexpected behaviors or UI inconsistencies
3. Try edge cases and unusual workflows

### Session-Based Testing
1. Focus on one specific feature for 60-90 minutes
2. Document all observations and issues
3. Create specific scenarios to test feature limits

### Regression Testing
1. After fixing any issues, verify that the fix doesn't break other functionality
2. Retest related features

## Issue Tracking

Document issues in the following format:
- **ID**: [Incremental number]
- **Feature**: [Affected feature]
- **Severity**: [Critical/High/Medium/Low]
- **Description**: [Clear description of the issue]
- **Steps to Reproduce**: [Numbered steps]
- **Expected Result**: [What should happen]
- **Actual Result**: [What actually happens]
- **Screenshots/Recordings**: [If applicable]

## Test Report Template

After completing testing, summarize findings:

```
# Deep Journalist Test Report [Date]

## Summary
- Tests executed: [Number]
- Issues found: [Number]
- Critical issues: [Number]
- High priority issues: [Number]
- Medium priority issues: [Number]
- Low priority issues: [Number]

## Key Findings
1. [Major finding 1]
2. [Major finding 2]
3. [Major finding 3]

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

## Test Coverage
[Brief assessment of test coverage]

## Next Steps
[Suggested next steps] 