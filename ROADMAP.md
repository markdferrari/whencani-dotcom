# Roadmap

## Foundation — User accounts

- DynamoDB as data store
- Google auth sign-in
- Enables: persistent watchlist, notifications, ratings

---

## Tier 1 — Core experience

### Search

- Full-text search across TMDB / IGDB (both APIs support it)
- Autocomplete/typeahead in the header
- Recent searches (localStorage)

### Release calendar

- Month-grid view showing upcoming releases
- Filter by genre/platform
- Tap a date to see that day's releases
- Shared component across both apps

### Watchlist improvements

- Raise or remove the 20-item cap (move to localStorage or account storage)
- Sort/filter by release date, alphabetical, date added
- Release-date grouping — "This week", "This month", "Later"
- "Released!" badge when a watchlisted item has come out
- Export/share watchlist as a link or image

---

## Tier 2 — Engagement loop

### Notifications / release reminders

- Browser push notifications via Web Push API (no account needed)
- "Remind me" button on detail pages — 1 day / 1 week before release
- Weekly digest email for watchlisted items releasing soon (requires account)

### Countdown timers

- "Releases in X days" prominently on detail pages

### Share buttons

- Native Web Share API on detail pages (especially useful on mobile)

### Recently viewed

- Quick-access section showing recently visited pages (localStorage)

---

## Tier 3 — Discovery

### Personalised recommendations

- "Because you watchlisted X" → similar titles from TMDB/IGDB
- Genre affinity — if most watchlist items share a genre, promote that genre
- "Fans also watched/played" using popularity signals

### Franchise / collection views

- See all entries in a series (IGDB `collection`, TMDB `belongs_to_collection`)

### Trending (games)

- Add a trending section to WhenCanIPlayIt (movies already has one)

### "Just released" highlights

- Banner or section for items that came out today/this week

### Cross-app discovery

- "This movie is based on a game" / "A game adaptation is coming"
- Link between WhenCanIWatchIt and WhenCanIPlayIt where relevant

### Curated collections

- Themed lists: "Cozy games", "Award season movies", "Game Pass additions"

### "Surprise me"

- Random pick button for indecisive users

---

## Tier 4 — Detail page enhancements

### WhenCanIPlayIt

- Price tracking — current price on Steam/Epic (via IsThereAnyDeal API or similar)
- DLC / editions — show different editions and their contents
- "Where to buy" links (Steam/Epic/GOG links already exist; make more prominent)

### WhenCanIWatchIt

- Streaming availability — "Available on Netflix in 3 days" (surface TMDB watch provider data on detail pages)
- TV series support — next episode air dates, season tracking
- Box office / runtime info

---

## Tier 5 — Platform & social

### PWA (Progressive Web App)

- Installable on home screen
- Offline watchlist access

### Hype meter

- Anonymous vote on excitement level (DynamoDB, no account needed)

### User ratings

- Rate games/movies you've consumed (requires account)

### RSS feeds

- Per-genre or per-platform feeds of upcoming releases

---

## Quality of life / UX

- Infinite scroll or "load more" on browse pages
- Quick-preview modal — tap-and-hold on a card for summary without navigating away
- Compare view — side-by-side comparison of two games or movies
- Accessibility audit — screen reader support, keyboard navigation, contrast ratios

### Marketing

## Amazon Affiliate Program

Use their product api to link stuff on all sites
If you're looking at a game, I want to show related movies/books
Then the relevant product detail page should have a link to buy
Use dynamoDB as a store for related products - will need advice on the schema and how to hook it up to existing app, auth etc