import { render, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { WatchlistSection } from '../WatchlistSection';

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// Mock Next.js Image and Link used by child cards
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // Remove Next.js-specific props that are non-string boolean attributes in tests
    const { priority, unoptimized, ...rest } = props;
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...rest} />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: any; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock the two watchlist hooks
jest.mock('@/hooks/use-watchlist', () => ({
  useWatchlistGames: jest.fn(() => ({ games: [], isLoading: false })),
}));

jest.mock('@/hooks/use-board-game-watchlist', () => ({
  broadcastWatchlistUpdate: jest.fn(),
  useBoardGameWatchlistIds: jest.fn(() => []),
  useBoardGameWatchlistActions: jest.fn(() => jest.fn()),
  useBoardGameWatchlistGames: jest.fn(() => ({
    games: [
      { id: 101, name: 'Catan', thumbnail: 'https://example.com/catan.jpg', yearPublished: 1995 },
    ],
    isLoading: false,
  })),
}));

describe('WatchlistSection (board games)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NEXT_PUBLIC_FEATURE_BOARD_GAMES: 'true' };
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('type=board'));
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetAllMocks();
  });

  it('renders board games when type=board', () => {
    render(<WatchlistSection />);

    expect(screen.getByText('Catan')).toBeInTheDocument();
    const textNode = screen.getByText('Catan');
    const link = textNode.closest('a');
    expect(link).toHaveAttribute('href', '/board-game/101');
  });
});