# AGENTS.md

Instructions for AI coding agents working in this project. This is the cross-tool
entry point: Codex, OpenCode, Cursor, GitHub Copilot, Gemini CLI, and others read
`AGENTS.md`. Claude Code reads `CLAUDE.md`, which imports this file.

## What this is

`authify` - a hands-on AWS Cognito playground: a Next.js UI that drives the
Cognito API surface through a hand-rolled HTTP client (no AWS SDK). It is a
learning project, not a commercial product.

## Skills

Skills live in `.agents/skills/<skill>/SKILL.md` and are symlinked into
`.claude/skills/` for Claude Code. They come from
[mattpocock/skills](https://github.com/mattpocock/skills), pinned in
`skills-lock.json`.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues on `DleiaDev/authify` via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five default triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Coding standards

Follow `CODING_STANDARDS.md`. Use the domain vocabulary in `CONTEXT.md` and respect
the decisions in `docs/adr/`.

## Commands

- Dev server: `pnpm dev` (http://localhost:3000)
- Build: `pnpm build`
- Production server: `pnpm start`
- Lint: `pnpm lint`
- Test: `pnpm test` (Vitest, single run)
- Test (watch): `pnpm test:watch`

Package manager is `pnpm` (see `packageManager` in `package.json`).
