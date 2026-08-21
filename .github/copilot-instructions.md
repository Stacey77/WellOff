# Copilot Instructions for WellOff

WellOff is an AI-powered real estate intelligence platform built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**. The AI inference backend uses **Kimi / Moonshot AI** models via an OpenAI-compatible API.

## Stack & conventions

- **Framework**: Next.js 14 App Router – all pages live under `src/app/`, components under `src/components/`, shared types in `src/types/index.ts`, and utilities/providers in `src/lib/`.
- **Language**: TypeScript strict mode. Always provide types; avoid `any`.
- **Styling**: Tailwind CSS utility classes. Custom tokens (e.g. `accent-cyan`, `gradient-text-cyan`, `custom-scrollbar`) are defined in `globals.css` / `tailwind.config.js`.
- **Animations**: Framer Motion (`motion`, `AnimatePresence`). Keep animations subtle and consistent with the existing dark-UI aesthetic.
- **Icons**: `lucide-react`. Import only the icons you actually use.
- **AI backend**: `src/lib/providers/kimi.ts` exposes `kimiChat()`. The REST endpoint is `src/app/api/kimi/route.ts`. API keys (`MOONSHOT_API_KEY` / `OPENAI_API_KEY`) must **never** be exposed to the client – keep all AI calls server-side.

## Development commands

```bash
npm install          # install dependencies
npm run dev          # start dev server at http://localhost:3000
npm run build        # production build
npm run lint         # ESLint via next lint
```

## Code style

- Use `'use client'` only when a component genuinely needs browser APIs or React state/effects.
- Prefer **named exports** for components; use a default export only for page files (`page.tsx`, `layout.tsx`).
- Keep component files focused. Split large components into smaller pieces in the same directory.
- Follow the existing file-naming pattern: `PascalCase` for components, `camelCase` for utilities.
- Do not introduce new dependencies without a clear justification. Prefer the libraries already in `package.json`.

## Agent system

The platform has a set of AI agents (ARIA, TON, TERRA, DEVX, CAPITA, NOVA) defined in `src/components/agents/AgentBot.tsx`. When adding features that involve agents, re-use the existing agent definitions and color system rather than creating new ones.

## Environment variables

See `.env.example` for the full list. Required for AI features:
- `MOONSHOT_API_KEY` or `OPENAI_API_KEY`
- `KIMI_MODEL` (default: `kimi-k2`)
- `KIMI_BASE_URL` (default: `https://api.moonshot.cn/v1`)

## Testing

There is no test suite at this time. Validate changes by running `npm run build` and `npm run lint` before opening a PR.
