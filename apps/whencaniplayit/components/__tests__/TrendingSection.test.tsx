import { render, screen, waitFor } from '@testing-library/react';
import { TrendingSection } from '../TrendingSection';
import type { TrendingGame } from '@/lib/opencritic';

jest.mock('../EmblaCarouselTrending', () => ({
  EmblaCarouselTrending: ({ games }: { games: TrendingGame[] }) => (
    <div data-testid="embla-carousel-trending">
      {games.map((game) => (
        <div key={game.id}>{game.name}</div>
      ))}
    </div>
  ),
}));

const mockGames: TrendingGame[] = [
  {
    id: 1,
    name: 'Game One',
    images: { box: { og: 'https://example.com/game1.jpg' } },
    platforms: [{ id: 6, name: 'PC' }],
    releaseDate: '2026-02-06',
    topCriticScore: 82,
    numReviews: 35,
    percentRecommended: 85,
  },
  {
    id: 2,
    name: 'Game Two',
    images: { box: { og: 'https://example.com/game2.jpg' } },
    platforms: [{ id: 167, name: 'PlayStation 5' }],
    releaseDate: '2026-02-05',
    topCriticScore: 78,
    numReviews: 22,
    percentRecommended: 75,
  },
];

describe('TrendingSection', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('fetches and renders trending games', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ games: mockGames }), { status: 200 })
    );

    render(<TrendingSection />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/opencritic/recently-released', {
        cache: 'no-store',
      });
      expect(screen.getAllByText('Game One').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Game Two').length).toBeGreaterThan(0);
      expect(screen.getByTestId('embla-carousel-trending')).toBeInTheDocument();
    });
  });

  it('shows empty state when the fetch fails', async () => {
    fetchMock.mockRejectedValue(new Error('API Error'));

    render(<TrendingSection />);

    await waitFor(() => {
      expect(screen.getByText('Trending')).toBeInTheDocument();
      expect(screen.getByText('No games available')).toBeInTheDocument();
    });
  });

  it('renders a wrapper that can shrink inside the layout', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ games: [] }), { status: 200 }));

    render(<TrendingSection />);

    await waitFor(() => {
      expect(screen.getByTestId('trending-carousel-wrapper')).toBeInTheDocument();
    });

    const wrapper = screen.getByTestId('trending-carousel-wrapper');
    expect(wrapper).toHaveClass('max-w-full', 'min-w-0');
  });
});
