# Monorepo Migration Guide

## Overview

This document outlines the strategy for migrating two standalone Next.js applications (`whencaniwatchit.com` and `whencaniplayit.com`) into a unified monorepo structure. The goal is to maximize code reuse, maintain consistency, and streamline development workflows.

## Current State

### whencaniwatchit.com
- **Framework**: Next.js 16.1.6 with React 19
- **Styling**: Tailwind CSS v4
- **Key Dependencies**: embla-carousel-react, leaflet, react-leaflet, lucide-react
- **Deployment**: SST (AWS CDK)
- **Features**: Movie/TV show release tracker with cinema finder

### whencaniplayit.com
- **Framework**: Next.js 16.1.6 with React 19
- **Styling**: Tailwind CSS v4
- **Key Dependencies**: Radix UI components, embla-carousel-react, gray-matter, lucide-react
- **Deployment**: SST (AWS CDK)
- **Testing**: Jest with Testing Library
- **Features**: Video game release tracker

## Target Monorepo Structure

```
whencani-dotcom/
├── apps/
│   ├── whencaniwatchit/         # Movie/TV tracker app
│   │   ├── app/
│   │   ├── components/           # App-specific components
│   │   ├── lib/                  # App-specific utilities
│   │   ├── public/
│   │   ├── package.json
│   │   └── sst.config.ts
│   │
│   └── whencaniplayit/           # Video game tracker app
│       ├── app/
│       ├── components/           # App-specific components
│       ├── lib/                  # App-specific utilities
│       ├── public/
│       ├── package.json
│       └── sst.config.ts
│
├── packages/
│   ├── ui/                       # Shared UI components
│   │   ├── src/
│   │   │   ├── components/       # Reusable components
│   │   │   ├── hooks/            # Shared React hooks
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── config/                   # Shared configurations
│       ├── eslint/
│       ├── tailwind/
│       ├── typescript/
│       └── package.json
│
├── package.json                  # Root workspace configuration
├── yarn.lock                     # Unified lock file
├── tsconfig.json                 # Base TypeScript config
├── .gitignore
└── README.md

## Migration Phases

### Phase 1: Setup Monorepo Foundation ✓
- [x] Initialize monorepo with yarn workspaces
- [x] Create directory structure (apps/ and packages/)
- [x] Setup root package.json with workspace configuration
- [x] Create shared configuration package

### Phase 2: Create Shared UI Package
- [ ] Extract common components from both apps
- [ ] Setup packages/ui with proper exports
- [ ] Configure TypeScript for package development
- [ ] Document component API and usage

#### Common Components to Extract
Based on both apps, the following components should be shared:
- Carousel/Slider components (both use embla-carousel)
- Icon system (both use lucide-react)
- Layout primitives (containers, grids)
- Loading/error states
- Typography components
- Button variants (whencaniwatchit style preferred)

### Phase 3: Migrate whencaniwatchit.com
- [ ] Move app to `apps/whencaniwatchit/`
- [ ] Update imports to use shared packages
- [ ] Replace local components with shared UI package
- [ ] Update package.json dependencies
- [ ] Verify build and deployment
- [ ] Update SST configuration for monorepo context

### Phase 4: Migrate whencaniplayit.com
- [ ] Move app to `apps/whencaniplayit/`
- [ ] Update imports to use shared packages
- [ ] Replace local components with shared UI package
- [ ] Update package.json dependencies
- [ ] Migrate Jest configuration to monorepo
- [ ] Verify build, tests, and deployment
- [ ] Update SST configuration for monorepo context

### Phase 5: Consolidate Configuration
- [ ] Setup shared ESLint configuration
- [ ] Setup shared Tailwind configuration
- [ ] Setup shared TypeScript configuration
- [ ] Add root-level scripts for building/testing all apps
- [ ] Document development workflows

### Phase 6: Optimize and Document
- [ ] Add Turbo or similar for build caching (optional)
- [ ] Setup GitHub Actions for CI/CD
- [ ] Create comprehensive README
- [ ] Document shared component guidelines
- [ ] Setup changesets for versioning (if publishing packages)

## Key Decisions

### Package Manager
**Choice**: Yarn Workspaces
**Rationale**: Both apps currently use either yarn.lock or package-lock.json. Yarn workspaces provide good monorepo support without additional tools.

### Component Library Style
**Choice**: whencaniwatchit.com visual style as base
**Rationale**: As specified in requirements, this app's component style will be the preferred approach.

### Shared vs. App-Specific
**Shared**:
- Basic UI components (buttons, cards, typography)
- Layout components (containers, grids)
- Hooks (useMediaQuery, useDebounce, etc.)
- Utility functions (cn, date formatting)
- Tailwind configuration
- ESLint/TypeScript configs

**App-Specific**:
- Feature components (movie cards vs. game cards)
- API integration code
- Domain-specific utilities
- SST infrastructure definitions
- App routing and pages

## Development Workflow

### Installing Dependencies
```bash
# Root level - installs all workspaces
yarn install

# Specific app
yarn workspace whencaniwatchit add <package>
yarn workspace whencaniplayit add <package>

# Shared package
yarn workspace @whencani/ui add <package>
```

### Running Apps
```bash
# From root
yarn workspace whencaniwatchit dev
yarn workspace whencaniplayit dev

# Or with scripts in root package.json
yarn dev:watch
yarn dev:play
```

### Building
```bash
# Build all
yarn build

# Build specific app
yarn workspace whencaniwatchit build
```

### Testing
```bash
# Run all tests
yarn test

# App-specific
yarn workspace whencaniplayit test
```

## Risk Mitigation

### Dependency Conflicts
- Use yarn's resolutions field if version conflicts arise
- Keep React and Next.js versions aligned across all packages
- Test thoroughly after dependency updates

### Import Path Changes
- Use TypeScript path aliases consistently
- Update imports incrementally, one module at a time
- Use global search/replace carefully

### Build Performance
- Consider lazy loading for shared packages
- Monitor bundle sizes before/after migration
- Use dynamic imports where appropriate

### Deployment
- Test SST deployments in staging environment first
- Ensure each app can still deploy independently
- Verify environment variables are properly scoped

## Rollback Plan

If critical issues arise:
1. Each app maintains its own package.json and can be extracted
2. Git history preserves the pre-migration state
3. Each app's SST config remains independent
4. Apps can temporarily operate outside the monorepo if needed

## Success Criteria

- ✅ Both apps build and deploy successfully
- ✅ No regression in functionality or performance
- ✅ Shared components are used in at least 3 places
- ✅ Development workflow is documented and understood
- ✅ All existing tests pass
- ✅ Build times are comparable or improved
- ✅ Team can develop features efficiently in the new structure

## Next Steps

1. Review and approve this migration plan
2. Begin Phase 1: Setup monorepo foundation
3. Create shared UI package structure
4. Extract first shared component as proof of concept
5. Iterate and refine based on learnings

## References

- [Yarn Workspaces Documentation](https://classic.yarnpkg.com/en/docs/workspaces/)
- [Next.js Monorepo Example](https://github.com/vercel/next.js/tree/canary/examples/with-yarn-workspaces)
- [SST Monorepo Guide](https://sst.dev/docs/)
