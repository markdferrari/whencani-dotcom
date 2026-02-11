# Environment Variables Guide

Comprehensive guide for managing environment variables across local development and production deployment with SST.

## 🎯 Overview

This project uses two different approaches for environment variables:

1. **Local Development** - `.env.local` files (gitignored)
2. **Production (SST)** - SST Secrets stored in AWS SSM Parameter Store

## 📁 File Structure

```
apps/
├── whencaniplayit/
│   ├── .env.example        # Template with all required variables
│   └── .env.local          # Your local values (create this, gitignored)
└── whencaniwatchit/
    ├── .env.example        # Template with all required variables
    └── .env.local          # Your local values (create this, gitignored)
```

## 🚀 Quick Start

### 1. Local Development Setup

**For whencaniplayit app:**

```bash
cd apps/whencaniplayit

# Copy the example file
cp .env.example .env.local

# Edit with your actual values
nano .env.local  # or use your preferred editor
```

**For whencaniwatchit app:**

```bash
cd apps/whencaniwatchit

# Copy the example file
cp .env.example .env.local

# Edit with your actual values
nano .env.local
```

### 2. Production Setup (One-Time)

SST stores secrets in AWS SSM Parameter Store. Set them once, and they're available for all deployments.

**For whencaniplayit app:**

```bash
cd apps/whencaniplayit

# Set each secret (use 'yarn sst' since SST is installed locally)
yarn sst secret set IgdbClientId "your-actual-igdb-client-id"
yarn sst secret set IgdbClientSecret "your-actual-igdb-client-secret"
yarn sst secret set RapidApiKey "your-actual-rapidapi-key"

# Generate and set revalidation secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output, then:
yarn sst secret set RevalidateSecret "paste-generated-secret-here"
```

**For whencaniwatchit app:**

```bash
cd apps/whencaniwatchit

# Set the secret (use 'yarn sst' since SST is installed locally)
yarn sst secret set TmdbApiKey "your-actual-tmdb-api-key"
```

### 3. Verify Secrets (Optional)

```bash
cd apps/whencaniplayit  # or apps/whencaniwatchit

# List all secrets for current stage
yarn sst secret list

# Remove a secret if needed
yarn sst secret remove SecretName
```

## 🔄 Deployment Workflow

### Old Way (Tedious) ❌
```bash
export IGDB_CLIENT_ID=xyz123
export IGDB_CLIENT_SECRET=abc456
export RAPID_API_KEY=def789
yarn sst deploy
```

### New Way (Easy) ✅
```bash
cd apps/whencaniplayit  # or apps/whencaniwatchit

# Just deploy - secrets are already in AWS
yarn sst deploy
```

## 📝 Required Variables

