# 0001 – Adopt Next.js App Router Scaffold

## Status
Accepted

## Context
We needed to move quickly from idea to working UI, so we started with [`create-next-app`](https://nextjs.org/docs/app/building-your-application/getting-started) to get the App Router, TypeScript, linting, and a working layout for free. The initial files included `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `tsconfig.json`, `next.config.ts`, and the default `package.json`/`yarn.lock` that wired in the required scripts.

## Decision
Keep the generated Next.js structure and build on top of it rather than replacing it with a bespoke framework. We kept the App Router entrypoints (`app/layout.tsx`, `app/page.tsx`), the base Global CSS, the Vercel-oriented `next.config.ts`, and the default ESLint/TypeScript configs so that we could focus effort on the product rather than the plumbing.

## Consequences
- Enabled immediate server/client boundaries, routing, and static optimization without extra wiring.
- Set the standard tooling (TypeScript, ESLint, PostCSS, Yarn) that every subsequent commit has built upon.
- Left us with a lightweight starting point to expand the homepage, movie detail page, and eventually the Find Showtimes experience.
