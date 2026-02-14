import { render, screen } from '@testing-library/react';
import type React from 'react';
import { GameCard } from '../GameCard';
import type { IGDBGame } from '@/lib/igdb';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (
    props: React.ImgHTMLAttributes<HTMLImageElement> & { src: string },
  ) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    const { src, alt, ...rest } = props;
    return <img src={src} alt={alt} {...rest} />;
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock window.innerWidth for responsive testing
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024, // Default to desktop width for tests
});

describe('GameCard', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_FEATURE_AMAZON_AFFILIATES;
  });

  const mockGame: IGDBGame = {
    id: 12345,
    name: 'Test Game',
    cover: {
      url: '//images.igdb.com/igdb/image/upload/t_thumb/test.jpg',
    },
    release_dates: [
      {
        human: 'Feb 04, 2026',
        date: 1770163200,
        platform: { id: 167, name: 'PlayStation 5' },
      },
    ],
  };

  it('should render game title', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });

  it('should render release date', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText('Feb 04, 2026')).toBeInTheDocument();
  });

  it('should render platform names', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText('PlayStation 5')).toBeInTheDocument();
  });

  it('should link to game detail page', () => {
    render(<GameCard game={mockGame} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/game/12345');
  });

  it('should render cover image with correct src (desktop)', () => {
    render(<GameCard game={mockGame} />);
    const img = screen.getByAltText('Test Game');
    // In test environment with desktop width, t_cover_big is used
    expect(img).toHaveAttribute(
      'src',
      '/api/image?url=https%3A%2F%2Fimages.igdb.com%2Figdb%2Fimage%2Fupload%2Ft_cover_big%2Ftest.jpg',
    );
  });

  it('should display TBA when no release date is available', () => {
    const gameWithoutDate: IGDBGame = {
      id: 12345,
      name: 'Test Game',
    };
    
    render(<GameCard game={gameWithoutDate} />);
    expect(screen.getByText('TBA')).toBeInTheDocument();
  });

  it('should handle multiple platforms', () => {
    const gameWithMultiplePlatforms: IGDBGame = {
      ...mockGame,
      release_dates: [
        {
          human: 'Feb 04, 2026',
          date: 1770163200,
          platform: { id: 167, name: 'PlayStation 5' },
        },
        {
          human: 'Feb 04, 2026',
          date: 1770163200,
          platform: { id: 6, name: 'PC' },
        },
      ],
    };

    render(<GameCard game={gameWithMultiplePlatforms} />);
    expect(screen.getByText('PlayStation 5, PC')).toBeInTheDocument();
  });

  it('should render Buy now link with ASIN when showAffiliateLink is true', () => {
    process.env.NEXT_PUBLIC_FEATURE_AMAZON_AFFILIATES = 'true';
    const gameWithAsin: IGDBGame = {
      ...mockGame,
      external_games: [{ category: 20, uid: 'B0FR45L4H6' }],
    };

    render(<GameCard game={gameWithAsin} showAffiliateLink />);
    const buyLink = screen.getByText('Buy now');
    expect(buyLink).toBeInTheDocument();
    expect(buyLink.closest('a')).toHaveAttribute(
      'href',
      'https://www.amazon.co.uk/dp/B0FR45L4H6?tag=whencaniplayg-21&linkCode=ll2&ref_=as_li_ss_tl',
    );
  });

  it('should render Buy now with search fallback when no ASIN', () => {
    process.env.NEXT_PUBLIC_FEATURE_AMAZON_AFFILIATES = 'true';
    render(<GameCard game={mockGame} showAffiliateLink />);
    const buyLink = screen.getByText('Buy now');
    expect(buyLink.closest('a')).toHaveAttribute(
      'href',
      expect.stringContaining('amazon.co.uk/s?k=Test%20Game'),
    );
  });

  it('should not render Buy now when showAffiliateLink is false', () => {
    process.env.NEXT_PUBLIC_FEATURE_AMAZON_AFFILIATES = 'true';
    render(<GameCard game={mockGame} />);
    expect(screen.queryByText('Buy now')).not.toBeInTheDocument();
  });
});