### whencaniplayit

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `IGDB_CLIENT_ID` | IGDB API Client ID | [IGDB API](https://api.igdb.com/) |
| `IGDB_CLIENT_SECRET` | IGDB API Client Secret | [IGDB API](https://api.igdb.com/) |
| `RAPID_API_KEY` | RapidAPI Key for OpenCritic | [RapidAPI](https://rapidapi.com/) |
| `REVALIDATE_SECRET` | Secret for cache revalidation API | Generate with crypto |

### whencaniwatchit

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `TMDB_API_KEY` | The Movie Database API Key | [TMDB Settings](https://www.themoviedb.org/settings/api) |

## 🔒 GitHub Actions Secrets

For the cache refresh workflow to work, add this secret to GitHub:

1. Go to repository **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add:
   - **Name:** `REVALIDATE_SECRET`
   - **Value:** Same value you set with `sst secret set RevalidateSecret`

## 🏗️ How It Works

### Local Development

1. Next.js automatically loads `.env.local` files
2. Variables are available via `process.env.VARIABLE_NAME`
3. Hot reload works when you change `.env.local`

### Production (SST)

1. Secrets are stored in AWS SSM Parameter Store per stage
2. SST injects them as environment variables during deployment
3. Lambda functions receive them at runtime
4. No need to set them again for future deployments

### SST Stages

SST supports multiple stages (dev, staging, production):

```bash
cd apps/whencaniplayit  # or apps/whencaniwatchit

# Deploy to production stage (default)
yarn sst deploy --stage production

# Deploy to dev stage
yarn sst deploy --stage dev

# Set secrets per stage
yarn sst secret set MySecret "value" --stage production
yarn sst secret set MySecret "different-value" --stage dev
```

## 🛠️ Common Tasks

### Update a Production Secret

```bash
cd apps/whencaniplayit
yarn sst secret set IgdbClientId "new-value"
yarn sst deploy  # Redeploy to pick up new value
```

### Copy Secrets from One Stage to Another

```bash
cd apps/whencaniplayit  # or apps/whencaniwatchit

# Get value from production
PROD_VALUE=$(yarn sst secret get MySecret --stage production)

# Set in dev stage
yarn sst secret set MySecret "$PROD_VALUE" --stage dev
```

### Local Development with Different Values

Your `.env.local` can have different values than production:

```bash
# .env.local (for testing)
IGDB_CLIENT_ID=test-client-id
IGDB_CLIENT_SECRET=test-secret
RAPID_API_KEY=test-api-key
REVALIDATE_SECRET=dev-secret-for-testing
```

### Rotate Secrets

```bash
cd apps/whencaniplayit  # or apps/whencaniwatchit

# Generate new secret
NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Update in SST
yarn sst secret set RevalidateSecret "$NEW_SECRET"

# Update in GitHub Actions
# Go to repo Settings → Secrets → Update REVALIDATE_SECRET

# Redeploy
yarn sst deploy
```

## ⚠️ Security Best Practices

### ✅ DO

- ✅ Keep `.env.local` files gitignored (already configured)
- ✅ Use different secrets for dev and production
- ✅ Rotate secrets periodically
- ✅ Use `yarn sst secret` for all sensitive production values
- ✅ Share `.env.example` files in git (no actual secrets)
- ✅ Use strong, random strings for secrets

### ❌ DON'T

- ❌ Commit `.env.local` files to git
- ❌ Share secrets in Slack/email (use 1Password or similar)
- ❌ Use the same secrets across all environments
- ❌ Hardcode secrets in `sst.config.ts`
- ❌ Export secrets in your shell profile (.zshrc, .bashrc)

## 🐛 Troubleshooting

### "Secret not found" error during deployment

```bash
cd apps/whencaniplayit  # or apps/whencaniwatchit

# Make sure you've set all required secrets
yarn sst secret list

# Set any missing ones
yarn sst secret set MissingSecret "value"
```

### Local development can't find .env.local

```bash
# Make sure you're in the app directory
cd apps/whencaniplayit

# Create from example
cp .env.example .env.local

# Edit with your values
nano .env.local

# Restart dev server
yarn dev
```

### Secrets not updating in production

```bash
cd apps/whencaniplayit  # or apps/whencaniwatchit

# After changing a secret, you must redeploy
yarn sst secret set MySecret "new-value"
yarn sst deploy  # This is required!
```

### Different secret values per stage

```bash
cd apps/whencaniplayit  # or apps/whencaniwatchit

# Specify stage when setting
yarn sst secret set MySecret "prod-value" --stage production
yarn sst secret set MySecret "dev-value" --stage dev

# Verify
yarn sst secret list --stage production
yarn sst secret list --stage dev
```

## 📚 Additional Resources

- [SST Secrets Documentation](https://sst.dev/docs/component/secret)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [AWS SSM Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)

## 🎓 Migration Guide

If you have existing deployments with exported environment variables:

1. **Set secrets in SST** (do this first):
   ```bash
   cd apps/whencaniplayit  # or apps/whencaniwatchit
   yarn sst secret set IgdbClientId "your-value"
   # ... set all other secrets
   ```

2. **Deploy with new config**:
   ```bash
   yarn sst deploy
   # No need to export variables anymore!
   ```

3. **Clean up your shell profile**:
   Remove any `export IGDB_CLIENT_ID=...` lines from `.zshrc` or `.bashrc`

4. **Update any CI/CD scripts**:
   Remove variable exports from deployment scripts
