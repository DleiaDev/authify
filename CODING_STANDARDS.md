# Coding Standards

Stack: Next.js 16 (App Router, React Server Components), React 19, TypeScript 5
strict, Tailwind v4 (CSS-first), shadcn/ui on Base UI, MongoDB, pnpm. Domain
terms come from `CONTEXT.md`; architectural decisions live in `docs/adr/`.

## TypeScript

- Strict mode enabled
- No `any` types - use proper typing or `unknown`
- Define interfaces for all props, API responses, and data models
- Use type inference where obvious, explicit types where helpful

## React

- Functional components only (no class components)
- Use hooks for state and side effects
- Keep components focused - one job per component
- Extract reusable logic into custom hooks

## Next.js

- Server components by default
- Only use `'use client'` when needed (interactivity, hooks, browser APIs)
- Use Server Actions for form submissions and simple mutations
- Use API routes when you need:
  - Webhooks
  - File uploads with progress tracking
  - Long-running operations
  - Specific HTTP status codes or headers
  - Endpoints for future mobile/CLI clients
  - Third-party integrations
- Otherwise, fetch data directly in server components
- Dynamic routes for item/collection pages

## File Organization

No `src/` directory; app code lives at the repo root. Path alias `@/*` maps to
`./*` (see `tsconfig.json`).

- Components: `components/[feature]/ComponentName.tsx`
- shadcn/ui primitives: `components/ui/`
- Pages: `app/[route]/page.tsx`
- Server Actions: `actions/[feature].ts`
- Types: `types/[feature].ts`
- Tests: next to the source file (`feature.test.ts`)
- Lib/Utils: `lib/[utility].ts`

## Naming

- Components: PascalCase (`ItemCard.tsx`)
- Files: Match component name or kebab-case
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)

## Styling

- Tailwind CSS for all styling
- Tailwind v4: CSS-first config (`@theme` in `app/globals.css`), no
  `tailwind.config.js`; PostCSS via `@tailwindcss/postcss`
- shadcn/ui components (style `base-nova`, built on `@base-ui/react`, `lucide-react`
  icons); add with the `shadcn` CLI, primitives land in `components/ui/`
- `cn` helper in `lib/utils.ts` for conditional classes
- No inline styles
- Dark mode first, light mode as option

## Database

- MongoDB. Cognito is the system of record for Users; MongoDB holds only the
  User Companion Record and the API Call Log (ADR 0004)
- Query User Companion Records by `sub`, never by email, except the pre-auth
  Auth Strategy lookup (ADR 0005)

## Data Fetching

- Server components fetch data directly; client components use Server Actions
- Validate all external input at the boundary
- Scope every User-owned query by the `sub` from the verified Session on the
  server; never trust a client-supplied user id

## Error Handling

- Use try/catch in Server Actions
- Return `{ success, data, error }` pattern from actions
- Display user-friendly error messages via toast

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- Prefer self-documenting names and small functions over explanatory comments.
- Keep doc comments minimal: a one-line purpose on an exported type or function is
  plenty; don't write JSDoc that just repeats the signature.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.
