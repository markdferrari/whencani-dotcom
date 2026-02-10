# 0002 – Establish Repository Guardrails

## Status
Accepted

## Context
After scaffolding the Next.js app, we still needed a lightweight set of conventions for anyone working in the repo (humans or AI). The unmodified template did not capture our decisions about economics (Yarn only), TypeScript safety (never use `any`), or platform-specific helpers.

## Decision
Add a curated `.gitignore` and a detailed `AGENTS.md` that encodes the guardrails. `AGENTS.md` spells out the package manager (yarn), the ban on `any` in TypeScript, the emphasis on mobile-first UI, and other project-specific requirements. The `.gitignore` ensures generated artifacts (like `node_modules` and `.sst`) stay out of version control while keeping the working tree clean.

## Consequences
- Everyone touching the repo receives the same explicit instructions before making changes.
- The AI assistance path is aligned with the real workflow (Yarn, no `any`, Magic UI preference, etc.), which limits misaligned edits.
- Future architectural documents can simply refer back to these guardrails when they affect decisions.
