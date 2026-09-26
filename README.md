# authify

A hands-on AWS Cognito playground: a Next.js UI that drives the Cognito API
surface through a hand-rolled HTTP client, with no AWS SDK or Amplify, so every
request, auth challenge, token, and signature is visible. It is a learning
project, not a commercial product.

It covers public flows (sign up, email confirmation, password and SRP sign-in,
password recovery, TOTP MFA, profile) and an Admin console, plus server-side JWT
verification, machine-to-machine access, and Identity Pool credentials for direct
browser-to-S3 upload. Work is tracked as GitHub issues grouped into milestones.

## Stack

- **Next.js 16** (App Router, React Server Components), React 19, TypeScript 5
- **Tailwind v4** and **shadcn/ui** (Base UI)
- **MongoDB** for the app-side User Companion Record and API Call Log
- **Hand-rolled Cognito client** for `cognito-idp`, `cognito-identity`, and the
  OAuth2 token endpoint, with its own `SECRET_HASH` helper and SigV4 signer
- **jose** for JWKS fetching and JWT claim verification
- **Terragrunt** for all AWS resources
- **Docker Compose** for local development (Next.js + MongoDB containers)
- **pnpm**

## Commands

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` (http://localhost:3000) |
| Build | `pnpm build` |
| Production server | `pnpm start` |
| Lint | `pnpm lint` |

No test runner is configured yet.

## Deployment

The eventual target is AWS ECS, but there is no production deployment or CI/CD
yet; it is deliberately deferred.

## Working in this repo

- `CONTEXT.md` - domain glossary
- `docs/adr/` - architectural decisions
- `CODING_STANDARDS.md` - code conventions
- `AGENTS.md` - instructions for AI coding agents (`CLAUDE.md` imports it)
