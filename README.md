# WhenCani.com Monorepo

A unified monorepo for managing multiple "When Can I..." tracking applications.

## Applications

- **whencaniwatchit** - Track movie and TV show releases
- **whencaniplayit** - Track video game releases

## Structure

```
whencani-dotcom/
├── apps/               # Application packages
│   ├── whencaniwatchit/
│   └── whencaniplayit/
├── packages/           # Shared packages
│   ├── ui/            # Shared UI components and hooks
│   └── config/        # Shared configurations
└── package.json       # Workspace root
```

## Getting Started

### Prerequisites

- Node.js 20+ 
- Yarn 1.22+

### Installation

```bash
yarn install
```

### Development

```bash
# Run whencaniwatchit locally
yarn dev:watch

# Run whencaniplayit locally  
yarn dev:play
```

### Building

```bash
# Build all apps
yarn build

# Build specific app
yarn build:watch
yarn build:play
```

### Testing

```bash
# Run all tests
yarn test
```

## Package Management

### Adding Dependencies

```bash
# Add to specific app
yarn workspace whencaniwatchit add <package>
yarn workspace whencaniplayit add <package>

# Add to shared UI
yarn workspace @whencani/ui add <package>

# Add to root (dev tools)
yarn add -W <package>
```

## Shared Packages

### @whencani/ui

Shared UI components, hooks, and utilities used across applications.

```typescript
import { cn, useMediaQuery } from '@whencani/ui';
```

### @whencani/config

Shared configuration files for TypeScript, ESLint, and Tailwind CSS.

## Documentation

- [Migration Guide](./MIGRATION.md) - Detailed migration plan and phases
- [Next.js Docs](https://nextjs.org/docs)
- [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/)

## Contributing

When adding new features:

1. Consider if code should be shared before creating app-specific implementations
2. Use the shared UI package for reusable components
3. Follow the component style from whencaniwatchit.com
4. Update documentation when adding shared packages

## License

Private - Not for redistribution

