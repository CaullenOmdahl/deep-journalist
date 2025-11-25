# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev           # Start Next.js dev server with Turbopack
npm run build         # Production build
npm run build:docker  # Build with standalone mode for Docker
npm run build:export  # Export as static site
npm run start         # Start production server
npm run lint          # Run ESLint
```

**Requirements:** Node 18.18.0+, npm 9.8.0+

## Architecture Overview

**Deep Journalist** is an AI-powered journalistic research tool built with Next.js 15 (App Router), React 19, and TypeScript. It uses Google Gemini models via Vercel's AI SDK to generate researched articles following SPJ (Society of Professional Journalists) ethics.

### Core Data Flow

```
User Input (Topic.tsx) → useDeepResearch hook → AI Provider (createProvider)
→ Streaming text via ai SDK → Parse JSON responses → Update Zustand stores → Render FinalReport
```

### Key Directories

- `src/app/api/` - API routes (Edge runtime for performance)
- `src/components/Research/` - Journalistic research UI components
- `src/components/ui/` - shadcn/ui base components
- `src/utils/` - Business logic (research prompts, bias detection, metrics, rate limiting)
- `src/hooks/` - React hooks (`useDeepResearch.ts` is the main research hook)
- `src/store/` - Zustand stores with persistence (global, task, setting, history)
- `src/locales/` - i18n translations (en-US, zh-CN)

### State Management

Zustand stores with localStorage persistence:
- `global.ts` - UI state (settings modal, history, landing page)
- `task.ts` - Research task state
- `setting.ts` - User preferences
- `history.ts` - Research history

### API Architecture

- Edge runtime (`export const runtime = 'edge'`) for API routes
- Middleware handles CORS, password authentication (`x-access-password` header), API key injection
- Proxy pattern for Google AI API at `/api/ai/google/[...slug]`

### Key Utilities

- `deep-research.ts` - System prompts, output guidelines, Zod schemas for AI responses
- `journalistic-metrics.ts` - Bias detection, source credibility, claim verification
- `bias-detection.ts` - Biased language detection, neutrality scoring
- `connection-manager.ts` - Connection status monitoring, retry logic
- `rate-limiter.ts` - Rate limit tracking per model, cooldown management
- `api-key-manager.ts` - Multiple API key rotation (comma-separated keys supported)

## Technology Stack

- **Framework:** Next.js 15.2.4 with Turbopack, React 19, TypeScript 5.7.3
- **AI:** @ai-sdk/google (Gemini models), Vercel AI SDK
- **UI:** shadcn/ui (Radix primitives), Tailwind CSS, lucide-react icons, Milkdown editor
- **State:** Zustand with persistence middleware
- **Validation:** Zod schemas (also used for AI structured output)
- **i18n:** i18next with language detection

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key(s), comma-separated for rotation |
| `API_PROXY_BASE_URL` | Custom API proxy (defaults to Google API) |
| `ACCESS_PASSWORD` | Server-side API protection |
| `NEXT_PUBLIC_BUILD_MODE` | Build output mode: `standalone` or `export` |

## Development Practices

From `.cursor/rules/main.mdc`:

**Memory Management:**
- Before starting work: load relevant context, check for previous state, review documentation
- During work: save important discoveries, maintain progress tracking
- After completing: update documentation, record decisions

**Implementation Flow:**
1. Research existing codebase patterns first
2. Check for reusable code
3. Implement following established conventions
4. Test thoroughly

## Path Aliases

TypeScript path alias: `@/*` maps to `./src/*`

## Notes

- React Compiler is enabled (experimental)
- Type checking disabled during build (`ignoreBuildErrors: true` in next.config.js)
- Images optimization disabled (`unoptimized: true`)
- Toast notifications via sonner
- Error handling uses `parseError` utility for standardized messages
