# Cache Revalidation API

Manual cache invalidation endpoint for When Can I Play It.

## Setup

1. **Add environment variable:**
   ```bash
   # .env.local or production environment
   REVALIDATE_SECRET=your-secure-random-string
   ```

2. **Generate a secure secret:**
   ```bash
   # Generate a random secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## Usage

### API Documentation

Visit `GET https://whencaniplayit.com/api/revalidate` to see available tags and examples.

### Revalidate Single Tag

```bash
curl -X POST https://whencaniplayit.com/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: your-secret-here" \
  -d '{"tag": "opencritic-game-123"}'
```

### Revalidate Multiple Tags

```bash
curl -X POST https://whencaniplayit.com/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: your-secret-here" \
  -d '{"tags": ["opencritic-reviewed-this-week", "opencritic-recently-released"]}'
```

## Available Cache Tags

### OpenCritic

| Tag | Scope | Use Case |
|-----|-------|----------|
| `opencritic` | All OpenCritic data | Nuclear option - clears everything |
| `opencritic-games` | All game caches | Clears all game details and lists |
| `opencritic-game-{id}` | Specific game | Refresh single game (e.g., `opencritic-game-7619`) |
| `opencritic-reviewed-this-week` | Weekly review list | Refresh the weekly reviews carousel |
| `opencritic-recently-released` | Recent releases list | Refresh the recent releases section |

## Common Scenarios

### 1. Game just got reviewed on OpenCritic
A newly reviewed game won't show accurate scores until cache expires (48 hours).

**Solution:** Revalidate that specific game
```bash
# Replace 7619 with the actual OpenCritic game ID
curl -X POST https://whencaniplayit.com/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: $REVALIDATE_SECRET" \
  -d '{"tag": "opencritic-game-7619"}'
```

### 2. New games added to "Reviewed This Week"
The weekly reviews list updates every Thursday but cache lasts 7 days.

**Solution:** Revalidate the weekly list
```bash
curl -X POST https://whencaniplayit.com/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: $REVALIDATE_SECRET" \
  -d '{"tag": "opencritic-reviewed-this-week"}'
```

### 3. Major update - refresh everything
Something's wrong and you need to clear all OpenCritic caches.

**Solution:** Use the top-level tag
```bash
curl -X POST https://whencaniplayit.com/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: $REVALIDATE_SECRET" \
  -d '{"tag": "opencritic"}'
```

**⚠️ Warning:** This will cause fresh API calls for all cached OpenCritic data. Use sparingly.

### 4. Automated Thursday refresh

**✅ Already configured!** A GitHub Actions workflow runs automatically every Thursday at 12pm UTC.

**Workflow file:** [.github/workflows/cache-refresh.yml](../../../../.github/workflows/cache-refresh.yml)

**Setup required:**
1. Go to repository Settings → Secrets and variables → Actions
2. Add a new repository secret:
   - Name: `REVALIDATE_SECRET`
   - Value: Your revalidation secret (same as in production environment)

**Manual trigger:**
You can also manually trigger the cache refresh from GitHub Actions:
1. Go to Actions tab → Weekly Cache Refresh workflow
2. Click "Run workflow"

The workflow automatically refreshes both `opencritic-reviewed-this-week` and `opencritic-recently-released` caches.

## Response Format

### Success
```json
{
  "revalidated": true,
  "tags": ["opencritic-game-123"],
  "timestamp": "2026-02-11T10:30:00.000Z"
}
```

### Error (Invalid Secret)
```json
{
  "error": "Invalid secret"
}
```

### Error (Missing Tags)
```json
{
  "error": "No valid tags provided. Use \"tag\" for single tag or \"tags\" for array."
}
```

## Testing Locally

```bash
# Start your dev server
yarn dev

# In another terminal, revalidate
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: dev-secret" \
  -d '{"tag": "opencritic-game-123"}'
```

## Security Notes

- ✅ Secret is validated on every request
- ✅ Only POST requests can trigger revalidation
- ✅ GET requests return documentation only
- ⚠️ Keep your `REVALIDATE_SECRET` private
- ⚠️ Don't commit secrets to git
- ⚠️ Use environment variables in production

## Monitoring

After revalidation, the next request for that data will:
1. Miss the cache (as intended)
2. Make a fresh API call to OpenCritic
3. Re-cache the fresh data for 48 hours

Monitor your OpenCritic usage after revalidations to ensure you stay under the 200 calls/day limit.

## Related Documentation

- [Cache Strategy Overview](./overview.md) - Complete caching implementation details
- [API Route Implementation](../../app/api/revalidate/route.ts) - Revalidation endpoint source code
