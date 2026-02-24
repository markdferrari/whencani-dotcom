import type { BGGBoardGame } from "@/lib/bgg";

export function mapBGGDetailsToSearchResults(details: BGGBoardGame[]) {
  return details.map((g) => ({
    id: g.id,
    title: g.name,
    imageUrl: g.thumbnail ?? g.image ?? null,
    releaseDate: g.yearPublished ? String(g.yearPublished) : null,
    href: `/board-game/${g.id}`,
  }));
}
