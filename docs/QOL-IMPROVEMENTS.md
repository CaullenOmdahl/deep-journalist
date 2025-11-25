# Quality of Life Improvements for Deep Journalist

Based on research of similar AI research and journalism tools, this document outlines recommended QOL improvements organized by priority and effort.

---

## High-Impact QOL Improvements

### 1. Focus Modes
**Inspired by:** [Perplexica](https://github.com/ItzCrazyKns/Perplexica)

Add specialized research modes for different source types:
- **Academic Mode** - Prioritize scholarly sources, .edu domains, peer-reviewed papers
- **Social Media Mode** - Focus on Twitter/Reddit discussions for public sentiment
- **News Mode** - Limit to verified news outlets only
- **Primary Sources Mode** - Government documents, official statements, press releases
- **Local News Mode** - Regional publications and local government sources

**Implementation Notes:**
- Add mode selector to Topic.tsx input component
- Modify search query generation prompts based on selected mode
- Filter sources by domain patterns in source processing

---

### 2. Smart Query Suggestions
**Inspired by:** [Perplexica](https://github.com/ItzCrazyKns/Perplexica)

Show intelligent autocomplete suggestions while typing research topics:
- Trending news topics from news APIs
- Related research from user's history
- Common journalistic angles (who, what, when, where, why)
- Suggested follow-up questions based on initial topic

**Implementation Notes:**
- Add suggestion dropdown to Topic.tsx
- Query history store for related past research
- Optional: Integrate with trending topics API (Google Trends, NewsAPI)

---

### 3. Visual Research Mapping
**Inspired by:** [open-deep-research](https://github.com/btahir/open-deep-research)

Add a visual graph showing:
- Connections between research queries
- Source relationships and overlaps
- How different findings link together
- Research path visualization (breadth vs depth)

**Implementation Notes:**
- Consider using react-flow or d3.js for graph visualization
- Store relationship data in task store
- Add new tab to SearchResult.tsx alongside existing tabs

---

### 4. Multiple Export Formats
**Inspired by:** [open-deep-research](https://github.com/btahir/open-deep-research)

Currently only has markdown/PDF. Add:
- **Word (.docx)** - For traditional newsrooms (use docx library)
- **JSON** - For data journalism pipelines (structured export of all research data)
- **HTML** - For web publishing with embedded styles
- **Plain Text** - Clean text without formatting
- **Google Docs integration** - Direct export via Google Docs API

**Implementation Notes:**
- Extend downloadFile utility in src/utils/file.ts
- Add export format selector to FinalReport.tsx
- Consider docx or html-docx-js for Word export

---

### 5. Knowledge Base / Research Library
**Inspired by:** [open-deep-research](https://github.com/btahir/open-deep-research)

Save and organize completed research for future reference:
- Search across all past research sessions
- Tag research by topic, project, or custom labels
- Quick-reuse of sources in new articles
- Favorite/star important research
- Filter by date range, article type, or tags

**Implementation Notes:**
- Extend history store with tags and search functionality
- Add new KnowledgeBase component
- Consider IndexedDB for larger storage capacity

---

## Medium-Impact QOL Improvements

### 6. Recursive/Deep Dive Mode
**Inspired by:** [open-deep-research](https://github.com/btahir/open-deep-research)

"Flow" feature that enables iterative deep research:
- Automatically generates follow-up questions from findings
- Dives deeper into interesting or underexplored topics
- Creates a research tree users can explore and prune
- Set maximum depth and breadth parameters

**Implementation Notes:**
- Add depth/breadth controls to research settings
- Modify useDeepResearch hook to support recursive queries
- Track research tree structure in task store

---

### 7. Time-based Search Filtering
Add granular time controls for research:
- Custom date range picker (from/to dates)
- "Breaking news" mode (last hour, last 6 hours)
- Historical research mode (specific years or decades)
- Relative time presets (last week, last month, last quarter)

**Implementation Notes:**
- Extend Topic.tsx time filter options
- Pass time constraints to search query generation
- Add date range picker component

---

### 8. Domain Allowlist/Blocklist
Let users control which sources are used:
- Block unreliable or unwanted domains
- Create allowlists of trusted sources per topic
- Import/export domain lists for team sharing
- Pre-configured lists (e.g., "Major US News", "Academic Only")

**Implementation Notes:**
- Add domain management to settings
- Store lists in setting store with persistence
- Filter sources in runSearchTask based on lists

---

### 9. Search Engine Selection
**Inspired by:** [Decentralised-AI/deep-research2](https://github.com/Decentralised-AI/deep-research2)

Support multiple search backends:
- SearxNG (privacy-focused, self-hosted)
- Tavily (AI-optimized search)
- Brave Search API
- Google Custom Search
- Bing Search API
- Exa (neural search)

**Implementation Notes:**
- Abstract search provider interface
- Add provider selection to settings
- Store API keys per provider

---

### 10. Readability Scoring
Add automatic readability metrics:
- Flesch-Kincaid reading level
- Gunning Fog Index
- Average sentence/paragraph length
- Target audience suggestions (general public, expert, etc.)
- Word count and estimated read time

**Implementation Notes:**
- Add readability utility functions
- Display metrics in JournalisticMetricsPanel
- Provide suggestions for improving readability

---

## Quick Wins (Low-effort, High-value)

### 11. Keyboard Shortcuts
Add keyboard shortcuts for common actions:
- `Ctrl/Cmd + Enter` - Start research
- `Ctrl/Cmd + S` - Save/export current article
- `Ctrl/Cmd + N` - New research session
- `Ctrl/Cmd + H` - Open history
- `Ctrl/Cmd + ,` - Open settings
- `Escape` - Cancel current operation / close modals

**Implementation Notes:**
- Add useHotkeys hook or use existing keyboard event handling
- Display shortcut hints in UI tooltips

---

### 12. Research Progress Indicator
Show a visual progress bar or step indicator:
```
[1. Generating queries] → [2. Searching] → [3. Analyzing] → [4. Writing]
     ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                    35% Complete
```

**Implementation Notes:**
- Track current step in task store
- Add Progress component to research view
- Calculate percentage based on completed tasks

---

### 13. Copy to Clipboard Buttons
One-click copy functionality for:
- Full article text
- Individual citations (formatted)
- Source URLs (as list)
- Social media snippets
- Individual paragraphs or sections

**Implementation Notes:**
- Add copy buttons throughout UI
- Use navigator.clipboard API
- Show toast confirmation on copy

---

### 14. Discover/Trending Topics
**Inspired by:** [Perplexica](https://github.com/ItzCrazyKns/Perplexica)

Show suggested research topics on landing page:
- Trending news stories
- Topics related to user's research history
- Seasonal/timely subjects
- Editor's picks or curated suggestions

**Implementation Notes:**
- Add Discover section to landing page
- Optional: Integrate with news/trends API
- Generate suggestions from history patterns

---

### 15. Session Naming
Let users name research sessions with custom titles:
- Edit session name after creation
- Search history by session name
- Default to auto-generated name from topic

**Implementation Notes:**
- Add title field to task store
- Add inline edit to history list
- Update history dialog UI

---

### 16. Research Templates
Pre-configured setups for common journalism scenarios:
- **Breaking News** - Fast mode, recent sources only, concise output
- **Investigative Piece** - Deep mode, primary sources prioritized, comprehensive
- **Feature Story** - Balanced mode, diverse sources, narrative style
- **Fact-Check** - Verification focused, authoritative sources, claim tracking
- **Opinion/Analysis** - Expert sources, multiple perspectives

**Implementation Notes:**
- Store templates in settings or constants
- Add template selector to Topic.tsx
- Apply template settings on selection

---

### 17. Estimated Time Indicator
Show estimated completion time based on:
- Number of search queries to process
- Selected research depth/breadth
- Current API rate limit status
- Historical completion times

**Implementation Notes:**
- Calculate estimate from task count and rate limits
- Display in research progress area
- Update estimate as research progresses

---

### 18. Quick Settings Toggle
Add a floating quick-settings panel for:
- Model switching without opening full settings
- Toggle research depth (quick/balanced/thorough)
- Language selection for output
- Article type quick-select

**Implementation Notes:**
- Add floating panel component
- Connect to setting store
- Position near main action buttons

---

## Summary Table

| # | Feature | Effort | Impact | Priority |
|---|---------|--------|--------|----------|
| 1 | Focus Modes | Medium | High | P1 |
| 2 | Smart Suggestions | Medium | High | P1 |
| 3 | Visual Research Map | High | High | P2 |
| 4 | Multiple Export Formats | Low | High | P1 |
| 5 | Knowledge Base | Medium | High | P1 |
| 6 | Recursive Deep Dive | Medium | Medium | P2 |
| 7 | Time-based Filtering | Low | Medium | P2 |
| 8 | Domain Allow/Block | Medium | Medium | P2 |
| 9 | Search Engine Selection | Medium | Medium | P3 |
| 10 | Readability Scoring | Low | Medium | P2 |
| 11 | Keyboard Shortcuts | Low | Medium | P1 |
| 12 | Progress Indicator | Low | Medium | P1 |
| 13 | Copy Buttons | Low | Medium | P1 |
| 14 | Discover/Trending | Medium | Low | P3 |
| 15 | Session Naming | Low | Medium | P1 |
| 16 | Research Templates | Low | Medium | P2 |
| 17 | Time Estimate | Low | Low | P3 |
| 18 | Quick Settings | Low | Medium | P2 |

---

## Research Sources

### Similar Projects Analyzed

1. **Perplexica** - AI-powered answering engine with focus modes and smart suggestions
   - GitHub: https://github.com/ItzCrazyKns/Perplexica
   - Key Features: 6 focus modes, local LLM support, smart suggestions, discover feature

2. **open-deep-research** (btahir) - Customizable research and report generation
   - GitHub: https://github.com/btahir/open-deep-research
   - Key Features: Visual research mapping, multiple export formats, knowledge base, flow/recursive research

3. **open_deep_research** (LangChain) - Research tool with benchmark evaluation
   - GitHub: https://github.com/langchain-ai/open_deep_research
   - Key Features: PhD-level research tasks, multi-language support, GPT-5 integration

4. **deep-research2** (Decentralised-AI) - Multi-provider research tool
   - GitHub: https://github.com/Decentralised-AI/deep-research2
   - Key Features: Multiple LLM providers, multiple search engines, local data storage

5. **DeepResearchAgent** (SkyworkAI) - Hierarchical multi-agent research system
   - GitHub: https://github.com/SkyworkAI/DeepResearchAgent
   - Key Features: Multi-agent coordination, task decomposition, specialized agents

6. **gemini-deep-research-oss** - Gemini-focused iterative research
   - GitHub: https://github.com/zyakita/gemini-deep-research-oss
   - Key Features: Multi-step iterative research, agent-based architecture

### Journalism & AI Resources

7. **JournalismAI** - LSE/Google News Initiative project
   - Website: https://www.journalismai.info/
   - Focus: AI accessibility for newsrooms, journalist training

8. **LanguageTool** - Open-source writing assistant
   - Key Features: Self-hosting option, multilingual, rule-based + AI hybrid

9. **Journalist's Toolbox** - AI tools directory for journalists
   - Website: https://journaliststoolbox.ai/
   - Focus: Curated AI tools for journalism workflows

---

## Implementation Roadmap Suggestion

### Phase 1 - Quick Wins (1-2 weeks)
- Keyboard shortcuts
- Copy to clipboard buttons
- Progress indicator
- Session naming
- Multiple export formats (JSON, HTML)

### Phase 2 - Core Features (2-4 weeks)
- Focus modes
- Research templates
- Knowledge base with tags
- Readability scoring
- Quick settings toggle

### Phase 3 - Advanced Features (4-8 weeks)
- Smart query suggestions
- Visual research mapping
- Recursive deep dive mode
- Domain allow/block lists
- Time-based filtering improvements

### Phase 4 - Integrations (ongoing)
- Search engine selection
- Discover/trending topics
- External API integrations

---

## UI/UX Improvements

Based on detailed analysis of the current codebase and component structure.

### Critical Issues (Fix Immediately)

#### 19. Remove Debug Button from Production
**Location:** `src/components/Research/FinalReport.tsx`

The yellow "Debug: Add Sample Content" button is visible in production and should be removed or hidden behind a dev flag.

**Implementation Notes:**
- Wrap in `process.env.NODE_ENV === 'development'` check
- Or remove entirely

---

#### 20. Remove Duplicate Toolbar Content
**Location:** `src/components/Research/FinalReport.tsx`

The metrics/tools section appears twice in the DOM - once in the main content area and again below it (lines ~663-879 and ~859-878).

**Implementation Notes:**
- Audit FinalReport.tsx for duplicate renders
- Remove redundant section

---

#### 21. Mask API Key Input
**Location:** `src/components/Setting.tsx`

The API key input shows the full key in plain text - security concern.

**Implementation Notes:**
- Change input type to "password"
- Add show/hide toggle button
- Consider partial masking (show last 4 chars)

---

#### 22. Add Landing Page Images
**Location:** `src/app/page.tsx`, `/public/`

Placeholder SVGs fallback to external service when images are missing.

**Implementation Notes:**
- Create or source appropriate illustrations
- Add to `/public/images/` directory
- Update image paths in landing page

---

### High-Impact UI/UX Improvements

#### 23. Reorganize FinalReport Layout
**Current:** 962-line component with everything stacked vertically
**Proposed:** Sidebar or tab-based organization

```
┌─────────────────────────────────────────────────────┐
│  [Article Type ▼]  [Translate]  [Export]            │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  📝 Editor   │    Article Content                   │
│  📊 Metrics  │    ════════════════                  │
│  ⚠️ Bias     │                                      │
│  📚 Sources  │    Lorem ipsum dolor sit amet...     │
│  ✓ Claims    │                                      │
│  🕐 Timeline │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

**Implementation Notes:**
- Extract sidebar navigation component
- Use tabs or collapsible panels for tools
- Keep article content as main focus
- Consider react-resizable-panels for adjustable layout

---

#### 24. Progressive Disclosure for Settings
**Current:** Overwhelming modal with all options visible
**Proposed:** Grouped sections with expandable advanced options

```
Essential Settings (always visible)
├── API Key
├── Model Selection
└── Language

Advanced Settings (collapsed by default)
├── API Proxy URL
├── Rate Limit Configuration
└── Access Password
```

**Implementation Notes:**
- Use Accordion component for sections
- Mark required vs optional fields
- Add "Show Advanced" toggle

---

#### 25. Prominent Article Type Selector
**Current:** Hidden in a Popover, hard to discover
**Proposed:** Visible segmented control or button group

```
┌──────────────────────────────────────────────────────┐
│  Article Type:  [News] [Feature] [Investigative] [Explainer]  │
└──────────────────────────────────────────────────────┘
```

**Implementation Notes:**
- Use ToggleGroup or custom button group
- Show word count range for each type
- Add tooltips explaining each type

---

#### 26. Empty States for All Components
**Current:** Components show nothing when empty
**Proposed:** Helpful empty states with guidance

Examples:
- Sources Panel: "No sources found yet. Start research to discover sources."
- Bias Detector: "No bias detected. Your article appears neutral. ✓"
- Claims: "No claims to verify. Highlight text and mark as claim."
- Timeline: "No timeline events extracted. Add sources with dates."

**Implementation Notes:**
- Create reusable EmptyState component
- Include icon, message, and optional action button
- Use muted colors to not distract

---

### Medium-Impact UI/UX Improvements

#### 27. Consistent Expandable Pattern
**Current:** Mix of Accordion and Collapsible components
**Proposed:** Standardize on Accordion for all expandable sections

**Implementation Notes:**
- Audit all expandable sections
- Convert Collapsible to Accordion where appropriate
- Ensure consistent chevron/arrow indicators

---

#### 28. Mobile Toolbar Improvements
**Current:** Dense toolbar buttons hard to tap on mobile
**Proposed:** Responsive toolbar with mobile adaptations

Options:
- Hamburger menu on mobile for secondary actions
- Bottom action bar for primary actions (Start Research, Export)
- Minimum 44x44px touch targets

**Implementation Notes:**
- Add `md:` breakpoint variations
- Consider DropdownMenu for grouped actions on mobile
- Test on actual mobile devices

---

#### 29. Accessibility: Color + Icon Indicators
**Current:** Bias severity uses color alone
**Proposed:** Add icons alongside colors

```
Current:  🔴 High    🟠 Medium   🟡 Low    🟢 None
Proposed: ⚠️ High    ⚡ Medium   💡 Low    ✓ None
```

**Implementation Notes:**
- Add icons to Badge components
- Ensure sufficient color contrast (WCAG AA)
- Add aria-labels for screen readers

---

#### 30. Command Palette (Cmd+K)
Add quick navigation and actions via command palette:

Features:
- Jump to sections (Sources, Timeline, Metrics)
- Quick settings changes
- Export options
- Recent research sessions
- Search across content

**Implementation Notes:**
- Use cmdk library or build custom
- Register global keyboard listener
- Group commands by category

---

#### 31. Split-Pane Editor View
Side-by-side markdown source and preview:

```
┌─────────────────┬─────────────────┐
│   # Headline    │   Headline      │
│                 │   ═════════     │
│   **Bold**      │   Bold          │
│   - Item 1      │   • Item 1      │
└─────────────────┴─────────────────┘
```

**Implementation Notes:**
- Use react-resizable-panels
- Sync scroll positions
- Toggle between split/preview-only/source-only

---

#### 32. Research Progress Stepper
Visual indicator of workflow progress:

```
[1. Input] ─── [2. Research] ─── [3. Analysis] ─── [4. Write]
    ✓              ●                 ○                ○
```

**Implementation Notes:**
- Track current step in task store
- Use Stepper or custom component
- Show substeps for research phase

---

### Quick UI/UX Wins

#### 33. Keyboard Shortcut Hints in Tooltips
Enhance tooltips with shortcut information:

```
"Settings (⌘,)"
"New Research (⌘N)"
"Export (⌘E)"
"History (⌘H)"
```

**Implementation Notes:**
- Detect OS for ⌘ vs Ctrl display
- Add to all actionable buttons
- Consider shortcut legend in help

---

#### 34. Loading Skeletons
Replace spinners with skeleton loaders for content areas:

```
┌────────────────────────────┐
│ ████████████████░░░░░░░░░░ │
│ ██████████░░░░░░░░░░░░░░░░ │
│ ████████████████████░░░░░░ │
└────────────────────────────┘
```

**Implementation Notes:**
- Use shadcn Skeleton component
- Match content layout structure
- Animate with pulse effect

---

#### 35. Toast Positioning
**Current:** Toasts may cover header actions
**Proposed:** Move to bottom-right corner

**Implementation Notes:**
- Configure Sonner position prop
- Ensure doesn't overlap with floating menu
- Stack multiple toasts properly

---

#### 36. Sticky Section Headers
Make section headers sticky when scrolling long content:

**Implementation Notes:**
- Add `sticky top-0` with background
- Use z-index layering
- Add subtle shadow on scroll

---

#### 37. Drag-and-Drop for Sources
Allow reordering sources by dragging in SourcesPanel:

**Implementation Notes:**
- Use @dnd-kit/core or react-beautiful-dnd
- Add drag handle icon
- Persist order in task store

---

#### 38. Confirmation Dialogs
Add confirmation for destructive actions:

- Delete research session
- Clear all sources
- Remove claim verification
- Reset article content

**Implementation Notes:**
- Use AlertDialog component
- Include "Don't ask again" option for some
- Make action buttons clearly labeled (Delete vs Cancel)

---

### Visual Design Improvements

#### 39. Reduce Visual Density
**Current:** `space-y-3` between sections
**Proposed:** `space-y-6` with subtle dividers

**Implementation Notes:**
- Increase vertical spacing
- Add Separator components between major sections
- Use Card components to group related content

---

#### 40. Consistent Button Hierarchy
Establish clear button importance levels:

```
Primary:   [Start Research]     - Filled, prominent color
Secondary: [Continue Research]  - Outlined border
Tertiary:  [Export] [Share]     - Ghost/subtle, no border
Danger:    [Delete]             - Red/destructive variant
```

**Implementation Notes:**
- Audit all Button usages
- Apply consistent variant prop
- Document in component guidelines

---

#### 41. Compact Status Indicators
**Current:** Full-width alert banners
**Proposed:** Subtle status pills in header

```
Current:  ┌─────────────────────────────────┐
          │ ⚠️ Rate limit: 45s remaining    │
          └─────────────────────────────────┘

Proposed: Connected ● │ Rate Limit: 45s ⏱️
```

**Implementation Notes:**
- Create StatusPill component
- Position in header right side
- Use tooltips for details

---

## Updated Summary Table

| # | Feature | Effort | Impact | Priority | Category |
|---|---------|--------|--------|----------|----------|
| 1 | Focus Modes | Medium | High | P1 | Feature |
| 2 | Smart Suggestions | Medium | High | P1 | Feature |
| 3 | Visual Research Map | High | High | P2 | Feature |
| 4 | Multiple Export Formats | Low | High | P1 | Feature |
| 5 | Knowledge Base | Medium | High | P1 | Feature |
| 6 | Recursive Deep Dive | Medium | Medium | P2 | Feature |
| 7 | Time-based Filtering | Low | Medium | P2 | Feature |
| 8 | Domain Allow/Block | Medium | Medium | P2 | Feature |
| 9 | Search Engine Selection | Medium | Medium | P3 | Feature |
| 10 | Readability Scoring | Low | Medium | P2 | Feature |
| 11 | Keyboard Shortcuts | Low | Medium | P1 | UX |
| 12 | Progress Indicator | Low | Medium | P1 | UX |
| 13 | Copy Buttons | Low | Medium | P1 | UX |
| 14 | Discover/Trending | Medium | Low | P3 | Feature |
| 15 | Session Naming | Low | Medium | P1 | UX |
| 16 | Research Templates | Low | Medium | P2 | Feature |
| 17 | Time Estimate | Low | Low | P3 | UX |
| 18 | Quick Settings | Low | Medium | P2 | UX |
| 19 | Remove Debug Button | Low | High | P0 | Bug |
| 20 | Remove Duplicate Toolbar | Low | High | P0 | Bug |
| 21 | Mask API Key | Low | High | P0 | Security |
| 22 | Landing Page Images | Low | Medium | P1 | UI |
| 23 | Reorganize FinalReport | High | High | P1 | UI |
| 24 | Progressive Settings | Medium | Medium | P1 | UX |
| 25 | Prominent Article Type | Low | High | P1 | UX |
| 26 | Empty States | Low | Medium | P1 | UX |
| 27 | Consistent Expandables | Low | Low | P2 | UI |
| 28 | Mobile Toolbar | Medium | Medium | P2 | UX |
| 29 | Color + Icon Indicators | Low | Medium | P2 | A11y |
| 30 | Command Palette | Medium | Medium | P2 | UX |
| 31 | Split-Pane Editor | High | Medium | P3 | UI |
| 32 | Progress Stepper | Low | Medium | P1 | UX |
| 33 | Shortcut Hints | Low | Low | P2 | UX |
| 34 | Loading Skeletons | Low | Medium | P2 | UI |
| 35 | Toast Positioning | Low | Low | P2 | UI |
| 36 | Sticky Headers | Low | Low | P3 | UI |
| 37 | Drag-and-Drop Sources | Medium | Low | P3 | UX |
| 38 | Confirmation Dialogs | Low | Medium | P2 | UX |
| 39 | Reduce Visual Density | Low | Medium | P2 | UI |
| 40 | Button Hierarchy | Low | Medium | P2 | UI |
| 41 | Compact Status | Low | Low | P3 | UI |

---

## Updated Implementation Roadmap

### Phase 0 - Critical Fixes (Immediate)
- Remove debug button (#19)
- Remove duplicate toolbar (#20)
- Mask API key input (#21)

### Phase 1 - Quick Wins (1-2 weeks)
- Keyboard shortcuts (#11)
- Copy to clipboard buttons (#13)
- Progress indicator (#12)
- Session naming (#15)
- Multiple export formats (#4)
- Empty states (#26)
- Progress stepper (#32)
- Prominent article type (#25)

### Phase 2 - Core Features (2-4 weeks)
- Focus modes (#1)
- Research templates (#16)
- Knowledge base with tags (#5)
- Readability scoring (#10)
- Quick settings toggle (#18)
- Progressive settings disclosure (#24)
- Confirmation dialogs (#38)

### Phase 3 - UI Overhaul (4-8 weeks)
- Reorganize FinalReport layout (#23)
- Smart query suggestions (#2)
- Visual research mapping (#3)
- Recursive deep dive mode (#6)
- Domain allow/block lists (#8)
- Command palette (#30)
- Mobile toolbar improvements (#28)

### Phase 4 - Polish & Integrations (ongoing)
- Search engine selection (#9)
- Discover/trending topics (#14)
- Split-pane editor (#31)
- Drag-and-drop sources (#37)
- Loading skeletons (#34)
- Visual design refinements (#39, #40, #41)

---

*Document generated: November 2025*
*Last updated: November 25, 2025*
