# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

10x Astro Starter - A modern, opinionated starter template for building fast, accessible, and AI-friendly web applications using Astro 5, React 19, TypeScript 5, and Tailwind CSS 4.

## Tech Stack

- **Astro** v5.13.7 - Modern web framework for building fast, content-focused websites (server-side rendered)
- **React** v19.1.1 - UI library for building interactive components
- **TypeScript** v5 - Type-safe JavaScript
- **Tailwind CSS** v4.1.13 - Utility-first CSS framework
- **Shadcn/ui** - Accessible UI component library (new-york style, neutral color, CSS variables)
- **Supabase** - Backend services (authentication, database) - optional integration

## Development Commands

```bash
# Start development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

## Project Structure

- `./src` - Source code
- `./src/layouts` - Astro layouts for page templates
- `./src/pages` - Astro pages (file-based routing)
- `./src/pages/api` - API endpoints (use `export const prerender = false`)
- `./src/middleware/index.ts` - Astro middleware for request/response modification
- `./src/db` - Supabase clients and database types (if using Supabase)
- `./src/types.ts` - Shared types for backend and frontend (Entities, DTOs)
- `./src/components` - Client-side components (Astro for static, React for dynamic)
- `./src/components/ui` - Shadcn/ui components
- `./src/components/hooks` - Custom React hooks
- `./src/lib` - Services and helper functions
- `./src/lib/services` - Business logic services
- `./src/assets` - Internal static assets
- `./public` - Public static assets

## Architecture Guidelines

### Astro Configuration

- **Output mode**: Server (SSR enabled)
- **Adapter**: Node.js standalone mode
- **Port**: 3000
- **Integrations**: React, Sitemap
- **TypeScript**: Strict mode with path alias `@/*` → `./src/*`

### Component Strategy

- Use **Astro components** (.astro) for static content and layouts
- Use **React components** (.tsx) only when interactivity is required (client-side functionality)
- Never use Next.js directives like "use client" - this is an Astro project

### API Routes

- Create API endpoints in `./src/pages/api`
- Use uppercase HTTP method names: `GET`, `POST`, `PUT`, `DELETE`
- Always include `export const prerender = false` for API routes
- Use Zod for input validation
- Extract business logic into services in `./src/lib/services`
- Access environment variables via `import.meta.env`

### Supabase Integration (if used)

- Access Supabase client via `context.locals.supabase` in Astro routes, not by direct import
- Use `SupabaseClient` type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`
- Database types should be in `./src/db/database.types.ts`
- Middleware provides Supabase client to context locals

### React Guidelines

- Use functional components with hooks (no class components)
- Extract reusable logic into custom hooks in `./src/components/hooks`
- Use `React.memo()` for expensive components with stable props
- Use `React.lazy()` and `Suspense` for code-splitting
- Use `useCallback` for event handlers passed to child components
- Use `useMemo` for expensive calculations
- Use `useId()` for accessibility IDs
- Consider `useOptimistic` for optimistic UI updates in forms
- Use `useTransition` for non-urgent state updates

### Styling with Tailwind

- Use `@layer` directive to organize styles (components, utilities, base)
- Use arbitrary values with square brackets for one-off designs: `w-[123px]`
- Implement dark mode with `dark:` variant
- Use responsive variants: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Use state variants: `hover:`, `focus-visible:`, `active:`, `disabled:`

### Shadcn/ui Components

- Components are located in `./src/components/ui`
- Import using path alias: `import { Button } from "@/components/ui/button"`
- To add new components: `npx shadcn@latest add [component-name]`
- Style variant: new-york, base color: neutral

### Code Quality Standards

- **Error handling**: Handle errors and edge cases at the beginning of functions
- **Early returns**: Use early returns for error conditions to avoid deep nesting
- **Guard clauses**: Validate preconditions and invalid states early
- **Happy path last**: Place the main logic at the end for readability
- **Avoid else**: Use if-return pattern instead of else statements
- **Error messages**: Implement proper error logging and user-friendly messages

### Accessibility

- Use semantic HTML elements first
- Apply ARIA landmarks for page regions (main, navigation, search)
- Use appropriate ARIA roles for custom interface elements
- Set `aria-expanded` and `aria-controls` for expandable content
- Use `aria-live` regions for dynamic content updates
- Apply `aria-label` or `aria-labelledby` for elements without visible labels
- Use `aria-describedby` for descriptive text associations
- Avoid redundant ARIA that duplicates native HTML semantics

## Environment Variables

Required environment variables (see `.env.example`):

- `SUPABASE_URL` - Supabase project URL (if using Supabase)
- `SUPABASE_KEY` - Supabase anonymous key (if using Supabase)
- `OPENROUTER_API_KEY` - OpenRouter API key (if using AI features)

## Git Workflow

- Pre-commit hooks are configured with Husky
- Lint-staged runs ESLint on staged `.ts`, `.tsx`, `.astro` files
- Prettier formats `.json`, `.css`, `.md` files on commit
- Main branch: `master`