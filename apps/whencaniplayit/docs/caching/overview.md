# Cache Strategy Overview

Complete overview of all caching mechanisms implemented in When Can I Play It.

## 🎯 Goals

- **Primary:** Stay under 200 OpenCritic API calls per day
- **Secondary:** Minimize IGDB API usage
- **Tertiary:** Optimize user experience with fast response times

## 📊 Current Implementation

### Multi-Layer Caching Strategy

```
User Request
    ↓
1. CloudFront CDN (Edge Cache) - 24-48 hours
    ↓
2. Next.js Fetch Cache - 48 hours (games), 7 days (lists)
    ↓
3. In-Memory Cache - 48 hours (games), 24 hours (lists)
    ↓
4. API Call (OpenCritic/IGDB)
```

## 🔍 Cache Breakdown by Data Source

### OpenCritic API

**Endpoints:**
- Game details: [lib/opencritic.ts:245](../../lib/opencritic.ts#L245)
- Reviewed this week: [lib/opencritic.ts:339](../../lib/opencritic.ts#L339)
- Recently released: [lib/opencritic.ts:386](../../lib/opencritic.ts#L386)

**Cache Durations:**

| Data Type | In-Memory | Next.js Fetch | CloudFront CDN | Total Protection |
|-----------|-----------|---------------|----------------|------------------|
| Game details | 48 hours | 48 hours | 48 hours max | ~98% reduction |
| Reviewed this week | 24 hours | 7 days | 24 hours | ~95% reduction |
| Recently released | 24 hours | 7 days | 24 hours | ~95% reduction |

**Cache Tags (for selective invalidation):**
- `opencritic` - All OpenCritic data
- `opencritic-games` - All game caches
- `opencritic-game-{id}` - Specific game
- `opencritic-reviewed-this-week` - Weekly review list
- `opencritic-recently-released` - Recent releases list

**Rate Limiting:**
- 4 requests per second max
- Exponential backoff on failures
- Respects `Retry-After` headers

### IGDB API

**Endpoints:** [lib/igdb.ts](../../lib/igdb.ts)

**Cache Durations:**

| Data Type | In-Memory | Next.js Fetch | CloudFront CDN |
|-----------|-----------|---------------|----------------|
| Game search | 6 hours | - | - |
| Game details | - | 48 hours | 24 hours |
| Similar games | - | 1 hour | 24 hours |
| Upcoming PS games | - | 48 hours | 24 hours |
| Recently released | - | 48 hours | 24 hours |

**Special Features:**
- Promise-based deduplication (prevents concurrent duplicate requests)
- OAuth token caching with safety margin

### Images

**Configuration:** [next.config.ts](../../next.config.ts)

**Cache Settings:**
- Next.js Image Optimizer: 24 hours minimum TTL
- Image Proxy API: [app/api/image/route.ts](../../app/api/image/route.ts)
  - Cache-Control: `public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400`
  - CloudFront CDN: 7 days maximum
  - Allowed hosts: IGDB, OpenCritic CDN

## 📈 Expected Performance

### API Call Reduction

| Metric | Before Optimization | After Optimization | Improvement |
|--------|--------------------|--------------------|-------------|
| Popular game (100 views/day) | 100 calls | 1-2 calls | 98%+ |
| 50 unique games/day | ~1,200 calls | ~50 calls | 96% |
| With CloudFront | ~1,200 calls | ~10-20 calls | 98%+ |

### Real-World Scenarios

**Scenario 1: High Traffic Day**
- 1,000 page views
- 100 unique games viewed
- Expected API calls: **~20-30** (well under 200 limit)

**Scenario 2: New Game Release**
- Popular new game gets 500 views in first hour
- Without cache: 500 API calls
- With cache: **1-2 API calls** (first request caches, CloudFront serves rest)

## 🔧 CloudFront Configuration

**File:** [sst.config.ts](../../sst.config.ts)

### OpenCritic Routes (`/api/opencritic/*`)
```typescript
{
  minTtl: 3600,      // 1 hour minimum
  defaultTtl: 86400, // 24 hours default
  maxTtl: 172800,    // 48 hours maximum
}
```

### IGDB Routes (`/api/igdb/*`)
```typescript
{
  minTtl: 3600,      // 1 hour minimum
  defaultTtl: 86400, // 24 hours default
  maxTtl: 86400,     // 24 hours maximum
}
```

### Image Proxy (`/api/image`)
```typescript
{
  minTtl: 86400,     // 24 hours minimum
  defaultTtl: 86400, // 24 hours default
  maxTtl: 604800,    // 7 days maximum
}
```

## 🛠️ Manual Cache Control

See [Revalidation API Documentation](./revalidation-api.md) for details on manually invalidating caches.

**Quick example:**
```bash
# Refresh a specific game
curl -X POST https://whencaniplayit.com/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: $REVALIDATE_SECRET" \
  -d '{"tag": "opencritic-game-7619"}'
```

## 📊 Monitoring Recommendations

### Track API Usage

Add instrumentation to monitor OpenCritic API calls:

```typescript
// Example: Track daily calls
let dailyCallCount = 0;
let lastReset = Date.now();

function trackApiCall() {
  if (Date.now() - lastReset > 86400000) {
    console.log(`Daily OpenCritic calls: ${dailyCallCount}`);
    dailyCallCount = 0;
    lastReset = Date.now();
  }
  dailyCallCount++;
}
```

### Key Metrics to Watch

1. **OpenCritic API calls per day** - Should stay under 200
2. **CloudFront cache hit ratio** - Aim for >90%
3. **Lambda cold start frequency** - Affects in-memory cache
4. **Average response times** - Should improve with caching

## 🚨 Troubleshooting

### Problem: Stale Data

**Solution:** Use revalidation API to manually refresh
```bash
curl -X POST https://whencaniplayit.com/api/revalidate \
  -H "x-revalidate-secret: $SECRET" \
  -d '{"tag": "opencritic-game-{id}"}'
```

### Problem: Hitting 200 API Call Limit

**Check:**
1. CloudFront cache hit ratio (should be >90%)
2. Are revalidation tags being overused?
3. Is there a spike in unique game requests?

**Solutions:**
1. Increase cache durations for less critical data
2. Pre-populate cache for popular games (see below)
3. Implement request coalescing for concurrent requests (already done)

### Pre-populate Cache for Popular Games

Create a cron job to warm the cache during off-peak hours:

```typescript
// app/api/cron/warm-cache/route.ts
export async function GET() {
  const popularGameIds = [7619, 8456, 9123]; // Top games

  for (const gameId of popularGameIds) {
    await getGameData(gameId);
    await new Promise(r => setTimeout(r, 250)); // Rate limit friendly
  }

  return Response.json({ warmed: popularGameIds.length });
}
```

## 🔐 Best Practices

1. **Never cache errors** - Failures should not be cached (already implemented)
2. **Use hierarchical tags** - Allows granular invalidation
3. **Monitor API usage** - Set up alerts before hitting limits
4. **Test cache invalidation** - Ensure revalidation works in production
5. **Document cache TTLs** - Keep this doc updated when changing durations

## 📝 Future Improvements

### Potential Optimizations

1. **Persistent Cache Layer** (DynamoDB/Redis)
   - Survives Lambda cold starts
   - Shared across all instances
   - Could reduce calls by another 30-50%

2. **Stale-While-Revalidate at Application Level**
   - Serve stale data while refreshing in background
   - Better UX with faster responses

3. **Predictive Pre-caching**
   - Cache related games when viewing one game
   - Pre-fetch "Reviewed This Week" on Thursdays

4. **Cache Analytics Dashboard**
   - Real-time view of cache hit ratios
   - API usage trends
   - Cost optimization insights

## 📚 Related Documentation

- [Revalidation API](./revalidation-api.md) - Manual cache control
- [Next.js Caching Guide](https://nextjs.org/docs/app/building-your-application/caching)
- [CloudFront Caching](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html)
